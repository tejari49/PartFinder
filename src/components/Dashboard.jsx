import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './Avatar';
import ChatPanel from './ChatPanel';
import ThemeSwitcher from './ThemeSwitcher';
import { resizeImageToBase64 } from '../utils/image';
import { currencyFormatter, formatShortDateTime } from '../utils/format';

function StatusBadge({ status }) {
  if (status === 'sold') {
    return <span className="rounded-full bg-[var(--pf-danger)] px-2 py-1 text-[10px] font-bold text-white">Sold</span>;
  }
  if (status === 'reserved') {
    return <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-300">Reserved</span>;
  }
  return <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300">Active</span>;
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
  { id: 'profile', label: 'Profile' },
  { id: 'password', label: 'Password' },
  { id: 'favorites', label: 'Favorites' },
  { id: 'chats', label: 'Chats' },
  { id: 'parts', label: 'My listings' },
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
      onToast('Profile picture prepared.', 'success');
    } catch (error) {
      console.error(error);
      onToast('Profile picture could not be processed.', 'error');
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
              <h1 className="text-2xl font-black text-[var(--pf-text)]">Your area</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitcher value={theme} onChange={onThemeChange} compact />
              <button type="button" onClick={onOpenMarketplace} className="pf-button-secondary px-4 py-2 text-sm">
                Open marketplace
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
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">Active: <b>{activeParts.length}</b></div>
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">Reserved: <b>{reservedParts.length}</b></div>
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">Sold: <b>{soldParts.length}</b></div>
              <div className="rounded-xl bg-[var(--pf-surface-2)] px-3 py-2">Rating: <b>{myTrust.ratingCount ? `${myTrust.ratingAverage.toFixed(1)} / 5` : 'New'}</b></div>
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
              <SectionButton active={activeSection === 'profile'} onClick={() => setActiveSection('profile')} label="Profile" />
              <SectionButton active={activeSection === 'password'} onClick={() => setActiveSection('password')} label="Password" />
              <SectionButton active={activeSection === 'favorites'} onClick={() => setActiveSection('favorites')} label="Favorites" badge={favoriteParts.length || undefined} />
              <SectionButton active={activeSection === 'chats'} onClick={() => setActiveSection('chats')} label="Chats" badge={unreadChatsCount || undefined} />
              <SectionButton active={activeSection === 'parts'} onClick={() => setActiveSection('parts')} label="My listings" badge={myParts.length || undefined} />
              {isModerator ? (
                <SectionButton active={activeSection === 'moderation'} onClick={() => setActiveSection('moderation')} label="Moderation" badge={moderationOpenCount || undefined} />
              ) : null}
            </div>
          </aside>

          <section>
            {activeSection === 'profile' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">Profile</h2>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => avatarInputRef.current?.click()} className="pf-button-secondary px-4 py-3 text-sm">
                      Choose profile picture
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      value={profileForm.displayName}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
                      className="pf-input px-4 py-3"
                      placeholder="Display name"
                      required
                    />
                    <input
                      type="text"
                      value={profileForm.whatsappNumber}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, whatsappNumber: event.target.value }))}
                      className="pf-input px-4 py-3"
                      placeholder="WhatsApp number"
                    />
                  </div>
                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={profileForm.chatEnabled}
                      onChange={(event) => setProfileForm((prev) => ({ ...prev, chatEnabled: event.target.checked }))}
                    />
                    Enable in-app chat
                  </label>
                  <ThemeSwitcher
                    value={profileForm.themePreference}
                    onChange={(value) => setProfileForm((prev) => ({ ...prev, themePreference: value }))}
                    compact
                  />
                  <button type="submit" disabled={savingProfile || processingAvatar} className="pf-button-primary px-4 py-3 disabled:opacity-60">
                    {savingProfile ? 'Saving...' : 'Save profile'}
                  </button>
                </form>
              </section>
            ) : null}

            {activeSection === 'password' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">Change password</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                    className="pf-input px-4 py-3"
                    placeholder="Current password"
                    required
                  />
                  <input
                    type="password"
                    minLength={6}
                    value={passwordForm.newPassword}
                    onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                    className="pf-input px-4 py-3"
                    placeholder="New password"
                    required
                  />
                  <button type="submit" disabled={savingPassword} className="pf-button-secondary px-4 py-3 disabled:opacity-60">
                    {savingPassword ? 'Updating...' : 'Update password'}
                  </button>
                </form>
              </section>
            ) : null}

            {activeSection === 'favorites' ? (
              <section className="rounded-[1.5rem] pf-card p-5">
                <h2 className="mb-3 text-xl font-bold text-[var(--pf-text)]">Favorites</h2>
                {favoriteParts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                    No favorite listings yet.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {favoriteParts.map((part) => (
                      <div key={part.id} className="rounded-xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="font-semibold text-[var(--pf-text)]">{part.title}</p>
                          <StatusBadge status={part.status || 'active'} />
                        </div>
                        <p className="text-sm text-[var(--pf-muted)]">{part.brand} / {part.model}</p>
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
                        No chats yet.
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
                            <p className="truncate font-semibold text-[var(--pf-text)]">{otherProfile?.displayName || chat.participantNames?.[otherUid] || 'Contact'}</p>
                            <p className="mt-1 truncate text-sm text-[var(--pf-muted)]">{chat.partTitle || 'Listing'}</p>
                            <p className="mt-1 truncate text-xs text-[var(--pf-muted)]">{chat.lastMessage || 'No message yet'}</p>
                            <p className="mt-1 text-[11px] text-[var(--pf-muted)]">{formatShortDateTime(chat.updatedAt)}</p>
                            {unread ? <span className="mt-2 inline-block rounded-full bg-[var(--pf-danger)] px-2 py-0.5 text-[11px] text-white">New</span> : null}
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
                  <button type="button" onClick={() => setPartsFilter('all')} className="pf-button-secondary px-4 py-2 text-sm">All</button>
                  <button type="button" onClick={() => setPartsFilter('active')} className="pf-button-secondary px-4 py-2 text-sm">Active</button>
                  <button type="button" onClick={() => setPartsFilter('reserved')} className="pf-button-secondary px-4 py-2 text-sm">Reserved</button>
                  <button type="button" onClick={() => setPartsFilter('sold')} className="pf-button-secondary px-4 py-2 text-sm">Sold</button>
                </div>
                {visibleParts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                    No listings in this view.
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
                          <p className="text-sm text-[var(--pf-muted)]">{part.brand} / {part.model}</p>
                          <p className="mt-1 font-semibold text-[var(--pf-text)]">{currencyFormatter.format(Number(part.price || 0))}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => onSetPartStatus(part, 'active')} className="pf-button-secondary px-3 py-2 text-sm">Set active</button>
                          <button type="button" onClick={() => onSetPartStatus(part, 'reserved')} className="pf-button-secondary px-3 py-2 text-sm">Set reserved</button>
                          <button type="button" onClick={() => onSetPartStatus(part, 'sold')} className="pf-button-secondary px-3 py-2 text-sm">Mark sold</button>
                          <button type="button" onClick={() => onEditPart(part)} className="pf-button-secondary px-3 py-2 text-sm">Edit</button>
                          <button type="button" onClick={() => onDeletePart(part)} className="pf-button-danger px-3 py-2 text-sm">Delete</button>
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
                    Loading reports...
                  </div>
                ) : reports.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4 text-sm text-[var(--pf-muted)]">
                    No reports found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="rounded-xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-4">
                        <p className="font-semibold text-[var(--pf-text)]">{report.partTitle || report.partId}</p>
                        <p className="mt-1 text-sm text-[var(--pf-muted)]">Reason: {report.reason}</p>
                        <p className="mt-1 text-sm text-[var(--pf-muted)]">Status: {report.status}</p>
                        {report.details ? <p className="mt-2 text-sm text-[var(--pf-text)]">{report.details}</p> : null}
                        <textarea
                          rows="2"
                          value={moderationNotes[report.id] || ''}
                          onChange={(event) => setModerationNotes((prev) => ({ ...prev, [report.id]: event.target.value }))}
                          placeholder="Moderation note"
                          className="pf-textarea mt-3 px-4 py-3"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleModerationUpdate(report, 'in_review')} className="pf-button-secondary px-3 py-2 text-sm">In review</button>
                          <button type="button" onClick={() => handleModerationUpdate(report, 'resolved')} className="pf-button-secondary px-3 py-2 text-sm">Resolve</button>
                          <button type="button" onClick={() => handleModerationUpdate(report, 'rejected')} className="pf-button-danger px-3 py-2 text-sm">Reject</button>
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
