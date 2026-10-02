export interface ProductVariant {
  name: string;
  options: string[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  discountedPrice?: number;
  img: string;
  images?: string[];
  alt?: string;
  description: string;
  badge?: string;
  details?: string[];
  colors?: string[];
  variants?: ProductVariant[];
  isFavorite?: boolean;
  createdAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  phone?: string;
  isAdmin?: boolean;
  wishlist?: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface Address {
  id?: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  img: string;
  selectedColor?: string;
  selectedVariant?: string;
}

export interface OrderShipmentInfo {
  shiprocketOrderId?: number | string;
  shipmentId?: number | string;
  awbCode?: string;
  courierName?: string;
  courierId?: number;
  pickupLocation?: string;
  pickupDate?: string;
  pickupTokenNumber?: string;
  rate?: number;
  etd?: string;
  status?: string; // 'NEW', 'AWB_ASSIGNED', 'PICKUP_SCHEDULED', 'IN_TRANSIT', 'DELIVERED', 'CANCELED'
  cancelledAt?: string;
  updatedAt?: string;
  raw?: any;
}

export interface Order {
  id?: string;
  orderNumber?: string;
  userId?: string;
  userEmail: string;
  customerName: string;
  shippingAddress: string;
  city?: string;
  state?: string;
  pinCode?: string;
  phone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'online' | 'partial_cod';
  amountPaid: number;
  codAmountDue: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shipment?: OrderShipmentInfo;
  createdAt: any;
}

export interface SplashScreenConfig {
  enabled: boolean;
  mediaType: 'video' | 'gif' | 'lottie';
  mediaUrl: string;
  lottieData?: string;
  duration?: number; // duration in seconds
  autoDismiss?: boolean;
  showSkipButton?: boolean;
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  showOncePerSession?: boolean;
}

export interface SiteContent {
  announcementText?: string;
  heroTagline?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBannerUrl?: string;
  collectionCovers?: Record<string, string>;
  collectionOrder?: string[];
  featuredProductIds?: string[];
  bestSellerProductIds?: string[];
  promoBannerText?: string;
  promoBannerSubtext?: string;
  promoBannerUrl?: string;
  aboutTitle?: string;
  aboutDescription?: string;
  aboutImageUrl?: string;
  craftsmanshipTitle?: string;
  craftsmanshipText?: string;
  fabricItems?: Array<{ title: string; desc: string; img: string }>;
  splashScreen?: SplashScreenConfig;
}
