import { useEffect, useMemo, useState } from 'react';
import AddPartForm from './AddPartForm';
import LanguageSwitcher from './LanguageSwitcher';
import PartDetailModal from './PartDetailModal';
import ThemeSwitcher from './ThemeSwitcher';
import { currencyFormatter } from '../utils/format';
import { buildPartSearchText, matchesSearchQuery } from '../utils/searchIndex';

const text = {
  en: {
    sold: 'Sold',
    reserved: 'Reserved',
    active: 'Active',
    myListing: 'My listing',
    noImage: 'No image',
    noLocation: 'No location',
    verified: 'Verified',
    emailVerified: 'Email verified',
    phoneVerified: 'Phone verified',
    documentVerified: 'Document verified',
    noRatings: 'No ratings yet',
    soldCount: (count) => `${count} sold`,
    all: 'All',
    allListings: 'All listings',
    myListings: 'My listings',
    favoritesOnly: 'Favorites only',
    favoritesOn: 'Favorites on',
    activeOnly: 'Active only',
    reservedOnly: 'Reserved only',
    soldOnly: 'Sold only',
    minPrice: 'Min price',
    maxPrice: 'Max price',
    newest: 'Newest first',
    priceAsc: 'Price low to high',
    priceDesc: 'Price high to low',
    allStatuses: 'All statuses',
    categories: 'Categories',
    loadingCategories: 'Loading categories...',
    resultsVisible: (count) => `${count} results visible.`,
    reset: 'Reset',
    secure: 'Secure',
    subtitle: 'Compact, filtered, and focused on auto parts. Preview first, details on click.',
    dashboard: 'Dashboard',
    signOut: 'Sign out',
    installTitle: 'Install app',
    installHint: 'Install PartFinder for quicker launch and app-like usage.',
    installAction: 'Install',
    installLater: 'Later',
    signedInAs: 'Signed in as',
    listings: 'Listings',
    mine: 'Mine',
    searchPlaceholder: 'Search by brand, model, OEM, or engine code...',
    results: (count) => `${count} results`,
    noActiveFilters: 'No active filters',
    loadingListings: 'Loading listings...',
    noResults: 'No matching listings found.',
    noResultsHintMobile: 'Check filters and categories, or create your first listing from the bottom bar.',
    noResultsHintDesktop: 'Adjust search, price range, status, or category.',
    mobileTip: 'Tip: Categories are shown in a separate tab so the mobile home view stays compact.',
    filters: 'Filters',
    categoriesTab: 'Categories',
    edit: 'Edit',
    listing: 'Listing',
    fromEur: (value) => `from ${value} EUR`,
    toEur: (value) => `to ${value} EUR`,
    contacts: (count) => `${count} contacts`,
  },
  de: {
    sold: 'Verkauft',
    reserved: 'Reserviert',
    active: 'Aktiv',
    myListing: 'Mein Inserat',
    noImage: 'Kein Bild',
    noLocation: 'Ohne Standort',
    verified: 'Verifiziert',
    emailVerified: 'E-Mail verifiziert',
    phoneVerified: 'Telefon verifiziert',
    documentVerified: 'Dokument verifiziert',
    noRatings: 'Noch keine Bewertung',
    soldCount: (count) => `${count} verkauft`,
    all: 'Alle',
    allListings: 'Alle Inserate',
    myListings: 'Meine Inserate',
    favoritesOnly: 'Nur Merkliste',
    favoritesOn: 'Merkliste aktiv',
    activeOnly: 'Nur aktiv',
    reservedOnly: 'Nur reserviert',
    soldOnly: 'Nur verkauft',
    minPrice: 'Preis ab',
    maxPrice: 'Preis bis',
    newest: 'Neueste zuerst',
    priceAsc: 'Preis guenstig zu teuer',
    priceDesc: 'Preis teuer zu guenstig',
    allStatuses: 'Alle Status',
    categories: 'Kategorien',
    loadingCategories: 'Kategorien werden geladen...',
    resultsVisible: (count) => `${count} Treffer sichtbar.`,
    reset: 'Zuruecksetzen',
    secure: 'Geschuetzt',
    subtitle: 'Kompakt, gefiltert und direkt auf Autoteile fokussiert. Vorschau zuerst, Details nach Klick.',
    dashboard: 'Dashboard',
    signOut: 'Logout',
    installTitle: 'App installieren',
    installHint: 'Installiere PartFinder fuer schnelleren Start und App-Feeling.',
    installAction: 'Installieren',
    installLater: 'Spaeter',
    signedInAs: 'Eingeloggt als',
    listings: 'Inserate',
    mine: 'Eigene',
    searchPlaceholder: 'Suche nach Marke, Modell, OEM oder Motorcode...',
    results: (count) => `${count} Treffer`,
    noActiveFilters: 'Keine aktiven Filter',
    loadingListings: 'Inserate werden geladen...',
    noResults: 'Keine passenden Inserate gefunden.',
    noResultsHintMobile: 'Pruefe Filter und Kategorien oder erstelle dein erstes Inserat.',
    noResultsHintDesktop: 'Passe Suche, Preisbereich, Status oder Kategorie an.',
    mobileTip: 'Tipp: Kategorien sind unten separat, damit die Startseite kompakt bleibt.',
    filters: 'Filter',
    categoriesTab: 'Kategorien',
    edit: 'Bearbeiten',
    listing: 'Inserat',
    fromEur: (value) => `ab ${value} EUR`,
    toEur: (value) => `bis ${value} EUR`,
    contacts: (count) => `${count} Kontakte`,
  },
};

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

