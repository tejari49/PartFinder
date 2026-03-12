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
import { buildPartSearchText } from './utils/searchIndex';

const ALLOWED_PART_STATUSES = ['active', 'reserved', 'sold'];
const REPORT_REASONS = ['spam', 'duplicate', 'fraud', 'offensive', 'wrong_category', 'other'];
const LANGUAGE_KEY = 'partfinder-language';
const INSTALL_DISMISS_KEY = 'partfinder-install-dismissed';

const toastTranslations = {
  'User profile could not be initialized.': 'Benutzerprofil konnte nicht initialisiert werden.',
  'Categories could not be loaded.': 'Kategorien konnten nicht geladen werden.',
  'Parts could not be loaded.': 'Teile konnten nicht geladen werden.',
  'User profiles could not be loaded.': 'Benutzerprofile konnten nicht geladen werden.',
  'Chats could not be loaded.': 'Chats konnten nicht geladen werden.',
  'Favorites could not be loaded.': 'Favoriten konnten nicht geladen werden.',
  'Ratings could not be loaded.': 'Bewertungen konnten nicht geladen werden.',
  'Reports could not be loaded.': 'Meldungen konnten nicht geladen werden.',
  'Please sign in first.': 'Bitte zuerst anmelden.',
  'Please enter a valid category.': 'Bitte eine gueltige Kategorie angeben.',
  'At least one image is required.': 'Mindestens ein Bild ist erforderlich.',
  'Year-from must be between 1900 and 2100.': 'Baujahr-von muss zwischen 1900 und 2100 liegen.',
  'Year-to must be between 1900 and 2100.': 'Baujahr-bis muss zwischen 1900 und 2100 liegen.',
  'Year-from cannot be greater than year-to.': 'Baujahr-von darf nicht groesser als Baujahr-bis sein.',
  'Listing updated.': 'Inserat wurde aktualisiert.',
  'Part listed successfully.': 'Autoteil wurde erfolgreich veroeffentlicht.',
  'Save failed. Check Firestore rules and indexes.': 'Speichern fehlgeschlagen. Pruefe Firestore-Regeln und Indexe.',
  'Only your own listings can be edited.': 'Nur eigene Inserate koennen bearbeitet werden.',
  'Listing opened in edit mode.': 'Inserat im Bearbeitungsmodus geoeffnet.',
  'Only your own listings can be deleted.': 'Nur eigene Inserate koennen geloescht werden.',
  'Listing deleted.': 'Inserat wurde geloescht.',
  'Listing could not be deleted.': 'Inserat konnte nicht geloescht werden.',
  'Only your own listings can be changed.': 'Nur eigene Inserate koennen geaendert werden.',
  'Unknown status.': 'Unbekannter Status.',
  'Listing marked as sold.': 'Inserat als verkauft markiert.',
  'Listing reserved.': 'Inserat wurde reserviert.',
  'Listing set back to active.': 'Inserat wieder aktiv geschaltet.',
  'Status could not be changed.': 'Status konnte nicht geaendert werden.',
  'Removed from favorites.': 'Aus der Merkliste entfernt.',
  'Added to favorites.': 'Zur Merkliste hinzugefuegt.',
  'Favorites could not be updated.': 'Merkliste konnte nicht aktualisiert werden.',
  'Please enter a valid display name.': 'Bitte einen gueltigen Anzeigenamen eingeben.',
  'Profile updated.': 'Profil wurde aktualisiert.',
  'Profile could not be saved.': 'Profil konnte nicht gespeichert werden.',
  'Password change is not available for this account.': 'Passwortaenderung ist fuer dieses Konto nicht verfuegbar.',
  'Password changed successfully.': 'Passwort erfolgreich geaendert.',
  'Current password is incorrect.': 'Das aktuelle Passwort ist falsch.',
  'New password is too weak.': 'Das neue Passwort ist zu schwach.',
  'Password could not be changed.': 'Passwort konnte nicht geaendert werden.',
  'You cannot rate your own listings.': 'Eigene Inserate koennen nicht bewertet werden.',
  'Rating must be between 1 and 5 stars.': 'Bewertung muss zwischen 1 und 5 Sternen liegen.',
  'You already rated this seller for this listing.': 'Du hast diesen Verkaeufer fuer das Inserat bereits bewertet.',
  'Ratings are available only after chat contact.': 'Bewertungen sind erst nach einem Chatkontakt moeglich.',
  'Rating saved.': 'Bewertung wurde gespeichert.',
  'Rating could not be saved.': 'Bewertung konnte nicht gespeichert werden.',
  'You cannot report your own listings.': 'Eigene Inserate koennen nicht gemeldet werden.',
  'Please select a valid report reason.': 'Bitte einen gueltigen Meldungsgrund waehlen.',
  'Report sent to moderation.': 'Meldung wurde an die Moderation gesendet.',
  'Report could not be saved (possibly already reported).': 'Meldung konnte nicht gespeichert werden (evtl. bereits gemeldet).',
  'Only moderators can process reports.': 'Nur Moderatoren duerfen Meldungen bearbeiten.',
  'Invalid moderation status.': 'Ungueltiger Moderationsstatus.',
  'Report updated.': 'Meldung wurde aktualisiert.',
  'Moderation update failed.': 'Moderationsupdate fehlgeschlagen.',
  'No chat needed for your own listing.': 'Fuer dein eigenes Inserat ist kein Chat noetig.',
  'This listing is already marked as sold.': 'Dieses Inserat ist bereits als verkauft markiert.',
  'This listing is currently reserved for another user.': 'Dieses Inserat ist aktuell fuer einen anderen Nutzer reserviert.',
  'The seller has disabled in-app chat.': 'Der Verkaeufer hat den In-App Chat deaktiviert.',
  'Chat opened.': 'Chat geoeffnet.',
  'Chat could not be started.': 'Chat konnte nicht gestartet werden.',
  'Signed out successfully.': 'Erfolgreich abgemeldet.',
  'Sign out failed.': 'Abmeldung fehlgeschlagen.',
  'Install prompt is not available right now.': 'Installationshinweis ist aktuell nicht verfuegbar.',
  'App installed successfully.': 'App wurde erfolgreich installiert.',
};

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
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'de' || stored === 'en') return stored;
    return navigator.language?.toLowerCase().startsWith('de') ? 'de' : 'en';
  });
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeView, setActiveView] = useState('marketplace');
  const [editingPartId, setEditingPartId] = useState('');
  const [toasts, setToasts] = useState([]);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [installHintDismissed, setInstallHintDismissed] = useState(() => {
    const stored = localStorage.getItem(INSTALL_DISMISS_KEY);
    return stored === '1';
  });

  const pushToast = useCallback((message, type = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const localizedMessage = language === 'de' ? toastTranslations[message] || message : message;

    setToasts((prev) => [...prev, { id, message: localizedMessage, type }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3600);
  }, [language]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('partfinder-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setInstallHintDismissed(true);
      localStorage.setItem(INSTALL_DISMISS_KEY, '1');
      pushToast('App installed successfully.', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [pushToast]);

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
      setSelectedCategory('all');
      setActiveView('marketplace');
      setEditingPartId('');
      setPartsLoading(false);
      setCategoriesLoading(false);
      setReportsLoading(false);
      return undefined;
    }

    const userRef = doc(db, 'users', user.uid);
    const fallbackDisplayName = getFallbackDisplayName(user, language);

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
      pushToast('User profile could not be initialized.', 'error');
    });

    return undefined;
  }, [user, pushToast, language]);

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
        pushToast('Categories could not be loaded.', 'error');
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
        pushToast('Parts could not be loaded.', 'error');
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
        pushToast('User profiles could not be loaded.', 'error');
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
        pushToast('Chats could not be loaded.', 'error');
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
        pushToast('Favorites could not be loaded.', 'error');
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
        pushToast('Ratings could not be loaded.', 'error');
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
        pushToast('Reports could not be loaded.', 'error');
        setReportsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, isModerator, pushToast]);

  useEffect(() => {
    if (userProfile?.themePreference && userProfile.themePreference !== theme) {
      setTheme(userProfile.themePreference);
    }
  }, [userProfile?.themePreference]);

  const editingPart = useMemo(
    () => parts.find((part) => part.id === editingPartId) || null,
    [parts, editingPartId],
  );

  const filteredParts = useMemo(() => {
    if (selectedCategory === 'all') {
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
      pushToast('Please sign in first.', 'error');
      return;
    }

    const categoryCheck = validateCategoryInput(payload.category, categories, language);
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
      pushToast('Please enter a valid category.', 'error');
      return;
    }

    if (imagesBase64.length === 0) {
      pushToast('At least one image is required.', 'error');
      return;
    }

    if (yearFrom && (yearFrom < 1900 || yearFrom > 2100)) {
      pushToast('Year-from must be between 1900 and 2100.', 'error');
      return;
    }

    if (yearTo && (yearTo < 1900 || yearTo > 2100)) {
      pushToast('Year-to must be between 1900 and 2100.', 'error');
      return;
    }

    if (yearFrom && yearTo && yearFrom > yearTo) {
      pushToast('Year-from cannot be greater than year-to.', 'error');
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
        sellerDisplayName: userProfile?.displayName || getFallbackDisplayName(user, language),
        status: preservedStatus,
        soldAt,
        reservedForUid,
        reservedAt,
        oemNumber: toOptionalUpper(payload.oemNumber),
        engineCode: toOptionalUpper(payload.engineCode),
        vehicleGeneration: toOptionalTrimmed(payload.vehicleGeneration),
        yearFrom: yearFrom || null,
        yearTo: yearTo || null,
        searchIndexText: buildPartSearchText({
          category: normalizedCategory,
          brand: payload.brand.trim(),
          model: payload.model.trim(),
          title: payload.title.trim(),
          description: payload.description.trim(),
          oemNumber: toOptionalUpper(payload.oemNumber),
          engineCode: toOptionalUpper(payload.engineCode),
          vehicleGeneration: toOptionalTrimmed(payload.vehicleGeneration),
          location: payload.location?.trim() || '',
        }),
        updatedAt: serverTimestamp(),
      };

      if (existingPart?.id) {
        await updateDoc(doc(db, 'parts', existingPart.id), commonFields);
        setEditingPartId('');
        pushToast('Listing updated.', 'success');
      } else {
        await addDoc(collection(db, 'parts'), {
          ...commonFields,
          status: 'active',
          soldAt: null,
          reservedForUid: '',
          reservedAt: null,
          createdAt: serverTimestamp(),
        });
        pushToast('Part listed successfully.', 'success');
      }
    } catch (error) {
      console.error(error);
      pushToast('Save failed. Check Firestore rules and indexes.', 'error');
      throw error;
    }
  };

  const handleImportPart = async (payload) => {
  const handleBulkImportParts = async (rows) => {
    if (!user) {
      pushToast('Please sign in first.', 'error');
      return;
    }

    await handleUpsertPart(payload);
    if (!Array.isArray(rows) || rows.length === 0) {
      return;
    }

    let imported = 0;

    for (const row of rows) {
      const normalizedRow = {
        ...row,
        imagesBase64:
          Array.isArray(row.imagesBase64) && row.imagesBase64.length > 0
            ? row.imagesBase64
            : [BULK_IMPORT_PLACEHOLDER_IMAGE],
      };

      await handleUpsertPart(normalizedRow);
      imported += 1;
    }

    pushToast(`${imported} listings imported.`, 'success');
  };

  const handleEditPart = (part) => {
    if (!user || part.sellerUid !== user.uid) {
      pushToast('Only your own listings can be edited.', 'error');
      return;
    }

    setEditingPartId(part.id);
    setActiveView('marketplace');
    pushToast('Listing opened in edit mode.', 'info');
  };

  const handleCancelEdit = () => {
    setEditingPartId('');
  };

  const handleDeletePart = async (part) => {
    if (!user || part.sellerUid !== user.uid) {
      pushToast('Only your own listings can be deleted.', 'error');
      return;
    }

    try {
      await deleteDoc(doc(db, 'parts', part.id));
      if (editingPartId === part.id) {
        setEditingPartId('');
      }
      pushToast('Listing deleted.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Listing could not be deleted.', 'error');
      throw error;
    }
  };

  const handleSetPartStatus = async (part, nextStatus, options = {}) => {
    if (!user || part.sellerUid !== user.uid) {
      pushToast('Only your own listings can be changed.', 'error');
      return;
    }

    if (!ALLOWED_PART_STATUSES.includes(nextStatus)) {
      pushToast('Unknown status.', 'error');
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
        pushToast('Listing marked as sold.', 'success');
      } else if (nextStatus === 'reserved') {
        pushToast('Listing reserved.', 'success');
      } else {
        pushToast('Listing set back to active.', 'success');
      }
    } catch (error) {
      console.error(error);
      pushToast('Status could not be changed.', 'error');
    }
  };

  const handleToggleFavorite = async (part) => {
    if (!user) {
      pushToast('Please sign in first.', 'error');
      return;
    }

    const favoriteId = `${user.uid}_${part.id}`;
    const exists = favoritePartIds.includes(part.id);

    try {
      if (exists) {
        await deleteDoc(doc(db, 'favorites', favoriteId));
        pushToast('Removed from favorites.', 'success');
      } else {
        await setDoc(doc(db, 'favorites', favoriteId), {
          userUid: user.uid,
          partId: part.id,
          sellerUid: part.sellerUid,
          createdAt: serverTimestamp(),
        });
        pushToast('Added to favorites.', 'success');
      }
    } catch (error) {
      console.error(error);
      pushToast('Favorites could not be updated.', 'error');
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
      pushToast('Please enter a valid display name.', 'error');
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
      pushToast('Profile updated.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Profile could not be saved.', 'error');
      throw error;
    }
  };

  const handleChangePassword = async ({ currentPassword, newPassword }) => {
    if (!auth.currentUser?.email) {
      pushToast('Password change is not available for this account.', 'error');
      throw new Error('missing-email');
    }

    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      pushToast('Password changed successfully.', 'success');
    } catch (error) {
      console.error(error);

      if (error.code === 'auth/invalid-credential') {
        pushToast('Current password is incorrect.', 'error');
      } else if (error.code === 'auth/weak-password') {
        pushToast('New password is too weak.', 'error');
      } else {
        pushToast('Password could not be changed.', 'error');
      }

      throw error;
    }
  };

  const handleSubmitRating = async (part, payload) => {
    if (!user) {
      pushToast('Please sign in first.', 'error');
      return;
    }

    if (part.sellerUid === user.uid) {
      pushToast('You cannot rate your own listings.', 'error');
      return;
    }

    const value = Number(payload.rating);
    if (!Number.isFinite(value) || value < 1 || value > 5) {
      pushToast('Rating must be between 1 and 5 stars.', 'error');
      return;
    }

    const ratingId = `${part.id}_${user.uid}`;
    const alreadyRated = ratings.some((rating) => rating.id === ratingId);
    if (alreadyRated) {
      pushToast('You already rated this seller for this listing.', 'info');
      return;
    }

    const hasChatContact = chats.some((chat) => {
      if (chat.partId !== part.id) return false;
      if (!Array.isArray(chat.participantIds)) return false;
      return chat.participantIds.includes(user.uid) && chat.participantIds.includes(part.sellerUid);
    });

    if (!hasChatContact) {
      pushToast('Ratings are available only after chat contact.', 'error');
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
      pushToast('Rating saved.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Rating could not be saved.', 'error');
      throw error;
    }
  };

  const handleSubmitReport = async (part, payload) => {
    if (!user) {
      pushToast('Please sign in first.', 'error');
      return;
    }

    if (part.sellerUid === user.uid) {
      pushToast('You cannot report your own listings.', 'error');
      return;
    }

    if (!REPORT_REASONS.includes(payload.reason)) {
      pushToast('Please select a valid report reason.', 'error');
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
      pushToast('Report sent to moderation.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Report could not be saved (possibly already reported).', 'error');
      throw error;
    }
  };

  const handleModerateReport = async (report, payload) => {
    if (!user || !isModerator) {
      pushToast('Only moderators can process reports.', 'error');
      return;
    }

    if (!['in_review', 'resolved', 'rejected'].includes(payload.status)) {
      pushToast('Invalid moderation status.', 'error');
      return;
    }

    try {
      await updateDoc(doc(db, 'reports', report.id), {
        status: payload.status,
        moderationNote: payload.note?.trim() || '',
        moderatedByUid: user.uid,
        moderatedAt: serverTimestamp(),
      });
      pushToast('Report updated.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Moderation update failed.', 'error');
      throw error;
    }
  };

  const handleStartChat = async (part) => {
    if (!user) {
      pushToast('Please sign in first.', 'error');
      return;
    }

    if (part.sellerUid === user.uid) {
      pushToast('No chat needed for your own listing.', 'info');
      return;
    }

    if (part.status === 'sold') {
      pushToast('This listing is already marked as sold.', 'info');
      return;
    }

    if (part.status === 'reserved' && part.reservedForUid && part.reservedForUid !== user.uid) {
      pushToast('This listing is currently reserved for another user.', 'info');
      return;
    }

    const sellerProfile = profilesByUid[part.sellerUid];

    if (sellerProfile?.chatEnabled === false) {
      pushToast('The seller has disabled in-app chat.', 'error');
      return;
    }

    const chatId = getChatIdForPart(part.id, user.uid, part.sellerUid);
    const buyerName = userProfile?.displayName || getFallbackDisplayName(user, language);
    const sellerName = sellerProfile?.displayName || part.sellerDisplayName || part.sellerEmail || 'Seller';

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
      pushToast('Chat opened.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Chat could not be started.', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      pushToast('Signed out successfully.', 'success');
    } catch (error) {
      console.error(error);
      pushToast('Sign out failed.', 'error');
    }
  };

  const handleInstallApp = useCallback(async () => {
    if (!installPromptEvent) {
      pushToast('Install prompt is not available right now.', 'info');
      return;
    }

    try {
      installPromptEvent.prompt();
      await installPromptEvent.userChoice;
    } catch (error) {
      console.error(error);
    } finally {
      setInstallPromptEvent(null);
    }
  }, [installPromptEvent, pushToast]);

  const handleDismissInstallHint = useCallback(() => {
    setInstallHintDismissed(true);
    localStorage.setItem(INSTALL_DISMISS_KEY, '1');
  }, []);

  const installAvailable = Boolean(installPromptEvent) && !installHintDismissed;

  return (
    <div className="pf-page">
      {authLoading ? (
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-[1.75rem] pf-card p-8 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-[var(--pf-primary-soft)]" />
            <p className="text-lg font-semibold text-[var(--pf-text)]">
              {language === 'de' ? 'Autoteile-Marktplatz laedt...' : 'Loading auto parts marketplace...'}
            </p>
            <p className="mt-2 text-sm text-[var(--pf-muted)]">
              {language === 'de' ? 'Auth-Status wird geprueft.' : 'Checking authentication status.'}
            </p>
          </div>
        </div>
      ) : user ? (
        activeView === 'dashboard' ? (
          <Dashboard
            language={language}
            onLanguageChange={setLanguage}
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
            language={language}
            onLanguageChange={setLanguage}
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
            installAvailable={installAvailable}
            onInstallApp={handleInstallApp}
            onDismissInstallHint={handleDismissInstallHint}
          />
        )
      ) : (
        <Auth
          language={language}
          onLanguageChange={setLanguage}
          onToast={pushToast}
          theme={theme}
          onThemeChange={setTheme}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
}
