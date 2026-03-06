import { useMemo, useState } from 'react';
import AddPartForm from './AddPartForm';
import PartDetailModal from './PartDetailModal';
import ThemeSwitcher from './ThemeSwitcher';
import { currencyFormatter } from '../utils/format';

function PartCard({ part, onOpenDetails, isOwn, isFavorite, onToggleFavorite }) {
  const previewImage = part.imagesBase64?.[0] || part.imageBase64 || '';

  return (
    <div className="group relative overflow-hidden rounded-[1.5rem] pf-card">
      <button type="button" onClick={() => onToggleFavorite(part)} className="absolute right-3 top-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-sm text-white backdrop-blur-sm sm:bg-[var(--pf-surface)] sm:text-[var(--pf-text)]">
        {isFavorite ? '★' : '☆'}
      </button>

      <button type="button" onClick={() => onOpenDetails(part)} className="block w-full text-left">
        <div className="overflow-hidden border-b pf-divider bg-black/10">
          {previewImage ? (
            <img src={previewImage} alt={part.title} className="h-44 w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div className="flex h-44 items-center justify-center text-[var(--pf-muted)]">Kein Bild</div>
          )}
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 text-base font-bold text-[var(--pf-text)]">{part.title}</h3>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="rounded-full bg-[var(--pf-primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--pf-primary)]">
              {part.category}
            </span>
            <span className="text-lg font-black text-[var(--pf-text)]">{currencyFormatter.format(Number(part.price || 0))}</span>
          </div>
          {isOwn ? <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--pf-primary)]">Dein Inserat</p> : null}
        </div>
      </button>
    </div>
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
  favoritePartIds,
  onToggleFavorite,
}) {
  const [selectedPart, setSelectedPart] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const visibleParts = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();

    return parts.filter((part) => {
      const matchesSearch =
        needle.length === 0 ||
        [part.brand, part.model, part.title].some((value) => value?.toLowerCase().includes(needle));

      const matchesFavorites = !showOnlyFavorites || favoritePartIds.includes(part.id);

      return matchesSearch && matchesFavorites;
    });
  }, [favoritePartIds, parts, searchTerm, showOnlyFavorites]);

  return (
    <>
      <div className="pf-page">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-6 rounded-[1.75rem] pf-glass p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="pf-hero-badge px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">Geschützt</div>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--pf-text)] sm:text-3xl">PartFinder 🚗</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pf-muted)]">
                  Kompakter Marktplatz mit Suchfeld, Merkliste, mehreren Bildern und Detailansicht erst nach Klick.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
                <ThemeSwitcher value={theme} onChange={onThemeChange} compact />
                <button type="button" onClick={onOpenDashboard} className="pf-button-secondary px-4 py-2.5 text-sm">
                  Dashboard {unreadChatsCount > 0 ? <span className="ml-1 rounded-full bg-[var(--pf-danger)] px-2 py-0.5 text-[11px] text-white">{unreadChatsCount}</span> : null}
                </button>
                <button type="button" onClick={onSignOut} className="pf-button-secondary px-4 py-2.5 text-sm">
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="rounded-[1.25rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                Eingeloggt als <span className="font-semibold text-[var(--pf-text)]">{profile?.displayName || user.displayName || user.email}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-[44rem]">
                <div className="rounded-[1.25rem] pf-stat px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">Inserate</p>
                  <p className="mt-1 text-xl font-black text-[var(--pf-text)]">{totalParts}</p>
                </div>
                <div className="rounded-[1.25rem] pf-stat px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">Kategorien</p>
                  <p className="mt-1 text-xl font-black text-[var(--pf-text)]">{categories.length}</p>
                </div>
                <div className="rounded-[1.25rem] pf-stat px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--pf-muted)]">Merkliste</p>
                  <p className="mt-1 text-xl font-black text-[var(--pf-text)]">{favoritePartIds.length}</p>
                </div>
              </div>
            </div>
          </header>

          <section className="mb-5 rounded-[1.5rem] pf-card p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Suche nach Marke, Modell oder Titel …"
                className="pf-input px-4 py-3"
              />
              <button
                type="button"
                onClick={() => setShowOnlyFavorites((prev) => !prev)}
                className={`${showOnlyFavorites ? 'pf-button-primary text-sm' : 'pf-button-secondary text-sm'} px-4 py-3`}
              >
                {showOnlyFavorites ? 'Nur Merkliste aktiv' : 'Merkliste filtern'}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onSelectCategory('Alle')}
                className={`${selectedCategory === 'Alle' ? 'pf-chip-active' : 'pf-chip'} px-4 py-2 text-sm font-semibold`}
              >
                Alle
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => onSelectCategory(category)}
                  className={`${selectedCategory === category ? 'pf-chip-active' : 'pf-chip'} px-4 py-2 text-sm font-semibold`}
                >
                  {category}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-[var(--pf-muted)]">{categoriesLoading ? 'Kategorien werden geladen…' : `${visibleParts.length} Treffer sichtbar.`}</p>
          </section>

          <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
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
                <div className="rounded-[1.75rem] pf-card p-8 text-center">
                  <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-[var(--pf-primary-soft)]" />
                  <p className="text-lg font-semibold text-[var(--pf-text)]">Inserate werden geladen…</p>
                </div>
              ) : visibleParts.length === 0 ? (
                <div className="rounded-[1.75rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-10 text-center">
                  <p className="text-lg font-semibold text-[var(--pf-text)]">Keine passenden Inserate gefunden.</p>
                  <p className="mt-2 text-sm text-[var(--pf-muted)]">Passe Suche, Kategorie oder Merkliste-Filter an.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visibleParts.map((part) => (
                    <PartCard
                      key={part.id}
                      part={part}
                      onOpenDetails={setSelectedPart}
                      isOwn={part.sellerUid === user.uid}
                      isFavorite={favoritePartIds.includes(part.id)}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {selectedPart ? (
        <PartDetailModal
          part={selectedPart}
          sellerProfile={profilesByUid[selectedPart.sellerUid] || null}
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
          isFavorite={favoritePartIds.includes(selectedPart.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ) : null}
    </>
  );
}
