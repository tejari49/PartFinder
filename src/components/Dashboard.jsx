import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './Avatar';
import ChatPanel from './ChatPanel';
import ThemeSwitcher from './ThemeSwitcher';
import { resizeImageToBase64 } from '../utils/image';
import { currencyFormatter, formatShortDateTime } from '../utils/format';

const sections = [
  { id: 'profile', label: 'Profil' },
  { id: 'password', label: 'Passwort' },
  { id: 'favorites', label: 'Merkliste' },
  { id: 'chats', label: 'Chats' },
  { id: 'parts', label: 'Inserate' },
];

function NavItem({ active, onClick, label, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left text-sm font-semibold transition ${
        active
          ? 'bg-[var(--pf-primary)] text-[#04111a]'
          : 'bg-[var(--pf-surface-2)] text-[var(--pf-text)] hover:bg-[var(--pf-surface-3)]'
      }`}
    >
      <span>{label}</span>
      {badge ? (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] ${
            active ? 'bg-white/30 text-[#04111a]' : 'bg-[var(--pf-danger)] text-white'
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function StatusBadge({ status }) {
  return status === 'sold' ? (
    <span className="rounded-full bg-[var(--pf-danger)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
      Verkauft
    </span>
  ) : (
    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
      Aktiv
    </span>
  );
}

function OverviewTile({ label, value }) {
  return (
    <div className="rounded-[1rem] bg-[var(--pf-surface-2)] px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--pf-muted)]">{label}</p>
      <p className="mt-1 text-sm font-black text-[var(--pf-text)]">{value}</p>
    </div>
  );
}

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
  onSetPartStatus,
  unreadChatsCount,
  theme,
  onThemeChange,
  favoriteParts,
  totalPartsCount,
  categoriesCount,
  totalSoldCount,
}) {
  const [activeSection, setActiveSection] = useState(selectedChatId ? 'chats' : 'profile');
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
  const [partsFilter, setPartsFilter] = useState('all');
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

  useEffect(() => {
    if (selectedChatId) {
      setActiveSection('chats');
    }
  }, [selectedChatId]);

  const sortedChats = useMemo(
    () => [...chats].sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)),
    [chats],
  );

  const selectedChat = useMemo(
    () => sortedChats.find((chat) => chat.id === selectedChatId) || sortedChats[0] || null,
    [selectedChatId, sortedChats],
  );

  useEffect(() => {
    if (!selectedChatId && sortedChats[0]?.id) {
      onSelectChat(sortedChats[0].id);
    }
  }, [onSelectChat, selectedChatId, sortedChats]);

  const activeParts = useMemo(
    () => myParts.filter((part) => (part.status || 'active') === 'active'),
    [myParts],
  );
  const soldParts = useMemo(
    () => myParts.filter((part) => (part.status || 'active') === 'sold'),
    [myParts],
  );
  const visibleParts = useMemo(() => {
    if (partsFilter === 'active') {
      return activeParts;
    }
    if (partsFilter === 'sold') {
      return soldParts;
    }
    return myParts;
  }, [activeParts, myParts, partsFilter, soldParts]);

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setProcessingAvatar(true);

    try {
      const avatarBase64 = await resizeImageToBase64(file, {
        maxWidth: 360,
        maxHeight: 360,
        quality: 0.6,
      });

      setProfileForm((prev) => ({ ...prev, avatarBase64 }));
      onToast('Profilbild vorbereitet.', 'success');
    } catch (error) {
      console.error(error);
      onToast('Profilbild konnte nicht verarbeitet werden.', 'error');
    } finally {
      setProcessingAvatar(false);
    }
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setSavingProfile(true);

    try {
      await onSaveProfile(profileForm);
      onThemeChange(profileForm.themePreference || theme);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
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
    <div className="pf-page">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-5 rounded-[1.75rem] pf-glass p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--pf-primary)]">
                Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-black text-[var(--pf-text)]">Dein Bereich</h1>
              <p className="mt-2 text-sm text-[var(--pf-muted)]">
                Links wählen, rechts bearbeiten. Auf dem Smartphone als Dropdown-Menü.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ThemeSwitcher value={theme} onChange={onThemeChange} compact />
              <button type="button" onClick={onOpenMarketplace} className="pf-button-secondary px-4 py-2.5 text-sm">
                Zum Marktplatz
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[1.5rem] pf-card p-4">
            <div className="mb-4 flex items-center gap-3">
              <Avatar
                name={profileForm.displayName || user.displayName || user.email}
                src={profileForm.avatarBase64}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate font-bold text-[var(--pf-text)]">
                  {profileForm.displayName || user.displayName || user.email}
                </p>
                <p className="truncate text-sm text-[var(--pf-muted)]">{user.email}</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-[1rem] bg-[var(--pf-surface-2)] px-3 py-3">
                <p className="text-[var(--pf-muted)]">Aktiv</p>
                <p className="mt-1 font-black text-[var(--pf-text)]">{activeParts.length}</p>
              </div>
              <div className="rounded-[1rem] bg-[var(--pf-surface-2)] px-3 py-3">
                <p className="text-[var(--pf-muted)]">Verkauft</p>
                <p className="mt-1 font-black text-[var(--pf-text)]">{soldParts.length}</p>
              </div>
              <div className="rounded-[1rem] bg-[var(--pf-surface-2)] px-3 py-3">
                <p className="text-[var(--pf-muted)]">Chats</p>
                <p className="mt-1 font-black text-[var(--pf-text)]">{sortedChats.length}</p>
              </div>
            </div>

            <div className="mb-4 rounded-[1.15rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface)]/80 p-3">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--pf-primary)]">
                Markt-Überblick
              </p>
              <div className="grid grid-cols-2 gap-2">
                <OverviewTile label="Inserate" value={totalPartsCount} />
                <OverviewTile label="Kategorien" value={categoriesCount} />
                <OverviewTile label="Eigene" value={myParts.length} />
                <OverviewTile label="Verkauft" value={totalSoldCount} />
              </div>
            </div>

            <div className="mb-4 lg:hidden">
              <select value={activeSection} onChange={(event) => setActiveSection(event.target.value)} className="pf-select px-4 py-3">
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden space-y-2 lg:block">
              <NavItem active={activeSection === 'profile'} onClick={() => setActiveSection('profile')} label="Profil" />
              <NavItem active={activeSection === 'password'} onClick={() => setActiveSection('password')} label="Passwort" />
              <NavItem active={activeSection === 'favorites'} onClick={() => setActiveSection('favorites')} label="Merkliste" badge={favoriteParts.length || undefined} />
              <NavItem active={activeSection === 'chats'} onClick={() => setActiveSection('chats')} label="Chats" badge={unreadChatsCount || undefined} />
              <NavItem active={activeSection === 'parts'} onClick={() => setActiveSection('parts')} label="Eigene Inserate" badge={myParts.length || undefined} />
            </div>
          </aside>

          <section>
            {activeSection === 'profile' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-[var(--pf-text)]">Profil</h2>
                  <p className="mt-1 text-sm text-[var(--pf-muted)]">
                    Name, WhatsApp, Chatfreigabe, Theme und Profilbild.
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <Avatar name={profileForm.displayName || user.displayName || user.email} src={profileForm.avatarBase64} size="lg" />
                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={() => avatarInputRef.current?.click()} className="pf-button-secondary px-4 py-3 text-sm">
                        Profilbild wählen
                      </button>
                      {profileForm.avatarBase64 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileForm((prev) => ({ ...prev, avatarBase64: '' }));
                            if (avatarInputRef.current) avatarInputRef.current.value = '';
                          }}
                          className="pf-button-danger px-4 py-3 text-sm"
                        >
                          Entfernen
                        </button>
                      ) : null}
                    </div>
                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
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

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[var(--pf-text)]">WhatsApp Nummer</span>
                      <input
                        type="text"
                        value={profileForm.whatsappNumber}
                        onChange={(event) => setProfileForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))}
                        placeholder="41790000000"
                        className="pf-input px-4 py-3"
                      />
                    </label>
                  </div>

                  <label className="flex items-center gap-3 rounded-[1rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-text)]">
                    <input
                      type="checkbox"
                      checked={profileForm.chatEnabled}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, chatEnabled: event.target.checked }))}
                    />
                    In-App Chat erlauben
                  </label>

                  <div className="rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-4">
                    <p className="mb-3 text-sm font-semibold text-[var(--pf-text)]">Design</p>
                    <ThemeSwitcher
                      value={profileForm.themePreference}
                      onChange={(value) => setProfileForm((prev) => ({ ...prev, themePreference: value }))}
                      compact
                    />
                  </div>

                  <div className="rounded-[1rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                    Konto: <span className="font-semibold text-[var(--pf-text)]">{user.email}</span>
                  </div>

                  <button type="submit" disabled={savingProfile || processingAvatar} className="pf-button-primary px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60">
                    {savingProfile ? 'Speichert…' : 'Profil speichern'}
                  </button>
                </form>
              </section>
            ) : null}

            {activeSection === 'password' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-[var(--pf-text)]">Passwort ändern</h2>
                  <p className="mt-1 text-sm text-[var(--pf-muted)]">
                    Aus Sicherheitsgründen wird dein aktuelles Passwort benötigt.
                  </p>
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

                  <button type="submit" disabled={savingPassword} className="pf-button-secondary px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60">
                    {savingPassword ? 'Ändert…' : 'Passwort aktualisieren'}
                  </button>
                </form>
              </section>
            ) : null}

            {activeSection === 'favorites' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--pf-text)]">Merkliste</h2>
                    <p className="mt-1 text-sm text-[var(--pf-muted)]">Gespeicherte Inserate für später.</p>
                  </div>
                  <div className="rounded-full bg-[var(--pf-primary-soft)] px-3 py-1 text-sm font-semibold text-[var(--pf-primary)]">
                    {favoriteParts.length}
                  </div>
                </div>

                {favoriteParts.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-6 text-sm text-[var(--pf-muted)]">
                    Noch keine Favoriten gespeichert.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {favoriteParts.map((part) => (
                      <div key={part.id} className="overflow-hidden rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)]">
                        {part.imagesBase64?.[0] || part.imageBase64 ? (
                          <img src={part.imagesBase64?.[0] || part.imageBase64} alt={part.title} className="h-36 w-full object-cover" />
                        ) : null}
                        <div className="space-y-3 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-bold text-[var(--pf-text)]">{part.title}</h3>
                            <StatusBadge status={part.status || 'active'} />
                          </div>
                          <p className="text-sm text-[var(--pf-muted)]">{part.brand} • {part.model}</p>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-base font-black text-[var(--pf-text)]">
                              {currencyFormatter.format(Number(part.price || 0))}
                            </span>
                            <span className="text-xs text-[var(--pf-muted)]">{part.location || 'Ohne Standort'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {activeSection === 'chats' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--pf-text)]">Chats</h2>
                    <p className="mt-1 text-sm text-[var(--pf-muted)]">Direkte Kontakte zu Käufern und Verkäufern.</p>
                  </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    {sortedChats.length === 0 ? (
                      <div className="rounded-[1.25rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-6 text-sm text-[var(--pf-muted)]">
                        Noch keine Chats vorhanden.
                      </div>
                    ) : (
                      sortedChats.map((chat) => {
                        const otherUid = chat.participantIds?.find((uid) => uid !== user.uid) || '';
                        const otherProfile = profilesByUid[otherUid];
                        const unread = Array.isArray(chat.unreadBy) && chat.unreadBy.includes(user.uid);

                        return (
                          <button
                            key={chat.id}
                            type="button"
                            onClick={() => onSelectChat(chat.id)}
                            className={`w-full rounded-[1.25rem] border p-4 text-left transition ${
                              selectedChat?.id === chat.id
                                ? 'border-[var(--pf-primary)] bg-[var(--pf-primary-soft)]'
                                : 'border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] hover:bg-[var(--pf-surface-3)]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar name={otherProfile?.displayName || chat.participantNames?.[otherUid] || 'Kontakt'} src={otherProfile?.avatarBase64 || ''} size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate font-semibold text-[var(--pf-text)]">
                                    {otherProfile?.displayName || chat.participantNames?.[otherUid] || 'Kontakt'}
                                  </p>
                                  {unread ? <span className="rounded-full bg-[var(--pf-danger)] px-2 py-0.5 text-[11px] text-white">Neu</span> : null}
                                </div>
                                <p className="mt-1 truncate text-sm text-[var(--pf-muted)]">{chat.partTitle || 'Inserat'}</p>
                                <p className="mt-1 truncate text-xs text-[var(--pf-muted)]">{chat.lastMessage || 'Noch keine Nachricht'}</p>
                                <p className="mt-2 text-[11px] text-[var(--pf-muted)]">{formatShortDateTime(chat.updatedAt)}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <ChatPanel chat={selectedChat} currentUser={user} onToast={onToast} profilesByUid={profilesByUid} />
                </div>
              </section>
            ) : null}

            {activeSection === 'parts' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--pf-text)]">Eigene Inserate</h2>
                    <p className="mt-1 text-sm text-[var(--pf-muted)]">
                      Verkauft-Status setzen, bearbeiten oder löschen. Der Editor öffnet sich im Marktplatz.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPartsFilter('all')}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        partsFilter === 'all'
                          ? 'bg-[var(--pf-primary)] text-[#04111a]'
                          : 'bg-[var(--pf-surface-2)] text-[var(--pf-text)]'
                      }`}
                    >
                      Alle
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartsFilter('active')}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        partsFilter === 'active'
                          ? 'bg-[var(--pf-primary)] text-[#04111a]'
                          : 'bg-[var(--pf-surface-2)] text-[var(--pf-text)]'
                      }`}
                    >
                      Aktiv
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartsFilter('sold')}
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        partsFilter === 'sold'
                          ? 'bg-[var(--pf-primary)] text-[#04111a]'
                          : 'bg-[var(--pf-surface-2)] text-[var(--pf-text)]'
                      }`}
                    >
                      Verkauft
                    </button>
                  </div>
                </div>

                {visibleParts.length === 0 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-6 text-sm text-[var(--pf-muted)]">
                    Keine Inserate in dieser Ansicht.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleParts.map((part) => (
                      <div key={part.id} className="flex flex-col gap-4 rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          {part.imagesBase64?.[0] || part.imageBase64 ? (
                            <img src={part.imagesBase64?.[0] || part.imageBase64} alt={part.title} className="h-16 w-16 rounded-[1rem] object-cover" />
                          ) : null}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-[var(--pf-text)]">{part.title}</p>
                              <StatusBadge status={part.status || 'active'} />
                            </div>
                            <p className="mt-1 text-sm text-[var(--pf-muted)]">{part.brand} • {part.model}</p>
                            <p className="mt-1 text-sm font-semibold text-[var(--pf-text)]">{currencyFormatter.format(Number(part.price || 0))}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onSetPartStatus(part, (part.status || 'active') === 'sold' ? 'active' : 'sold')}
                            className="pf-button-secondary px-4 py-2.5 text-sm"
                          >
                            {(part.status || 'active') === 'sold' ? 'Aktivieren' : 'Verkaufen'}
                          </button>
                          <button type="button" onClick={() => onEditPart(part)} className="pf-button-secondary px-4 py-2.5 text-sm">
                            Bearbeiten
                          </button>
                          <button type="button" onClick={() => onDeletePart(part)} className="pf-button-danger px-4 py-2.5 text-sm">
                            Löschen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
