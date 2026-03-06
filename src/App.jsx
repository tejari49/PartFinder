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
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import Toast from './components/Toast';
import { getFallbackDisplayName, normalizeCategoryName, slugify } from './utils/format';

const getChatIdForPart = (partId, firstUid, secondUid) => {
  const ids = [firstUid, secondUid].sort();
  return `part_${partId}_${ids.join('_')}`;
};

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('partfinder-theme') || 'amoled');
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
  const [editingPartId, setEditingPartId] = useState('');
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setToasts((prev) => [...prev, { id, message, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('partfinder-theme', theme);
  }, [theme]);

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
      setEditingPartId('');
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
  }, [user, pushToast, theme]);

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

  useEffect(() => {
    if (userProfile?.themePreference && userProfile.themePreference !== theme) {
      setTheme(userProfile.themePreference);
    }
  }, [theme, userProfile?.themePreference]);

  const editingPart = useMemo(
    () => parts.find((part) => part.id === editingPartId) || null,
    [parts, editingPartId],
  );

  const filteredParts = useMemo(() => {
    if (selectedCategory === 'Alle') {
      return parts;
    }

    const activeSlug = slugify(selectedCategory);
    return parts.filter((part) => part.categorySlug === activeSlug);
  }, [parts, selectedCategory]);

  const myParts = useMemo(
    () => parts.filter((part) => part.sellerUid === user?.uid),
    [parts, user?.uid],
  );

  const unreadChatsCount = useMemo(
    () => chats.filter((chat) => Array.isArray(chat.unreadBy) && chat.unreadBy.includes(user?.uid)).length,
    [chats, user?.uid],
  );

  const handleUpsertPart = async (payload, existingPart = null) => {
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

      const commonFields = {
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
        updatedAt: serverTimestamp(),
      };

      if (existingPart?.id) {
        await updateDoc(doc(db, 'parts', existingPart.id), commonFields);
        setEditingPartId('');
        pushToast('Inserat wurde aktualisiert.', 'success');
      } else {
        await addDoc(collection(db, 'parts'), {
          ...commonFields,
          createdAt: serverTimestamp(),
        });
        pushToast('Autoteil wurde erfolgreich veröffentlicht.', 'success');
      }
    } catch (error) {
      console.error(error);
      pushToast('Speichern fehlgeschlagen. Prüfe Firestore-Regeln und Indexe.', 'error');
      throw error;
    }
  };

  const handleEditPart = (part) => {
    if (!user || part.sellerUid !== user.uid) {
      pushToast('Nur eigene Inserate können bearbeitet werden.', 'error');
      return;
    }

    setEditingPartId(part.id);
    setActiveView('marketplace');
    pushToast('Inserat im Bearbeitungsmodus geöffnet.', 'info');
  };

  const handleCancelEdit = () => {
    setEditingPartId('');
  };

  const handleDeletePart = async (part) => {
    if (!user || part.sellerUid !== user.uid) {
      pushToast('Nur eigene Inserate können gelöscht werden.', 'error');
      return;
    }

    try {
      await deleteDoc(doc(db, 'parts', part.id));
      if (editingPartId === part.id) {
        setEditingPartId('');
      }
      pushToast('Inserat wurde gelöscht.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Inserat konnte nicht gelöscht werden.', 'error');
      throw error;
    }
  };

  const handleSaveProfile = async ({
    displayName,
    whatsappNumber,
    chatEnabled,
    avatarBase64,
    themePreference,
  }) => {
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
          avatarBase64: avatarBase64 || '',
          themePreference: themePreference || theme,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setTheme(themePreference || theme);
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

    const sellerProfile = profilesByUid[part.sellerUid];

    if (sellerProfile?.chatEnabled === false) {
      pushToast('Der Verkäufer hat den In-App Chat deaktiviert.', 'error');
      return;
    }

    const chatId = getChatIdForPart(part.id, user.uid, part.sellerUid);
    const buyerName = userProfile?.displayName || getFallbackDisplayName(user);
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
          unreadBy: [],
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
    <div className="pf-page">
      {authLoading ? (
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl pf-card p-8 text-center">
            <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-2xl bg-[var(--pf-primary-soft)]" />
            <p className="text-lg font-semibold text-[var(--pf-text)]">Autoteile-Marktplatz lädt…</p>
            <p className="mt-2 text-sm text-[var(--pf-muted)]">Auth-Status wird geprüft.</p>
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
            myParts={myParts}
            onEditPart={(part) => {
              handleEditPart(part);
              setActiveView('marketplace');
            }}
            onDeletePart={handleDeletePart}
            unreadChatsCount={unreadChatsCount}
            theme={theme}
            onThemeChange={setTheme}
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
            onAddPart={handleUpsertPart}
            onSignOut={handleSignOut}
            partsLoading={partsLoading}
            categoriesLoading={categoriesLoading}
            onToast={pushToast}
            profilesByUid={profilesByUid}
            onOpenDashboard={() => setActiveView('dashboard')}
            onStartChat={handleStartChat}
            editingPart={editingPart}
            onCancelEdit={handleCancelEdit}
            onEditPart={handleEditPart}
            onDeletePart={handleDeletePart}
            unreadChatsCount={unreadChatsCount}
            theme={theme}
            onThemeChange={setTheme}
          />
        )
      ) : (
        <Auth onToast={pushToast} theme={theme} onThemeChange={setTheme} />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
