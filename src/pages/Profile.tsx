import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { collection, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';

const imgProfileAvatar = '/figma-assets/a8ebf5939a3c12ed28690a4a48c6a6563322d7cf.png';
const imgShoppingBag = '/figma-assets/8aab77e6404936a9df121d7028258a27c83ee8b7.svg';
const imgHeart = '/figma-assets/666f88cde482e4924187a9e44c22afac92ead2fc.svg';
const imgHelpCircle = '/figma-assets/60e62dcce9cd785dd34a9a3edf90e3d426f40e0b.svg';

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  isDefault?: boolean;
}

export default function Profile() {
  const { currentUser, userProfile, updateUserProfileData, logout, isAdmin, saveAddress } = useAuth();
  const { orders } = useContent();
  const navigate = useNavigate();

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
    return 'bg-[#FAF0ED] text-[#9E3E2B] border-[#E8C5B8]';
  };

  // 1. UNCOMMITTED / NOT LOGGED IN STATE
  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-200px)] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
        <div className="max-w-md w-full bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-8 sm:p-10 text-center shadow-xl relative overflow-hidden animate-fadeIn">
          {/* Subtle decorative flourishes */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#EEDFD5]/50 to-transparent pointer-events-none rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#EEDFD5]/50 to-transparent pointer-events-none rounded-bl-2xl" />

          <div className="w-16 h-16 rounded-full bg-[#FDF0ED] border border-[#E8C5B8] flex items-center justify-center mx-auto mb-4 text-[#8E5B59] shadow-xs">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          <span className="font-['Parisienne'] text-3xl text-[#8E5B59] block mb-1">
            Petalisse
          </span>
          <h2 className="text-2xl font-serif text-[#2C2724] font-medium tracking-tight mb-2">
            Patron Account Portal
          </h2>
          <p className="text-xs text-[#786F66] leading-relaxed mb-6 max-w-xs mx-auto">
            Sign in to track your live charm orders, manage your saved shipping addresses, and review boutique purchases.
          </p>

          <div className="space-y-3">
            <Link
              to="/login?redirect=/profile"
              className="w-full py-3 px-4 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm block text-center"
            >
              Sign In or Create Account
            </Link>
            <Link
              to="/shop"
              className="w-full py-2.5 px-4 rounded-xl border border-[#DED5C9] bg-white hover:bg-[#F3EDE2] text-[#5C534B] text-xs font-medium transition block text-center"
            >
              Explore Charm Boutique &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. LOGGED IN PATRON DASHBOARD
  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Breadcrumbs / Title */}
        <div className="mb-8 border-b border-[#EAE3D8] pb-6">
          <div className="flex items-center gap-2 text-xs text-[#8C827A] mb-1">
            <Link to="/" className="hover:text-[#6B1A2A] transition">Home</Link>
            <span>/</span>
            <span className="text-[#6B1A2A] font-medium">My Account</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#2C2724] font-medium tracking-tight">
            Boutique Patron Dashboard
          </h1>
          <p className="text-xs text-[#786F66] mt-1">
            Manage your personal profile, delivery locations, and handcrafted orders
          </p>
        </div>

        {/* Success Alert */}
        {profileSaveSuccess && (
          <div className="mb-6 p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs flex items-center justify-between shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Your profile information has been successfully updated.</span>
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

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ── LEFT COLUMN: Patron Identity & Quick Actions (4 cols) ── */}
          <div className="lg:col-span-4 space-y-6">
            {/* Identity Card */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 shadow-sm text-center relative overflow-hidden">
              <div className="relative mx-auto size-20 sm:size-24 rounded-full p-1 bg-gradient-to-tr from-[#E8C5B8] via-[#FAD4C0] to-[#E7BEC9] shadow-sm mb-4">
                <img
                  alt="Patron Avatar"
                  src={imgProfileAvatar}
                  className="size-full object-cover rounded-full bg-white"
                  onError={(e) => {
                    // Fallback to monogram
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="hidden size-full rounded-full bg-[#FAF0ED] text-[#8E5B59] font-serif text-2xl font-bold flex items-center justify-center">
                  {(profileName || currentUser.displayName || 'P').charAt(0).toUpperCase()}
                </div>
              </div>

              <h2 className="text-xl font-serif text-[#2C2724] font-medium truncate px-2">
                {profileName || currentUser.displayName || 'Boutique Patron'}
              </h2>
              <p className="text-xs text-[#786F66] truncate mt-0.5 px-2">
                {currentUser.email}
              </p>

              {/* Status Pills */}
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-[#FAF0ED] text-[#8E5B59] border border-[#E8C5B8] text-[10px] font-semibold uppercase tracking-wider">
                  Patron Member
                </span>
                {isAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0] text-[10px] font-semibold uppercase tracking-wider">
                    Admin Active
                  </span>
                )}
              </div>

              {/* Member Since & Stats */}
              <div className="mt-5 pt-4 border-t border-[#EAE3D8] grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white/70 border border-[#EAE3D8]">
                  <span className="block text-lg font-serif font-semibold text-[#8E5B59]">
                    {myOrders.length}
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider text-[#8C827A] font-medium">
                    Orders
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/70 border border-[#EAE3D8]">
                  <span className="block text-lg font-serif font-semibold text-[#8E5B59]">
                    {addresses.length}
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider text-[#8C827A] font-medium">
                    Addresses
                  </span>
                </div>
              </div>

              {/* Admin Portal Shortcut if Admin */}
              {isAdmin && (
                <div className="mt-5 p-3 rounded-xl bg-[#8E5B59]/5 border border-[#8E5B59]/20 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#8E5B59] uppercase tracking-wider block">
                        Admin Console
                      </span>
                      <span className="text-[10px] text-[#6B5F55]">
                        Products, CMS & live orders
                      </span>
                    </div>
                    <Link
                      to="/admin"
                      className="px-3 py-1 rounded-lg bg-[#8E5B59] text-white text-[11px] font-medium hover:bg-[#784A48] transition"
                    >
                      Open &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Navigation Card */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] overflow-hidden shadow-xs divide-y divide-[#EAE3D8]">
              <Link
                to="/cart"
                className="p-3.5 flex items-center justify-between hover:bg-white transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center">
                    <img alt="" className="size-4" src={imgShoppingBag} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#2C2724] group-hover:text-[#8E5B59] transition block">
                      My Shopping Cart
                    </span>
                    <span className="text-[10px] text-[#8C827A]">
                      View bag items & checkout
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[#8C827A]">&rarr;</span>
              </Link>

              <Link
                to="/shop"
                className="p-3.5 flex items-center justify-between hover:bg-white transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center">
                    <img alt="" className="size-4" src={imgHeart} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#2C2724] group-hover:text-[#8E5B59] transition block">
                      Handcrafted Catalog
                    </span>
                    <span className="text-[10px] text-[#8C827A]">
                      Explore small-batch charms
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[#8C827A]">&rarr;</span>
              </Link>

              <div
                onClick={() => alert('For any order help, contact us directly at support@petalisse.com')}
                className="p-3.5 flex items-center justify-between hover:bg-white transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center">
                    <img alt="" className="size-4" src={imgHelpCircle} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#2C2724] group-hover:text-[#8E5B59] transition block">
                      Concierge Support
                    </span>
                    <span className="text-[10px] text-[#8C827A]">
                      Assistance with custom orders
                    </span>
                  </div>
                </div>
                <span className="text-xs text-[#8C827A]">&rarr;</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Account Information, Addresses & Orders (8 cols) ── */}
          <div className="lg:col-span-8 space-y-8">
            {/* 1. Account Details Card */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#EAE3D8] pb-4 mb-5">
                <div>
                  <h3 className="text-lg font-serif text-[#2C2724] font-medium">
                    Personal Information
                  </h3>
                  <p className="text-xs text-[#786F66]">
                    Your verified contact credentials for orders and delivery updates
                  </p>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3.5 py-1.5 rounded-lg border border-[#DED5C9] bg-white text-xs font-medium text-[#5C534B] hover:bg-[#FAF5F0] transition shadow-2xs cursor-pointer"
                  >
                    Edit Details
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4A423B] mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="e.g. Eleanor Vance"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A423B] mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-white text-sm text-[#2C2724] focus:outline-hidden focus:border-[#8E5B59]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentUser.email || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DED5C9] bg-[#F3EDE2]/60 text-sm text-[#786F66] cursor-not-allowed"
                    />
                    <span className="text-[10px] text-[#8C827A] mt-1 block">
                      Account email is managed through authentication security.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setProfileName(userProfile?.name || currentUser.displayName || '');
                        setProfilePhone(userProfile?.phone || '');
                      }}
                      className="px-4 py-2 rounded-xl border border-[#DED5C9] bg-white text-xs font-medium text-[#5C534B] hover:bg-[#F3EDE2] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium transition cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      {savingProfile && (
                        <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-white border border-[#EAE3D8]">
                    <span className="text-[10px] uppercase font-semibold text-[#8C827A] tracking-wider block mb-1">
                      Patron Name
                    </span>
                    <span className="text-sm font-medium text-[#2C2724] block">
                      {profileName || 'Not specified'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#EAE3D8]">
                    <span className="text-[10px] uppercase font-semibold text-[#8C827A] tracking-wider block mb-1">
                      Registered Email
                    </span>
                    <span className="text-sm font-medium text-[#2C2724] truncate block">
                      {currentUser.email}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#EAE3D8]">
                    <span className="text-[10px] uppercase font-semibold text-[#8C827A] tracking-wider block mb-1">
                      Contact Phone
                    </span>
                    <span className="text-sm font-medium text-[#2C2724] block">
                      {profilePhone || 'Not provided'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#EAE3D8]">
                    <span className="text-[10px] uppercase font-semibold text-[#8C827A] tracking-wider block mb-1">
                      Member Since
                    </span>
                    <span className="text-sm font-medium text-[#2C2724] block">
                      {currentUser.metadata.creationTime
                        ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Petalisse Patron'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Saved Delivery Addresses */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#EAE3D8] pb-4 mb-5">
                <div>
                  <h3 className="text-lg font-serif text-[#2C2724] font-medium">
                    Saved Shipping Addresses
                  </h3>
                  <p className="text-xs text-[#786F66]">
                    Addresses stored for quick, one-click checkout
                  </p>
                </div>
                {!showAddAddressModal && (
                  <button
                    type="button"
                    onClick={() => setShowAddAddressModal(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium transition shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>+</span>
                    <span>Add Address</span>
                  </button>
                )}
              </div>

              {/* Add Address Form Modal/Panel */}
              {showAddAddressModal && (
                <form
                  onSubmit={handleCreateAddress}
                  className="mb-6 p-4 rounded-xl bg-white border border-[#E8C5B8] space-y-3.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#8E5B59] uppercase tracking-wider">
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
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">
                      Address Label
                    </label>
                    <input
                      type="text"
                      required
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="e.g. Home, Studio, Apartment"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] text-xs focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A423B] mb-1">
                      Full Street Address & Pincode
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={newAddressStr}
                      onChange={(e) => setNewAddressStr(e.target.value)}
                      placeholder="Flat/House number, Street name, City, State, PIN code"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#DED5C9] text-xs focus:outline-hidden focus:border-[#8E5B59]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAddressModal(false)}
                      className="px-3.5 py-1.5 rounded-lg border border-[#DED5C9] text-xs font-medium text-[#5C534B] hover:bg-[#FAF7F2] transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium transition shadow-xs"
                    >
                      Save Location
                    </button>
                  </div>
                </form>
              )}

              {/* Address List */}
              {addresses.length === 0 && !showAddAddressModal ? (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#DED5C9]">
                  <p className="text-xs text-[#786F66] mb-3">
                    No shipping addresses saved yet. Add your preferred delivery address for rapid checkout.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddAddressModal(true)}
                    className="px-4 py-2 rounded-xl border border-[#8E5B59] text-[#8E5B59] text-xs font-medium hover:bg-[#FAF0ED] transition cursor-pointer"
                  >
                    + Add Your First Address
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 rounded-xl bg-white border border-[#EAE3D8] hover:border-[#8E5B59]/40 transition shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-xs text-[#2C2724] flex items-center gap-1.5">
                            <span>📍</span>
                            <span>{addr.label}</span>
                          </span>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FDF0ED] border border-[#E8C5B8] text-[9px] font-bold uppercase tracking-wider text-[#8E5B59]">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B5F55] leading-relaxed line-clamp-3">
                          {addr.address}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#FAF0ED] flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-xs text-[#9E3E2B] hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. My Orders Section (Live Database Synced) */}
            <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#EAE3D8] pb-4 mb-5">
                <div>
                  <h3 className="text-lg font-serif text-[#2C2724] font-medium flex items-center gap-2">
                    <span>Order History</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF0ED] text-[#8E5B59] font-sans font-semibold border border-[#E8C5B8]">
                      {myOrders.length}
                    </span>
                  </h3>
                  <p className="text-xs text-[#786F66]">
                    Real-time status of your handmade charm purchases
                  </p>
                </div>

                <Link
                  to="/shop"
                  className="text-xs text-[#8E5B59] hover:underline font-medium"
                >
                  Order New Charms &rarr;
                </Link>
              </div>

              {myOrders.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#DED5C9] space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center mx-auto text-xl">
                    🛍️
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-medium text-[#2C2724]">No Orders Yet</h4>
                    <p className="text-xs text-[#786F66] mt-0.5">
                      Explore our small-batch handcrafted bag charms, hair accessories, and phone charms.
                    </p>
                  </div>
                  <Link
                    to="/shop"
                    className="inline-block px-5 py-2 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-semibold uppercase tracking-wider transition shadow-2xs"
                  >
                    Explore Boutique Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 sm:p-5 rounded-xl bg-white border border-[#EAE3D8] shadow-2xs space-y-3 hover:border-[#8E5B59]/30 transition"
                    >
                      {/* Top Order Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F7F3EE] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#8E5B59]">
                              {ord.orderNumber || (ord.id ? `#${ord.id.slice(-6).toUpperCase()}` : '#ORDER')}
                            </span>
                            <span className="text-[11px] text-[#8C827A]">
                              {new Date(ord.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          {ord.shippingAddress && (
                            <p className="text-[11px] text-[#8C827A] truncate max-w-sm mt-0.5">
                              Deliver to: {ord.customerName} ({ord.city || ord.shippingAddress})
                            </p>
                          )}
                        </div>

                        <span
                          className={`self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                            ord.status
                          )}`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      {/* Items Purchased */}
                      <div className="space-y-1.5 py-1">
                        {ord.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs text-[#2C2724]"
                          >
                            <span className="text-[#4A423B]">
                              {it.name}{' '}
                              {it.selectedColor && (
                                <span className="text-[#8C827A]">({it.selectedColor})</span>
                              )}{' '}
                              <span className="text-[#8C827A]">× {it.quantity}</span>
                            </span>
                            <span className="font-medium text-[#2C2724]">
                              ₹{it.price * it.quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total & Payment Details */}
                      <div className="pt-3 border-t border-[#F7F3EE] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="text-[11px] text-[#786F66]">
                          <span>
                            {ord.paymentMethod === 'partial_cod'
                              ? 'Booking Confirmed (Partial COD)'
                              : 'Online Payment'}
                          </span>
                          <span> • </span>
                          <span>
                            Shipping: {ord.shippingFee === 0 ? 'FREE' : `₹${ord.shippingFee}`}
                          </span>
                        </div>

                        <div className="text-sm font-sans font-bold text-[#8E5B59] sm:text-right">
                          Total: ₹{ord.total}
                        </div>
                      </div>

                      {/* Partial COD breakdown if applicable */}
                      {ord.paymentMethod === 'partial_cod' && (
                        <div className="p-2.5 rounded-lg bg-[#FAF0ED] border border-[#E8C5B8] flex items-center justify-between text-[11px] text-[#8E5B59]">
                          <span>Advance Paid: ₹{ord.amountPaid}</span>
                          <span className="font-semibold">Due on Delivery: ₹{ord.codAmountDue}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Sign Out Section */}
        <div className="mt-12 pt-8 border-t border-[#EAE3D8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-serif font-medium text-[#2C2724]">
              Sign Out of Boutique Account
            </h3>
            <p className="text-xs text-[#8C827A] mt-0.5">
              Securely end your patron session on this browser.
            </p>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="px-6 py-2.5 rounded-xl bg-[#FAF0ED] border border-[#E8C5B8] text-xs font-semibold text-[#9E3E2B] hover:bg-[#F5E2DC] transition cursor-pointer shadow-2xs flex items-center gap-2"
          >
            <svg className="w-4 h-4 shrink-0 text-[#9E3E2B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}