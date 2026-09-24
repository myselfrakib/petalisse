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
import { Product, SiteContent, Order } from '../types';

const DEFAULT_SITE_CONTENT: SiteContent = {
  announcementText: 'Free Shipping on All Orders Over $50 | Handmade with Love',
  heroTagline: 'Made slowly, loved endlessly',
  heroTitle: 'Handmade with love, just for you.',
  heroSubtitle: 'Discover whimsical charms, delicate accessories, and magical keepsakes crafted to brighten your everyday.',
  heroBannerUrl: '/figma-assets/72be1c70e0a5c4d0ec598f828ae877ae84f509d4.png',
  promoBannerText: 'Crafted for the Dreamers & Collectors',
  promoBannerSubtext: 'Each charm carries its own gentle story, sculpted by hand with delicate intention and finished with artisanal ribbon.',
  promoBannerUrl: '/figma-assets/72be1c70e0a5c4d0ec598f828ae877ae84f509d4.png',
  aboutTitle: 'Your little handmade corner, with more love in every piece.',
  aboutDescription: 'Each charm and jar is patiently sculpted, beaded, and tied in our cozy home studio to bring sweet magic to your daily life.',
  craftsmanshipTitle: 'Artisanal Care in Every Petal',
  craftsmanshipText: 'Every bead is hand-knotted, every bow hand-tied, and every clay blossom sculpted one petal at a time in our sunlit boutique atelier.',
  fabricItems: [
    { title: 'Hand-Molded Clay', desc: 'Sculpted petals baked to gentle perfection', img: '/figma-assets/a53065cbd3c94f32f92edb4e749a2fac1e370cbe.png' },
    { title: 'Artisan Glass Beads', desc: 'Light-catching crystal, pearl & lampwork beads', img: '/figma-assets/aac1d8d4d024ee6d6c049df2d059dfd80fda2226.png' },
    { title: 'Silk & Velvet Ribbons', desc: 'Soft-touch french ribbons for an heirloom feel', img: '/figma-assets/c985c36ff39bdb6b9a8d2827b0a9f08ad612b3b1.png' },
  ]
};

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord_1001',
    userEmail: 'clara@petalisse.com',
    customerName: 'Clara Avery',
    phone: '(555) 019-2831',
    shippingAddress: '123 Cozy Lane, Floral Town',
    items: [
      {
        id: 'rose-garden-charm',
        name: 'Rose Garden Charm',
        price: 18,
        quantity: 2,
        img: '/figma-assets/aac1d8d4d024ee6d6c049df2d059dfd80fda2226.png',
      },
      {
        id: 'daisy-chain-bag-charm',
        name: 'Daisy Chain Bag Charm',
        price: 21,
        quantity: 1,
        img: '/figma-assets/c985c36ff39bdb6b9a8d2827b0a9f08ad612b3b1.png',
      },
    ],
    subtotal: 57,
    discount: 5.7,
    total: 51.3,
    status: 'processing',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'ord_1002',
    userEmail: 'maya.patel@gmail.com',
    customerName: 'Maya Patel',
    phone: '+91 98201 12345',
    shippingAddress: '74 Blossom St, Bangalore, KA - 560001',
    items: [
      {
        id: 'surprise-mystery-jar',
        name: 'Surprise Mystery Charm Jar',
        price: 26,
        quantity: 1,
        img: '/figma-assets/a53065cbd3c94f32f92edb4e749a2fac1e370cbe.png',
      },
    ],
    subtotal: 26,
    discount: 0,
    total: 31,
    status: 'delivered',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  }
];

// Helper to compress images for lightweight transmission & storage
const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 900;
        const MAX_HEIGHT = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

interface ContentContextType {
  products: Product[];
  siteContent: SiteContent;
  orders: Order[];
  loading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<string>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateSiteContent: (content: Partial<SiteContent>) => Promise<void>;
  uploadImage: (file: File, folder?: string) => Promise<string>;
  seedInitialProductsToFirestore: () => Promise<void>;
  createOrder: (orderData: Omit<Order, 'id'>) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

// Set up cross-tab broadcast channel
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('petalisse_live_channel');
  }
} catch (e) {
  console.warn('BroadcastChannel not initialized:', e);
}

// List of legacy demo product IDs to strictly exclude
const DEMO_PRODUCT_IDS = new Set([
  'rose-garden-charm',
  'lavender-dreams',
  'daisy-chain-bag-charm',
  'velvet-bow-charm',
  'surprise-mystery-jar',
  'pearl-blossom-charm',
]);

