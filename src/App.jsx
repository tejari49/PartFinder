import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import Auth from './components/Auth';
import Marketplace from './components/Marketplace';
import Toast from './components/Toast';

const normalizeCategoryName = (value = '') =>
  value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const slugify = (value = '') =>
  value
    .trim()
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setParts([]);
      setCategories([]);
      setSelectedCategory('Alle');
      setPartsLoading(false);
      setCategoriesLoading(false);
      return undefined;
    }

    setCategoriesLoading(true);

    const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const nextCategories = snapshot.docs
          .map((item) => item.data().name)
          .filter(Boolean);

        setCategories(nextCategories);
        setCategoriesLoading(false);
      },
      (error) => {
        console.error(error);
        pushToast('Kategorien konnten nicht geladen werden.', 'error');
        setCategoriesLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, pushToast]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    setPartsLoading(true);

    const partsQuery = query(collection(db, 'parts'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      partsQuery,
      (snapshot) => {
        const nextParts = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setParts(nextParts);
        setPartsLoading(false);
      },
      (error) => {
        console.error(error);
        pushToast('Teile konnten nicht geladen werden.', 'error');
        setPartsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, pushToast]);

  const filteredParts = useMemo(() => {
    if (selectedCategory === 'Alle') {
      return parts;
    }

    const activeSlug = slugify(selectedCategory);
    return parts.filter((part) => part.categorySlug === activeSlug);
  }, [parts, selectedCategory]);

  const handleAddPart = async (payload) => {
    if (!user) {
      pushToast('Bitte zuerst anmelden.', 'error');
      return;
    }

    const normalizedCategory = normalizeCategoryName(payload.category);
    const categorySlug = slugify(normalizedCategory);

    if (!categorySlug) {
      pushToast('Bitte eine gültige Kategorie angeben.', 'error');
      return;
    }

    try {
      await setDoc(
        doc(db, 'categories', categorySlug),
        {
          name: normalizedCategory,
          slug: categorySlug,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      await addDoc(collection(db, 'parts'), {
        category: normalizedCategory,
        categorySlug,
        brand: payload.brand.trim(),
        model: payload.model.trim(),
        title: payload.title.trim(),
        price: Number(payload.price),
        condition: payload.condition,
        description: payload.description.trim(),
        imageBase64: payload.imageBase64,
        sellerUid: user.uid,
        sellerEmail: user.email || '',
        createdAt: serverTimestamp(),
      });

      pushToast('Autoteil wurde erfolgreich veröffentlicht.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Speichern fehlgeschlagen. Prüfe Firestore-Regeln und Indexe.', 'error');
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      pushToast('Erfolgreich abgemeldet.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Abmeldung fehlgeschlagen.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {authLoading ? (
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-2xl bg-cyan-400/20" />
            <p className="text-lg font-semibold text-white">Autoteile-Marktplatz lädt…</p>
            <p className="mt-2 text-sm text-slate-300">Auth-Status wird geprüft.</p>
          </div>
        </div>
      ) : user ? (
        <Marketplace
          user={user}
          parts={filteredParts}
          totalParts={parts.length}
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onAddPart={handleAddPart}
          onSignOut={handleSignOut}
          partsLoading={partsLoading}
          categoriesLoading={categoriesLoading}
          onToast={pushToast}
        />
      ) : (
        <Auth onToast={pushToast} />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
