import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Product, SiteContent } from '../types';
import { products as initialProducts } from '../data/products';

const DEFAULT_SITE_CONTENT: SiteContent = {
  announcementText: 'Free Shipping on All Orders Over $50 | Handmade with Love',
  heroTagline: 'Handmade in small batches',
  heroTitle: 'Handmade with love, just for you.',
  heroSubtitle: 'Discover whimsical charms, delicate accessories, and magical keepsakes crafted to brighten your everyday.',
  heroBannerUrl: '/figma-assets/72be1c70e0a5c4d0ec598f828ae877ae84f509d4.png',
  promoBannerText: 'Crafted for the Dreamers & Collectors',
  promoBannerSubtext: 'Each charm carries its own gentle story, sculpted by hand with delicate intention and finished with artisanal ribbon.',
  promoBannerUrl: '/figma-assets/72be1c70e0a5c4d0ec598f828ae877ae84f509d4.png',
  aboutTitle: 'The Petalisse Story',
  aboutDescription: 'Born from a love of quiet beauty, Petalisse creates delicate handmade charms, beaded treasures, and sculpted keepsakes that bring everyday enchantment.',
  craftsmanshipTitle: 'Artisanal Care in Every Petal',
  craftsmanshipText: 'Every bead is hand-knotted, every bow hand-tied, and every clay blossom sculpted one petal at a time in our sunlit boutique atelier.',
  fabricItems: [
    { title: 'Hand-Molded Clay', desc: 'Sculpted petals baked to gentle perfection', img: '/figma-assets/a53065cbd3c94f32f92edb4e749a2fac1e370cbe.png' },
    { title: 'Artisan Glass Beads', desc: 'Light-catching crystal, pearl & lampwork beads', img: '/figma-assets/aac1d8d4d024ee6d6c049df2d059dfd80fda2226.png' },
    { title: 'Silk & Velvet Ribbons', desc: 'Soft-touch french ribbons for an heirloom feel', img: '/figma-assets/c985c36ff39bdb6b9a8d2827b0a9f08ad612b3b1.png' },
  ]
};

interface ContentContextType {
  products: Product[];
  siteContent: SiteContent;
  loading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<string>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateSiteContent: (content: Partial<SiteContent>) => Promise<void>;
  uploadImage: (file: File, folder?: string) => Promise<string>;
  seedInitialProductsToFirestore: () => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState<boolean>(true);

  // Subscribe to Products collection
  useEffect(() => {
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Product[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              list.push({
                id: docSnap.id,
                name: data.name || '',
                category: data.category || 'Mobile Charms',
                price: Number(data.price) || 0,
                discountedPrice: data.discountedPrice !== undefined ? Number(data.discountedPrice) : undefined,
                img: data.img || '',
                alt: data.alt || data.name || '',
                description: data.description || '',
                badge: data.badge || undefined,
                details: data.details || [],
                createdAt: data.createdAt,
              });
            });
            setProducts(list);
          } else {
            // Keep initialProducts if firestore is empty
            setProducts(initialProducts);
          }
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore products snapshot warning:', error);
          setProducts(initialProducts);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Could not initialize products listener:', e);
      setProducts(initialProducts);
      setLoading(false);
    }
  }, []);

  // Subscribe to site content document
  useEffect(() => {
    try {
      const contentDoc = doc(db, 'site_content', 'homepage');
      const unsub = onSnapshot(
        contentDoc,
        (docSnap) => {
          if (docSnap.exists()) {
            setSiteContent({
              ...DEFAULT_SITE_CONTENT,
              ...(docSnap.data() as SiteContent),
            });
          } else {
            setSiteContent(DEFAULT_SITE_CONTENT);
          }
        },
        (error) => {
          console.warn('Site content snapshot warning:', error);
          setSiteContent(DEFAULT_SITE_CONTENT);
        }
      );
      return () => unsub();
    } catch (e) {
      console.warn('Could not initialize site content listener:', e);
      setSiteContent(DEFAULT_SITE_CONTENT);
    }
  }, []);

  const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    const docRef = await addDoc(collection(db, 'products'), {
      ...productData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  };

  const updateProduct = async (id: string, productData: Partial<Product>): Promise<void> => {
    const docRef = doc(db, 'products', id);
    await updateDoc(docRef, {
      ...productData,
      updatedAt: serverTimestamp(),
    });
  };

  const deleteProduct = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, 'products', id));
  };

  const updateSiteContent = async (newContent: Partial<SiteContent>): Promise<void> => {
    const contentDoc = doc(db, 'site_content', 'homepage');
    await setDoc(contentDoc, {
      ...newContent,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    setSiteContent((prev) => ({ ...prev, ...newContent }));
  };

  const uploadImage = async (file: File, folder = 'products'): Promise<string> => {
    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `${folder}/${timestamp}_${safeName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (err) {
      console.warn('Firebase storage upload fallback to base64:', err);
      // Resilient fallback to DataURL so admin is never blocked even if storage bucket isn't initialized yet!
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    }
  };

  const seedInitialProductsToFirestore = async () => {
    for (const p of initialProducts) {
      const { id, ...rest } = p;
      await addDoc(collection(db, 'products'), {
        ...rest,
        createdAt: serverTimestamp(),
      });
    }
  };

  return (
    <ContentContext.Provider
      value={{
        products,
        siteContent,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        updateSiteContent,
        uploadImage,
        seedInitialProductsToFirestore,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
