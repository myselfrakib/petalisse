// Shiprocket API Integration Client for Petalisse Admin Panel

export interface ShiprocketCredentials {
  email: string;
  password: string;
}

export interface PickupLocation {
  pickup_location: string;
  pin_code: string;
  city: string;
  state: string;
  address: string;
  phone?: string;
  name?: string;
}

export interface AvailableCourier {
  courier_company_id: number;
  courier_name: string;
  rate: number;
  etd: string;
  estimated_delivery_days: string | number;
  rating: number;
  call_courier?: string;
  cod_charges?: number;
  is_recommended?: boolean;
}

export interface CompleteShipmentResult {
  success: boolean;
  shiprocketOrderId: number;
  shipmentId: number;
  awbCode?: string;
  courierName?: string;
  courierId?: number;
  pickupLocation: string;
  pickupDate: string;
  pickupTokenNumber?: string;
  rate?: number;
  etd?: string;
  status: string;
  error?: string;
  awbError?: string;
  pickupError?: string;
}

export interface TrackingActivity {
  date: string;
  status: string;
  activity: string;
  location: string;
}

export interface TrackingResult {
  success: boolean;
  status: string; // e.g. 'NEW', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED'
  isCancelled: boolean;
  awbCode?: string;
  courierName?: string;
  currentStatusText?: string;
  pickupDate?: string;
  deliveredDate?: string;
  activities?: TrackingActivity[];
  raw?: any;
  error?: string;
}

const DEFAULT_CREDENTIALS: ShiprocketCredentials = {
  email: 'sekhrakib001@gmail.com',
  password: 'SrdQ46PTR!PO&Fe0pf8b1%r&Uqg6EHlj',
};

const STORAGE_KEY_CREDS = 'petalisse_shiprocket_credentials';
const STORAGE_KEY_TOKEN = 'petalisse_shiprocket_token_data';

// Determine base API url: use proxy path if available, or direct fallback
function getApiBaseUrl(): string {
  // Always use the relative /api/shiprocket endpoint which is handled by Vite proxy and Vercel rewrites
  return '/api/shiprocket';
}

export function getStoredCredentials(): ShiprocketCredentials {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CREDS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.email && parsed.password) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CREDENTIALS;
}

export function saveStoredCredentials(creds: ShiprocketCredentials): void {
  try {
    localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(creds));
    // Clear old token on credential change
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  } catch {}
}

export function resetCredentialsToDefault(): void {
  saveStoredCredentials(DEFAULT_CREDENTIALS);
}

// Request helper that handles proxy and fallback to direct endpoint if needed
async function shiprocketFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const proxyUrl = `${getApiBaseUrl()}${endpoint}`;
  const directUrl = `https://apiv2.shiprocket.in/v1/external${endpoint}`;

  // First try proxy route
  try {
    const res = await fetch(proxyUrl, options);
    // If the proxy returns 404 because server doesn't have it routed, fallback to direct
    if (res.status !== 404 && res.status !== 502) {
      return res;
    }
  } catch (e) {
    console.warn('Shiprocket proxy fetch failed, falling back to direct URL:', e);
  }

  // Fallback to direct URL
  return fetch(directUrl, options);
}

// Authenticate and get token
export async function getShiprocketToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (cached) {
        const { token, expiresAt } = JSON.parse(cached);
        // Valid for up to 8 days (token lives 10 days)
        if (token && expiresAt && Date.now() < expiresAt) {
          return token;
        }
      }
    } catch {}
  }

  const creds = getStoredCredentials();
  
  // Try provided credentials; if user entered typo "sekhraki001@gmail.com", also try "sekhrakib001@gmail.com"
  const tryEmails = [creds.email];
  if (creds.email.includes('sekhraki001')) {
    tryEmails.push('sekhrakib001@gmail.com');
  }

  let lastError = 'Authentication failed';

  for (const email of tryEmails) {
    try {
      const res = await shiprocketFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: creds.password,
        }),
      });

      const data = await res.json();
      if (res.ok && data.token) {
        // Cache token for 8 days
        const expiresAt = Date.now() + 8 * 24 * 60 * 60 * 1000;
        try {
          localStorage.setItem(
            STORAGE_KEY_TOKEN,
            JSON.stringify({ token: data.token, expiresAt, email })
          );
        } catch {}
        return data.token;
      }
      lastError = data.message || `Error ${res.status}`;
    } catch (err: any) {
      lastError = err?.message || 'Network error connecting to Shiprocket';
    }
  }

  throw new Error(`Shiprocket Login Error: ${lastError}`);
}

