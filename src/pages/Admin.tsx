import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { Product, SiteContent, Order, SplashScreenConfig, ProductVariant } from '../types';
import { CATEGORIES } from '../data/products';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link, Navigate } from 'react-router';
import { getColorHex, SUGGESTED_COLORS } from '../lib/colorUtils';
import { SplashScreen } from '../components/SplashScreen';
import { ImageCropModal } from '../components/ImageCropModal';
import { ShiprocketShipmentModal } from '../components/ShiprocketShipmentModal';
import { ShiprocketTrackingModal } from '../components/ShiprocketTrackingModal';
import {
  getStoredCredentials,
  saveStoredCredentials,
  getShiprocketToken,
} from '../lib/shiprocket';

export const ALL_COLLECTION_TEMPLATES = [
  { key: 'Mobile Charms', label: 'Mobile Charms', defaultImg: '/figma-assets/2416c5a3da640dcea42f85f7a71067eac0c58ca9.png' },
  { key: 'Bag Charms', label: 'Bag Charms', defaultImg: '/figma-assets/2b39a24648f5a21e9e527dfe97992fd042715209.png' },
  { key: 'Mystery Jars', label: 'Mystery Jars', defaultImg: '/figma-assets/1908ddbd2af05246c15d1de98d9563a4801070c0.png' },
  { key: 'Jewellery', label: 'Jewellery', defaultImg: '/figma-assets/aac1d8d4d024ee6d6c049df2d059dfd80fda2226.png' },
  { key: 'Hair Accessories', label: 'Hair Accessories', defaultImg: '/figma-assets/c985c36ff39bdb6b9a8d2827b0a9f08ad612b3b1.png' },
  { key: 'Desk & Room Decor', label: 'Desk & Room Decor', defaultImg: '/figma-assets/e8a9f4c7977ea3291af5fdf421b0c3f7801f21ed.png' },
  { key: 'Cute Functional Things', label: 'Cute Functional Things', defaultImg: '/figma-assets/a53065cbd3c94f32f92edb4e749a2fac1e370cbe.png' },
];

const LottiePreview: React.FC<{ mediaUrl?: string; lottieData?: string }> = ({ mediaUrl, lottieData }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let anim: any = null;
    let isCancelled = false;

    const init = async () => {
      try {
        let lottie = (window as any).lottie;
        if (!lottie) {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src*="lottie-web"]');
            if (existing) {
              existing.addEventListener('load', () => resolve());
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
          lottie = (window as any).lottie;
        }

        if (isCancelled || !containerRef.current || !lottie) return;
        containerRef.current.innerHTML = '';

        let animData: any = undefined;
        let animPath: string | undefined = undefined;

        if (lottieData) {
          try {
            animData = typeof lottieData === 'string' ? JSON.parse(lottieData) : lottieData;
          } catch {
            animPath = mediaUrl;
          }
        } else {
          animPath = mediaUrl;
        }

        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          ...(animData ? { animationData: animData } : { path: animPath }),
        });
      } catch (e) {
        console.warn('Lottie preview err:', e);
      }
    };

    init();

    return () => {
      isCancelled = true;
      if (anim) {
        try {
          anim.destroy();
        } catch {}
      }
    };
  }, [mediaUrl, lottieData]);

  return <div ref={containerRef} className="size-full flex items-center justify-center" />;
};

