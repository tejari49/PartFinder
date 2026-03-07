import { useMemo, useState } from 'react';
import AddPartForm from './AddPartForm';
import PartDetailModal from './PartDetailModal';
import ThemeSwitcher from './ThemeSwitcher';
import { currencyFormatter } from '../utils/format';

function SmallStat({ label, value }) {
  return (
    <div className="rounded-[1.15rem] pf-stat px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--pf-muted)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--pf-text)]">{value}</p>
    </div>
  );
}

function ScopeTab({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'bg-[var(--pf-primary)] text-[#04111a]'
          : 'bg-[var(--pf-surface-2)] text-[var(--pf-text)] hover:bg-[var(--pf-surface-3)]'
      }`}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }) {
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

function PartCard({ part, onOpenDetails, isOwn, isFavorite, onToggleFavorite }) {
  const previewImage = part.imagesBase64?.[0] || part.imageBase64 || '';

  return (
    <div className="group relative overflow-hidden rounded-[1.35rem] pf-card">
      <button
        type="button"
        onClick={() => onToggleFavorite(part)}
        className="absolute right-3 top-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-sm text-white backdrop-blur-sm sm:bg-[var(--pf-surface)] sm:text-[var(--pf-text)]"
        aria-label={isFavorite ? 'Favorit entfernen' : 'Favorit speichern'}
      >
        {isFavorite ? '★' : '☆'}
      </button>

      <button type="button" onClick={() => onOpenDetails(part)} className="block w-full text-left">
        <div className="relative overflow-hidden border-b pf-divider bg-black/10">
          {previewImage ? (
            <img
              src={previewImage}
              alt={part.title}
              className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-40 items-center justify-center text-[var(--pf-muted)]">Kein Bild</div>
          )}

          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <StatusPill status={part.status || 'active'} />
            {isOwn ? (
              <span className="rounded-full bg-[var(--pf-primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#04111a]">
                Mein Inserat
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-bold text-[var(--pf-text)]">{part.title}</h3>
              <p className="mt-1 truncate text-sm text-[var(--pf-muted)]">
                {part.brand} • {part.model}
              </p>
            </div>
            <span className="shrink-0 text-lg font-black text-[var(--pf-text)]">
              {currencyFormatter.format(Number(part.price || 0))}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="rounded-full bg-[var(--pf-primary-soft)] px-3 py-1 font-semibold text-[var(--pf-primary)]">
              {part.category}
            </span>
            <span className="truncate text-[var(--pf-muted)]">{part.location || 'Ohne Standort'}</span>
          </div>
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
  onSetPartStatus,
  unreadChatsCount,
  theme,
  onThemeChange,
  favoritePartIds,
  onToggleFavorite,
}) {
  const [selectedPart, setSelectedPart] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [listingScope, setListingScope] = useState('all');
  const [sortMode, setSortMode] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const visibleParts = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);

    const next = parts.filter((part) => {
      const price = Number(part.price || 0);
      const matchesSearch =
        needle.length === 0 ||
        [part.brand, part.model, part.title].some((value) => value?.toLowerCase().includes(needle));
      const matchesFavorites = !showOnlyFavorites || favoritePartIds.includes(part.id);
      const matchesScope = listingScope !== 'mine' || part.sellerUid === user.uid;
      const matchesStatus = statusFilter === 'all' || (part.status || 'active') === statusFilter;
      const matchesMin = min === null || price >= min;
      const matchesMax = max === null || price <= max;

      return matchesSearch && matchesFavorites && matchesScope && matchesStatus && matchesMin && matchesMax;
    });

    next.sort((a, b) => {
      if (sortMode === 'price-asc') {
        return Number(a.price || 0) - Number(b.price || 0);
      }

      if (sortMode === 'price-desc') {
        return Number(b.price || 0) - Number(a.price || 0);
      }

      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

    return next;
  }, [
    favoritePartIds,
    listingScope,
    maxPrice,
    minPrice,
    parts,
    searchTerm,
    showOnlyFavorites,
    sortMode,
    statusFilter,
    user.uid,
  ]);

  const myPartsCount = useMemo(
    () => parts.filter((part) => part.sellerUid === user.uid).length,
    [parts, user.uid],
  );
  const soldCount = useMemo(
    () => parts.filter((part) => (part.status || 'active') === 'sold').length,
    [parts],
  );

  return (
    <>
      <div className="pf-page">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <header className="mb-6 rounded-[1.6rem] pf-glass p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="pf-hero-badge px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
                  Geschützt
                </div>
                <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--pf-text)] sm:text-3xl">
                  PartFinder 🚗
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pf-muted)]">
                  Kompakt, gefiltert und direkt auf Autoteile fokussiert. Vorschau zuerst, Details nach Klick.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
                <ThemeSwitcher value={theme} onChange={onThemeChange} compact />
                <button type="button" onClick={onOpenDashboard} className="pf-button-secondary px-4 py-2.5 text-sm">
                  Dashboard
                  {unreadChatsCount > 0 ? (
                    <span className="ml-2 rounded-full bg-[var(--pf-danger)] px-2 py-0.5 text-[11px] text-white">
                      {unreadChatsCount}
                    </span>
                  ) : null}
                </button>
                <button type="button" onClick={onSignOut} className="pf-button-secondary px-4 py-2.5 text-sm">
                  Logout
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="rounded-[1.15rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                Eingeloggt als{' '}
                <span className="font-semibold text-[var(--pf-text)]">
                  {profile?.displayName || user.displayName || user.email}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-4 xl:w-[50rem]">
                <SmallStat label="Inserate" value={totalParts} />
                <SmallStat label="Kategorien" value={categories.length} />
                <SmallStat label="Eigene" value={myPartsCount} />
                <SmallStat label="Verkauft" value={soldCount} />
              </div>
            </div>
          </header>

          <section className="mb-5 rounded-[1.45rem] pf-card p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Suche nach Marke, Modell oder Titel …"
                className="pf-input px-4 py-3"
              />

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="Preis ab"
                  className="pf-input px-4 py-3"
                />
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="Preis bis"
                  className="pf-input px-4 py-3"
                />
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="pf-select px-4 py-3">
                  <option value="newest">Neueste zuerst</option>
                  <option value="price-asc">Preis günstig → teuer</option>
                  <option value="price-desc">Preis teuer → günstig</option>
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="pf-select px-4 py-3">
                  <option value="all">Alle Status</option>
                  <option value="active">Nur aktiv</option>
                  <option value="sold">Nur verkauft</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ScopeTab active={listingScope === 'all'} onClick={() => setListingScope('all')}>
                Alle Inserate
              </ScopeTab>
              <ScopeTab active={listingScope === 'mine'} onClick={() => setListingScope('mine')}>
                Meine Inserate
              </ScopeTab>
              <ScopeTab active={showOnlyFavorites} onClick={() => setShowOnlyFavorites((prev) => !prev)}>
                {showOnlyFavorites ? 'Merkliste aktiv' : 'Nur Merkliste'}
              </ScopeTab>
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

            <p className="mt-3 text-xs text-[var(--pf-muted)]">
              {categoriesLoading ? 'Kategorien werden geladen…' : `${visibleParts.length} Treffer sichtbar.`}
            </p>
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
                  <p className="mt-2 text-sm text-[var(--pf-muted)]">
                    Passe Suche, Preisbereich, Status oder Kategorie an.
                  </p>
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
          onSetPartStatus={onSetPartStatus}
          isFavorite={favoritePartIds.includes(selectedPart.id)}
          onToggleFavorite={onToggleFavorite}
        />
      ) : null}
    </>
  );
}
