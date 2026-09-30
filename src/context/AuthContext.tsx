import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, Address } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name?: string, phone?: string) => Promise<void>;
  adminSignup: (email: string, pass: string, name: string) => Promise<void>;
  loginAsDemoAdmin: () => void;
  checkAdminStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
  saveAddress: (address: Address) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfileAndRole = async (user: User | null) => {
    if (!user) {
      setUserProfile(null);
      setIsAdmin(false);
      return;
    }

    try {
      // 1. Check user profile
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      let profileData: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || '',
      };

      let userIsAdmin = false;

      if (userSnap.exists()) {
        const uData = userSnap.data() as UserProfile;
        profileData = { ...profileData, ...uData };
        if (uData.isAdmin === true) {
          userIsAdmin = true;
        }
      }
      setUserProfile(profileData);

      // 2. Check admin authorization status directly from Firestore
      const adminRef = doc(db, 'admins', user.uid);
      const adminSnap = await getDoc(adminRef);

      if (adminSnap.exists() && adminSnap.data()?.isAdmin === true) {
        userIsAdmin = true;
      }

      setIsAdmin(userIsAdmin);
    } catch (err) {
      console.warn('Could not fetch user/admin profile:', err);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Clear any legacy demo admin flag
    localStorage.removeItem('petalisse_demo_admin');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await fetchProfileAndRole(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsDemoAdmin = () => {
    console.warn('Instant demo admin access has been removed. isAdmin: true must be set directly in the database.');
  };

  const login = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    await fetchProfileAndRole(cred.user);
  };

  const signup = async (email: string, pass: string, name?: string, phone?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }

    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email,
      name: name || '',
      phone: phone || '',
      isAdmin: false,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    } catch (e) {
      console.warn('Firestore user creation warning:', e);
    }

    await fetchProfileAndRole(cred.user);
  };

  const adminSignup = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });

    // New admin registrations are created with isAdmin: false and status: 'pending'.
    // isAdmin: true can only be granted directly in the database (Firestore) by an administrator.
    const adminRecord = {
      uid: cred.user.uid,
      email,
      name,
      isAdmin: false,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'admins', cred.user.uid), adminRecord);
      await setDoc(doc(db, 'users', cred.user.uid), {
        uid: cred.user.uid,
        email,
        name,
        isAdmin: false,
        role: 'admin_applicant',
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Admin record creation warning:', e);
    }

    setIsAdmin(false);
    await fetchProfileAndRole(cred.user);
  };

  const checkAdminStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) {
      setIsAdmin(false);
      return false;
    }
    try {
      // 1. Check admins collection
      const adminRef = doc(db, 'admins', auth.currentUser.uid);
      const snap = await getDoc(adminRef);
      if (snap.exists() && snap.data()?.isAdmin === true) {
        setIsAdmin(true);
        return true;
      }
      // 2. Check users collection
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data()?.isAdmin === true) {
        setIsAdmin(true);
        return true;
      }
      setIsAdmin(false);
      return false;
    } catch (e) {
      console.warn('Failed checking admin status:', e);
      setIsAdmin(false);
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem('petalisse_demo_admin');
    await signOut(auth).catch(() => {});
    setCurrentUser(null);
    setUserProfile(null);
    setIsAdmin(false);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    // Ensure isAdmin can never be altered from the client site
    const { isAdmin: _stripIsAdmin, ...safeData } = data as any;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        ...safeData,
        updatedAt: serverTimestamp(),
      });
      setUserProfile((prev) => (prev ? { ...prev, ...safeData } : null));
    } catch (e) {
      await setDoc(doc(db, 'users', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email || '',
        ...safeData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setUserProfile((prev) => (prev ? { ...prev, ...safeData } : null));
    }
  };

  const saveAddress = async (address: Address) => {
    if (!currentUser) return;
    const addrId = address.id || `addr_${Date.now()}`;
    const addrRef = doc(db, 'users', currentUser.uid, 'addresses', addrId);
    await setDoc(addrRef, { ...address, id: addrId, updatedAt: serverTimestamp() }, { merge: true });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        login,
        signup,
        adminSignup,
        loginAsDemoAdmin,
        checkAdminStatus,
        logout,
        resetPassword,
        updateUserProfileData,
        saveAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
