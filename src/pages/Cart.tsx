import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { OrderItem } from '../types';
import { getColorHex } from '../lib/colorUtils';

const imgGinghamBg = '/figma-assets/772e8e7b4c0d39ad6752261452ccca607e718dc3.png';
const imgChevronLeft = '/figma-assets/a9ed62056d32eaca4682db0b3be7e08d78983400.svg';
const imgShoppingBag = '/figma-assets/c0a9184bb0018ada313c0983e0b8eacc37091194.svg';
const imgXCircle = '/figma-assets/cf54c1777967904b46c130fd6899a0c8a75fc015.svg';
const imgLine = '/figma-assets/517bc7baba824d13ad91f42856bf10b6d75c407e.svg';
const imgRibbonBow = '/figma-assets/c17b250678e032af9de42877174cc7812bd92c8c.svg';
const imgLine1 = '/figma-assets/20bf8e0265d182c607e4c78d452dfc8562b9817e.svg';
const imgHeart = '/figma-assets/d3d3b0328e7b2065e2dd6237087ca61044311cfd.svg';
const imgInstagram = '/figma-assets/61242fa42cf1591147b709b00c26b1201880564e.svg';
const imgMusic = '/figma-assets/76abb4ffe21c8d67bea7f7daf70db2330cc66a88.svg';