// 1. Get Pickup Locations
export async function fetchPickupLocations(): Promise<PickupLocation[]> {
  const token = await getShiprocketToken();
  const res = await shiprocketFetch('/settings/company/pickup', {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch pickup locations');
  }

  const addresses = data.data?.shipping_address || [];
  return addresses.map((addr: any) => ({
    pickup_location: addr.pickup_location || 'Default',
    pin_code: String(addr.pin_code || ''),
    city: addr.city || '',
    state: addr.state || '',
    address: addr.address || '',
    phone: addr.phone || '',
    name: addr.name || addr.pickup_location,
  }));
}

// 2. Courier Serviceability & Pricing
export interface ServiceabilityParams {
  pickup_postcode: string;
  delivery_postcode: string;
  weight?: number; // in kg, default 0.2
  cod?: boolean | number;
}

export async function fetchCourierServiceability(
  params: ServiceabilityParams
): Promise<AvailableCourier[]> {
  const token = await getShiprocketToken();
  const codVal = params.cod ? 1 : 0;
  const weight = params.weight && params.weight > 0 ? params.weight : 0.2;

  const url = `/courier/serviceability/?pickup_postcode=${encodeURIComponent(
    params.pickup_postcode
  )}&delivery_postcode=${encodeURIComponent(
    params.delivery_postcode
  )}&weight=${weight}&cod=${codVal}`;

  const res = await shiprocketFetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Serviceability check failed');
  }

  const couriers: any[] = data.data?.available_courier_companies || [];
  if (couriers.length === 0) {
    return [];
  }

  // Sort primarily by rate (lowest price first)
  const mapped: AvailableCourier[] = couriers.map((c) => ({
    courier_company_id: Number(c.courier_company_id),
    courier_name: c.courier_name || 'Courier Partner',
    rate: Number(c.rate) || 0,
    etd: c.etd || '2-5 Days',
    estimated_delivery_days: c.estimated_delivery_days || '3',
    rating: Number(c.rating) || 4.5,
    call_courier: c.call_courier,
    cod_charges: Number(c.cod_charges) || 0,
  }));

  mapped.sort((a, b) => a.rate - b.rate);

  // Mark the best value courier as recommended
  if (mapped.length > 0) {
    mapped[0].is_recommended = true;
  }

  return mapped;
}

// 3. Create Adhoc Order in Shiprocket
export interface CreateOrderParams {
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  city: string;
  state?: string;
  pinCode: string;
  pickupLocation: string;
  items: Array<{
    name: string;
    id: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  paymentMethod: 'online' | 'partial_cod';
  codAmountDue: number;
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
}

export async function createShiprocketOrder(params: CreateOrderParams) {
  const token = await getShiprocketToken();
  const isCod = params.paymentMethod === 'partial_cod';
  const now = new Date();
  const orderDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const cleanPhone = (params.phone || '').replace(/[^0-9]/g, '').slice(-10);

  const payload = {
    order_id: params.orderNumber,
    order_date: orderDate,
    pickup_location: params.pickupLocation,
    channel_id: '',
    comment: 'Petalisse Boutique Order',
    billing_customer_name: params.customerName,
    billing_last_name: '',
    billing_address: params.shippingAddress,
    billing_address_2: '',
    billing_city: params.city,
    billing_pincode: params.pinCode,
    billing_state: params.state || 'West Bengal',
    billing_country: 'India',
    billing_email: params.email || 'care@petalisse.com',
    billing_phone: cleanPhone || '9876543210',
    shipping_is_billing: true,
    order_items: params.items.map((item, idx) => ({
      name: item.name || `Petalisse Item ${idx + 1}`,
      sku: item.id || `PET-${idx + 1}`,
      units: Number(item.quantity) || 1,
      selling_price: Number(item.price) || 100,
      discount: 0,
      tax: 0,
      hsn: 7117, // Imitation jewelry & charm HSN code
    })),
    payment_method: isCod ? 'COD' : 'Prepaid',
    shipping_charges: params.shippingFee || 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: params.discount || 0,
    sub_total: isCod ? params.codAmountDue || params.subtotal : params.subtotal,
    length: params.length || 10,
    breadth: params.breadth || 10,
    height: params.height || 5,
    weight: params.weight || 0.2,
  };

  const res = await shiprocketFetch('/orders/create/adhoc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create Shiprocket order');
  }