export const AdminPage: React.FC = () => {
  const { 
    currentUser, 
    userProfile,
    isAdmin, 
    loading: authLoading, 
    login, 
    adminSignup, 
    checkAdminStatus, 
    logout 
  } = useAuth();
  
  const { 
    products, 
    siteContent, 
    orders,
    addProduct, 
    updateProduct, 
    deleteProduct, 
    updateSiteContent, 
    uploadImage, 
    uploadMedia,
    updateOrderStatus,
    updateOrderShipment,
    deleteOrder,
    toggleProductFavorite,
    setFeaturedProducts,
    coupons,
    addCoupon,
    updateCoupon,
    deleteCoupon,
  } = useContent();


  // Dashboard Active Tab (persisted across refreshes)
  const [activeTab, setActiveTab] = useState<'products' | 'cms' | 'orders' | 'admins' | 'splash' | 'coupons'>(() => {
    try {
      const saved = localStorage.getItem('petalisse_admin_tab');
      if (saved === 'products' || saved === 'cms' || saved === 'orders' || saved === 'admins' || saved === 'splash' || saved === 'coupons') {
        return saved;
      }
    } catch {}
    return 'products';
  });

  // Hamburger drawer navigation state
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  // Coupon Manager Form State
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountType, setCouponDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponDiscountValue, setCouponDiscountValue] = useState<number | ''>(10);
  const [couponMinOrder, setCouponMinOrder] = useState<number | ''>('');
  const [couponMaxDiscount, setCouponMaxDiscount] = useState<number | ''>('');
  const [couponDesc, setCouponDesc] = useState('');
  const [couponExpiresAt, setCouponExpiresAt] = useState('');
  const [couponIsActive, setCouponIsActive] = useState(true);
  const [couponSubmitting, setCouponSubmitting] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponSearch, setCouponSearch] = useState('');
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    const numValue = Number(couponDiscountValue);
    if (!numValue || numValue <= 0) {
      setCouponError('Please enter a valid discount value greater than 0.');
      return;
    }

    if (couponDiscountType === 'percentage' && numValue > 100) {
      setCouponError('Percentage discount cannot exceed 100%.');
      return;
    }

    setCouponSubmitting(true);
    try {
      const payload: any = {
        code: cleanCode,
        discountType: couponDiscountType,
        discountValue: numValue,
        isActive: couponIsActive,
      };
      if (couponMinOrder !== '' && !isNaN(Number(couponMinOrder))) {
        payload.minOrderValue = Number(couponMinOrder);
      }
      if (couponMaxDiscount !== '' && !isNaN(Number(couponMaxDiscount))) {
        payload.maxDiscount = Number(couponMaxDiscount);
      }
      if (couponDesc.trim()) {
        payload.description = couponDesc.trim();
      }
      if (couponExpiresAt) {
        payload.expiresAt = couponExpiresAt;
      }
      await addCoupon(payload);

      setCouponSuccess(`Coupon "${cleanCode}" created successfully!`);
      // Reset form
      setCouponCode('');
      setCouponDiscountType('percentage');
      setCouponDiscountValue(10);
      setCouponMinOrder('');
      setCouponMaxDiscount('');
      setCouponDesc('');
      setCouponExpiresAt('');
      setCouponIsActive(true);
    } catch (err: any) {
      setCouponError(err.message || 'Failed to create coupon.');
    } finally {
      setCouponSubmitting(false);
    }
  };

  const handleToggleCouponActive = async (id: string, currentActive: boolean) => {
    try {
      await updateCoupon(id, { isActive: !currentActive });
    } catch (err) {
      console.warn('Could not toggle coupon active status:', err);
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) {
      return;
    }
    try {
      await deleteCoupon(id);
    } catch (err) {
      console.warn('Could not delete coupon:', err);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCouponId(id);
    setTimeout(() => setCopiedCouponId(null), 2000);
  };

  useEffect(() => {
    try {
      localStorage.setItem('petalisse_admin_tab', activeTab);
    } catch {}
  }, [activeTab]);

  // Splash Screen Tab State
  const [splashConfig, setSplashConfig] = useState<SplashScreenConfig>(() => {
    return siteContent.splashScreen || {
      enabled: false,
      mediaType: 'gif',
      mediaUrl: '',
      lottieData: '',
      duration: 3.5,
      autoDismiss: true,
      showSkipButton: true,
      title: 'Petalisse',
      subtitle: 'Handcrafted Charms & Keepsakes',
      backgroundColor: '#FDFBF7',
      showOncePerSession: true,
    };
  });

  const [savingSplash, setSavingSplash] = useState(false);
  const [splashSaveMsg, setSplashSaveMsg] = useState<string | null>(null);
  const [uploadingSplashMedia, setUploadingSplashMedia] = useState(false);
  const [testingSplash, setTestingSplash] = useState(false);
  const [jsonInputOpen, setJsonInputOpen] = useState(false);

  // Sync state if siteContent.splashScreen updates from Firestore/broadcast
  useEffect(() => {
    if (siteContent.splashScreen) {
      setSplashConfig((prev) => ({
        ...siteContent.splashScreen!,
        ...prev,
      }));
    }
  }, [siteContent.splashScreen]);

  const handleSplashMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSplashMedia(true);
    setSplashSaveMsg(null);

    try {
      // 1. Lottie JSON File
      if (file.name.endsWith('.json') || file.type === 'application/json') {
        const text = await file.text();
        try {
          JSON.parse(text);
        } catch {
          throw new Error('The selected file is not valid JSON format.');
        }

        const uploadedUrl = await uploadMedia(file, 'splash');
        setSplashConfig((prev) => ({
          ...prev,
          mediaType: 'lottie',
          mediaUrl: uploadedUrl,
          lottieData: text,
        }));
      } else if (file.type.startsWith('video/')) {
        // 2. Video file (.mp4, .webm, .mov)
        const uploadedUrl = await uploadMedia(file, 'splash');
        setSplashConfig((prev) => ({
          ...prev,
          mediaType: 'video',
          mediaUrl: uploadedUrl,
        }));
      } else if (!file.type.includes('gif') && file.type.startsWith('image/')) {
        // Static photo: queue for 9:16 vertical splash crop
        const dataUrl = URL.createObjectURL(file);
        setCropQueue([{
          file,
          dataUrl,
          title: 'Crop & Preview 9:16 Splash Photo',
          defaultAspectRatio: 9 / 16,
          aspectRatioLabel: '9:16 Vertical (Splash Screen)',
          onConfirm: async (croppedFile) => {
            setUploadingSplashMedia(true);
            try {
              const uploadedUrl = await uploadMedia(croppedFile, 'splash');
              setSplashConfig((prev) => ({
                ...prev,
                mediaType: 'gif',
                mediaUrl: uploadedUrl,
              }));
              setSplashSaveMsg('9:16 Splash photo uploaded! Click "Save Splash Screen" to apply.');
            } catch (err: any) {
              alert('Upload failed: ' + err.message);
            } finally {
              setUploadingSplashMedia(false);
            }
          },
          onSkip: async (originalFile) => {
            setUploadingSplashMedia(true);
            try {
              const uploadedUrl = await uploadMedia(originalFile, 'splash');
              setSplashConfig((prev) => ({
                ...prev,
                mediaType: 'gif',
                mediaUrl: uploadedUrl,
              }));
              setSplashSaveMsg('Splash photo uploaded! Click "Save Splash Screen" to apply.');
            } catch (err: any) {
              alert('Upload failed: ' + err.message);
            } finally {
              setUploadingSplashMedia(false);
            }
          },
        }]);
        setCropTotalCount(1);
        setCropCurrentIndex(1);
        setUploadingSplashMedia(false);
        e.target.value = '';
        return;
      } else {
        // 3. GIF / Animation file
        const uploadedUrl = await uploadMedia(file, 'splash');
        setSplashConfig((prev) => ({
          ...prev,
          mediaType: 'gif',
          mediaUrl: uploadedUrl,
        }));
      }
      setSplashSaveMsg('Media uploaded successfully! Click "Save Splash Screen" to apply changes.');
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingSplashMedia(false);
      e.target.value = '';
    }
  };

  const handleSaveSplashSettings = async (override?: Partial<SplashScreenConfig>) => {
    const toSave = { ...splashConfig, ...override };
    setSavingSplash(true);
    setSplashSaveMsg(null);
    try {
      await updateSiteContent({ splashScreen: toSave });
      setSplashSaveMsg('Splash screen settings saved and broadcast live!');
      setTimeout(() => setSplashSaveMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to save splash screen settings: ' + err.message);
    } finally {
      setSavingSplash(false);
    }
  };

  const applySplashPreset = (presetType: 'lottie' | 'gif' | 'video') => {
    if (presetType === 'lottie') {
      setSplashConfig((prev) => ({
        ...prev,
        mediaType: 'lottie',
        mediaUrl: 'https://assets2.lottiefiles.com/packages/lf20_5njp3vgg.json',
        lottieData: '',
        title: 'Petalisse',
        subtitle: 'Handcrafted Charms & Keepsakes',
        duration: 3.5,
        backgroundColor: '#FDFBF7',
      }));
    } else if (presetType === 'gif') {
      setSplashConfig((prev) => ({
        ...prev,
        mediaType: 'gif',
        mediaUrl: 'https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif',
        title: 'Petalisse Atelier',
        subtitle: 'Slow Crafts & Delicate Charms',
        duration: 3.5,
        backgroundColor: '#FDFBF7',
      }));
    } else if (presetType === 'video') {
      setSplashConfig((prev) => ({
        ...prev,
        mediaType: 'video',
        mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        title: 'Petalisse Boutique',
        subtitle: 'Opening Collection',
        duration: 4,
        backgroundColor: '#FAF0ED',
      }));
    }
  };

  // Unified Interactive Crop Queue State for All Photo Uploads
  interface ActiveCropSession {
    file: File;
    dataUrl: string;
    title: string;
    defaultAspectRatio: number;
    aspectRatioLabel: string;
    onConfirm: (croppedFile: File) => Promise<void>;
    onSkip?: (originalFile: File) => Promise<void>;
  }

  const [cropQueue, setCropQueue] = useState<ActiveCropSession[]>([]);
  const [cropTotalCount, setCropTotalCount] = useState(1);
  const [cropCurrentIndex, setCropCurrentIndex] = useState(1);
  const currentCropItem = cropQueue[0] || null;

  const handleAdvanceCropQueue = async (croppedFile: File) => {
    if (!currentCropItem) return;
    const item = currentCropItem;
    URL.revokeObjectURL(item.dataUrl);
    await item.onConfirm(croppedFile);
    setCropQueue((prev) => prev.slice(1));
    setCropCurrentIndex((prev) => prev + 1);
  };

  const handleSkipCurrentCrop = async () => {
    if (!currentCropItem) return;
    const item = currentCropItem;
    URL.revokeObjectURL(item.dataUrl);
    if (item.onSkip) {
      await item.onSkip(item.file);
    }
    setCropQueue((prev) => prev.slice(1));
    setCropCurrentIndex((prev) => prev + 1);
  };

  const handleCancelCropQueue = () => {
    cropQueue.forEach((item) => URL.revokeObjectURL(item.dataUrl));
    setCropQueue([]);
  };

  // Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState(CATEGORIES[1]);
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodDiscountedPrice, setProdDiscountedPrice] = useState<number | ''>('');
  const [prodBadge, setProdBadge] = useState('');
  const [prodIsFavorite, setProdIsFavorite] = useState(false);
  const [prodImgUrl, setProdImgUrl] = useState('');
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [uploadingImagesCount, setUploadingImagesCount] = useState(0);
  const [prodDescription, setProdDescription] = useState('');
  const [prodDetailsStr, setProdDetailsStr] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCollectionCover, setUploadingCollectionCover] = useState<string | null>(null);
  const [prodSubmitting, setProdSubmitting] = useState(false);
  const [prodMessage, setProdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Product Color Variants State
  const [prodColors, setProdColors] = useState<string[]>([]);
  const [newColorInput, setNewColorInput] = useState('');
  const [colorPickerHex, setColorPickerHex] = useState('#E8A598');

  const handleAddColor = (colorToAdd?: string) => {
    const raw = typeof colorToAdd === 'string' ? colorToAdd : newColorInput;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const alreadyExists = prodColors.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (alreadyExists) {
      alert(`Color "${trimmed}" has already been added.`);
      return;
    }

    setProdColors((prev) => [...prev, trimmed]);
    setNewColorInput('');
  };

  const handleRemoveColor = (indexToRemove: number) => {
    setProdColors((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Product Custom Variants State (e.g. Shape, Size, Style)
  const [prodVariants, setProdVariants] = useState<ProductVariant[]>([]);
  const [newOptionInputs, setNewOptionInputs] = useState<Record<number, string>>({});

  const handleAddVariantType = (variantName = 'Shape') => {
    const trimmed = variantName.trim() || 'Shape';
    if (prodVariants.some((v) => v.name.toLowerCase() === trimmed.toLowerCase())) {
      alert(`A variant named "${trimmed}" already exists.`);
      return;
    }
    setProdVariants((prev) => [...prev, { name: trimmed, options: [] }]);
  };

  const handleUpdateVariantName = (index: number, newName: string) => {
    setProdVariants((prev) =>
      prev.map((v, idx) => (idx === index ? { ...v, name: newName } : v))
    );
  };

  const handleAddVariantOption = (variantIndex: number, optionToAdd?: string) => {
    const raw = typeof optionToAdd === 'string' ? optionToAdd : (newOptionInputs[variantIndex] || '');
    const trimmed = raw.trim();
    if (!trimmed) return;

    setProdVariants((prev) =>
      prev.map((v, idx) => {
        if (idx !== variantIndex) return v;
        if (v.options.some((o) => o.toLowerCase() === trimmed.toLowerCase())) {
          return v;
        }
        return { ...v, options: [...v.options, trimmed] };
      })
    );

    setNewOptionInputs((prev) => ({ ...prev, [variantIndex]: '' }));
  };

  const handleRemoveVariantOption = (variantIndex: number, optionIndex: number) => {
    setProdVariants((prev) =>
      prev.map((v, idx) => {
        if (idx !== variantIndex) return v;
        return { ...v, options: v.options.filter((_, oIdx) => oIdx !== optionIndex) };
      })
    );
  };

  const handleRemoveVariantType = (variantIndex: number) => {
    setProdVariants((prev) => prev.filter((_, idx) => idx !== variantIndex));
  };

  // Product Filter State (persisted across refreshes)
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState(() => {
    try {
      return localStorage.getItem('petalisse_admin_cat_filter') || 'All';
    } catch {
      return 'All';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('petalisse_admin_cat_filter', productCategoryFilter);
    } catch {}
  }, [productCategoryFilter]);

  // Orders Tab Filter State (persisted across refreshes)
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>(() => {
    try {
      const saved = localStorage.getItem('petalisse_admin_order_filter');
      if (saved && ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'all';
  });

  // Shiprocket Shipping Modals & State
  const [selectedShipmentOrder, setSelectedShipmentOrder] = useState<Order | null>(null);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState<boolean>(false);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState<boolean>(false);

  // Shiprocket Credentials Settings State
  const [isShiprocketSettingsOpen, setIsShiprocketSettingsOpen] = useState<boolean>(false);
  const [shiprocketEmail, setShiprocketEmail] = useState<string>(() => getStoredCredentials().email);
  const [shiprocketPassword, setShiprocketPassword] = useState<string>(() => getStoredCredentials().password);
  const [testConnStatus, setTestConnStatus] = useState<string | null>(null);
  const [testingConn, setTestingConn] = useState<boolean>(false);

  const handleSaveShiprocketCreds = () => {
    saveStoredCredentials({
      email: shiprocketEmail.trim(),
      password: shiprocketPassword,
    });
    setTestConnStatus('Credentials updated and saved successfully.');
  };

  const handleTestShiprocketConnection = async () => {
    setTestingConn(true);
    setTestConnStatus(null);
    try {
      saveStoredCredentials({
        email: shiprocketEmail.trim(),
        password: shiprocketPassword,
      });
      const token = await getShiprocketToken(true);
      if (token) {
        setTestConnStatus('SUCCESS: Shiprocket connection verified & authenticated!');
      }
    } catch (err: any) {
      setTestConnStatus(`FAILED: ${err?.message || 'Could not authenticate'}`);
    } finally {
      setTestingConn(false);
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('petalisse_admin_order_filter', orderStatusFilter);
    } catch {}
  }, [orderStatusFilter]);

  // Site Content CMS Form State
  const [cmsContent, setCmsContent] = useState<SiteContent>(siteContent);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsMessage, setCmsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingHeroImg, setUploadingHeroImg] = useState(false);
  const [uploadingPromoImg, setUploadingPromoImg] = useState(false);
  const [uploadingAboutImg, setUploadingAboutImg] = useState(false);

  // Admin Accounts List
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  useEffect(() => {
    setCmsContent(siteContent);
  }, [siteContent]);

  useEffect(() => {
    if (isAdmin && activeTab === 'admins') {
      fetchAdminUsers();
    }
  }, [isAdmin, activeTab]);

  const fetchAdminUsers = async () => {
    setLoadingAdmins(true);
    try {
      const snap = await getDocs(collection(db, 'admins'));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setAdminUsers(list);
    } catch (e) {
      console.warn('Could not fetch admin users:', e);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const revokeAdminAccess = async (uid: string) => {
    if (!window.confirm('Are you sure you want to revoke admin access for this account? This will set isAdmin to false in /admins.')) {
      return;
    }
    try {
      await updateDoc(doc(db, 'admins', uid), {
        isAdmin: false,
        status: 'revoked',
      });
      fetchAdminUsers();
    } catch (err: any) {
      alert('Error updating admin: ' + err.message);
    }
  };



  // Product Handlers
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdMessage(null);

    // Collect and sanitize all non-empty images, maximum 5
    const validImages = prodImages
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter(Boolean)
      .slice(0, 5);

    const mainImg = validImages[0] || (prodImgUrl ? prodImgUrl.trim() : '');

    if (!prodName || prodPrice === '' || !mainImg) {
      setProdMessage({ type: 'error', text: 'Product Name, Price and at least 1 Image are required.' });
      return;
    }

    setProdSubmitting(true);
    const detailsArray = prodDetailsStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const finalImagesList = validImages.length > 0 ? validImages : [mainImg];

      const productPayload: Omit<Product, 'id'> = {
        name: prodName,
        category: prodCategory,
        price: Number(prodPrice),
        ...(prodDiscountedPrice !== '' && prodDiscountedPrice !== undefined
          ? { discountedPrice: Number(prodDiscountedPrice) }
          : {}),
        ...(prodBadge.trim() ? { badge: prodBadge.trim() } : {}),
        isFavorite: prodIsFavorite,
        img: mainImg,
        images: finalImagesList,
        alt: prodName,
        description: prodDescription,
        details: detailsArray,
        colors: prodColors.filter(Boolean),
        variants: prodVariants.filter((v) => v.name.trim() && v.options.length > 0),
      };

      if (editingProductId) {
        await updateProduct(editingProductId, productPayload);
        setProdMessage({ type: 'success', text: `Product "${prodName}" updated with ${finalImagesList.length} photo(s) & live across storefront!` });
      } else {
        await addProduct(productPayload);
        setProdMessage({ type: 'success', text: `Product "${prodName}" published live with ${finalImagesList.length} photo(s) to storefront!` });
      }

      resetProductForm();
    } catch (err: any) {
      setProdMessage({ type: 'error', text: err.message || 'Error saving product' });
    } finally {
      setProdSubmitting(false);
    }
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProductId(prod.id);
    setProdName(prod.name);
    setProdCategory(prod.category);
    setProdPrice(prod.price);
    setProdDiscountedPrice(prod.discountedPrice !== undefined ? prod.discountedPrice : '');
    setProdBadge(prod.badge || '');
    setProdIsFavorite(!!prod.isFavorite);

    const existingImages = (prod.images && prod.images.length > 0)
      ? prod.images.filter(Boolean).slice(0, 5)
      : (prod.img ? [prod.img] : []);

    setProdImages(existingImages);
    setProdImgUrl(existingImages[0] || prod.img || '');
    setNewImageUrlInput('');
    setProdDescription(prod.description);
    setProdDetailsStr((prod.details || []).join('\n'));
    setProdColors(prod.colors && Array.isArray(prod.colors) ? prod.colors : []);
    setProdVariants(prod.variants && Array.isArray(prod.variants) ? prod.variants : []);
    setNewOptionInputs({});
    setNewColorInput('');
    setProdMessage(null);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? It will be removed live from all customer pages.`)) {
      try {
        await deleteProduct(id);
        if (editingProductId === id) {
          resetProductForm();
        }
        setProdMessage({ type: 'success', text: `Product "${name}" deleted and removed live from customer storefront!` });
      } catch (err: any) {
        setProdMessage({ type: 'error', text: 'Could not delete product: ' + err.message });
      }
    }
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setProdName('');
    setProdCategory(CATEGORIES[1]);
    setProdPrice('');
    setProdDiscountedPrice('');
    setProdBadge('');
    setProdIsFavorite(false);
    setProdImgUrl('');
    setProdImages([]);
    setNewImageUrlInput('');
    setProdDescription('');
    setProdDetailsStr('');
    setProdColors([]);
    setProdVariants([]);
    setNewOptionInputs({});
    setNewColorInput('');
  };

  const handleToggleFavoriteInTable = async (p: Product) => {
    try {
      await toggleProductFavorite(p.id);
    } catch (err: any) {
      alert('Failed to update favorite status: ' + err.message);
    }
  };

  // Collections ordering and cover upload
  const currentCollectionOrder = useMemo(() => {
    const saved = cmsContent.collectionOrder || [];
    const templateKeys = ALL_COLLECTION_TEMPLATES.map((c) => c.key);
    const existing = saved.filter((k) => templateKeys.includes(k));
    const missing = templateKeys.filter((k) => !existing.includes(k));
    return [...existing, ...missing];
  }, [cmsContent.collectionOrder]);

  const handleMoveCollection = (key: string, direction: 'up' | 'down') => {
    const list = [...currentCollectionOrder];
    const index = list.indexOf(key);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setCmsContent((prev) => ({
      ...prev,
      collectionOrder: list,
    }));
  };

  const handleResetCollectionOrder = () => {
    setCmsContent((prev) => ({
      ...prev,
      collectionOrder: ALL_COLLECTION_TEMPLATES.map((c) => c.key),
    }));
  };

  const handleCollectionCoverUpload = (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = URL.createObjectURL(file);

    setCropQueue([{
      file,
      dataUrl,
      title: `Crop ${category} Cover Photo`,
      defaultAspectRatio: 1, // 1:1 Square
      aspectRatioLabel: '1:1 Square (Collection Cover)',
      onConfirm: async (croppedFile) => {
        setUploadingCollectionCover(category);
        try {
          const url = await uploadImage(croppedFile, 'collections');
          setCmsContent((prev) => ({
            ...prev,
            collectionCovers: {
              ...(prev.collectionCovers || {}),
              [category]: url,
            },
          }));
        } catch (err: any) {
          alert('Cover upload failed: ' + err.message);
        } finally {
          setUploadingCollectionCover(null);
        }
      },
      onSkip: async (originalFile) => {
        setUploadingCollectionCover(category);
        try {
          const url = await uploadImage(originalFile, 'collections');
          setCmsContent((prev) => ({
            ...prev,
            collectionCovers: {
              ...(prev.collectionCovers || {}),
              [category]: url,
            },
          }));
        } catch (err: any) {
          alert('Cover upload failed: ' + err.message);
        } finally {
          setUploadingCollectionCover(null);
        }
      },
    }]);
    setCropTotalCount(1);
    setCropCurrentIndex(1);
    e.target.value = '';
  };

  // Best Sellers sequence and selection handlers
  const [bestsellerSearch, setBestsellerSearch] = useState('');
  const [bestsellerCatFilter, setBestsellerCatFilter] = useState('All');

  const currentBestSellerIds = useMemo(() => {
    return cmsContent.bestSellerProductIds || cmsContent.featuredProductIds || [];
  }, [cmsContent.bestSellerProductIds, cmsContent.featuredProductIds]);

  const orderedBestSellerProducts = useMemo(() => {
    return currentBestSellerIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as Product[];
  }, [currentBestSellerIds, products]);

  const handleMoveBestSeller = (productId: string, direction: 'up' | 'down') => {
    const list = [...currentBestSellerIds];
    const index = list.indexOf(productId);
    if (index === -1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    setCmsContent((prev) => ({
      ...prev,
      bestSellerProductIds: list,
      featuredProductIds: list,
    }));
  };

  const handleRemoveBestSeller = (productId: string) => {
    const next = currentBestSellerIds.filter((id) => id !== productId);
    setCmsContent((prev) => ({
      ...prev,
      bestSellerProductIds: next,
      featuredProductIds: next,
    }));
  };

  const handleToggleBestSeller = (productId: string) => {
    const exists = currentBestSellerIds.includes(productId);
    const next = exists
      ? currentBestSellerIds.filter((id) => id !== productId)
      : [...currentBestSellerIds, productId];

    setCmsContent((prev) => ({
      ...prev,
      bestSellerProductIds: next,
      featuredProductIds: next,
    }));
  };

  const handleToggleFeaturedInCms = handleToggleBestSeller;

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - prodImages.length;
    if (remainingSlots <= 0) {
      alert('You have already added the maximum of 5 images. Please remove an image before adding a new one.');
      e.target.value = '';
      return;
    }

    const selectedFiles = Array.from(files).slice(0, remainingSlots);
    const sessions: ActiveCropSession[] = selectedFiles.map((file, idx) => ({
      file,
      dataUrl: URL.createObjectURL(file),
      title: 'Crop & Preview Product Photo',
      defaultAspectRatio: 1, // 1:1 Square matching product display ratio
      aspectRatioLabel: '1:1 Square (Product Photo)',
      onConfirm: async (croppedFile) => {
        setUploadingImage(true);
        setUploadingImagesCount((prev) => Math.max(0, prev - 1));
        try {
          const url = await uploadImage(croppedFile, 'products');
          if (url) {
            setProdImages((prev) => {
              const combined = [...prev, url].slice(0, 5);
              if (combined.length > 0) {
                setProdImgUrl(combined[0]);
              }
              return combined;
            });
          }
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        } finally {
          setUploadingImage(false);
        }
      },
      onSkip: async (originalFile) => {
        setUploadingImage(true);
        try {
          const url = await uploadImage(originalFile, 'products');
          if (url) {
            setProdImages((prev) => {
              const combined = [...prev, url].slice(0, 5);
              if (combined.length > 0) {
                setProdImgUrl(combined[0]);
              }
              return combined;
            });
          }
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        } finally {
          setUploadingImage(false);
        }
      },
    }));

    setCropTotalCount(sessions.length);
    setCropCurrentIndex(1);
    setCropQueue(sessions);
    e.target.value = '';
  };

  const handleAddImageUrl = () => {
    const trimmed = newImageUrlInput.trim();
    if (!trimmed) return;
    if (prodImages.length >= 5) {
      alert('Maximum of 5 images allowed per product.');
      return;
    }
    setProdImages((prev) => {
      const combined = [...prev, trimmed].slice(0, 5);
      if (combined.length > 0) {
        setProdImgUrl(combined[0]);
      }
      return combined;
    });
    setNewImageUrlInput('');
  };

  const handleRemoveProductImage = (indexToRemove: number) => {
    setProdImages((prev) => {
      const next = prev.filter((_, idx) => idx !== indexToRemove);
      setProdImgUrl(next[0] || '');
      return next;
    });
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    setProdImages((prev) => {
      if (indexToPrimary <= 0 || indexToPrimary >= prev.length) return prev;
      const target = prev[indexToPrimary];
      const rest = prev.filter((_, idx) => idx !== indexToPrimary);
      const next = [target, ...rest];
      setProdImgUrl(next[0] || '');
      return next;
    });
  };

  const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = URL.createObjectURL(file);

    setCropQueue([{
      file,
      dataUrl,
      title: 'Crop & Preview Hero Banner Photo',
      defaultAspectRatio: 16 / 9, // 16:9 Banner ratio
      aspectRatioLabel: '16:9 Banner (Hero Banner)',
      onConfirm: async (croppedFile) => {
        setUploadingHeroImg(true);
        try {
          const url = await uploadImage(croppedFile, 'site');
          setCmsContent((prev) => ({ ...prev, heroBannerUrl: url }));
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        } finally {
          setUploadingHeroImg(false);
        }
      },
      onSkip: async (originalFile) => {
        setUploadingHeroImg(true);
        try {
          const url = await uploadImage(originalFile, 'site');
          setCmsContent((prev) => ({ ...prev, heroBannerUrl: url }));
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        } finally {
          setUploadingHeroImg(false);
        }
      },
    }]);
    setCropTotalCount(1);
    setCropCurrentIndex(1);
    e.target.value = '';
  };

  const handlePromoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = URL.createObjectURL(file);

    setCropQueue([{
      file,
      dataUrl,
      title: 'Crop & Preview Promo Story Cover',
      defaultAspectRatio: 16 / 9, // 16:9 Banner ratio
      aspectRatioLabel: '16:9 Banner (Promo Story)',
      onConfirm: async (croppedFile) => {
        setUploadingPromoImg(true);
        try {
          const url = await uploadImage(croppedFile, 'site');
          setCmsContent((prev) => ({ ...prev, promoBannerUrl: url }));
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        } finally {
          setUploadingPromoImg(false);
        }
      },
      onSkip: async (originalFile) => {
        setUploadingPromoImg(true);
        try {
          const url = await uploadImage(originalFile, 'site');
          setCmsContent((prev) => ({ ...prev, promoBannerUrl: url }));
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        } finally {
          setUploadingPromoImg(false);
        }
      },
    }]);
    setCropTotalCount(1);
    setCropCurrentIndex(1);
    e.target.value = '';
  };

  const handleAboutImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = URL.createObjectURL(file);

    setCropQueue([{
      file,
      dataUrl,
      title: 'Crop & Preview Atelier Image',
      defaultAspectRatio: 4 / 3, // 4:3 Ratio for about section
      aspectRatioLabel: '4:3 Classic (About Atelier)',
      onConfirm: async (croppedFile) => {
        setUploadingAboutImg(true);
        try {
          const url = await uploadImage(croppedFile, 'site');
          setCmsContent((prev) => ({ ...prev, aboutImageUrl: url }));
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        } finally {
          setUploadingAboutImg(false);
        }
      },
      onSkip: async (originalFile) => {
        setUploadingAboutImg(true);
        try {
          const url = await uploadImage(originalFile, 'site');
          setCmsContent((prev) => ({ ...prev, aboutImageUrl: url }));
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        } finally {
          setUploadingAboutImg(false);
        }
      },
    }]);
    setCropTotalCount(1);
    setCropCurrentIndex(1);
    e.target.value = '';
  };

  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setCmsSaving(true);
    setCmsMessage(null);
    try {
      await updateSiteContent(cmsContent);
      setCmsMessage({ type: 'success', text: 'Site copy & imagery broadcast live to customer storefront!' });
    } catch (err: any) {
      setCmsMessage({ type: 'error', text: err.message || 'Error updating site content' });
    } finally {
      setCmsSaving(false);
    }
  };

  // Filtered Products for Table
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = productCategoryFilter === 'All' || p.category === productCategoryFilter;
      const matchSearch = productSearch.trim() === '' || 
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.category.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, productCategoryFilter, productSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'all') return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  // Total Orders Revenue
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [orders]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[#8E5B59] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-[#786F66] text-sm">Authenticating Petalisse Admin...</p>
        </div>
      </div>
    );
  }

  // 1. GATEWAY: If not logged in, redirect to the separate login page
  if (!currentUser && !isAdmin) {
    return <Navigate to="/login?redirect=/admin" replace />;
  }

  // If user is logged in, but not authorized as admin (isAdmin == false)
  if (currentUser && !isAdmin) {
    const isApplicant = (userProfile as any)?.role === 'admin_applicant';

    return (
      <div className="min-h-screen bg-[#F7F3EE] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center animate-fadeIn">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-8 shadow-xl">
            {isApplicant ? (
              <>
                <div className="w-14 h-14 rounded-full bg-[#FAF0ED] border border-[#E8C5B8] flex items-center justify-center mx-auto mb-4 text-[#8E5B59] text-2xl">
                  ⏳
                </div>
                <h1 className="text-2xl font-serif text-[#2C2724] font-medium mb-2">
                  Admin Authorization Pending
                </h1>
                <p className="text-xs text-[#786F66] mb-4 leading-relaxed">
                  Your administrator account (<span className="font-semibold text-[#2C2724]">{currentUser.email}</span>) has been registered and is awaiting database authorization.
                </p>
                <div className="p-3.5 mb-6 rounded-xl bg-white border border-[#E8E0D5] text-[11px] text-[#6B5F55] text-left space-y-2 shadow-2xs">
                  <div className="flex justify-between items-center text-[#8C827A]">
                    <span>Account UID:</span>
                    <span className="font-mono text-[10px] text-[#2C2724] select-all">{currentUser.uid}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#8C827A]">
                    <span>Approval Status:</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10px]">
                      Pending Database Approval
                    </span>
                  </div>
                  <div className="pt-2 text-[#8C827A] border-t border-[#F0EAE1] leading-relaxed">
                    An existing admin must set <span className="font-mono font-semibold text-[#8E5B59]">isAdmin: true</span> in the Firestore <span className="font-mono">admins</span> collection to grant console access.
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const approved = await checkAdminStatus();
                      if (!approved) {
                        alert('Your admin account is still pending approval. Once isAdmin: true is set in Firestore, click this button to unlock the console.');
                      }
                    }}
                    className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium tracking-wide transition shadow-xs cursor-pointer"
                  >
                    Check Approval Status
                  </button>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#5C534B] hover:bg-[#F3EDE2] transition cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-[#FAF0ED] border border-[#E8C5B8] flex items-center justify-center mx-auto mb-4 text-[#9E3E2B]">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-serif text-[#2C2724] font-medium mb-2">
                  Access denied
                </h1>
                <p className="text-xs text-[#786F66] mb-6">
                  You do not have permission to access the administration portal.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    to="/"
                    className="py-2.5 px-5 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium tracking-wide transition shadow-xs"
                  >
                    Back to Boutique Home &rarr;
                  </Link>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="py-2.5 px-4 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#5C534B] hover:bg-[#F3EDE2] transition cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD: User is authorized as admin (isAdmin === true)
  return (
    <div className="min-h-screen bg-[#F7F3EE] pb-16">

      {/* ── HAMBURGER NAVIGATION DRAWER (SLIDE-OVER) ── */}
      {isHamburgerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
            onClick={() => setIsHamburgerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xs sm:max-w-sm bg-[#FAF7F2] shadow-2xl flex flex-col h-full z-10 border-r border-[#E8E0D5] animate-slideInLeft">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[#EAE3D8] flex items-center justify-between bg-white/70">
              <div className="flex items-center gap-2.5">
                <span className="font-['Parisienne'] text-3xl text-[#8E5B59]">Petalisse</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-[#8E5B59]/10 text-[#8E5B59]">
                  Admin Menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsHamburgerOpen(false)}
                className="p-1.5 rounded-lg text-[#786F66] hover:text-[#2C2724] hover:bg-[#FAF0ED] transition cursor-pointer"
                aria-label="Close menu"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Tabs List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5">
              <div className="text-[10px] font-bold text-[#8C827A] uppercase tracking-wider px-3 py-1">
                Admin Console Tabs
              </div>

              {[
                {
                  id: 'products' as const,
                  label: 'Product Catalog',
                  icon: '📦',
                  badge: `${products.length}`,
                  desc: 'Inventory, variants, badges & pricing',
                },
                {
                  id: 'orders' as const,
                  label: 'Customer Orders',
                  icon: '🛍️',
                  badge: `${orders.length}`,
                  alertBadge: orders.filter((o) => o.status === 'pending').length > 0
                    ? `${orders.filter((o) => o.status === 'pending').length} new`
                    : undefined,
                  desc: 'Order tracking, labels & Shiprocket',
                },
                {
                  id: 'coupons' as const,
                  label: 'Coupons & Discounts',
                  icon: '🎟️',
                  badge: `${coupons.length}`,
                  alertBadge: coupons.filter((c) => c.isActive).length > 0
                    ? `${coupons.filter((c) => c.isActive).length} active`
                    : undefined,
                  desc: 'Promo codes, rates & minimums',
                },
                {
                  id: 'cms' as const,
                  label: 'Site CMS & Imagery',
                  icon: '🎨',
                  desc: 'Banners, collections & story content',
                },
                {
                  id: 'splash' as const,
                  label: 'Splash Screen',
                  icon: '🌸',
                  activeDot: siteContent.splashScreen?.enabled,
                  desc: 'Intro video, GIF & welcome animations',
                },
                {
                  id: 'admins' as const,
                  label: 'Admin Permissions',
                  icon: '🛡️',
                  desc: 'Staff credentials & access approval',
                },
              ].map((tab) => {
                const isCurrent = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsHamburgerOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl transition flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'bg-[#8E5B59] text-white shadow-sm font-medium'
                        : 'bg-white hover:bg-[#FAF0ED] text-[#2C2724] border border-[#EAE3D8]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{tab.icon}</span>
                      <div>
                        <div className="text-xs font-bold leading-tight flex items-center gap-2">
                          <span>{tab.label}</span>
                          {tab.activeDot && (
                            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <div
                          className={`text-[10px] mt-0.5 leading-tight ${
                            isCurrent ? 'text-white/80' : 'text-[#786F66]'
                          }`}
                        >
                          {tab.desc}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {tab.alertBadge ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCurrent ? 'bg-white text-[#8E5B59]' : 'bg-[#FAF0ED] text-[#8E5B59] border border-[#E8C5B8]'
                          }`}
                        >
                          {tab.alertBadge}
                        </span>
                      ) : tab.badge ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isCurrent ? 'bg-white/20 text-white' : 'bg-[#FAF7F2] text-[#786F66]'
                          }`}
                        >
                          {tab.badge}
                        </span>
                      ) : null}
                      <span className={`text-xs ${isCurrent ? 'text-white' : 'text-[#A89E94]'}`}>&rarr;</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#EAE3D8] bg-white/70 space-y-2">
              <div className="flex items-center justify-between text-xs px-1 text-[#786F66]">
                <span className="truncate max-w-[180px] font-medium text-[#2C2724]">
                  {currentUser?.displayName || 'Administrator'}
                </span>
                <span className="text-[11px] truncate max-w-[120px]">{currentUser?.email}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/"
                  className="py-2 px-3 rounded-xl border border-[#DED5C9] bg-white text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition text-center shadow-2xs"
                >
                  Live Store &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="py-2 px-3 rounded-xl bg-[#FAF0ED] text-[#9E3E2B] text-xs font-medium hover:bg-[#F3DDD6] transition cursor-pointer text-center"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Admin Header Bar with Hamburger Button */}
      <header className="bg-[#FAF7F2] border-b border-[#E8E0D5] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Left: Hamburger Tab Toggle & Petalisse Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsHamburgerOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white border border-[#DED5C9] text-[#6b1a2a] hover:bg-[#FAF0ED] hover:border-[#8E5B59] transition shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
              aria-label="Open Navigation Tabs Menu"
              title="Open Navigation Menu"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline text-[#2C2724]">
                Tabs
              </span>
              {orders.filter((o) => o.status === 'pending').length > 0 && (
                <span className="size-2 rounded-full bg-[#8E5B59] animate-pulse" />
              )}
            </button>

            <Link to="/" className="flex items-center gap-2 group">
              <span className="font-['Parisienne'] text-3xl text-[#8E5B59] group-hover:opacity-80 transition">
                Petalisse
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-[#8E5B59]/10 text-[#8E5B59] hidden xs:inline">
                Admin Console
              </span>
            </Link>

            {/* Currently Active Tab Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0ED] border border-[#E8C5B8] text-[#8E5B59] text-xs font-semibold">
              <span>
                {activeTab === 'products' ? '📦 Product Catalog' :
                 activeTab === 'orders' ? '🛍️ Customer Orders' :
                 activeTab === 'coupons' ? '🎟️ Coupons & Discounts' :
                 activeTab === 'cms' ? '🎨 Site CMS & Imagery' :
                 activeTab === 'splash' ? '🌸 Splash Screen' : '🛡️ Admin Permissions'}
              </span>
            </div>
          </div>

          {/* Right: Live Sync, User info, Quick actions */}
          <div className="flex items-center gap-3">
            {/* Live Synchronized Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Storefront Sync</span>
            </div>

            <div className="hidden sm:block text-right text-xs">
              <div className="font-medium text-[#2C2724]">{currentUser?.displayName || 'Boutique Administrator'}</div>
              <div className="text-[11px] text-[#786F66]">{currentUser?.email || 'admin@petalisse.com'}</div>
            </div>

            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-lg border border-[#DED5C9] bg-white text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition shadow-xs flex items-center gap-1.5"
            >
              <span>View Store</span>
              <span>&rarr;</span>
            </Link>

            <button
              type="button"
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-lg bg-[#FAF0ED] text-[#9E3E2B] text-xs font-medium hover:bg-[#F3DDD6] transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation Quick Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex border-t border-[#EAE3D8] overflow-x-auto gap-1 py-1.5">
          {[
            { id: 'products' as const, label: 'Product Catalog', icon: '📦', badge: `${products.length}` },
            {
              id: 'orders' as const,
              label: 'Orders',
              icon: '🛍️',
              badge: `${orders.length}`,
              alertBadge: orders.filter((o) => o.status === 'pending').length > 0 ? `${orders.filter((o) => o.status === 'pending').length} new` : undefined,
            },
            {
              id: 'coupons' as const,
              label: 'Coupons',
              icon: '🎟️',
              badge: `${coupons.length}`,
              alertBadge: coupons.filter((c) => c.isActive).length > 0 ? `${coupons.filter((c) => c.isActive).length} active` : undefined,
            },
            { id: 'cms' as const, label: 'CMS & Imagery', icon: '🎨' },
            { id: 'splash' as const, label: 'Splash Screen', icon: '🌸', activeDot: siteContent.splashScreen?.enabled },
            { id: 'admins' as const, label: 'Permissions', icon: '🛡️' },
          ].map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-3 rounded-xl text-xs font-medium uppercase tracking-wider transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#8E5B59] text-white font-bold shadow-xs'
                    : 'bg-transparent text-[#786F66] hover:bg-[#FAF0ED] hover:text-[#2C2724]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.alertBadge ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isCurrent ? 'bg-white text-[#8E5B59]' : 'bg-[#8E5B59] text-white'
                    }`}
                  >
                    {tab.alertBadge}
                  </span>
                ) : tab.badge ? (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isCurrent ? 'bg-white/20 text-white' : 'bg-[#EAE3D8] text-[#786F66]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            {/* Top action bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-serif text-[#2C2724] font-medium">Boutique Inventory</h2>
                <p className="text-xs text-[#786F66]">
                  Add new charms, update pricing, apply badges, and upload custom images. All changes broadcast live instantly!
                </p>
              </div>
            </div>

            {/* Add / Edit Product Form */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#EAE3D8]">
                <h3 className="text-lg font-serif text-[#2C2724] font-medium">
                  {editingProductId ? `Edit Product: ${prodName}` : 'Add New Charm or Accessory'}
                </h3>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="text-xs text-[#8E5B59] hover:underline cursor-pointer"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>

              {prodMessage && (
                <div
                  className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                    prodMessage.type === 'success'
                      ? 'bg-[#F0F7F2] border border-[#C2DEC8] text-[#2C6B3F]'
                      : 'bg-[#FAF0ED] border border-[#E8C5B8] text-[#9E3E2B]'
                  }`}
                >
                  <span>{prodMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="e.g. Victorian Pearl Phone Charm"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4A423B] mb-1">Category</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                      >
                        {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4A423B] mb-1">Badge Tag (optional)</label>
                      <input
                        type="text"
                        value={prodBadge}
                        onChange={(e) => setProdBadge(e.target.value)}
                        placeholder="BESTSELLER, NEW, LIMITED..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4A423B] mb-1">Regular Price (₹ / $) *</label>
                      <input
                        type="number"
                        step="1"
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="1299"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[#4A423B] mb-1">
                        Sale Price (optional)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={prodDiscountedPrice}
                        onChange={(e) => setProdDiscountedPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        placeholder="999"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">Short Description</label>
                    <textarea
                      rows={3}
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      placeholder="Artisan hand-knotted glass beads with delicate satin ribbon..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>

                  {/* Color Variants with Plus Color Option */}
                  <div className="p-3.5 rounded-xl bg-white border border-[#DED5C9]">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#4A423B]">
                        Color Variants (Optional)
                      </label>
                      <span className="text-[11px] font-medium text-[#8E5B59]">
                        {prodColors.length} {prodColors.length === 1 ? 'color' : 'colors'} added
                      </span>
                    </div>
                    <p className="text-[11px] text-[#786F66] mb-2.5 leading-snug">
                      Enter color options available for this charm. Customers will see these options on the view product page just before the quantity selector.
                    </p>

                    {/* Color Input and Plus Color Option Button */}
                    <div className="flex gap-1.5 mb-2.5">
                      <div className="relative flex-1 flex items-center border border-[#DED5C9] rounded-xl px-1.5 py-1 bg-white focus-within:border-[#8E5B59]">
                        <input
                          type="color"
                          value={colorPickerHex}
                          onChange={(e) => setColorPickerHex(e.target.value)}
                          title="Pick a color swatch"
                          className="size-6 rounded-md border border-[#DED5C9] cursor-pointer mr-1.5 shrink-0 p-0 bg-white"
                        />
                        <input
                          type="text"
                          value={newColorInput}
                          onChange={(e) => setNewColorInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddColor();
                            }
                          }}
                          placeholder="Type color (e.g. Blush Pink, Lilac, Sage Green)"
                          className="w-full bg-transparent text-xs text-[#2C2724] focus:outline-hidden"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddColor()}
                        disabled={!newColorInput.trim()}
                        className="px-3.5 py-2 rounded-xl bg-[#FAF0ED] text-[#8E5B59] hover:bg-[#F3DDD6] disabled:opacity-40 text-xs font-semibold transition cursor-pointer shrink-0 shadow-2xs flex items-center gap-1"
                        title="Add color variant"
                      >
                        <span className="text-sm font-bold leading-none">+</span>
                        <span>Add Color</span>
                      </button>
                    </div>

                    {/* Quick Boutique Suggestions */}
                    <div className="mb-2.5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#A89E94] block mb-1">
                        Quick Suggestions:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {SUGGESTED_COLORS.map((preset) => {
                          const alreadyAdded = prodColors.some(
                            (c) => c.toLowerCase() === preset.toLowerCase()
                          );
                          return (
                            <button
                              key={preset}
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => handleAddColor(preset)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer ${
                                alreadyAdded
                                  ? 'opacity-40 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-[#FAF7F2] text-[#5C534B] border border-[#E0D5C7] hover:border-[#8E5B59] hover:text-[#8E5B59]'
                              }`}
                            >
                              <span
                                className="size-1.5 rounded-full inline-block"
                                style={{ backgroundColor: getColorHex(preset) }}
                              />
                              <span>+ {preset}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Added Colors */}
                    {prodColors.length > 0 ? (
                      <div className="p-2 rounded-lg bg-[#FAF7F2] border border-[#EAE3D8]">
                        <div className="flex items-center justify-between text-[10px] font-medium text-[#786F66] mb-1.5">
                          <span>Active Variants on Product:</span>
                          <button
                            type="button"
                            onClick={() => setProdColors([])}
                            className="text-[#C53030] hover:underline cursor-pointer"
                          >
                            Remove all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {prodColors.map((color, idx) => {
                            const swatch = getColorHex(color);
                            return (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[#2C2724] text-[11px] font-medium border border-[#DED5C9] shadow-2xs"
                              >
                                <span
                                  className="size-2.5 rounded-full border border-black/10 inline-block shrink-0"
                                  style={{ backgroundColor: swatch }}
                                />
                                <span>{color}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveColor(idx)}
                                  className="ml-0.5 text-[#8C827A] hover:text-[#C53030] font-bold text-[10px] cursor-pointer"
                                  title={`Remove ${color}`}
                                >
                                  ✕
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg border border-dashed border-[#DED5C9] text-center text-[10px] text-[#8C827A]">
                        No color variants added yet. Type a color and click "+ Add Color" or choose a quick suggestion above.
                      </div>
                    )}
                  </div>

                  {/* Custom Product Variants (e.g. Shape, Size) (Optional) */}
                  <div className="p-3.5 bg-white rounded-xl border border-[#DED5C9] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-semibold text-[#2C2724]">
                          Custom Variants (e.g. Shape, Size) (Optional)
                        </label>
                        <p className="text-[11px] text-[#786F66] mt-0.5">
                          Add variant options like Shape (Heart, Star, Butterfly) that customers can select like colors on the product page.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddVariantType('Shape')}
                        className="px-3 py-1.5 rounded-xl bg-[#FAF0ED] text-[#8E5B59] hover:bg-[#F3DDD6] text-xs font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                      >
                        <span className="text-sm font-bold leading-none">+</span>
                        <span>Add Variant</span>
                      </button>
                    </div>

                    {prodVariants.length === 0 ? (
                      <div className="p-3 rounded-xl border border-dashed border-[#DED5C9] text-center text-xs text-[#8C827A] flex flex-col items-center gap-2 bg-[#FAF7F2]/50">
                        <span>No custom variants added yet.</span>
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddVariantType('Shape')}
                            className="px-2.5 py-1 rounded-full bg-white border border-[#DED5C9] text-[11px] font-medium text-[#8E5B59] hover:bg-[#FAF0ED] cursor-pointer"
                          >
                            + Add "Shape" Variant
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddVariantType('Size')}
                            className="px-2.5 py-1 rounded-full bg-white border border-[#DED5C9] text-[11px] font-medium text-[#8E5B59] hover:bg-[#FAF0ED] cursor-pointer"
                          >
                            + Add "Size" Variant
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAddVariantType('Charm Type')}
                            className="px-2.5 py-1 rounded-full bg-white border border-[#DED5C9] text-[11px] font-medium text-[#8E5B59] hover:bg-[#FAF0ED] cursor-pointer"
                          >
                            + Add "Charm Type" Variant
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {prodVariants.map((variant, vIdx) => {
                          const isShape = variant.name.toLowerCase().includes('shape');
                          const shapeSuggestions = ['Heart', 'Star', 'Butterfly', 'Flower', 'Round', 'Moon', 'Bow', 'Square'];
                          const sizeSuggestions = ['Mini', 'Standard', 'Large'];
                          const activeSuggestions = isShape ? shapeSuggestions : variant.name.toLowerCase().includes('size') ? sizeSuggestions : [];

                          return (
                            <div
                              key={vIdx}
                              className="p-3 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-2 border-b border-[#E8E0D5] pb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-xs font-bold text-[#8E5B59]">Variant {vIdx + 1}:</span>
                                  <input
                                    type="text"
                                    value={variant.name}
                                    onChange={(e) => handleUpdateVariantName(vIdx, e.target.value)}
                                    placeholder="Variant Name (e.g. Shape)"
                                    className="px-2.5 py-1 bg-white border border-[#DED5C9] rounded-lg text-xs font-semibold text-[#2C2724] focus:outline-none focus:border-[#8E5B59] max-w-[180px]"
                                  />
                                  <span className="text-[11px] text-[#786F66]">
                                    ({variant.options.length} options added)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariantType(vIdx)}
                                  className="text-xs text-[#C53030] hover:underline cursor-pointer"
                                >
                                  ✕ Remove Variant
                                </button>
                              </div>

                              {/* Input for adding new option to this variant */}
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  value={newOptionInputs[vIdx] || ''}
                                  onChange={(e) => setNewOptionInputs((prev) => ({ ...prev, [vIdx]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddVariantOption(vIdx);
                                    }
                                  }}
                                  placeholder={`Add option for ${variant.name} (e.g. Heart, Star, Round)`}
                                  className="flex-1 px-3 py-1.5 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-none focus:border-[#8E5B59]"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddVariantOption(vIdx)}
                                  disabled={!(newOptionInputs[vIdx] || '').trim()}
                                  className="px-3 py-1.5 rounded-xl bg-[#8E5B59] text-white hover:bg-[#784A48] disabled:opacity-40 text-xs font-medium transition cursor-pointer shrink-0"
                                >
                                  + Add Option
                                </button>
                              </div>

                              {/* Quick Suggestions for options */}
                              {activeSuggestions.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="text-[10px] text-[#8C827A] font-bold uppercase tracking-wider mr-1">
                                    Quick:
                                  </span>
                                  {activeSuggestions.map((opt) => {
                                    const alreadyAdded = variant.options.some(
                                      (o) => o.toLowerCase() === opt.toLowerCase()
                                    );
                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        disabled={alreadyAdded}
                                        onClick={() => handleAddVariantOption(vIdx, opt)}
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition cursor-pointer ${
                                          alreadyAdded
                                            ? 'opacity-40 bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-[#5C534B] border border-[#E0D5C7] hover:border-[#8E5B59] hover:text-[#8E5B59]'
                                        }`}
                                      >
                                        + {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Active Added Options for this variant */}
                              {variant.options.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {variant.options.map((opt, oIdx) => (
                                    <span
                                      key={oIdx}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[#2C2724] text-[11px] font-medium border border-[#DED5C9] shadow-2xs"
                                    >
                                      <span>{opt}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveVariantOption(vIdx, oIdx)}
                                        className="text-[#8C827A] hover:text-[#C53030] font-bold text-[10px] cursor-pointer"
                                        title={`Remove ${opt}`}
                                      >
                                        ✕
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[10px] text-[#8C827A] italic">
                                  No options added for this variant yet. Add at least one option above.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#FAF0ED] border border-[#E8C5B8]/70">
                    <input
                      type="checkbox"
                      id="prodIsFavorite"
                      checked={prodIsFavorite}
                      onChange={(e) => setProdIsFavorite(e.target.checked)}
                      className="size-4 accent-[#8E5B59] rounded cursor-pointer"
                    />
                    <label
                      htmlFor="prodIsFavorite"
                      className="text-xs font-medium text-[#4A423B] cursor-pointer flex items-center gap-1.5 select-none"
                    >
                      <span>⭐</span>
                      <span>Feature this charm in <strong>"Our Favorites"</strong> on the homepage</span>
                    </label>
                  </div>
                </div>

                {/* Right Column: Image & Details */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-[#4A423B]">
                        Product Gallery (Up to 5 Images) *
                      </label>
                      <span className={`text-[11px] font-medium ${prodImages.length === 0 ? 'text-[#C53030]' : 'text-[#8E5B59]'}`}>
                        {prodImages.length}/5 added {prodImages.length > 0 && '(1st is cover)'}
                      </span>
                    </div>

                    {/* Controls: Upload & Add URL */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      <label className={`cursor-pointer px-3 py-2 rounded-xl bg-white border border-[#DED5C9] text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition inline-flex items-center justify-center gap-1.5 shrink-0 shadow-2xs ${prodImages.length >= 5 ? 'opacity-50 pointer-events-none' : ''}`}>
                        <svg className="w-4 h-4 text-[#8E5B59]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                          {uploadingImage
                            ? `Uploading (${uploadingImagesCount})...`
                            : prodImages.length >= 5
                            ? 'Max 5 Images Reached'
                            : `Upload Photos (${5 - prodImages.length} slots free)`}
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          disabled={uploadingImage || prodImages.length >= 5}
                          className="hidden"
                        />
                      </label>

                      <div className="flex-1 flex gap-1.5">
                        <input
                          type="text"
                          value={newImageUrlInput}
                          onChange={(e) => setNewImageUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddImageUrl();
                            }
                          }}
                          placeholder="Paste image URL or /figma-assets/... path"
                          disabled={prodImages.length >= 5}
                          className="flex-1 px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                        />
                        <button
                          type="button"
                          onClick={handleAddImageUrl}
                          disabled={!newImageUrlInput.trim() || prodImages.length >= 5}
                          className="px-3.5 py-2 rounded-xl bg-[#FAF0ED] text-[#8E5B59] hover:bg-[#F3DDD6] disabled:opacity-40 text-xs font-semibold transition cursor-pointer shrink-0 shadow-2xs"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Image Slots Grid */}
                    {prodImages.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-2 p-2 rounded-xl bg-white border border-[#EAE3D8]">
                          {prodImages.map((imgUrl, idx) => {
                            const isCover = idx === 0;
                            return (
                              <div
                                key={idx}
                                className={`relative group rounded-lg overflow-hidden border aspect-square bg-[#FAF7F2] ${
                                  isCover ? 'border-[#8E5B59] ring-2 ring-[#8E5B59]/30 shadow-xs' : 'border-[#E0D5C7]'
                                }`}
                              >
                                <img src={imgUrl} alt={`Product ${idx + 1}`} className="w-full h-full object-cover" />

                                {/* Badge */}
                                <div className="absolute top-1 left-1 pointer-events-none">
                                  {isCover ? (
                                    <span className="px-1 py-0.2 rounded bg-[#8E5B59] text-white text-[9px] font-bold shadow-xs">
                                      Cover
                                    </span>
                                  ) : (
                                    <span className="px-1 py-0.2 rounded bg-black/60 text-white text-[9px] font-semibold">
                                      #{idx + 1}
                                    </span>
                                  )}
                                </div>

                                {/* Hover Actions Overlay */}
                                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                                  {!isCover && (
                                    <button
                                      type="button"
                                      onClick={() => handleSetPrimaryImage(idx)}
                                      className="px-1.5 py-0.5 rounded bg-white text-[#8E5B59] text-[9px] font-bold hover:bg-[#FAF0ED] transition cursor-pointer"
                                      title="Set as main cover photo"
                                    >
                                      Cover
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProductImage(idx)}
                                    className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold hover:bg-red-700 transition cursor-pointer"
                                    title="Remove this photo"
                                  >
                                    ✕ Remove
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Empty Add Slots up to 5 */}
                          {Array.from({ length: 5 - prodImages.length }).map((_, emptyIdx) => (
                            <label
                              key={`empty-${emptyIdx}`}
                              className="border border-dashed border-[#DED5C9] rounded-lg aspect-square flex flex-col items-center justify-center text-[#A89E94] hover:border-[#8E5B59] hover:text-[#8E5B59] hover:bg-[#FAF0ED]/40 transition cursor-pointer text-center p-1"
                              title="Click to add another photo"
                            >
                              <span className="text-sm font-bold leading-none mb-0.5">+</span>
                              <span className="text-[9px] leading-tight">Slot {prodImages.length + emptyIdx + 1}</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleProductImageUpload}
                                disabled={uploadingImage}
                                className="hidden"
                              />
                            </label>
                          ))}
                        </div>

                        <p className="text-[11px] text-[#786F66]">
                          💡 Image #1 is the store cover photo. If 1 image is provided, customer pages show only that image without empty placeholder thumbnails. If multiple images are provided (up to 5), an interactive photo carousel is shown.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-[#DED5C9] bg-white/60 flex flex-col items-center justify-center text-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-xs text-[#5C534B] font-medium">No images uploaded yet</p>
                        <p className="text-[11px] text-[#A89E94]">
                          Upload up to 5 photos or paste URLs. The 1st image will be the primary cover.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">
                      Bullet Details (one bullet item per line)
                    </label>
                    <textarea
                      rows={3}
                      value={prodDetailsStr}
                      onChange={(e) => setProdDetailsStr(e.target.value)}
                      placeholder="Hand-sculpted polymer clay petals&#10;Glass pearl accents&#10;Reinforced charm cord"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs font-mono text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={prodSubmitting}
                      className="w-full py-3 px-4 rounded-xl bg-[#8E5B59] text-white text-sm font-medium tracking-wide shadow-sm hover:bg-[#784A48] transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      {prodSubmitting && (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      <span>{editingProductId ? 'Update Product Details' : 'Publish Product to Live Boutique'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Inventory List Header & Search/Filters */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] overflow-hidden shadow-sm">
              <div className="p-4 sm:p-6 border-b border-[#EAE3D8] flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-lg font-serif text-[#2C2724] font-medium">
                    Active Catalog ({filteredProducts.length} items)
                  </h3>
                  <p className="text-xs text-[#786F66]">
                    Visible live in shop and product details.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search charms..."
                    className="px-3 py-1.5 rounded-lg border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                  />

                  <select
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#4A423B]">
                  <thead className="bg-[#F3EDE2] text-[#6D635B] uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Item</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Sale Price</th>
                      <th className="py-3 px-4">Badge</th>
                      <th className="py-3 px-4 text-center">⭐ Favorites</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D8]">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-white/60 transition">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={p.img || p.images?.[0]}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-[#E8E0D5] bg-white"
                            />
                            {p.images && p.images.length > 1 && (
                              <span
                                className="absolute -bottom-1 -right-1 bg-[#8E5B59] text-white text-[9px] font-bold px-1 rounded-full shadow-2xs border border-white"
                                title={`${p.images.length} photos in gallery`}
                              >
                                {p.images.length}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-[#2C2724]">{p.name}</div>
                            <div className="text-[11px] text-[#8C827A] line-clamp-1">{p.description}</div>
                            {p.colors && p.colors.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                {p.colors.map((c, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#FAF0ED] text-[#8E5B59] text-[10px] font-medium border border-[#E8C5B8]/60"
                                  >
                                    <span
                                      className="size-1.5 rounded-full inline-block"
                                      style={{ backgroundColor: getColorHex(c) }}
                                    />
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                            {p.variants && p.variants.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                {p.variants.map((v, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#FAF7F2] text-[#6D635B] text-[10px] font-medium border border-[#E0D5C7]"
                                  >
                                    <span>✨ {v.name}:</span>
                                    <span className="font-semibold">{v.options.slice(0, 3).join(', ')}{v.options.length > 3 ? ` +${v.options.length - 3}` : ''}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-white border border-[#E0D5C7] text-[#5C534B]">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-[#2C2724]">
                          ₹{p.price}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {p.discountedPrice !== undefined ? (
                            <span className="font-semibold text-[#8E5B59]">₹{p.discountedPrice}</span>
                          ) : (
                            <span className="text-[#A89E94]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {p.badge ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#EEDFD5] text-[#8E5B59] font-medium text-[10px]">
                              {p.badge}
                            </span>
                          ) : (
                            <span className="text-[#A89E94]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleFavoriteInTable(p)}
                            title={p.isFavorite ? 'Featured in Homepage Favorites (Click to unfeature)' : 'Click to feature in Homepage Favorites'}
                            className={`px-2.5 py-1 rounded-lg text-[11px] transition cursor-pointer inline-flex items-center gap-1 ${
                              p.isFavorite
                                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold shadow-2xs'
                                : 'bg-white text-[#8C827A] border border-[#E8E0D5] hover:text-amber-700 hover:border-amber-300'
                            }`}
                          >
                            <span>{p.isFavorite ? '★' : '☆'}</span>
                            <span>{p.isFavorite ? 'Featured' : 'Add to Fav'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right space-x-1.5">
                          <Link
                            to={`/product/${p.id}`}
                            target="_blank"
                            className="px-2.5 py-1 rounded-lg border border-[#DED5C9] bg-white text-[#6B5F55] hover:text-[#2C2724] hover:bg-[#F3EDE2] text-[11px] font-medium transition inline-block"
                          >
                            View ↗
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEditProduct(p)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#E8C5B8] text-[#8E5B59] hover:bg-[#FAF0ED] text-[11px] font-medium transition cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF0ED] hover:bg-[#F3DDD6] text-[#9E3E2B] text-[11px] font-semibold transition cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-serif text-[#2C2724] font-medium">Customer Orders</h2>
                <p className="text-xs text-[#786F66]">
                  Live customer orders placed from the Cart checkout. Update fulfillment status in real-time.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 p-1 bg-white rounded-xl border border-[#EAE3D8]">
                {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs capitalize transition cursor-pointer ${
                      orderStatusFilter === st
                        ? 'bg-[#8E5B59] text-white font-medium shadow-xs'
                        : 'text-[#6D635B] hover:text-[#2C2724]'
                    }`}
                  >
                    {st} {st !== 'all' && `(${orders.filter((o) => o.status === st).length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Shiprocket Logistics Header Banner */}
            <div className="bg-white p-4 rounded-2xl border border-[#E8E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center font-bold text-lg shadow-2xs">
                  🚀
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#2C2724] uppercase tracking-wider">
                      Shiprocket Logistics Integration
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Connected
                    </span>
                  </div>
                  <div className="text-xs text-[#786F66]">
                    Active Account: <strong className="text-[#2C2724]">{shiprocketEmail}</strong> · Address Prefill, Multi-Carrier Rates, Instant AWB & Cancellation Sync
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTestConnStatus(null);
                    setIsShiprocketSettingsOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-[#DED5C9] bg-[#FAF7F2] text-xs font-medium text-[#4A423B] hover:bg-white transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>⚙️</span>
                  <span>Shiprocket Settings</span>
                </button>
              </div>
            </div>

            {/* Quick Financial Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E0D5]">
                <div className="text-[11px] text-[#786F66] uppercase tracking-wider font-medium">Total Orders</div>
                <div className="text-2xl font-serif text-[#2C2724] mt-1">{orders.length}</div>
              </div>
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E0D5]">
                <div className="text-[11px] text-[#786F66] uppercase tracking-wider font-medium">Pending Orders</div>
                <div className="text-2xl font-serif text-[#8E5B59] mt-1">
                  {orders.filter((o) => o.status === 'pending').length}
                </div>
              </div>
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E0D5]">
                <div className="text-[11px] text-[#786F66] uppercase tracking-wider font-medium">Completed</div>
                <div className="text-2xl font-serif text-emerald-700 mt-1">
                  {orders.filter((o) => o.status === 'delivered').length}
                </div>
              </div>
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8E0D5]">
                <div className="text-[11px] text-[#786F66] uppercase tracking-wider font-medium">Gross Revenue</div>
                <div className="text-2xl font-serif text-[#2C2724] mt-1">₹{totalRevenue.toFixed(0)}</div>
              </div>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-base font-serif text-[#2C2724] font-medium">No orders found</h3>
                <p className="text-xs text-[#786F66] mt-1">
                  When customers complete checkout on the Cart page, orders will appear here live.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusColors = {
                    pending: 'bg-amber-100 text-amber-800 border-amber-200',
                    processing: 'bg-blue-100 text-blue-800 border-blue-200',
                    shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                    cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-5 shadow-xs space-y-4"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EAE3D8]">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-[#8E5B59]">{order.orderNumber || `#${order.id}`}</span>
                          <span className="text-xs text-[#786F66]">
                            {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Just now'}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              statusColors[order.status] || 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        {/* Status Changers */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#786F66]">Status:</span>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id!, e.target.value as Order['status'])}
                            className="px-2.5 py-1 rounded-lg border border-[#DED5C9] bg-white text-xs text-[#2C2724] font-medium cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Delete this order record?')) {
                                deleteOrder(order.id!);
                              }
                            }}
                            className="text-xs text-[#9E3E2B] hover:underline ml-2 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Customer & Shipping Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white rounded-xl p-3 border border-[#EAE3D8]">
                        <div>
                          <span className="text-[#8C827A] block text-[10px] uppercase font-bold">Customer</span>
                          <span className="font-medium text-[#2C2724]">{order.customerName}</span>
                          <div className="text-[#6D635B]">{order.userEmail}</div>
                        </div>

                        <div>
                          <span className="text-[#8C827A] block text-[10px] uppercase font-bold">Contact</span>
                          <span className="text-[#2C2724]">{order.phone || 'No phone provided'}</span>
                        </div>

                        <div>
                          <span className="text-[#8C827A] block text-[10px] uppercase font-bold">Delivery Address</span>
                          <span className="text-[#2C2724]">{order.shippingAddress}</span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-[#6D635B] uppercase tracking-wider">
                          Ordered Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2.5 bg-white p-2 rounded-xl border border-[#EAE3D8]"
                            >
                              <img
                                src={item.img}
                                alt={item.name}
                                className="w-10 h-10 rounded-lg object-cover border border-[#EAE3D8] shrink-0"
                              />
                              <div className="min-w-0 flex-1 text-xs">
                                <div className="font-medium text-[#2C2724] truncate">{item.name}</div>
                                <div className="text-[#786F66] text-[11px] flex items-center gap-2 flex-wrap">
                                  <span>Qty: {item.quantity} × ₹{item.price}</span>
                                  {item.selectedColor && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-[#FAF0ED] text-[#8E5B59] text-[10px] font-medium border border-[#E8C5B8]/60">
                                      <span
                                        className="size-1.5 rounded-full inline-block"
                                        style={{ backgroundColor: getColorHex(item.selectedColor) }}
                                      />
                                      Color: {item.selectedColor}
                                    </span>
                                  )}
                                  {item.selectedVariant && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-[#FAF0ED] text-[#8E5B59] text-[10px] font-medium border border-[#E8C5B8]/60">
                                      <span>✨</span>
                                      {item.selectedVariant}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financials & Payment Breakdown Row */}
                      <div className="pt-2 border-t border-[#EAE3D8] text-xs space-y-1.5">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              order.paymentMethod === 'partial_cod'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}>
                              {order.paymentMethod === 'partial_cod' ? 'Partial COD' : 'Online Paid'}
                            </span>
                            <span className="text-[#786F66]">
                              Subtotal: ₹{order.subtotal} {order.discount > 0 && `(Discount: -₹${order.discount.toFixed(0)})`}
                            </span>
                            <span className="text-[#786F66]">
                              • Shipping: {order.shippingFee === 0 ? 'FREE' : `₹${order.shippingFee ?? 0}`}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xs text-[#786F66] mr-2">Total Order:</span>
                            <span className="text-sm font-bold text-[#8E5B59]">₹{order.total}</span>
                          </div>
                        </div>

                        {order.paymentMethod === 'partial_cod' ? (
                          <div className="flex flex-wrap justify-between items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                            <span className="text-amber-900 font-medium">
                              Advance Paid Online: <strong>₹{order.amountPaid}</strong>
                            </span>
                            <span className="text-amber-950 font-bold bg-amber-200/70 px-2 py-0.5 rounded">
                              COD Balance to Collect on Delivery: ₹{order.codAmountDue ?? Math.round(order.total / 2)}
                            </span>
                          </div>
                        ) : (
                          <div className="text-emerald-700 text-[11px] font-medium">
                            ✓ 100% paid online (₹{order.amountPaid || order.total}). No collection on delivery.
                          </div>
                        )}

                        {/* Shiprocket Delivery & Logistics Action Bar */}
                        <div className="pt-3 border-t border-[#EAE3D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-[#EAE3D8]">
                          {order.shipment && order.shipment.status !== 'CANCELED' && order.status !== 'cancelled' ? (
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="size-9 rounded-xl bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center text-base shrink-0 shadow-2xs">
                                🚚
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-xs text-[#2C2724]">
                                    {order.shipment.courierName || 'Shiprocket Courier'}
                                  </span>
                                  {order.shipment.awbCode && (
                                    <span className="font-mono text-[11px] font-bold text-[#8E5B59] bg-[#FAF0ED] px-2 py-0.5 rounded">
                                      AWB: {order.shipment.awbCode}
                                    </span>
                                  )}
                                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    {order.shipment.status || 'Active'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[#786F66] mt-0.5">
                                  Pickup: <strong>{order.shipment.pickupDate || 'Scheduled'}</strong> · Hub: {order.shipment.pickupLocation || 'Kar apartment'}
                                  {order.shipment.rate && ` · Shipping: ₹${order.shipment.rate.toFixed(2)}`}
                                </div>
                              </div>
                            </div>
                          ) : order.shipment && (order.shipment.status === 'CANCELED' || order.status === 'cancelled') ? (
                            <div className="flex items-center gap-2 text-xs text-rose-700">
                              <span className="text-base">🚫</span>
                              <span>Shiprocket shipment cancelled. You can create a new shipment anytime.</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-[#786F66]">
                              <span className="text-base">📦</span>
                              <span>Ready for dispatch. Delivery address is prefilled from order.</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 shrink-0">
                            {order.shipment && order.shipment.status !== 'CANCELED' && order.status !== 'cancelled' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTrackingOrder(order);
                                    setIsTrackingOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl border border-[#DED5C9] bg-[#FAF7F2] text-xs font-medium text-[#2C2724] hover:bg-white transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                >
                                  <span>🔍</span>
                                  <span>Track & Sync</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedTrackingOrder(order);
                                    setIsTrackingOpen(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-medium text-rose-700 hover:bg-rose-100 transition cursor-pointer flex items-center gap-1"
                                >
                                  <span>✕</span>
                                  <span>Cancel</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedShipmentOrder(order);
                                  setIsShipmentModalOpen(true);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              >
                                <span>🚚</span>
                                <span>{order.shipment?.status === 'CANCELED' ? 'Create New Shipment' : 'Create Shipment'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: SITE CONTENT CMS */}
        {activeTab === 'cms' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-serif text-[#2C2724] font-medium">Boutique Visuals & Copy</h2>
              <p className="text-xs text-[#786F66]">
                Customize the announcement bar, homepage hero banner, promotional stories, and atelier craftsmanship text.
              </p>
            </div>

            {cmsMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  cmsMessage.type === 'success'
                    ? 'bg-[#F0F7F2] border border-[#C2DEC8] text-[#2C6B3F]'
                    : 'bg-[#FAF0ED] border border-[#E8C5B8] text-[#9E3E2B]'
                }`}
              >
                <span>{cmsMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveCMS} className="space-y-6">
              {/* Top Announcement Bar */}
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-4">
                <h3 className="text-base font-serif text-[#2C2724] font-medium border-b border-[#EAE3D8] pb-2">
                  Header Announcement Bar
                </h3>

                <div>
                  <label className="block text-xs font-medium text-[#4A423B] mb-1">
                    Announcement Banner Message
                  </label>
                  <input
                    type="text"
                    value={cmsContent.announcementText || ''}
                    onChange={(e) => setCmsContent({ ...cmsContent, announcementText: e.target.value })}
                    placeholder="e.g. Free Shipping on All Orders Over $50 | Handmade with Love"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                  />
                  <p className="text-[11px] text-[#8C827A] mt-1">
                    Displays at the very top of all customer-facing storefront pages.
                  </p>
                </div>
              </div>

              {/* Hero Banner Section */}
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-4">
                <h3 className="text-base font-serif text-[#2C2724] font-medium border-b border-[#EAE3D8] pb-2">
                  Homepage Hero Section
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">Hero Tagline</label>
                    <input
                      type="text"
                      value={cmsContent.heroTagline || ''}
                      onChange={(e) => setCmsContent({ ...cmsContent, heroTagline: e.target.value })}
                      placeholder="Made slowly, loved endlessly"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">Main Heading</label>
                    <input
                      type="text"
                      value={cmsContent.heroTitle || ''}
                      onChange={(e) => setCmsContent({ ...cmsContent, heroTitle: e.target.value })}
                      placeholder="Handmade with love, just for you."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A423B] mb-1">Hero Subtitle</label>
                  <textarea
                    rows={2}
                    value={cmsContent.heroSubtitle || ''}
                    onChange={(e) => setCmsContent({ ...cmsContent, heroSubtitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A423B] mb-1">
                    Hero Banner Photo (16:9 Aspect Ratio)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-white border border-[#DED5C9] text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#8E5B59]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{uploadingHeroImg ? 'Optimizing...' : 'Upload & Crop Banner'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHeroImageUpload}
                        disabled={uploadingHeroImg}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={cmsContent.heroBannerUrl || ''}
                      onChange={(e) => setCmsContent({ ...cmsContent, heroBannerUrl: e.target.value })}
                      placeholder="Or paste banner image URL"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />

                    {cmsContent.heroBannerUrl && (
                      <button
                        type="button"
                        onClick={() => setCmsContent((prev) => ({ ...prev, heroBannerUrl: '' }))}
                        className="px-3 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#A89E94] hover:text-[#8E5B59] hover:bg-[#FAF0ED] transition cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {cmsContent.heroBannerUrl && (
                    <div className="h-32 max-w-md rounded-xl border border-[#E8E0D5] overflow-hidden bg-white shadow-2xs">
                      <img
                        src={cmsContent.heroBannerUrl}
                        alt="Hero Banner Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 1. Our Collections Sequence & Cover Photos Section */}
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE3D8] pb-3">
                  <div>
                    <h3 className="text-base font-serif text-[#2C2724] font-medium flex items-center gap-2">
                      <span>"Our Collections" Sequence & Cover Photos</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF0ED] text-[#8E5B59] text-[11px] font-bold">
                        {currentCollectionOrder.length} Collections
                      </span>
                    </h3>
                    <p className="text-xs text-[#786F66]">
                      Change the sequence of collections cards displayed on the homepage, and customize their cover images.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetCollectionOrder}
                    className="text-xs text-[#8E5B59] hover:underline self-start sm:self-center cursor-pointer font-medium"
                  >
                    Reset sequence to default order
                  </button>
                </div>

                {/* Sequence Overview Bar */}
                <div className="bg-white p-3 rounded-xl border border-[#E8E0D5] space-y-1.5">
                  <div className="text-[11px] font-semibold text-[#8E5B59] uppercase tracking-wider">
                    Current Homepage Display Sequence (Left to Right):
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentCollectionOrder.map((key, idx) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF0ED] text-[#8E5B59] text-xs font-medium border border-[#E8C5B8]/60 shadow-2xs"
                      >
                        <span className="font-bold text-[10px] text-white bg-[#8E5B59] size-4 rounded-full inline-flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{key}</span>
                        {idx < currentCollectionOrder.length - 1 && (
                          <span className="text-[#A89E94] ml-1">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reorderable Collections Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-2">
                  {currentCollectionOrder.map((key, idx) => {
                    const template = ALL_COLLECTION_TEMPLATES.find((t) => t.key === key) || {
                      key,
                      label: key,
                      defaultImg: '/figma-assets/2416c5a3da640dcea42f85f7a71067eac0c58ca9.png',
                    };
                    const currentCover = cmsContent.collectionCovers?.[key] || template.defaultImg;
                    const isUploading = uploadingCollectionCover === key;

                    return (
                      <div key={key} className="bg-white p-4 rounded-xl border border-[#E8E0D5] space-y-3 shadow-2xs flex flex-col justify-between">
                        <div>
                          {/* Header with Sequence Badge */}
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#8E5B59] bg-[#FAF0ED] px-2 py-0.5 rounded-md border border-[#E8C5B8]">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-[#2C2724] truncate flex-1 ml-1" title={template.label}>
                              {template.label}
                            </span>
                          </div>

                          {/* Move Left / Right Reorder Controls */}
                          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                            <button
                              type="button"
                              onClick={() => handleMoveCollection(key, 'up')}
                              disabled={idx === 0}
                              className="px-2 py-1 rounded-lg border border-[#DED5C9] bg-white text-[11px] font-semibold text-[#5C534B] hover:bg-[#F3EDE2] disabled:opacity-35 disabled:cursor-not-allowed transition flex items-center justify-center gap-1 cursor-pointer"
                              title="Move card earlier (left) in sequence"
                            >
                              <span>← Earlier</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCollection(key, 'down')}
                              disabled={idx === currentCollectionOrder.length - 1}
                              className="px-2 py-1 rounded-lg border border-[#DED5C9] bg-white text-[11px] font-semibold text-[#5C534B] hover:bg-[#F3EDE2] disabled:opacity-35 disabled:cursor-not-allowed transition flex items-center justify-center gap-1 cursor-pointer"
                              title="Move card later (right) in sequence"
                            >
                              <span>Later →</span>
                            </button>
                          </div>

                          {/* Preview Cover */}
                          <div className="aspect-[5/6] w-full rounded-xl overflow-hidden border border-[#E8E0D5] bg-[#FAF5F0] relative">
                            <img
                              src={currentCover}
                              alt={template.label}
                              className="size-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = template.defaultImg;
                              }}
                            />
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                              Card #{idx + 1}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-2">
                          <div className="flex gap-2">
                            <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-[#FAF0ED] hover:bg-[#F3DDD6] border border-[#E8C5B8] text-[11px] font-semibold text-[#8E5B59] transition flex items-center justify-center gap-1.5 flex-1">
                              <span>{isUploading ? 'Optimizing...' : 'Upload Cover'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={isUploading}
                                onChange={(e) => handleCollectionCoverUpload(key, e)}
                                className="hidden"
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setCmsContent((prev) => ({
                                  ...prev,
                                  collectionCovers: {
                                    ...(prev.collectionCovers || {}),
                                    [key]: template.defaultImg,
                                  },
                                }));
                              }}
                              className="px-2 py-1.5 rounded-lg border border-[#DED5C9] bg-white text-[11px] text-[#786F66] hover:bg-[#F3EDE2] transition cursor-pointer"
                              title="Reset this cover to default"
                            >
                              Reset
                            </button>
                          </div>

                          <input
                            type="text"
                            value={cmsContent.collectionCovers?.[key] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCmsContent((prev) => ({
                                ...prev,
                                collectionCovers: {
                                  ...(prev.collectionCovers || {}),
                                  [key]: val,
                                },
                              }));
                            }}
                            placeholder="Or paste image URL"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Best Sellers Homepage Showcase & Sequence Manager */}
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAE3D8] pb-3">
                  <div>
                    <h3 className="text-base font-serif text-[#2C2724] font-medium flex items-center gap-2">
                      <span>"Best Sellers" Showcase & Sequence Manager</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0ED] text-[#8E5B59] text-[11px] font-bold">
                        {currentBestSellerIds.length} Products in Best Sellers
                      </span>
                    </h3>
                    <p className="text-xs text-[#786F66]">
                      Choose exactly which handcrafted charms appear in the "Best Sellers" section on the homepage, and reorder their exact display sequence.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = products.map((p) => p.id);
                        setCmsContent((prev) => ({
                          ...prev,
                          bestSellerProductIds: allIds,
                          featuredProductIds: allIds,
                        }));
                      }}
                      className="px-2.5 py-1 rounded-lg border border-[#DED5C9] bg-white text-xs text-[#5C534B] hover:bg-[#F3EDE2] transition cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCmsContent((prev) => ({
                          ...prev,
                          bestSellerProductIds: [],
                          featuredProductIds: [],
                        }));
                      }}
                      className="px-2.5 py-1 rounded-lg border border-[#DED5C9] bg-white text-xs text-[#8E5B59] hover:bg-[#FAF0ED] transition cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* SUBSECTION A: Active Best Sellers Ordered Queue */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E0D5] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-[#2C2724] flex items-center gap-2">
                        <span>⭐ Active Best Sellers (In Display Order)</span>
                        <span className="text-xs font-normal text-[#8C827A]">
                          Use ▲ Move Up and ▼ Move Down to adjust sequence
                        </span>
                      </h4>
                    </div>
                  </div>

                  {orderedBestSellerProducts.length === 0 ? (
                    <div className="p-6 text-center bg-[#FAF7F2] rounded-xl border border-dashed border-[#DED5C9]">
                      <p className="text-xs text-[#786F66] font-medium">
                        No products currently in Best Sellers. Click "+ Add to Best Sellers" from the catalog below to add and arrange products.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#EAE3D8] border border-[#EAE3D8] rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
                      {orderedBestSellerProducts.map((p, idx) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 bg-white hover:bg-[#FAF7F2] transition gap-3"
                        >
                          {/* Position Badge & Product Info */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="size-7 rounded-lg bg-[#FAF0ED] text-[#8E5B59] font-bold text-xs flex items-center justify-center border border-[#E8C5B8] shrink-0">
                              #{idx + 1}
                            </span>
                            <img
                              src={p.img || p.images?.[0]}
                              alt={p.name}
                              className="size-10 rounded-lg object-cover border border-[#E8E0D5] shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-[#2C2724] truncate">{p.name}</div>
                              <div className="text-[11px] text-[#8C827A] flex items-center gap-2">
                                <span className="text-[#8E5B59] font-medium">₹{p.discountedPrice ?? p.price}</span>
                                <span>•</span>
                                <span>{p.category}</span>
                              </div>
                            </div>
                          </div>

                          {/* Reordering Controls */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveBestSeller(p.id, 'up')}
                              disabled={idx === 0}
                              className="px-2 py-1 rounded-lg border border-[#DED5C9] bg-white text-xs font-bold text-[#5C534B] hover:bg-[#FAF0ED] hover:text-[#8E5B59] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
                              title="Move product earlier in best sellers sequence"
                            >
                              ▲ Up
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveBestSeller(p.id, 'down')}
                              disabled={idx === orderedBestSellerProducts.length - 1}
                              className="px-2 py-1 rounded-lg border border-[#DED5C9] bg-white text-xs font-bold text-[#5C534B] hover:bg-[#FAF0ED] hover:text-[#8E5B59] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center gap-1"
                              title="Move product later in best sellers sequence"
                            >
                              ▼ Down
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveBestSeller(p.id)}
                              className="px-2 py-1 rounded-lg border border-[#F3DDD6] bg-[#FAF0ED] text-xs font-semibold text-[#9E3E2B] hover:bg-[#F3DDD6] transition cursor-pointer ml-1"
                              title="Remove from Best Sellers"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SUBSECTION B: Add Products from Catalog */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E0D5] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-[#2C2724]">
                        Add Products from Catalog to Best Sellers
                      </h4>
                      <p className="text-xs text-[#8C827A]">
                        Click any product card to add or remove it from the Best Sellers showcase.
                      </p>
                    </div>

                    {/* Filter and Search */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={bestsellerSearch}
                        onChange={(e) => setBestsellerSearch(e.target.value)}
                        placeholder="Search products..."
                        className="px-3 py-1.5 rounded-lg border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59] w-[140px] sm:w-[180px]"
                      />
                      <select
                        value={bestsellerCatFilter}
                        onChange={(e) => setBestsellerCatFilter(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                      >
                        <option value="All">All Categories</option>
                        {CATEGORIES.filter((c) => c !== 'All Items').map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {products.length === 0 ? (
                    <div className="p-8 text-center bg-[#FAF7F2] rounded-xl border border-[#E8E0D5]">
                      <p className="text-xs text-[#786F66]">
                        No live products created yet. Add handcrafted charms in the "Products & Inventory" tab first!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-1 max-h-[380px] overflow-y-auto p-1">
                      {products
                        .filter((p) => {
                          const matchesCat = bestsellerCatFilter === 'All' || p.category === bestsellerCatFilter;
                          const matchesSearch =
                            !bestsellerSearch ||
                            p.name.toLowerCase().includes(bestsellerSearch.toLowerCase()) ||
                            p.category.toLowerCase().includes(bestsellerSearch.toLowerCase());
                          return matchesCat && matchesSearch;
                        })
                        .map((p) => {
                          const isFeatured = currentBestSellerIds.includes(p.id);
                          const positionIdx = currentBestSellerIds.indexOf(p.id);

                          return (
                            <div
                              key={p.id}
                              onClick={() => handleToggleBestSeller(p.id)}
                              className={`relative p-2.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                                isFeatured
                                  ? 'bg-[#FFF9F6] border-[#8E5B59] shadow-sm ring-2 ring-[#8E5B59]/25'
                                  : 'bg-white border-[#E8E0D5] hover:border-[#8E5B59]/50 hover:bg-[#FAF7F2]'
                              }`}
                            >
                              <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#FAF5F0] border border-[#E8E0D5] mb-2">
                                <img src={p.img || p.images?.[0]} alt={p.name} className="size-full object-cover" />
                                {isFeatured && (
                                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-[#8E5B59] text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                                    #{positionIdx + 1}
                                  </div>
                                )}
                              </div>

                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-[#2C2724] line-clamp-1">{p.name}</div>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-[#8E5B59] font-medium">₹{p.discountedPrice ?? p.price}</span>
                                  <span className="text-[#8C827A] text-[10px]">{p.category}</span>
                                </div>
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-[#EAE3D8] text-center">
                                <span
                                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                                    isFeatured ? 'text-[#8E5B59]' : 'text-[#A89E94]'
                                  }`}
                                >
                                  {isFeatured ? `✓ In Best Sellers (#${positionIdx + 1})` : '+ Add to Best Sellers'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. "Crafted for Dreamers & Collectors" Story Section */}
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-4">
                <div className="border-b border-[#EAE3D8] pb-2">
                  <h3 className="text-base font-serif text-[#2C2724] font-medium">
                    "Crafted for Dreamers & Collectors" Story Section
                  </h3>
                  <p className="text-xs text-[#786F66]">
                    Control the cover photo, story title, and poetic subtext displayed on the homepage promo section.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">Story Title</label>
                    <input
                      type="text"
                      value={cmsContent.promoBannerText || ''}
                      onChange={(e) => setCmsContent({ ...cmsContent, promoBannerText: e.target.value })}
                      placeholder="Crafted for the Dreamers & Collectors"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">Poetic Story Subtext</label>
                    <input
                      type="text"
                      value={cmsContent.promoBannerSubtext || ''}
                      onChange={(e) => setCmsContent({ ...cmsContent, promoBannerSubtext: e.target.value })}
                      placeholder="Each charm carries its own gentle story..."
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A423B] mb-1">
                    Story Cover Photo (Upload or URL)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-white border border-[#DED5C9] text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#8E5B59]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{uploadingPromoImg ? 'Optimizing...' : 'Upload Cover Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePromoImageUpload}
                        disabled={uploadingPromoImg}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={cmsContent.promoBannerUrl || ''}
                      onChange={(e) => setCmsContent({ ...cmsContent, promoBannerUrl: e.target.value })}
                      placeholder="Or paste cover image URL"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setCmsContent((prev) => ({
                          ...prev,
                          promoBannerUrl: '/figma-assets/2b39a24648f5a21e9e527dfe97992fd042715209.png',
                        }));
                      }}
                      className="px-3 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#786F66] hover:bg-[#F3EDE2] transition cursor-pointer"
                    >
                      Default
                    </button>
                  </div>

                  {cmsContent.promoBannerUrl && (
                    <div className="h-32 max-w-md rounded-xl border border-[#E8E0D5] overflow-hidden bg-white shadow-2xs">
                      <img
                        src={cmsContent.promoBannerUrl}
                        alt="Promo Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/figma-assets/2b39a24648f5a21e9e527dfe97992fd042715209.png';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Atelier Story / About Boutique Card */}
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-4">
                <h3 className="text-base font-serif text-[#2C2724] font-medium border-b border-[#EAE3D8] pb-2">
                  Atelier Story Card (Homepage)
                </h3>

                <div>
                  <label className="block text-xs font-medium text-[#4A423B] mb-1">Story Heading</label>
                  <input
                    type="text"
                    value={cmsContent.aboutTitle || ''}
                    onChange={(e) => setCmsContent({ ...cmsContent, aboutTitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A423B] mb-1">Story Description</label>
                  <textarea
                    rows={3}
                    value={cmsContent.aboutDescription || ''}
                    onChange={(e) => setCmsContent({ ...cmsContent, aboutDescription: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A423B] mb-1">
                    Story Small Image (Upload or URL)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-white border border-[#DED5C9] text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#8E5B59]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{uploadingAboutImg ? 'Optimizing...' : 'Upload Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAboutImageUpload}
                        disabled={uploadingAboutImg}
                        className="hidden"
                      />
                    </label>

                    <input
                      type="text"
                      value={cmsContent.aboutImageUrl || ''}
                      onChange={(e) => setCmsContent({ ...cmsContent, aboutImageUrl: e.target.value })}
                      placeholder="Or paste small image URL"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setCmsContent((prev) => ({
                          ...prev,
                          aboutImageUrl: '/figma-assets/2416c5a3da640dcea42f85f7a71067eac0c58ca9.png',
                        }));
                      }}
                      className="px-3 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#786F66] hover:bg-[#F3EDE2] transition cursor-pointer"
                    >
                      Default
                    </button>
                  </div>

                  {cmsContent.aboutImageUrl && (
                    <div className="size-20 sm:size-24 rounded-xl border border-[#E8E0D5] overflow-hidden bg-white shadow-2xs">
                      <img
                        src={cmsContent.aboutImageUrl}
                        alt="Story Preview"
                        className="size-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/figma-assets/2416c5a3da640dcea42f85f7a71067eac0c58ca9.png';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={cmsSaving}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#8E5B59] text-white text-sm font-medium tracking-wide shadow-md hover:bg-[#784A48] transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {cmsSaving && (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>Publish All CMS Changes to Live Store</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: ADMIN PERMISSIONS */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-serif text-[#2C2724] font-medium">Administrator Access Control</h2>
              <p className="text-xs text-[#786F66]">
                Review registered admin accounts. Admin privileges can only be granted directly in the database.
              </p>
            </div>

            {/* Database-only Notice */}
            <div className="p-4 rounded-xl bg-[#FAF0ED] border border-[#E8C5B8] text-xs text-[#8E5B59]">
              <div className="font-semibold mb-1 flex items-center gap-1.5">
                <span>🔒</span> Direct Database Management Only
              </div>
              <p className="text-[#6B5F55] leading-relaxed">
                For security reasons, granting admin privileges (<span className="font-mono font-semibold">isAdmin: true</span>) cannot be done from the website. An authorized administrator must set <span className="font-mono font-semibold">isAdmin: true</span> directly in the Firestore database under the <span className="font-mono">admins</span> collection.
              </p>
            </div>

            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] overflow-hidden shadow-sm">
              <div className="p-4 sm:p-6 border-b border-[#EAE3D8] flex justify-between items-center">
                <h3 className="text-lg font-serif text-[#2C2724] font-medium">Registered Admin Accounts</h3>
                <button
                  type="button"
                  onClick={fetchAdminUsers}
                  className="text-xs text-[#8E5B59] hover:underline cursor-pointer"
                >
                  Refresh List
                </button>
              </div>

              {loadingAdmins ? (
                <div className="p-8 text-center text-xs text-[#786F66]">Loading admin records...</div>
              ) : adminUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#786F66]">
                  No pending admin registrations found in the Firestore `admins` collection.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#4A423B]">
                    <thead className="bg-[#F3EDE2] text-[#6D635B] uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Admin UID</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Access Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D8]">
                      {adminUsers.map((adm) => (
                        <tr key={adm.id} className="hover:bg-white/60 transition">
                          <td className="py-3 px-4 font-medium text-[#2C2724]">{adm.name || 'Admin Applicant'}</td>
                          <td className="py-3 px-4">{adm.email}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#8C827A]">{adm.id}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {adm.isAdmin === true ? (
                              <span className="px-2.5 py-1 rounded-full bg-[#F0F7F2] border border-[#C2DEC8] text-[#2C6B3F] font-semibold text-[11px]">
                                Approved (isAdmin: true)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-[#FAF0ED] border border-[#E8C5B8] text-[#9E3E2B] font-semibold text-[11px]">
                                Pending (isAdmin: false)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {adm.isAdmin === true ? (
                              <button
                                type="button"
                                onClick={() => revokeAdminAccess(adm.id)}
                                className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition bg-[#FAF0ED] text-[#9E3E2B] hover:bg-[#F3DDD6]"
                              >
                                Revoke Access
                              </button>
                            ) : (
                              <span className="text-[11px] text-[#8C827A] italic">
                                Direct DB only
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 5. SPLASH SCREEN SETTINGS PANEL ── */}
        {activeTab === 'splash' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎬</span>
                  <h2 className="text-xl font-serif text-[#2C2724] font-medium">
                    Storefront Splash Screen
                  </h2>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${
                      splashConfig.enabled
                        ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                        : 'bg-[#FAF0ED] text-[#9E3E2B] border-[#E8C5B8]'
                    }`}
                  >
                    {splashConfig.enabled ? '● Active on Site' : '○ Disabled'}
                  </span>
                </div>
                <p className="text-xs text-[#786F66] mt-1 max-w-xl">
                  Display an animated welcome screen (video, animated GIF, or Lottie animation) when visitors first open the boutique website.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setTestingSplash(true)}
                  className="px-4 py-2.5 rounded-xl border border-[#DED5C9] bg-white hover:bg-[#F3EDE2] text-[#5C534B] text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  title="Test full-screen splash animation"
                >
                  <span>👁️</span>
                  <span>Preview Splash</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveSplashSettings()}
                  disabled={savingSplash}
                  className="px-5 py-2.5 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium tracking-wide transition shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-60"
                >
                  {savingSplash && (
                    <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>Save Splash Screen</span>
                </button>
              </div>
            </div>

            {splashSaveMsg && (
              <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs flex items-center justify-between shadow-2xs animate-fadeIn">
                <div className="flex items-center gap-2">
                  <svg className="size-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{splashSaveMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSplashSaveMsg(null)}
                  className="text-emerald-700 hover:opacity-75 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Main Configuration Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Media & Upload Options (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* 1. Media Type & Upload Card */}
                <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-5">
                  <h3 className="text-base font-serif text-[#2C2724] font-medium border-b border-[#EAE3D8] pb-3">
                    1. Animation Media
                  </h3>

                  {/* Media Type Selector */}
                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-2">
                      Choose Media Format
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { type: 'video' as const, label: 'Video', icon: '🎬', desc: '.mp4, .webm' },
                        { type: 'gif' as const, label: 'GIF / Image', icon: '🖼️', desc: '.gif, .webp' },
                        { type: 'lottie' as const, label: 'Lottie File', icon: '✨', desc: '.json animation' },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setSplashConfig((prev) => ({ ...prev, mediaType: item.type }))}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                            splashConfig.mediaType === item.type
                              ? 'border-[#8E5B59] bg-[#FAF0ED] text-[#8E5B59] shadow-xs'
                              : 'border-[#DED5C9] bg-white text-[#786F66] hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <div className="text-lg mb-1">{item.icon}</div>
                          <div className="font-semibold text-xs text-[#2C2724]">{item.label}</div>
                          <div className="text-[10px] text-[#8C827A]">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload Dropzone */}
                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-2">
                      Upload File ({splashConfig.mediaType === 'video' ? 'Video (.mp4, .webm)' : splashConfig.mediaType === 'gif' ? 'Animated GIF (.gif)' : 'Lottie Animation (.json)'})
                    </label>
                    <div className="border-2 border-dashed border-[#DED5C9] hover:border-[#8E5B59] bg-white/70 hover:bg-white rounded-2xl p-6 text-center transition group relative">
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg,image/gif,image/png,image/webp,application/json,.json"
                        onChange={handleSplashMediaUpload}
                        disabled={uploadingSplashMedia}
                        className="absolute inset-0 size-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="size-12 rounded-full bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center text-xl group-hover:scale-105 transition-transform">
                          {uploadingSplashMedia ? '⏳' : '📁'}
                        </div>
                        {uploadingSplashMedia ? (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-[#8E5B59] animate-pulse">
                              Uploading & processing media...
                            </p>
                            <p className="text-[10px] text-[#8C827A]">Please wait a moment</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-[#2C2724]">
                              <span className="text-[#8E5B59] underline">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-[11px] text-[#8C827A]">
                              Supports MP4, WebM, GIF, or Lottie JSON files
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Media URL Input */}
                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">
                      Or Direct Media URL
                    </label>
                    <input
                      type="url"
                      value={splashConfig.mediaUrl}
                      onChange={(e) => setSplashConfig((prev) => ({ ...prev, mediaUrl: e.target.value }))}
                      placeholder={
                        splashConfig.mediaType === 'video'
                          ? 'https://example.com/splash-video.mp4'
                          : splashConfig.mediaType === 'gif'
                          ? 'https://example.com/animation.gif'
                          : 'https://assets.lottiefiles.com/animation.json'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] placeholder-[#A89E94] focus:outline-hidden focus:border-[#8E5B59] transition"
                    />
                  </div>

                  {/* Lottie Raw JSON Input (optional toggle) */}
                  {splashConfig.mediaType === 'lottie' && (
                    <div className="pt-2 border-t border-[#EAE3D8]">
                      <button
                        type="button"
                        onClick={() => setJsonInputOpen(!jsonInputOpen)}
                        className="text-xs text-[#8E5B59] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <span>{jsonInputOpen ? '▼ Hide' : '▶ Paste Raw Lottie JSON Code'}</span>
                      </button>
                      {jsonInputOpen && (
                        <div className="mt-2.5 space-y-1">
                          <textarea
                            rows={4}
                            value={splashConfig.lottieData || ''}
                            onChange={(e) => setSplashConfig((prev) => ({ ...prev, lottieData: e.target.value }))}
                            placeholder='{"v":"5.7.4","fr":30,"ip":0,"op":60,"w":500,"h":500,"layers":[...]}'
                            className="w-full p-3 font-mono text-[11px] rounded-xl border border-[#DED5C9] bg-white text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                          />
                          <p className="text-[10px] text-[#8C827A]">
                            Paste valid Lottie JSON exported from Adobe After Effects / Bodymovin or LottieFiles.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ready-to-use Sample Presets */}
                  <div className="pt-4 border-t border-[#EAE3D8]">
                    <span className="text-[11px] font-semibold text-[#6D635B] uppercase tracking-wider block mb-2">
                      Quick Sample Presets (Click to Load)
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applySplashPreset('lottie')}
                        className="px-3 py-1.5 rounded-lg border border-[#DED5C9] bg-white hover:bg-[#FAF0ED] text-[11px] text-[#5C534B] hover:text-[#8E5B59] font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        <span>✨</span>
                        <span>Sparkling Heart (Lottie)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applySplashPreset('gif')}
                        className="px-3 py-1.5 rounded-lg border border-[#DED5C9] bg-white hover:bg-[#FAF0ED] text-[11px] text-[#5C534B] hover:text-[#8E5B59] font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        <span>🌸</span>
                        <span>Blooming Rose (GIF)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applySplashPreset('video')}
                        className="px-3 py-1.5 rounded-lg border border-[#DED5C9] bg-white hover:bg-[#FAF0ED] text-[11px] text-[#5C534B] hover:text-[#8E5B59] font-medium transition cursor-pointer flex items-center gap-1"
                      >
                        <span>🎬</span>
                        <span>Atelier Video</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Display & Branding Customization */}
                <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-serif text-[#2C2724] font-medium border-b border-[#EAE3D8] pb-3">
                    2. Branding & Display Behavior
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4A423B] mb-1">
                        Brand Title
                      </label>
                      <input
                        type="text"
                        value={splashConfig.title || ''}
                        onChange={(e) => setSplashConfig((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Petalisse"
                        className="w-full px-3 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A423B] mb-1">
                        Tagline / Subtitle
                      </label>
                      <input
                        type="text"
                        value={splashConfig.subtitle || ''}
                        onChange={(e) => setSplashConfig((prev) => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="Handcrafted Charms & Keepsakes"
                        className="w-full px-3 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-[#4A423B]">
                        Display Duration
                      </label>
                      <span className="text-xs font-bold font-mono text-[#8E5B59]">
                        {splashConfig.duration || 3.5}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max="8"
                      step="0.5"
                      value={splashConfig.duration || 3.5}
                      onChange={(e) => setSplashConfig((prev) => ({ ...prev, duration: parseFloat(e.target.value) }))}
                      className="w-full accent-[#8E5B59] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#8C827A]">
                      <span>1.5s (Quick)</span>
                      <span>3.5s (Recommended)</span>
                      <span>8.0s (Showcase)</span>
                    </div>
                    {splashConfig.mediaType === 'video' ? (
                      <p className="text-[11px] text-[#8E5B59] mt-1 font-medium">
                        🎬 Video duration automatically matches the exact length of your uploaded video.
                      </p>
                    ) : (
                      <p className="text-[10px] text-[#8C827A] mt-0.5">
                        Duration for animated GIFs and Lottie animations before entering the storefront.
                      </p>
                    )}
                  </div>

                  {/* Background Color */}
                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1.5">
                      Splash Background Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={splashConfig.backgroundColor || '#FDFBF7'}
                        onChange={(e) => setSplashConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                        className="size-9 rounded-lg border border-[#DED5C9] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={splashConfig.backgroundColor || '#FDFBF7'}
                        onChange={(e) => setSplashConfig((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-28 px-2.5 py-1.5 font-mono text-xs rounded-lg border border-[#DED5C9] bg-white text-[#2C2724]"
                      />
                      <div className="flex gap-1.5">
                        {[
                          { color: '#FDFBF7', label: 'Cream' },
                          { color: '#FAF0ED', label: 'Blush' },
                          { color: '#FFFFFF', label: 'White' },
                          { color: '#1E1A18', label: 'Noir' },
                        ].map((sw) => (
                          <button
                            key={sw.color}
                            type="button"
                            onClick={() => setSplashConfig((prev) => ({ ...prev, backgroundColor: sw.color }))}
                            className="size-7 rounded-md border border-black/10 cursor-pointer shadow-2xs hover:scale-110 transition-transform"
                            style={{ backgroundColor: sw.color }}
                            title={sw.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Behavior Checkboxes */}
                  <div className="pt-3 border-t border-[#EAE3D8] space-y-2.5">
                    <label className="flex items-center gap-2.5 text-xs text-[#2C2724] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={splashConfig.showOncePerSession !== false}
                        onChange={(e) => setSplashConfig((prev) => ({ ...prev, showOncePerSession: e.target.checked }))}
                        className="size-4 accent-[#8E5B59] rounded"
                      />
                      <span>
                        <strong className="font-medium">Show only once per visitor session</strong> (Recommended: ensures repeat page browsing is smooth)
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-[#2C2724] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={splashConfig.showSkipButton !== false}
                        onChange={(e) => setSplashConfig((prev) => ({ ...prev, showSkipButton: e.target.checked }))}
                        className="size-4 accent-[#8E5B59] rounded"
                      />
                      <span>Show &quot;Enter Boutique&quot; skip button</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-[#2C2724] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={splashConfig.autoDismiss !== false}
                        onChange={(e) => setSplashConfig((prev) => ({ ...prev, autoDismiss: e.target.checked }))}
                        className="size-4 accent-[#8E5B59] rounded"
                      />
                      <span>Auto-dismiss into storefront when timer finishes</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Mini Preview Card (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#EAE3D8] pb-3 mb-4">
                    <h3 className="text-base font-serif text-[#2C2724] font-medium">
                      Live In-Panel Preview
                    </h3>
                    <button
                      type="button"
                      onClick={() => setTestingSplash(true)}
                      className="text-xs text-[#8E5B59] hover:underline cursor-pointer font-medium"
                    >
                      Full-Screen Test &rarr;
                    </button>
                  </div>

                  {/* 9:16 Frame */}
                  <div
                    className="relative w-full max-w-[280px] mx-auto aspect-[9/16] rounded-3xl border border-black/10 overflow-hidden shadow-xl flex flex-col items-center justify-between p-5 transition-colors duration-300"
                    style={{ backgroundColor: splashConfig.backgroundColor || '#FDFBF7' }}
                  >
                    {/* Media Showcase Layer (9:16 full-bleed) */}
                    <div className="absolute inset-0 size-full flex items-center justify-center overflow-hidden">
                      {!splashConfig.mediaUrl && !splashConfig.lottieData ? (
                        <div className="text-center p-5 z-10 my-auto">
                          <div className="text-3xl mb-1.5">🎬</div>
                          <p className="text-xs text-[#8C827A] font-medium leading-relaxed">
                            No media uploaded yet.
                          </p>
                          <p className="text-[10px] text-[#A89E94] mt-1">
                            Upload a 9:16 vertical video, GIF, or Lottie animation.
                          </p>
                        </div>
                      ) : splashConfig.mediaType === 'video' ? (
                        <video
                          src={splashConfig.mediaUrl}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="size-full object-cover"
                        />
                      ) : splashConfig.mediaType === 'gif' ? (
                        <img
                          src={splashConfig.mediaUrl}
                          alt="Preview"
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="size-full flex items-center justify-center p-3">
                          <LottiePreview
                            mediaUrl={splashConfig.mediaUrl}
                            lottieData={splashConfig.lottieData}
                          />
                        </div>
                      )}

                      {/* Vignette overlay */}
                      {splashConfig.mediaUrl && (splashConfig.title || splashConfig.subtitle || splashConfig.showSkipButton !== false) && (
                        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/35 pointer-events-none" />
                      )}
                    </div>

                    {/* Mock Skip */}
                    <div className="relative z-10 w-full flex justify-end">
                      {splashConfig.showSkipButton !== false && (
                        <span className="px-2.5 py-1 rounded-full bg-white/70 backdrop-blur-xs text-[9px] uppercase tracking-wider text-[#2C2724] font-medium shadow-2xs border border-white/40">
                          Enter Boutique &rarr;
                        </span>
                      )}
                    </div>

                    {/* Titles */}
                    <div className="relative z-10 text-center w-full my-auto px-2 pointer-events-none">
                      {splashConfig.title && (
                        <p
                          className={`font-['Parisienne'] text-3xl leading-tight ${
                            splashConfig.mediaUrl ? 'text-white' : 'text-[#6B1A2A]'
                          }`}
                          style={{
                            textShadow: splashConfig.mediaUrl ? '0 2px 8px rgba(0,0,0,0.5)' : 'none',
                          }}
                        >
                          {splashConfig.title}
                        </p>
                      )}
                      {splashConfig.subtitle && (
                        <p
                          className={`font-cormorant text-[11px] uppercase tracking-widest mt-1 font-medium ${
                            splashConfig.mediaUrl ? 'text-white/90' : 'text-[#8C827A]'
                          }`}
                          style={{
                            textShadow: splashConfig.mediaUrl ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
                          }}
                        >
                          {splashConfig.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Activation Toggle Card */}
                  <div className="mt-5 p-4 rounded-xl bg-white border border-[#E8E0D5] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-[#2C2724] block">
                        Enable Splash Screen
                      </span>
                      <span className="text-[11px] text-[#786F66]">
                        {splashConfig.enabled
                          ? 'Active: displayed when website opens'
                          : 'Disabled: visitors go straight to storefront'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newEnabled = !splashConfig.enabled;
                        setSplashConfig((prev) => ({ ...prev, enabled: newEnabled }));
                        handleSaveSplashSettings({ enabled: newEnabled });
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                        splashConfig.enabled ? 'bg-[#8E5B59]' : 'bg-[#DED5C9]'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          splashConfig.enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. PROMOTIONS & COUPONS MANAGEMENT ── */}
        {activeTab === 'coupons' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header & Overview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎟️</span>
                  <h2 className="text-xl font-serif text-[#2C2724] font-medium">
                    Promotions & Coupons
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-[#FAF0ED] text-[#8E5B59] border border-[#E8C5B8]">
                    {coupons.filter((c) => c.isActive).length} Active
                  </span>
                </div>
                <p className="text-xs text-[#786F66] mt-1">
                  Create discount codes for your patrons with percentage or flat rates, minimum order thresholds, and expiry dates. All codes connect directly with checkout!
                </p>
              </div>

              {/* Stats Counters */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-white border border-[#DED5C9] text-center shadow-xs">
                  <div className="text-[10px] text-[#786F66] uppercase font-bold tracking-wider">Total Codes</div>
                  <div className="text-base font-bold text-[#2C2724] font-sans">{coupons.length}</div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-white border border-[#DED5C9] text-center shadow-xs">
                  <div className="text-[10px] text-[#786F66] uppercase font-bold tracking-wider">Times Used</div>
                  <div className="text-base font-bold text-[#8E5B59] font-sans">
                    {coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Create New Coupon Form */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-[#EAE3D8] pb-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#8E5B59]" />
                  <h3 className="text-sm font-semibold text-[#2C2724] uppercase tracking-wider">
                    Add New Promotional Coupon
                  </h3>
                </div>
                <span className="text-xs text-[#786F66]">
                  * Required fields
                </span>
              </div>

              {couponError && (
                <div className="p-3 rounded-xl bg-[#FAF0ED] border border-[#E8C5B8] text-[#C53030] text-xs flex items-center justify-between">
                  <span>✕ {couponError}</span>
                  <button type="button" onClick={() => setCouponError(null)} className="cursor-pointer font-bold">×</button>
                </div>
              )}

              {couponSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
                  <span>✓ {couponSuccess}</span>
                  <button type="button" onClick={() => setCouponSuccess(null)} className="cursor-pointer font-bold">×</button>
                </div>
              )}

              <form onSubmit={handleCreateCoupon} className="space-y-4">
                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#786F66] font-medium">Quick Presets:</span>
                  {[
                    { label: '10% OFF', code: 'SAVE10', type: 'percentage' as const, val: 10 },
                    { label: '15% OFF', code: 'SPRING15', type: 'percentage' as const, val: 15 },
                    { label: '20% OFF', code: 'PETAL20', type: 'percentage' as const, val: 20 },
                    { label: '₹50 Flat OFF', code: 'FLAT50', type: 'fixed' as const, val: 50 },
                    { label: '₹100 Flat OFF', code: 'BONUS100', type: 'fixed' as const, val: 100, min: 599 },
                  ].map((preset) => (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => {
                        setCouponCode(preset.code);
                        setCouponDiscountType(preset.type);
                        setCouponDiscountValue(preset.val);
                        if (preset.min) setCouponMinOrder(preset.min);
                        setCouponError(null);
                      }}
                      className="px-2.5 py-1 rounded-full bg-white text-[#4A423B] hover:bg-[#FAF0ED] hover:text-[#8E5B59] border border-[#DED5C9] text-xs font-medium transition cursor-pointer"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Coupon Code */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#2C2724]">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      placeholder="e.g. WELCOME10"
                      className="px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-xs font-bold text-[#2C2724] uppercase tracking-wider focus:outline-none focus:border-[#8E5B59]"
                    />
                  </div>

                  {/* Discount Type */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#2C2724]">
                      Discount Type *
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCouponDiscountType('percentage')}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer text-center ${
                          couponDiscountType === 'percentage'
                            ? 'bg-[#8E5B59] text-white border-[#8E5B59] shadow-xs'
                            : 'bg-white text-[#4A423B] border-[#DED5C9] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        % Percentage
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouponDiscountType('fixed')}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border transition cursor-pointer text-center ${
                          couponDiscountType === 'fixed'
                            ? 'bg-[#8E5B59] text-white border-[#8E5B59] shadow-xs'
                            : 'bg-white text-[#4A423B] border-[#DED5C9] hover:bg-[#FAF7F2]'
                        }`}
                      >
                        ₹ Fixed (INR)
                      </button>
                    </div>
                  </div>

                  {/* Discount Value */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#2C2724]">
                      Discount Value * ({couponDiscountType === 'percentage' ? '%' : '₹'})
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={couponDiscountType === 'percentage' ? 100 : 10000}
                      value={couponDiscountValue}
                      onChange={(e) => setCouponDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={couponDiscountType === 'percentage' ? '10' : '100'}
                      className="px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-none focus:border-[#8E5B59]"
                    />
                  </div>

                  {/* Minimum Order Value */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#2C2724]">
                      Min. Order Value (₹) <span className="text-[10px] text-[#786F66] font-normal">(optional)</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={couponMinOrder}
                      onChange={(e) => setCouponMinOrder(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 499 (0 for none)"
                      className="px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-none focus:border-[#8E5B59]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  {/* Max Discount for Percentage */}
                  {couponDiscountType === 'percentage' && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-[#2C2724]">
                        Max Discount Cap (₹) <span className="text-[10px] text-[#786F66] font-normal">(optional)</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={couponMaxDiscount}
                        onChange={(e) => setCouponMaxDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 200 (max saving)"
                        className="px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-none focus:border-[#8E5B59]"
                      />
                    </div>
                  )}

                  {/* Expiration Date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#2C2724]">
                      Expiry Date <span className="text-[10px] text-[#786F66] font-normal">(optional)</span>
                    </label>
                    <input
                      type="date"
                      value={couponExpiresAt}
                      onChange={(e) => setCouponExpiresAt(e.target.value)}
                      className="px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-none focus:border-[#8E5B59]"
                    />
                  </div>

                  {/* Description / Notes */}
                  <div className={`flex flex-col gap-1.5 ${couponDiscountType === 'percentage' ? 'sm:col-span-1' : 'sm:col-span-2'}`}>
                    <label className="text-xs font-semibold text-[#2C2724]">
                      Short Description / Label <span className="text-[10px] text-[#786F66] font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={couponDesc}
                      onChange={(e) => setCouponDesc(e.target.value)}
                      placeholder="e.g. 10% off for first-time shoppers"
                      className="px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-none focus:border-[#8E5B59]"
                    />
                  </div>
                </div>

                {/* Active Status & Submit */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-[#EAE3D8]">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={couponIsActive}
                      onChange={(e) => setCouponIsActive(e.target.checked)}
                      className="size-4 accent-[#8E5B59] rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium text-[#2C2724]">
                      Activate coupon immediately upon creation
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={couponSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium shadow-sm transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {couponSubmitting ? (
                      <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>+</span>
                    )}
                    <span>Create Coupon</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Coupons List */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#2C2724] uppercase tracking-wider">
                    All Promotional Coupons ({coupons.length})
                  </h3>
                </div>

                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    value={couponSearch}
                    onChange={(e) => setCouponSearch(e.target.value)}
                    placeholder="Search coupons..."
                    className="w-full px-3 py-1.5 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-none focus:border-[#8E5B59]"
                  />
                </div>
              </div>

              {coupons.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#786F66]">
                  No coupons found. Create your first promotional coupon using the form above!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#EAE3D8] text-[11px] text-[#786F66] uppercase font-semibold">
                        <th className="py-3 px-3">Coupon Code</th>
                        <th className="py-3 px-3">Discount</th>
                        <th className="py-3 px-3">Conditions</th>
                        <th className="py-3 px-3">Expiry</th>
                        <th className="py-3 px-3">Times Used</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3D8]">
                      {coupons
                        .filter(
                          (c) =>
                            !couponSearch.trim() ||
                            c.code.toLowerCase().includes(couponSearch.toLowerCase()) ||
                            (c.description || '').toLowerCase().includes(couponSearch.toLowerCase())
                        )
                        .map((c) => {
                          const isExpired = c.expiresAt && new Date().toISOString().split('T')[0] > c.expiresAt;
                          return (
                            <tr key={c.id || c.code} className="hover:bg-white/60 transition">
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-xs bg-[#FAF0ED] text-[#8E5B59] px-2 py-0.5 rounded-md border border-[#E8C5B8]">
                                    {c.code}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(c.code, c.id || c.code)}
                                    className="text-[10px] text-[#786F66] hover:text-[#8E5B59] cursor-pointer"
                                    title="Copy code"
                                  >
                                    {copiedCouponId === (c.id || c.code) ? '✓ Copied' : '📋'}
                                  </button>
                                </div>
                                {c.description && (
                                  <div className="text-[10px] text-[#786F66] mt-0.5 max-w-xs truncate">
                                    {c.description}
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 font-semibold text-[#2C2724]">
                                {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`}
                                {c.maxDiscount && (
                                  <span className="text-[10px] text-[#786F66] font-normal block">
                                    Up to ₹{c.maxDiscount}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-[#786F66]">
                                {c.minOrderValue ? `Min order ₹${c.minOrderValue}` : 'No minimum'}
                              </td>
                              <td className="py-3 px-3">
                                {c.expiresAt ? (
                                  <span className={isExpired ? 'text-[#C53030] font-medium' : 'text-[#786F66]'}>
                                    {c.expiresAt} {isExpired && '(Expired)'}
                                  </span>
                                ) : (
                                  <span className="text-[#786F66]">Never</span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-medium text-[#2C2724]">
                                {c.usageCount || 0}
                              </td>
                              <td className="py-3 px-3">
                                <button
                                  type="button"
                                  onClick={() => c.id && handleToggleCouponActive(c.id, c.isActive)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer transition ${
                                    c.isActive && !isExpired
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                  }`}
                                >
                                  {c.isActive && !isExpired ? '● Active' : '○ Inactive'}
                                </button>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => c.id && handleDeleteCoupon(c.id, c.code)}
                                  className="text-xs text-[#C53030] hover:underline cursor-pointer"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        {testingSplash && (
          <SplashScreen
            forcePreview={true}
            previewConfig={splashConfig}
            onClosePreview={() => setTestingSplash(false)}
          />
        )}

        {/* Global Photo Crop & Preview Modal */}
        {currentCropItem && (
          <ImageCropModal
            isOpen={true}
            imageSrc={currentCropItem.dataUrl}
            fileName={currentCropItem.file.name}
            title={currentCropItem.title}
            defaultAspectRatio={currentCropItem.defaultAspectRatio}
            aspectRatioLabel={currentCropItem.aspectRatioLabel}
            stepInfo={
              cropTotalCount > 1
                ? { current: cropCurrentIndex, total: cropTotalCount }
                : undefined
            }
            onCropComplete={handleAdvanceCropQueue}
            onSkipCrop={handleSkipCurrentCrop}
            onCancel={handleCancelCropQueue}
          />
        )}

        {/* Shiprocket Create Shipment Modal */}
        {selectedShipmentOrder && (
          <ShiprocketShipmentModal
            order={selectedShipmentOrder}
            isOpen={isShipmentModalOpen}
            onClose={() => {
              setIsShipmentModalOpen(false);
              setSelectedShipmentOrder(null);
            }}
            onSuccess={(shipmentInfo, newStatus) => {
              if (selectedShipmentOrder.id) {
                updateOrderShipment(selectedShipmentOrder.id, shipmentInfo, newStatus);
              }
            }}
          />
        )}

        {/* Shiprocket Live Tracking & Sync Modal */}
        {selectedTrackingOrder && (
          <ShiprocketTrackingModal
            order={selectedTrackingOrder}
            isOpen={isTrackingOpen}
            onClose={() => {
              setIsTrackingOpen(false);
              setSelectedTrackingOrder(null);
            }}
            onUpdateShipment={(shipmentPatch, newStatus) => {
              if (selectedTrackingOrder.id) {
                updateOrderShipment(selectedTrackingOrder.id, shipmentPatch, newStatus);
              }
            }}
          />
        )}

        {/* Shiprocket Settings & Credentials Modal */}
        {isShiprocketSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
            <div className="bg-[#FAF7F2] border border-[#E8E0D5] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-auto">
              <div className="px-6 py-4 bg-white border-b border-[#EAE3D8] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🚀</span>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-[#2C2724]">
                      Shiprocket API Configuration
                    </h3>
                    <p className="text-xs text-[#786F66]">
                      Manage connected credentials & test API authentication
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShiprocketSettingsOpen(false)}
                  className="size-8 rounded-full hover:bg-[#F3EDE2] text-[#786F66] flex items-center justify-center transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {testConnStatus && (
                  <div
                    className={`p-3 rounded-xl border ${
                      testConnStatus.startsWith('SUCCESS')
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {testConnStatus}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-[#786F66] mb-1">
                    Shiprocket Email Address
                  </label>
                  <input
                    type="email"
                    value={shiprocketEmail}
                    onChange={(e) => setShiprocketEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DED5C9] bg-white text-[#2C2724] focus:outline-none focus:border-[#8E5B59]"
                  />
                  <span className="text-[10px] text-[#8C827A] mt-1 block">
                    Default: sekhrakib001@gmail.com
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#786F66] mb-1">
                    Shiprocket Password
                  </label>
                  <input
                    type="password"
                    value={shiprocketPassword}
                    onChange={(e) => setShiprocketPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#DED5C9] bg-white text-[#2C2724] focus:outline-none focus:border-[#8E5B59] font-mono"
                  />
                </div>

                <div className="bg-white p-3 rounded-xl border border-[#EAE3D8] text-[11px] text-[#786F66] space-y-1">
                  <div className="font-semibold text-[#2C2724]">Integrated Capabilities:</div>
                  <div>• Automatic delivery address prefilling directly from customer orders</div>
                  <div>• Live multi-carrier serviceability and real-time shipping rate comparison</div>
                  <div>• Instant AWB generation and scheduled pickup date booking</div>
                  <div>• Shipment cancellation with live Shiprocket status sync</div>
                </div>
              </div>

              <div className="px-6 py-4 bg-white border-t border-[#EAE3D8] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleTestShiprocketConnection}
                  disabled={testingConn}
                  className="px-3.5 py-2 rounded-xl border border-[#DED5C9] text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition cursor-pointer flex items-center gap-1.5"
                >
                  {testingConn ? 'Testing...' : '⚡ Test Connection'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsShiprocketSettingsOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#DED5C9] text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSaveShiprocketCreds();
                      setIsShiprocketSettingsOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};