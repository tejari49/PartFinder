import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';

const formatMessageTime = (timestamp) => {
  const date = timestamp?.toDate?.();

  if (!date) {
    return 'Jetzt';
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

export default function ChatPanel({
  chat,
  currentUser,
  onToast,
  profilesByUid,
}) {
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

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
        setMessages(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })),
        );
        setLoading(false);
      },
      (error) => {
        console.error(error);
        onToast('Chat-Nachrichten konnten nicht geladen werden.', 'error');
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [chat?.id, onToast]);

  const otherUid = chat?.participantIds?.find((uid) => uid !== currentUser.uid);

  const otherParticipant = useMemo(() => {
    return profilesByUid[otherUid] || null;
  }, [otherUid, profilesByUid]);

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!chat?.id) {
      return;
    }

    const trimmed = messageText.trim();

    if (!trimmed) {
      return;
    }

    setSending(true);

    try {
      await addDoc(collection(db, 'chats', chat.id, 'messages'), {
        text: trimmed,
        senderUid: currentUser.uid,
        senderName:
          profilesByUid[currentUser.uid]?.displayName ||
          currentUser.displayName ||
          currentUser.email ||
          'Unbekannt',
        createdAt: serverTimestamp(),
      });

      await setDoc(
        doc(db, 'chats', chat.id),
        {
          lastMessage: trimmed,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

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
      <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-center text-slate-300">
        Wähle einen Chat aus oder starte einen neuen Kontakt aus einem Inserat.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">In-App Chat</p>
        <h3 className="mt-2 text-xl font-bold text-white">
          {otherParticipant?.displayName || chat.participantNames?.[otherUid] || 'Kontakt'}
        </h3>
        <p className="mt-1 text-sm text-slate-300">
          Bezug: <span className="font-medium text-white">{chat.partTitle || 'Inserat'}</span>
        </p>
      </div>

      <div className="max-h-[24rem] min-h-[24rem] space-y-3 overflow-y-auto px-5 py-4">
        {loading ? (
          <p className="text-sm text-slate-300">Nachrichten werden geladen…</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-slate-300">Noch keine Nachrichten. Starte die Unterhaltung.</p>
        ) : (
          messages.map((message) => {
            const own = message.senderUid === currentUser.uid;

            return (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  own
                    ? 'ml-auto bg-cyan-400 text-slate-950'
                    : 'border border-white/10 bg-slate-950/60 text-white'
                }`}
              >
                <p className="text-sm font-semibold">{own ? 'Du' : message.senderName || 'Kontakt'}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                <p className={`mt-2 text-xs ${own ? 'text-slate-800' : 'text-slate-400'}`}>
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="border-t border-white/10 px-5 py-4">
        <div className="flex gap-3">
          <textarea
            rows="2"
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Nachricht schreiben …"
            className="min-h-[3.25rem] flex-1 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-2xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? 'Sende…' : 'Senden'}
          </button>
        </div>
      </form>
    </div>
  );
}