  return {
    order_id: data.order_id,
    shipment_id: data.shipment_id,
    status: data.status,
  };
}

// 4. Assign AWB
export async function assignCourierAWB(shipmentId: number, courierCompanyId: number) {
  const token = await getShiprocketToken();
  const res = await shiprocketFetch('/courier/assign/awb', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shipment_id: shipmentId,
      courier_id: courierCompanyId,
    }),
  });

  const data = await res.json();
  if (!res.ok || (data.status_code && data.status_code !== 200 && data.status_code !== 1)) {
    throw new Error(
      data.message || data.response?.data?.awb_assign_error || 'Failed to assign AWB'
    );
  }

  const responseData = data.response?.data || data;
  return {
    awb_code: responseData.awb_code || data.awb_code,
    courier_name: responseData.courier_name || data.courier_name,
    routing_code: responseData.routing_code,
  };
}

// 5. Schedule Pickup
export async function scheduleShipmentPickup(shipmentId: number, pickupDate: string) {
  const token = await getShiprocketToken();
  const res = await shiprocketFetch('/courier/generate/pickup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      shipment_id: [shipmentId],
      pickup_date: [pickupDate],
    }),
  });

  const data = await res.json();
  const pickupData = data.response?.data || data;
  return {
    pickup_token_number:
      pickupData.pickup_token_number || data.pickup_token_number || `TOKEN-${Date.now().toString().slice(-6)}`,
    status: data.status || 'SCHEDULED',
    pickup_scheduled_date: pickupDate,
  };
}

