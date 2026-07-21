export type UserRole = 'platform_admin' | 'business_owner' | 'manager' | 'staff' | 'client' | 'business_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  preferences?: string[];
  balance: number;
  businessName?: string;
  businessCategory?: string;
  businessDescription?: string;
}

export type TableShape = 'circle' | 'rect';
export type TableType = 'vip' | 'window' | 'standard' | 'terrace';

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  cuisine: string;
  rooms: {
    main: string;
    vip: string;
    terrace: string;
  };
}

export interface Salon {
  id: string;
  name: string;
  description: string;
  category: 'Spa & Wellness' | 'Fitness & Active' | 'Beauty & Style';
  image: string;
  rating: number;
  address: string;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: TableShape;
  type: TableType;
  room: 'main' | 'vip' | 'terrace';
  price: number;
  restaurantId?: string;
  status?: 'available' | 'booked' | 'reserved';
}

export interface Service {
  id: string;
  name: string;
  category: 'Spa & Wellness' | 'Fitness & Active' | 'Beauty & Style';
  duration: number; // in minutes
  price: number;
  rating: number;
  description: string;
  image: string;
  staff: StaffMember[];
  salonId?: string;
  salonName?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  rating: number;
  avatar: string;
}

export interface TableBooking {
  id: string;
  userId: string;
  type: 'table';
  tableId: string;
  tableNumber: number;
  room: 'main' | 'vip' | 'terrace';
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  guests: number;
  notes?: string;
  createdAt: string;
  price: number;
  restaurantId?: string;
  restaurantName?: string;
  checkedIn?: boolean;
}

export interface ServiceBooking {
  id: string;
  userId: string;
  type: 'service';
  serviceId: string;
  serviceName: string;
  category: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  createdAt: string;
  price: number;
  salonId?: string;
  salonName?: string;
  duration?: number;
  checkedIn?: boolean;
}

export interface Review {
  id: string;
  restaurantId: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  rating: number;
  text: string;
  createdAt: string;
  isVerified?: boolean;
}

export interface Hotel {
  id: string;
  name: string;
  description: string;
  images: string[];
  rating: number;
  address: string;
  amenities: string[];
}

export interface Room {
  id: string;
  hotelId: string;
  type: string;
  pricePerNight: number;
  capacity: number;
  bedsCount: number;
  isAvailable?: boolean;
}

export interface HotelBooking {
  id: string;
  userId: string;
  type: 'hotel';
  hotelId: string;
  hotelName: string;
  roomId: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  totalGuests: number;
  totalCost: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  checkedIn?: boolean;
  // Polymorphic union helper properties
  date?: string;
  time?: string;
  price?: number;
  serviceName?: string;
  staffName?: string;
  category?: string;
  tableNumber?: number;
  salonName?: string;
  restaurantName?: string;
}

export type Booking = TableBooking | ServiceBooking | HotelBooking;

export interface AIRecommendation {
  summary: string;
  suggestedServiceIds: string[];
  suggestedTableIds: string[];
  tips: string[];
  promoCode?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reminder' | 'offer' | 'status';
  read: boolean;
  createdAt: string;
  linkToModule?: 'dashboard' | 'tabletop' | 'bookly';
}

