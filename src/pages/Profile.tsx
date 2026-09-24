import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { AuthModal } from '../components/AuthModal';

const imgGinghamBg = '/figma-assets/772e8e7b4c0d39ad6752261452ccca607e718dc3.png';
const imgProfileAvatar = '/figma-assets/a8ebf5939a3c12ed28690a4a48c6a6563322d7cf.png';
const imgCircleX = '/figma-assets/5a66c0a2d0b50c9d1548ebdfdc85098bb8367ffa.svg';
const imgChevronLeft = '/figma-assets/ea6787a2823f7b919d2420cf2824fb286cb04b28.svg';
const imgSettings = '/figma-assets/17023efcb18e35cf16cc9b4df6b6045d86e8bda6.svg';
const imgMiniDivider = '/figma-assets/cc9419692a4be4709cfc03d50a67eb67d9795b7c.svg';
const imgPlus = '/figma-assets/372e303eb5c2cc92b7991cc3222919df812e0f86.svg';
const imgLine = '/figma-assets/98f5fcaded7840d5043a963b68149d03ba9aef43.svg';
const imgRibbonBow = '/figma-assets/4b272eaf692874269c4fc3830231dc75075f4a49.svg';
const imgShoppingBag = '/figma-assets/8aab77e6404936a9df121d7028258a27c83ee8b7.svg';
const imgChevronRight = '/figma-assets/5a90fe9bea2a729fe052c18fc63a5946fc2bc133.svg';
const imgHeart = '/figma-assets/666f88cde482e4924187a9e44c22afac92ead2fc.svg';
const imgCreditCard = '/figma-assets/93c735a6726e1385305c37d890bb134159ac4817.svg';
const imgBell = '/figma-assets/5be2e4c78425e4ce3b10754cf32267c2683efb67.svg';
const imgHelpCircle = '/figma-assets/60e62dcce9cd785dd34a9a3edf90e3d426f40e0b.svg';

interface SavedAddress {
  id: string;
  label: string;
  address: string;
  isDefault?: boolean;
}

