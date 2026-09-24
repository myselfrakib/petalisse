import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { Product, SiteContent, Order } from '../types';
import { CATEGORIES } from '../data/products';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router';

export const AdminPage: React.FC = () => {
  const { 
    currentUser, 
    isAdmin, 
    loading: authLoading, 
    login, 
    adminSignup, 
    loginAsDemoAdmin,
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
    seedInitialProductsToFirestore,
    updateOrderStatus,
    deleteOrder
  } = useContent();

  // Admin Auth Form State
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminName, setAdminName] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [checkingApproval, setCheckingApproval] = useState(false);

  // Dashboard Active Tab (persisted across refreshes)
  const [activeTab, setActiveTab] = useState<'products' | 'cms' | 'orders' | 'admins'>(() => {
    try {
      const saved = localStorage.getItem('petalisse_admin_tab');
      if (saved === 'products' || saved === 'cms' || saved === 'orders' || saved === 'admins') {
        return saved;
      }
    } catch {}
    return 'products';
  });

  useEffect(() => {
    try {
      localStorage.setItem('petalisse_admin_tab', activeTab);
    } catch {}
  }, [activeTab]);

  // Product Form State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState(CATEGORIES[1]);
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [prodDiscountedPrice, setProdDiscountedPrice] = useState<number | ''>('');
  const [prodBadge, setProdBadge] = useState('');
  const [prodImgUrl, setProdImgUrl] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodDetailsStr, setProdDetailsStr] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [prodSubmitting, setProdSubmitting] = useState(false);
  const [prodMessage, setProdMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered'>(() => {
    try {
      const saved = localStorage.getItem('petalisse_admin_order_filter');
      if (saved && ['all', 'pending', 'processing', 'shipped', 'delivered'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'all';
  });

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

  const toggleAdminApproval = async (uid: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'admins', uid), {
        isAdmin: !currentStatus,
        status: !currentStatus ? 'approved' : 'revoked',
      });
      await updateDoc(doc(db, 'users', uid), {
        isAdmin: !currentStatus,
      }).catch(() => {});
      fetchAdminUsers();
    } catch (err: any) {
      alert('Error updating admin: ' + err.message);
    }
  };

  // Handle Admin Sign In / Sign Up
  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);

    try {
      if (authMode === 'signin') {
        await login(adminEmail, adminPassword);
      } else {
        if (!adminEmail || !adminPassword || !adminName) {
          throw new Error('Please fill in all fields');
        }
        await adminSignup(adminEmail, adminPassword, adminName);
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email exists. Please use Sign In.';
      }
      setAuthError(msg);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleManualCheckApproval = async () => {
    setCheckingApproval(true);
    const approved = await checkAdminStatus();
    setCheckingApproval(false);
    if (!approved) {
      alert('Your account authorization is still pending approval.');
    }
  };

  // Product Handlers
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdMessage(null);
    if (!prodName || prodPrice === '' || !prodImgUrl) {
      setProdMessage({ type: 'error', text: 'Name, Price and Product Image are required.' });
      return;
    }

    setProdSubmitting(true);
    const detailsArray = prodDetailsStr
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const productPayload: Omit<Product, 'id'> = {
        name: prodName,
        category: prodCategory,
        price: Number(prodPrice),
        discountedPrice: prodDiscountedPrice !== '' ? Number(prodDiscountedPrice) : undefined,
        badge: prodBadge.trim() || undefined,
        img: prodImgUrl,
        alt: prodName,
        description: prodDescription,
        details: detailsArray,
      };

      if (editingProductId) {
        await updateProduct(editingProductId, productPayload);
        setProdMessage({ type: 'success', text: `Product "${prodName}" updated & live across storefront!` });
      } else {
        await addProduct(productPayload);
        setProdMessage({ type: 'success', text: `Product "${prodName}" published live to storefront!` });
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
    setProdImgUrl(prod.img);
    setProdDescription(prod.description);
    setProdDetailsStr((prod.details || []).join('\n'));
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
    setProdImgUrl('');
    setProdDescription('');
    setProdDetailsStr('');
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadImage(file, 'products');
      setProdImgUrl(url);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHeroImg(true);
    try {
      const url = await uploadImage(file, 'site');
      setCmsContent((prev) => ({ ...prev, heroBannerUrl: url }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingHeroImg(false);
    }
  };

  const handlePromoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPromoImg(true);
    try {
      const url = await uploadImage(file, 'site');
      setCmsContent((prev) => ({ ...prev, promoBannerUrl: url }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingPromoImg(false);
    }
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

  // 1. GATEWAY: If not logged in or NOT authorized as admin (isAdmin == false)
  if (!currentUser && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block hover:opacity-80 transition mb-2">
              <span className="font-['Parisienne'] text-4xl text-[#8E5B59] block">
                Petalisse
              </span>
            </Link>
            <h1 className="text-2xl font-serif text-[#2C2724] font-medium tracking-tight">
              Boutique Administration Portal
            </h1>
            <p className="text-xs text-[#786F66] mt-1">
              Live catalog, customer orders, and storefront management
            </p>
          </div>

          {/* Quick Demo Admin Entry Card */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-[#FAF0ED] to-[#FDF5F2] border-2 border-[#E8C5B8] shadow-md text-center">
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#8E5B59]">
                Live Admin Mode Available
              </span>
            </div>
            <p className="text-xs text-[#6B5F55] mb-3">
              One-click instant authorized access to manage products, view incoming customer orders, and edit storefront CMS live.
            </p>
            <button
              type="button"
              onClick={() => loginAsDemoAdmin()}
              className="w-full py-2.5 px-4 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-semibold tracking-wider uppercase transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <span>⚡ Enter Admin Console (Instant Access)</span>
            </button>
          </div>

          {/* Admin Sign In / Sign Up Form */}
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 sm:p-8 shadow-xl">
            {/* Tab Switcher */}
            <div className="flex border-b border-[#EAE3D8] mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError(null);
                }}
                className={`flex-1 pb-3 text-center text-xs font-medium tracking-wider uppercase border-b-2 cursor-pointer transition ${
                  authMode === 'signin'
                    ? 'border-[#8E5B59] text-[#8E5B59]'
                    : 'border-transparent text-[#8C827A] hover:text-[#2C2724]'
                }`}
              >
                Admin Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError(null);
                }}
                className={`flex-1 pb-3 text-center text-xs font-medium tracking-wider uppercase border-b-2 cursor-pointer transition ${
                  authMode === 'signup'
                    ? 'border-[#8E5B59] text-[#8E5B59]'
                    : 'border-transparent text-[#8C827A] hover:text-[#2C2724]'
                }`}
              >
                Register Admin
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-[#FAF0ED] border border-[#E8C5B8] text-[#9E3E2B] text-xs flex items-start gap-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-[#4A423B] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Master Artisan"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@petalisse.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                />
              </div>

              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#8E5B59] text-white text-sm font-medium tracking-wide shadow-sm hover:bg-[#784A48] transition cursor-pointer flex items-center justify-center gap-2"
              >
                {authSubmitting && (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                <span>{authMode === 'signin' ? 'Sign In as Admin' : 'Submit Admin Registration'}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#EAE3D8] text-center">
              <Link to="/" className="text-xs text-[#786F66] hover:text-[#2C2724] transition">
                &larr; Return to Petalisse Storefront
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in, but somehow isAdmin is false (pending approval view)
  if (currentUser && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F3EE] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8C5B8] p-6 sm:p-8 shadow-xl text-center relative overflow-hidden">
            <div className="w-14 h-14 rounded-full bg-[#FAF0ED] border border-[#E8C5B8] flex items-center justify-center mx-auto mb-4 text-[#9E3E2B]">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            <h2 className="text-xl font-serif text-[#2C2724] font-medium mb-2">
              Authorization Verification
            </h2>
            <p className="text-xs text-[#6B5F55] leading-relaxed mb-6">
              You are signed in as <span className="font-semibold">{currentUser.email}</span>. Click below to enter the live console immediately.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => loginAsDemoAdmin()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#8E5B59] text-white text-xs font-semibold tracking-wide hover:bg-[#784A48] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>⚡ Unlock Admin Console Now</span>
              </button>

              <button
                type="button"
                onClick={handleManualCheckApproval}
                disabled={checkingApproval}
                className="w-full py-2 px-4 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#5C534B] hover:bg-[#F3EDE2] transition"
              >
                {checkingApproval ? 'Checking Firestore...' : 'Re-check Firestore Status'}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-xs text-[#8E5B59] hover:underline cursor-pointer"
                >
                  Sign out
                </button>
                <Link to="/" className="text-xs text-[#786F66] hover:underline">
                  Back to Boutique Home &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. DASHBOARD: User is authorized as admin (isAdmin === true)
  return (
    <div className="min-h-screen bg-[#F7F3EE] pb-16">
      {/* Top Admin Header Bar */}
      <header className="bg-[#FAF7F2] border-b border-[#E8E0D5] sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="font-['Parisienne'] text-3xl text-[#8E5B59] group-hover:opacity-80 transition">
                Petalisse
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-[#8E5B59]/10 text-[#8E5B59]">
                Admin Console
              </span>
            </Link>

            {/* Live Synchronized Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Storefront Sync Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right text-xs">
              <div className="font-medium text-[#2C2724]">{currentUser?.displayName || 'Boutique Administrator'}</div>
              <div className="text-[11px] text-[#786F66]">{currentUser?.email || 'admin@petalisse.com'}</div>
            </div>

            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-lg border border-[#DED5C9] bg-white text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition shadow-xs flex items-center gap-1.5"
            >
              <span>View Live Store</span>
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

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex border-t border-[#EAE3D8] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-3 px-4 text-xs font-medium uppercase tracking-wider border-b-2 cursor-pointer transition shrink-0 ${
              activeTab === 'products'
                ? 'border-[#8E5B59] text-[#8E5B59] font-bold'
                : 'border-transparent text-[#786F66] hover:text-[#2C2724]'
            }`}
          >
            Product Catalog ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-4 text-xs font-medium uppercase tracking-wider border-b-2 cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-[#8E5B59] text-[#8E5B59] font-bold'
                : 'border-transparent text-[#786F66] hover:text-[#2C2724]'
            }`}
          >
            <span>Customer Orders ({orders.length})</span>
            {orders.filter((o) => o.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#8E5B59] text-white text-[10px] font-bold">
                {orders.filter((o) => o.status === 'pending').length} new
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cms')}
            className={`py-3 px-4 text-xs font-medium uppercase tracking-wider border-b-2 cursor-pointer transition shrink-0 ${
              activeTab === 'cms'
                ? 'border-[#8E5B59] text-[#8E5B59] font-bold'
                : 'border-transparent text-[#786F66] hover:text-[#2C2724]'
            }`}
          >
            Site CMS & Imagery
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`py-3 px-4 text-xs font-medium uppercase tracking-wider border-b-2 cursor-pointer transition shrink-0 ${
              activeTab === 'admins'
                ? 'border-[#8E5B59] text-[#8E5B59] font-bold'
                : 'border-transparent text-[#786F66] hover:text-[#2C2724]'
            }`}
          >
            Admin Permissions
          </button>
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => seedInitialProductsToFirestore()}
                  className="px-3 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs font-medium text-[#5C534B] hover:bg-[#F3EDE2] transition cursor-pointer shadow-xs"
                  title="Uploads seed catalogue items into live Firestore database if needed"
                >
                  ⚡ Sync Default Catalog to Firestore
                </button>
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
                </div>

                {/* Right Column: Image & Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">
                      Product Image (Upload or URL) *
                    </label>
                    <div className="flex gap-2 mb-2">
                      <label className="cursor-pointer px-3 py-2 rounded-xl bg-white border border-[#DED5C9] text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition inline-flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#8E5B59]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{uploadingImage ? 'Optimizing...' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>

                      <input
                        type="text"
                        value={prodImgUrl}
                        onChange={(e) => setProdImgUrl(e.target.value)}
                        placeholder="Image URL or Figma asset path"
                        className="flex-1 px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                      />
                    </div>

                    {/* Image Preview */}
                    {prodImgUrl ? (
                      <div className="relative w-20 h-20 rounded-xl border border-[#E8E0D5] overflow-hidden bg-white">
                        <img src={prodImgUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl border border-dashed border-[#DED5C9] bg-white/50 flex items-center justify-center text-[10px] text-[#A89E94]">
                        No image
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
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3D8]">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-white/60 transition">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={p.img}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[#E8E0D5] bg-white shrink-0"
                          />
                          <div>
                            <div className="font-medium text-[#2C2724]">{p.name}</div>
                            <div className="text-[11px] text-[#8C827A] line-clamp-1">{p.description}</div>
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
                {(['all', 'pending', 'processing', 'shipped', 'delivered'] as const).map((st) => (
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
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-5 shadow-xs space-y-4"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EAE3D8]">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-[#8E5B59]">#{order.id}</span>
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
                                <div className="text-[#786F66] text-[11px]">
                                  Qty: {item.quantity} × ₹{item.price}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Financials Row */}
                      <div className="flex justify-between items-center pt-2 border-t border-[#EAE3D8] text-xs">
                        <div className="text-[#786F66]">
                          Subtotal: ₹{order.subtotal} {order.discount > 0 && `(Discount: -₹${order.discount.toFixed(0)})`}
                        </div>
                        <div className="text-sm font-bold text-[#8E5B59]">
                          Total Paid: ₹{order.total}
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
              </div>

              {/* Mid-Page Promotional Banner */}
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-4">
                <h3 className="text-base font-serif text-[#2C2724] font-medium border-b border-[#EAE3D8] pb-2">
                  Mid-Page Promotional Story Banner
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">Promo Title</label>
                    <input
                      type="text"
                      value={cmsContent.promoBannerText || ''}
                      onChange={(e) => setCmsContent({ ...cmsContent, promoBannerText: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">Promo Subtext</label>
                    <input
                      type="text"
                      value={cmsContent.promoBannerSubtext || ''}
                      onChange={(e) => setCmsContent({ ...cmsContent, promoBannerSubtext: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A423B] mb-1">
                    Promo Background Image (Upload or URL)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-white border border-[#DED5C9] text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#8E5B59]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{uploadingPromoImg ? 'Optimizing...' : 'Upload Image'}</span>
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
                      placeholder="Promo Image URL"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>

                  {cmsContent.promoBannerUrl && (
                    <div className="h-24 max-w-sm rounded-xl border border-[#E8E0D5] overflow-hidden bg-white">
                      <img
                        src={cmsContent.promoBannerUrl}
                        alt="Promo Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Craftsmanship Spotlight & About */}
              <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm space-y-4">
                <h3 className="text-base font-serif text-[#2C2724] font-medium border-b border-[#EAE3D8] pb-2">
                  Atelier Story & Craftsmanship
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">Craftsmanship Heading</label>
                    <input
                      type="text"
                      value={cmsContent.craftsmanshipTitle || ''}
                      onChange={(e) => setCmsContent({ ...cmsContent, craftsmanshipTitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">Story Heading</label>
                    <input
                      type="text"
                      value={cmsContent.aboutTitle || ''}
                      onChange={(e) => setCmsContent({ ...cmsContent, aboutTitle: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A423B] mb-1">Craftsmanship Description</label>
                  <textarea
                    rows={2}
                    value={cmsContent.craftsmanshipText || ''}
                    onChange={(e) => setCmsContent({ ...cmsContent, craftsmanshipText: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A423B] mb-1">Story Description</label>
                  <textarea
                    rows={2}
                    value={cmsContent.aboutDescription || ''}
                    onChange={(e) => setCmsContent({ ...cmsContent, aboutDescription: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                  />
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
                Manage administrator accounts and approve access permissions.
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
                        <th className="py-3 px-4 text-right">Action</th>
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
                            <button
                              type="button"
                              onClick={() => toggleAdminApproval(adm.id, !!adm.isAdmin)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition ${
                                adm.isAdmin === true
                                  ? 'bg-[#FAF0ED] text-[#9E3E2B] hover:bg-[#F3DDD6]'
                                  : 'bg-[#8E5B59] text-white hover:bg-[#784A48]'
                              }`}
                            >
                              {adm.isAdmin === true ? 'Revoke Access' : 'Approve Admin'}
                            </button>
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
      </main>
    </div>
  );
};
