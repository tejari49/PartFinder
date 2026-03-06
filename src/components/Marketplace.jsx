import { useMemo, useState } from 'react';
import AddPartForm from './AddPartForm';
import Avatar from './Avatar';
import PartDetailModal from './PartDetailModal';
import ThemeSwitcher from './ThemeSwitcher';
import { currencyFormatter, formatDateTime } from '../utils/format';

function PartCard({ part, sellerProfile, onOpenDetails, isOwn }) {
  const sellerName = sellerProfile?.displayName || part.sellerDisplayName || part.sellerEmail || 'Unbekannt';

  return (
    <button
      type="button"
      onClick={() => onOpenDetails(part)}
      className="group overflow-hidden rounded-[2rem] pf-card text-left transition hover:-translate-y-1"
    >
      <div className="relative overflow-hidden border-b pf-divider bg-black/10">
        <img
          src={part.imageBase64}
          alt={part.title}
          className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute left-4 top-4 pf-badge px-3 py-1 text-xs font-semibold">{part.category}</span>
        {isOwn ? (
          <span className="absolute right-4 top-4 rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface)] px-3 py-1 text-xs font-semibold text-[var(--pf-text)]">
            Dein Inserat
          </span>
        ) : null}
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--pf-muted)]">
              {part.brand} • {part.model}
            </p>
            <h3 className="mt-2 text-lg font-bold text-[var(--pf-text)]">{part.title}</h3>
          </div>
          <span className="rounded-2xl bg-[var(--pf-primary)] px-3 py-2 text-sm font-black text-[#04111a]">
            {currencyFormatter.format(Number(part.price || 0))}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-[var(--pf-muted)]">{part.description}</p>

        <div className="mt-5 grid gap-2 text-sm text-[var(--pf-muted)]">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-3)] px-3 py-2">
            <span>Zustand</span>
            <span className="font-medium text-[var(--pf-text)]">{part.condition}</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-3)] px-3 py-2">
            <span>Verkäufer</span>
            <div className="flex min-w-0 items-center gap-2">
              <Avatar name={sellerName} src={sellerProfile?.avatarBase64 || ''} size="sm" />
              <span className="truncate font-medium text-[var(--pf-text)]">{sellerName}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-3)] px-3 py-2">
            <span>Erstellt</span>
            <span className="font-medium text-[var(--pf-text)]">{formatDateTime(part.createdAt)}</span>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-primary-soft)] px-4 py-3 text-sm font-semibold text-[var(--pf-primary)]">
          Für Details antippen / anklicken
        </div>
      </div>
    </button>
  );
}