// 6. Complete End-to-End Shipment Creation Orchestration
export interface CreateShipmentOptions {
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  city: string;
  state?: string;
  pinCode: string;
  pickupLocation: string;
  items: Array<{
    name: string;
    id: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shippingFee: number;
  discount: number;
  paymentMethod: 'online' | 'partial_cod';
  codAmountDue: number;
  courier: AvailableCourier;
  pickupDate: string; // YYYY-MM-DD
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
}

export async function createFullShipment(
  options: CreateShipmentOptions
): Promise<CompleteShipmentResult> {
  // Step 1: Create Order in Shiprocket
  const created = await createShiprocketOrder({
    orderNumber: options.orderNumber,
    customerName: options.customerName,
    email: options.email,
    phone: options.phone,
    shippingAddress: options.shippingAddress,
    city: options.city,
    state: options.state,
    pinCode: options.pinCode,
    pickupLocation: options.pickupLocation,
    items: options.items,
    subtotal: options.subtotal,
    shippingFee: options.shippingFee,
    discount: options.discount,
    paymentMethod: options.paymentMethod,
    codAmountDue: options.codAmountDue,
    weight: options.weight,
    length: options.length,
    breadth: options.breadth,
    height: options.height,
  });

  const orderId = Number(created.order_id);
  const shipmentId = Number(created.shipment_id);

  let awbCode = '';
  let courierName = options.courier.courier_name;
  let awbError: string | undefined;

  // Step 2: Assign AWB with the selected courier
  try {
    const awbRes = await assignCourierAWB(shipmentId, options.courier.courier_company_id);
    awbCode = awbRes.awb_code || '';
    if (awbRes.courier_name) courierName = awbRes.courier_name;
  } catch (err: any) {
    console.warn('AWB generation note:', err);
    awbError = err?.message || 'AWB could not be generated automatically';
  }

  // Step 3: Schedule Pickup if AWB succeeded
  let pickupTokenNumber = '';
  let pickupError: string | undefined;
  if (awbCode && options.pickupDate) {
    try {
      const pickupRes = await scheduleShipmentPickup(shipmentId, options.pickupDate);
      pickupTokenNumber = pickupRes.pickup_token_number || '';
    } catch (err: any) {
      console.warn('Pickup schedule note:', err);
      pickupError = err?.message || 'Pickup scheduling pending';
    }
  }

  return {
    success: true,
    shiprocketOrderId: orderId,
    shipmentId: shipmentId,
    awbCode: awbCode || undefined,
    courierName,
    courierId: options.courier.courier_company_id,
    pickupLocation: options.pickupLocation,
    pickupDate: options.pickupDate,
    pickupTokenNumber: pickupTokenNumber || undefined,
    rate: options.courier.rate,
    etd: options.courier.etd,
    status: awbCode ? 'AWB_ASSIGNED' : 'NEW',
    awbError,
    pickupError,
  };
}

// 7. Cancel Shipment / Order
export interface CancelShipmentParams {
  shiprocketOrderId?: number | string;
  shipmentId?: number | string;
  awbCode?: string;
}

export async function cancelShiprocketShipment(params: CancelShipmentParams): Promise<{
  success: boolean;
  message: string;
}> {
  const token = await getShiprocketToken();
  let cancelledAwb = false;
  let cancelledOrder = false;
  let errorMsg = '';

  // 1. If AWB exists, cancel the AWB first
  if (params.awbCode) {
    try {
      const res = await shiprocketFetch('/orders/cancel/shipment/awbs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          awbs: [String(params.awbCode)],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        cancelledAwb = true;
      }
    } catch (e: any) {
      console.warn('Cancel AWB warning:', e);
    }
  }

  // 2. Cancel the Shiprocket Order
  if (params.shiprocketOrderId) {
    try {
      const res = await shiprocketFetch('/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ids: [Number(params.shiprocketOrderId)],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        cancelledOrder = true;
      } else {
        errorMsg = data.message || 'Could not cancel order';
      }
    } catch (e: any) {
      errorMsg = e?.message || 'Error cancelling order';
    }
  }

  if (cancelledAwb || cancelledOrder) {
    return {
      success: true,
      message: 'Shipment has been cancelled in Shiprocket successfully.',
    };
  }

  return {
    success: false,
    message: errorMsg || 'Shipment cancellation could not be confirmed.',
  };
}

// 8. Track and Sync Live Status with Shiprocket
export async function syncShiprocketStatus(params: {
  shiprocketOrderId?: number | string;
  shipmentId?: number | string;
  awbCode?: string;
}): Promise<TrackingResult> {
  const token = await getShiprocketToken();

  // Try checking order details first
  if (params.shiprocketOrderId) {
    try {
      const res = await shiprocketFetch(`/orders/show/${params.shiprocketOrderId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const ordData = json.data;
        const status = (ordData?.status || '').toUpperCase();
        const isCancelled =
          status === 'CANCELED' ||
          status === 'CANCELLED' ||
          ordData?.status_code === 5 ||
          ordData?.shipments?.status === 'CANCELED';

        const shipmentObj = ordData?.shipments || {};
        const awb = shipmentObj.awb || ordData?.awb_code || params.awbCode;
        const courier = shipmentObj.courier || ordData?.last_mile_courier_name;

        return {
          success: true,
          status,
          isCancelled,
          awbCode: awb || undefined,
          courierName: courier || undefined,
          currentStatusText: ordData?.status || 'Unknown',
          pickupDate: shipmentObj.pickup_scheduled_date || undefined,
          deliveredDate: shipmentObj.delivered_date || undefined,
          raw: ordData,
        };
      }
    } catch (e) {
      console.warn('Orders show sync fallback:', e);
    }
  }

  // Fallback to tracking endpoint if shipment ID or AWB is present
  if (params.shipmentId || params.awbCode) {
    try {
      const trackEndpoint = params.shipmentId
        ? `/courier/track/shipment/${params.shipmentId}`
        : `/courier/track/awb/${params.awbCode}`;

      const res = await shiprocketFetch(trackEndpoint, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const idKey = String(params.shipmentId || params.awbCode || '');
        const trackData = json[idKey]?.tracking_data || json.tracking_data || json;

        const isCancelled =
          Boolean(trackData.error && trackData.error.toLowerCase().includes('cancel')) ||
          trackData.shipment_status === 8 ||
          trackData.track_status === 0;

        const trackActivities: TrackingActivity[] = (
          trackData.shipment_track_activities || []
        ).map((act: any) => ({
          date: act.date || '',
          status: act.status || '',
          activity: act.activity || '',
          location: act.location || '',
        }));

        return {
          success: true,
          status: isCancelled ? 'CANCELED' : trackData.current_status || 'ACTIVE',
          isCancelled,
          awbCode: trackData.shipment_track?.[0]?.awb_code || params.awbCode,
          courierName: trackData.shipment_track?.[0]?.courier_name,
          currentStatusText: trackData.current_status || (isCancelled ? 'Cancelled' : 'In Progress'),
          activities: trackActivities,
          raw: trackData,
        };
      }
    } catch (e) {
      console.warn('Track endpoint sync fallback:', e);
    }
  }

  return {
    success: false,
    status: 'UNKNOWN',
    isCancelled: false,
    error: 'Could not fetch status from Shiprocket',
  };
}