function StatusPill({ status, t }) {
  if (status === 'sold') {
    return (
      <span className="rounded-full bg-[var(--pf-danger)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
        {t.sold}
      </span>
    );
  }

  if (status === 'reserved') {
    return (
      <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-300">
        {t.reserved}
      </span>
    );
  }

  return (
    <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-400">
      {t.active}
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

function PartCard({ part, onOpenDetails, isOwn, isFavorite, onToggleFavorite, sellerTrust, sellerHistory, t, language }) {
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
        aria-label={isFavorite ? 'remove-favorite' : 'save-favorite'}
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
            <div className="flex h-40 items-center justify-center text-[var(--pf-muted)]">{t.noImage}</div>
          )}

          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <StatusPill status={part.status || 'active'} t={t} />
            {isOwn ? (
              <span className="rounded-full bg-[var(--pf-primary)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#04111a]">
                {t.myListing}
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
              {currencyFormatter.format(Number(part.price || 0), language)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="rounded-full bg-[var(--pf-primary-soft)] px-3 py-1 font-semibold text-[var(--pf-primary)]">
              {part.category}
            </span>
            <span className="truncate text-[var(--pf-muted)]">{part.location || t.noLocation}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--pf-muted)]">
            {sellerTrust?.verified ? (
              <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-300">
                {t.verified}
              </span>
            ) : null}
            {sellerTrust?.verification?.email ? (
              <span className="rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-2 py-1">{t.emailVerified}</span>
            ) : null}
            {sellerTrust?.verification?.phone ? (
              <span className="rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-2 py-1">{t.phoneVerified}</span>
            ) : null}
            {sellerTrust?.verification?.document ? (
              <span className="rounded-full border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-2 py-1">{t.documentVerified}</span>
            ) : null}
            <span>{ratingCount > 0 ? `${average.toFixed(1)} / 5 (${ratingCount})` : t.noRatings}</span>
            <span>{t.soldCount(soldCount)}</span>
            {sellerHistory?.contactCount ? <span>{t.contacts(sellerHistory.contactCount)}</span> : null}
          </div>
        </div>
      </button>
    </div>
  );
}

