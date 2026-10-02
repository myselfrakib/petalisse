import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { collection, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { LazyImage } from '../components/LazyImage';

const imgProfileAvatar = '/figma-assets/a8ebf5939a3c12ed28690a4a48c6a6563322d7cf.png';
const imgShoppingBag = '/figma-assets/8aab77e6404936a9df121d7028258a27c83ee8b7.svg';
const imgHeart = '/figma-assets/666f88cde482e4924187a9e44c22afac92ead2fc.svg';
const imgHelpCircle = '/figma-assets/60e62dcce9cd785dd34a9a3edf90e3d426f40e0b.svg';
const imgRose = '/figma-assets/6651ea04a82113b00c24d2d807dd1e8a69558b14.svg';
const imgChevronLeft = '/figma-assets/a9ed62056d32eaca4682db0b3be7e08d78983400.svg';
const imgLine = '/figma-assets/cc59bfc996c199663b36f3ef980785829799417a.svg';

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  isDefault?: boolean;
}

export default function Profile() {
  const { currentUser, userProfile, updateUserProfileData, logout, isAdmin, saveAddress } = useAuth();
  const { products, orders } = useContent();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { add } = useCart();
  const navigate = useNavigate();
  const [isWishlistExpanded, setIsWishlistExpanded] = useState(false);
  const [addedWishlistId, setAddedWishlistId] = useState<string | null>(null);

  // Products in current wishlist
  const wishlistProducts = useMemo(() => {
    return products.filter((p) => wishlist.includes(p.id));
  }, [products, wishlist]);

  // Filter orders for the logged-in user
  const myOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(
      (o) =>
        (o.userId && o.userId === currentUser.uid) ||
        (o.userEmail && o.userEmail.toLowerCase() === currentUser.email?.toLowerCase())
    );
  }, [orders, currentUser]);

  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddressStr, setNewAddressStr] = useState('');

  // Effective addresses combining Firestore addresses, local cache, and past order delivery addresses
  const effectiveAddresses = useMemo(() => {
    if (addresses.length > 0) return addresses;
    try {
      if (currentUser) {
        const cached = localStorage.getItem(`petalisse_addresses_${currentUser.uid}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    const fromOrders: SavedAddress[] = [];
    myOrders.forEach((o) => {
      if (o.shippingAddress && !fromOrders.some((a) => a.address === o.shippingAddress)) {
        fromOrders.push({
          id: `order_addr_${o.id}`,
          label: 'Order Delivery Location',
          address: o.shippingAddress,
          isDefault: fromOrders.length === 0,
        });
      }
    });
    return fromOrders;
  }, [addresses, myOrders, currentUser]);

  // Sync profile data when currentUser or userProfile loads
  useEffect(() => {
    if (currentUser) {
      setProfileName(userProfile?.name || currentUser.displayName || '');
      setProfilePhone(userProfile?.phone || '');
    }
  }, [currentUser, userProfile]);

  // Sync saved addresses with Firestore & cache
  useEffect(() => {
    if (!currentUser) {
      setAddresses([]);
      return;
    }
    const q = collection(db, 'users', currentUser.uid, 'addresses');
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const list: SavedAddress[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              label: data.label || 'Home',
              address: data.address || '',
              isDefault: !!data.isDefault,
            });
          });
          setAddresses(list);
          try {
            localStorage.setItem(`petalisse_addresses_${currentUser.uid}`, JSON.stringify(list));
          } catch {}
        } else {
          try {
            const cached = localStorage.getItem(`petalisse_addresses_${currentUser.uid}`);
            if (cached) setAddresses(JSON.parse(cached));
          } catch {}
        }
      },
      (err) => {
        console.warn('Address listener notice:', err);
        try {
          const cached = localStorage.getItem(`petalisse_addresses_${currentUser.uid}`);
          if (cached) setAddresses(JSON.parse(cached));
        } catch {}
      }
    );
    return () => unsub();
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaveSuccess(false);
    try {
      await updateUserProfileData({
        name: profileName,
        phone: profilePhone,
      });
      setIsEditing(false);
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 4000);
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    if (currentUser) {
      try {
        const cacheKey = `petalisse_addresses_${currentUser.uid}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const list = JSON.parse(cached).filter((a: any) => a.id !== id);
          localStorage.setItem(cacheKey, JSON.stringify(list));
        }
        await deleteDoc(doc(db, 'users', currentUser.uid, 'addresses', id));
      } catch (e) {
        console.warn('Error deleting address:', e);
      }
    }
  };

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressStr.trim()) return;
    const newId = `addr_${Date.now()}`;
    const newAddr: SavedAddress = {
      id: newId,
      label: newLabel.trim() || 'Home',
      address: newAddressStr.trim(),
      isDefault: addresses.length === 0,
    };
    setAddresses((prev) => [...prev, newAddr]);
    if (currentUser) {
      try {
        await saveAddress(newAddr as any);
      } catch (e) {
        console.warn('Error saving address:', e);
      }
    }
    setNewAddressStr('');
    setShowAddAddressModal(false);
  };

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'delivered') {
      return 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
    }
    if (s === 'shipped') {
      return 'bg-[#FAF5FF] text-[#6B21A8] border-[#E9D5FF]';
    }
    if (s === 'processing') {
      return 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]';
    }
    return 'bg-[#FAF0ED] text-[#6B1A2A] border-[#E8C5B8]';
  };

  // 1. UNCOMMITTED / NOT LOGGED IN STATE
  if (!currentUser) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-start py-6 px-4 sm:px-6 pb-28 relative bg-[#fdfbf7]"
        style={{ backgroundColor: '#fdfbf7' }}
      >
        <main
          className="w-full max-w-[430px] rounded-[24px] shadow-[0px_8px_28px_rgba(44,62,80,0.14)] p-6 sm:p-7 relative flex flex-col gap-6 items-stretch overflow-visible border border-[rgba(107,26,42,0.06)] bg-[#84c9f13a] text-center"
          style={{ backgroundColor: '#84c9f13a' }}
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-2 pt-2">
            <h1
              className="font-meow text-[#6b1a2a] text-5xl sm:text-6xl leading-none select-none"
              style={{ fontFamily: "'Meow Script', cursive" }}
            >
              Petalisse
            </h1>
            <p className="font-cormorant font-bold text-[#6b1a2a] text-[15px] sm:text-[16px] tracking-wider flex items-center justify-center gap-1.5 select-none">
              <span>Boutique Patron Account</span>
              <img alt="Rose" className="size-4 shrink-0 object-contain" src={imgRose} />
            </p>
          </div>

          {/* Prompt Card */}
          <div className="bg-white/85 backdrop-blur-xs rounded-[20px] border border-[rgba(107,26,42,0.1)] p-6 shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#f9d5e5] border border-[#e7bec9] flex items-center justify-center mx-auto text-[#6b1a2a] shadow-2xs">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            <p className="font-cormorant text-sm sm:text-[15px] text-[#4a423b] leading-relaxed">
              Sign in to track your live charm orders, manage your saved shipping addresses, and review handcrafted purchases.
            </p>

            <div className="space-y-2.5 pt-2">
              <Link
                to="/login?redirect=/profile"
                className="w-full py-3 px-4 rounded-[14px] bg-[#6b1a2a] hover:bg-[#50131f] text-white text-xs font-semibold uppercase tracking-wider transition shadow-xs block text-center"
              >
                Sign In or Create Account
              </Link>
              <Link
                to="/shop"
                className="w-full py-2.5 px-4 rounded-[14px] border border-[rgba(107,26,42,0.18)] bg-white hover:bg-[#f9d5e5]/40 text-[#6b1a2a] text-xs font-medium transition block text-center"
              >
                Explore Charm Boutique &rarr;
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. LOGGED IN PATRON DASHBOARD
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-5 px-4 sm:px-6 pb-28 relative bg-[#fdfbf7]"
      style={{
        backgroundColor: '#fdfbf7',
      }}
      data-name="petalisse-profile-page"
    >
      {/* Central Paper Panel */}
      <main
        className="w-full max-w-[430px] rounded-[24px] shadow-[0px_8px_28px_rgba(44,62,80,0.14)] p-4 sm:p-5 relative flex flex-col gap-5 items-stretch overflow-visible border border-[rgba(107,26,42,0.06)] bg-[#84c9f13a]"
        style={{
          backgroundColor: '#84c9f13a',
        }}
        data-name="paper-center-panel"
      >
        {/* ── TOP NAVBAR ── */}
        <header
          className="border-b border-[#6b1a2a]/10 pb-3 flex items-center justify-between w-full"
          data-name="top-navbar"
        >
          <Link
            to="/"
            className="bg-[#f9d5e5] rounded-[12px] p-2 flex items-center justify-center hover:bg-[#f3bed3] active:scale-95 transition-all shadow-xs"
            aria-label="Back to home"
          >
            <img alt="Back" className="size-3.5 block" src={imgChevronLeft} />
          </Link>

          <h1 className="font-parisienne text-[#6b1a2a] text-[30px] sm:text-[32px] leading-none">
            My Account
          </h1>

          <div className="flex items-center gap-1">
            <img alt="Petalisse Rose" className="size-5 object-contain" src={imgRose} />
          </div>
        </header>

        {/* Success Alert */}
        {profileSaveSuccess && (
          <div className="p-3.5 rounded-[16px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs flex items-center justify-between shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Profile details updated successfully!</span>
            </div>
            <button
              type="button"
              onClick={() => setProfileSaveSuccess(false)}
              className="text-[#166534] hover:opacity-70 text-xs cursor-pointer font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── PATRON IDENTITY CARD ── */}
        <div className="bg-white/85 backdrop-blur-xs rounded-[20px] border border-[rgba(107,26,42,0.1)] p-5 shadow-xs text-center relative overflow-hidden">
          <div className="relative mx-auto size-20 rounded-full p-1 bg-gradient-to-tr from-[#f9d5e5] via-[#fad4c0] to-[#e7bec9] shadow-xs mb-3">
            <img
              alt="Patron Avatar"
              src={imgProfileAvatar}
              className="size-full object-cover rounded-full bg-white"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="hidden size-full rounded-full bg-[#FAF0ED] text-[#6b1a2a] font-serif text-2xl font-bold flex items-center justify-center">
              {(profileName || currentUser.displayName || 'P').charAt(0).toUpperCase()}
            </div>
          </div>

          <h2 className="font-cormorant font-bold text-[#6b1a2a] text-xl truncate px-2">
            {profileName || currentUser.displayName || 'Boutique Patron'}
          </h2>
          <p className="font-cormorant text-xs text-[#786F66] truncate mt-0.5 px-2">
            {currentUser.email}
          </p>

          {/* Status Pills */}
          <div className="mt-2.5 flex items-center justify-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-[#f9d5e5] text-[#6b1a2a] border border-[#e7bec9] text-[10px] font-semibold uppercase tracking-wider">
              Patron Member
            </span>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-[10px] font-semibold uppercase tracking-wider">
                Admin Active
              </span>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-4 pt-3.5 border-t border-[#6b1a2a]/10 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-[14px] bg-[#fdfbf7] border border-[rgba(107,26,42,0.08)]">
              <span className="block text-lg font-serif font-semibold text-[#6b1a2a]">
                {myOrders.length}
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-[#8C827A] font-medium font-cormorant">
                Orders
              </span>
            </div>
            <a
              href="#wishlist-card"
              className="p-2 rounded-[14px] bg-[#fdfbf7] border border-[rgba(107,26,42,0.08)] hover:border-[#6b1a2a]/40 transition group cursor-pointer block"
            >
              <span className="block text-lg font-serif font-semibold text-[#6b1a2a] group-hover:scale-105 transition-transform">
                {wishlistProducts.length}
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-[#8C827A] font-medium font-cormorant">
                Wishlist
              </span>
            </a>
            <div className="p-2 rounded-[14px] bg-[#fdfbf7] border border-[rgba(107,26,42,0.08)]">
              <span className="block text-lg font-serif font-semibold text-[#6b1a2a]">
                {addresses.length}
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-[#8C827A] font-medium font-cormorant">
                Locations
              </span>
            </div>
          </div>

          {/* Admin Shortcut if Admin */}
          {isAdmin && (
            <div className="mt-4 p-3 rounded-[14px] bg-[#f9d5e5]/50 border border-[#e7bec9] text-left">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#6b1a2a] uppercase tracking-wider block">
                    Admin Console
                  </span>
                  <span className="text-[10px] text-[#6B5F55] font-cormorant">
                    Catalog, CMS & order management
                  </span>
                </div>
                <Link
                  to="/admin"
                  className="px-3 py-1 rounded-[10px] bg-[#6b1a2a] text-white text-[11px] font-medium hover:bg-[#50131f] transition"
                >
                  Open &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── WISHLIST CARD (BEFORE PERSONAL INFORMATION) ── */}
        <div id="wishlist-card" className="bg-white/85 backdrop-blur-xs rounded-[20px] border border-[rgba(107,26,42,0.1)] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#6b1a2a]/10 pb-3 mb-3.5">
            <div className="flex items-center gap-2">
              <svg className="size-4 text-[#6b1a2a] fill-[#6b1a2a]" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <h2 className="font-cormorant font-bold text-[#6b1a2a] text-[16px] sm:text-[17px] uppercase tracking-wider">
                My Wishlist
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f9d5e5] text-[#6b1a2a] font-semibold border border-[#e7bec9]">
                {wishlistProducts.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {wishlistProducts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsWishlistExpanded(!isWishlistExpanded)}
                  className="px-3 py-1 rounded-[10px] bg-[#f9d5e5] hover:bg-[#f3bed3] text-[#6b1a2a] text-xs font-semibold transition cursor-pointer"
                >
                  {isWishlistExpanded ? 'Collapse' : 'View All'}
                </button>
              )}
              <Link
                to="/shop"
                className="text-xs text-[#6b1a2a] hover:underline font-cormorant font-semibold"
              >
                Shop &rarr;
              </Link>
            </div>
          </div>

          {wishlistProducts.length === 0 ? (
            <div className="p-6 text-center bg-[#fdfbf7] rounded-[14px] border border-dashed border-[#DED5C9] space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-[#f9d5e5] text-[#6b1a2a] flex items-center justify-center mx-auto text-lg">
                ❤️
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[#2C2724]">Your Wishlist is Empty</h4>
                <p className="text-[11px] text-[#786F66] mt-0.5 font-cormorant">
                  Save your favorite handcrafted charms and keepsakes to view them here anytime.
                </p>
              </div>
              <Link
                to="/shop"
                className="inline-block px-4 py-1.5 rounded-[12px] bg-[#6b1a2a] hover:bg-[#50131f] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs"
              >
                Explore Boutique
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {(isWishlistExpanded ? wishlistProducts : wishlistProducts.slice(0, 3)).map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-[14px] bg-[#fdfbf7] border border-[rgba(107,26,42,0.08)] shadow-2xs flex items-center gap-3 hover:border-[#6b1a2a]/30 transition group"
                >
                  <Link to={`/product/${prod.id}`} className="size-16 rounded-[10px] overflow-hidden shrink-0 border border-[rgba(107,26,42,0.1)] bg-white block">
                    <LazyImage
                      alt={prod.name}
                      src={prod.img || prod.images?.[0] || ''}
                      priority={false}
                      containerClassName="size-full"
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${prod.id}`}
                      className="font-cormorant font-bold text-[#6b1a2a] text-sm block truncate hover:underline"
                    >
                      {prod.name}
                    </Link>
                    <span className="font-sans font-bold text-xs text-[#2C2724] mt-0.5 block">
                      ₹{prod.discountedPrice ?? prod.price}
                    </span>
                    <span className="text-[10px] text-[#8C827A] font-cormorant">
                      {prod.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        add(prod);
                        setAddedWishlistId(prod.id);
                        setTimeout(() => setAddedWishlistId(null), 1200);
                      }}
                      className="px-2.5 py-1 rounded-[8px] bg-[#6b1a2a] hover:bg-[#50131f] text-white text-[11px] font-semibold transition active:scale-95 shadow-2xs cursor-pointer"
                    >
                      {addedWishlistId === prod.id ? '✓ Added' : 'Add to Cart'}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFromWishlist(prod.id)}
                      className="p-1 text-[#8C827A] hover:text-[#c82333] transition cursor-pointer"
                      title="Remove from wishlist"
                      aria-label="Remove from wishlist"
                    >
                      <svg className="size-4 text-[#c82333] fill-[#c82333]" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}

              {wishlistProducts.length > 3 && !isWishlistExpanded && (
                <button
                  type="button"
                  onClick={() => setIsWishlistExpanded(true)}
                  className="w-full py-1.5 text-center text-xs font-cormorant font-bold text-[#6b1a2a] hover:underline cursor-pointer"
                >
                  + {wishlistProducts.length - 3} more items in wishlist &rarr;
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── PERSONAL DETAILS CARD ── */}
        <div className="bg-white/85 backdrop-blur-xs rounded-[20px] border border-[rgba(107,26,42,0.1)] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#6b1a2a]/10 pb-3 mb-3.5">
            <h2 className="font-cormorant font-bold text-[#6b1a2a] text-[16px] sm:text-[17px] uppercase tracking-wider">
              Personal Information
            </h2>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 rounded-[10px] bg-[#f9d5e5] hover:bg-[#f3bed3] text-[#6b1a2a] text-xs font-semibold transition cursor-pointer"
              >
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1 font-cormorant">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3.5 py-2 rounded-[12px] border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#6b1a2a]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1 font-cormorant">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2 rounded-[12px] border border-[#DED5C9] bg-white text-xs text-[#2C2724] focus:outline-hidden focus:border-[#6b1a2a]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4A423B] mb-1 font-cormorant">
                  Account Email
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email || ''}
                  className="w-full px-3.5 py-2 rounded-[12px] border border-[#DED5C9] bg-[#fdfbf7] text-xs text-[#786F66] cursor-not-allowed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setProfileName(userProfile?.name || currentUser.displayName || '');
                    setProfilePhone(userProfile?.phone || '');
                  }}
                  className="px-3.5 py-1.5 rounded-[12px] border border-[#DED5C9] bg-white text-xs font-medium text-[#5C534B] hover:bg-[#F3EDE2] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-1.5 rounded-[12px] bg-[#6b1a2a] hover:bg-[#50131f] text-white text-xs font-medium transition cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  {savingProfile && (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>Save</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-[12px] bg-[#fdfbf7] border border-[rgba(107,26,42,0.08)] flex items-center justify-between">
                <span className="font-cormorant font-semibold text-[#8C827A] uppercase text-[10px]">
                  Name
                </span>
                <span className="font-medium text-[#2C2724]">
                  {profileName || 'Not specified'}
                </span>
              </div>

              <div className="p-3 rounded-[12px] bg-[#fdfbf7] border border-[rgba(107,26,42,0.08)] flex items-center justify-between">
                <span className="font-cormorant font-semibold text-[#8C827A] uppercase text-[10px]">
                  Email
                </span>
                <span className="font-medium text-[#2C2724] truncate max-w-[200px]">
                  {currentUser.email}
                </span>
              </div>

              <div className="p-3 rounded-[12px] bg-[#fdfbf7] border border-[rgba(107,26,42,0.08)] flex items-center justify-between">
                <span className="font-cormorant font-semibold text-[#8C827A] uppercase text-[10px]">
                  Phone
                </span>
                <span className="font-medium text-[#2C2724]">
                  {profilePhone || 'Not provided'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── SAVED SHIPPING ADDRESSES CARD ── */}
        <div className="bg-white/85 backdrop-blur-xs rounded-[20px] border border-[rgba(107,26,42,0.1)] p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#6b1a2a]/10 pb-3 mb-3.5">
            <h2 className="font-cormorant font-bold text-[#6b1a2a] text-[16px] sm:text-[17px] uppercase tracking-wider">
              Shipping Addresses
            </h2>
            {!showAddAddressModal && (
              <button
                type="button"
                onClick={() => setShowAddAddressModal(true)}
                className="px-3 py-1 rounded-[10px] bg-[#6b1a2a] hover:bg-[#50131f] text-white text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>+</span>
                <span>Add</span>
              </button>
            )}
          </div>

          {/* Add Address Form Modal/Panel */}
          {showAddAddressModal && (
            <form
              onSubmit={handleCreateAddress}
              className="mb-4 p-3.5 rounded-[14px] bg-[#fdfbf7] border border-[#e7bec9] space-y-3 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#6b1a2a] uppercase tracking-wider font-cormorant">
                  New Delivery Location
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="text-[#8C827A] hover:text-[#2C2724] text-xs cursor-pointer"
                >
                  ✕ Cancel
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#4A423B] mb-1 font-cormorant">
                  Label
                </label>
                <input
                  type="text"
                  required
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Home, Studio, Apartment"
                  className="w-full px-3 py-1.5 rounded-[10px] border border-[#DED5C9] bg-white text-xs focus:outline-hidden focus:border-[#6b1a2a]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#4A423B] mb-1 font-cormorant">
                  Full Street Address & Pincode
                </label>
                <textarea
                  rows={2}
                  required
                  value={newAddressStr}
                  onChange={(e) => setNewAddressStr(e.target.value)}
                  placeholder="Flat/House number, Street name, City, State, PIN code"
                  className="w-full px-3 py-1.5 rounded-[10px] border border-[#DED5C9] bg-white text-xs focus:outline-hidden focus:border-[#6b1a2a]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-3 py-1 rounded-[10px] border border-[#DED5C9] text-xs font-medium text-[#5C534B] hover:bg-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 rounded-[10px] bg-[#6b1a2a] hover:bg-[#50131f] text-white text-xs font-medium transition shadow-2xs"
                >
                  Save Address
                </button>
              </div>
            </form>
          )}

          {/* Address List */}
          {effectiveAddresses.length === 0 && !showAddAddressModal ? (
            <div className="p-6 text-center bg-[#fdfbf7] rounded-[14px] border border-dashed border-[#DED5C9]">
              <p className="text-xs text-[#786F66] mb-2.5 font-cormorant">
                No shipping addresses saved yet.
              </p>
              <button
                type="button"
                onClick={() => setShowAddAddressModal(true)}
                className="px-3.5 py-1.5 rounded-[12px] border border-[#6b1a2a] text-[#6b1a2a] text-xs font-medium hover:bg-[#f9d5e5]/40 transition cursor-pointer"
              >
                + Add Address
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {effectiveAddresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-3 rounded-[14px] bg-[#fdfbf7] border border-[rgba(107,26,42,0.1)] hover:border-[#6b1a2a]/40 transition shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-[#2C2724] flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{addr.label}</span>
                      </span>
                      {addr.isDefault && (
                        <span className="px-2 py-0.5 rounded-full bg-[#f9d5e5] border border-[#e7bec9] text-[9px] font-bold uppercase tracking-wider text-[#6b1a2a]">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B5F55] leading-relaxed line-clamp-3">
                      {addr.address}
                    </p>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#6b1a2a]/10 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-[11px] text-[#9E3E2B] hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ORDER HISTORY CARD ── */}
        <div
          className="bg-white/85 backdrop-blur-xs rounded-[20px] border border-[rgba(107,26,42,0.1)] p-4 sm:p-5 shadow-xs font-['Inter',sans-serif]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <div className="flex items-center justify-between border-b border-[#6b1a2a]/10 pb-3 mb-3.5">
            <div className="flex items-center gap-2">
              <h2
                className="font-bold text-[#6b1a2a] text-[16px] sm:text-[17px] uppercase tracking-wider"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Order History
              </h2>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full bg-[#f9d5e5] text-[#6b1a2a] font-semibold border border-[#e7bec9]"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {myOrders.length}
              </span>
            </div>

            <Link
              to="/shop"
              className="text-xs text-[#6b1a2a] hover:underline font-semibold"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Shop &rarr;
            </Link>
          </div>

          {myOrders.length === 0 ? (
            <div
              className="p-6 text-center bg-[#fdfbf7] rounded-[14px] border border-dashed border-[#DED5C9] space-y-2.5"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <div className="w-10 h-10 rounded-full bg-[#f9d5e5] text-[#6b1a2a] flex items-center justify-center mx-auto text-lg">
                🛍️
              </div>
              <div>
                <h4
                  className="text-xs font-semibold text-[#2C2724]"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  No Orders Yet
                </h4>
                <p
                  className="text-[11px] text-[#786F66] mt-0.5"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Explore our handcrafted bag charms, hair accessories, and phone charms.
                </p>
              </div>
              <Link
                to="/shop"
                className="inline-block px-4 py-1.5 rounded-[12px] bg-[#6b1a2a] hover:bg-[#50131f] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Browse Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-3" style={{ fontFamily: "'Inter', sans-serif" }}>
              {myOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3.5 rounded-[14px] bg-[#fdfbf7] border border-[rgba(107,26,42,0.1)] shadow-2xs space-y-2.5 hover:border-[#6b1a2a]/30 transition"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {/* Top Order Row */}
                  <div className="flex items-center justify-between gap-2 border-b border-[#6b1a2a]/10 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-bold text-xs text-[#6b1a2a]"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {ord.orderNumber || (ord.id ? `#${ord.id.slice(-6).toUpperCase()}` : '#ORDER')}
                        </span>
                        <span
                          className="text-[10px] text-[#8C827A]"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {new Date(ord.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {ord.shippingAddress && (
                        <p
                          className="text-[10px] text-[#8C827A] truncate max-w-[200px] mt-0.5"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          To: {ord.customerName}
                        </p>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getStatusBadge(
                        ord.status
                      )}`}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {ord.status}
                    </span>
                  </div>

                  {/* Items Purchased */}
                  <div className="space-y-1 py-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                    {ord.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs text-[#2C2724]"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <span
                          className="text-[#4A423B] truncate max-w-[220px]"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          {it.name}{' '}
                          {it.selectedColor && (
                            <span
                              className="text-[#8C827A]"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              ({it.selectedColor})
                            </span>
                          )}{' '}
                          {it.selectedVariant && (
                            <span
                              className="text-[#8C827A]"
                              style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                              ({it.selectedVariant})
                            </span>
                          )}{' '}
                          <span
                            className="text-[#8C827A]"
                            style={{ fontFamily: "'Inter', sans-serif" }}
                          >
                            × {it.quantity}
                          </span>
                        </span>
                        <span
                          className="font-medium text-[#2C2724] shrink-0"
                          style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                          ₹{it.price * it.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Total & Payment Details */}
                  <div
                    className="pt-2 border-t border-[#6b1a2a]/10 flex items-center justify-between text-xs"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    <span
                      className="text-[10px] text-[#786F66]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {ord.paymentMethod === 'partial_cod' ? 'Partial COD' : 'Online Paid'}
                    </span>

                    <span
                      className="text-xs font-bold text-[#6b1a2a]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Total: ₹{ord.total}
                    </span>
                  </div>

                  {/* Partial COD breakdown if applicable */}
                  {ord.paymentMethod === 'partial_cod' && (
                    <div
                      className="p-2 rounded-[10px] bg-[#f9d5e5]/50 border border-[#e7bec9] flex items-center justify-between text-[10px] text-[#6b1a2a]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      <span style={{ fontFamily: "'Inter', sans-serif" }}>
                        Paid: ₹{ord.amountPaid}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Due on Delivery: ₹{ord.codAmountDue}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── QUICK SHORTCUTS CARD ── */}
        <div className="bg-white/85 backdrop-blur-xs rounded-[20px] border border-[rgba(107,26,42,0.1)] overflow-hidden shadow-xs divide-y divide-[#6b1a2a]/10">
          <Link
            to="/cart"
            className="p-3 flex items-center justify-between hover:bg-[#f9d5e5]/20 transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-full bg-[#f9d5e5] text-[#6b1a2a] flex items-center justify-center">
                <img alt="" className="size-3.5" src={imgShoppingBag} />
              </div>
              <span className="text-xs font-semibold text-[#2C2724] group-hover:text-[#6b1a2a] transition">
                Shopping Cart
              </span>
            </div>
            <span className="text-xs text-[#8C827A]">&rarr;</span>
          </Link>

          <Link
            to="/shop"
            className="p-3 flex items-center justify-between hover:bg-[#f9d5e5]/20 transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-full bg-[#f9d5e5] text-[#6b1a2a] flex items-center justify-center">
                <img alt="" className="size-3.5" src={imgHeart} />
              </div>
              <span className="text-xs font-semibold text-[#2C2724] group-hover:text-[#6b1a2a] transition">
                Handcrafted Catalog
              </span>
            </div>
            <span className="text-xs text-[#8C827A]">&rarr;</span>
          </Link>

          <div
            onClick={() => alert('For any order help, contact us directly at support@petalisse.com')}
            className="p-3 flex items-center justify-between hover:bg-[#f9d5e5]/20 transition group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-full bg-[#f9d5e5] text-[#6b1a2a] flex items-center justify-center">
                <img alt="" className="size-3.5" src={imgHelpCircle} />
              </div>
              <span className="text-xs font-semibold text-[#2C2724] group-hover:text-[#6b1a2a] transition">
                Concierge Support
              </span>
            </div>
            <span className="text-xs text-[#8C827A]">&rarr;</span>
          </div>
        </div>

        {/* ── BOTTOM SIGN OUT SECTION ── */}
        <div className="pt-2 pb-1 border-t border-[#6b1a2a]/10 flex flex-col items-center gap-2 text-center">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full py-2.5 px-4 rounded-[14px] bg-white hover:bg-[#f9d5e5]/50 border border-[rgba(107,26,42,0.18)] text-xs font-semibold text-[#6b1a2a] transition cursor-pointer shadow-2xs flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <svg className="w-4 h-4 shrink-0 text-[#6b1a2a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span>Sign Out of Account</span>
          </button>
          <p className="text-[11px] text-[#8C827A] font-cormorant">
            Handmade with love • Petalisse Boutique
          </p>
        </div>
      </main>
    </div>
  );
}