export default function Profile() {
  const { currentUser, userProfile, updateUserProfileData, logout, isAdmin } = useAuth();
  const { orders } = useContent();
  const navigate = useNavigate();

  const myOrders = useMemo(() => {
    if (!currentUser) return [];
    return orders.filter(
      (o) =>
        (o.userId && o.userId === currentUser.uid) ||
        (o.userEmail && o.userEmail.toLowerCase() === currentUser.email?.toLowerCase())
    );
  }, [orders, currentUser]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState('Ananya Sharma');
  const [profilePhone, setProfilePhone] = useState('+91 98765 43210');
  const [savingProfile, setSavingProfile] = useState(false);

  const [addresses, setAddresses] = useState<SavedAddress[]>([
    {
      id: 'addr-1',
      label: 'Home',
      address: '42, Rose Garden Lane, Koramangala, Bangalore, Karnataka - 560034',
      isDefault: true,
    },
    {
      id: 'addr-2',
      label: 'Office',
      address: '5th Floor, Lotus Tower, MG Road, Bangalore, Karnataka - 560001',
      isDefault: false,
    },
  ]);

  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [newAddressStr, setNewAddressStr] = useState('');

  // Sync state with current authenticated user
  useEffect(() => {
    if (currentUser) {
      if (userProfile?.name || currentUser.displayName) {
        setProfileName(userProfile?.name || currentUser.displayName || '');
      }
      if (userProfile?.phone) {
        setProfilePhone(userProfile.phone);
      }
    }
  }, [currentUser, userProfile]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateUserProfileData({
        name: profileName,
        phone: profilePhone,
      });
      setIsEditing(false);
    } catch (err: any) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleCreateAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddressStr) return;
    const newId = `addr-${Date.now()}`;
    setAddresses((prev) => [
      ...prev,
      {
        id: newId,
        label: newLabel,
        address: newAddressStr,
        isDefault: prev.length === 0,
      },
    ]);
    setNewAddressStr('');
    setShowAddAddressModal(false);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-5 px-4 sm:px-6 pb-28 relative bg-[#fdfbf7]"
      style={{
        backgroundColor: '#fdfbf7',
      }}
      data-node-id="9:341"
      data-name="petalisse-profile"
    >
      {/* Central Paper Panel */}
      <main
        className="w-full max-w-[430px] rounded-[24px] shadow-[0px_8px_28px_rgba(44,62,80,0.14)] px-4 sm:px-5 py-6 relative flex flex-col gap-7 items-stretch overflow-visible border border-[rgba(107,26,42,0.06)] bg-[#84c9f13a]"
        style={{
          backgroundColor: '#84c9f13a',
        }}
        data-node-id="9:342"
        data-name="paper-center-panel"
      >
        {/* Flourish: Top Left */}
        <div
          className="absolute -top-1.5 -left-1.5 opacity-85 size-6 pointer-events-none z-10"
          data-node-id="9:343"
          data-name="corner-flourish"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Top Right */}
        <div
          className="absolute -top-1.5 -right-1.5 opacity-85 size-6 rotate-90 pointer-events-none z-10"
          data-node-id="9:346"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Bottom Left */}
        <div
          className="absolute -bottom-1.5 -left-1.5 opacity-85 size-6 rotate-180 pointer-events-none z-10"
          data-node-id="9:349"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Bottom Right */}
        <div
          className="absolute -bottom-1.5 -right-1.5 opacity-85 size-6 -rotate-90 pointer-events-none z-10"
          data-node-id="9:352"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* ── TOP NAVBAR ── */}
        <header
          className="border-b border-[#6b1a2a]/10 pb-3 flex items-center justify-between w-full"
          data-node-id="9:355"
          data-name="top-navbar"
        >
          <Link
            to="/shop"
            className="bg-[#f9d5e5] rounded-[12px] p-2 flex items-center justify-center hover:bg-[#f3bed3] active:scale-95 transition-all shadow-xs"
            data-node-id="9:356"
            data-name="nav-back-button"
            aria-label="Back to shop"
          >
            <img alt="Back" className="size-3.5 block" src={imgChevronLeft} />
          </Link>

          <h1
            className="font-parisienne text-[#6b1a2a] text-[32px] leading-none"
            data-node-id="9:359"
          >
            My Account
          </h1>

          <button
            onClick={() => {
              if (currentUser) {
                setIsEditing(!isEditing);
              } else {
                setAuthModalOpen(true);
              }
            }}
            className="bg-[#f9d5e5] rounded-[12px] p-2 flex items-center justify-center hover:bg-[#f3bed3] active:scale-95 transition-all shadow-xs cursor-pointer"
            data-node-id="9:360"
            data-name="nav-settings-button"
            aria-label="Settings"
          >
            <img alt="Settings" className="size-3.5 block" src={imgSettings} />
          </button>
        </header>

        {/* NOT LOGGED IN STATE */}
        {!currentUser ? (
          <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8E0D5] p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#f9d5e5] flex items-center justify-center mx-auto text-[#6b1a2a]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="font-cormorant font-bold text-[#6b1a2a] text-xl">Sign in to Petalisse</h2>
              <p className="font-cormorant text-[#8b827d] text-sm mt-1">
                Access your orders, saved addresses, and small-batch charm favorites.
              </p>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3 rounded-full bg-[#6b1a2a] text-white font-cormorant font-bold text-sm tracking-wider uppercase hover:bg-[#50131f] transition cursor-pointer shadow-sm"
            >
              Sign In or Create Account
            </button>
            <div className="pt-2">
              <Link to="/admin" className="text-xs text-[#8b827d] hover:text-[#6b1a2a] underline">
                Administrator? Access Admin Portal &rarr;
              </Link>
            </div>
          </div>
        ) : (
          /* LOGGED IN USER PROFILE */
          <>
            {/* ── PROFILE HEADER SECTION ── */}
            <section
              className="flex flex-col gap-3 items-center w-full text-center"
              data-node-id="9:363"
              data-name="profile-header-section"
            >
              {/* Avatar with Pink Border */}
              <div
                className="bg-[#f9d5e5] p-1 rounded-full shadow-xs"
                data-node-id="9:364"
                data-name="avatar-border"
              >
                <div
                  className="size-[88px] rounded-full overflow-hidden"
                  data-node-id="9:365"
                  data-name="profile-avatar"
                >
                  <img
                    alt="Profile Avatar"
                    className="size-full object-cover"
                    src={imgProfileAvatar}
                  />
                </div>
              </div>

              {/* Name & Email */}
              <div
                className="flex flex-col gap-1 items-center w-full"
                data-node-id="9:366"
                data-name="profile-meta"
              >
                {isEditing ? (
                  <div className="flex flex-col gap-2 items-center w-full max-w-xs">
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full font-cormorant font-bold text-[#6b1a2a] text-lg text-center border-b border-[#6b1a2a] outline-none px-2 py-1 bg-transparent"
                    />
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="Phone Number"
                      className="w-full font-cormorant text-[#8b827d] text-sm text-center border-b border-[#6b1a2a]/40 outline-none px-2 py-1 bg-transparent"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="text-xs bg-[#6b1a2a] text-white px-4 py-1.5 rounded-full font-medium hover:bg-[#50131f] cursor-pointer"
                      >
                        {savingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-xs border border-[#8b827d] text-[#8b827d] px-3 py-1.5 rounded-full hover:bg-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2
                      className="font-cormorant font-bold text-[#6b1a2a] text-[22px] leading-tight"
                      data-node-id="9:367"
                    >
                      {profileName || 'Boutique Patron'}
                    </h2>
                    <p
                      className="font-cormorant text-[#8b827d] text-[14px]"
                      data-node-id="9:368"
                    >
                      {currentUser.email}
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="font-cormorant font-semibold text-[#6b1a2a] text-[14px] underline hover:opacity-80 transition-opacity cursor-pointer mt-0.5"
                      data-node-id="9:370"
                    >
                      Edit Profile
                    </button>
                  </>
                )}
              </div>
            </section>

            {/* If user is an approved admin, show quick shortcut banner */}
            {isAdmin && (
              <div className="p-3.5 rounded-2xl bg-[#FAF0ED] border border-[#E8C5B8] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#9E3E2B] uppercase tracking-wider">
                    Admin Privileges Active
                  </div>
                  <div className="text-[11px] text-[#6B5F55]">Manage products & visual copy</div>
                </div>
                <Link
                  to="/admin"
                  className="px-3 py-1.5 rounded-lg bg-[#8E5B59] text-white text-xs font-medium hover:bg-[#784A48] transition"
                >
                  Open Admin &rarr;
                </Link>
              </div>
            )}

            {/* ── ACCOUNT DETAILS CARD ── */}
            <section
              className="bg-white border border-[rgba(107,26,42,0.1)] rounded-[20px] p-[18px] shadow-[0px_4px_6px_rgba(44,62,80,0.06)] flex flex-col gap-1.5 w-full text-left"
              data-node-id="9:371"
              data-name="account-details-card"
            >
              {/* Phone */}
              <div
                className="border-b border-[rgba(107,26,42,0.1)] py-2 flex items-center justify-between"
                data-node-id="9:372"
                data-name="detail-row"
              >
                <span className="font-cormorant text-[#8b827d] text-[15px]">Phone</span>
                <span className="font-cormorant font-semibold text-[#6b1a2a] text-[16px]">
                  {profilePhone || 'Not provided'}
                </span>
              </div>

              {/* Email */}
              <div
                className="border-b border-[rgba(107,26,42,0.1)] py-2 flex items-center justify-between"
                data-name="detail-row"
              >
                <span className="font-cormorant text-[#8b827d] text-[15px]">Account Email</span>
                <span className="font-cormorant font-semibold text-[#6b1a2a] text-[15px] truncate max-w-[200px]">
                  {currentUser.email}
                </span>
              </div>

              {/* Member Since */}
              <div
                className="border-b border-[rgba(107,26,42,0.1)] py-2 flex items-center justify-between"
                data-node-id="9:375"
                data-name="detail-row"
              >
                <span className="font-cormorant text-[#8b827d] text-[15px]">Member Since</span>
                <span className="font-cormorant font-semibold text-[#6b1a2a] text-[16px]">
                  {currentUser.metadata.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '2024'}
                </span>
              </div>

              {/* Wishlist Saves */}
              <div
                className="py-2 flex items-center justify-between"
                data-node-id="9:381"
                data-name="detail-row"
              >
                <span className="font-cormorant text-[#8b827d] text-[15px]">Wishlist Saves</span>
                <span className="font-cormorant font-semibold text-[#6b1a2a] text-[16px]">
                  Handmade Charms
                </span>
              </div>
            </section>

            {/* ── SAVED ADDRESSES SECTION ── */}
            <section className="flex flex-col gap-3.5 w-full">
              {/* Header */}
              <div
                className="flex flex-col gap-1 items-center text-center w-full"
                data-node-id="9:384"
                data-name="addresses-heading-container"
              >
                <h3
                  className="font-parisienne text-[#6b1a2a] text-[28px] leading-tight"
                  data-node-id="9:385"
                >
                  Saved Addresses
                </h3>
                <div className="h-2 w-24 relative flex items-center justify-center">
                  <img alt="" className="h-full w-auto block" src={imgMiniDivider} />
                </div>
              </div>

              {/* Addresses Stack */}
              <div
                className="flex flex-col gap-3.5 w-full"
                data-node-id="9:390"
                data-name="addresses-stack"
              >
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className="bg-white border border-[#6b1a2a] rounded-[16px] p-4 flex flex-col gap-3 w-full shadow-xs text-left"
                    data-name="address-card"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-cormorant font-bold text-[#6b1a2a] text-[18px]">
                        {addr.label}
                      </span>
                      {addr.isDefault && (
                        <span
                          className="bg-[#f9d5e5] text-[#6b1a2a] font-cormorant font-bold text-[11px] px-2.5 py-0.5 rounded-[10px] uppercase tracking-wider"
                          data-name="default-badge"
                        >
                          DEFAULT
                        </span>
                      )}
                    </div>

                    <p className="font-cormorant text-[#8b827d] text-[14px] leading-[1.4]">
                      {addr.address}
                    </p>

                    <div className="flex gap-3.5 justify-end font-cormorant font-semibold text-[#6b1a2a] text-[14px]">
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="underline hover:text-[#c82333] transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Address Form Modal / Toggle */}
              {showAddAddressModal ? (
                <form onSubmit={handleCreateAddress} className="bg-white border border-[#6b1a2a]/30 rounded-[16px] p-4 space-y-3">
                  <div className="font-cormorant font-bold text-[#6b1a2a] text-base">Add New Address</div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#786F66] mb-1">Address Label</label>
                    <input
                      type="text"
                      required
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      placeholder="Home, Studio, Office..."
                      className="w-full px-3 py-1.5 rounded-lg border border-[#DED5C9] text-xs font-serif"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#786F66] mb-1">Full Street Address</label>
                    <textarea
                      rows={2}
                      required
                      value={newAddressStr}
                      onChange={(e) => setNewAddressStr(e.target.value)}
                      placeholder="House/Apartment number, Street, City, State, PIN"
                      className="w-full px-3 py-1.5 rounded-lg border border-[#DED5C9] text-xs font-serif"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAddAddressModal(false)}
                      className="px-3 py-1 text-xs text-[#8b827d]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-full bg-[#6b1a2a] text-white text-xs font-medium"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddAddressModal(true)}
                  className="bg-white border-[#6b1a2a] border-[1.5px] border-dashed rounded-full py-3.5 px-4 flex items-center justify-center gap-1.5 text-[#6b1a2a] font-cormorant font-bold text-base hover:bg-[#faf5f0] transition-colors cursor-pointer w-full"
                  data-node-id="9:407"
                  data-name="add-address-button"
                >
                  <img alt="" className="size-3.5 block" src={imgPlus} />
                  <span>Add New Address</span>
                </button>
              )}
            </section>

            {/* ── MY RECENT ORDERS (SYNCED WITH DB) ── */}
            <section className="flex flex-col gap-3 w-full text-left">
              <div className="flex items-center justify-between">
                <h3 className="font-parisienne text-[#6b1a2a] text-[28px] leading-tight">
                  My Orders ({myOrders.length})
                </h3>
                <span className="text-[11px] font-sans text-[#8b827d]">
                  Live Synchronized
                </span>
              </div>

              {myOrders.length === 0 ? (
                <div className="bg-white border border-[rgba(107,26,42,0.1)] rounded-[20px] p-5 text-center shadow-xs">
                  <p className="font-cormorant text-[#8b827d] text-sm">
                    No orders placed yet. Explore our handcrafted charm collection!
                  </p>
                  <Link
                    to="/shop"
                    className="inline-block mt-3 px-5 py-2 rounded-full bg-[#6b1a2a] text-white text-xs font-cormorant font-bold uppercase tracking-wider hover:bg-[#50131f] transition"
                  >
                    Start Shopping &rarr;
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white border border-[rgba(107,26,42,0.12)] rounded-[20px] p-4 shadow-xs space-y-2.5"
                    >
                      <div className="flex justify-between items-center text-xs pb-2 border-b border-[#FAF0ED]">
                        <div>
                          <span className="font-mono font-bold text-[#6b1a2a]">
                            {ord.orderNumber || `#${ord.id?.slice(-6).toUpperCase()}`}
                          </span>
                          <span className="text-[#8b827d] text-[11px] ml-2">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#f9d5e5] text-[#6b1a2a]">
                          {ord.status}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-1">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-[#2C2724]">
                            <span>
                              {item.name} {item.selectedColor ? `(${item.selectedColor})` : ''} × {item.quantity}
                            </span>
                            <span className="font-semibold">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Financial info */}
                      <div className="pt-2 border-t border-[#FAF0ED] flex justify-between items-center text-xs">
                        <span className="text-[11px] text-[#8b827d]">
                          {ord.paymentMethod === 'partial_cod' ? 'Partial COD' : 'Online Paid'} • Shipping:{' '}
                          {ord.shippingFee === 0 ? 'FREE' : `₹${ord.shippingFee}`}
                        </span>
                        <span className="font-sans font-bold text-[#6b1a2a] text-sm">
                          Total: ₹{ord.total}
                        </span>
                      </div>

                      {ord.paymentMethod === 'partial_cod' && (
                        <div className="text-[11px] bg-amber-50 p-2 rounded-lg text-amber-900 border border-amber-200/60 flex justify-between">
                          <span>Paid: ₹{ord.amountPaid}</span>
                          <span>Due on delivery: ₹{ord.codAmountDue}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── QUICK ACTIONS LIST ── */}
            <section
              className="bg-white border border-[rgba(107,26,42,0.1)] rounded-[20px] overflow-hidden shadow-[0px_4px_6px_rgba(44,62,80,0.06)] flex flex-col w-full"
              data-node-id="9:411"
              data-name="quick-actions-card"
            >
              {/* Order History */}
              <Link
                to="/cart"
                className="p-4 flex items-center justify-between border-b border-[rgba(107,26,42,0.08)] hover:bg-[#faf5f0] transition-colors"
                data-node-id="9:412"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-[#f9d5e5] flex items-center justify-center">
                    <img alt="" className="size-4 block" src={imgShoppingBag} />
                  </div>
                  <span className="font-cormorant font-semibold text-[#6b1a2a] text-[16px]">
                    My Orders & Cart
                  </span>
                </div>
                <img alt="" className="size-3.5 opacity-50 block" src={imgChevronRight} />
              </Link>

              {/* Wishlist */}
              <Link
                to="/shop"
                className="p-4 flex items-center justify-between border-b border-[rgba(107,26,42,0.08)] hover:bg-[#faf5f0] transition-colors"
                data-node-id="9:420"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-[#f9d5e5] flex items-center justify-center">
                    <img alt="" className="size-4 block" src={imgHeart} />
                  </div>
                  <span className="font-cormorant font-semibold text-[#6b1a2a] text-[16px]">
                    Explore Charm Shop
                  </span>
                </div>
                <img alt="" className="size-3.5 opacity-50 block" src={imgChevronRight} />
              </Link>

              {/* Help & Support */}
              <div
                className="p-4 flex items-center justify-between hover:bg-[#faf5f0] transition-colors cursor-pointer"
                data-node-id="9:444"
                onClick={() => alert('For order inquiries, contact support@petalisse.com')}
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-[#f9d5e5] flex items-center justify-center">
                    <img alt="" className="size-4 block" src={imgHelpCircle} />
                  </div>
                  <span className="font-cormorant font-semibold text-[#6b1a2a] text-[16px]">
                    Customer Care & FAQs
                  </span>
                </div>
                <img alt="" className="size-3.5 opacity-50 block" src={imgChevronRight} />
              </div>
            </section>

            {/* Logout Button */}
            <div className="pt-2">
              <button
                onClick={() => logout()}
                className="w-full py-3 rounded-full border border-[#9E3E2B] text-[#9E3E2B] font-cormorant font-bold text-sm uppercase tracking-wider hover:bg-[#FAF0ED] transition cursor-pointer"
              >
                Sign Out of Account
              </button>
            </div>
          </>
        )}

        {/* ── FOOTER FLOURISH ── */}
        <footer className="pt-2 flex flex-col gap-2 items-center text-center">
          <div className="h-4 w-16 relative flex items-center justify-center opacity-70">
            <img alt="" className="h-full w-auto block" src={imgRibbonBow} />
          </div>
          <p className="font-cormorant text-[#8b827d] text-xs">
            © Petalisse 2024. Handcrafted in our studio.
          </p>
        </footer>
      </main>

      {/* Customer Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