export default function Marketplace({
  language = 'en',
  onLanguageChange,
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
  sellerHistoryByUid,
  onSubmitRating,
  onSubmitReport,
  installAvailable,
  onInstallApp,
  onDismissInstallHint,
}) {
  const t = language === 'de' ? text.de : text.en;
  const [selectedPart, setSelectedPart] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [listingScope, setListingScope] = useState('all');
  const [sortMode, setSortMode] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [mobileSection, setMobileSection] = useState('list');
  const logoSrc = `${import.meta.env.BASE_URL}partfinder-icon.png`;

  useEffect(() => {
    if (editingPart) {
      setMobileSection('sell');
    }
  }, [editingPart]);

  const visibleParts = useMemo(() => {
    const needle = searchTerm.trim();
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);

    const next = parts.filter((part) => {
      const price = Number(part.price || 0);
      const searchText = part.searchIndexText || buildPartSearchText(part);
      const matchesSearch = matchesSearchQuery(searchText, needle);
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
    if (selectedCategory !== 'all') count += 1;
    return count;
  }, [listingScope, maxPrice, minPrice, selectedCategory, showOnlyFavorites, sortMode, statusFilter]);

  const activeMobileSummary = useMemo(() => {
    const tags = [];

    if (selectedCategory !== 'all') tags.push(selectedCategory);
    if (listingScope === 'mine') tags.push(t.myListings);
    if (showOnlyFavorites) tags.push(t.favoritesOnly);
    if (statusFilter === 'active') tags.push(t.activeOnly);
    if (statusFilter === 'reserved') tags.push(t.reservedOnly);
    if (statusFilter === 'sold') tags.push(t.soldOnly);
    if (minPrice !== '') tags.push(t.fromEur(minPrice));
    if (maxPrice !== '') tags.push(t.toEur(maxPrice));

    return tags;
  }, [listingScope, maxPrice, minPrice, selectedCategory, showOnlyFavorites, statusFilter, t]);

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
          <p className="text-lg font-semibold text-[var(--pf-text)]">{t.loadingListings}</p>
        </div>
      );
    }

    if (visibleParts.length === 0) {
      return (
        <div className="rounded-[1.75rem] border border-dashed border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] p-8 text-center sm:p-10">
          <p className="text-lg font-semibold text-[var(--pf-text)]">{t.noResults}</p>
          <p className="mt-2 text-sm text-[var(--pf-muted)]">
            {isMobile ? t.noResultsHintMobile : t.noResultsHintDesktop}
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
            sellerHistory={sellerHistoryByUid[part.sellerUid]}
            t={t}
            language={language}
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
          placeholder={t.minPrice}
          className="pf-input px-4 py-3"
        />
        <input
          type="number"
          min="0"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.target.value)}
          placeholder={t.maxPrice}
          className="pf-input px-4 py-3"
        />
        <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} className="pf-select px-4 py-3">
          <option value="newest">{t.newest}</option>
          <option value="price-asc">{t.priceAsc}</option>
          <option value="price-desc">{t.priceDesc}</option>
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="pf-select px-4 py-3">
          <option value="all">{t.allStatuses}</option>
          <option value="active">{t.activeOnly}</option>
          <option value="reserved">{t.reservedOnly}</option>
          <option value="sold">{t.soldOnly}</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <ScopeTab active={listingScope === 'all'} onClick={() => setListingScope('all')}>
          {t.allListings}
        </ScopeTab>
        <ScopeTab active={listingScope === 'mine'} onClick={() => setListingScope('mine')}>
          {t.myListings}
        </ScopeTab>
        <ScopeTab active={showOnlyFavorites} onClick={() => setShowOnlyFavorites((prev) => !prev)}>
          {showOnlyFavorites ? t.favoritesOn : t.favoritesOnly}
        </ScopeTab>
      </div>
    </div>
  );

  const renderCategoryControls = (framed = true) => (
    <div className={framed ? 'rounded-[1.45rem] pf-card p-4' : ''}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--pf-text)]">{t.categories}</p>
          <p className="mt-1 text-xs text-[var(--pf-muted)]">
            {categoriesLoading ? t.loadingCategories : t.resultsVisible(visibleParts.length)}
          </p>
        </div>
        {selectedCategory !== 'all' ? (
          <button type="button" onClick={() => handleCategorySelect('all')} className="pf-button-secondary px-3 py-2 text-xs">
            {t.reset}
          </button>
        ) : null}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 pf-scroll xl:flex-wrap xl:overflow-visible">
        <button
          type="button"
          onClick={() => handleCategorySelect('all')}
          className={`${selectedCategory === 'all' ? 'pf-chip-active' : 'pf-chip'} shrink-0 px-4 py-2 text-sm font-semibold`}
        >
          {t.all}
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
          <header className="mb-6 rounded-[1.9rem] pf-glass pf-market-hero p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative z-[1]">
                <div className="pf-hero-badge px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]">
                  {t.secure}
                </div>
                <div className="mt-3 flex items-center gap-4 sm:gap-5">
                  <div className="pf-logo-frame p-1.5">
                    <img
                      src={logoSrc}
                      alt="PartFinder"
                      className="h-24 w-24 rounded-[1.1rem] object-cover sm:h-28 sm:w-28"
                    />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-[var(--pf-text)] sm:text-4xl">PartFinder</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pf-muted)]">{t.subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="relative z-[1] flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
                <LanguageSwitcher value={language} onChange={onLanguageChange} />
                <ThemeSwitcher value={theme} onChange={onThemeChange} compact />
                <button type="button" onClick={onOpenDashboard} className="pf-button-secondary px-4 py-2.5 text-sm">
                  {t.dashboard}
                  {unreadChatsCount > 0 ? (
                    <span className="ml-2 rounded-full bg-[var(--pf-danger)] px-2 py-0.5 text-[11px] text-white">
                      {unreadChatsCount}
                    </span>
                  ) : null}
                </button>
                <button type="button" onClick={onSignOut} className="pf-button-secondary px-4 py-2.5 text-sm">
                  {t.signOut}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {installAvailable ? (
                <div className="rounded-[1.15rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--pf-text)]">{t.installTitle}</p>
                  <p className="mt-1 text-sm text-[var(--pf-muted)]">{t.installHint}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={onInstallApp} className="pf-button-primary px-4 py-2 text-sm">
                      {t.installAction}
                    </button>
                    <button type="button" onClick={onDismissInstallHint} className="pf-button-secondary px-4 py-2 text-sm">
                      {t.installLater}
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-[1.15rem] border border-[color:var(--pf-border)] bg-[var(--pf-surface-2)] px-4 py-3 text-sm text-[var(--pf-muted)]">
                {t.signedInAs}{' '}
                <span className="font-semibold text-[var(--pf-text)]">
                  {profile?.displayName || user.displayName || user.email}
                </span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 pf-scroll">
                <CompactStat label={t.listings} value={totalParts} />
                <CompactStat label={t.categories} value={categories.length} />
                <CompactStat label={t.mine} value={myPartsCount} />
                <CompactStat label={t.sold} value={soldCount} />
              </div>
            </div>
          </header>

          <section className="mb-5 rounded-[1.45rem] pf-card p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t.searchPlaceholder}
                className="pf-input px-4 py-3"
              />

              <div className="hidden xl:block">{renderFilterControls(false)}</div>
            </div>

            <div className="mt-4 hidden xl:block">{renderCategoryControls(false)}</div>

            <div className="mt-4 xl:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1 pf-scroll">
                <span className="shrink-0 rounded-full bg-[var(--pf-primary-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--pf-primary)]">
                  {t.results(visibleParts.length)}
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
                    {t.noActiveFilters}
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
                  {t.mobileTip}
                </div>
              </section>
            ) : null}

            {mobileSection === 'categories' ? <section>{renderCategoryControls()}</section> : null}

            {mobileSection === 'sell' ? (
              <section>
                <AddPartForm
                  language={language}
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
                language={language}
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
            <MobileNavButton active={mobileSection === 'list'} label={t.listings} badge={visibleParts.length} onClick={() => setMobileSection('list')} />
            <MobileNavButton
              active={mobileSection === 'filters'}
              label={t.filters}
              badge={activeFilterCount || undefined}
              onClick={() => setMobileSection('filters')}
            />
            <MobileNavButton
              active={mobileSection === 'categories'}
              label={t.categoriesTab}
              badge={selectedCategory === 'all' ? undefined : '1'}
              onClick={() => setMobileSection('categories')}
            />
            <MobileNavButton
              active={mobileSection === 'sell'}
              label={editingPart ? t.edit : t.listing}
              onClick={() => setMobileSection('sell')}
            />
          </div>
        </div>
      </div>

      {selectedPart ? (
        <PartDetailModal
          language={language}
          part={selectedPart}
          sellerProfile={profilesByUid[selectedPart.sellerUid] || null}
          sellerTrust={sellerTrustByUid[selectedPart.sellerUid] || null}
          sellerHistory={sellerHistoryByUid[selectedPart.sellerUid] || null}
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
