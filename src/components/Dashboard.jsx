import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './Avatar';
import ChatPanel from './ChatPanel';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';
import { resizeImageToBase64 } from '../utils/image';
import { currencyFormatter, formatShortDateTime } from '../utils/format';

const text = {
  en: {
    sold: 'Sold',
    reserved: 'Reserved',
    active: 'Active',
    profile: 'Profile',
    password: 'Password',
    favorites: 'Favorites',
    chats: 'Chats',
    myListings: 'My listings',
    moderation: 'Moderation',
    dashboard: 'Dashboard',
    yourArea: 'Your area',
    openMarketplace: 'Open marketplace',
    profilePicturePrepared: 'Profile picture prepared.',
    profilePictureError: 'Profile picture could not be processed.',
    chooseProfilePicture: 'Choose profile picture',
    displayName: 'Display name',
    whatsapp: 'WhatsApp number',
    enableChat: 'Enable in-app chat',
    saveProfile: 'Save profile',
    saving: 'Saving...',
    changePassword: 'Change password',
    currentPassword: 'Current password',
    newPassword: 'New password',
    updatePassword: 'Update password',
    updating: 'Updating...',
    noFavorites: 'No favorite listings yet.',
    noChats: 'No chats yet.',
    contact: 'Contact',
    listing: 'Listing',
    noMessageYet: 'No message yet',
    new: 'New',
    noListingsInView: 'No listings in this view.',
    setActive: 'Set active',
    setReserved: 'Set reserved',
    markSold: 'Mark sold',
    edit: 'Edit',
    delete: 'Delete',
    loadingReports: 'Loading reports...',
    noReports: 'No reports found.',
    reason: 'Reason',
    status: 'Status',
    moderationNote: 'Moderation note',
    inReview: 'In review',
    resolve: 'Resolve',
    reject: 'Reject',
    activeCount: 'Active',
    reservedCount: 'Reserved',
    soldCount: 'Sold',
    rating: 'Rating',
    all: 'All',
    ratingsNew: 'New',
    noImage: 'No image',
  },
  de: {
    sold: 'Verkauft',
    reserved: 'Reserviert',
    active: 'Aktiv',
    profile: 'Profil',
    password: 'Passwort',
    favorites: 'Merkliste',
    chats: 'Chats',
    myListings: 'Eigene Inserate',
    moderation: 'Moderation',
    dashboard: 'Dashboard',
    yourArea: 'Dein Bereich',
    openMarketplace: 'Zum Marktplatz',
    profilePicturePrepared: 'Profilbild vorbereitet.',
    profilePictureError: 'Profilbild konnte nicht verarbeitet werden.',
    chooseProfilePicture: 'Profilbild waehlen',
    displayName: 'Anzeigename',
    whatsapp: 'WhatsApp Nummer',
    enableChat: 'In-App Chat erlauben',
    saveProfile: 'Profil speichern',
    saving: 'Speichert...',
    changePassword: 'Passwort aendern',
    currentPassword: 'Aktuelles Passwort',
    newPassword: 'Neues Passwort',
    updatePassword: 'Passwort aktualisieren',
    updating: 'Aktualisiert...',
    noFavorites: 'Noch keine Favoriten gespeichert.',
    noChats: 'Noch keine Chats vorhanden.',
    contact: 'Kontakt',
    listing: 'Inserat',
    noMessageYet: 'Noch keine Nachricht',
    new: 'Neu',
    noListingsInView: 'Keine Inserate in dieser Ansicht.',
    setActive: 'Aktiv',
    setReserved: 'Reservieren',
    markSold: 'Verkaufen',
    edit: 'Bearbeiten',
    delete: 'Loeschen',
    loadingReports: 'Meldungen werden geladen...',
    noReports: 'Keine Meldungen gefunden.',
    reason: 'Grund',
    status: 'Status',
    moderationNote: 'Moderationsnotiz',
    inReview: 'In Pruefung',
    resolve: 'Geloest',
    reject: 'Ablehnen',
    activeCount: 'Aktiv',
    reservedCount: 'Reserviert',
    soldCount: 'Verkauft',
    rating: 'Rating',
    all: 'Alle',
    ratingsNew: 'Neu',
    noImage: 'Kein Bild',
  },
};

