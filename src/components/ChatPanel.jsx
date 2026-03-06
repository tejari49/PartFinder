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
import { formatShortDateTime, getFallbackDisplayName } from '../utils/format';

export default function ChatPanel({ chat, currentUser, onToast, profilesByUid }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const bottomRef = useRef(null);

  const otherUid = useMemo(
    () => chat?.participantIds?.find((uid) => uid !== currentUser?.uid) || '',
    [chat?.participantIds, currentUser?.uid],
  );
  const otherParticipant = otherUid ? profilesByUid[otherUid] : null;

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

  if (!chat) {
    return (
      <div className="rounded-[2rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-8 text-center text-[var(--pf-muted)]">
        Wähle einen Chat aus oder starte einen neuen Kontakt aus einem Inserat.
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
          <p className="text-sm text-[var(--pf-muted)]">Nachrichten werden geladen…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-[var(--pf-muted)]">Noch keine Nachrichten. Starte die Unterhaltung.</p>
        ) : (
          messages.map((message) => {
            const own = message.senderUid === currentUser.uid;

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
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.text}</p>
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
            placeholder="Nachricht schreiben …"
            className="pf-textarea min-h-[3.25rem] flex-1 px-4 py-3"
          />
          <button
            type="submit"
            disabled={sending}
            className="pf-button-primary px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'Sende…' : 'Senden'}
          </button>
        </div>
      </form>
    </div>
  );
}
