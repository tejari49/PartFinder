import { useEffect, useMemo, useRef, useState } from 'react';
import ChatPanel from './ChatPanel';
import Avatar from './Avatar';
import ThemeSwitcher from './ThemeSwitcher';
import { resizeImageToBase64 } from '../utils/image';
import { currencyFormatter, formatShortDateTime } from '../utils/format';

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
  myParts,
  onEditPart,
  onDeletePart,
  unreadChatsCount,
  theme,
  onThemeChange,
}) {
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    whatsappNumber: '',
    chatEnabled: true,
    avatarBase64: '',
    themePreference: 'amoled',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [processingAvatar, setProcessingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    setProfileForm({
      displayName: profile?.displayName || user.displayName || '',
      whatsappNumber: profile?.whatsappNumber || '',
      chatEnabled: profile?.chatEnabled !== false,
      avatarBase64: profile?.avatarBase64 || '',
      themePreference: profile?.themePreference || theme,
    });
  }, [profile, theme, user.displayName]);

  const sortedChats = useMemo(
    () =>
      [...chats].sort((a, b) => {
        const aValue = a.updatedAt?.seconds || 0;
        const bValue = b.updatedAt?.seconds || 0;
        return bValue - aValue;
      }),
    [chats],
  );

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
      onThemeChange(profileForm.themePreference);
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

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      onToast('Bitte ein gültiges Profilbild auswählen.', 'error');
      return;
    }

    setProcessingAvatar(true);

    try {
      const avatarBase64 = await resizeImageToBase64(file, {
        maxWidth: 320,
        maxHeight: 320,
        quality: 0.75,
      });
      setProfileForm((prev) => ({ ...prev, avatarBase64 }));
      onToast('Profilbild aktualisiert.', 'success');
    } catch (error) {
      console.error(error);
      onToast('Profilbild konnte nicht verarbeitet werden.', 'error');
    } finally {
      setProcessingAvatar(false);
    }
  };

  const clearAvatar = () => {
    setProfileForm((prev) => ({ ...prev, avatarBase64: '' }));
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
    }
  };

  return (
    <div className="pf-page">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[2rem] pf-glass p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="pf-hero-badge px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
                Benutzer-Dashboard
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--pf-text)] sm:text-4xl">
                Profil, Chats & Inserate
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pf-muted)] sm:text-base">
                Verwalte Namen, WhatsApp, Profilbild, Design, Passwort, Chats und deine eigenen Angebote zentral an einem Ort.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                Ungelesene Chats <span className="ml-2 font-bold text-[var(--pf-text)]">{unreadChatsCount}</span>
              </div>
              <button type="button" onClick={onOpenMarketplace} className="pf-button-secondary px-4 py-3">
                Zum Marktplatz
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="space-y-6">
            <section className="rounded-[2rem] pf-card p-5">
              <div className="mb-5 flex items-start gap-4">
                <Avatar name={profileForm.displayName || user.email} src={profileForm.avatarBase64} size="lg" />
                <div>
                  <h2 className="text-xl font-bold text-[var(--pf-text)]">Profil</h2>
                  <p className="mt-1 text-sm text-[var(--pf-muted)]">
                    Diese Daten sehen andere registrierte Nutzer in der Kontaktansicht.
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Anzeigename</span>
                  <input
                    type="text"
                    value={profileForm.displayName}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
                    className="pf-input px-4 py-3"
                    required
                  />
                </label>

                <div className="space-y-2">
                  <span className="block text-sm font-medium text-[var(--pf-text)]">Profilbild</span>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="w-full rounded-2xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-3)] px-4 py-3 text-sm text-[var(--pf-muted)] file:mr-4 file:rounded-xl file:border-0 file:bg-[var(--pf-primary)] file:px-4 file:py-2 file:font-semibold file:text-[#04111a]"
                  />
                  <div className="flex gap-3">
                    <button type="button" onClick={clearAvatar} className="pf-button-secondary px-4 py-2 text-sm">
                      Bild entfernen
                    </button>
                    {processingAvatar ? <span className="self-center text-sm text-[var(--pf-muted)]">Bild wird verarbeitet…</span> : null}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">WhatsApp-Nummer</span>
                  <input
                    type="tel"
                    value={profileForm.whatsappNumber}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))}
                    placeholder="z. B. +41791234567"
                    className="pf-input px-4 py-3"
                  />
                </label>

                <label className="flex items-start gap-3 rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                  <input
                    type="checkbox"
                    checked={profileForm.chatEnabled}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, chatEnabled: event.target.checked }))}
                    className="mt-1 h-4 w-4 rounded border-[color:var(--pf-border)]"
                  />
                  <span>
                    <span className="block font-semibold text-[var(--pf-text)]">In-App Chat aktivieren</span>
                    Käufer können dich direkt zu deinen Inseraten anschreiben.
                  </span>
                </label>

                <div className="space-y-3 rounded-[1.5rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--pf-text)]">Design</p>
                    <p className="mt-1 text-sm text-[var(--pf-muted)]">Das gespeicherte Theme wird für dein Konto übernommen.</p>
                  </div>
                  <ThemeSwitcher
                    value={profileForm.themePreference}
                    onChange={(value) => setProfileForm((prev) => ({ ...prev, themePreference: value }))}
                    compact
                  />
                </div>

                <div className="rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                  Konto: <span className="font-semibold text-[var(--pf-text)]">{user.email}</span>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile || processingAvatar}
                  className="pf-button-primary w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? 'Speichert…' : 'Profil speichern'}
                </button>
              </form>
            </section>

            <section className="rounded-[2rem] pf-card p-5">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-[var(--pf-text)]">Passwort ändern</h2>
                <p className="mt-1 text-sm text-[var(--pf-muted)]">Aus Sicherheitsgründen wird dein aktuelles Passwort benötigt.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Aktuelles Passwort</span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    className="pf-input px-4 py-3"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">Neues Passwort</span>
                  <input
                    type="password"
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    className="pf-input px-4 py-3"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="pf-button-secondary w-full px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword ? 'Ändert…' : 'Passwort aktualisieren'}
                </button>
              </form>
            </section>
          </div>

          <section className="space-y-6">
            <div className="rounded-[2rem] pf-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[var(--pf-text)]">Chats</h2>
                  <p className="mt-1 text-sm text-[var(--pf-muted)]">Direkte Kontakte zu Käufern und Verkäufern.</p>
                </div>
                <div className="rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                  Offene Chats: <span className="font-semibold text-[var(--pf-text)]">{sortedChats.length}</span>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="space-y-3">
                  {sortedChats.length === 0 ? (
                    <div className="rounded-[1.75rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-6 text-sm text-[var(--pf-muted)]">
                      Noch keine Chats. Öffne ein Inserat und starte dort den Kontakt.
                    </div>
                  ) : (
                    sortedChats.map((chat, index) => {
                      const otherUid = chat.participantIds?.find((uid) => uid !== user.uid);
                      const otherProfile = profilesByUid[otherUid];
                      const isActive = selectedChat ? selectedChat.id === chat.id : index === 0;
                      const isUnread = Array.isArray(chat.unreadBy) && chat.unreadBy.includes(user.uid);

                      return (
                        <button
                          key={chat.id}
                          type="button"
                          onClick={() => onSelectChat(chat.id)}
                          className={`w-full rounded-[1.75rem] border p-4 text-left transition ${
                            isActive ? 'pf-card-selected' : 'pf-card-muted hover:bg-[var(--pf-surface-3)]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar
                              name={otherProfile?.displayName || chat.participantNames?.[otherUid] || 'Kontakt'}
                              src={otherProfile?.avatarBase64 || ''}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-sm font-semibold text-[var(--pf-text)]">
                                  {otherProfile?.displayName || chat.participantNames?.[otherUid] || 'Kontakt'}
                                </p>
                                {isUnread ? <span className="pf-badge-danger px-2 py-0.5 text-[11px]">Neu</span> : null}
                              </div>
                              <p className="mt-1 truncate text-sm text-[var(--pf-muted)]">{chat.partTitle || 'Inserat'}</p>
                              <p className="mt-2 truncate text-xs text-[var(--pf-muted)]">{chat.lastMessage || 'Noch keine Nachricht'}</p>
                              <p className="mt-2 text-xs text-[var(--pf-muted)]">{formatShortDateTime(chat.updatedAt)}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <ChatPanel chat={selectedChat} currentUser={user} onToast={onToast} profilesByUid={profilesByUid} />
              </div>
            </div>

            <div className="rounded-[2rem] pf-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[var(--pf-text)]">Meine Inserate</h2>
                  <p className="mt-1 text-sm text-[var(--pf-muted)]">Eigene Teile bearbeiten oder löschen.</p>
                </div>
                <div className="rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                  Inserate: <span className="font-semibold text-[var(--pf-text)]">{myParts.length}</span>
                </div>
              </div>

              {myParts.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-6 text-sm text-[var(--pf-muted)]">
                  Du hast noch keine eigenen Inserate veröffentlicht.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {myParts.map((part) => (
                    <article key={part.id} className="overflow-hidden rounded-[1.75rem] pf-card-muted">
                      <img src={part.imageBase64} alt={part.title} className="h-40 w-full object-cover" />
                      <div className="p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">
                          {part.brand} • {part.model}
                        </p>
                        <h3 className="mt-2 text-lg font-bold text-[var(--pf-text)]">{part.title}</h3>
                        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                          <span className="pf-badge px-3 py-1 font-semibold">{part.category}</span>
                          <span className="font-black text-[var(--pf-text)]">{currencyFormatter.format(Number(part.price || 0))}</span>
                        </div>
                        <div className="mt-4 flex gap-3">
                          <button type="button" onClick={() => onEditPart(part)} className="pf-button-primary flex-1 px-4 py-2.5 text-sm">
                            Bearbeiten
                          </button>
                          <button type="button" onClick={() => onDeletePart(part)} className="pf-button-danger px-4 py-2.5 text-sm">
                            Löschen
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
