import AddPartForm from './AddPartForm';

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
});

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.();

  if (!date) {
    return 'Gerade eben';
  }

  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

function PartCard({ part }) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-400/30">
      <div className="relative overflow-hidden border-b border-white/10 bg-slate-950/60">
        <img
          src={part.imageBase64}
          alt={part.title}
          className="h-56 w-full object-cover transition duration-500 group-hover:scale-[1.02]"
        />
        <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-slate-950/80 px-3 py-1 text-xs font-semibold text-cyan-300 backdrop-blur">
          {part.category}
        </span>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              {part.brand} • {part.model}
            </p>
            <h3 className="mt-2 text-lg font-bold text-white">{part.title}</h3>
          </div>
          <span className="rounded-2xl bg-cyan-400 px-3 py-2 text-sm font-black text-slate-950">
            {currencyFormatter.format(Number(part.price || 0))}
          </span>
        </div>

        <p className="line-clamp-3 text-sm leading-6 text-slate-300">{part.description}</p>

        <div className="mt-5 grid gap-2 text-sm text-slate-300">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2">
            <span>Zustand</span>
            <span className="font-medium text-white">{part.condition}</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2">
            <span>Verkäufer</span>
            <span className="truncate font-medium text-white">{part.sellerEmail || 'Unbekannt'}</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/45 px-3 py-2">
            <span>Erstellt</span>
            <span className="font-medium text-white">{formatDate(part.createdAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Marketplace({
  user,
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
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.14),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(96,165,250,0.16),_transparent_25%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Geschützt durch Firebase Auth
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                PartFinder 🚗
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Moderner Autoteile-Marktplatz mit dynamischen Kategorien, Firestore Sync und clientseitiger Bildkompression.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Eingeloggt als <span className="font-semibold text-white">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-2xl border border-white/10 bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Teile insgesamt</p>
              <p className="mt-2 text-3xl font-black text-white">{totalParts}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Kategorien</p>
              <p className="mt-2 text-3xl font-black text-white">{categories.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-slate-400">Aktiver Filter</p>
              <p className="mt-2 text-3xl font-black text-white">{selectedCategory}</p>
            </div>
          </div>
        </header>

        <section className="mb-6 rounded-[2rem] border border-white/10 bg-slate-900/60 p-5 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">Kategorien</h2>
              <p className="text-sm text-slate-300">
                {categoriesLoading ? 'Kategorien werden geladen…' : 'Klickbare Filter aus Firestore.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onSelectCategory('Alle')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                selectedCategory === 'Alle'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
              }`}
            >
              Alle
            </button>

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => onSelectCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category
                    ? 'bg-cyan-400 text-slate-950'
                    : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside>
            <AddPartForm categories={categories} onSubmit={onAddPart} onToast={onToast} />
          </aside>

          <section>
            {partsLoading ? (
              <div className="rounded-[2rem] border border-white/10 bg-slate-900/60 p-8 text-center shadow-2xl backdrop-blur-xl">
                <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-2xl bg-cyan-400/20" />
                <p className="text-lg font-semibold text-white">Teile werden geladen…</p>
              </div>
            ) : parts.length === 0 ? (
              <div className="rounded-[2rem] border border-dashed border-white/15 bg-slate-900/50 p-10 text-center shadow-2xl backdrop-blur-xl">
                <p className="text-lg font-semibold text-white">Noch keine Treffer in dieser Kategorie.</p>
                <p className="mt-2 text-sm text-slate-300">
                  Veröffentliche links das erste Teil oder wähle einen anderen Filter.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 2xl:grid-cols-3">
                {parts.map((part) => (
                  <PartCard key={part.id} part={part} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
