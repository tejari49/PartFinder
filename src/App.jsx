import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
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

const getFallbackDisplayName = (user) => {
  if (!user) {
    return 'Nutzer';
  }

  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user.email?.includes('@')) {
    return user.email.split('@')[0];
  }

  return 'Nutzer';
};

const getChatIdForPart = (partId, firstUid, secondUid) => {
  const ids = [firstUid, secondUid].sort();
  return `part_${partId}_${ids.join('_')}`;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [profilesByUid, setProfilesByUid] = useState({});
  const [chats, setChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState('');
  const [partsLoading, setPartsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [activeView, setActiveView] = useState('marketplace');
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
      setProfilesByUid({});
      setChats([]);
      setSelectedChatId('');
      setSelectedCategory('Alle');
      setActiveView('marketplace');
      setPartsLoading(false);
      setCategoriesLoading(false);
      return undefined;
    }

    const userRef = doc(db, 'users', user.uid);
    const fallbackDisplayName = getFallbackDisplayName(user);

    setDoc(
      userRef,
      {
        email: user.email || '',
        displayName: fallbackDisplayName,
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      },
      { merge: true },
    ).catch((error) => {
      console.error(error);
      pushToast('Benutzerprofil konnte nicht initialisiert werden.', 'error');
    });

    return undefined;
  }, [user, pushToast]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    setCategoriesLoading(true);

    const categoriesQuery = query(collection(db, 'categories'), orderBy('name', 'asc'));

    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const nextCategories = snapshot.docs.map((item) => item.data().name).filter(Boolean);
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

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const usersQuery = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const nextProfiles = {};

        snapshot.docs.forEach((item) => {
          nextProfiles[item.id] = {
            uid: item.id,
            ...item.data(),
          };
        });

        setProfilesByUid(nextProfiles);
      },
      (error) => {
        console.error(error);
        pushToast('Benutzerprofile konnten nicht geladen werden.', 'error');
      },
    );

    return () => unsubscribe();
  }, [user, pushToast]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const chatsQuery = query(collection(db, 'chats'), where('participantIds', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const nextChats = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setChats(nextChats);
      },
      (error) => {
        console.error(error);
        pushToast('Chats konnten nicht geladen werden.', 'error');
      },
    );

    return () => unsubscribe();
  }, [user, pushToast]);

  const userProfile = profilesByUid[user?.uid] || null;

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
        sellerDisplayName: userProfile?.displayName || getFallbackDisplayName(user),
        createdAt: serverTimestamp(),
      });

      pushToast('Autoteil wurde erfolgreich veröffentlicht.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Speichern fehlgeschlagen. Prüfe Firestore-Regeln und Indexe.', 'error');
      throw error;
    }
  };

  const handleSaveProfile = async ({ displayName, whatsappNumber, chatEnabled }) => {
    if (!user) {
      return;
    }

    const trimmedName = displayName.trim();

    if (!trimmedName) {
      pushToast('Bitte einen gültigen Anzeigenamen eingeben.', 'error');
      throw new Error('invalid-display-name');
    }

    try {
      await updateProfile(auth.currentUser, {
        displayName: trimmedName,
      });

      await setDoc(
        doc(db, 'users', user.uid),
        {
          email: user.email || '',
          displayName: trimmedName,
          whatsappNumber: whatsappNumber.trim(),
          chatEnabled: Boolean(chatEnabled),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      pushToast('Profil wurde aktualisiert.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Profil konnte nicht gespeichert werden.', 'error');
      throw error;
    }
  };

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    if (!auth.currentUser?.email) {
      pushToast('Passwortänderung ist für dieses Konto nicht verfügbar.', 'error');
      throw new Error('missing-email');
    }

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      pushToast('Passwort erfolgreich geändert.', 'success');
    } catch (error) {
      console.error(error);

      if (error.code === 'auth/invalid-credential') {
        pushToast('Das aktuelle Passwort ist falsch.', 'error');
      } else if (error.code === 'auth/weak-password') {
        pushToast('Das neue Passwort ist zu schwach.', 'error');
      } else {
        pushToast('Passwort konnte nicht geändert werden.', 'error');
      }

      throw error;
    }
  };

  const handleStartChat = async (part) => {
    if (!user) {
      pushToast('Bitte zuerst anmelden.', 'error');
      return;
    }

    if (part.sellerUid === user.uid) {
      pushToast('Für dein eigenes Inserat ist kein Chat nötig.', 'info');
      return;
    }

    const chatId = getChatIdForPart(part.id, user.uid, part.sellerUid);
    const buyerName = userProfile?.displayName || getFallbackDisplayName(user);
    const sellerProfile = profilesByUid[part.sellerUid];
    const sellerName = sellerProfile?.displayName || part.sellerDisplayName || part.sellerEmail || 'Verkäufer';

    try {
      await setDoc(
        doc(db, 'chats', chatId),
        {
          partId: part.id,
          partTitle: part.title,
          partPrice: Number(part.price || 0),
          sellerUid: part.sellerUid,
          buyerUid: user.uid,
          participantIds: [user.uid, part.sellerUid],
          participantNames: {
            [user.uid]: buyerName,
            [part.sellerUid]: sellerName,
          },
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          lastMessage: '',
        },
        { merge: true },
      );

      setSelectedChatId(chatId);
      setActiveView('dashboard');
      pushToast('Chat geöffnet.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Chat konnte nicht gestartet werden.', 'error');
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
        activeView === 'dashboard' ? (
          <Dashboard
            user={user}
            profile={userProfile}
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            onSaveProfile={handleSaveProfile}
            onChangePassword={handleChangePassword}
            onOpenMarketplace={() => setActiveView('marketplace')}
            onToast={pushToast}
            profilesByUid={profilesByUid}
          />
        ) : (
          <Marketplace
            user={user}
            profile={userProfile}
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
            profilesByUid={profilesByUid}
            onOpenDashboard={() => setActiveView('dashboard')}
            onStartChat={handleStartChat}
          />
        )
      ) : (
        <Auth onToast={pushToast} />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