function StatusBadge({ status, t }) {
  if (status === 'sold') {
    return <span className="rounded-full bg-[var(--pf-danger)] px-2 py-1 text-[10px] font-bold text-white">{t.sold}</span>;
  }
  if (status === 'reserved') {
    return <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-300">{t.reserved}</span>;
  }
  return <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300">{t.active}</span>;
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

export default function Dashboard({
  language = 'en',
  onLanguageChange,
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
  const t = language === 'de' ? text.de : text.en;
  const baseSections = [
    { id: 'profile', label: t.profile },
    { id: 'password', label: t.password },
    { id: 'favorites', label: t.favorites },
    { id: 'chats', label: t.chats },
    { id: 'parts', label: t.myListings },
  ];
  const sections = useMemo(
    () => (isModerator ? [...baseSections, { id: 'moderation', label: t.moderation }] : baseSections),
    [isModerator, t],
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
  const [brokenPartImages, setBrokenPartImages] = useState({});
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

  const getPartPreviewImage = (part) => {
    if (!part?.id || brokenPartImages[part.id]) return '';
    return part.imagesBase64?.[0] || part.imageBase64 || '';
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
      onToast(t.profilePicturePrepared, 'success');
    } catch (error) {
      console.error(error);
      onToast(t.profilePictureError, 'error');
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
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--pf-primary)]">{t.dashboard}</p>
              <h1 className="text-2xl font-black text-[var(--pf-text)]">{t.yourArea}</h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher value={language} onChange={onLanguageChange} />
              <ThemeSwitcher value={theme} onChange={onThemeChange} compact />
              <button type="button" onClick={onOpenMarketplace} className="pf-button-secondary px-4 py-2 text-sm">
                {t.openMarketplace}
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
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">{t.activeCount}: <b>{activeParts.length}</b></div>
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">{t.reservedCount}: <b>{reservedParts.length}</b></div>
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">{t.soldCount}: <b>{soldParts.length}</b></div>
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">{t.rating}: <b>{myTrust.ratingCount ? `${myTrust.ratingAverage.toFixed(1)} / 5` : t.ratingsNew}</b></div>
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
              <SectionButton active={activeSection === 'profile'} onClick={() => setActiveSection('profile')} label={t.profile} />
              <SectionButton active={activeSection === 'password'} onClick={() => setActiveSection('password')} label={t.password} />
              <SectionButton active={activeSection === 'favorites'} onClick={() => setActiveSection('favorites')} label={t.favorites} badge={favoriteParts.length || undefined} />
              <SectionButton active={activeSection === 'chats'} onClick={() => setActiveSection('chats')} label={t.chats} badge={unreadChatsCount || undefined} />
              <SectionButton active={activeSection === 'parts'} onClick={() => setActiveSection('parts')} label={t.myListings} badge={myParts.length || undefined} />
              {isModerator ? (
                <SectionButton active={activeSection === 'moderation'} onClick={() => setActiveSection('moderation')} label={t.moderation} badge={moderationOpenCount || undefined} />
              ) : null}
            </div>
          </aside>

          <section>
            {activeSection === 'profile' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">{t.profile}</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => avatarInputRef.current?.click()} className="pf-button-secondary px-4 py-3 text-sm">
                      {t.chooseProfilePicture}
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      value={profileForm.displayName}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
                      className="pf-input px-4 py-3"
                      placeholder={t.displayName}
                      required
                    />
                    <input
                      type="text"
                      value={profileForm.whatsappNumber}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))}
                      className="pf-input px-4 py-3"
                      placeholder={t.whatsapp}
                    />
                  </div>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={profileForm.chatEnabled}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, chatEnabled: event.target.checked }))}
                    />
                    {t.enableChat}
                  </label>
                  <ThemeSwitcher
                    value={profileForm.themePreference}
                    onChange={(value) => setProfileForm((prev) => ({ ...prev, themePreference: value }))}
                    compact
                  />
                  <button type="submit" disabled={savingProfile || processingAvatar} className="pf-button-primary px-4 py-3 disabled:opacity-60">
                    {savingProfile ? t.saving : t.saveProfile}
                  </button>
                </form>
              </section>
            ) : null}

            {activeSection === 'password' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">{t.changePassword}</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    className="pf-input px-4 py-3"
                    placeholder={t.currentPassword}
                    required
                  />
                  <input
                    type="password"
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    className="pf-input px-4 py-3"
                    placeholder={t.newPassword}
                    required
                  />
                  <button type="submit" disabled={savingPassword} className="pf-button-secondary px-4 py-3 disabled:opacity-60">
                    {savingPassword ? t.updating : t.updatePassword}
                  </button>
                </form>
              </section>
            ) : null}

            {activeSection === 'favorites' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">{t.favorites}</h2>
                {favoriteParts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                    {t.noFavorites}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {favoriteParts.map((part) => {
                      const previewImage = getPartPreviewImage(part);
                      return (
                        <div key={part.id} className="overflow-hidden rounded-xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)]">
                          {previewImage ? (
                            <img
                              src={previewImage}
                              alt={part.title}
                              loading="lazy"
                              className="h-28 w-full object-cover"
                              onError={() => setBrokenPartImages((prev) => ({ ...prev, [part.id]: true }))}
                            />
                          ) : (
                            <div className="flex h-28 items-center justify-center text-xs text-[var(--pf-muted)]">{t.noImage}</div>
                          )}
                          <div className="p-4">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="font-semibold text-[var(--pf-text)]">{part.title}</p>
                              <StatusBadge status={part.status || 'active'} t={t} />
                            </div>
                            <p className="text-sm text-[var(--pf-muted)]">{part.brand} / {part.model}</p>
                            <p className="mt-2 font-black text-[var(--pf-text)]">{currencyFormatter.format(Number(part.price || 0), language)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : null}

            {activeSection === 'chats' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">{t.chats}</h2>
                <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
                  <div className="space-y-3">
                    {sortedChats.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                        {t.noChats}
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
                            <p className="truncate font-semibold text-[var(--pf-text)]">{otherProfile?.displayName || chat.participantNames?.[otherUid] || t.contact}</p>
                            <p className="mt-1 truncate text-sm text-[var(--pf-muted)]">{chat.partTitle || t.listing}</p>
                            <p className="mt-1 truncate text-xs text-[var(--pf-muted)]">{chat.lastMessage || t.noMessageYet}</p>
                            <p className="mt-1 text-[11px] text-[var(--pf-muted)]">{formatShortDateTime(chat.updatedAt, null, language)}</p>
                            {unread ? <span className="mt-2 inline-block rounded-full bg-[var(--pf-danger)] px-2 py-0.5 text-[11px] text-white">{t.new}</span> : null}
                          </button>
                        );
                      })
                    )}
                  </div>
                  <ChatPanel language={language} chat={selectedChat} currentUser={user} onToast={onToast} profilesByUid={profilesByUid} />
                </div>
              </section>
            ) : null}

            {activeSection === 'parts' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <div className="mb-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setPartsFilter('all')} className="pf-button-secondary px-4 py-2 text-sm">{t.all}</button>
                  <button type="button" onClick={() => setPartsFilter('active')} className="pf-button-secondary px-4 py-2 text-sm">{t.active}</button>
                  <button type="button" onClick={() => setPartsFilter('reserved')} className="pf-button-secondary px-4 py-2 text-sm">{t.reserved}</button>
                  <button type="button" onClick={() => setPartsFilter('sold')} className="pf-button-secondary px-4 py-2 text-sm">{t.sold}</button>
                </div>
                {visibleParts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                    {t.noListingsInView}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleParts.map((part) => {
                      const previewImage = getPartPreviewImage(part);
                      return (
                      <div key={part.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[color:var(--pf-border)] bg-[var(--pf-surface)]">
                            {previewImage ? (
                              <img
                                src={previewImage}
                                alt={part.title}
                                loading="lazy"
                                className="h-full w-full object-cover"
                                onError={() => setBrokenPartImages((prev) => ({ ...prev, [part.id]: true }))}
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center px-1 text-center text-[10px] text-[var(--pf-muted)]">{t.noImage}</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="mb-1 flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-[var(--pf-text)]">{part.title}</p>
                              <StatusBadge status={part.status || 'active'} t={t} />
                            </div>
                            <p className="text-sm text-[var(--pf-muted)]">{part.brand} / {part.model}</p>
                            <p className="mt-1 font-semibold text-[var(--pf-text)]">{currencyFormatter.format(Number(part.price || 0), language)}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => onSetPartStatus(part, 'active')} className="pf-button-secondary px-3 py-2 text-sm">{t.setActive}</button>
                          <button type="button" onClick={() => onSetPartStatus(part, 'reserved')} className="pf-button-secondary px-3 py-2 text-sm">{t.setReserved}</button>
                          <button type="button" onClick={() => onSetPartStatus(part, 'sold')} className="pf-button-secondary px-3 py-2 text-sm">{t.markSold}</button>
                          <button type="button" onClick={() => onEditPart(part)} className="pf-button-secondary px-3 py-2 text-sm">{t.edit}</button>
                          <button type="button" onClick={() => onDeletePart(part)} className="pf-button-danger px-3 py-2 text-sm">{t.delete}</button>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : null}

            {activeSection === 'moderation' && isModerator ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">{t.moderation}</h2>
                {reportsLoading ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                    {t.loadingReports}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                    {t.noReports}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="rounded-xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
                        <p className="font-semibold text-[var(--pf-text)]">{report.partTitle || report.partId}</p>
                        <p className="mt-1 text-sm text-[var(--pf-muted)]">{t.reason}: {report.reason}</p>
                        <p className="mt-1 text-sm text-[var(--pf-muted)]">{t.status}: {report.status}</p>
                        {report.details ? <p className="mt-2 text-sm text-[var(--pf-text)]">{report.details}</p> : null}
                        <textarea
                          rows="2"
                          value={moderationNotes[report.id] || ''}
                          onChange={(event) => setModerationNotes((prev) => ({ ...prev, [report.id]: event.target.value }))}
                          placeholder={t.moderationNote}
                          className="pf-textarea mt-3 px-4 py-3"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleModerationUpdate(report, 'in_review')} className="pf-button-secondary px-3 py-2 text-sm">{t.inReview}</button>
                          <button type="button" onClick={() => handleModerationUpdate(report, 'resolved')} className="pf-button-secondary px-3 py-2 text-sm">{t.resolve}</button>
                          <button type="button" onClick={() => handleModerationUpdate(report, 'rejected')} className="pf-button-danger px-3 py-2 text-sm">{t.reject}</button>
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