export default function Cart() {
  const { items, remove, update, total, count, clear } = useCart();
  const { currentUser, userProfile } = useAuth();
  const { createOrder, orders } = useContent();
  const [promoCode, setPromoCode] = useState('PETALISSE10');
  const [promoApplied, setPromoApplied] = useState(true);
  const [promoMessage, setPromoMessage] = useState('10% off applied!');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [placedOrderDetails, setPlacedOrderDetails] = useState<Order | null>(null);

  // Payment method selection ('online' | 'partial_cod')
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'partial_cod'>('online');

  // Form fields with local storage persistence (cleaning out old dummy placeholders)
  const [fullName, setFullName] = useState(() => {
    try {
      const saved = localStorage.getItem('petalisse_checkout_name');
      if (saved && saved !== 'Clara Avery') return saved;
    } catch {}
    return '';
  });
  const [email, setEmail] = useState(() => {
    try {
      const saved = localStorage.getItem('petalisse_checkout_email');
      if (saved) return saved;
    } catch {}
    return '';
  });
  const [address, setAddress] = useState(() => {
    try {
      const saved = localStorage.getItem('petalisse_checkout_address');
      if (saved && saved !== '123 Cozy Lane') return saved;
    } catch {}
    return '';
  });
  const [city, setCity] = useState(() => {
    try {
      const saved = localStorage.getItem('petalisse_checkout_city');
      if (saved && saved !== 'Floral Town') return saved;
    } catch {}
    return '';
  });
  const [stateName, setStateName] = useState(() => {
    try {
      const saved = localStorage.getItem('petalisse_checkout_state');
      if (saved) return saved;
    } catch {}
    return '';
  });
  const [pinCode, setPinCode] = useState(() => {
    try {
      const saved = localStorage.getItem('petalisse_checkout_pincode');
      if (saved) return saved;
    } catch {}
    return '';
  });
  const [phone, setPhone] = useState(() => {
    try {
      const saved = localStorage.getItem('petalisse_checkout_phone');
      if (saved && saved !== '(555) 019-2831') return saved;
    } catch {}
    return '';
  });

  useEffect(() => {
    try {
      localStorage.setItem('petalisse_checkout_name', fullName);
      localStorage.setItem('petalisse_checkout_email', email);
      localStorage.setItem('petalisse_checkout_address', address);
      localStorage.setItem('petalisse_checkout_city', city);
      localStorage.setItem('petalisse_checkout_state', stateName);
      localStorage.setItem('petalisse_checkout_pincode', pinCode);
      localStorage.setItem('petalisse_checkout_phone', phone);
    } catch {}
  }, [fullName, email, address, city, stateName, pinCode, phone]);

  useEffect(() => {
    if (currentUser) {
      if (!fullName && (userProfile?.name || currentUser.displayName)) {
        setFullName(userProfile?.name || currentUser.displayName || '');
      }
      if (!email && currentUser.email) {
        setEmail(currentUser.email);
      }
      if (!phone && userProfile?.phone) {
        setPhone(userProfile.phone);
      }
    }
  }, [currentUser, userProfile]);

  // Handle return from payment gateway (hosted on https://waveridrentals.vercel.app/petaliseepayment.html)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const orderSuccess = searchParams.get('orderSuccess');
    const returnedOid = searchParams.get('oid');
    const returnedPaymentId = searchParams.get('paymentId');

    if (orderSuccess === 'true' && returnedOid) {
      clear();
      // Try to find matching order in ContentContext
      const matched = orders.find((o) => o.id === returnedOid);
      if (matched) {
        setPlacedOrderDetails(matched);
        setOrderPlaced(true);
      } else {
        // Fallback to cached order in local storage while Firestore sync completes
        try {
          const cachedJson = localStorage.getItem(`petalisse_pending_order_${returnedOid}`);
          if (cachedJson) {
            const parsed = JSON.parse(cachedJson);
            setPlacedOrderDetails({
              ...parsed,
              id: returnedOid,
              paymentId: returnedPaymentId || undefined,
              status: 'confirmed',
            });
            setOrderPlaced(true);
          }
        } catch {}
      }

      // Clean query params from address bar
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}
    }
  }, [orders, clear]);

  // Discount & Shipping calculations
  // Free shipping on order above 599 or else 49 for online payment and 99 for partial cod
  const discountAmount = promoApplied ? total * 0.1 : 0;
  const productTotal = Math.max(0, total - discountAmount);
  const isFreeShipping = productTotal >= 599;

  let shippingFee = 0;
  if (productTotal > 0) {
    if (isFreeShipping) {
      shippingFee = 0;
    } else if (paymentMethod === 'online') {
      shippingFee = 49;
    } else {
      shippingFee = 99; // partial_cod
    }
  }

  const finalTotal = productTotal + shippingFee;

  // Partial COD calculation:
  // "for partial cod user have to pay half amount of the product and 99 shipping
  // and if the order amount is above 599 then free shipping on the 50 % amount will have to paid to place the order"
  const halfProduct = Math.round(productTotal * 0.5);
  const codAmountDue = paymentMethod === 'partial_cod' ? productTotal - halfProduct : 0;
  const amountPaidNow = paymentMethod === 'partial_cod' ? halfProduct + shippingFee : finalTotal;

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      setPromoApplied(false);
      setPromoMessage('');
      return;
    }
    setPromoApplied(true);
    setPromoMessage('10% discount applied!');
  };

  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCheckoutError(null);

    if (items.length === 0) {
      setCheckoutError('Your cart is empty. Please add items to checkout.');
      return;
    }

    if (!fullName.trim()) {
      setCheckoutError('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setCheckoutError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!address.trim()) {
      setCheckoutError('Please enter your delivery street address.');
      return;
    }

    if (!city.trim()) {
      setCheckoutError('Please enter your delivery city or town.');
      return;
    }

    if (!pinCode.trim() || pinCode.trim().length < 6) {
      setCheckoutError('Please enter a valid 6-digit postal PIN code.');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const orderId = `ord_${timestamp}_${randomSuffix.toLowerCase()}`;
      const orderNumber = `#PET-${timestamp.toString().slice(-6)}${randomSuffix}`;

      const orderItems: OrderItem[] = items.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.discountedPrice ?? i.product.price,
        quantity: i.quantity,
        img: i.product.img || i.product.images?.[0] || '',
        selectedColor: i.selectedColor,
      }));

      const fullShippingAddress = `${address.trim()}, ${city.trim()}${
        stateName.trim() ? `, ${stateName.trim()}` : ''
      } - ${pinCode.trim()}`;

      const orderPayload: Order = {
        id: orderId,
        orderNumber,
        userId: currentUser?.uid,
        userEmail: email.trim() || currentUser?.email || 'guest@petalisse.com',
        customerName: fullName.trim(),
        shippingAddress: fullShippingAddress,
        city: city.trim(),
        state: stateName.trim() || undefined,
        pinCode: pinCode.trim(),
        phone: cleanPhone,
        items: orderItems,
        subtotal: total,
        discount: discountAmount,
        shippingFee,
        total: finalTotal,
        paymentMethod,
        amountPaid: amountPaidNow,
        codAmountDue,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      // Cache locally for instant hydration upon return
      try {
        localStorage.setItem(`petalisse_pending_order_${orderId}`, JSON.stringify(orderPayload));
      } catch {}

      // Encode payload details for gateway
      const payloadData = {
        items: orderItems,
        address: address.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pinCode.trim(),
        country: 'India',
        subtotal: total,
        discount: discountAmount,
        shippingFee,
        codAmountDue,
        orderNumber,
      };

      const encodedData = btoa(unescape(encodeURIComponent(JSON.stringify(payloadData))));

      // Payment gateway hosted on https://waveridrentals.vercel.app/petaliseepayment.html
      const paymentGatewayBase =
        localStorage.getItem('petalisse_payment_gateway') ||
        'https://waveridrentals.vercel.app/petaliseepayment.html';

      const returnOrigin = window.location.origin;

      const queryParams = new URLSearchParams({
        oid: orderId,
        amt: amountPaidNow.toString(),
        total: finalTotal.toString(),
        mode: paymentMethod === 'partial_cod' ? 'cod_advance' : 'online',
        n: fullName.trim(),
        e: email.trim() || currentUser?.email || '',
        ph: cleanPhone,
        uid: currentUser?.uid || '',
        ue: currentUser?.email || '',
        ret: returnOrigin,
        d: encodedData,
      });

      const redirectUrl = `${paymentGatewayBase}?${queryParams.toString()}`;
      window.location.href = redirectUrl;
    } catch (e: any) {
      console.warn('Order redirection error:', e);
      setCheckoutError(e.message || 'Error processing checkout. Please try again.');
      setIsSubmittingOrder(false);
    }
  };

  const handleResetOrder = () => {
    setOrderPlaced(false);
    setPlacedOrderDetails(null);
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
        className="w-full max-w-[430px] bg-[#fdfbf7] rounded-[24px] shadow-[0px_8px_28px_rgba(44,62,80,0.14)] px-4 sm:px-5 py-6 relative flex flex-col gap-6 items-stretch overflow-visible border border-[rgba(107,26,42,0.06)]"
        data-node-id="9:5"
        data-name="paper-center-panel"
      >
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
            items.map(({ product: p, quantity, selectedColor }, idx) => (
              <div
                key={`${p.id}-${selectedColor || ''}-${idx}`}
                className="bg-white border border-[rgba(107,26,42,0.1)] rounded-[16px] p-3 flex gap-3 items-center w-full shadow-xs"
                data-name="cart-item"
              >
                <Link to={`/product/${p.id}`} className="size-20 rounded-[12px] overflow-hidden shrink-0">
                  <img
                    alt={p.name}
                    src={p.img || p.images?.[0]}
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
                      onClick={() => remove(p.id, selectedColor)}
                      className="p-1 text-[#8b827d] hover:text-[#c82333] transition-colors cursor-pointer"
                      title="Remove item"
                      data-name="remove-btn"
                    >
                      <img alt="Remove" className="size-2.5 block" src={imgXCircle} />
                    </button>
                  </div>

                  {selectedColor && (
                    <div className="flex items-center gap-1.5 -mt-0.5">
                      <span
                        className="size-2 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: getColorHex(selectedColor) }}
                      />
                      <span className="font-sans text-[11px] text-[#8E5B59] font-medium">
                        Color: <span className="text-[#4A423B]">{selectedColor}</span>
                      </span>
                    </div>
                  )}

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
                        onClick={() => update(p.id, quantity - 1, selectedColor)}
                        className="text-xs hover:opacity-75 transition-opacity cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        —
                      </button>
                      <span className="text-[13px] font-sans font-bold">{quantity}</span>
                      <button
                        onClick={() => update(p.id, quantity + 1, selectedColor)}
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
            <div className="flex flex-col gap-1 w-full">
              <label className="font-cormorant font-semibold text-[#6b1a2a] text-[13px] uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ananya Sharma"
                className="bg-white border border-[rgba(107,26,42,0.15)] rounded-xl px-4 py-2.5 font-cormorant text-sm text-[#2C2724] placeholder-[#A89E94] outline-none focus:border-[#6b1a2a] focus:ring-1 focus:ring-[#6b1a2a]/20 transition-all"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <div className="flex flex-col gap-1">
                <label className="font-cormorant font-semibold text-[#6b1a2a] text-[13px] uppercase tracking-wider">
                  Mobile Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="bg-white border border-[rgba(107,26,42,0.15)] rounded-xl px-4 py-2.5 font-cormorant text-sm text-[#2C2724] placeholder-[#A89E94] outline-none focus:border-[#6b1a2a] focus:ring-1 focus:ring-[#6b1a2a]/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-cormorant font-semibold text-[#6b1a2a] text-[13px] uppercase tracking-wider">
                  Email Address (for tracking)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ananya@example.com"
                  className="bg-white border border-[rgba(107,26,42,0.15)] rounded-xl px-4 py-2.5 font-cormorant text-sm text-[#2C2724] placeholder-[#A89E94] outline-none focus:border-[#6b1a2a] focus:ring-1 focus:ring-[#6b1a2a]/20 transition-all"
                />
              </div>
            </div>

            {/* Street Address */}
            <div className="flex flex-col gap-1 w-full">
              <label className="font-cormorant font-semibold text-[#6b1a2a] text-[13px] uppercase tracking-wider">
                Street Address / House Details *
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House/Flat no., Building name, Street / Area"
                className="bg-white border border-[rgba(107,26,42,0.15)] rounded-xl px-4 py-2.5 font-cormorant text-sm text-[#2C2724] placeholder-[#A89E94] outline-none focus:border-[#6b1a2a] focus:ring-1 focus:ring-[#6b1a2a]/20 transition-all"
              />
            </div>

            {/* City, State & PIN */}
            <div className="grid grid-cols-3 gap-2 w-full">
              <div className="flex flex-col gap-1">
                <label className="font-cormorant font-semibold text-[#6b1a2a] text-[12px] uppercase tracking-wider">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="bg-white border border-[rgba(107,26,42,0.15)] rounded-xl px-3 py-2.5 font-cormorant text-sm text-[#2C2724] placeholder-[#A89E94] outline-none focus:border-[#6b1a2a] focus:ring-1 focus:ring-[#6b1a2a]/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-cormorant font-semibold text-[#6b1a2a] text-[12px] uppercase tracking-wider">
                  State
                </label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  placeholder="e.g. Maharashtra"
                  className="bg-white border border-[rgba(107,26,42,0.15)] rounded-xl px-3 py-2.5 font-cormorant text-sm text-[#2C2724] placeholder-[#A89E94] outline-none focus:border-[#6b1a2a] focus:ring-1 focus:ring-[#6b1a2a]/20 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-cormorant font-semibold text-[#6b1a2a] text-[12px] uppercase tracking-wider">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 400001"
                  className="bg-white border border-[rgba(107,26,42,0.15)] rounded-xl px-3 py-2.5 font-cormorant text-sm text-[#2C2724] placeholder-[#A89E94] outline-none focus:border-[#6b1a2a] focus:ring-1 focus:ring-[#6b1a2a]/20 transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── FREE SHIPPING PROGRESS BAR ── */}
        {productTotal > 0 && (
          <div className="w-full bg-[#FAF7F2] p-3 rounded-2xl border border-[rgba(107,26,42,0.12)]">
            {isFreeShipping ? (
              <div className="flex items-center gap-2 text-xs font-medium text-[#2E7D32]">
                <span className="text-base">🎉</span>
                <span>
                  <strong>FREE SHIPPING UNLOCKED!</strong> Orders above ₹599 receive free delivery.
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#6D635B]">
                    Add <strong className="text-[#6b1a2a]">₹{(599 - productTotal).toFixed(0)}</strong> more for <strong>FREE SHIPPING</strong>
                  </span>
                  <span className="font-bold text-[#6b1a2a] text-[11px]">
                    {Math.min(100, Math.round((productTotal / 599) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-[#EAE3D8] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#8E5B59] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(5, (productTotal / 599) * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PAYMENT METHOD SELECTION ── */}
        <section className="flex flex-col gap-3 w-full" data-name="payment-method-section">
          <div className="flex items-center justify-between w-full">
            <div className="h-px flex-1 max-w-[60px] opacity-70">
              <img alt="" className="w-full h-auto block" src={imgLine} />
            </div>
            <h2 className="font-parisienne text-[#6b1a2a] text-[34px] leading-none px-2 text-center">
              Payment Method
            </h2>
            <div className="h-px flex-1 max-w-[60px] opacity-70">
              <img alt="" className="w-full h-auto block" src={imgLine} />
            </div>
          </div>

          <div className="flex flex-col gap-2.5 w-full">
            {/* Option 1: Online Payment */}
            <div
              onClick={() => setPaymentMethod('online')}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 ${
                paymentMethod === 'online'
                  ? 'bg-white border-[#6b1a2a] shadow-xs ring-2 ring-[#6b1a2a]/15'
                  : 'bg-[#FAF7F2] border-[#E8E0D5] hover:border-[#6b1a2a]/40 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="size-4 accent-[#6b1a2a] cursor-pointer"
                  />
                  <span className="font-cormorant font-bold text-[#6b1a2a] text-base">
                    Online Payment (Prepaid)
                  </span>
                </div>
                <span
                  className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isFreeShipping
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-[#FAF0ED] text-[#8E5B59] border border-[#E8C5B8]'
                  }`}
                >
                  {isFreeShipping ? 'FREE Shipping' : '₹49 Shipping'}
                </span>
              </div>

              <p className="text-xs text-[#786F66] font-sans pl-6.5 leading-relaxed">
                Pay 100% online via UPI, Cards, or NetBanking.
                {!isFreeShipping && (
                  <span className="font-medium text-[#2E7D32] ml-1">
                    Save ₹50 on shipping compared to Partial COD!
                  </span>
                )}
              </p>

              <div className="pl-6.5 text-xs font-sans text-[#2C2724] font-semibold">
                Amount to pay now: <span className="text-[#6b1a2a] font-bold">₹{finalTotal.toFixed(0)}</span>
              </div>
            </div>

            {/* Option 2: Partial COD */}
            <div
              onClick={() => setPaymentMethod('partial_cod')}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-1.5 ${
                paymentMethod === 'partial_cod'
                  ? 'bg-white border-[#6b1a2a] shadow-xs ring-2 ring-[#6b1a2a]/15'
                  : 'bg-[#FAF7F2] border-[#E8E0D5] hover:border-[#6b1a2a]/40 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'partial_cod'}
                    onChange={() => setPaymentMethod('partial_cod')}
                    className="size-4 accent-[#6b1a2a] cursor-pointer"
                  />
                  <span className="font-cormorant font-bold text-[#6b1a2a] text-base">
                    Partial COD (Cash on Delivery)
                  </span>
                </div>
                <span
                  className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isFreeShipping
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                >
                  {isFreeShipping ? 'FREE Shipping' : '₹99 Shipping'}
                </span>
              </div>

              <p className="text-xs text-[#786F66] font-sans pl-6.5 leading-relaxed">
                {isFreeShipping
                  ? 'Orders above ₹599 get free shipping! Pay 50% now to confirm booking and the remaining 50% upon delivery.'
                  : 'Pay 50% of product price + ₹99 shipping now. Pay the remaining 50% product balance in cash/UPI upon delivery.'}
              </p>

              <div className="pl-6.5 pt-0.5 flex flex-wrap items-center gap-2 text-xs font-sans">
                <span className="px-2 py-0.5 rounded-md bg-[#FAF0ED] text-[#8E5B59] font-medium border border-[#E8C5B8]">
                  Pay Now: <strong className="font-bold">₹{amountPaidNow.toFixed(0)}</strong>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#5C534B] font-medium border border-[#DED5C9]">
                  Pay on Delivery: <strong className="font-bold">₹{codAmountDue.toFixed(0)}</strong>
                </span>
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

          <div className="flex flex-col gap-2 w-full text-sm">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="font-cormorant text-[#8b827d]">Products Subtotal</span>
              <span className="font-sans font-semibold text-[#6b1a2a]">
                ₹{total.toFixed(0)}
              </span>
            </div>

            {/* Discount */}
            {promoApplied && discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="font-cormorant text-[#8b827d]">Discount (10% off)</span>
                <span className="font-sans font-semibold text-[#e28fa9]">
                  -₹{discountAmount.toFixed(0)}
                </span>
              </div>
            )}

            {/* Shipping */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-cormorant text-[#8b827d]">Shipping Fee</span>
                <span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-white text-[#786F66] border border-[#E0D5C7]">
                  {paymentMethod === 'online' ? 'Online' : 'Partial COD'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <img alt="" className="size-3.5 block" src={imgRibbonBow} />
                <span
                  className={`font-sans font-bold text-sm ${
                    isFreeShipping ? 'text-[#2E7D32]' : 'text-[#6b1a2a]'
                  }`}
                >
                  {isFreeShipping ? 'FREE' : `₹${shippingFee}`}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px w-full my-0.5 opacity-60">
              <img alt="" className="w-full h-auto block" src={imgLine1} />
            </div>

            {/* Total Order Amount */}
            <div className="flex items-baseline justify-between pt-0.5">
              <span className="font-cormorant font-bold text-[#6b1a2a] text-base">
                Total Order Value
              </span>
              <span className="font-sans font-bold text-[#6b1a2a] text-xl">
                ₹{finalTotal.toFixed(0)}
              </span>
            </div>

            {/* Partial COD / Online Payment breakdown box */}
            {paymentMethod === 'partial_cod' ? (
              <div className="mt-1 pt-2 border-t border-[rgba(107,26,42,0.1)] space-y-1 bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8C5B8]/60">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#8E5B59]">
                    Advance Paid Now (50%{shippingFee > 0 ? ` + ₹${shippingFee} shipping` : ' + FREE Shipping'}):
                  </span>
                  <span className="font-sans font-bold text-[#8E5B59] text-sm">
                    ₹{amountPaidNow.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-[#6B5F55]">
                    Balance Due on Delivery:
                  </span>
                  <span className="font-sans font-bold text-[#2C2724]">
                    ₹{codAmountDue.toFixed(0)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex justify-between items-center text-xs text-[#2E7D32] bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <span>100% Paid Online • Nothing due upon delivery</span>
                <span className="font-bold">₹{amountPaidNow.toFixed(0)}</span>
              </div>
            )}
          </div>
        </section>

        {/* Error notice if validation fails */}
        {checkoutError && (
          <div className="w-full p-3 rounded-xl bg-[#FAF0ED] border border-[#E8C5B8] text-[#9E3E2B] text-xs flex items-center gap-2">
            <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{checkoutError}</span>
          </div>
        )}

        {/* ── PLACE ORDER ACTION ── */}
        <div className="flex flex-col gap-3 items-center w-full">
          <button
            onClick={handlePlaceOrder}
            disabled={items.length === 0 || isSubmittingOrder}
            className={`w-full py-4 rounded-full font-cormorant font-bold text-base uppercase tracking-wider text-white transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm ${
              items.length === 0 || isSubmittingOrder
                ? 'bg-[#8b827d]/50 cursor-not-allowed'
                : 'bg-[#6b1a2a] hover:bg-[#50131f] active:scale-98 drop-shadow-[0px_4px_5px_rgba(107,26,42,0.25)]'
            }`}
            data-node-id="9:138"
            data-name="place-order-button"
          >
            {isSubmittingOrder ? (
              <span className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : null}
            <span>
              {isSubmittingOrder
                ? 'Recording Order in Live DB...'
                : paymentMethod === 'partial_cod'
                ? `Confirm Order • Pay ₹${amountPaidNow.toFixed(0)} Now`
                : `Place Order • ₹${finalTotal.toFixed(0)}`}
            </span>
          </button>

          {/* Trust Badges */}
          <div
            className="flex gap-1.5 items-center justify-center text-center font-cormorant text-[#8b827d] text-[13px]"
            data-node-id="9:140"
            data-name="trust-badges"
          >
            <span>Secure boutique checkout</span>
            <span className="text-[#e28fa9]">•</span>
            <span>Handmade with love</span>
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
            <Link to="/profile" className="hover:opacity-75">
              My Orders
            </Link>
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

      {/* ── ORDER CONFIRMATION MODAL WITH DB SYNC DETAILS ── */}
      {orderPlaced && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#fdfbf7] rounded-[28px] border border-[#6b1a2a]/20 max-w-md w-full p-6 text-center shadow-2xl flex flex-col gap-4 items-center relative overflow-hidden">
            {/* Success icon */}
            <div className="size-14 bg-[#f9d5e5] rounded-full flex items-center justify-center text-[#6b1a2a] text-2xl shadow-xs">
              ✓
            </div>

            <div>
              <span className="text-[11px] font-sans font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Order Live in Database
              </span>
              <h3 className="font-parisienne text-[#6b1a2a] text-4xl mt-1.5">
                Order Confirmed!
              </h3>
              <p className="font-mono text-xs font-bold text-[#8E5B59] mt-0.5">
                {placedOrderDetails?.orderNumber || `#PET-${Date.now().toString().slice(-6)}`}
              </p>
            </div>

            <p className="font-cormorant text-[#6D635B] text-[15px] leading-relaxed">
              Thank you, <strong className="text-[#6b1a2a]">{placedOrderDetails?.customerName || fullName}</strong>! Your order has been synchronized with the boutique workshop and will ship to:
            </p>

            {/* Address pill */}
            <div className="w-full p-3 rounded-xl bg-white border border-[#E8E0D5] text-left text-xs space-y-1">
              <div className="font-semibold text-[#2C2724]">
                {placedOrderDetails?.customerName || fullName} • {placedOrderDetails?.phone || phone}
              </div>
              <div className="text-[#6D635B]">
                {placedOrderDetails?.shippingAddress || `${address}, ${city}`}
              </div>
            </div>

            {/* Payment & Financial breakdown */}
            <div className="w-full p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] text-xs space-y-2 text-left">
              <div className="flex justify-between items-center pb-2 border-b border-[#E8E0D5]">
                <span className="text-[#786F66]">Payment Method</span>
                <span className="font-bold text-[#6b1a2a] uppercase">
                  {placedOrderDetails?.paymentMethod === 'partial_cod' ? 'Partial COD' : 'Online Paid'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#786F66]">Total Order Value</span>
                <span className="font-sans font-bold text-[#2C2724]">
                  ₹{placedOrderDetails?.total.toFixed(0)}
                </span>
              </div>

              <div className="flex justify-between items-center text-[#2E7D32]">
                <span>Amount Paid Now</span>
                <span className="font-sans font-bold">
                  ₹{placedOrderDetails?.amountPaid.toFixed(0)}
                </span>
              </div>

              {placedOrderDetails?.paymentMethod === 'partial_cod' && (
                <div className="flex justify-between items-center pt-1.5 border-t border-[#E8E0D5] text-amber-900 font-semibold bg-amber-50 p-2 rounded-lg">
                  <span>Balance Due upon Delivery:</span>
                  <span className="font-sans font-bold text-sm">
                    ₹{placedOrderDetails?.codAmountDue.toFixed(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full flex flex-col gap-2 pt-1">
              <Link
                to="/shop"
                onClick={handleResetOrder}
                className="w-full bg-[#6b1a2a] hover:bg-[#50131f] text-white font-cormorant font-bold text-sm uppercase tracking-wider py-3 rounded-full transition-all cursor-pointer text-center"
              >
                Continue Shopping &rarr;
              </Link>

              <Link
                to="/admin"
                onClick={handleResetOrder}
                className="text-xs text-[#8b827d] hover:text-[#6b1a2a] underline py-1"
              >
                View Live in Admin Orders Tab &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
