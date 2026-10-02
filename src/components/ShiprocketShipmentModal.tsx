import React, { useState, useEffect } from 'react';
import { Order, OrderShipmentInfo } from '../types';
import {
  AvailableCourier,
  PickupLocation,
  fetchPickupLocations,
  fetchCourierServiceability,
  createFullShipment,
} from '../lib/shiprocket';

interface ShiprocketShipmentModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (shipment: OrderShipmentInfo, newStatus: Order['status']) => void;
}

export const ShiprocketShipmentModal: React.FC<ShiprocketShipmentModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Pre-fill delivery address from order
  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [phone, setPhone] = useState(order.phone || '');
  const [shippingAddress, setShippingAddress] = useState(order.shippingAddress || '');
  const [city, setCity] = useState(order.city || '');
  const [state, setState] = useState(order.state || 'West Bengal');
  const [pinCode, setPinCode] = useState(order.pinCode || '');
  const [email, setEmail] = useState(order.userEmail || '');

  // Package specs
  const [weight, setWeight] = useState<number>(0.2); // kg
  const [length, setLength] = useState<number>(10); // cm
  const [breadth, setBreadth] = useState<number>(10); // cm
  const [height, setHeight] = useState<number>(5); // cm

  // Pickup locations
  const [pickupLocations, setPickupLocations] = useState<PickupLocation[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<string>('');
  const [loadingPickups, setLoadingPickups] = useState<boolean>(true);

  // Couriers & Serviceability
  const [couriers, setCouriers] = useState<AvailableCourier[]>([]);
  const [selectedCourier, setSelectedCourier] = useState<AvailableCourier | null>(null);
  const [loadingCouriers, setLoadingCouriers] = useState<boolean>(false);
  const [courierError, setCourierError] = useState<string | null>(null);

  // Pickup date (default to tomorrow)
  const tomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const [pickupDate, setPickupDate] = useState<string>(tomorrowStr());

  // Submitting state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Sync state if order changes
  useEffect(() => {
    if (order) {
      setCustomerName(order.customerName || '');
      setPhone(order.phone || '');
      setShippingAddress(order.shippingAddress || '');
      setCity(order.city || '');
      setState(order.state || 'West Bengal');
      setPinCode(order.pinCode || '');
      setEmail(order.userEmail || '');
    }
  }, [order]);

  // Load pickup locations on open
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setLoadingPickups(true);
    fetchPickupLocations()
      .then((locs) => {
        if (!mounted) return;
        setPickupLocations(locs);
        if (locs.length > 0) {
          setSelectedPickup(locs[0].pickup_location);
        }
      })
      .catch((err) => {
        console.error('Failed to load pickup locations:', err);
      })
      .finally(() => {
        if (mounted) setLoadingPickups(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  // Check courier serviceability whenever delivery pincode or pickup location changes
  const checkCouriers = async (pincodeToCheck: string, pickupLocName: string) => {
    if (!pincodeToCheck || pincodeToCheck.trim().length < 6) return;

    const loc = pickupLocations.find((p) => p.pickup_location === pickupLocName);
    const pickupPincode = loc?.pin_code || '700102';

    setLoadingCouriers(true);
    setCourierError(null);
    setSelectedCourier(null);

    try {
      const list = await fetchCourierServiceability({
        pickup_postcode: pickupPincode,
        delivery_postcode: pincodeToCheck.trim(),
        weight,
        cod: order.paymentMethod === 'partial_cod',
      });

      setCouriers(list);
      if (list.length > 0) {
        // Select first/recommended courier
        setSelectedCourier(list[0]);
      } else {
        setCourierError('No courier partners found serviceable for this destination PIN code.');
      }
    } catch (err: any) {
      console.warn('Courier check warning:', err);
      setCourierError(err?.message || 'Could not fetch live courier serviceability');
    } finally {
      setLoadingCouriers(false);
    }
  };

  useEffect(() => {
    if (isOpen && pinCode && pinCode.length >= 6 && selectedPickup) {
      checkCouriers(pinCode, selectedPickup);
    }
  }, [isOpen, selectedPickup, pinCode]);

  if (!isOpen) return null;

  const isCod = order.paymentMethod === 'partial_cod';
  const codAmount = order.codAmountDue || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourier) {
      setSubmissionError('Please select a courier partner from the available list below.');
      return;
    }
    if (!selectedPickup) {
      setSubmissionError('Please select a pickup location.');
      return;
    }
    if (!pinCode || pinCode.trim().length < 6) {
      setSubmissionError('Please enter a valid 6-digit destination PIN code.');
      return;
    }
    if (!pickupDate) {
      setSubmissionError('Please select a pickup date.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await createFullShipment({
        orderNumber: order.orderNumber || `#${order.id}`,
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        shippingAddress: shippingAddress.trim(),
        city: city.trim(),
        state: state.trim(),
        pinCode: pinCode.trim(),
        pickupLocation: selectedPickup,
        items: order.items.map((i) => ({
          name: i.name,
          id: i.id,
          quantity: i.quantity,
          price: i.price,
        })),
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        discount: order.discount,
        paymentMethod: order.paymentMethod,
        codAmountDue: codAmount,
        courier: selectedCourier,
        pickupDate,
        weight,
        length,
        breadth,
        height,
      });

      const shipmentInfo: OrderShipmentInfo = {
        shiprocketOrderId: result.shiprocketOrderId,
        shipmentId: result.shipmentId,
        awbCode: result.awbCode,
        courierName: result.courierName,
        courierId: result.courierId,
        pickupLocation: result.pickupLocation,
        pickupDate: result.pickupDate,
        pickupTokenNumber: result.pickupTokenNumber,
        rate: result.rate,
        etd: result.etd,
        status: result.status,
      };

      // Call parent success handler to save to Firestore & state
      onSuccess(shipmentInfo, 'shipped');
      onClose();
    } catch (err: any) {
      console.error('Shipment creation error:', err);
      setSubmissionError(
        err?.message || 'Failed to create shipment on Shiprocket. Please verify details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-[#FAF7F2] border border-[#E8E0D5] rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white border-b border-[#EAE3D8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-[#FAF0ED] text-[#8E5B59] flex items-center justify-center shadow-2xs">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg text-[#2C2724] font-semibold">
                  Create Shiprocket Shipment
                </h3>
                <span className="font-mono text-xs font-bold text-[#8E5B59] bg-[#FAF0ED] px-2 py-0.5 rounded-md">
                  {order.orderNumber || `#${order.id}`}
                </span>
              </div>
              <p className="text-xs text-[#786F66]">
                Prefilled delivery address · Live courier rate check · Instant AWB & pickup booking
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full hover:bg-[#F3EDE2] text-[#786F66] flex items-center justify-center transition cursor-pointer"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {submissionError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-start gap-2.5">
              <span className="text-sm">⚠️</span>
              <div>
                <div className="font-semibold">Shipment Error</div>
                <div>{submissionError}</div>
              </div>
            </div>
          )}

          {/* Section 1: Customer Delivery Address (Prefilled) */}
          <div className="bg-white p-4 rounded-2xl border border-[#EAE3D8] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#F3EDE2] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">📍</span>
                <span className="text-xs font-bold text-[#2C2724] uppercase tracking-wider">
                  Destination & Delivery Address (Prefilled from Order)
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                ✓ Auto-Filled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-[#786F66] mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED5C9] bg-[#FAF7F2] text-[#2C2724] focus:outline-none focus:border-[#8E5B59] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#786F66] mb-1">
                  Mobile Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED5C9] bg-[#FAF7F2] text-[#2C2724] focus:outline-none focus:border-[#8E5B59] focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-[#786F66] mb-1">
                  Street Address / Flat / Landmark *
                </label>
                <textarea
                  rows={2}
                  required
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED5C9] bg-[#FAF7F2] text-[#2C2724] focus:outline-none focus:border-[#8E5B59] focus:bg-white transition resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#786F66] mb-1">
                  City / Town *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED5C9] bg-[#FAF7F2] text-[#2C2724] focus:outline-none focus:border-[#8E5B59] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#786F66] mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED5C9] bg-[#FAF7F2] text-[#2C2724] focus:outline-none focus:border-[#8E5B59] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#786F66] mb-1">
                  Postal PIN Code * (6 Digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED5C9] bg-[#FAF7F2] text-[#2C2724] font-mono font-bold focus:outline-none focus:border-[#8E5B59] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#786F66] mb-1">
                  Customer Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#DED5C9] bg-[#FAF7F2] text-[#2C2724] focus:outline-none focus:border-[#8E5B59] focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Origin Pickup Location & Package Spec */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pickup Location Select */}
            <div className="bg-white p-4 rounded-2xl border border-[#EAE3D8] space-y-2.5 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C2724] uppercase tracking-wider">
                <span>🏢</span>
                <span>Dispatch From Pickup Hub *</span>
              </div>

              {loadingPickups ? (
                <div className="py-3 text-xs text-[#786F66] flex items-center gap-2">
                  <span className="size-3 border-2 border-[#8E5B59] border-t-transparent rounded-full animate-spin" />
                  Loading pickup locations from Shiprocket...
                </div>
              ) : (
                <select
                  value={selectedPickup}
                  onChange={(e) => setSelectedPickup(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#DED5C9] bg-[#FAF7F2] text-xs font-medium text-[#2C2724] cursor-pointer focus:outline-none focus:border-[#8E5B59]"
                >
                  {pickupLocations.map((loc) => (
                    <option key={loc.pickup_location} value={loc.pickup_location}>
                      {loc.pickup_location} ({loc.pin_code} - {loc.city})
                    </option>
                  ))}
                </select>
              )}

              {selectedPickup && (
                <div className="text-[11px] text-[#786F66] bg-[#FAF7F2] p-2 rounded-lg border border-[#F3EDE2]">
                  {pickupLocations.find((p) => p.pickup_location === selectedPickup)?.address}
                </div>
              )}
            </div>

            {/* Package & Payment Spec */}
            <div className="bg-white p-4 rounded-2xl border border-[#EAE3D8] space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#2C2724] uppercase tracking-wider">
                  <span>📦</span>
                  <span>Package & Payment</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    isCod
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}
                >
                  {isCod ? `COD Due: ₹${codAmount}` : 'Prepaid (₹0 Due)'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="col-span-1">
                  <label className="block text-[10px] text-[#786F66] mb-0.5">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0.2)}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#DED5C9] bg-[#FAF7F2] text-xs font-medium text-center"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-[#786F66] mb-0.5">L (cm)</label>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(parseInt(e.target.value) || 10)}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#DED5C9] bg-[#FAF7F2] text-xs font-medium text-center"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-[#786F66] mb-0.5">B (cm)</label>
                  <input
                    type="number"
                    value={breadth}
                    onChange={(e) => setBreadth(parseInt(e.target.value) || 10)}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#DED5C9] bg-[#FAF7F2] text-xs font-medium text-center"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] text-[#786F66] mb-0.5">H (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value) || 5)}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#DED5C9] bg-[#FAF7F2] text-xs font-medium text-center"
                  />
                </div>
              </div>

              <div className="text-[11px] text-[#786F66]">
                Items: {order.items.reduce((acc, i) => acc + i.quantity, 0)} charms/accessories
              </div>
            </div>
          </div>

          {/* Section 3: Available Couriers & Live Rates */}
          <div className="bg-white p-4 rounded-2xl border border-[#EAE3D8] space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3EDE2] pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🚚</span>
                <span className="text-xs font-bold text-[#2C2724] uppercase tracking-wider">
                  Select Courier Partner & View Live Shipping Rates
                </span>
              </div>
              <button
                type="button"
                onClick={() => checkCouriers(pinCode, selectedPickup)}
                disabled={loadingCouriers}
                className="text-[11px] text-[#8E5B59] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                {loadingCouriers ? 'Checking rates...' : '↻ Refresh Couriers'}
              </button>
            </div>

            {loadingCouriers ? (
              <div className="py-8 text-center text-xs text-[#786F66]">
                <div className="size-6 border-2 border-[#8E5B59] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Querying Shiprocket live courier rates for PIN {pinCode}...
              </div>
            ) : courierError ? (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                {courierError}
              </div>
            ) : couriers.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#786F66]">
                Enter a 6-digit postal code above to fetch available couriers and pricing.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {couriers.map((courier) => {
                  const isSelected =
                    selectedCourier?.courier_company_id === courier.courier_company_id;

                  return (
                    <div
                      key={courier.courier_company_id}
                      onClick={() => setSelectedCourier(courier)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex flex-col justify-between gap-2 relative ${
                        isSelected
                          ? 'border-[#8E5B59] bg-[#FAF0ED]/60 shadow-xs ring-1 ring-[#8E5B59]'
                          : 'border-[#EAE3D8] bg-[#FAF7F2] hover:bg-white hover:border-[#DED5C9]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="font-semibold text-[#2C2724] leading-snug">
                          {courier.courier_name}
                        </div>
                        {courier.is_recommended && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                            Best Rate
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline justify-between pt-1 border-t border-[#EAE3D8]/60">
                        <div className="text-[11px] text-[#786F66]">
                          ETD: <strong className="text-[#2C2724]">{courier.etd}</strong>
                        </div>
                        <div className="text-sm font-bold text-[#8E5B59]">
                          ₹{courier.rate.toFixed(2)}
                        </div>
                      </div>

                      <div className="text-[10px] text-[#8C827A] flex items-center justify-between">
                        <span>Est: ~{courier.estimated_delivery_days} days</span>
                        <span>⭐ {courier.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Pickup Date Selection */}
          <div className="bg-white p-4 rounded-2xl border border-[#EAE3D8] space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 border-b border-[#F3EDE2] pb-2">
              <span className="text-sm">📅</span>
              <span className="text-xs font-bold text-[#2C2724] uppercase tracking-wider">
                Select Pickup Date *
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                required
                min={todayStr()}
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#DED5C9] bg-[#FAF7F2] text-xs font-medium text-[#2C2724] focus:outline-none focus:border-[#8E5B59]"
              />

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPickupDate(todayStr())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    pickupDate === todayStr()
                      ? 'bg-[#8E5B59] text-white shadow-xs'
                      : 'bg-[#F3EDE2] text-[#6D635B] hover:text-[#2C2724]'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setPickupDate(tomorrowStr())}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    pickupDate === tomorrowStr()
                      ? 'bg-[#8E5B59] text-white shadow-xs'
                      : 'bg-[#F3EDE2] text-[#6D635B] hover:text-[#2C2724]'
                  }`}
                >
                  Tomorrow
                </button>
              </div>

              <span className="text-[11px] text-[#786F66]">
                The courier will arrive at the chosen hub on this date for package handover.
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#EAE3D8] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#786F66]">
            {selectedCourier ? (
              <span>
                Selected: <strong className="text-[#2C2724]">{selectedCourier.courier_name}</strong>{' '}
                for <strong className="text-[#8E5B59]">₹{selectedCourier.rate.toFixed(2)}</strong> (
                {selectedCourier.etd})
              </span>
            ) : (
              <span>Please pick a courier to dispatch</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#DED5C9] text-xs font-medium text-[#4A423B] hover:bg-[#F3EDE2] transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedCourier}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#8E5B59] hover:bg-[#784A48] text-white text-xs font-medium transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Shipment & AWB...
                </>
              ) : (
                <>
                  <span>Create Shipment & Schedule Pickup</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
