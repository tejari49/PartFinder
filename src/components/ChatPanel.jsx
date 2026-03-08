import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import Avatar from './Avatar';
import { currencyFormatter, formatShortDateTime, getFallbackDisplayName } from '../utils/format';

export default function ChatPanel({ chat, currentUser, onToast, profilesByUid }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [offerAmount, setOfferAmount] = useState('');
  const [processingOfferId, setProcessingOfferId] = useState('');
  const bottomRef = useRef(null);

  const otherUid = useMemo(
    () => chat?.participantIds?.find((uid) => uid !== currentUser?.uid) || '',
    [chat?.participantIds, currentUser?.uid],
  );
  const otherParticipant = otherUid ? profilesByUid[otherUid] : null;
  const canSendOffer = !!chat?.id && chat?.buyerUid === currentUser?.uid;

  useEffect(() => {
    if (!chat?.id) {
      setMessages([]);
      return undefined;
    }

    setLoading(true);

    const messagesQuery = query(
      collection(db, 'chats', chat.id, 'messages'),
      orderBy('createdAt', 'asc'),
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const nextMessages = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setMessages(nextMessages);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        onToast('Nachrichten konnten nicht geladen werden.', 'error');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [chat?.id, onToast]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!chat?.id || !currentUser?.uid) {
      return undefined;
    }

    if (!Array.isArray(chat.unreadBy) || !chat.unreadBy.includes(currentUser.uid)) {
      return undefined;
    }

    updateDoc(doc(db, 'chats', chat.id), {
      unreadBy: chat.unreadBy.filter((uid) => uid !== currentUser.uid),
      [`lastReadAtByUid.${currentUser.uid}`]: serverTimestamp(),
    }).catch((error) => {
      console.error(error);
    });

    return undefined;
  }, [chat?.id, chat?.unreadBy, currentUser?.uid]);

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!chat?.id || !currentUser?.uid) {
      return;
    }

    const text = messageText.trim();

    if (!text) {
      onToast('Bitte zuerst eine Nachricht eingeben.', 'error');
      return;
    }

    setSending(true);

    try {
      const senderName =
        profilesByUid[currentUser.uid]?.displayName ||
        chat.participantNames?.[currentUser.uid] ||
        getFallbackDisplayName(currentUser);

      await addDoc(collection(db, 'chats', chat.id, 'messages'), {
        text,
        type: 'text',
        senderUid: currentUser.uid,
        senderName,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: text,
        lastMessageSenderUid: currentUser.uid,
        updatedAt: serverTimestamp(),
        unreadBy: otherUid ? [otherUid] : [],
        [`participantNames.${currentUser.uid}`]: senderName,
        [`lastReadAtByUid.${currentUser.uid}`]: serverTimestamp(),
      });

      setMessageText('');
    } catch (error) {
      console.error(error);
      onToast('Nachricht konnte nicht gesendet werden.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSendOffer = async () => {
    if (!chat?.id || !currentUser?.uid || !canSendOffer) {
      return;
    }

    const amount = Number(offerAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      onToast('Bitte einen gueltigen Angebotsbetrag eingeben.', 'error');
      return;
    }

    setSending(true);
    try {
      const senderName =
        profilesByUid[currentUser.uid]?.displayName ||
        chat.participantNames?.[currentUser.uid] ||
        getFallbackDisplayName(currentUser);
      const roundedAmount = Math.round(amount * 100) / 100;
      const offerText = `Angebot: ${currencyFormatter.format(roundedAmount)}`;

      await addDoc(collection(db, 'chats', chat.id, 'messages'), {
        text: offerText,
        type: 'offer',
        offerAmount: roundedAmount,
        offerByUid: currentUser.uid,
        offerStatus: 'pending',
        senderUid: currentUser.uid,
        senderName,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: offerText,
        lastMessageSenderUid: currentUser.uid,
        updatedAt: serverTimestamp(),
        unreadBy: otherUid ? [otherUid] : [],
        [`participantNames.${currentUser.uid}`]: senderName,
      });

      setOfferAmount('');
      onToast('Angebot gesendet.', 'success');
    } catch (error) {
      console.error(error);
      onToast('Angebot konnte nicht gesendet werden.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleOfferDecision = async (message, nextStatus) => {
    if (!chat?.id || !currentUser?.uid || !message?.id) {
      return;
    }

    setProcessingOfferId(message.id);
    try {
      await updateDoc(doc(db, 'chats', chat.id, 'messages', message.id), {
        offerStatus: nextStatus,
        respondedAt: serverTimestamp(),
        respondedByUid: currentUser.uid,
      });

      const statusText = nextStatus === 'accepted' ? 'Angebot angenommen' : 'Angebot abgelehnt';

      await updateDoc(doc(db, 'chats', chat.id), {
        lastMessage: `${statusText}: ${currencyFormatter.format(Number(message.offerAmount || 0))}`,
        lastMessageSenderUid: currentUser.uid,
        updatedAt: serverTimestamp(),
        unreadBy: message.offerByUid ? [message.offerByUid] : [],
      });

      if (nextStatus === 'accepted' && currentUser.uid === chat.sellerUid && chat.partId) {
        await updateDoc(doc(db, 'parts', chat.partId), {
          status: 'reserved',
          reservedForUid: message.offerByUid || '',
          reservedAt: serverTimestamp(),
          soldAt: null,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error(error);
      onToast('Angebot konnte nicht aktualisiert werden.', 'error');
    } finally {
      setProcessingOfferId('');
    }
  };

  if (!chat) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-8 text-center text-[var(--pf-muted)]">
        Waehle einen Chat aus oder starte einen neuen Kontakt aus einem Inserat.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] pf-card">
      <div className="border-b pf-divider px-5 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={otherParticipant?.displayName || chat.participantNames?.[otherUid] || 'Kontakt'}
            src={otherParticipant?.avatarBase64 || ''}
            size="md"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--pf-primary)]">In-App Chat</p>
            <h3 className="mt-1 text-xl font-bold text-[var(--pf-text)]">
              {otherParticipant?.displayName || chat.participantNames?.[otherUid] || 'Kontakt'}
            </h3>
            <p className="mt-1 text-sm text-[var(--pf-muted)]">
              Bezug: <span className="font-medium text-[var(--pf-text)]">{chat.partTitle || 'Inserat'}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="pf-scroll max-h-[24rem] min-h-[24rem] space-y-3 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="text-sm text-[var(--pf-muted)]">Nachrichten werden geladen...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[var(--pf-muted)]">Noch keine Nachrichten. Starte die Unterhaltung.</p>
        ) : (
          messages.map((message) => {
            const own = message.senderUid === currentUser.uid;
            const isOffer = message.type === 'offer';
            const offerPending = isOffer && message.offerStatus === 'pending';
            const canDecideOffer = offerPending && currentUser.uid !== message.offerByUid;

            return (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  own
                    ? 'ml-auto bg-[var(--pf-primary)] text-[#04111a]'
                    : 'border border-[color:var(--pf-border)] bg-[var(--pf-surface-3)] text-[var(--pf-text)]'
                }`}
              >
                <p className="text-sm font-semibold">{own ? 'Du' : message.senderName || 'Kontakt'}</p>
                {isOffer ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm leading-6">
                      Angebot: <span className="font-black">{currencyFormatter.format(Number(message.offerAmount || 0))}</span>
                    </p>
                    <p className={`text-xs ${own ? 'text-[#0f172a]' : 'text-[var(--pf-muted)]'}`}>
                      Status: {message.offerStatus || 'pending'}
                    </p>
                    {canDecideOffer ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={processingOfferId === message.id}
                          onClick={() => handleOfferDecision(message, 'accepted')}
                          className="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 disabled:opacity-60"
                        >
                          Annehmen
                        </button>
                        <button
                          type="button"
                          disabled={processingOfferId === message.id}
                          onClick={() => handleOfferDecision(message, 'declined')}
                          className="rounded-lg bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-300 disabled:opacity-60"
                        >
                          Ablehnen
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                )}
                <p className={`mt-2 text-xs ${own ? 'text-[#0f172a]' : 'text-[var(--pf-muted)]'}`}>
                  {formatShortDateTime(message.createdAt)}
                </p>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t pf-divider px-5 py-4">
        <div className="flex gap-3">
          <textarea
            rows="2"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Nachricht schreiben ..."
            className="pf-textarea min-h-[3.25rem] flex-1 px-4 py-3"
          />
          <button
            type="submit"
            disabled={sending}
            className="pf-button-primary px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'Sende...' : 'Senden'}
          </button>
        </div>

        {canSendOffer ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-3">
            <input
              type="number"
              min="1"
              step="0.01"
              value={offerAmount}
              onChange={(event) => setOfferAmount(event.target.value)}
              placeholder="Angebot in EUR"
              className="pf-input max-w-[11rem] px-3 py-2"
            />
            <button
              type="button"
              onClick={handleSendOffer}
              disabled={sending}
              className="pf-button-secondary px-4 py-2 text-sm disabled:opacity-60"
            >
              Angebot senden
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
