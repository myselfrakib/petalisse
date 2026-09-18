import { useState } from 'react';
import { Link } from 'react-router';

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

interface Address {
  id: string;
  label: string;
  address: string;
  isDefault?: boolean;
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profileName, setProfileName] = useState('Ananya Sharma');
  const [profileEmail, setProfileEmail] = useState('ananya.sharma@email.com');
  const [profilePhone, setProfilePhone] = useState('+91 98765 43210');

  const [addresses, setAddresses] = useState<Address[]>([
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

  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddAddress = () => {
    const newId = `addr-${Date.now()}`;
    setAddresses((prev) => [
      ...prev,
      {
        id: newId,
        label: 'Studio',
        address: '18, Lavender Avenue, Indiranagar, Bangalore, Karnataka - 560038',
        isDefault: false,
      },
    ]);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-5 px-4 sm:px-6 pb-28 relative bg-repeat"
      style={{
        backgroundImage: `url("${imgGinghamBg}")`,
        backgroundSize: '153.6px 153.6px',
      }}
      data-node-id="9:341"
      data-name="petalisse-profile"
    >
      {/* Central Paper Panel */}
      <main
        className="w-full max-w-[430px] bg-[#fdfbf7] rounded-[24px] shadow-[0px_8px_28px_rgba(44,62,80,0.14)] px-4 sm:px-5 py-6 relative flex flex-col gap-7 items-stretch overflow-visible border border-[rgba(107,26,42,0.06)]"
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
            onClick={() => setIsEditing(!isEditing)}
            className="bg-[#f9d5e5] rounded-[12px] p-2 flex items-center justify-center hover:bg-[#f3bed3] active:scale-95 transition-all shadow-xs cursor-pointer"
            data-node-id="9:360"
            data-name="nav-settings-button"
            aria-label="Settings"
          >
            <img alt="Settings" className="size-3.5 block" src={imgSettings} />
          </button>
        </header>

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
            className="flex flex-col gap-1 items-center"
            data-node-id="9:366"
            data-name="profile-meta"
          >
            {isEditing ? (
              <div className="flex flex-col gap-2 items-center">
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="font-cormorant font-bold text-[#6b1a2a] text-xl text-center border-b border-[#6b1a2a] outline-none px-2"
                />
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="font-cormorant text-[#8b827d] text-sm text-center border-b border-[#6b1a2a]/40 outline-none px-2"
                />
                <button
                  onClick={() => setIsEditing(false)}
                  className="mt-1 text-xs bg-[#6b1a2a] text-white px-3 py-1 rounded-full"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2
                  className="font-cormorant font-bold text-[#6b1a2a] text-[22px] leading-tight"
                  data-node-id="9:367"
                >
                  {profileName}
                </h2>
                <p
                  className="font-cormorant text-[#8b827d] text-[14px]"
                  data-node-id="9:368"
                >
                  {profileEmail}
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
              {profilePhone}
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
              March 2024
            </span>
          </div>

          {/* Orders Completed */}
          <div
            className="border-b border-[rgba(107,26,42,0.1)] py-2 flex items-center justify-between"
            data-node-id="9:378"
            data-name="detail-row"
          >
            <span className="font-cormorant text-[#8b827d] text-[15px]">Orders Completed</span>
            <span className="font-cormorant font-semibold text-[#6b1a2a] text-[16px]">
              12 orders
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
              8 items
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
                    onClick={() => setActiveModal(`Editing ${addr.label}`)}
                    className="underline hover:opacity-75 transition-opacity cursor-pointer"
                  >
                    Edit
                  </button>
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

          {/* Add New Address Button */}
          <button
            onClick={handleAddAddress}
            className="bg-white border-[#6b1a2a] border-[1.5px] border-dashed rounded-full py-3.5 px-4 flex items-center justify-center gap-1.5 text-[#6b1a2a] font-cormorant font-bold text-base hover:bg-[#faf5f0] transition-colors cursor-pointer w-full"
            data-node-id="9:407"
            data-name="add-address-button"
          >
            <img alt="" className="size-3.5 block" src={imgPlus} />
            <span>Add New Address</span>
          </button>
        </section>

        {/* ── BOW DIVIDER ── */}
        <div
          className="flex items-center justify-center gap-2 w-full py-1 opacity-80"
          data-node-id="9:411"
          data-name="bow-divider-row"
        >
          <div className="h-px flex-1">
            <img alt="" className="w-full h-auto block" src={imgLine} />
          </div>
          <div className="size-4 shrink-0 flex items-center justify-center">
            <img alt="" className="size-full block" src={imgRibbonBow} />
          </div>
          <div className="h-px flex-1">
            <img alt="" className="w-full h-auto block" src={imgLine} />
          </div>
        </div>

        {/* ── QUICK LINKS SECTION ── */}
        <section
          className="flex flex-col w-full text-left"
          data-node-id="9:416"
          data-name="quick-links-section"
        >
          {[
            { label: 'Order History', icon: imgShoppingBag, link: '/shop' },
            { label: 'My Wishlist', icon: imgHeart, link: '/shop' },
            { label: 'Payment Methods', icon: imgCreditCard, link: '/cart' },
            { label: 'Notifications', icon: imgBell, link: '#' },
            { label: 'Help & Support', icon: imgHelpCircle, link: '#' },
          ].map((item, idx) => (
            <Link
              key={idx}
              to={item.link}
              className="border-b border-[rgba(107,26,42,0.1)] py-3 flex items-center justify-between group hover:bg-[#faf5f0]/50 transition-colors px-1"
              data-name="quick-link-row"
            >
              <div className="flex items-center gap-3">
                <div
                  className="bg-[#f9d5e5] rounded-[8px] size-7 flex items-center justify-center shrink-0"
                  data-name="icon-container"
                >
                  <img alt="" className="size-3.5 block" src={item.icon} />
                </div>
                <span className="font-cormorant font-semibold text-[#6b1a2a] text-[16px] group-hover:underline">
                  {item.label}
                </span>
              </div>
              <img alt="" className="size-3.5 block opacity-60" src={imgChevronRight} />
            </Link>
          ))}
        </section>

        {/* ── LOGOUT BUTTON ── */}
        <button
          onClick={() => setActiveModal('Logged out successfully!')}
          className="bg-[#f9d5e5] hover:bg-[#f3bed3] active:scale-98 text-[#6b1a2a] font-cormorant font-bold text-base uppercase tracking-wider py-3.5 px-9 rounded-full transition-all cursor-pointer shadow-xs w-full"
          data-node-id="9:447"
          data-name="logout-button"
        >
          Log Out
        </button>

        {/* ── FOOTER SECTION ── */}
        <footer
          className="border-t border-[rgba(107,26,42,0.1)] pt-6 flex flex-col gap-4 items-center text-center w-full"
          data-node-id="9:449"
          data-name="footer-section"
        >
          <div className="flex flex-col gap-1 items-center" data-name="footer-brand">
            <h4 className="font-parisienne text-[#6b1a2a] text-[34px] leading-none">
              Petalisse
            </h4>
            <p className="font-cormorant text-[#8b827d] text-[15px]">
              Your little handmade corner
            </p>
          </div>

          <div className="flex flex-col gap-1 items-center" data-name="footer-bottom">
            <p className="font-cormorant font-bold text-[#6b1a2a] text-[13px] uppercase tracking-wider">
              SMALL DETAILS. BIG PERSONALITY.
            </p>
            <p className="font-cormorant text-[#8b827d] text-xs">
              © 2024 Petalisse. All rights reserved.
            </p>
          </div>
        </footer>
      </main>

      {/* Interactive Modal Toast */}
      {activeModal && (
        <div className="fixed bottom-24 z-50 bg-[#6b1a2a] text-white px-5 py-2.5 rounded-full font-cormorant font-bold text-sm shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-200">
          {activeModal}
          <button
            onClick={() => setActiveModal(null)}
            className="ml-3 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
