import { useState } from 'react';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext';

const imgGinghamBg = '/figma-assets/772e8e7b4c0d39ad6752261452ccca607e718dc3.png';
const imgCircleX = '/figma-assets/020e894ad6dbaa5c1e3c88736940d78054819b79.svg';
const imgChevronLeft = '/figma-assets/a9ed62056d32eaca4682db0b3be7e08d78983400.svg';
const imgShoppingBag = '/figma-assets/c0a9184bb0018ada313c0983e0b8eacc37091194.svg';
const imgXCircle = '/figma-assets/cf54c1777967904b46c130fd6899a0c8a75fc015.svg';
const imgLine = '/figma-assets/517bc7baba824d13ad91f42856bf10b6d75c407e.svg';
const imgRibbonBow = '/figma-assets/c17b250678e032af9de42877174cc7812bd92c8c.svg';
const imgLine1 = '/figma-assets/20bf8e0265d182c607e4c78d452dfc8562b9817e.svg';
const imgHeart = '/figma-assets/d3d3b0328e7b2065e2dd6237087ca61044311cfd.svg';
const imgInstagram = '/figma-assets/61242fa42cf1591147b709b00c26b1201880564e.svg';
const imgMusic = '/figma-assets/76abb4ffe21c8d67bea7f7daf70db2330cc66a88.svg';
const imgCircleX1 = '/figma-assets/bcd9a84b032010459db4a52a7f22c54922a3c2d4.svg';

