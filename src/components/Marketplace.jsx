import { useEffect, useMemo, useState } from 'react';
import AddPartForm from './AddPartForm';
import PartDetailModal from './PartDetailModal';
import ThemeSwitcher from './ThemeSwitcher';
import { currencyFormatter } from '../utils/format';

function CompactStat({ label, value }) {
  return (
    <div className="shrink-0 rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--pf-muted)]">{label}</span>
        <span className="text-sm font-black text-[var(--pf-text)]">{value}</span>
      </div>
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
  if (status === 'sold') {
    return (
      <span className="rounded-full bg-[var(--pf-danger)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
        Sold
      </span>
    );
  }

  if (status === 'reserved') {
    return (
      <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
        Reserved
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
      Active
    </span>
  );
}

function MobileNavButton({ active, label, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-[1.15rem] px-3 py-2 text-[11px] font-semibold transition ${
        active
          ? 'bg-[var(--pf-primary)] text-[#04111a]'
          : 'bg-transparent text-[var(--pf-muted)] hover:bg-[var(--pf-surface-2)] hover:text-[var(--pf-text)]'
      }`}
    >
      <span className="truncate">{label}</span>
      {badge ? (
        <span
          className={`mt-1 rounded-full px-2 py-0.5 text-[10px] ${
            active ? 'bg-white/25 text-[#04111a]' : 'bg-[var(--pf-surface-2)] text-[var(--pf-text)]'
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function PartCard({ part, onOpenDetails, isOwn, isFavorite, onToggleFavorite, sellerTrust }) {
  const previewImage = part.imagesBase64?.[0] || part.imageBase64 || '';
  const average = sellerTrust?.ratingAverage || 0;
  const ratingCount = sellerTrust?.ratingCount || 0;
  const soldCount = sellerTrust?.soldCount || 0;

  return (
    <div className="group relative overflow-hidden rounded-[1.35rem] pf-card">
      <button
        type="button"
        onClick={() => onToggleFavorite(part)}
        className="absolute right-3 top-3 z-10 rounded-full bg-black/55 px-2.5 py-1 text-sm text-white backdrop-blur-sm sm:bg-[var(--pf-surface)] sm:text-[var(--pf-text)]"
        aria-label={isFavorite ? 'Remove favorite' : 'Save favorite'}
      >
        {isFavorite ? '*' : '+'}
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
            <div className="flex h-40 items-center justify-center text-[var(--pf-muted)]">No image</div>
          )}

          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <StatusPill status={part.status || 'active'} />
            {isOwn ? (
              <span className="rounded-full bg-[var(--pf-primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#04111a]">
                My listing
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-bold text-[var(--pf-text)]">{part.title}</h3>
              <p className="mt-1 truncate text-sm text-[var(--pf-muted)]">
                {part.brand} / {part.model}
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
            <span className="truncate text-[var(--pf-muted)]">{part.location || 'No location'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--pf-muted)]">
            {sellerTrust?.verified ? (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-300">
                Verified
              </span>
            ) : null}
            <span>{ratingCount > 0 ? `${average.toFixed(1)} / 5 (${ratingCount})` : 'No ratings yet'}</span>
            <span>{`${soldCount} sold`}</span>
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
  myPartsCount,
  soldCount,
  sellerTrustByUid,
  onSubmitRating,
  onSubmitReport,
}) {
  const [selectedPart, setSelectedPart] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [listingScope, setListingScope] = useState('all');
  const [sortMode, setSortMode] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [mobileSection, setMobileSection] = useState('list');
  const logoSrc = `${import.meta.env.BASE_URL}partfinder-logo.svg`;

  useEffect(() => {
    if (editingPart) {
      setMobileSection('sell');
    }
  }, [editingPart]);

  const visibleParts = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);

    const next = parts.filter((part) => {
      const price = Number(part.price || 0);
      const matchesSearch =
        needle.length === 0 ||
        [
          part.brand,
          part.model,
          part.title,
          part.oemNumber,
          part.engineCode,
          part.vehicleGeneration,
          part.description,
        ].some((value) => value?.toLowerCase().includes(needle));
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

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (listingScope === 'mine') count += 1;
    if (showOnlyFavorites) count += 1;
    if (statusFilter !== 'all') count += 1;
    if (minPrice !== '') count += 1;
    if (maxPrice !== '') count += 1;
    if (sortMode !== 'newest') count += 1;
    if (selectedCategory !== 'All') count += 1;

    return count;
  }, [listingScope, maxPrice, minPrice, selectedCategory, showOnlyFavorites, sortMode, statusFilter]);

  const activeMobileSummary = useMemo(() => {
    const tags = [];

    if (selectedCategory !== 'All') tags.push(selectedCategory);
    if (listingScope === 'mine') tags.push('My listings');
    if (showOnlyFavorites) tags.push('Favorites');
    if (statusFilter === 'active') tags.push('Active only');
    if (statusFilter === 'reserved') tags.push('Reserved only');
    if (statusFilter === 'sold') tags.push('Sold only');
    if (minPrice !== '') tags.push(`from ${minPrice} EUR`);
    if (maxPrice !== '') tags.push(`to ${maxPrice} EUR`);

    return tags;
  }, [listingScope, maxPrice, minPrice, selectedCategory, showOnlyFavorites, statusFilter]);

  const handleCategorySelect = (category) => {
    onSelectCategory(category);
    setMobileSection('list');
  };

  const handleCancelEdit = () => {
    onCancelEdit();
    setMobileSection('list');
  };

  const renderResults = (isMobile = false) => {
    if (partsLoading) {
      return (
        <div className="rounded-[1.75rem] pf-card p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-[var(--pf-primary-soft)]" />
          <p className="text-lg font-semibold text-[var(--pf-text)]">Loading listings...</p>
        </div>
      );
    }

    if (visibleParts.length === 0) {
      return (
        <div className="rounded-[1.75rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-8 text-center sm:p-10">
          <p className="text-lg font-semibold text-[var(--pf-text)]">No matching listings found.</p>
          <p className="mt-2 text-sm text-[var(--pf-muted)]">
            {isMobile
              ? 'Check filters and categories, or create your first listing from the bottom bar.'
              : 'Adjust search, price range, status, or category.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleParts.map((part) => (
          <PartCard
            key={part.id}
            part={part}
            onOpenDetails={setSelectedPart}
            isOwn={part.sellerUid === user.uid}
            isFavorite={favoritePartIds.includes(part.id)}
            onToggleFavorite={onToggleFavorite}
            sellerTrust={sellerTrustByUid[part.sellerUid]}
          />
        ))}
      </div>
    );
  };

  const renderFilterControls = (framed = true) => (
    <div className={framed ? 'rounded-[1.45rem] pf-card p-4' : ''}>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="number"
          min="0"
          value={minPrice}
          onChange={(event) => setMinPrice(event.target.value)}
          placeholder="Min price"
          className="pf-input px-4 py-3"
        />
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          placeholder="Max price"
          className="pf-input px-4 py-3"
        />
        <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="pf-select px-4 py-3">
          <option value="newest">Newest first</option>
          <option value="price-asc">Price low to high</option>
          <option value="price-desc">Price high to low</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="pf-select px-4 py-3">
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="reserved">Reserved only</option>
          <option value="sold">Sold only</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ScopeTab active={listingScope === 'all'} onClick={() => setListingScope('all')}>
          All listings
        </ScopeTab>
        <ScopeTab active={listingScope === 'mine'} onClick={() => setListingScope('mine')}>
          My listings
        </ScopeTab>
        <ScopeTab active={showOnlyFavorites} onClick={() => setShowOnlyFavorites((prev) => !prev)}>
          {showOnlyFavorites ? 'Favorites on' : 'Favorites only'}
        </ScopeTab>
      </div>
    </div>
  );

  const renderCategoryControls = (framed = true) => (
    <div className={framed ? 'rounded-[1.45rem] pf-card p-4' : ''}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--pf-text)]">Categories</p>
          <p className="mt-1 text-xs text-[var(--pf-muted)]">
            {categoriesLoading ? 'Loading categories...' : `${visibleParts.length} results visible.`}
          </p>
        </div>
        {selectedCategory !== 'All' ? (
          <button type="button" onClick={() => handleCategorySelect('All')} className="pf-button-secondary px-3 py-2 text-xs">
            Reset
          </button>
        ) : null}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 pf-scroll xl:flex-wrap xl:overflow-visible">
        <button
          type="button"
          onClick={() => handleCategorySelect('All')}
          className={`${selectedCategory === 'All' ? 'pf-chip-active' : 'pf-chip'} shrink-0 px-4 py-2 text-sm font-semibold`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => handleCategorySelect(category)}
            className={`${selectedCategory === category ? 'pf-chip-active' : 'pf-chip'} shrink-0 px-4 py-2 text-sm font-semibold`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="pf-page">
        <div className="mx-auto max-w-7xl px-4 py-4 pb-28 sm:px-6 lg:px-8 xl:pb-8">
          <header className="mb-6 rounded-[1.6rem] pf-glass p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="pf-hero-badge px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
                  Secure
                </div>
                <img src={logoSrc} alt="PartFinder" className="mt-3 h-auto w-full max-w-[15rem] sm:max-w-[18rem]" />
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pf-muted)]">
                  Compact, filtered, and focused on auto parts. Preview first, details on click.
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
                  Sign out
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-[1.15rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                Signed in as{' '}
                <span className="font-semibold text-[var(--pf-text)]">
                  {profile?.displayName || user.displayName || user.email}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 pf-scroll">
                <CompactStat label="Listings" value={totalParts} />
                <CompactStat label="Categories" value={categories.length} />
                <CompactStat label="Mine" value={myPartsCount} />
                <CompactStat label="Sold" value={soldCount} />
              </div>
            </div>
          </header>

          <section className="mb-5 rounded-[1.45rem] pf-card p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by brand, model, OEM, or engine code..."
                className="pf-input px-4 py-3"
              />

              <div className="hidden xl:block">{renderFilterControls(false)}</div>
            </div>

            <div className="mt-4 hidden xl:block">{renderCategoryControls(false)}</div>

            <div className="mt-4 xl:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1 pf-scroll">
                <span className="shrink-0 rounded-full bg-[var(--pf-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-primary)]">
                  {visibleParts.length} results
                </span>
                {activeMobileSummary.length > 0 ? (
                  activeMobileSummary.map((item) => (
                    <span
                      key={item}
                      className="shrink-0 rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-text)]"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="shrink-0 rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-muted)]">
                    No active filters
                  </span>
                )}
              </div>
            </div>
          </section>

          <div className="xl:hidden">
            {mobileSection === 'list' ? (
              <section>{renderResults(true)}</section>
            ) : null}

            {mobileSection === 'filters' ? (
              <section className="space-y-4">
                {renderFilterControls()}
                <div className="rounded-[1.45rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                  Tip: Categories are shown in a separate tab so the mobile home view stays compact.
                </div>
              </section>
            ) : null}

            {mobileSection === 'categories' ? <section>{renderCategoryControls()}</section> : null}

            {mobileSection === 'sell' ? (
              <section>
                <AddPartForm
                  categories={categories}
                  onSubmit={onAddPart}
                  onToast={onToast}
                  editingPart={editingPart}
                  onCancelEdit={handleCancelEdit}
                />
              </section>
            ) : null}
          </div>

          <div className="hidden gap-5 xl:grid xl:grid-cols-[360px_minmax(0,1fr)]">
            <aside>
              <AddPartForm
                categories={categories}
                onSubmit={onAddPart}
                onToast={onToast}
                editingPart={editingPart}
                onCancelEdit={handleCancelEdit}
              />
            </aside>

            <section>{renderResults()}</section>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--pf-border)] bg-[var(--pf-surface)] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl xl:hidden">
          <div className="mx-auto flex max-w-7xl gap-2 rounded-[1.5rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface)] p-2 shadow-[0_-16px_48px_rgba(0,0,0,0.32)]">
            <MobileNavButton active={mobileSection === 'list'} label="Listings" badge={visibleParts.length} onClick={() => setMobileSection('list')} />
            <MobileNavButton
              active={mobileSection === 'filters'}
              label="Filters"
              badge={activeFilterCount || undefined}
              onClick={() => setMobileSection('filters')}
            />
            <MobileNavButton
              active={mobileSection === 'categories'}
              label="Categories"
              badge={selectedCategory === 'All' ? undefined : '1'}
              onClick={() => setMobileSection('categories')}
            />
            <MobileNavButton
              active={mobileSection === 'sell'}
              label={editingPart ? 'Edit' : 'Listing'}
              onClick={() => setMobileSection('sell')}
            />
          </div>
        </div>
      </div>

      {selectedPart ? (
        <PartDetailModal
          part={selectedPart}
          sellerProfile={profilesByUid[selectedPart.sellerUid] || null}
          sellerTrust={sellerTrustByUid[selectedPart.sellerUid] || null}
          currentUser={user}
          onClose={() => setSelectedPart(null)}
          onStartChat={onStartChat}
          onEditPart={(item) => {
            onEditPart(item);
            setSelectedPart(null);
            setMobileSection('sell');
          }}
          onDeletePart={async (item) => {
            await onDeletePart(item);
            setSelectedPart(null);
          }}
          onSetPartStatus={onSetPartStatus}
          isFavorite={favoritePartIds.includes(selectedPart.id)}
          onToggleFavorite={onToggleFavorite}
          onSubmitRating={onSubmitRating}
          onSubmitReport={onSubmitReport}
        />
      ) : null}
    </>
  );
}
