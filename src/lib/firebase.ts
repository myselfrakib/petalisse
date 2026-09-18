import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCvT_Q9H_sICmIw83KE3H9r2iXrEJJ08UU",
  authDomain: "petalisse-1b489.firebaseapp.com",
  projectId: "petalisse-1b489",
  storageBucket: "petalisse-1b489.firebasestorage.app",
  messagingSenderId: "890535935364",
  appId: "1:890535935364:web:2e8fee8b61ce76a29031d1",
  measurementId: "G-RZTRW3EBXQ"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
