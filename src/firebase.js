import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCvNwbM1B-ySP6gNWz1A9ESk5IvNQy0wgY',
  authDomain: 'pung-pong.firebaseapp.com',
  databaseURL: 'https://pung-pong-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'pung-pong',
  storageBucket: 'pung-pong.firebasestorage.app',
  messagingSenderId: '742806617606',
  appId: '1:742806617606:web:f5a3e11c4a8c5056118d87',
  measurementId: 'G-KX1101MV53',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const initAnalytics = async () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const supported = await analyticsSupported();
  return supported ? getAnalytics(app) : null;
};

export { app, auth, db, initAnalytics };
