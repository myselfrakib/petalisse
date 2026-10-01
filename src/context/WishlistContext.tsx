import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => Promise<void>;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'petalisse_wishlist';
const LEGACY_STORAGE_KEY = 'petalisse_favorites';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      // Migrate from legacy favorites if exists
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (typeof parsed === 'object' && parsed !== null) {
          return Object.keys(parsed).filter((k) => !!parsed[k]);
        }
      }
    } catch (e) {
      console.warn('Error reading local wishlist:', e);
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Helper to persist locally and update state
  const persistLocal = useCallback((items: string[]) => {
    setWishlist(items);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
      // Keep legacy format in sync for backward compatibility
      const legacyObj: Record<string, boolean> = {};
      items.forEach((id) => {
        legacyObj[id] = true;
      });
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(legacyObj));
    } catch (e) {
      console.warn('Failed to save wishlist locally:', e);
    }
  }, []);

  // Sync with Firestore DB when user logs in / changes
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let unsub = () => {};

    const syncWithFirestore = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);

        unsub = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (Array.isArray(data.wishlist)) {
                // Merge remote with current local items
                setWishlist((currentLocal) => {
                  const combined = Array.from(new Set([...data.wishlist, ...currentLocal]));
                  try {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
                  } catch {}
                  return combined;
                });
              }
            }
            setLoading(false);
          },
          (error) => {
            console.warn('Wishlist snapshot warning:', error);
            setLoading(false);
          }
        );

        // Initial merge push to Firestore if local items exist
        const initialSnap = await getDoc(userDocRef);
        let remoteList: string[] = [];
        if (initialSnap.exists() && Array.isArray(initialSnap.data()?.wishlist)) {
          remoteList = initialSnap.data().wishlist;
        }

        const merged = Array.from(new Set([...remoteList, ...wishlist]));
        if (merged.length > remoteList.length) {
          await setDoc(
            userDocRef,
            { wishlist: merged, updatedAt: serverTimestamp() },
            { merge: true }
          );
        }
      } catch (err) {
        console.warn('Could not sync wishlist with Firestore:', err);
        setLoading(false);
      }
    };

    syncWithFirestore();

    return () => unsub();
  }, [currentUser?.uid]);

  // Check if item is wishlisted
  const isWishlisted = useCallback(
    (productId: string) => {
      return wishlist.includes(productId);
    },
    [wishlist]
  );

  // Toggle wishlist item
  const toggleWishlist = useCallback(
    async (productId: string) => {
      const exists = wishlist.includes(productId);
      const nextList = exists
        ? wishlist.filter((id) => id !== productId)
        : [...wishlist, productId];

      persistLocal(nextList);

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userDocRef,
            { wishlist: nextList, updatedAt: serverTimestamp() },
            { merge: true }
          );
        } catch (err) {
          console.warn('Failed to update wishlist in Firestore:', err);
        }
      }
    },
    [wishlist, currentUser, persistLocal]
  );

  // Add item
  const addToWishlist = useCallback(
    async (productId: string) => {
      if (wishlist.includes(productId)) return;
      const nextList = [...wishlist, productId];
      persistLocal(nextList);

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userDocRef,
            { wishlist: nextList, updatedAt: serverTimestamp() },
            { merge: true }
          );
        } catch (err) {
          console.warn('Failed to add to wishlist in Firestore:', err);
        }
      }
    },
    [wishlist, currentUser, persistLocal]
  );

  // Remove item
  const removeFromWishlist = useCallback(
    async (productId: string) => {
      if (!wishlist.includes(productId)) return;
      const nextList = wishlist.filter((id) => id !== productId);
      persistLocal(nextList);

      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          await setDoc(
            userDocRef,
            { wishlist: nextList, updatedAt: serverTimestamp() },
            { merge: true }
          );
        } catch (err) {
          console.warn('Failed to remove from wishlist in Firestore:', err);
        }
      }
    },
    [wishlist, currentUser, persistLocal]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isWishlisted,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        loading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
