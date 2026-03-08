import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './Avatar';
import ChatPanel from './ChatPanel';
import ThemeSwitcher from './ThemeSwitcher';
import { resizeImageToBase64 } from '../utils/image';
import { currencyFormatter, formatShortDateTime } from '../utils/format';

function StatusBadge({ status }) {
  if (status === 'sold') {
    return <span className="rounded-full bg-[var(--pf-danger)] px-2 py-1 text-[10px] font-bold text-white">Verkauft</span>;
  }
  if (status === 'reserved') {
    return <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-300">Reserviert</span>;
  }
  return <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300">Aktiv</span>;
}

function SectionButton({ active, onClick, label, badge }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold ${
        active ? 'bg-[var(--pf-primary)] text-[#04111a]' : 'bg-[var(--pf-surface-2)] text-[var(--pf-text)]'
      }`}
    >
      <span>{label}</span>
      {badge ? <span className="rounded-full bg-[var(--pf-danger)] px-2 py-0.5 text-[11px] text-white">{badge}</span> : null}
    </button>
  );
}

const baseSections = [
  { id: 'profile', label: 'Profil' },
  { id: 'password', label: 'Passwort' },
  { id: 'favorites', label: 'Merkliste' },
  { id: 'chats', label: 'Chats' },
  { id: 'parts', label: 'Eigene Inserate' },
];

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
  sellerTrustByUid,
  isModerator,
  reports,
  reportsLoading,
  onModerateReport,
  moderationOpenCount,
}) {
  const sections = useMemo(
    () => (isModerator ? [...baseSections, { id: 'moderation', label: 'Moderation' }] : baseSections),
    [isModerator],
  );
  const [activeSection, setActiveSection] = useState(selectedChatId ? 'chats' : 'profile');
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    whatsappNumber: '',
    chatEnabled: true,
    avatarBase64: '',
    themePreference: 'amoled',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [partsFilter, setPartsFilter] = useState('all');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [processingAvatar, setProcessingAvatar] = useState(false);
  const [moderationNotes, setModerationNotes] = useState({});
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
    if (selectedChatId) setActiveSection('chats');
  }, [selectedChatId]);

  useEffect(() => {
    if (!sections.some((item) => item.id === activeSection)) {
      setActiveSection('profile');
    }
  }, [activeSection, sections]);

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

  const activeParts = useMemo(() => myParts.filter((part) => (part.status || 'active') === 'active'), [myParts]);
  const reservedParts = useMemo(() => myParts.filter((part) => (part.status || 'active') === 'reserved'), [myParts]);
  const soldParts = useMemo(() => myParts.filter((part) => (part.status || 'active') === 'sold'), [myParts]);

  const visibleParts = useMemo(() => {
    if (partsFilter === 'active') return activeParts;
    if (partsFilter === 'reserved') return reservedParts;
    if (partsFilter === 'sold') return soldParts;
    return myParts;
  }, [activeParts, myParts, partsFilter, reservedParts, soldParts]);

  const myTrust = sellerTrustByUid[user.uid] || {
    ratingAverage: 0,
    ratingCount: 0,
    soldCount: 0,
    verified: false,
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
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
    } finally {
      setSavingPassword(false);
    }
  };

  const handleModerationUpdate = async (report, status) => {
    await onModerateReport(report, {
      status,
      note: moderationNotes[report.id] || '',
    });
  };

  return (
    <div className="pf-page">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-5 rounded-[1.75rem] pf-glass p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--pf-primary)]">Dashboard</p>
              <h1 className="text-2xl font-black text-[var(--pf-text)]">Dein Bereich</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher value={theme} onChange={onThemeChange} compact />
              <button type="button" onClick={onOpenMarketplace} className="pf-button-secondary px-4 py-2 text-sm">
                Zum Marktplatz
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[1.5rem] pf-card p-4">
            <div className="mb-4 flex items-center gap-3">
              <Avatar name={profileForm.displayName || user.displayName || user.email} src={profileForm.avatarBase64} size="md" />
              <div className="min-w-0">
                <p className="truncate font-bold text-[var(--pf-text)]">{profileForm.displayName || user.displayName || user.email}</p>
                <p className="truncate text-sm text-[var(--pf-muted)]">{user.email}</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">Aktiv: <b>{activeParts.length}</b></div>
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">Reserviert: <b>{reservedParts.length}</b></div>
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">Verkauft: <b>{soldParts.length}</b></div>
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">Rating: <b>{myTrust.ratingCount ? `${myTrust.ratingAverage.toFixed(1)}★` : 'Neu'}</b></div>
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
              <SectionButton active={activeSection === 'profile'} onClick={() => setActiveSection('profile')} label="Profil" />
              <SectionButton active={activeSection === 'password'} onClick={() => setActiveSection('password')} label="Passwort" />
              <SectionButton active={activeSection === 'favorites'} onClick={() => setActiveSection('favorites')} label="Merkliste" badge={favoriteParts.length || undefined} />
              <SectionButton active={activeSection === 'chats'} onClick={() => setActiveSection('chats')} label="Chats" badge={unreadChatsCount || undefined} />
              <SectionButton active={activeSection === 'parts'} onClick={() => setActiveSection('parts')} label="Eigene Inserate" badge={myParts.length || undefined} />
              {isModerator ? (
                <SectionButton active={activeSection === 'moderation'} onClick={() => setActiveSection('moderation')} label="Moderation" badge={moderationOpenCount || undefined} />
              ) : null}
            </div>
          </aside>

          <section>
            {activeSection === 'profile' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">Profil</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => avatarInputRef.current?.click()} className="pf-button-secondary px-4 py-3 text-sm">
                      Profilbild waehlen
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      value={profileForm.displayName}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
                      className="pf-input px-4 py-3"
                      placeholder="Anzeigename"
                      required
                    />
                    <input
                      type="text"
                      value={profileForm.whatsappNumber}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))}
                      className="pf-input px-4 py-3"
                      placeholder="WhatsApp Nummer"
                    />
                  </div>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={profileForm.chatEnabled}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, chatEnabled: event.target.checked }))}
                    />
                    In-App Chat erlauben
                  </label>
                  <ThemeSwitcher
                    value={profileForm.themePreference}
                    onChange={(value) => setProfileForm((prev) => ({ ...prev, themePreference: value }))}
                    compact
                  />
                  <button type="submit" disabled={savingProfile || processingAvatar} className="pf-button-primary px-4 py-3 disabled:opacity-60">
                    {savingProfile ? 'Speichert...' : 'Profil speichern'}
                  </button>
                </form>
              </section>
            ) : null}

            {activeSection === 'password' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">Passwort aendern</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    className="pf-input px-4 py-3"
                    placeholder="Aktuelles Passwort"
                    required
                  />
                  <input
                    type="password"
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    className="pf-input px-4 py-3"
                    placeholder="Neues Passwort"
                    required
                  />
                  <button type="submit" disabled={savingPassword} className="pf-button-secondary px-4 py-3 disabled:opacity-60">
                    {savingPassword ? 'Aendert...' : 'Passwort aktualisieren'}
                  </button>
                </form>
              </section>
            ) : null}

            {activeSection === 'favorites' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">Merkliste</h2>
                {favoriteParts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                    Noch keine Favoriten gespeichert.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {favoriteParts.map((part) => (
                      <div key={part.id} className="rounded-xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="font-semibold text-[var(--pf-text)]">{part.title}</p>
                          <StatusBadge status={part.status || 'active'} />
                        </div>
                        <p className="text-sm text-[var(--pf-muted)]">{part.brand} • {part.model}</p>
                        <p className="mt-2 font-black text-[var(--pf-text)]">{currencyFormatter.format(Number(part.price || 0))}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {activeSection === 'chats' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">Chats</h2>
                <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    {sortedChats.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
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
                            className={`w-full rounded-xl border p-4 text-left ${
                              selectedChat?.id === chat.id
                                ? 'border-[var(--pf-primary)] bg-[var(--pf-primary-soft)]'
                                : 'border-[color:var(--pf-border)] bg-[var(--pf-surface-2)]'
                            }`}
                          >
                            <p className="truncate font-semibold text-[var(--pf-text)]">{otherProfile?.displayName || chat.participantNames?.[otherUid] || 'Kontakt'}</p>
                            <p className="mt-1 truncate text-sm text-[var(--pf-muted)]">{chat.partTitle || 'Inserat'}</p>
                            <p className="mt-1 truncate text-xs text-[var(--pf-muted)]">{chat.lastMessage || 'Noch keine Nachricht'}</p>
                            <p className="mt-1 text-[11px] text-[var(--pf-muted)]">{formatShortDateTime(chat.updatedAt)}</p>
                            {unread ? <span className="mt-2 inline-block rounded-full bg-[var(--pf-danger)] px-2 py-0.5 text-[11px] text-white">Neu</span> : null}
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
                <div className="mb-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setPartsFilter('all')} className="pf-button-secondary px-4 py-2 text-sm">Alle</button>
                  <button type="button" onClick={() => setPartsFilter('active')} className="pf-button-secondary px-4 py-2 text-sm">Aktiv</button>
                  <button type="button" onClick={() => setPartsFilter('reserved')} className="pf-button-secondary px-4 py-2 text-sm">Reserviert</button>
                  <button type="button" onClick={() => setPartsFilter('sold')} className="pf-button-secondary px-4 py-2 text-sm">Verkauft</button>
                </div>
                {visibleParts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                    Keine Inserate in dieser Ansicht.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleParts.map((part) => (
                      <div key={part.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
                        <div>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--pf-text)]">{part.title}</p>
                            <StatusBadge status={part.status || 'active'} />
                          </div>
                          <p className="text-sm text-[var(--pf-muted)]">{part.brand} • {part.model}</p>
                          <p className="mt-1 font-semibold text-[var(--pf-text)]">{currencyFormatter.format(Number(part.price || 0))}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => onSetPartStatus(part, 'active')} className="pf-button-secondary px-3 py-2 text-sm">Aktiv</button>
                          <button type="button" onClick={() => onSetPartStatus(part, 'reserved')} className="pf-button-secondary px-3 py-2 text-sm">Reservieren</button>
                          <button type="button" onClick={() => onSetPartStatus(part, 'sold')} className="pf-button-secondary px-3 py-2 text-sm">Verkaufen</button>
                          <button type="button" onClick={() => onEditPart(part)} className="pf-button-secondary px-3 py-2 text-sm">Bearbeiten</button>
                          <button type="button" onClick={() => onDeletePart(part)} className="pf-button-danger px-3 py-2 text-sm">Loeschen</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {activeSection === 'moderation' && isModerator ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">Moderation</h2>
                {reportsLoading ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                    Meldungen werden geladen...
                  </div>
                ) : reports.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                    Keine Meldungen vorhanden.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="rounded-xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
                        <p className="font-semibold text-[var(--pf-text)]">{report.partTitle || report.partId}</p>
                        <p className="mt-1 text-sm text-[var(--pf-muted)]">Grund: {report.reason}</p>
                        <p className="mt-1 text-sm text-[var(--pf-muted)]">Status: {report.status}</p>
                        {report.details ? <p className="mt-2 text-sm text-[var(--pf-text)]">{report.details}</p> : null}
                        <textarea
                          rows="2"
                          value={moderationNotes[report.id] || ''}
                          onChange={(event) => setModerationNotes((prev) => ({ ...prev, [report.id]: event.target.value }))}
                          placeholder="Moderationsnotiz"
                          className="pf-textarea mt-3 px-4 py-3"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleModerationUpdate(report, 'in_review')} className="pf-button-secondary px-3 py-2 text-sm">In Pruefung</button>
                          <button type="button" onClick={() => handleModerationUpdate(report, 'resolved')} className="pf-button-secondary px-3 py-2 text-sm">Geloest</button>
                          <button type="button" onClick={() => handleModerationUpdate(report, 'rejected')} className="pf-button-danger px-3 py-2 text-sm">Ablehnen</button>
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