export default function Marketplace({
  user,
  profile,
  parts,
  totalParts,
  categories,
  selectedCategory,
  onSelectCategory,
  onAddPart,
  onSignOut,
  partsLoading,
  categoriesLoading,
  onToast,
  profilesByUid,
  onOpenDashboard,
  onStartChat,
  editingPart,
  onCancelEdit,
  onEditPart,
  onDeletePart,
  unreadChatsCount,
  theme,
  onThemeChange,
}) {
  const [selectedPart, setSelectedPart] = useState(null);

  const sellerCount = useMemo(() => new Set(parts.map((part) => part.sellerUid)).size, [parts]);

  return (
    <>
      <div className="pf-page">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="mb-8 rounded-[2rem] pf-glass p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="pf-hero-badge px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em]">
                  Geschützt durch Firebase Auth
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--pf-text)] sm:text-4xl">
                  PartFinder 🚗
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pf-muted)] sm:text-base">
                  Inserate öffnen, Verkäufer kontaktieren, eigene Angebote verwalten und zwischen AMOLED Black und Smooth Light wechseln.
                </p>
              </div>

              <div className="flex w-full max-w-xl flex-col gap-3">
                <div className="rounded-[1.5rem] pf-card-muted p-3">
                  <ThemeSwitcher value={theme} onChange={onThemeChange} compact />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <div className="rounded-2xl border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                    Eingeloggt als{' '}
                    <span className="font-semibold text-[var(--pf-text)]">
                      {profile?.displayName || user.displayName || user.email}
                    </span>
                  </div>
                  <button type="button" onClick={onOpenDashboard} className="pf-button-ghost px-4 py-3">
                    Dashboard {unreadChatsCount > 0 ? <span className="ml-2 pf-badge-danger px-2 py-0.5 text-xs">{unreadChatsCount}</span> : null}
                  </button>
                  <button type="button" onClick={onSignOut} className="pf-button-secondary px-4 py-3">
                    Logout
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl pf-stat p-4">
                <p className="text-sm text-[var(--pf-muted)]">Teile insgesamt</p>
                <p className="mt-2 text-3xl font-black text-[var(--pf-text)]">{totalParts}</p>
              </div>
              <div className="rounded-3xl pf-stat p-4">
                <p className="text-sm text-[var(--pf-muted)]">Kategorien</p>
                <p className="mt-2 text-3xl font-black text-[var(--pf-text)]">{categories.length}</p>
              </div>
              <div className="rounded-3xl pf-stat p-4">
                <p className="text-sm text-[var(--pf-muted)]">Aktiver Filter</p>
                <p className="mt-2 text-3xl font-black text-[var(--pf-text)]">{selectedCategory}</p>
              </div>
              <div className="rounded-3xl pf-stat p-4">
                <p className="text-sm text-[var(--pf-muted)]">Verkäufer sichtbar</p>
                <p className="mt-2 text-3xl font-black text-[var(--pf-text)]">{sellerCount}</p>
              </div>
            </div>
          </header>

          <section className="mb-6 rounded-[2rem] pf-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[var(--pf-text)]">Kategorien</h2>
                <p className="text-sm text-[var(--pf-muted)]">
                  {categoriesLoading ? 'Kategorien werden geladen…' : 'Klickbare Filter aus Firestore.'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onSelectCategory('Alle')}
                className={`${selectedCategory === 'Alle' ? 'pf-chip-active' : 'pf-chip'} px-4 py-2 text-sm font-semibold transition`}
              >
                Alle
              </button>

              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => onSelectCategory(category)}
                  className={`${selectedCategory === category ? 'pf-chip-active' : 'pf-chip'} px-4 py-2 text-sm font-semibold transition`}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <aside>
              <AddPartForm
                categories={categories}
                onSubmit={onAddPart}
                onToast={onToast}
                editingPart={editingPart}
                onCancelEdit={onCancelEdit}
              />
            </aside>

            <section>
              {partsLoading ? (
                <div className="rounded-[2rem] pf-card p-8 text-center">
                  <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-2xl bg-[var(--pf-primary-soft)]" />
                  <p className="text-lg font-semibold text-[var(--pf-text)]">Teile werden geladen…</p>
                </div>
              ) : parts.length === 0 ? (
                <div className="rounded-[2rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-10 text-center">
                  <p className="text-lg font-semibold text-[var(--pf-text)]">Noch keine Treffer in dieser Kategorie.</p>
                  <p className="mt-2 text-sm text-[var(--pf-muted)]">
                    Veröffentliche links das erste Teil oder wähle einen anderen Filter.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                  {parts.map((part) => (
                    <PartCard
                      key={part.id}
                      part={part}
                      sellerProfile={profilesByUid[part.sellerUid]}
                      onOpenDetails={setSelectedPart}
                      isOwn={part.sellerUid === user.uid}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <PartDetailModal
        part={selectedPart}
        sellerProfile={selectedPart ? profilesByUid[selectedPart.sellerUid] : null}
        currentUser={user}
        onClose={() => setSelectedPart(null)}
        onStartChat={onStartChat}
        onEditPart={(part) => {
          onEditPart(part);
          setSelectedPart(null);
        }}
        onDeletePart={async (part) => {
          await onDeletePart(part);
          setSelectedPart(null);
        }}
      />
    </>
  );
}
