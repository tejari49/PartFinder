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
import { validateCategoryInput } from './utils/categoryValidation';
import { getFallbackDisplayName, normalizeCategoryName, slugify } from './utils/format';

const ALLOWED_PART_STATUSES = ['active', 'reserved', 'sold'];
const REPORT_REASONS = ['spam', 'duplicate', 'fraud', 'offensive', 'wrong_category', 'other'];

const getChatIdForPart = (partId, firstUid, secondUid) => {
  const ids = [firstUid, secondUid].sort();
  return `part_${partId}_${ids.join('_')}`;
};

const getPartImages = (payload) => {
  if (payload.imagesBase64?.length > 0) {
    return payload.imagesBase64;
  }

  if (payload.imageBase64) {
    return [payload.imageBase64];
  }

  return [];
};

const toOptionalYear = (value) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const year = Number(value);
  if (!Number.isFinite(year)) {
    return null;
  }

  return Math.trunc(year);
};

const toOptionalUpper = (value) => (value ? value.trim().toUpperCase() : '');
const toOptionalTrimmed = (value) => (value ? value.trim() : '');

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('partfinder-theme') || 'amoled');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [profilesByUid, setProfilesByUid] = useState({});
  const [chats, setChats] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState('');
  const [partsLoading, setPartsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
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
      setFavorites([]);
      setRatings([]);
      setReports([]);
      setSelectedChatId('');
      setSelectedCategory('Alle');
      setActiveView('marketplace');
      setEditingPartId('');
      setPartsLoading(false);
      setCategoriesLoading(false);
      setReportsLoading(false);
      return undefined;
    }

    const userRef = doc(db, 'users', user.uid);
    const fallbackDisplayName = getFallbackDisplayName(user);

    setDoc(
      userRef,
      {
        email: user.email || '',
        displayName: fallbackDisplayName,
        emailVerified: Boolean(user.emailVerified),
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

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const favoritesQuery = query(collection(db, 'favorites'), where('userUid', '==', user.uid));

    const unsubscribe = onSnapshot(
      favoritesQuery,
      (snapshot) => {
        const nextFavorites = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setFavorites(nextFavorites);
      },
      (error) => {
        console.error(error);
        pushToast('Favoriten konnten nicht geladen werden.', 'error');
      },
    );

    return () => unsubscribe();
  }, [user, pushToast]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const ratingsQuery = query(collection(db, 'ratings'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      ratingsQuery,
      (snapshot) => {
        const nextRatings = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setRatings(nextRatings);
      },
      (error) => {
        console.error(error);
        pushToast('Bewertungen konnten nicht geladen werden.', 'error');
      },
    );

    return () => unsubscribe();
  }, [user, pushToast]);

  const userProfile = profilesByUid[user?.uid] || null;
  const isModerator = userProfile?.role === 'moderator';

  useEffect(() => {
    if (!user || !isModerator) {
      setReports([]);
      setReportsLoading(false);
      return undefined;
    }

    setReportsLoading(true);

    const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      reportsQuery,
      (snapshot) => {
        const nextReports = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));
        setReports(nextReports);
        setReportsLoading(false);
      },
      (error) => {
        console.error(error);
        pushToast('Meldungen konnten nicht geladen werden.', 'error');
        setReportsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, isModerator, pushToast]);

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

  const favoritePartIds = useMemo(
    () => favorites.map((favorite) => favorite.partId).filter(Boolean),
    [favorites],
  );

  const favoriteParts = useMemo(
    () => favoritePartIds.map((partId) => parts.find((part) => part.id === partId)).filter(Boolean),
    [favoritePartIds, parts],
  );

  const totalSoldParts = useMemo(
    () => parts.filter((part) => (part.status || 'active') === 'sold').length,
    [parts],
  );

  const unreadChatsCount = useMemo(
    () => chats.filter((chat) => Array.isArray(chat.unreadBy) && chat.unreadBy.includes(user?.uid)).length,
    [chats, user?.uid],
  );

  const sellerSoldCountByUid = useMemo(() => {
    const next = {};
    parts.forEach((part) => {
      if ((part.status || 'active') !== 'sold' || !part.sellerUid) {
        return;
      }
      next[part.sellerUid] = (next[part.sellerUid] || 0) + 1;
    });
    return next;
  }, [parts]);

  const sellerRatingsByUid = useMemo(() => {
    const next = {};
    ratings.forEach((rating) => {
      if (!rating.sellerUid || typeof rating.rating !== 'number') {
        return;
      }
      if (!next[rating.sellerUid]) {
        next[rating.sellerUid] = {
          sum: 0,
          count: 0,
        };
      }
      next[rating.sellerUid].sum += rating.rating;
      next[rating.sellerUid].count += 1;
    });
    return next;
  }, [ratings]);

  const sellerTrustByUid = useMemo(() => {
    const uids = new Set([
      ...Object.keys(profilesByUid),
      ...Object.keys(sellerSoldCountByUid),
      ...Object.keys(sellerRatingsByUid),
    ]);

    const next = {};
    uids.forEach((uid) => {
      const rating = sellerRatingsByUid[uid];
      const ratingCount = rating?.count || 0;
      const ratingAverage = ratingCount > 0 ? rating.sum / ratingCount : 0;
      const soldCount = sellerSoldCountByUid[uid] || 0;
      const profile = profilesByUid[uid] || {};
      const verified = profile.trustedSeller === true || profile.emailVerified === true;

      next[uid] = {
        ratingAverage,
        ratingCount,
        soldCount,
        verified,
      };
    });
    return next;
  }, [profilesByUid, sellerRatingsByUid, sellerSoldCountByUid]);

  const moderationOpenCount = useMemo(
    () => reports.filter((report) => report.status === 'open' || report.status === 'in_review').length,
    [reports],
  );

  const handleUpsertPart = async (payload, existingPart = null) => {
    if (!user) {
      pushToast('Bitte zuerst anmelden.', 'error');
      return;
    }

    const categoryCheck = validateCategoryInput(payload.category, categories);
    if (!categoryCheck.ok) {
      pushToast(categoryCheck.reason, 'error');
      throw new Error('invalid-category');
    }

    const normalizedCategory = normalizeCategoryName(payload.category);
    const categorySlug = slugify(normalizedCategory);
    const imagesBase64 = getPartImages(payload);
    const yearFrom = toOptionalYear(payload.yearFrom);
    const yearTo = toOptionalYear(payload.yearTo);

    if (!categorySlug) {
      pushToast('Bitte eine gueltige Kategorie angeben.', 'error');
      return;
    }

    if (imagesBase64.length === 0) {
      pushToast('Mindestens ein Bild ist erforderlich.', 'error');
      return;
    }

    if (yearFrom && (yearFrom < 1900 || yearFrom > 2100)) {
      pushToast('Baujahr-von muss zwischen 1900 und 2100 liegen.', 'error');
      return;
    }

    if (yearTo && (yearTo < 1900 || yearTo > 2100)) {
      pushToast('Baujahr-bis muss zwischen 1900 und 2100 liegen.', 'error');
      return;
    }

    if (yearFrom && yearTo && yearFrom > yearTo) {
      pushToast('Baujahr-von darf nicht groesser als Baujahr-bis sein.', 'error');
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

      const preservedStatus = ALLOWED_PART_STATUSES.includes(existingPart?.status)
        ? existingPart.status
        : 'active';

      const soldAt = preservedStatus === 'sold'
        ? existingPart?.soldAt || serverTimestamp()
        : null;

      const reservedForUid = preservedStatus === 'reserved' ? existingPart?.reservedForUid || '' : '';
      const reservedAt = preservedStatus === 'reserved'
        ? existingPart?.reservedAt || serverTimestamp()
        : null;

      const commonFields = {
        category: normalizedCategory,
        categorySlug,
        brand: payload.brand.trim(),
        model: payload.model.trim(),
        title: payload.title.trim(),
        price: Number(payload.price),
        condition: payload.condition,
        description: payload.description.trim(),
        imagesBase64,
        imageBase64: imagesBase64[0],
        imageCount: imagesBase64.length,
        location: payload.location?.trim() || '',
        shippingAvailable: Boolean(payload.shippingAvailable),
        pickupAvailable: payload.pickupAvailable !== false,
        sellerUid: user.uid,
        sellerEmail: user.email || '',
        sellerDisplayName: userProfile?.displayName || getFallbackDisplayName(user),
        status: preservedStatus,
        soldAt,
        reservedForUid,
        reservedAt,
        oemNumber: toOptionalUpper(payload.oemNumber),
        engineCode: toOptionalUpper(payload.engineCode),
        vehicleGeneration: toOptionalTrimmed(payload.vehicleGeneration),
        yearFrom: yearFrom || null,
        yearTo: yearTo || null,
        updatedAt: serverTimestamp(),
      };

      if (existingPart?.id) {
        await updateDoc(doc(db, 'parts', existingPart.id), commonFields);
        setEditingPartId('');
        pushToast('Inserat wurde aktualisiert.', 'success');
      } else {
        await addDoc(collection(db, 'parts'), {
          ...commonFields,
          status: 'active',
          soldAt: null,
          reservedForUid: '',
          reservedAt: null,
          createdAt: serverTimestamp(),
        });
        pushToast('Autoteil wurde erfolgreich veroeffentlicht.', 'success');
      }
    } catch (error) {
      console.error(error);
      pushToast('Speichern fehlgeschlagen. Pruefe Firestore-Regeln und Indexe.', 'error');
      throw error;
    }
  };

  const handleEditPart = (part) => {
    if (!user || part.sellerUid !== user.uid) {
      pushToast('Nur eigene Inserate koennen bearbeitet werden.', 'error');
      return;
    }

    setEditingPartId(part.id);
    setActiveView('marketplace');
    pushToast('Inserat im Bearbeitungsmodus geoeffnet.', 'info');
  };

  const handleCancelEdit = () => {
    setEditingPartId('');
  };

  const handleDeletePart = async (part) => {
    if (!user || part.sellerUid !== user.uid) {
      pushToast('Nur eigene Inserate koennen geloescht werden.', 'error');
      return;
    }

    try {
      await deleteDoc(doc(db, 'parts', part.id));
      if (editingPartId === part.id) {
        setEditingPartId('');
      }
      pushToast('Inserat wurde geloescht.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Inserat konnte nicht geloescht werden.', 'error');
      throw error;
    }
  };

  const handleSetPartStatus = async (part, nextStatus, options = {}) => {
    if (!user || part.sellerUid !== user.uid) {
      pushToast('Nur eigene Inserate koennen geaendert werden.', 'error');
      return;
    }

    if (!ALLOWED_PART_STATUSES.includes(nextStatus)) {
      pushToast('Unbekannter Status.', 'error');
      return;
    }

    const nextPayload = {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    };

    if (nextStatus === 'active') {
      nextPayload.soldAt = null;
      nextPayload.reservedForUid = '';
      nextPayload.reservedAt = null;
    } else if (nextStatus === 'reserved') {
      nextPayload.soldAt = null;
      nextPayload.reservedForUid = options.reservedForUid || part.reservedForUid || '';
      nextPayload.reservedAt = serverTimestamp();
    } else if (nextStatus === 'sold') {
      nextPayload.soldAt = serverTimestamp();
      nextPayload.reservedForUid = '';
      nextPayload.reservedAt = null;
    }

    try {
      await updateDoc(doc(db, 'parts', part.id), nextPayload);

      if (nextStatus === 'sold') {
        pushToast('Inserat als verkauft markiert.', 'success');
      } else if (nextStatus === 'reserved') {
        pushToast('Inserat wurde reserviert.', 'success');
      } else {
        pushToast('Inserat wieder aktiv geschaltet.', 'success');
      }
    } catch (error) {
      console.error(error);
      pushToast('Status konnte nicht geaendert werden.', 'error');
    }
  };

  const handleToggleFavorite = async (part) => {
    if (!user) {
      pushToast('Bitte zuerst anmelden.', 'error');
      return;
    }

    const favoriteId = `${user.uid}_${part.id}`;
    const exists = favoritePartIds.includes(part.id);

    try {
      if (exists) {
        await deleteDoc(doc(db, 'favorites', favoriteId));
        pushToast('Aus der Merkliste entfernt.', 'success');
      } else {
        await setDoc(doc(db, 'favorites', favoriteId), {
          userUid: user.uid,
          partId: part.id,
          sellerUid: part.sellerUid,
          createdAt: serverTimestamp(),
        });
        pushToast('Zur Merkliste hinzugefuegt.', 'success');
      }
    } catch (error) {
      console.error(error);
      pushToast('Merkliste konnte nicht aktualisiert werden.', 'error');
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
      pushToast('Bitte einen gueltigen Anzeigenamen eingeben.', 'error');
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
          emailVerified: Boolean(auth.currentUser?.emailVerified),
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
      pushToast('Passwortaenderung ist fuer dieses Konto nicht verfuegbar.', 'error');
      throw new Error('missing-email');
    }

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      pushToast('Passwort erfolgreich geaendert.', 'success');
    } catch (error) {
      console.error(error);

      if (error.code === 'auth/invalid-credential') {
        pushToast('Das aktuelle Passwort ist falsch.', 'error');
      } else if (error.code === 'auth/weak-password') {
        pushToast('Das neue Passwort ist zu schwach.', 'error');
      } else {
        pushToast('Passwort konnte nicht geaendert werden.', 'error');
      }

      throw error;
    }
  };

  const handleSubmitRating = async (part, payload) => {
    if (!user) {
      pushToast('Bitte zuerst anmelden.', 'error');
      return;
    }

    if (part.sellerUid === user.uid) {
      pushToast('Eigene Inserate koennen nicht bewertet werden.', 'error');
      return;
    }

    const value = Number(payload.rating);
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      pushToast('Bewertung muss zwischen 1 und 5 Sternen liegen.', 'error');
      return;
    }

    const ratingId = `${part.id}_${user.uid}`;
    const alreadyRated = ratings.some((rating) => rating.id === ratingId);
    if (alreadyRated) {
      pushToast('Du hast diesen Verkaeufer fuer das Inserat bereits bewertet.', 'info');
      return;
    }

    const hasChatContact = chats.some((chat) => {
      if (chat.partId !== part.id) return false;
      if (!Array.isArray(chat.participantIds)) return false;
      return chat.participantIds.includes(user.uid) && chat.participantIds.includes(part.sellerUid);
    });

    if (!hasChatContact) {
      pushToast('Bewertungen sind erst nach einem Chatkontakt moeglich.', 'error');
      return;
    }

    try {
      await setDoc(doc(db, 'ratings', ratingId), {
        partId: part.id,
        partTitle: part.title || '',
        sellerUid: part.sellerUid,
        raterUid: user.uid,
        rating: Math.round(value),
        comment: payload.comment?.trim() || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      pushToast('Bewertung wurde gespeichert.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Bewertung konnte nicht gespeichert werden.', 'error');
      throw error;
    }
  };

  const handleSubmitReport = async (part, payload) => {
    if (!user) {
      pushToast('Bitte zuerst anmelden.', 'error');
      return;
    }

    if (part.sellerUid === user.uid) {
      pushToast('Eigene Inserate koennen nicht gemeldet werden.', 'error');
      return;
    }

    if (!REPORT_REASONS.includes(payload.reason)) {
      pushToast('Bitte einen gueltigen Meldungsgrund waehlen.', 'error');
      return;
    }

    const reportId = `${part.id}_${user.uid}`;

    try {
      await setDoc(doc(db, 'reports', reportId), {
        partId: part.id,
        partTitle: part.title || '',
        sellerUid: part.sellerUid,
        sellerDisplayName: part.sellerDisplayName || '',
        reporterUid: user.uid,
        reason: payload.reason,
        details: payload.details?.trim() || '',
        status: 'open',
        createdAt: serverTimestamp(),
      });
      pushToast('Meldung wurde an die Moderation gesendet.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Meldung konnte nicht gespeichert werden (evtl. bereits gemeldet).', 'error');
      throw error;
    }
  };

  const handleModerateReport = async (report, payload) => {
    if (!user || !isModerator) {
      pushToast('Nur Moderatoren duerfen Meldungen bearbeiten.', 'error');
      return;
    }

    if (!['in_review', 'resolved', 'rejected'].includes(payload.status)) {
      pushToast('Ungueltiger Moderationsstatus.', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, 'reports', report.id), {
        status: payload.status,
        moderationNote: payload.note?.trim() || '',
        moderatedByUid: user.uid,
        moderatedAt: serverTimestamp(),
      });
      pushToast('Meldung wurde aktualisiert.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Moderationsupdate fehlgeschlagen.', 'error');
      throw error;
    }
  };

  const handleStartChat = async (part) => {
    if (!user) {
      pushToast('Bitte zuerst anmelden.', 'error');
      return;
    }

    if (part.sellerUid === user.uid) {
      pushToast('Fuer dein eigenes Inserat ist kein Chat noetig.', 'info');
      return;
    }

    if (part.status === 'sold') {
      pushToast('Dieses Inserat ist bereits als verkauft markiert.', 'info');
      return;
    }

    if (part.status === 'reserved' && part.reservedForUid && part.reservedForUid !== user.uid) {
      pushToast('Dieses Inserat ist aktuell fuer einen anderen Nutzer reserviert.', 'info');
      return;
    }

    const sellerProfile = profilesByUid[part.sellerUid];

    if (sellerProfile?.chatEnabled === false) {
      pushToast('Der Verkaeufer hat den In-App Chat deaktiviert.', 'error');
      return;
    }

    const chatId = getChatIdForPart(part.id, user.uid, part.sellerUid);
    const buyerName = userProfile?.displayName || getFallbackDisplayName(user);
    const sellerName = sellerProfile?.displayName || part.sellerDisplayName || part.sellerEmail || 'Verkaeufer';

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
      pushToast('Chat geoeffnet.', 'success');
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
          <div className="w-full max-w-md rounded-[1.75rem] pf-card p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-[var(--pf-primary-soft)]" />
            <p className="text-lg font-semibold text-[var(--pf-text)]">Autoteile-Marktplatz laedt...</p>
            <p className="mt-2 text-sm text-[var(--pf-muted)]">Auth-Status wird geprueft.</p>
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
            onSetPartStatus={handleSetPartStatus}
            unreadChatsCount={unreadChatsCount}
            theme={theme}
            onThemeChange={setTheme}
            favoriteParts={favoriteParts}
            totalPartsCount={parts.length}
            categoriesCount={categories.length}
            totalSoldCount={totalSoldParts}
            sellerTrustByUid={sellerTrustByUid}
            isModerator={isModerator}
            reports={reports}
            reportsLoading={reportsLoading}
            onModerateReport={handleModerateReport}
            moderationOpenCount={moderationOpenCount}
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
            onSetPartStatus={handleSetPartStatus}
            unreadChatsCount={unreadChatsCount}
            theme={theme}
            onThemeChange={setTheme}
            favoritePartIds={favoritePartIds}
            onToggleFavorite={handleToggleFavorite}
            myPartsCount={myParts.length}
            soldCount={totalSoldParts}
            sellerTrustByUid={sellerTrustByUid}
            onSubmitRating={handleSubmitRating}
            onSubmitReport={handleSubmitReport}
          />
        )
      ) : (
        <Auth onToast={pushToast} theme={theme} onThemeChange={setTheme} />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