export default function Cart() {
  const { items, remove, update, total, count, clear } = useCart();
  const [promoCode, setPromoCode] = useState('PETALISSE10');
  const [promoApplied, setPromoApplied] = useState(true);
  const [promoMessage, setPromoMessage] = useState('10% off applied!');
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Form fields matching Figma design
  const [fullName, setFullName] = useState('Clara Avery');
  const [address, setAddress] = useState('123 Cozy Lane');
  const [city, setCity] = useState('Floral Town');
  const [phone, setPhone] = useState('(555) 019-2831');

  // Discount calculation
  const discountAmount = promoApplied ? total * 0.1 : 0;
  const isFreeShipping = total >= 35 || total === 0;
  const shippingCost = isFreeShipping ? 0 : 5;
  const finalTotal = Math.max(0, total - discountAmount + shippingCost);

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setPromoApplied(false);
      setPromoMessage('');
      return;
    }
    setPromoApplied(true);
    setPromoMessage('10% discount applied!');
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
  };

  const handleResetOrder = () => {
    clear();
    setOrderPlaced(false);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start py-5 px-4 sm:px-6 pb-28 relative bg-repeat"
      style={{
        backgroundImage: `url("${imgGinghamBg}")`,
        backgroundSize: '153.6px 153.6px',
      }}
      data-node-id="9:4"
      data-name="petalisse-checkout"
    >
      {/* Central Paper Panel */}
      <main
        className="w-full max-w-[430px] bg-[#fdfbf7] rounded-[24px] shadow-[0px_8px_28px_rgba(44,62,80,0.14)] px-4 sm:px-5 py-6 relative flex flex-col gap-7 items-stretch overflow-visible border border-[rgba(107,26,42,0.06)]"
        data-node-id="9:5"
        data-name="paper-center-panel"
      >
        {/* Flourish: Top Left */}
        <div
          className="absolute -top-1.5 -left-1.5 opacity-85 size-6 pointer-events-none z-10"
          data-node-id="9:6"
          data-name="flourish-top-left"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Top Right */}
        <div
          className="absolute -top-1.5 -right-1.5 opacity-85 size-6 rotate-90 pointer-events-none z-10"
          data-node-id="9:9"
          data-name="flourish-top-right"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Bottom Left */}
        <div
          className="absolute -bottom-1.5 -left-1.5 opacity-85 size-6 rotate-180 pointer-events-none z-10"
          data-node-id="9:12"
          data-name="flourish-bottom-left"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* Flourish: Bottom Right */}
        <div
          className="absolute -bottom-1.5 -right-1.5 opacity-85 size-6 -rotate-90 pointer-events-none z-10"
          data-node-id="9:15"
          data-name="flourish-bottom-right"
        >
          <img alt="" className="size-full block" src={imgCircleX} />
        </div>

        {/* ── TOP NAVBAR ── */}
        <header
          className="border-b border-[#6b1a2a]/10 pb-3 flex items-center justify-between w-full"
          data-node-id="9:18"
          data-name="top-navbar"
        >
          <Link
            to="/shop"
            className="bg-[#f9d5e5] rounded-[12px] p-2 flex items-center justify-center hover:bg-[#f3bed3] active:scale-95 transition-all shadow-xs"
            data-node-id="9:19"
            data-name="nav-back-button"
            aria-label="Back to shop"
          >
            <img alt="Back" className="size-3.5 block" src={imgChevronLeft} />
          </Link>

          <h1
            className="font-parisienne text-[#6b1a2a] text-[32px] leading-none"
            data-node-id="9:22"
          >
            Your Cart
          </h1>

          <div
            className="relative bg-[#f9d5e5] rounded-[12px] p-2 flex items-center justify-center shadow-xs"
            data-node-id="9:23"
            data-name="nav-cart-button"
          >
            <img alt="Cart" className="size-3.5 block" src={imgShoppingBag} />
            {count > 0 && (
              <span
                className="absolute -top-1 -right-1 bg-[#c82333] text-white text-[9px] font-sans font-bold px-1.5 py-0.2 rounded-full leading-none"
                data-node-id="9:26"
              >
                {count}
              </span>
            )}
          </div>
        </header>

        {/* ── CART ITEMS SECTION ── */}
        <section
          className="flex flex-col gap-3.5 w-full"
          data-node-id="9:28"
          data-name="cart-items-section"
        >
          {items.length === 0 ? (
            <div className="py-8 text-center flex flex-col items-center gap-3">
              <p className="font-parisienne text-[#6b1a2a] text-3xl">Your cart is empty</p>
              <p className="font-cormorant text-[#8b827d] text-sm">
                Discover our handcrafted creations and add your favorites.
              </p>
              <Link
                to="/shop"
                className="mt-2 inline-block bg-[#6b1a2a] text-white font-cormorant font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full"
              >
                Explore Shop
              </Link>
            </div>
          ) : (
            items.map(({ product: p, quantity }) => (
              <div
                key={p.id}
                className="bg-white border border-[rgba(107,26,42,0.1)] rounded-[16px] p-3 flex gap-3 items-center w-full shadow-xs"
                data-name="cart-item"
              >
                <Link to={`/product/${p.id}`} className="size-20 rounded-[12px] overflow-hidden shrink-0">
                  <img
                    alt={p.name}
                    src={p.img}
                    className="size-full object-cover"
                  />
                </Link>

                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={`/product/${p.id}`}
                      className="font-cormorant font-bold text-[#6b1a2a] text-[16px] truncate hover:underline"
                    >
                      {p.name}
                    </Link>
                    <button
                      onClick={() => remove(p.id)}
                      className="p-1 text-[#8b827d] hover:text-[#c82333] transition-colors cursor-pointer"
                      title="Remove item"
                      data-name="remove-btn"
                    >
                      <img alt="Remove" className="size-2.5 block" src={imgXCircle} />
                    </button>
                  </div>

                  <p className="font-cormorant text-[#8b827d] text-[13px] leading-[1.3] line-clamp-2">
                    {p.description}
                  </p>

                  <div className="flex items-center justify-between mt-1">
                    {/* Quantity Selector Pill */}
                    <div
                      className="bg-[#fdfbf7] border border-[rgba(107,26,42,0.1)] rounded-full px-2.5 py-0.5 flex items-center gap-2.5 font-cormorant font-bold text-[#6b1a2a]"
                      data-name="qty-selector"
                    >
                      <button
                        onClick={() => update(p.id, quantity - 1)}
                        className="text-xs hover:opacity-75 transition-opacity cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        —
                      </button>
                      <span className="text-[13px] font-sans font-bold">{quantity}</span>
                      <button
                        onClick={() => update(p.id, quantity + 1)}
                        className="text-xs hover:opacity-75 transition-opacity cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    <span className="font-sans font-bold text-[#6b1a2a] text-[15px]">
                      ₹{p.price * quantity}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {/* ── PROMO CODE SECTION ── */}
        <section
          className="flex flex-col gap-1.5 w-full"
          data-node-id="9:71"
          data-name="promo-section"
        >
          <div className="flex gap-2 items-center w-full" data-name="promo-row">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code"
              className="bg-white border border-[rgba(107,26,42,0.1)] rounded-full px-4 py-2.5 flex-1 font-cormorant text-sm text-ink placeholder-[#8b827d] outline-none focus:border-[#6b1a2a] transition-colors"
              data-name="promo-input"
            />
            <button
              onClick={handleApplyPromo}
              className="bg-[#6b1a2a] hover:bg-[#50131f] active:scale-95 text-white font-cormorant font-bold uppercase text-[13px] tracking-wider px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-xs"
              data-name="apply-button"
            >
              Apply
            </button>
          </div>
          {promoMessage && (
            <p className="text-[11px] font-cormorant text-[#e28fa9] font-semibold pl-3">
              ✓ {promoMessage}
            </p>
          )}
        </section>

        {/* ── SHIPPING DETAILS SECTION ── */}
        <section
          className="flex flex-col gap-4 w-full"
          data-node-id="9:96"
          data-name="shipping-section"
        >
          {/* Section Divider Header */}
          <div className="flex items-center justify-between w-full" data-name="Frame">
            <div className="h-px flex-1 max-w-[60px] opacity-70">
              <img alt="" className="w-full h-auto block" src={imgLine} />
            </div>
            <h2
              className="font-parisienne text-[#6b1a2a] text-[34px] leading-none px-2 text-center"
              data-node-id="9:99"
            >
              Shipping Details
            </h2>
            <div className="h-px flex-1 max-w-[60px] opacity-70">
              <img alt="" className="w-full h-auto block" src={imgLine} />
            </div>
          </div>

          {/* Form Fields */}
          <div className="flex flex-col gap-3 w-full">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="font-cormorant font-semibold text-[#6b1a2a] text-[13px] uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Clara Avery"
                className="bg-white border border-[rgba(107,26,42,0.1)] rounded-full px-4 py-3 font-cormorant text-sm text-ink placeholder-[#8b827d] outline-none focus:border-[#6b1a2a] transition-colors"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1.5 w-full">
              <label className="font-cormorant font-semibold text-[#6b1a2a] text-[13px] uppercase tracking-wider">
                Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Cozy Lane"
                className="bg-white border border-[rgba(107,26,42,0.1)] rounded-full px-4 py-3 font-cormorant text-sm text-ink placeholder-[#8b827d] outline-none focus:border-[#6b1a2a] transition-colors"
              />
            </div>

            {/* City & Phone */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="flex flex-col gap-1.5">
                <label className="font-cormorant font-semibold text-[#6b1a2a] text-[13px] uppercase tracking-wider">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Floral Town"
                  className="bg-white border border-[rgba(107,26,42,0.1)] rounded-full px-4 py-3 font-cormorant text-sm text-ink placeholder-[#8b827d] outline-none focus:border-[#6b1a2a] transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-cormorant font-semibold text-[#6b1a2a] text-[13px] uppercase tracking-wider">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 019-2831"
                  className="bg-white border border-[rgba(107,26,42,0.1)] rounded-full px-4 py-3 font-cormorant text-sm text-ink placeholder-[#8b827d] outline-none focus:border-[#6b1a2a] transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── ORDER SUMMARY SECTION ── */}
        <section
          className="bg-[rgba(107,26,42,0.05)] border border-[rgba(107,26,42,0.1)] rounded-[20px] p-4 flex flex-col gap-3 w-full"
          data-node-id="9:77"
          data-name="order-summary-section"
        >
          <h3
            className="font-cormorant font-bold text-[#6b1a2a] text-[16px] text-center uppercase tracking-wider"
            data-node-id="9:78"
          >
            Order Summary
          </h3>

          <div className="flex flex-col gap-2 w-full">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-cormorant text-[#8b827d]">Subtotal</span>
              <span className="font-sans font-semibold text-[#6b1a2a]">
                ₹{total.toFixed(2)}
              </span>
            </div>

            {/* Shipping */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-cormorant text-[#8b827d]">Shipping</span>
              <div className="flex items-center gap-1">
                <img alt="" className="size-3.5 block" src={imgRibbonBow} />
                <span className="font-cormorant font-bold text-[#e28fa9] text-sm">
                  {isFreeShipping ? 'FREE' : `₹${shippingCost.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Discount */}
            {promoApplied && discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-cormorant text-[#8b827d]">Discount (10% off)</span>
                <span className="font-sans font-semibold text-[#e28fa9]">
                  -₹{discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            {/* Divider */}
            <div className="h-px w-full my-0.5 opacity-60">
              <img alt="" className="w-full h-auto block" src={imgLine1} />
            </div>

            {/* Total */}
            <div className="flex items-baseline justify-between pt-0.5">
              <span className="font-cormorant font-bold text-[#6b1a2a] text-base">
                Total
              </span>
              <span className="font-sans font-bold text-[#6b1a2a] text-[22px]">
                ₹{finalTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </section>

        {/* ── PLACE ORDER ACTION ── */}
        <div className="flex flex-col gap-3 items-center w-full">
          <button
            onClick={handlePlaceOrder}
            disabled={items.length === 0}
            className={`w-full py-4 rounded-full font-cormorant font-bold text-base uppercase tracking-wider text-white transition-all duration-200 cursor-pointer ${
              items.length === 0
                ? 'bg-[#8b827d]/50 cursor-not-allowed'
                : 'bg-[#6b1a2a] hover:bg-[#50131f] active:scale-98 drop-shadow-[0px_4px_5px_rgba(107,26,42,0.25)]'
            }`}
            data-node-id="9:138"
            data-name="place-order-button"
          >
            Place Order
          </button>

          {/* Trust Badges */}
          <div
            className="flex gap-1.5 items-center justify-center text-center font-cormorant text-[#8b827d] text-[13px]"
            data-node-id="9:140"
            data-name="trust-badges"
          >
            <span>Secure checkout</span>
            <span className="text-[#e28fa9]">•</span>
            <span>Made with love</span>
            <img alt="Heart" className="size-3 block ml-0.5" src={imgHeart} />
          </div>
        </div>

        {/* ── FOOTER SECTION ── */}
        <footer
          className="border-t border-[rgba(107,26,42,0.1)] pt-6 flex flex-col gap-5 items-center text-center w-full"
          data-node-id="9:146"
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

          {/* Navigation links */}
          <div
            className="flex flex-wrap gap-4 items-center justify-center font-cormorant font-bold text-[#6b1a2a] text-[13px] uppercase tracking-wider"
            data-name="footer-navigation"
          >
            <Link to="/shop" className="hover:opacity-75">
              Shop
            </Link>
            <Link to="/" className="hover:opacity-75">
              About
            </Link>
            <a href="mailto:hello@petalisse.com" className="hover:opacity-75">
              Contact
            </a>
            <Link to="/shop" className="hover:opacity-75">
              FAQ
            </Link>
          </div>

          {/* Social Icons */}
          <div className="flex gap-3 items-center justify-center" data-name="footer-social">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="bg-[#f9d5e5] rounded-full size-9 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Instagram"
            >
              <img alt="Instagram" className="size-4 block" src={imgInstagram} />
            </a>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noreferrer"
              className="bg-[#f9d5e5] rounded-full size-9 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="TikTok"
            >
              <img alt="TikTok" className="size-4 block" src={imgMusic} />
            </a>
            <a
              href="https://pinterest.com"
              target="_blank"
              rel="noreferrer"
              className="bg-[#f9d5e5] rounded-full size-9 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Pinterest"
            >
              <img alt="Pinterest" className="size-4 block" src={imgCircleX1} />
            </a>
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

      {/* Order Confirmation Modal */}
      {orderPlaced && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#fdfbf7] rounded-[24px] border border-[#6b1a2a]/20 max-w-sm w-full p-6 text-center shadow-xl flex flex-col gap-4 items-center">
            <div className="size-12 bg-[#f9d5e5] rounded-full flex items-center justify-center text-[#6b1a2a] text-xl">
              ✓
            </div>
            <h3 className="font-parisienne text-[#6b1a2a] text-4xl">Order Confirmed!</h3>
            <p className="font-cormorant text-[#8b827d] text-[15px] leading-relaxed">
              Thank you, <span className="font-bold text-[#6b1a2a]">{fullName}</span>! Your handmade treasures are being prepared with love and will ship to <span className="font-bold text-[#6b1a2a]">{address}, {city}</span>.
            </p>
            <p className="font-sans font-bold text-[#6b1a2a] text-lg">
              Total: ₹{finalTotal.toFixed(2)}
            </p>
            <button
              onClick={handleResetOrder}
              className="w-full bg-[#6b1a2a] hover:bg-[#50131f] text-white font-cormorant font-bold text-sm uppercase tracking-wider py-3 rounded-full transition-all cursor-pointer"
            >
              Back to Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
