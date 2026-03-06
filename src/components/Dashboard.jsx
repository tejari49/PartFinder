import { useEffect, useMemo, useState } from 'react';
import ChatPanel from './ChatPanel';

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.();

  if (!date) {
    return 'Gerade eben';
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

export default function Dashboard({
  user,
  profile,
  chats,
  selectedChatId,
  onSelectChat,
  onSaveProfile,
  onChangePassword,
  onOpenMarketplace,
  onToast,
  profilesByUid,
}) {
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    whatsappNumber: '',
    chatEnabled: true,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setProfileForm({
      displayName: profile?.displayName || user.displayName || '',
      whatsappNumber: profile?.whatsappNumber || '',
      chatEnabled: profile?.chatEnabled !== false,
    });
  }, [profile, user.displayName]);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const aValue = a.updatedAt?.seconds || 0;
      const bValue = b.updatedAt?.seconds || 0;
      return bValue - aValue;
    });
  }, [chats]);

  const selectedChat = sortedChats.find((chat) => chat.id === selectedChatId) || sortedChats[0] || null;

  useEffect(() => {
    if (!selectedChatId && sortedChats[0]?.id) {
      onSelectChat(sortedChats[0].id);
    }
  }, [onSelectChat, selectedChatId, sortedChats]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      await onSaveProfile(profileForm);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword.length < 6) {
      onToast('Das neue Passwort muss mindestens 6 Zeichen lang sein.', 'error');
      return;
    }

    setSavingPassword(true);

    try {
      await onChangePassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (error) {
      console.error(error);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.16),_transparent_25%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Benutzer-Dashboard
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Profil & Kontakte
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Verwalte deinen Namen, deine WhatsApp-Nummer, die Chat-Freigabe und alle Kontaktanfragen zu deinen Inseraten.
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenMarketplace}
              className="rounded-2xl border border-white/10 bg-white px-4 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Zum Marktplatz
            </button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-white">Profil</h2>
                <p className="mt-1 text-sm text-slate-300">Diese Daten sehen andere registrierte Nutzer in der Kontaktansicht.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Anzeigename</span>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">WhatsApp-Nummer</span>
                  <input
                    type="tel"
                    value={profileForm.whatsappNumber}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))}
                    placeholder="z. B. +41791234567"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
                  />
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={profileForm.chatEnabled}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, chatEnabled: event.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-white/20"
                  />
                  <span>
                    <span className="block font-semibold text-white">In-App Chat aktivieren</span>
                    Käufer können dich direkt zu deinen Inseraten anschreiben.
                  </span>
                </label>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  Konto: <span className="font-semibold text-white">{user.email}</span>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? 'Speichert…' : 'Profil speichern'}
                </button>
              </form>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-white">Passwort ändern</h2>
                <p className="mt-1 text-sm text-slate-300">Aus Sicherheitsgründen wird dein aktuelles Passwort benötigt.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Aktuelles Passwort</span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-200">Neues Passwort</span>
                  <input
                    type="password"
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/60"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword ? 'Ändert…' : 'Passwort aktualisieren'}
                </button>
              </form>
            </section>
          </div>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">Chats</h2>
                  <p className="mt-1 text-sm text-slate-300">Direkte Kontakte zu Käufern und Verkäufern.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                  Offene Chats: <span className="font-semibold text-white">{sortedChats.length}</span>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-3">
                  {sortedChats.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-white/5 p-6 text-sm text-slate-300">
                      Noch keine Chats. Öffne ein Inserat und starte dort den Kontakt.
                    </div>
                  ) : (
                    sortedChats.map((chat, index) => {
                      const otherUid = chat.participantIds?.find((uid) => uid !== user.uid);
                      const otherProfile = profilesByUid[otherUid];
                      const isActive = selectedChat ? selectedChat.id === chat.id : index === 0;

                      return (
                        <button
                          key={chat.id}
                          type="button"
                          onClick={() => onSelectChat(chat.id)}
                          className={`w-full rounded-[1.75rem] border p-4 text-left transition ${
                            isActive
                              ? 'border-cyan-400/40 bg-cyan-400/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">
                            {otherProfile?.displayName || chat.participantNames?.[otherUid] || 'Kontakt'}
                          </p>
                          <p className="mt-1 truncate text-sm text-slate-300">{chat.partTitle || 'Inserat'}</p>
                          <p className="mt-2 truncate text-xs text-slate-400">{chat.lastMessage || 'Noch keine Nachricht'}</p>
                          <p className="mt-2 text-xs text-slate-500">{formatDate(chat.updatedAt)}</p>
                        </button>
                      );
                    })
                  )}
                </div>

                <ChatPanel
                  chat={selectedChat}
                  currentUser={user}
                  onToast={onToast}
                  profilesByUid={profilesByUid}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