// Helper to track permanently deleted product IDs
const getDeletedProductIds = (): Set<string> => {
  try {
    const saved = localStorage.getItem('petalisse_deleted_product_ids');
    if (saved) return new Set(JSON.parse(saved));
  } catch {}
  return new Set();
};

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initial State from localStorage (strictly live products only, no demo items)
  const [products, setProducts] = useState<Product[]>(() => {
    const deleted = getDeletedProductIds();
    try {
      const saved = localStorage.getItem('petalisse_products');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p) => !DEMO_PRODUCT_IDS.has(p.id) && !deleted.has(p.id));
        }
      }
    } catch (e) {
      console.warn('Error reading saved products:', e);
    }
    return [];
  });

  const [siteContent, setSiteContent] = useState<SiteContent>(() => {
    try {
      const saved = localStorage.getItem('petalisse_site_content');
      if (saved) {
        return { ...DEFAULT_SITE_CONTENT, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Error reading saved site content:', e);
    }
    return DEFAULT_SITE_CONTENT;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('petalisse_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading saved orders:', e);
    }
    return INITIAL_ORDERS;
  });

  const [loading, setLoading] = useState<boolean>(true);

  // Sync state helpers that update state, localStorage, and broadcast across tabs
  const syncProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      localStorage.setItem('petalisse_products', JSON.stringify(newProducts));
      broadcastChannel?.postMessage({ type: 'PRODUCTS_UPDATED', data: newProducts });
    } catch (e) {
      console.warn('Failed to save products to localStorage:', e);
    }
  };

  const syncSiteContent = (newContent: SiteContent) => {
    setSiteContent(newContent);
    try {
      localStorage.setItem('petalisse_site_content', JSON.stringify(newContent));
      broadcastChannel?.postMessage({ type: 'CONTENT_UPDATED', data: newContent });
    } catch (e) {
      console.warn('Failed to save site content to localStorage:', e);
    }
  };

  const syncOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    try {
      localStorage.setItem('petalisse_orders', JSON.stringify(newOrders));
      broadcastChannel?.postMessage({ type: 'ORDERS_UPDATED', data: newOrders });
    } catch (e) {
      console.warn('Failed to save orders to localStorage:', e);
    }
  };

  // Cross-tab listener
  useEffect(() => {
    const handleBroadcast = (event: MessageEvent) => {
      const { type, data } = event.data || {};
      if (type === 'PRODUCTS_UPDATED' && Array.isArray(data)) {
        setProducts(data);
      } else if (type === 'CONTENT_UPDATED' && data) {
        setSiteContent(data);
      } else if (type === 'ORDERS_UPDATED' && Array.isArray(data)) {
        setOrders(data);
      }
    };

    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleBroadcast);
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'petalisse_products' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setProducts(parsed.filter((p) => !DEMO_PRODUCT_IDS.has(p.id)));
          }
        } catch {}
      } else if (e.key === 'petalisse_site_content' && e.newValue) {
        try {
          setSiteContent(JSON.parse(e.newValue));
        } catch {}
      } else if (e.key === 'petalisse_orders' && e.newValue) {
        try {
          setOrders(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleBroadcast);
      }
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // 2. Subscribe to Products in Firestore (ONLY live products, strictly no demo items)
  useEffect(() => {
    let unsub = () => {};
    try {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(
        q,
        (snapshot) => {
          const list: Product[] = [];
          if (!snapshot.empty) {
            snapshot.forEach((docSnap) => {
              if (DEMO_PRODUCT_IDS.has(docSnap.id)) return;

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
          }

          const deleted = getDeletedProductIds();
          const valid = list.filter((p) => !deleted.has(p.id));
          setProducts(valid);
          try {
            localStorage.setItem('petalisse_products', JSON.stringify(valid));
          } catch {}
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore products snapshot warning:', error);
          setLoading(false);
        }
      );
    } catch (e) {
      console.warn('Could not initialize products listener:', e);
      setLoading(false);
    }
    return () => unsub();
  }, []);

  // 3. Subscribe to Site Content in Firestore
  useEffect(() => {
    let unsub = () => {};
    try {
      const contentDoc = doc(db, 'site_content', 'homepage');
      unsub = onSnapshot(
        contentDoc,
        (docSnap) => {
          if (docSnap.exists()) {
            const remote = docSnap.data() as SiteContent;
            setSiteContent((prev) => {
              const merged = { ...prev, ...remote };
              try {
                localStorage.setItem('petalisse_site_content', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        },
        (error) => {
          console.warn('Site content snapshot warning:', error);
        }
      );
    } catch (e) {
      console.warn('Could not initialize site content listener:', e);
    }
    return () => unsub();
  }, []);

  // 4. Subscribe to Orders in Firestore
  useEffect(() => {
    let unsub = () => {};
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: Order[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              list.push({
                id: docSnap.id,
                userId: data.userId,
                userEmail: data.userEmail || 'guest@petalisse.com',
                customerName: data.customerName || 'Boutique Patron',
                shippingAddress: data.shippingAddress || '',
                phone: data.phone || '',
                items: data.items || [],
                subtotal: Number(data.subtotal) || 0,
                discount: Number(data.discount) || 0,
                total: Number(data.total) || 0,
                status: data.status || 'pending',
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
              });
            });
            setOrders(list);
            try {
              localStorage.setItem('petalisse_orders', JSON.stringify(list));
            } catch {}
          }
        },
        (error) => {
          console.warn('Orders snapshot warning:', error);
        }
      );
    } catch (e) {
      console.warn('Could not initialize orders listener:', e);
    }
    return () => unsub();
  }, []);

  // Product Actions
  const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProduct: Product = {
      ...productData,
      id,
      createdAt: new Date().toISOString(),
    };

    // Instant local state & cross-tab sync
    syncProducts([newProduct, ...products]);

    // Asynchronous Firestore sync
    try {
      await setDoc(doc(db, 'products', id), {
        ...productData,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore addDoc fallback (saved locally & broadcast live):', e);
    }

    return id;
  };

  const updateProduct = async (id: string, productData: Partial<Product>): Promise<void> => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...productData } : p));
    syncProducts(updated);

    try {
      await updateDoc(doc(db, 'products', id), {
        ...productData,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore updateDoc fallback (saved locally & broadcast live):', e);
      // If doc didn't exist in Firestore, set it
      try {
        const full = updated.find((p) => p.id === id);
        if (full) {
          await setDoc(doc(db, 'products', id), { ...full, updatedAt: serverTimestamp() }, { merge: true });
        }
      } catch {}
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    // Record in permanently deleted IDs set
    const deleted = getDeletedProductIds();
    deleted.add(id);
    try {
      localStorage.setItem('petalisse_deleted_product_ids', JSON.stringify([...deleted]));
    } catch {}

    const remaining = products.filter((p) => p.id !== id);
    syncProducts(remaining);

    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (e) {
      console.warn('Firestore deleteDoc fallback (deleted locally & broadcast live):', e);
    }
  };

  const updateSiteContent = async (newContent: Partial<SiteContent>): Promise<void> => {
    const updated: SiteContent = {
      ...siteContent,
      ...newContent,
    };
    syncSiteContent(updated);

    try {
      const contentDoc = doc(db, 'site_content', 'homepage');
      await setDoc(contentDoc, {
        ...newContent,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch (e) {
      console.warn('Firestore site content update fallback (saved locally & broadcast live):', e);
    }
  };

  const uploadImage = async (file: File, folder = 'products'): Promise<string> => {
    // First, compress image so it never exceeds Firestore/localStorage sizes
    let compressedDataUrl = '';
    try {
      compressedDataUrl = await compressImageFile(file);
    } catch (e) {
      console.warn('Compression failed, using file as is:', e);
    }

    try {
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storageRef = ref(storage, `${folder}/${timestamp}_${safeName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (err) {
      console.warn('Firebase storage upload fallback to optimized DataURL:', err);
      return compressedDataUrl || new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    }
  };

  const seedInitialProductsToFirestore = async () => {
    // Purge any legacy demo products from Firestore & local state
    for (const demoId of DEMO_PRODUCT_IDS) {
      try {
        await deleteDoc(doc(db, 'products', demoId));
      } catch (e) {
        console.warn(`Could not delete demo product ${demoId}:`, e);
      }
    }
    const cleanList = products.filter((p) => !DEMO_PRODUCT_IDS.has(p.id));
    syncProducts(cleanList);
  };

  // Order Actions
  const createOrder = async (orderData: Omit<Order, 'id'>): Promise<string> => {
    const id = `ord_${Date.now()}`;
    const newOrder: Order = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
    };

    // Instant local & cross-tab sync
    syncOrders([newOrder, ...orders]);

    try {
      await setDoc(doc(db, 'orders', id), {
        ...orderData,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore order save fallback (saved locally & broadcast live):', e);
    }

    return id;
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    syncOrders(updated);

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Firestore order status update fallback:', e);
    }
  };

  const deleteOrder = async (orderId: string): Promise<void> => {
    const remaining = orders.filter((o) => o.id !== orderId);
    syncOrders(remaining);

    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (e) {
      console.warn('Firestore delete order fallback:', e);
    }
  };

  return (
    <ContentContext.Provider
      value={{
        products,
        siteContent,
        orders,
        loading,
        addProduct,
        updateProduct,
        deleteProduct,
        updateSiteContent,
        uploadImage,
        seedInitialProductsToFirestore,
        createOrder,
        updateOrderStatus,
        deleteOrder,
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
