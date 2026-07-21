import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, 
  Clock, 
  User, 
  Users, 
  Check, 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft,
  List,
  Info, 
  Compass, 
  LogOut, 
  Smile, 
  TrendingUp, 
  Coins, 
  Scissors, 
  Activity, 
  Map, 
  PhoneCall,
  Search,
  BookOpen,
  ArrowRight,
  Heart,
  Grid,
  Bell,
  QrCode,
  Camera,
  Sliders,
  Utensils,
  Star,
  ArrowLeft,
  Plus,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Navigation,
  Share2,
  Settings,
  Sun,
  Moon,
  Palette,
  MessageSquare,
  MessageCircle,
  Eye,
  Contrast,
  Bed,
  CalendarDays,
  Hotel as HotelIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { User as UserType, Table, Service, Booking, AIRecommendation, TableBooking, ServiceBooking, StaffMember, Restaurant, Salon, Hotel, Room, HotelBooking } from "./types";
import { INITIAL_HOTELS, INITIAL_ROOMS } from "./data/staysData";
import {
  listRestaurants,
  listSalons,
  listServices,
  listTables,
  registerRestaurant,
  registerSalon,
  bookTable,
  bookService,
} from "./lib/api";
import { useSupabaseSession, hasActiveSession } from "./lib/auth";
import { supabase } from "./integrations/supabase/client";
import RbacPanel from "./components/RbacPanel";
import StayBookingModule from "./components/StayBookingModule";
import AIConcierge from "./components/AIConcierge";
import InteractiveMapHub from "./components/InteractiveMapHub";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import Tabletop3DViewer from "./components/Tabletop3DViewer";
import RestaurantReviews from "./components/RestaurantReviews";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import QRScanner from "./components/QRScanner";
import WeatherWidget, { WeatherId, weatherPresets } from "./components/WeatherWidget";
import FullMonthCalendar from "./components/FullMonthCalendar";
import { 
  initCalendarAuth, 
  googleCalendarSignIn, 
  googleCalendarSignOut, 
  addBookingToGoogleCalendar, 
  fetchGoogleCalendarEvents, 
  deleteGoogleCalendarEvent, 
  CalendarEvent 
} from "./lib/googleCalendar";
import { RefreshCw, Trash2, Link2, ZoomIn, ZoomOut, ShieldAlert, Scale } from "lucide-react";
import PlatformControlPanel from "./components/PlatformControlPanel";
import TermsAndConditionsModal from "./components/TermsAndConditionsModal";
import InvestAndBack from "./components/InvestAndBack";
import { VenueModerationItem, ComplianceViolation, LegalPolicySettings, CrowdfundingCampaign } from "./types";

const INITIAL_VENUES: VenueModerationItem[] = [
  {
    id: "rest-1",
    name: "Omni Gourmet Dining",
    category: "Gourmet Restaurant",
    module: "tabletop",
    ownerName: "Александр Великий",
    ownerEmail: "alex.owner@omni.ru",
    status: "Active",
    rating: 4.9,
    totalBookings: 1420,
    complianceScore: 99,
    lastAuditDate: "2026-07-01",
    verifiedBadge: true
  },
  {
    id: "rest-2",
    name: "Skyline Lounge & Terrace",
    category: "Pan-Asian Lounge",
    module: "tabletop",
    ownerName: "Елена Небо",
    ownerEmail: "elena.skyline@omni.ru",
    status: "Active",
    rating: 4.8,
    totalBookings: 890,
    complianceScore: 96,
    lastAuditDate: "2026-06-28",
    verifiedBadge: true
  },
  {
    id: "salon-1",
    name: "Lotus Spa Salon",
    category: "Spa & Wellness",
    module: "bookly",
    ownerName: "Виктор Владелец",
    ownerEmail: "victor@lotusspa.ru",
    status: "Active",
    rating: 4.9,
    totalBookings: 610,
    complianceScore: 98,
    lastAuditDate: "2026-07-05",
    verifiedBadge: true
  },
  {
    id: "salon-2",
    name: "Gold Gym Active",
    category: "Fitness & Active",
    module: "bookly",
    ownerName: "Игорь Тренер",
    ownerEmail: "igor@goldgym.ru",
    status: "Under Review",
    statusReason: "Customer complaints regarding schedule overlap",
    rating: 4.5,
    totalBookings: 340,
    complianceScore: 82,
    lastAuditDate: "2026-07-10",
    verifiedBadge: false
  },
  {
    id: "salon-3",
    name: "Dent Clinic Pro",
    category: "Beauty & Medical",
    module: "bookly",
    ownerName: "Анна Мед",
    ownerEmail: "anna@dentclinic.ru",
    status: "Suspended",
    statusReason: "Violation of Section 3.2: Unilateral Booking Cancellation within 1h",
    rating: 4.1,
    totalBookings: 180,
    complianceScore: 68,
    lastAuditDate: "2026-07-08",
    verifiedBadge: false
  },
  {
    id: "hotel-1",
    name: "The Grand Atrium Oasis",
    category: "Luxury Spa Resort",
    module: "stay",
    ownerName: "Мария Оазис",
    ownerEmail: "maria@grandoasis.com",
    status: "Active",
    rating: 4.95,
    totalBookings: 520,
    complianceScore: 100,
    lastAuditDate: "2026-07-12",
    verifiedBadge: true
  }
];

const INITIAL_VIOLATIONS: ComplianceViolation[] = [
  {
    id: "vio-101",
    ticketNumber: "VIO-2026-101",
    venueId: "salon-3",
    venueName: "Dent Clinic Pro",
    reportedBy: "Customer (Dmitry K.)",
    type: "Unilateral Cancellation",
    severity: "High",
    description: "Venue cancelled confirmed service 45 minutes prior without providing alternative slot or instant deposit refund.",
    status: "Action Taken",
    createdAt: "2026-07-08",
    resolutionNote: "Venue suspended for 7 days. Penalty fee of 15% applied."
  },
  {
    id: "vio-102",
    ticketNumber: "VIO-2026-102",
    venueId: "salon-2",
    venueName: "Gold Gym Active",
    reportedBy: "System Audit Bot",
    type: "Price Manipulation",
    severity: "Medium",
    description: "In-app price listed as 2500 ₽, on-premise checkout requested 3200 ₽ citing unannounced equipment surcharge.",
    status: "Investigating",
    createdAt: "2026-07-10"
  },
  {
    id: "vio-103",
    ticketNumber: "VIO-2026-103",
    venueId: "rest-2",
    venueName: "Skyline Lounge & Terrace",
    reportedBy: "Customer (Elena V.)",
    type: "Quality Complaint",
    severity: "Low",
    description: "Table reserved at window was reassigned to center dining area without prior guest notification.",
    status: "Resolved",
    createdAt: "2026-07-04",
    resolutionNote: "Venue management provided 500 ₽ deposit voucher to guest."
  }
];

const INITIAL_LEGAL_SETTINGS: LegalPolicySettings = {
  version: "v2.5 - July 2026",
  lastUpdated: "2026-07-21",
  requireReacceptance: false,
  termsAndConditions: `OMNIRESERVE SUPERAPP - PLATFORM TERMS OF SERVICE (v2.5)

1. ACCEPTANCE OF TERMS
By accessing or using OmniReserve (including Tabletop dining reservations, Bookly appointments, Stay hotel bookings, and Invest & Back crowdfunding), you agree to be bound by these unified Terms of Service.

2. ACCOUNT REGISTRATION & VERIFICATION
- Users must provide authentic, non-duplicated profile information.
- Venue operators must maintain active business credentials and valid tax identification.

3. BOOKING DEPOSITS & WALLET SETTLEMENTS
- Deposits held in OmniReserve user balances are protected until digital QR check-in or booking completion.
- Cancellations made prior to the free cancellation window (minimum 2 hours) are refunded in full.

4. PLATFORM MODERATION & DISPUTE ARBITRATION
OmniReserve reserves the right to suspend, audit, or ban any venue or user account violating compliance standards.

5. CROWDFUNDING & VENUE BACKING
- Funds contributed through the Invest & Back module are held in escrow by OmniReserve until the campaign reaches its funding goal or a refund/cancellation event is authorized.
- Backing is not a guaranteed investment; venues assume full responsibility for reward fulfillment and project completion.`,
  privacyPolicy: `OMNIRESERVE DATA PRIVACY POLICY (v2.5)

1. DATA COLLECTION & PROTECTION
OmniReserve collects minimal required personal data (name, email, phone number, and reservation logs) strictly for fulfillment of booking requests and loyalty tracking.

2. THIRD-PARTY DATA ISOLATION
We do not sell, rent, or trade personal guest data to external marketing agencies. Venue operators receive guest contact details exclusively for reservation fulfillment.

3. ENCRYPTION & COMPLIANCE
All payment transaction details and database records are encrypted in transit and at rest in compliance with regional data privacy standards.`,
  businessRules: `BUSINESS OPERATOR & VENUE GOVERNANCE RULES

1.1 REAL-TIME INVENTORY GUARANTEE
Partner venues must keep real-time slot synchronization active. Artificially closing availability while accepting off-app reservations is prohibited.

1.2 ANTI-CANCELLATION PENALTIES
Unilateral cancellations within 2 hours of arrival without proven force majeure incur a 15% platform penalty fee and a compliance strike.

1.3 TRANSPARENT PRICING COMMITMENT
On-premise charges must match in-app prices exactly. Surcharging customers above agreed rates triggers immediate suspension.`,
  customerRules: `CUSTOMER RESERVATION & NO-SHOW RULES

2.1 ARRIVAL GRACE PERIOD
Tabletop table reservations are held for exactly 15 minutes past the scheduled time before being released.

2.2 NO-SHOW PENALTY & STRIKES
Failing to show up without cancelling at least 1 hour prior results in full deposit forfeiture. Accounts accumulating 3 no-show strikes incur temporary reservation locks.`,
  disclaimer: `PLATFORM LIABILITY DISCLAIMER

3.1 THIRD-PARTY SERVICE QUALITY
OmniReserve acts as a technology marketplace connecting guests with independent venues. Food quality, spa service execution, and hotel amenities remain the direct liability of the venue.

3.2 ARBITRATION PROTOCOL
Disputes are mediated by OmniReserve Platform Controls team prior to formal arbitration.`,
  crowdfundingTerms: `CROWDFUNDING & INVESTOR RISK DISCLAIMER

4.1 BACKING IS NOT A GUARANTEED INVESTMENT
Contributing to a venue crowdfunding campaign through Invest & Back is a voluntary pledge for rewards, not a financial security, equity stake, or guaranteed return. Backers accept the risk that the venue may be unable to complete the project or deliver rewards as described.

4.2 ESCROW & FUND RELEASE POLICY
All funds are collected into an OmniReserve managed escrow account. Pledged funds are released to the venue only after the campaign reaches its stated funding goal and passes a compliance review. If a campaign fails, is cancelled, or is refunded by the Super Admin, pledged funds are returned to the backer's OmniReserve deposit balance.

4.3 REWARD FULFILLMENT OBLIGATIONS
Venues must honor all tier rewards to eligible backers once the campaign completes and funds are released. Failure to deliver rewards may result in compliance strikes, suspension from the platform, and mandatory refund processing.`,
  crowdfundingEscrow: `ESCROW SAFEGUARDS & FINANCIAL COMPLIANCE

5.1 SEGREGATED ESCROW ACCOUNTS
Crowdfunding proceeds are held in segregated escrow wallets separate from OmniReserve operational funds and venue operating accounts. Daily reconciliation is performed by the Platform Controls team.

5.2 REFUND & CANCELLATION AUTHORITY
OmniReserve Super Admins reserve the right to pause, refund, or cancel any campaign that violates platform policies, misrepresents its budget, or fails to meet legal compliance requirements. Refunds are credited to the original backer's deposit balance.

5.3 ANTI-MONEY LAUNDERING & KYC
Venues launching crowdfunding campaigns must pass enhanced identity verification and business documentation review before funds are released. Large tier contributions may trigger additional KYC checks.`,
  crowdfundingVenueObligations: `VENUE FULFILLMENT OBLIGATIONS FOR BACKERS

6.1 PROJECT COMPLETION TIMELINE
Venues must publish and adhere to a milestone timeline for the funded expansion. Delays longer than 30 days beyond the communicated timeline must be disclosed to backers through the platform.

6.2 REWARD DELIVERY & REDEMPTION
Tier rewards (e.g., dining bonuses, VIP tables, concierge access, cashback on deposits) must be tracked in the backer's OmniReserve account and redeemable through the normal booking flow. Venues cannot impose additional charges or redemption restrictions not disclosed in the original campaign.

6.3 DISPUTE RESOLUTION FOR REWARDS
Disputes over reward delivery are mediated by the Platform Controls team under the same Compliance Violations framework used for booking disputes. Backers may escalate unresolved disputes to formal arbitration after 30 days.`
};

const INITIAL_CAMPAIGNS: CrowdfundingCampaign[] = [
  {
    id: 'campaign-1',
    title: 'Grand Terrace — Summer Rooftop Expansion',
    venueId: 'rest-2',
    venueName: 'Skyline Lounge & Terrace',
    venueTag: 'Tabletop',
    category: 'Dining',
    description: 'Transform our rooftop terrace into a premium summer dining destination with climate-controlled pergolas, an open-air sushi bar, and panoramic city views. Backers will enjoy early access and bonus dining deposits.',
    shortPitch: 'Help us build the most coveted rooftop table experience in the city.',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1525610553991-2bede4a236e7?auto=format&fit=crop&w=1200&q=80'
    ],
    fundingGoal: 125000,
    raisedAmount: 67800,
    daysRemaining: 18,
    status: 'Active',
    budgetAllocation: [
      { category: 'Pergolas & Shade', percentage: 35, amount: 43750 },
      { category: 'Outdoor Kitchen', percentage: 30, amount: 37500 },
      { category: 'Furniture & Lighting', percentage: 20, amount: 25000 },
      { category: 'Permits & Safety', percentage: 15, amount: 18750 }
    ],
    riskDisclaimer: 'Rooftop construction is subject to weather, permitting delays, and city zoning approvals. If the project is cancelled, pledged funds will be refunded to your OmniReserve balance.',
    tiers: [
      { name: 'Bronze', amount: 100, bonus: '15% bonus on dining deposit', reward: 'Early access to rooftop bookings before public launch.' },
      { name: 'Gold', amount: 500, bonus: '25% bonus deposit', reward: 'Named VIP Table/Seat for the summer season + Priority Tabletop reservation privilege.' },
      { name: 'Platinum Partner', amount: 2500, bonus: 'VIP event invites + Personal concierge', reward: 'Lifetime 10% cash-back on all deposits at Grand Terrace.' }
    ],
    backers: 124,
    createdAt: '2026-07-01',
    ownerEmail: 'elena.skyline@omni.ru',
    escrowDeposited: 67800
  },
  {
    id: 'campaign-2',
    title: 'Luxe Spa — Cryo Chamber Launch',
    venueId: 'salon-1',
    venueName: 'Luxe Spa & Wellness',
    venueTag: 'Bookly',
    category: 'Spa & Wellness',
    description: 'Install a state-of-the-art cryotherapy chamber and recovery lounge to expand our wellness offerings. Backers unlock priority appointments and complimentary wellness credits.',
    shortPitch: 'Be first to experience recovery at sub-zero temperatures.',
    images: [
      'https://images.unsplash.com/photo-1540555700478-65d2f2ad8f35?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600334089648-b0d9d3025ebf?auto=format&fit=crop&w=1200&q=80'
    ],
    fundingGoal: 85000,
    raisedAmount: 42100,
    daysRemaining: 24,
    status: 'Active',
    budgetAllocation: [
      { category: 'Cryo Chamber Equipment', percentage: 50, amount: 42500 },
      { category: 'Recovery Lounge Build', percentage: 25, amount: 21250 },
      { category: 'Staff Training', percentage: 15, amount: 12750 },
      { category: 'Safety & Certification', percentage: 10, amount: 8500 }
    ],
    riskDisclaimer: 'Medical equipment procurement may experience delivery delays. Luxe Spa will provide alternative wellness credits if the cryo chamber launch is postponed.',
    tiers: [
      { name: 'Bronze', amount: 100, bonus: '15% bonus on service deposit', reward: 'Early access to cryo chamber bookings.' },
      { name: 'Gold', amount: 500, bonus: '25% bonus deposit', reward: 'Named VIP recovery seat + priority Bookly appointment privilege.' },
      { name: 'Platinum Partner', amount: 2500, bonus: 'VIP wellness events + personal concierge', reward: 'Lifetime 10% cash-back on deposits at Luxe Spa.' }
    ],
    backers: 87,
    createdAt: '2026-07-05',
    ownerEmail: 'spa.owner@omni.ru',
    escrowDeposited: 42100
  },
  {
    id: 'campaign-3',
    title: 'Atrium Oasis — Suite Tower Expansion',
    venueId: 'hotel-1',
    venueName: 'The Grand Atrium Oasis',
    venueTag: 'Stays',
    category: 'Hotel Expansion',
    description: 'Expand our boutique hotel with twelve luxury suite rooms featuring in-room spa tubs, private balconies, and smart concierge tablets. Backers receive complimentary nights and upgrade privileges.',
    shortPitch: 'Invest in the next chapter of luxury stays.',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80'
    ],
    fundingGoal: 320000,
    raisedAmount: 185000,
    daysRemaining: 31,
    status: 'Active',
    budgetAllocation: [
      { category: 'Room Construction', percentage: 45, amount: 144000 },
      { category: 'Spa Fixtures & Tech', percentage: 25, amount: 80000 },
      { category: 'Interior Design', percentage: 20, amount: 64000 },
      { category: 'Permits & Inspections', percentage: 10, amount: 32000 }
    ],
    riskDisclaimer: 'Hotel construction is subject to permitting, contractor schedules, and material availability. Backers will be notified of milestone delays and may request refunds if the project is cancelled.',
    tiers: [
      { name: 'Bronze', amount: 100, bonus: '15% bonus on stay deposit', reward: 'Early access to new suite bookings.' },
      { name: 'Gold', amount: 500, bonus: '25% bonus deposit', reward: 'Complimentary suite upgrade on your next stay + priority late checkout.' },
      { name: 'Platinum Partner', amount: 2500, bonus: 'VIP opening invite + personal concierge', reward: 'Lifetime 10% cash-back on all OmniStay deposits at Atrium Oasis.' }
    ],
    backers: 215,
    createdAt: '2026-06-28',
    ownerEmail: 'hotel.owner@omni.ru',
    escrowDeposited: 185000
  },
  {
    id: 'campaign-4',
    title: 'Omni Gourmet — Chef Table Experience',
    venueId: 'rest-1',
    venueName: 'Omni Gourmet Dining',
    venueTag: 'Tabletop',
    category: 'Featured',
    description: 'Create an exclusive chef counter with twelve seats, an omakase tasting menu, and live-fire kitchen theater. Backers become founding members of the Chef Circle.',
    shortPitch: 'Join the founding circle of our most intimate dining experience.',
    images: [
      'https://images.unsplash.com/photo-1550966871-3ed3c47e2ce2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80'
    ],
    fundingGoal: 95000,
    raisedAmount: 95000,
    daysRemaining: 5,
    status: 'Completed',
    budgetAllocation: [
      { category: 'Kitchen Build-Out', percentage: 40, amount: 38000 },
      { category: 'Chef Counter & Seating', percentage: 30, amount: 28500 },
      { category: 'Tableware & Glassware', percentage: 20, amount: 19000 },
      { category: 'Marketing & Launch', percentage: 10, amount: 9500 }
    ],
    riskDisclaimer: 'The Chef Table Experience is fully funded. Funds will be released in tranches tied to construction milestones.',
    tiers: [
      { name: 'Bronze', amount: 100, bonus: '15% bonus on dining deposit', reward: 'Early reservation window for the first month.' },
      { name: 'Gold', amount: 500, bonus: '25% bonus deposit', reward: 'Named chef counter seat + priority booking for special events.' },
      { name: 'Platinum Partner', amount: 2500, bonus: 'VIP opening dinners + personal concierge', reward: 'Lifetime 10% cash-back on deposits at Omni Gourmet.' }
    ],
    backers: 156,
    createdAt: '2026-06-15',
    ownerEmail: 'alex.owner@omni.ru',
    escrowDeposited: 95000
  }
];

export default function App() {
  // Centralized Supabase session — single source of truth for auth checks.
  // The app's local `user` state below is still driven by the legacy
  // /api/auth/* flow, but any imperative side-effect (analytics, bookings
  // reminders, notifications) should gate on `supabaseSession` so signed-out
  // visitors don't trigger failing authenticated requests.
  const { session: supabaseSession } = useSupabaseSession();
  const { t, i18n } = useTranslation();

  // Auth state
  const [user, setUser] = useState<UserType | null>(null);
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [signupType, setSignupType] = useState<'client' | 'business'>('client');
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("Spa & Wellness");
  const [businessDescription, setBusinessDescription] = useState("");

  // App core state
  const [activeModule, setActiveModule] = useState<'dashboard' | 'tabletop' | 'bookly' | 'rbac' | 'ai-assistant' | 'stays' | 'analytics' | 'platform' | 'invest'>('ai-assistant');
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminGateError, setAdminGateError] = useState("");
  const [venues, setVenues] = useState<VenueModerationItem[]>(INITIAL_VENUES);
  const [violations, setViolations] = useState<ComplianceViolation[]>(INITIAL_VIOLATIONS);
  const [legalSettings, setLegalSettings] = useState<LegalPolicySettings>(INITIAL_LEGAL_SETTINGS);
  const [campaigns, setCampaigns] = useState<CrowdfundingCampaign[]>(INITIAL_CAMPAIGNS);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [userAcceptedVersion, setUserAcceptedVersion] = useState<string>("v2.5 - July 2026");
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Stay bookings database state
  const [hotels, setHotels] = useState<Hotel[]>(INITIAL_HOTELS);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([
    {
      id: "hbook-1",
      userId: "user-1",
      type: "hotel",
      hotelId: "hotel-1",
      hotelName: "The Grand Atrium Oasis",
      roomId: "room-101",
      roomType: "Deluxe Suite with Spa View",
      checkInDate: "2026-07-15",
      checkOutDate: "2026-07-18",
      totalGuests: 2,
      totalCost: 37500,
      status: "confirmed",
      createdAt: "2026-07-10T12:00:00.000Z"
    },
    {
      id: "hbook-2",
      userId: "user-2",
      type: "hotel",
      hotelId: "hotel-2",
      hotelName: "Alpine Summit Retreat",
      roomId: "room-201",
      roomType: "Panoramic Summit Room",
      checkInDate: "2026-07-14",
      checkOutDate: "2026-07-16",
      totalGuests: 1,
      totalCost: 19000,
      status: "confirmed",
      createdAt: "2026-07-09T14:30:00.000Z"
    }
  ]);

  // Stay booking search state
  const [stayDestination, setStayDestination] = useState<string>("all");
  const [stayCheckIn, setStayCheckIn] = useState<string>("2026-07-15");
  const [stayCheckOut, setStayCheckOut] = useState<string>("2026-07-18");
  const [stayGuests, setStayGuests] = useState<number>(2);
  const [services, setServices] = useState<Service[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  
  // Business Registration states
  const [showRegisterSalonModal, setShowRegisterSalonModal] = useState(false);
  const [showRegisterRestaurantModal, setShowRegisterRestaurantModal] = useState(false);

  // New salon form state
  const [newSalonForm, setNewSalonForm] = useState({
    name: "",
    description: "",
    category: "Spa & Wellness" as 'Spa & Wellness' | 'Fitness & Active' | 'Beauty & Style',
    address: "",
    image: "",
    serviceName: "",
    servicePrice: "",
    serviceDuration: "60"
  });

  // New restaurant form state
  const [newRestaurantForm, setNewRestaurantForm] = useState({
    name: "",
    description: "",
    cuisine: "European",
    tablesCount: "8",
    image: ""
  });
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [loadingSalons, setLoadingSalons] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [registeringSalon, setRegisteringSalon] = useState(false);
  const [registeringRestaurant, setRegisteringRestaurant] = useState(false);

  // AI Recommendation state
  const [recommendation, setRecommendation] = useState<AIRecommendation | null>(null);
  const [recoLoading, setRecoLoading] = useState(false);

  // Tabletop reservation parameters
  const [selectedRoom, setSelectedRoom] = useState<'main' | 'vip' | 'terrace'>('main');
  const [tabletopDate, setTabletopDate] = useState("2026-07-11");
  const [tabletopTime, setTabletopTime] = useState("19:00");
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedTables, setSelectedTables] = useState<Table[]>([]);
  const [hoveredSvgTable, setHoveredSvgTable] = useState<Table | null>(null);

  // Automatically clear selectedTables if selectedTable becomes null
  useEffect(() => {
    if (selectedTable === null) {
      setSelectedTables([]);
    }
  }, [selectedTable]);

  // Redirect client users away from RBAC if they somehow access it
  useEffect(() => {
    if (user && user.role === 'client' && activeModule === 'rbac') {
      setActiveModule('ai-assistant');
    }
  }, [user, activeModule]);

  // Toggle multiple selected tables
  const handleTableSelectToggle = (t: Table) => {
    const isBooked = bookings.some(b => b.type === 'table' && b.tableId === t.id && b.date === tabletopDate && b.time === tabletopTime);
    if (t.status === 'booked' || isBooked) return;

    setSelectedTables(prev => {
      const isAlreadySelected = prev.some(item => item.id === t.id);
      let updated: Table[];
      if (isAlreadySelected) {
        updated = prev.filter(item => item.id !== t.id);
      } else {
        // Restrict selection of multiple tables to same roomzone for visual consistency
        if (prev.length > 0 && prev[0].room !== t.room) {
          toast.error(i18n.language === 'ru' ? "Вы можете бронировать столы только в одной зоне за раз." : i18n.language === 'hy' ? "Դուք կարող եք միաժամանակ սեղաններ ամրագրել միայն մեկ գոտում:" : "You can only book tables in the same room zone at once.");
          updated = [t];
        } else {
          updated = [...prev, t];
        }
      }
      
      // Update selectedTable for backward-compatible rendering (points to the first selected table)
      setSelectedTable(updated.length > 0 ? updated[0] : null);
      
      // Update guests count based on the capacity
      const nextCapacity = updated.reduce((sum, item) => sum + item.capacity, 0);
      setGuestsCount(Math.min(nextCapacity, guestsCount === 0 ? 2 : guestsCount));

      return updated;
    });
  };
  const [guestsCount, setGuestsCount] = useState(2);
  const [tableNotes, setTableNotes] = useState("");
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState("");
  const [tableActionLoading, setTableActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    type: 'table' | 'service';
    title: string;
    details: string[];
    cost: number;
    onConfirm: () => void;
  } | null>(null);
  const [tableSearchQuery, setTableSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [partySizeFilter, setPartySizeFilter] = useState<number>(0);
  const [tableTypeFilter, setTableTypeFilter] = useState<string>('all');
  const [holdTimer, setHoldTimer] = useState<number | null>(null);
  const [holdTableId, setHoldTableId] = useState<string | null>(null);

  // Zoom & Pan states for SVG tabletop layout
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState<boolean>(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Reset zoom and pan when switching rooms
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
    setHasMoved(false);
  }, [selectedRoom]);

  // Non-passive wheel event handler to prevent page scroll while scrolling on the layout map
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      setZoom((prevZoom) => {
        const nextZoom = e.deltaY < 0 ? prevZoom * zoomFactor : prevZoom / zoomFactor;
        return Math.min(Math.max(nextZoom, 0.8), 4);
      });
    };

    svgEl.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      svgEl.removeEventListener('wheel', handleNativeWheel);
    };
  }, [viewMode]);

  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;

    if (Math.abs(dx - pan.x) > 5 || Math.abs(dy - pan.y) > 5) {
      setHasMoved(true);
    }

    setPan({ x: dx, y: dy });
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left click
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 1) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Bookly reservation parameters
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'Spa & Wellness' | 'Fitness & Active' | 'Beauty & Style'>('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [booklyDate, setBooklyDate] = useState("2026-07-11");
  const [booklyTime, setBooklyTime] = useState("15:00");
  const [serviceActionLoading, setServiceActionLoading] = useState(false);

  // Deposit balance addition helper
  const [addingBalance, setAddingBalance] = useState(false);
  const [depositAmount, setDepositAmount] = useState("5000");

  // Weather state for Tabletop summer terrace bookings
  const [currentWeatherId, setCurrentWeatherId] = useState<WeatherId>("sunny");

  // Dark/Light theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  // High contrast accessibility theme state
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('highContrast') === 'true';
  });

  // Header scroll state for dynamic animation
  const [scrolled, setScrolled] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Google Calendar Integration states
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const [googleCalendarUser, setGoogleCalendarUser] = useState<any>(null);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<CalendarEvent[]>([]);
  const [autoSyncToCalendar, setAutoSyncToCalendar] = useState<boolean>(() => {
    return localStorage.getItem("gcal_autosync") === "true";
  });
  const [syncedBookingIds, setSyncedBookingIds] = useState<Record<string, string>>({});
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");
  const [showSyncConfirmModal, setShowSyncConfirmModal] = useState(false);
  const [pendingSyncBooking, setPendingSyncBooking] = useState<any>(null);

  // Google Calendar Auth initialization listener
  useEffect(() => {
    const unsubscribe = initCalendarAuth(
      async (firebaseUser, token) => {
        setGoogleCalendarUser(firebaseUser);
        setIsGoogleCalendarConnected(true);
        
        // Load stored synced mapping
        if (user) {
          const stored = localStorage.getItem(`synced_bookings_${user.id}`);
          if (stored) {
            try {
              setSyncedBookingIds(JSON.parse(stored));
            } catch (e) {
              setSyncedBookingIds({});
            }
          }
        }
        
        // Load upcoming events
        try {
          const events = await fetchGoogleCalendarEvents();
          setGoogleCalendarEvents(events);
        } catch (e) {
          console.error("Failed to load Google Calendar events on auth initialization:", e);
        }
      },
      () => {
        setIsGoogleCalendarConnected(false);
        setGoogleCalendarUser(null);
        setGoogleCalendarEvents([]);
        setSyncedBookingIds({});
      }
    );
    return () => unsubscribe();
  }, [user]);

  // Sync any newly created bookings if autoSyncToCalendar is enabled
  useEffect(() => {
    if (isGoogleCalendarConnected && autoSyncToCalendar && bookings.length > 0) {
      const now = new Date();
      // Find bookings belonging to user that are not synced yet and are in the future
      const unsynced = bookings.filter(b => {
        if (b.userId !== user?.id) return false;
        if (syncedBookingIds[b.id]) return false;
        try {
          const bookingDateTime = new Date(`${b.date}T${b.time}:00`);
          return bookingDateTime.getTime() > now.getTime();
        } catch (e) {
          return false;
        }
      });
      if (unsynced.length > 0) {
        unsynced.forEach(async (booking) => {
          try {
            // Prevent duplicate sync calls by marking as "syncing"
            setSyncedBookingIds(prev => ({ ...prev, [booking.id]: "syncing" }));
            
            const duration = booking.type === "service" ? (booking.duration || 60) : 120;
            const event = await addBookingToGoogleCalendar(booking, duration);
            
            setSyncedBookingIds(prev => {
              const next = { ...prev, [booking.id]: event.id };
              localStorage.setItem(`synced_bookings_${user?.id}`, JSON.stringify(next));
              return next;
            });
            
            setBookingSuccessMsg(t('googleCalendar.autoSynced', { id: booking.id }));
            setTimeout(() => setBookingSuccessMsg(""), 5000);
            
            // Refresh calendar list
            const events = await fetchGoogleCalendarEvents();
            setGoogleCalendarEvents(events);
          } catch (err: any) {
            console.error("Auto sync failed for booking", booking.id, err);
            // Revert state
            setSyncedBookingIds(prev => {
              const next = { ...prev };
              delete next[booking.id];
              return next;
            });
          }
        });
      }
    }
  }, [bookings, isGoogleCalendarConnected, autoSyncToCalendar, syncedBookingIds, user]);

  const refreshGoogleCalendarEvents = async () => {
    setIsCalendarLoading(true);
    setCalendarError("");
    try {
      const events = await fetchGoogleCalendarEvents();
      setGoogleCalendarEvents(events);
    } catch (err: any) {
      console.error(err);
      setCalendarError(err.message || t('googleCalendar.fetchEventsError'));
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleConnectGoogleCalendar = async () => {
    setIsCalendarLoading(true);
    setCalendarError("");
    try {
      const res = await googleCalendarSignIn();
      if (res) {
        setGoogleCalendarUser(res.user);
        setIsGoogleCalendarConnected(true);
        // Load initial synced bookings from localStorage for this user
        const stored = localStorage.getItem(`synced_bookings_${user?.id || res.user.uid}`);
        if (stored) {
          try {
            setSyncedBookingIds(JSON.parse(stored));
          } catch (e) {
            setSyncedBookingIds({});
          }
        }
        // Load events
        const events = await fetchGoogleCalendarEvents();
        setGoogleCalendarEvents(events);
        setBookingSuccessMsg(t('googleCalendar.connectedMsg'));
        setTimeout(() => setBookingSuccessMsg(""), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setCalendarError(err.message || t('googleCalendar.authFailed'));
    } finally {
      setIsCalendarLoading(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    if (confirm(t('googleCalendar.disconnectConfirm'))) {
      try {
        await googleCalendarSignOut();
        setIsGoogleCalendarConnected(false);
        setGoogleCalendarUser(null);
        setGoogleCalendarEvents([]);
        setSyncedBookingIds({});
        setBookingSuccessMsg(t('googleCalendar.disconnectedMsg'));
        setTimeout(() => setBookingSuccessMsg(""), 4000);
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const triggerSyncBooking = (booking: any) => {
    setPendingSyncBooking(booking);
    setShowSyncConfirmModal(true);
  };

  const confirmSyncBooking = async () => {
    if (!pendingSyncBooking) return;
    setIsCalendarLoading(true);
    try {
      const duration = pendingSyncBooking.type === "service" ? (pendingSyncBooking.duration || 60) : 120;
      const event = await addBookingToGoogleCalendar(pendingSyncBooking, duration);
      
      const newSynced = { ...syncedBookingIds, [pendingSyncBooking.id]: event.id };
      setSyncedBookingIds(newSynced);
      localStorage.setItem(`synced_bookings_${user?.id}`, JSON.stringify(newSynced));
      
      setBookingSuccessMsg(t('googleCalendar.syncSuccess'));
      setTimeout(() => setBookingSuccessMsg(""), 4000);
      
      // Refresh events
      await refreshGoogleCalendarEvents();
    } catch (err: any) {
      alert(err.message || t('googleCalendar.addEventFailed'));
    } finally {
      setIsCalendarLoading(false);
      setShowSyncConfirmModal(false);
      setPendingSyncBooking(null);
    }
  };

  const handleUnsyncBooking = async (booking: any) => {
    const eventId = syncedBookingIds[booking.id];
    if (!eventId) return;
    if (confirm(t('googleCalendar.deleteEventConfirm'))) {
      setIsCalendarLoading(true);
      try {
        await deleteGoogleCalendarEvent(eventId);
        const newSynced = { ...syncedBookingIds };
        delete newSynced[booking.id];
        setSyncedBookingIds(newSynced);
        localStorage.setItem(`synced_bookings_${user?.id}`, JSON.stringify(newSynced));
        
        setBookingSuccessMsg(t('googleCalendar.unsyncSuccess'));
        setTimeout(() => setBookingSuccessMsg(""), 4000);
        
        // Refresh events
        await refreshGoogleCalendarEvents();
      } catch (err: any) {
        alert(err.message || t('googleCalendar.deleteEventFailed'));
      } finally {
        setIsCalendarLoading(false);
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('highContrast', String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Scroll listener for the header transition and height animation
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 20) {
            setScrolled(true);
          } else {
            setScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    // Run once at start to capture initial load scroll position
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listen for /superadmin route in URL pathname or hash
  useEffect(() => {
    const handleRouteCheck = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/superadmin' || path.startsWith('/superadmin') || hash === '#superadmin' || hash === '#/superadmin') {
        setActiveModule('platform');
      }
    };

    handleRouteCheck();
    window.addEventListener('popstate', handleRouteCheck);
    window.addEventListener('hashchange', handleRouteCheck);
    return () => {
      window.removeEventListener('popstate', handleRouteCheck);
      window.removeEventListener('hashchange', handleRouteCheck);
    };
  }, []);

  const navigateToModule = (mod: 'dashboard' | 'tabletop' | 'bookly' | 'rbac' | 'ai-assistant' | 'stays' | 'analytics' | 'platform') => {
    setActiveModule(mod);
    if (mod === 'platform') {
      if (window.location.pathname !== '/superadmin' && window.location.hash !== '#superadmin') {
        try {
          window.history.pushState({}, '', '/superadmin');
        } catch (e) {
          window.location.hash = '#superadmin';
        }
      }
    } else {
      if (window.location.pathname === '/superadmin') {
        try {
          window.history.pushState({}, '', '/');
        } catch (e) {
          window.location.hash = '';
        }
      }
    }
  };

  // Calendar history view state
  const [bookingHistoryView, setBookingHistoryView] = useState<'list' | 'calendar'>('list');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'next_month'>('all');
  const [copiedBookingId, setCopiedBookingId] = useState<string | null>(null);

  // Helper to obtain reference date for relative calendar calculations
  const getBaseDate = () => {
    const now = new Date();
    if (now.getFullYear() < 2026 || (now.getFullYear() === 2026 && now.getMonth() < 6)) {
      return new Date("2026-07-10");
    }
    return now;
  };

  const filteredBookings = React.useMemo(() => {
    const baseDate = getBaseDate();
    
    // Calculate Monday and Sunday of the current week containing baseDate
    const getMonday = (d: Date) => {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d);
      mon.setDate(diff);
      mon.setHours(0, 0, 0, 0);
      return mon;
    };
    
    const monday = getMonday(baseDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return bookings.filter(b => {
      if (dateFilter === 'all') return true;
      
      try {
        const bDate = new Date(`${b.date}T00:00:00`);
        
        if (dateFilter === 'week') {
          return bDate >= monday && bDate <= sunday;
        }
        
        if (dateFilter === 'month') {
          return bDate.getMonth() === baseDate.getMonth() && bDate.getFullYear() === baseDate.getFullYear();
        }
        
        if (dateFilter === 'next_month') {
          const nextMonth = (baseDate.getMonth() + 1) % 12;
          const nextYear = baseDate.getFullYear() + (baseDate.getMonth() === 11 ? 1 : 0);
          return bDate.getMonth() === nextMonth && bDate.getFullYear() === nextYear;
        }
      } catch (e) {
        return true;
      }
      return true;
    });
  }, [bookings, dateFilter]);
  // Real-time booking alerts state (2 hours before)
  const [upcomingAlerts, setUpcomingAlerts] = useState<{
    id: string;
    title: string;
    message: string;
    address: string;
    directions: string;
    bookingId: string;
  }[]>([]);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        return Notification.permission;
      }
    } catch (e) {
      console.warn("Notification permission API not fully accessible:", e);
    }
    return "default";
  });

  const requestNotificationPermission = () => {
    if (!("Notification" in window)) return;
    try {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission);
        if (permission === "granted") {
          new Notification(t('common.browserNotificationsEnabled'), {
            body: "Thank you for enabling notifications!",
            icon: "/favicon.ico"
          });
        }
      });
    } catch (e) {
      console.error("Failed to request notification permission:", e);
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        setNotificationPermission(Notification.permission);
      }
    } catch (e) {
      console.warn("Could not read Notification permission on mount:", e);
    }
  }, []);

  // Load user notifications
  const loadUserNotifications = (userId: string) => {
    // Skip when there's no Supabase session — the /api/* endpoint requires
    // an authenticated caller and would otherwise 401 for signed-out visitors.
    if (!hasActiveSession()) return;
    fetch(`/api/notifications/${userId}`)
      .then(res => res.json())
      .then(data => {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      })
      .catch(err => console.error("Error loading notifications:", err));
  };

  // Mark single notification as read
  const handleReadNotification = (id: string) => {
    fetch(`/api/notifications/${id}/read`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (user) loadUserNotifications(user.id);
        }
      })
      .catch(err => console.error("Error marking notification as read:", err));
  };

  // Mark all notifications as read
  const handleReadAllNotifications = () => {
    if (!user) return;
    fetch("/api/notifications/read-all", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          loadUserNotifications(user.id);
        }
      })
      .catch(err => console.error("Error marking all notifications as read:", err));
  };

  // Load baseline services and restaurants on mount
  useEffect(() => {
    setLoadingServices(true);
    listServices()
      .then(setServices)
      .catch((err: Error) => {
        console.error("Error fetching services:", err);
        toast.error(t('api.loadServicesError'), { description: err.message });
      })
      .finally(() => setLoadingServices(false));

    setLoadingRestaurants(true);
    listRestaurants()
      .then(setRestaurants)
      .catch((err: Error) => {
        console.error("Error fetching restaurants:", err);
        toast.error(t('api.loadRestaurantsError'), { description: err.message });
      })
      .finally(() => setLoadingRestaurants(false));

    setLoadingSalons(true);
    listSalons()
      .then(setSalons)
      .catch((err: Error) => {
        console.error("Error fetching salons:", err);
        toast.error(t('api.loadSalonsError'), { description: err.message });
      })
      .finally(() => setLoadingSalons(false));

    loadAllBookings();
  }, []);

  // When Supabase drops the session externally (token expiry, sign-out from
  // another tab, etc.), tear down user-scoped UI state and stop polling.
  useEffect(() => {
    if (supabaseSession) return;
    setRecommendation(null);
    setNotifications([]);
    setUnreadCount(0);
  }, [supabaseSession]);

  // Fetch tables whenever date, time or selected restaurant changes in Tabletop
  useEffect(() => {
    if (!selectedRestaurant) {
      setAvailableTables([]);
      return;
    }
    setLoadingTables(true);
    listTables({ restaurantId: selectedRestaurant.id, time: tabletopTime })
      .then((data) => {
        setAvailableTables(data);
      })
      .catch((err: Error) => {
        console.error("Error fetching tables:", err);
        toast.error(t('api.loadTablesError'), { description: err.message });
      })
      .finally(() => setLoadingTables(false));
  }, [tabletopDate, tabletopTime, selectedRestaurant]);


  // Real-time table hold lock countdown (90s)
  useEffect(() => {
    if (selectedTable) {
      setHoldTimer(90);
      setHoldTableId(selectedTable.id);
    } else {
      setHoldTimer(null);
      setHoldTableId(null);
    }
  }, [selectedTable]);

  useEffect(() => {
    if (holdTimer === null || !selectedTable) return;

    if (holdTimer === 0) {
      setSelectedTable(null);
      setHoldTimer(null);
      setHoldTableId(null);
      setBookingSuccessMsg(t('common.tableHoldTimeout', { number: selectedTable.number }));
      setTimeout(() => setBookingSuccessMsg(""), 6000);
      return;
    }

    const interval = setInterval(() => {
      setHoldTimer(prev => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [holdTimer, selectedTable]);

  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  const loadAllBookings = () => {
    // Session-only bookings; no server persistence yet.
    setAllBookings(prev => prev);
  };

  // Load user reservations
  const loadUserReservations = (_userId: string) => {
    // Session-only bookings; no server persistence yet.
    setBookings(prev => prev);
    loadUserNotifications(_userId);
  };

  // Calculate monthly spending breakdown for Dining vs Wellness
  const getMonthlySpending = () => {
    const now = new Date();
    const currentPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let diningTotal = 0;
    let wellnessTotal = 0;
    
    bookings.forEach(b => {
      if (b.date && b.date.startsWith(currentPrefix)) {
        if (b.type === 'table') {
          diningTotal += b.price || 0;
        } else if (b.type === 'service') {
          wellnessTotal += b.price || 0;
        }
      }
    });
    
    const total = diningTotal + wellnessTotal;
    const diningPercent = total > 0 ? (diningTotal / total) * 100 : 0;
    const wellnessPercent = total > 0 ? (wellnessTotal / total) * 100 : 0;
    
    const monthName = now.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    
    return {
      diningTotal,
      wellnessTotal,
      total,
      diningPercent,
      wellnessPercent,
      monthName: formattedMonth
    };
  };

  // Helper: directions details and addresses for bookings
  const getDirectionsInfo = (booking: Booking) => {
    if (booking.type === 'table') {
      const rName = (booking as any).restaurantName || 'Grand Atelier';
      if (rName.toLowerCase().includes('atelier')) {
        return {
          address: t('common.directions.grandAddress'),
          directions: t('common.directions.grandDirections')
        };
      } else if (rName.toLowerCase().includes('sakura') || rName.toLowerCase().includes('дзен') || rName.toLowerCase().includes('zen') || rName.toLowerCase().includes('زين')) {
        return {
          address: t('common.directions.olympicAddress'),
          directions: t('common.directions.olympicDirections')
        };
      } else {
        return {
          address: t('common.directions.patriarchAddress'),
          directions: t('common.directions.patriarchDirections')
        };
      }
    } else {
      const sName = (booking as any).salonName || 'Lotus Spa';
      if (sName.toLowerCase().includes('lotus') || sName.toLowerCase().includes('спа') || sName.toLowerCase().includes('spa') || sName.toLowerCase().includes('سبا')) {
        return {
          address: t('common.directions.lotusAddress'),
          directions: t('common.directions.lotusDirections')
        };
      } else if (sName.toLowerCase().includes('gold') || sName.toLowerCase().includes('gym') || sName.toLowerCase().includes('фитнес') || sName.toLowerCase().includes('fitness') || sName.toLowerCase().includes('فتنس') || sName.toLowerCase().includes('لياقة')) {
        return {
          address: t('common.directions.goldAddress'),
          directions: t('common.directions.goldDirections')
        };
      } else {
        return {
          address: t('common.directions.barberAddress'),
          directions: t('common.directions.barberDirections')
        };
      }
    }
  };

  const fallbackCopyTextToClipboard = (text: string, onSuccess: () => void) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        onSuccess();
      } else {
        setBookingSuccessMsg(t('common.copyFailed'));
      }
    } catch (err) {
      setBookingSuccessMsg(t('common.copyFailed'));
    }
    document.body.removeChild(textArea);
  };

  const handleShare = (booking: Booking) => {
    const isTable = booking.type === "table";
    const dirInfo = getDirectionsInfo(booking);
    
    const summaryText = isTable
      ? t('common.shareTable', {
          tableNumber: booking.tableNumber,
          restaurantName: (booking as any).restaurantName || 'Grand Atelier',
          date: booking.date,
          time: booking.time,
          guests: booking.guests,
          address: dirInfo.address,
          price: booking.price,
          id: booking.id
        })
      : t('common.shareService', {
          serviceName: booking.serviceName,
          date: booking.date,
          time: booking.time,
          staffName: booking.staffName,
          address: dirInfo.address,
          price: booking.price,
          id: booking.id
        });

    const performCopy = () => {
      setCopiedBookingId(booking.id);
      setTimeout(() => setCopiedBookingId(null), 2000);
      setBookingSuccessMsg(t('common.linkCopied'));
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summaryText)
        .then(performCopy)
        .catch(() => {
          fallbackCopyTextToClipboard(summaryText, performCopy);
        });
    } else {
      fallbackCopyTextToClipboard(summaryText, performCopy);
    }
  };

  // Trigger floating on-screen alert + insert notification into server DB
  const triggerUpcomingBookingAlert = (booking: Booking, isTest: boolean = false) => {
    const storageKey = `alert-notified-v2-${booking.id}`;
    if (!isTest && sessionStorage.getItem(storageKey)) {
      return;
    }
    if (!isTest) {
      sessionStorage.setItem(storageKey, "true");
    }

    const dirInfo = getDirectionsInfo(booking);
    const title = booking.type === 'table' 
      ? t('common.upcomingTableTitle', { tableNumber: booking.tableNumber })
      : t('common.upcomingServiceTitle', { serviceName: booking.serviceName });

    const message = booking.type === 'table'
      ? t('common.upcomingTableMessage', { restaurantName: (booking as any).restaurantName || 'Grand Atelier', time: booking.time })
      : t('common.upcomingServiceMessage', { staffName: booking.staffName, time: booking.time });

    const newAlert = {
      id: `${booking.id}-${Date.now()}`,
      title,
      message,
      address: dirInfo.address,
      directions: dirInfo.directions,
      bookingId: booking.id
    };

    // Show floating card
    setUpcomingAlerts(prev => {
      if (prev.some(a => a.bookingId === booking.id)) return prev;
      return [...prev, newAlert];
    });

    // Create a notification record on the backend
    if (!user || !hasActiveSession()) return;
    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.id,
        title: t('common.upcomingNotificationTitle', { id: booking.id }),
        message: `${message} ${t('common.address')}: ${dirInfo.address}. ${t('common.howToGetThere')} ${dirInfo.directions}`,
        type: "reminder"
      })
    })
    .then(() => {
      // Reload notifications in the UI
      loadUserNotifications(user.id);
    })
    .catch(err => console.error("Error creating server notification:", err));
  };

  const showActualBrowserNotification = (booking: Booking) => {
    // Title
    const title = t('common.browserNotification30mTitle');

    // Message
    let body = "";
    if (booking.type === 'table') {
      body = t('common.browserNotification30mTable', {
        tableNumber: booking.tableNumber,
        restaurantName: (booking as any).restaurantName || 'Grand Atelier',
        time: booking.time
      });
    } else {
      body = t('common.browserNotification30mService', {
        serviceName: booking.serviceName,
        staffName: booking.staffName,
        time: booking.time
      });
    }

    // Trigger browser notification
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: `booking-30m-${booking.id}`
          });
        } catch (err) {
          console.error("Failed to show HTML5 notification:", err);
        }
      } else {
        console.warn("Desktop notifications not granted. Permission state:", Notification.permission);
      }
    }

    // Also add to the in-app notifications and set unreadCount + local state, so there is visibility!
    if (user && hasActiveSession()) {
      fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title,
          message: body,
          type: "reminder"
        })
      })
      .then(() => {
        loadUserNotifications(user.id);
      })
      .catch(err => console.error("Error creating server notification for 30m reminder:", err));
    }
  };

  const trigger30MinBrowserNotification = (booking: Booking, isTest: boolean = false) => {
    const storageKey = `browser-notified-30m-${booking.id}`;
    if (!isTest && localStorage.getItem(storageKey)) {
      return;
    }
    if (!isTest) {
      localStorage.setItem(storageKey, "true");
    }

    // Request permission if not granted
    if ("Notification" in window && Notification.permission === "default") {
      try {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission);
          if (permission === "granted") {
            showActualBrowserNotification(booking);
          }
        });
      } catch (e) {
        console.error("Failed to request permission on notification trigger:", e);
        showActualBrowserNotification(booking);
      }
    } else {
      showActualBrowserNotification(booking);
    }
  };

  // Periodic check (every 10 seconds) for 2 hours upcoming bookings and 30-min desktop reminders
  useEffect(() => {
    if (!user || bookings.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      
      bookings.forEach(booking => {
        try {
          // booking.date is "YYYY-MM-DD", booking.time is "HH:MM"
          const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`);
          const diffMs = bookingDateTime.getTime() - now.getTime();
          const diffHours = diffMs / (1000 * 60 * 60);

          // If booking is scheduled and starts within 2 hours (e.g. up to 2.1 hours in future, and in future)
          if (diffHours > 0 && diffHours <= 2.1) {
            triggerUpcomingBookingAlert(booking, false);
          }

          // If booking starts within 30 minutes (e.g. up to 30.5 minutes in future, and in future)
          const diffMinutes = diffMs / (1000 * 60);
          if (diffMinutes > 0 && diffMinutes <= 30.5) {
            trigger30MinBrowserNotification(booking, false);
          }
        } catch (e) {
          console.error("Error parsing booking date:", e);
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [bookings, user]);

  // Load AI Recommendations using Gemini server-side API
  const loadAIRecommendations = (userId: string) => {
    // Analytics recommendations are user-scoped and require an authenticated
    // session — silently skip when the visitor is signed out.
    if (!hasActiveSession()) return;
    setRecoLoading(true);
    fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    })
      .then(res => res.json())
      .then(data => {
        setRecommendation(data);
        setRecoLoading(false);
      })
      .catch(err => {
        console.error("Error loading recommendations:", err);
        setRecoLoading(false);
      });
  };

  // QR Check-in State
  const [selectedQrBooking, setSelectedQrBooking] = useState<Booking | null>(null);
  const [showPersonalQr, setShowPersonalQr] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);

  const [scannedCheckInBooking, setScannedCheckInBooking] = useState<Booking | null>(null);
  const [scannedCheckInUserPass, setScannedCheckInUserPass] = useState<{ id: string; email: string } | null>(null);
  const [scannedUserBookings, setScannedUserBookings] = useState<Booking[]>([]);

  const handleGlobalQrScanSuccess = (decodedText: string) => {
    setShowQrScanner(false); // Close camera viewfinder
    
    // Play light beep
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {}

    try {
      if (decodedText.startsWith("booking-checkin:")) {
        const parts = decodedText.split(":");
        const bookingId = parts[1];
        
        // Look up the booking
        const found = allBookings.find(b => b.id === bookingId) || bookings.find(b => b.id === bookingId) || hotelBookings.find(b => b.id === bookingId);
        if (found) {
          setScannedCheckInBooking(found);
          setScannedCheckInUserPass(null);
          setScannedUserBookings([]);
          toast.success(
            i18n.language === 'ru' 
              ? "Код бронирования успешно считан!" 
              : "Booking QR Code successfully decoded!"
          );
        } else {
          toast.error(
            i18n.language === 'ru'
              ? "Бронирование не найдено в нашей базе."
              : "Scanned booking not found in our database."
          );
        }
      } else if (decodedText.startsWith("user-checkin:")) {
        const parts = decodedText.split(":");
        const userId = parts[1];
        const email = parts[2];

        setScannedCheckInUserPass({ id: userId, email });
        setScannedCheckInBooking(null);

        // Find match for guest bookings
        const userB = allBookings.filter(b => b.userId === userId) || bookings.filter(b => b.userId === userId);
        setScannedUserBookings(userB);

        toast.success(
          i18n.language === 'ru'
            ? "Универсальная карта гостя считана!"
            : "Universal Guest Pass successfully decoded!"
        );
      } else {
        toast.error(
          i18n.language === 'ru'
            ? "Неверный формат или поврежденный QR-код."
            : "Invalid QR code payload format."
        );
      }
    } catch (e) {
      console.error(e);
      toast.error("Error reading scanned QR data");
    }
  };

  const handleCheckInBooking = (bookingId: string) => {
    setAllBookings(prev => prev.map(b => b.id === bookingId ? { ...b, checkedIn: true } : b));
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, checkedIn: true } : b));
    setHotelBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'confirmed', checkedIn: true } : b));
    
    // Sync current scanned booking if it's the one being checked in
    setScannedCheckInBooking(prev => prev && prev.id === bookingId ? { ...prev, checkedIn: true } : prev);
    setScannedUserBookings(prev => prev.map(b => b.id === bookingId ? { ...b, checkedIn: true } : b));
    
    // Create checkin notification
    const booking = allBookings.find(b => b.id === bookingId) || bookings.find(b => b.id === bookingId) || hotelBookings.find(b => b.id === bookingId);
    if (booking) {
      const isRussian = i18n.language === 'ru';
      const isArabic = i18n.language === 'ar';
      const isArmenian = i18n.language === 'hy';
      
      const newNotif = {
        id: `notif-checkin-${Date.now()}`,
        userId: booking.userId,
        title: isRussian ? "Регистрация успешна!" : isArabic ? "نجاح التحقق من الوصول!" : isArmenian ? "Գրանցումը հաղոջվեց:" : "Check-in successful!",
        message: isRussian 
          ? `Вы успешно зарегистрировались по QR-коду на бронирование #${booking.id}.` 
          : `Successfully checked in via QR code for reservation #${booking.id}.`,
        type: 'status',
        read: false,
        createdAt: new Date().toISOString()
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  // Memoized 30-day analytics dataset for Recharts
  const bookingOverviewData = React.useMemo(() => {
    const data = [];
    const baseDate = new Date(2026, 6, 11); // Current date: July 11, 2026

    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const displayDate = d.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US', { day: "numeric", month: "short" });

      const tableCount = allBookings.filter(b => b.date === dateString && b.type === 'table').length;
      const serviceCount = allBookings.filter(b => b.date === dateString && b.type === 'service').length;

      data.push({
        date: displayDate,
        "Tabletop": tableCount,
        "Bookly": serviceCount,
        "Total": tableCount + serviceCount
      });
    }
    return data;
  }, [allBookings]);

  // Tabletop Search computations
  const isTableSearchActive = tableSearchQuery.trim() !== "";
  const cleanTableSearchQuery = tableSearchQuery.trim().toLowerCase().replace(/(столик|стол|table|طاولة|սեղան|№|#)/g, "").trim();
  const matchedTables = React.useMemo(() => {
    if (!isTableSearchActive || !cleanTableSearchQuery) return [];
    return availableTables.filter(t => t.room === selectedRoom && t.number.toString().includes(cleanTableSearchQuery));
  }, [isTableSearchActive, cleanTableSearchQuery, availableTables, selectedRoom]);

  // Handle User login
  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setAuthError(t('common.emptyFieldsError'));
      return;
    }
    setAuthLoading(true);
    setAuthError("");

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(res => {
        if (!res.ok) throw new Error(t('common.wrongCredsError'));
        return res.json();
      })
      .then(data => {
        if (data.token) localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        loadUserReservations(data.user.id);
        loadAIRecommendations(data.user.id);
        setAuthLoading(false);
      })
      .catch(err => {
        setAuthError(err.message || t('common.authError'));
        setAuthLoading(false);
      });
  };

  // One-click quick login for demo users
  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password");
    setAuthLoading(true);
    setAuthError("");

    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: demoEmail, password: "password" })
    })
      .then(res => {
        if (!res.ok) throw new Error(t('common.wrongCredsError'));
        return res.json();
      })
      .then(data => {
        if (data.token) localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        loadUserReservations(data.user.id);
        loadAIRecommendations(data.user.id);
        setAuthLoading(false);
      })
      .catch(err => {
        setAuthError(err.message || t('common.quickLoginError'));
        setAuthLoading(false);
      });
  };

  // Handle User register
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setAuthError(t('common.registerFieldsError'));
      return;
    }
    if (signupType === 'business' && !businessName) {
      setAuthError(t('common.registerBusinessError'));
      return;
    }
    setAuthLoading(true);
    setAuthError("");

    const payload = signupType === 'business' ? {
      name,
      email,
      password,
      role: 'business_admin',
      businessName,
      businessCategory,
      businessDescription
    } : {
      name,
      email,
      password,
      preferences
    };

    fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (!res.ok) return res.json().then(data => { throw new Error(data.error); });
        return res.json();
      })
      .then(data => {
        if (data.token) localStorage.setItem('auth_token', data.token);
        setUser(data.user);
        loadUserReservations(data.user.id);
        loadAIRecommendations(data.user.id);
        setAuthLoading(false);
      })
      .catch(err => {
        setAuthError(err.message || t('common.registerFailed'));
        setAuthLoading(false);
      });
  };

  // Handle logout
  const handleLogout = () => {
    // Best-effort Supabase sign-out; auth.ts's onAuthStateChange listener
    // will clear the localStorage token for us.
    void supabase.auth.signOut().catch(() => { /* ignore */ });
    localStorage.removeItem('auth_token');
    setUser(null);
    setRecommendation(null);
    setBookings([]);
    setNotifications([]);
    setUnreadCount(0);
    setShowNotifications(false);
    setSelectedTable(null);
    setSelectedService(null);
    setActiveModule('dashboard');
  };

  // Simulating balance top up
  const handleAddBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    setUser({
      ...user,
      balance: user.balance + amount
    });
    setAddingBalance(false);
  };

  // Execute actual Book Table action
  const executeBookTable = () => {
    if (!user || selectedTables.length === 0) return;

    setTableActionLoading(true);
    const firstTable = selectedTables[0];

    bookTable({
      userId: user.id,
      tableId: firstTable.id,
      tableNumber: firstTable.number,
      room: firstTable.room,
      restaurantId: selectedRestaurant?.id,
      restaurantName: selectedRestaurant?.name,
      date: tabletopDate,
      time: tabletopTime,
      guests: guestsCount,
      notes: tableNotes,
      basePrice: firstTable.price,
      currentBalance: user.balance,

      // Batch properties
      tableIds: selectedTables.map(t => t.id),
      tableNumbers: selectedTables.map(t => t.number),
      rooms: selectedTables.map(t => t.room),
      basePrices: selectedTables.map(t => t.price)
    })
      .then(({ booking, bookings: batchBookings, priceCharged }) => {
        setUser({ ...user, balance: user.balance - priceCharged });
        
        const bookingsToAdd = batchBookings && batchBookings.length > 0 ? batchBookings : [booking];
        setBookings(prev => [...prev, ...bookingsToAdd]);
        setAllBookings(prev => [...prev, ...bookingsToAdd]);
        // Mark tables as booked locally
        const bookedIds = bookingsToAdd.map(b => b.tableId);
        setAvailableTables(prev =>
          prev.map(t => (bookedIds.includes(t.id) ? { ...t, status: "booked" } : t))
        );

        const tableNumbersString = selectedTables.map(t => `#${t.number}`).join(", ");
        setBookingSuccessMsg(
          i18n.language === 'ru' ? `Успешно забронировано! Столы: ${tableNumbersString} на ${tabletopDate} в ${tabletopTime}.` : i18n.language === 'hy' ? `Հաջողությա՛մբ ամրագրվեց: Սեղաններ՝ ${tableNumbersString}, ${tabletopDate}-ին, ժամը ${tabletopTime}-ին:` : `Success! Tables ${tableNumbersString} booked for ${tabletopDate} at ${tabletopTime}.`
        );
        setSelectedTables([]);
        setSelectedTable(null);
        setTableNotes("");
        setTableActionLoading(false);
        setShowConfirmModal(false);

        // Refresh AI recommendations to update based on new history
        setTimeout(() => loadAIRecommendations(user.id), 1500);
      })
      .catch((err: Error) => {
        alert(err.message);
        setTableActionLoading(false);
      });
  };

  // Book Table action (triggers confirmation modal)
  const handleBookTable = () => {
    if (!user || selectedTables.length === 0) return;

    const isPremium = ["18:30", "19:00", "20:30"].includes(tabletopTime);
    const billingText = isPremium 
      ? t('common.premiumTariff') 
      : t('common.standardTariff');

    const totalCost = selectedTables.reduce((sum, t) => sum + t.price, 0);
    const tableNumbersText = selectedTables.map(t => `#${t.number}`).join(", ");
    const roomsText = selectedTables.map(t => t.room === 'main' ? selectedRestaurant?.rooms.main : t.room === 'vip' ? selectedRestaurant?.rooms.vip : selectedRestaurant?.rooms.terrace);
    const uniqueRooms = Array.from(new Set(roomsText)).join(", ");
    const totalCapacity = selectedTables.reduce((sum, t) => sum + t.capacity, 0);

    const details = [
      `${t('common.restaurantLabel')}: ${selectedRestaurant?.name || t('common.restaurantLabel')}`,
      `${t('common.roomZoneLabel')}: ${uniqueRooms}`,
      `${i18n.language === 'ru' ? 'Номера столов' : i18n.language === 'hy' ? 'Սեղանների համարները' : 'Table Numbers'}: ${tableNumbersText}`,
      `${t('common.capacityLabel')}: ${t('common.capacityValue', { capacity: totalCapacity })}`,
      `${t('common.guestsCountLabel')}: ${guestsCount}`,
      `${t('common.visitDateLabel')}: ${tabletopDate}`,
      `${t('common.visitTimeLabel')}: ${tabletopTime}`,
      `${t('common.tariffPlanLabel')}: ${billingText}`,
      `${t('common.notesLabel')}: ${tableNotes || t('common.noNotesLabel')}`
    ];

    const hasTerrace = selectedTables.some(t => t.room === 'terrace');
    if (hasTerrace) {
      if (currentWeatherId === 'stormy') {
        details.push(t('common.weatherStormyWarn'));
      } else if (currentWeatherId === 'rainy') {
        details.push(t('common.weatherRainyWarn'));
      } else if (currentWeatherId === 'cloudy') {
        details.push(t('common.weatherCloudyWarn'));
      } else {
        details.push(t('common.weatherSunnyWarn'));
      }
    }

    setConfirmModalData({
      type: 'table',
      title: t('common.confirmTableBookingTitle'),
      details,
      cost: totalCost,
      onConfirm: executeBookTable
    });
    setShowConfirmModal(true);
  };

  // Execute actual Book Service action
  const executeBookService = () => {
    if (!user || !selectedService || !selectedStaff) return;

    setServiceActionLoading(true);
    bookService({
      userId: user.id,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      category: selectedService.category,
      staffId: selectedStaff.id,
      staffName: selectedStaff.name,
      date: booklyDate,
      time: booklyTime,
      price: selectedService.price,
      salonId: selectedService.salonId,
      salonName: selectedService.salonName,
      currentBalance: user.balance,
    })
      .then(({ booking, priceCharged }) => {
        setUser({ ...user, balance: user.balance - priceCharged });
        setBookings(prev => [...prev, booking]);
        setAllBookings(prev => [...prev, booking]);

        setBookingSuccessMsg(t('common.serviceBookedSuccess', { serviceName: selectedService.name, staffName: selectedStaff.name, date: booklyDate, time: booklyTime }));
        setSelectedService(null);
        setSelectedStaff(null);
        setServiceActionLoading(false);
        setShowConfirmModal(false);

        // Refresh AI recommendations to update based on new history
        setTimeout(() => loadAIRecommendations(user.id), 1500);
      })
      .catch((err: Error) => {
        alert(err.message);
        setServiceActionLoading(false);
      });
  };

  // Book Service action (triggers confirmation modal)
  const handleBookService = () => {
    if (!user || !selectedService || !selectedStaff) return;

    setConfirmModalData({
      type: 'service',
      title: t('common.confirmServiceBookingTitle'),
      details: [
        `${t('common.salonLabel')}: ${selectedService.salonName}`,
        `${t('common.categoryLabel')}: ${selectedService.category}`,
        `${t('common.serviceLabel')}: ${selectedService.name}`,
        `${t('common.specialistLabel')}: ${selectedStaff.name} (${selectedStaff.role})`,
        `${t('common.appointmentDateLabel')}: ${booklyDate}`,
        `${t('common.appointmentTimeLabel')}: ${booklyTime}`,
        `${t('common.durationLabel')}: ${t('common.minutesLabel', { duration: selectedService.duration })}`
      ],
      cost: selectedService.price,
      onConfirm: executeBookService
    });
    setShowConfirmModal(true);
  };

  // Register Salon (Bookly)
  const handleRegisterSalon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSalonForm.name) {
      toast.error(t('common.salonNameRequired'));
      return;
    }
    if (registeringSalon) return;
    setRegisteringSalon(true);
    const toastId = toast.loading(t('common.registeringSalon'));
    registerSalon(newSalonForm)
      .then((newSalon) => {
        setSalons(prev => [...prev, newSalon]);
        // Also refresh services if they created an initial service
        setLoadingServices(true);
        listServices()
          .then(setServices)
          .catch(() => { /* keep existing services on refresh failure */ })
          .finally(() => setLoadingServices(false));

        setShowRegisterSalonModal(false);
        setNewSalonForm({
          name: "",
          description: "",
          category: "Spa & Wellness",
          address: "",
          image: "",
          serviceName: "",
          servicePrice: "",
          serviceDuration: "60"
        });

        toast.success(t('common.salonRegistered', { name: newSalon.name }), {
          id: toastId,
          description: t('common.salonRegisteredDesc'),
        });
      })
      .catch((err: Error) => {
        toast.error(t('common.salonRegisterFailed'), {
          id: toastId,
          description: err.message,
        });
      })
      .finally(() => setRegisteringSalon(false));
  };

  // Register Restaurant (Tabletop)
  const handleRegisterRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestaurantForm.name) {
      toast.error(t('common.restaurantNameRequired'));
      return;
    }
    if (registeringRestaurant) return;
    setRegisteringRestaurant(true);
    const toastId = toast.loading(t('common.registeringRestaurant'));
    registerRestaurant(newRestaurantForm)
      .then((newRest) => {
        setRestaurants(prev => [...prev, newRest]);
        setShowRegisterRestaurantModal(false);
        setNewRestaurantForm({
          name: "",
          description: "",
          cuisine: "European",
          tablesCount: "8",
          image: ""
        });

        toast.success(t('common.restaurantRegistered', { name: newRest.name }), {
          id: toastId,
          description: t('common.restaurantRegisteredDesc'),
        });
      })
      .catch((err: Error) => {
        toast.error(t('common.restaurantRegisterFailed'), {
          id: toastId,
          description: err.message,
        });
      })
      .finally(() => setRegisteringRestaurant(false));
  };

  // Toggle preferences selection during registration
  const togglePreference = (pref: string) => {
    if (preferences.includes(pref)) {
      setPreferences(preferences.filter(p => p !== pref));
    } else {
      setPreferences([...preferences, pref]);
    }
  };

  const availablePrefs = [
    { id: "prefSpa", label: t('auth.prefSpa') },
    { id: "prefMassage", label: t('auth.prefMassage') },
    { id: "prefYoga", label: t('auth.prefYoga') },
    { id: "prefFitness", label: t('auth.prefFitness') },
    { id: "prefBeauty", label: t('auth.prefBeauty') },
    { id: "prefWindow", label: t('auth.prefWindow') },
    { id: "prefVip", label: t('auth.prefVip') },
    { id: "prefTerrace", label: t('auth.prefTerrace') },
  ];

  const totalSelectedPrice = selectedTables.reduce((sum, t) => sum + t.price, 0);
  const totalSelectedCapacity = selectedTables.reduce((sum, t) => sum + t.capacity, 0);

  return (
    <div className="min-h-screen bg-[#0F1115] text-[#E2E8F0] font-sans selection:bg-teal-500/20 selection:text-teal-400">
      
      {/* 1. AUTHENTICATION MODULE */}
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div 
            key="auth-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex min-h-screen items-center justify-center p-4 bg-[#0F1115]"
          >
            <div className="w-full max-w-4xl bg-[#16191F] rounded-3xl shadow-2xl shadow-black/40 overflow-hidden border border-white/5 grid grid-cols-1 md:grid-cols-5" id="auth-container">
              
              {/* Brand Introduction Left Column */}
              <div className="md:col-span-2 bg-[#090A0D] p-8 text-white flex flex-col justify-between relative overflow-hidden border-r border-white/5">
                <div className="absolute inset-0 bg-radial-at-t from-teal-950/20 via-[#090A0D]/90 to-[#090A0D]" />
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center text-black font-bold font-display text-xl shadow-lg shadow-teal-500/20">
                      Ω
                    </div>
                    <div>
                      <span className="font-display font-bold text-lg tracking-tight block">OmniReserve</span>
                      <span className="text-[10px] text-teal-400 font-mono tracking-widest uppercase">Superapp Client Hub</span>
                    </div>
                  </div>
                  
                  <h2 className="font-display text-2xl font-bold tracking-tight leading-tight mb-4">
                    {t('auth.slogan')}
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">
                    {t('auth.desc')}
                  </p>
                </div>

                <div className="relative z-10 pt-6 border-t border-white/5">
                  <span className="text-xs text-white/40 block mb-3 font-medium uppercase tracking-wider">{t('auth.demoLoginTitle')}</span>
                  <div className="space-y-2">
                    <button 
                      onClick={() => handleQuickLogin("maria@example.com")}
                      className="w-full text-left py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                        <span>{t('auth.demoUserSpa')}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-teal-400" />
                    </button>
                    <button 
                      onClick={() => handleQuickLogin("alex@example.com")}
                      className="w-full text-left py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        <span>{t('auth.demoUserFit')}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-teal-400" />
                    </button>
                    <button 
                      onClick={() => handleQuickLogin("owner@example.com")}
                      className="w-full text-left py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition text-xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        <span className="text-amber-200 font-medium">{t('auth.demoUserOwner')}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 text-amber-400" />
                    </button>
                  </div>
                  <div className="mt-4 text-[11px] text-white/20 font-mono text-center">
                    {t('auth.demoPass')}
                  </div>
                </div>
              </div>

              {/* Form Input Right Column */}
              <div className="md:col-span-3 p-8 md:p-10 flex flex-col justify-center">
                <div className="flex border-b border-white/5 mb-8 justify-start gap-6 text-sm font-medium">
                  <button 
                    onClick={() => { setAuthTab('signin'); setAuthError(""); }}
                    className={`pb-3 transition relative ${authTab === 'signin' ? 'text-white font-semibold' : 'text-white/40 hover:text-white'}`}
                  >
                    {t('auth.loginBtn')}
                    {authTab === 'signin' && (
                      <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
                    )}
                  </button>
                  <button 
                    onClick={() => { setAuthTab('signup'); setAuthError(""); }}
                    className={`pb-3 transition relative ${authTab === 'signup' ? 'text-white font-semibold' : 'text-white/40 hover:text-white'}`}
                  >
                    {t('auth.signupTitle')}
                    {authTab === 'signup' && (
                      <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
                    )}
                  </button>
                </div>

                {authError && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {authTab === 'signin' ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">{t('auth.email')}</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">{t('auth.password')}</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 text-sm"
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={authLoading}
                      className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl text-sm transition mt-6 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20 disabled:opacity-50"
                    >
                      {authLoading ? t('auth.authorizing') : t('auth.loginBtn')}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* Signup Type Toggle */}
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">{t('auth.accountType')}</label>
                      <div className="grid grid-cols-2 gap-2 p-1 bg-[#090A0D] rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => setSignupType('client')}
                          className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${signupType === 'client' ? 'bg-teal-500 text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                          {t('auth.clientType')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSignupType('business')}
                          className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${signupType === 'business' ? 'bg-teal-500 text-black shadow-lg' : 'text-white/60 hover:text-white'}`}
                        >
                          {t('auth.businessType')}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">{t('auth.fullName')}</label>
                      <input 
                        type="text" 
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={t('auth.fullNamePlaceholder')}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">{t('auth.email')}</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="username@example.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">{t('auth.password')}</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={t('auth.passwordPlaceholder')}
                        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 text-sm"
                        required
                      />
                    </div>

                    {signupType === 'client' ? (
                      <div>
                        <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">{t('auth.preferences')}</label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {availablePrefs.map((pref) => {
                            const isSelected = preferences.includes(pref.id);
                            return (
                              <button
                                type="button"
                                key={pref.id}
                                onClick={() => togglePreference(pref.id)}
                                className={`text-xs px-2.5 py-1 rounded-full border transition ${isSelected ? 'bg-teal-500/10 text-teal-400 border-teal-500/30 font-medium' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                              >
                                {pref.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 pt-2 border-t border-white/5">
                        <div>
                          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">{t('auth.companyName')}</label>
                          <input 
                            type="text" 
                            value={businessName}
                            onChange={e => setBusinessName(e.target.value)}
                            placeholder={t('auth.companyPlaceholder')}
                            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">{t('auth.companyCategory')}</label>
                          <select
                            value={businessCategory}
                            onChange={e => setBusinessCategory(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 text-sm"
                          >
                            <option value="Spa & Wellness">{t('auth.categorySpa')}</option>
                            <option value="Fitness & Active">{t('auth.categoryFit')}</option>
                            <option value="Beauty & Style">{t('auth.categoryBeauty')}</option>
                            <option value="Restaurant">{t('auth.categoryRestaurant')}</option>
                            <option value="Service Center">{t('auth.categoryService')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/60 uppercase tracking-wider mb-1.5">{t('auth.companyDesc')}</label>
                          <textarea
                            value={businessDescription}
                            onChange={e => setBusinessDescription(e.target.value)}
                            placeholder={t('auth.companyDescPlaceholder')}
                            rows={2}
                            className="w-full px-4 py-2 rounded-xl border border-white/10 bg-[#090A0D] text-white focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 text-sm resize-none"
                          />
                        </div>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={authLoading}
                      className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl text-sm transition mt-6 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 hover:shadow-teal-500/20"
                    >
                      {authLoading 
                        ? (signupType === 'business' ? t('auth.creatingBusiness') : t('auth.creatingAccount')) 
                        : (signupType === 'business' ? t('auth.registerBusinessBtn') : t('auth.registerBtn'))}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          
          /* 2. MAIN APPLICATION DESKTOP VIEW */
          <motion.div 
            key="app-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col min-h-screen"
          >
            {/* Header Navigation Bar */}
            <motion.header 
              id="main-header"
              className="sticky top-0 z-30 flex items-center transition-shadow duration-300"
              initial={{ 
                height: "80px", 
                backgroundColor: theme === 'light' ? "rgba(255, 255, 255, 0)" : "rgba(9, 10, 13, 0)",
                borderBottomColor: theme === 'light' ? "rgba(0, 0, 0, 0)" : "rgba(255, 255, 255, 0)",
                boxShadow: "0 0 0 rgba(0, 0, 0, 0)"
              }}
              animate={{ 
                height: scrolled ? "64px" : "80px",
                backgroundColor: theme === 'light' 
                  ? (scrolled ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0)")
                  : (scrolled ? "rgba(9, 10, 13, 0.95)" : "rgba(9, 10, 13, 0)"),
                borderBottomColor: theme === 'light'
                  ? (scrolled ? "rgba(0, 0, 0, 0.08)" : "rgba(0, 0, 0, 0)")
                  : (scrolled ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0)"),
                backdropFilter: scrolled ? "blur(12px)" : "blur(0px)",
                boxShadow: scrolled 
                  ? (theme === 'light' 
                      ? "0 4px 20px -2px rgba(0, 0, 0, 0.05)" 
                      : "0 10px 30px -10px rgba(0, 0, 0, 0.5)") 
                  : "0 0 0 rgba(0, 0, 0, 0)"
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              style={{ borderBottomWidth: "1px", borderBottomStyle: "solid", transition: "box-shadow 0.3s ease-in-out" }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-full">
                <div className="flex items-center justify-between h-full">
                  
                  {/* Left Side Logo */}
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveModule('ai-assistant')}>
                      <div className="w-9 h-9 rounded-xl bg-teal-500 flex items-center justify-center text-black font-bold font-display shadow-lg shadow-teal-500/25">
                        Ω
                      </div>
                      <div>
                        <span className="font-display font-bold text-base tracking-tight text-white block">OmniReserve</span>
                        <span className="text-[9px] text-teal-400 font-mono tracking-widest uppercase block -mt-1 font-bold">Unified Platform</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side Profile Information */}
                  <div className="flex items-center gap-4">

                    
                    {/* Simulated Balance */}
                    <div className="bg-white/5 border border-white/10 rounded-full py-1.5 pl-3 pr-4 flex items-center gap-2 shadow-2xs">
                      <Coins className="w-4 h-4 text-teal-400" />
                      <div className="text-right">
                        <span className="text-[10px] text-white/40 font-mono block -mb-1 font-bold">{t('common.depositBalance')}</span>
                        <span className="text-xs font-mono font-bold text-white">{user.balance.toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <button 
                        onClick={() => setAddingBalance(true)}
                        className="ml-1.5 w-5 h-5 rounded-full bg-teal-500 hover:bg-teal-400 text-black flex items-center justify-center font-bold text-xs transition"
                        title={t('common.topUp')}
                      >
                        +
                      </button>
                    </div>

                    {/* Notification Bell Dropdown */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition relative"
                        title={t('dashboard.notifications')}
                      >
                        <Bell className="w-4.5 h-4.5" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-teal-500 text-black text-[10px] font-extrabold flex items-center justify-center border-2 border-[#090A0D]">
                            {unreadCount}
                          </span>
                        )}
                      </button>

                      <AnimatePresence>
                        {showNotifications && (
                          <>
                            {/* Backdrop overlay to close when clicking outside */}
                            <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                            
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#16191F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 py-2"
                            >
                              <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                                <span className="font-display font-bold text-xs text-white uppercase tracking-wider">{t('dashboard.notifications')}</span>
                                {unreadCount > 0 && (
                                  <button 
                                    onClick={handleReadAllNotifications}
                                    className="text-[11px] text-teal-400 hover:text-teal-300 font-bold"
                                  >
                                    {t('dashboard.readAll')}
                                  </button>
                                )}
                              </div>
                              
                              {/* Desktop Notification Request Banner */}
                              {("Notification" in window) && (
                                <div className="px-4 py-2.5 bg-[#1a1d24] border-b border-white/5 flex flex-col gap-1 text-[11px]">
                                  {notificationPermission === "default" && (
                                    <button
                                      onClick={requestNotificationPermission}
                                      className="w-full text-center bg-teal-500 hover:bg-teal-400 text-black font-bold py-1.5 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/10"
                                    >
                                      <span className="animate-pulse">🔔</span> {t('common.enableBrowserNotifications')}
                                    </button>
                                  )}
                                  {notificationPermission === "granted" && (
                                    <div className="text-teal-400 font-semibold flex items-center gap-1.5 justify-center py-1 bg-teal-500/5 rounded-xl border border-teal-500/10">
                                      <span>✅</span> {t('common.browserNotificationsEnabled')}
                                    </div>
                                  )}
                                  {notificationPermission === "denied" && (
                                    <div className="text-red-400 font-semibold flex items-center gap-1.5 justify-center py-1 bg-red-500/5 rounded-xl border border-red-500/10">
                                      <span>❌</span> {t('common.browserNotificationsBlocked')}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                                {notifications.length === 0 ? (
                                  <div className="py-8 text-center text-xs text-white/40">
                                    {t('dashboard.noNewNotifications')}
                                  </div>
                                ) : (
                                  notifications.map((n) => (
                                    <div 
                                      key={n.id} 
                                      className={`p-3.5 text-xs transition text-left ${n.read ? 'opacity-60' : 'bg-teal-500/[0.02]'}`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="font-semibold text-white flex items-center gap-1.5 text-left">
                                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />}
                                          <span>{n.title}</span>
                                        </div>
                                        <span className="text-[9px] font-mono text-white/30 shrink-0">
                                          {new Date(n.createdAt).toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                      <p className="text-white/60 mt-1 leading-relaxed text-left">{n.message}</p>
                                      {!n.read && (
                                        <button 
                                          onClick={() => handleReadNotification(n.id)}
                                          className="text-[10px] text-teal-400 hover:text-teal-300 font-bold mt-1.5 block cursor-pointer"
                                        >
                                          {t('dashboard.markAsRead')}
                                        </button>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* QR Code Scanner Button */}
                    <button 
                      onClick={() => setShowQrScanner(true)}
                      className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1.5 cursor-pointer text-xs font-semibold px-3"
                      title={i18n.language === 'ru' ? 'Сканировать QR-код чекина' : 'Scan Check-In QR Code'}
                    >
                      <Camera className="w-4 h-4 shrink-0 text-indigo-400 animate-pulse" />
                      <span className="hidden md:inline">{i18n.language === 'ru' ? 'Сканировать QR' : 'Scan QR'}</span>
                    </button>

                    {/* Platform Owner Controls Button */}
                    {user && user.role === 'platform_admin' && (
                      <button 
                        onClick={() => navigateToModule('platform')}
                        className={`p-2 rounded-xl border transition flex items-center gap-1.5 cursor-pointer text-xs font-bold px-3 ${
                          activeModule === 'platform'
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                        }`}
                        title="Platform Owner Controls & Governance"
                      >
                        <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                        <span className="hidden md:inline">Platform Controls</span>
                      </button>
                    )}

                    {/* Profile Dropdown */}
                    <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                      <div 
                        onClick={() => setShowSettingsModal(true)}
                        className="flex items-center gap-3 cursor-pointer group"
                        title={t('dashboard.profileSettings')}
                      >
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-9 h-9 rounded-full ring-2 ring-teal-500/20 group-hover:ring-teal-400 object-cover transition"
                        />
                        <div className="hidden sm:block text-left">
                          <span className="text-xs font-semibold text-white block leading-tight group-hover:text-teal-400 transition">{user.name}</span>
                          <span className="text-[10px] text-white/40 block font-mono">{user.email}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => setShowSettingsModal(true)}
                        className="p-1.5 rounded-lg text-white/40 hover:text-teal-400 hover:bg-white/5 transition"
                        title={t('dashboard.profileSettings')}
                      >
                        <Settings className="w-4 h-4" />
                      </button>



                      <div className="pl-3 border-l border-white/10 flex items-center">
                        <LanguageSwitcher />
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </motion.header>

            {/* Notification messages toast banner */}
            <AnimatePresence mode="wait">
              {bookingSuccessMsg && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="bg-[#16191F] border-b border-white/5 text-white py-3 px-4 shadow-md sticky top-16 z-20"
                >
                  <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-teal-400 shrink-0 animate-bounce" />
                      <span>{bookingSuccessMsg}</span>
                    </div>
                    <button onClick={() => setBookingSuccessMsg("")} className="text-white/40 hover:text-white ml-4 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main view router based on activeModule */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              
              {/* BALANCE TOPUP MODAL (Simulation) */}
              <AnimatePresence>
                {addingBalance && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-[#16191F] rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-white/5"
                    >
                      <button 
                        onClick={() => setAddingBalance(false)}
                        className="absolute top-4 right-4 text-white/40 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <h3 className="text-lg font-display font-bold text-white mb-2 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-teal-400" />
                        {t('dashboard.topUpTitle')}
                      </h3>
                      <p className="text-xs text-white/60 mb-4">
                        {t('dashboard.topUpDesc')}
                      </p>
                      
                      <form onSubmit={handleAddBalance} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-white/60 mb-1">{t('dashboard.depositAmountLabel')}</label>
                          <input 
                            type="number" 
                            value={depositAmount} 
                            onChange={e => setDepositAmount(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-white/10 bg-[#090A0D] text-white text-sm focus:outline-none focus:border-teal-500 font-mono font-bold"
                            placeholder="5000"
                            required
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                          <button 
                            type="button" 
                            onClick={() => setAddingBalance(false)}
                            className="px-4 py-2 border border-white/10 rounded-xl text-xs text-white/60 hover:bg-white/5 hover:text-white transition"
                          >
                            {t('dashboard.cancelBtn')}
                          </button>
                          <button 
                            type="submit" 
                            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl text-xs transition shadow-md shadow-teal-500/10"
                          >
                            {t('dashboard.topUpBtn')}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>


              {/* PLATFORM OWNER CONTROLS & GOVERNANCE */}
              {activeModule === 'platform' && (
                user && user.role === 'platform_admin' ? (
                  <PlatformControlPanel
                    user={user}
                    venues={venues}
                    setVenues={setVenues}
                    violations={violations}
                    setViolations={setViolations}
                    legalSettings={legalSettings}
                    setLegalSettings={setLegalSettings}
                    campaigns={campaigns}
                    setCampaigns={setCampaigns}
                    onOpenTermsModal={() => setShowTermsModal(true)}
                    onAddNotification={(title, message) => {
                      toast.success(`${title}: ${message}`);
                    }}
                  />
                ) : (
                  <div className="max-w-xl mx-auto py-16 px-4">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#12141A] border border-amber-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-left"
                    >
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                      
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <ShieldAlert className="w-7 h-7" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase block">
                            RESTRICTED ROUTE • /superadmin
                          </span>
                          <h2 className="text-xl font-display font-extrabold text-white">
                            {i18n.language === 'ru' ? 'Вход для Администраторов OmniReserve' : 'OmniReserve Admin Portal Access'}
                          </h2>
                        </div>
                      </div>

                      <p className="text-xs text-white/70 leading-relaxed mb-6">
                        {i18n.language === 'ru' 
                          ? 'Модуль управления платформой предназначен исключительно для главных администраторов OmniReserve. Здесь осуществляется модерация заведений, разрешение жалоб, настройка комиссий и юридических оферт.'
                          : 'The Platform Controls module is strictly reserved for OmniReserve platform operators. Access allows venue verification, complaint arbitration, commission tier management, and TOS policy updates.'}
                      </p>

                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (adminPasscode.trim() === "2026" || adminPasscode.trim().toLowerCase() === "admin") {
                            setUser({
                              id: 'admin-owner',
                              name: 'OmniReserve Superadmin',
                              email: 'owner@omnireserve.io',
                              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
                              role: 'platform_admin',
                              balance: 100000
                            });
                            setAdminPasscode("");
                            setAdminGateError("");
                            toast.success(i18n.language === 'ru' ? 'Авторизован как Суперадминистратор OmniReserve' : 'Authorized as OmniReserve Platform Admin');
                          } else {
                            setAdminGateError(i18n.language === 'ru' ? 'Неверный пароль администратора (по умолчанию: 2026)' : 'Invalid admin passcode (default: 2026)');
                          }
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-xs font-semibold text-white/60 mb-1.5">
                            {i18n.language === 'ru' ? 'Пароль администратора:' : 'Admin Passcode:'}
                          </label>
                          <input 
                            type="password"
                            value={adminPasscode}
                            onChange={(e) => {
                              setAdminPasscode(e.target.value);
                              setAdminGateError("");
                            }}
                            placeholder={i18n.language === 'ru' ? 'Введите пароль (2026)' : 'Enter passcode (2026)'}
                            className="w-full px-4 py-3 rounded-xl bg-[#090A0D] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500 font-mono"
                          />
                          {adminGateError && (
                            <p className="text-xs text-rose-400 mt-1.5 font-medium">{adminGateError}</p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                          <button
                            type="submit"
                            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
                          >
                            <ShieldAlert className="w-4 h-4" />
                            <span>{i18n.language === 'ru' ? 'Войти как Суперадминистратор' : 'Authenticate as Admin'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setUser({
                                id: 'admin-owner',
                                name: 'OmniReserve Superadmin',
                                email: 'owner@omnireserve.io',
                                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
                                role: 'platform_admin',
                                balance: 100000
                              });
                              setAdminGateError("");
                              toast.success(i18n.language === 'ru' ? 'Переключено на аккаунт Суперадминистратора' : 'Switched to Platform Admin Profile');
                            }}
                            className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
                          >
                            {i18n.language === 'ru' ? 'Демо-вход (1-клик)' : 'Quick Demo Unlock'}
                          </button>
                        </div>
                      </form>

                      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-white/40">
                        <span>Route: <code className="text-amber-400/80">/superadmin</code></span>
                        <button
                          onClick={() => navigateToModule('ai-assistant')}
                          className="hover:text-white transition cursor-pointer underline underline-offset-2"
                        >
                          {i18n.language === 'ru' ? '← На главную' : '← Return to App'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )
              )}

              {/* ANALYTICS & REVENUE DASHBOARD */}
              {activeModule === 'analytics' && (
                <AnalyticsDashboard
                  user={user}
                  bookings={bookings}
                  hotelBookings={hotelBookings}
                  restaurants={restaurants}
                  salons={salons}
                  hotels={hotels}
                  rooms={rooms}
                  theme={theme}
                  onTabChange={(tab) => setActiveModule(tab)}
                />
              )}


              {/* A. DASHBOARD VIEW (Unified client state) */}
              {activeModule === 'dashboard' && (
                <div className="space-y-8" id="dashboard-module">
                  
                  {/* Grid 1: Welcome banner + AI Assistant recommendations */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Welcome card */}
                    <div className="lg:col-span-2 bg-[#16191F] border border-white/5 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl flex flex-col justify-between min-h-[240px]">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-radial-at-tr from-teal-500/10 via-transparent to-transparent opacity-70 pointer-events-none" />
                      
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 text-[10px] font-mono tracking-wider uppercase mb-4">
                          <Sparkles className="w-3 h-3 text-teal-400" />
                          {t('dashboard.unifiedCabinet')}
                        </div>
                        <h2 className="text-3xl font-display font-bold tracking-tight mb-2">
                          {t('dashboard.welcomeUser', { name: user.name })}
                        </h2>
                        <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-xl">
                          {t('dashboard.welcomeDesc')}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-6">
                        <button 
                          onClick={() => setActiveModule('tabletop')}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-lg shadow-teal-500/20"
                        >
                          <Map className="w-3.5 h-3.5" />
                          {t('dashboard.tableLayoutBtn')}
                        </button>
                        <button 
                          onClick={() => setActiveModule('bookly')}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-xl text-xs transition flex items-center gap-1.5"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          {t('dashboard.bookServiceBtn')}
                        </button>
                        <button 
                          onClick={() => setShowPersonalQr(true)}
                          className="px-4 py-2 bg-[#14f195]/10 hover:bg-[#14f195]/20 border border-[#14f195]/30 text-[#14f195] font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          {t('dashboard.quickCheckinQr')}
                        </button>
                      </div>
                    </div>

                    {/* AI Personal recommendations using Gemini 3.5 */}
                    <div className="bg-[#16191F] rounded-3xl p-6 border border-white/5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl -z-10" />
                      
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <span className="font-display font-bold text-sm text-white">{t('dashboard.aiConcierge')}</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/50 border border-white/10 uppercase font-bold">Gemini 3.5</span>
                        </div>

                        {recoLoading ? (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                            <div className="w-8 h-8 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
                            <p className="text-xs text-white/40 font-medium">{t('dashboard.aiLoading')}</p>
                          </div>
                        ) : recommendation ? (
                          <div className="space-y-4">
                            <p className="text-xs text-white/80 leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/5">
                              «{recommendation.summary}»
                            </p>
                            
                            {/* Tips */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider block">{t('dashboard.personalTips', 'Personal tips:')}</span>
                              {recommendation.tips.slice(0, 2).map((tip, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-xs text-white/70">
                                  <span className="text-teal-400 font-bold mt-0.5">•</span>
                                  <span>{tip}</span>
                                </div>
                              ))}
                            </div>

                            {/* Promo code */}
                            {recommendation.promoCode && (
                              <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-2.5 flex items-center justify-between">
                                <div className="text-[10px]">
                                  <span className="text-white/40 block font-mono -mb-0.5 uppercase font-bold">{t('dashboard.secretPromoCode', 'SECRET PROMO CODE')}</span>
                                  <span className="text-xs font-bold text-white uppercase tracking-widest">{recommendation.promoCode}</span>
                                </div>
                                <span className="text-xs px-2 py-1 bg-teal-500 text-black rounded-lg font-bold font-mono">15% OFF</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-10 space-y-3">
                            <p className="text-xs text-white/40">{t('dashboard.recoUnavailable')}</p>
                            <button 
                              onClick={() => loadAIRecommendations(user.id)}
                              className="text-xs text-teal-400 hover:text-teal-300 font-bold underline"
                            >
                              {t('dashboard.refreshBtn')}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-white/40 font-mono text-[10px]">{t('dashboard.recoUpdatedJustNow')}</span>
                        <button 
                          onClick={() => loadAIRecommendations(user.id)}
                          className="text-white/60 hover:text-white font-semibold flex items-center gap-1 hover:underline"
                        >
                          {t('dashboard.regenerateAiBtn')} <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Booking shortcut launcher banners */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Launch tabletop */}
                    <div className="bg-[#16191F] rounded-2xl p-6 border border-white/5 shadow-xl hover:border-white/10 transition flex flex-col justify-between group">
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-white/5 text-orange-400 border border-white/5 flex items-center justify-center mb-4 font-bold text-lg">
                          🍽️
                        </div>
                        <h3 className="font-display font-bold text-lg text-white mb-1">{t('dashboard.restaurantTablePlanTitle')}</h3>
                        <p className="text-xs text-white/60 leading-relaxed mb-4">
                          {t('dashboard.restaurantTablePlanDesc')}
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveModule('tabletop')}
                        className="w-full py-2.5 px-4 bg-white/5 hover:bg-teal-500 hover:text-black border border-white/10 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2"
                      >
                        {t('dashboard.openTabletopLayoutBtn')} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Launch bookly */}
                    <div className="bg-[#16191F] rounded-2xl p-6 border border-white/5 shadow-xl hover:border-white/10 transition flex flex-col justify-between group">
                      <div>
                        <div className="w-12 h-12 rounded-xl bg-white/5 text-teal-400 border border-white/5 flex items-center justify-center mb-4 font-bold text-lg">
                          🌸
                        </div>
                        <h3 className="font-display font-bold text-lg text-white mb-1">{t('dashboard.spaBeautyTitle')}</h3>
                        <p className="text-xs text-white/60 leading-relaxed mb-4">
                          {t('dashboard.spaBeautyDesc')}
                        </p>
                      </div>
                      <button 
                        onClick={() => setActiveModule('bookly')}
                        className="w-full py-2.5 px-4 bg-white/5 hover:bg-teal-500 hover:text-black border border-white/10 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2"
                      >
                        {t('dashboard.openBooklyBtn')} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Monthly Spend Summary Widget */}
                    {(() => {
                      const spending = getMonthlySpending();
                      return (
                        <div className="bg-[#16191F] rounded-2xl p-6 border border-white/5 shadow-xl hover:border-white/10 transition flex flex-col justify-between group relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -z-10" />
                          
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-white/5 text-amber-400 border border-white/5">
                                  <TrendingUp className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="font-display font-bold text-sm text-white">{t('dashboard.spendingAnalysis')}</h3>
                                  <span className="text-[10px] text-white/40 block font-mono uppercase">{spending.monthName}</span>
                                </div>
                              </div>
                              <span className="text-xs px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-white font-mono font-bold">
                                {spending.total.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US')} ₽
                              </span>
                            </div>
                            
                            <p className="text-xs text-white/60 leading-relaxed mb-4">
                              {t('dashboard.spendingAnalysisDesc')}
                            </p>

                            <div className="space-y-3 mb-4">
                              {/* Legend & Stats */}
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="flex items-center gap-1.5 text-orange-400 font-semibold font-mono">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                  {spending.diningPercent.toFixed(0)}% {t('dashboard.diningLabel')}
                                </span>
                                <span className="flex items-center gap-1.5 text-teal-400 font-semibold font-mono">
                                  {spending.wellnessPercent.toFixed(0)}% {t('dashboard.wellnessLabel')}
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div className="w-full h-2.5 rounded-full bg-white/5 flex overflow-hidden border border-white/5 p-[1px]">
                                {spending.total > 0 ? (
                                  <>
                                    {spending.diningTotal > 0 && (
                                      <div 
                                        style={{ width: `${spending.diningPercent}%` }} 
                                        className="bg-gradient-to-r from-orange-600 to-orange-400 h-full first:rounded-l-full last:rounded-r-full transition-all duration-500" 
                                        title={`${t('dashboard.diningLabel')}: ${spending.diningTotal.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US')} ₽`} 
                                      />
                                    )}
                                    {spending.wellnessTotal > 0 && (
                                      <div 
                                        style={{ width: `${spending.wellnessPercent}%` }} 
                                        className="bg-gradient-to-r from-teal-500 to-teal-400 h-full first:rounded-l-full last:rounded-r-full transition-all duration-500" 
                                        title={`${t('dashboard.wellnessLabel')}: ${spending.wellnessTotal.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US')} ₽`} 
                                      />
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full bg-white/10 rounded-full flex items-center justify-center">
                                    <span className="text-[9px] text-white/30 font-mono uppercase font-bold">{t('dashboard.noSpendingThisMonth')}</span>
                                  </div>
                                )}
                              </div>

                              {/* Bottom exact values */}
                              <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/[0.03]">
                                <div className="text-left">
                                  <span className="text-[10px] text-white/40 block font-mono">DINING</span>
                                  <span className="text-xs font-bold text-white font-mono">{spending.diningTotal.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US')} ₽</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-white/40 block font-mono">WELLNESS</span>
                                  <span className="text-xs font-bold text-white font-mono">{spending.wellnessTotal.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US')} ₽</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <button 
                            onClick={() => setAddingBalance(true)}
                            className="w-full py-2.5 px-4 bg-white/5 hover:bg-teal-500/10 hover:text-teal-300 border border-white/10 hover:border-teal-500/20 rounded-xl text-xs font-bold text-white transition flex items-center justify-center gap-2"
                          >
                            <Coins className="w-3.5 h-3.5 text-teal-400" />
                            {t('dashboard.depositTopUpBtn')}
                          </button>
                        </div>
                      );
                    })()}

                  </div>

                  {/* Booking Overview Recharts Chart Card */}
                  <div className="bg-[#16191F] rounded-2xl border border-white/5 p-6 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-teal-400" />
                          <h3 className="font-display font-bold text-base text-white">{t('dashboard.analyticsTitle')}</h3>
                        </div>
                        <p className="text-white/40 text-xs mt-1">
                          {t('dashboard.bookingTrend')}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span className="flex items-center gap-1.5 text-orange-400 font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 block animate-pulse" /> Tabletop
                        </span>
                        <span className="flex items-center gap-1.5 text-teal-400 font-bold">
                          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 block animate-pulse" /> Bookly
                        </span>
                      </div>
                    </div>

                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={bookingOverviewData}
                          margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorTabletop" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorBookly" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            stroke="rgba(255,255,255,0.3)" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis 
                            stroke="rgba(255,255,255,0.3)" 
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#090A0D', 
                              borderColor: 'rgba(255,255,255,0.1)',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px',
                              fontFamily: 'system-ui'
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="Tabletop" 
                            stroke="#f97316" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorTabletop)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="Bookly" 
                            stroke="#0d9488" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorBookly)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Interactive Google Map Hub with live grounding assistance */}
                  <InteractiveMapHub
                    setActiveModule={setActiveModule}
                    setSelectedRestaurant={setSelectedRestaurant}
                    setSelectedSalon={setSelectedSalon}
                    restaurants={restaurants}
                    salons={salons}
                    theme={theme}
                  />

                  {/* Google Calendar Sync Center */}
                  <div className={`rounded-2xl border mb-6 overflow-hidden shadow-xl transition-all ${
                    theme === 'light' 
                      ? "bg-white border-gray-200 text-gray-800" 
                      : "bg-[#16191F] border-white/5 text-white"
                  }`}>
                    <div className={`px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                      theme === 'light' ? "border-gray-100 bg-gray-50/50" : "border-white/5 bg-white/[0.01]"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                          <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className={`font-display font-bold text-base ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                            {t('dashboard.gcalSyncTitle')}
                          </h3>
                          <span className={`text-[10px] font-mono uppercase tracking-wider block ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>
                            Google Workspace Integration
                          </span>
                        </div>
                      </div>

                      {isGoogleCalendarConnected ? (
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${
                            theme === 'light' ? "bg-emerald-50 text-emerald-600" : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{t('dashboard.gcalActive')}</span>
                          </span>
                          <button
                            onClick={handleDisconnectGoogleCalendar}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                              theme === 'light' 
                                ? "bg-white border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-600 hover:text-red-600" 
                                : "bg-white/5 border-white/10 hover:border-red-500/30 hover:bg-red-500/10 text-white/70 hover:text-red-400"
                            }`}
                          >
                            {t('dashboard.gcalDisconnectBtn')}
                          </button>
                        </div>
                      ) : (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          theme === 'light' ? "bg-gray-100 text-gray-500" : "bg-white/5 text-white/40"
                        }`}>
                          {t('dashboard.gcalNotConnected')}
                        </span>
                      )}
                    </div>

                    <div className="p-6">
                      {!isGoogleCalendarConnected ? (
                        <div className="text-center py-6 max-w-lg mx-auto">
                          <p className={`text-sm mb-4 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>
                            {t('dashboard.gcalConnectDesc')}
                          </p>
                          <button
                            onClick={handleConnectGoogleCalendar}
                            disabled={isCalendarLoading}
                            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/15 transition flex items-center justify-center gap-2.5 mx-auto cursor-pointer disabled:opacity-50 font-display"
                          >
                            {isCalendarLoading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <span>Connect with Google Calendar</span>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Connection Stats & Auto-Sync Toggle */}
                          <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            theme === 'light' ? "bg-gray-50 border-gray-100" : "bg-white/[0.01] border-white/5"
                          }`}>
                            <div className="flex items-center gap-3">
                              <img 
                                src={googleCalendarUser?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=50"} 
                                alt="Google Avatar" 
                                className="w-9 h-9 rounded-full border border-blue-500/30 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <span className={`text-[9px] block font-mono ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>{t('dashboard.gcalActiveAccount')}</span>
                                <span className={`text-sm font-semibold block ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                                  {googleCalendarUser?.email || "Google User"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 md:border-l md:border-white/5 md:pl-6">
                              <div className="text-left md:text-right">
                                <span className={`text-[10px] block font-semibold ${theme === 'light' ? 'text-gray-500' : 'text-white/50'}`}>
                                  {t('dashboard.gcalAutoSync')}
                                </span>
                                <span className={`text-[9px] block ${theme === 'light' ? 'text-gray-400' : 'text-white/30'}`}>
                                  {t('dashboard.gcalAutoSyncDesc')}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  const next = !autoSyncToCalendar;
                                  setAutoSyncToCalendar(next);
                                  localStorage.setItem("gcal_autosync", String(next));
                                }}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                                  autoSyncToCalendar ? "bg-emerald-500" : "bg-white/10"
                                }`}
                              >
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out transform ${
                                  autoSyncToCalendar ? "translate-x-6" : "translate-x-0"
                                }`} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Side: Sync current bookings status list */}
                            <div className="space-y-3">
                              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                                theme === 'light' ? 'text-gray-500' : 'text-white/50'
                              }`}>
                                <span>{t('dashboard.gcalSyncStatusTitle')}</span>
                              </h4>

                              <div className={`rounded-xl border divide-y max-h-[250px] overflow-y-auto pr-1 ${
                                theme === 'light' ? "border-gray-100 divide-gray-100 bg-gray-50/20" : "border-white/5 divide-white/5 bg-black/10"
                              }`}>
                                {bookings.length === 0 ? (
                                  <div className="p-4 text-center text-xs text-white/40">
                                    {t('dashboard.gcalEmptySyncList')}
                                  </div>
                                ) : (
                                  bookings.map((booking) => {
                                    const isSynced = !!syncedBookingIds[booking.id];
                                    const isSyncing = syncedBookingIds[booking.id] === "syncing";
                                    return (
                                      <div key={booking.id} className="p-4 flex items-center justify-between gap-4 text-left">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className={`text-xs font-semibold truncate ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                                              {booking.type === 'table' ? `Столик #${booking.tableNumber}` : booking.serviceName}
                                            </span>
                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                              booking.type === 'table' 
                                                ? 'bg-orange-500/10 text-orange-400' 
                                                : 'bg-teal-500/10 text-teal-400'
                                            }`}>
                                              {booking.type === 'table' ? 'Table' : 'Spa'}
                                            </span>
                                          </div>
                                          <span className={`text-[10px] block mt-0.5 ${theme === 'light' ? 'text-gray-400' : 'text-white/40'}`}>
                                            {booking.date} в {booking.time}
                                          </span>
                                        </div>

                                        <div className="shrink-0">
                                          {isSynced && !isSyncing ? (
                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                                <Check className="w-3.5 h-3.5" /> СИНХР.
                                              </span>
                                              <button
                                                onClick={() => handleUnsyncBooking(booking)}
                                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                                  theme === 'light'
                                                    ? "bg-white border-red-100 hover:bg-red-50 text-red-500 animate-hover"
                                                    : "bg-white/5 border-red-500/10 hover:bg-red-500/10 text-red-400 animate-hover"
                                                }`}
                                                title={t('dashboard.cancelBookingTooltip')}
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() => triggerSyncBooking(booking)}
                                              disabled={isSyncing || isCalendarLoading}
                                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                                theme === 'light'
                                                  ? "bg-blue-50 hover:bg-blue-100 text-blue-600 animate-hover"
                                                  : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/15 animate-hover"
                                              }`}
                                            >
                                              {isSyncing ? (
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                              ) : (
                                                <>
                                                  <Link2 className="w-3 h-3" />
                                                  <span>{t('dashboard.gcalSyncBtn')}</span>
                                                </>
                                              )}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            {/* Right Side: Real-time Upcoming events from user's primary calendar */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                                  theme === 'light' ? 'text-gray-500' : 'text-white/50'
                                }`}>
                                  <span>{t('dashboard.gcalUpcomingEventsTitle')}</span>
                                </h4>
                                <button
                                  onClick={refreshGoogleCalendarEvents}
                                  disabled={isCalendarLoading}
                                  className={`p-1.5 rounded-lg border transition cursor-pointer disabled:opacity-50 animate-hover ${
                                    theme === 'light'
                                      ? "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                                      : "bg-white/5 border-white/10 hover:bg-white/10 text-white/70"
                                  }`}
                                  title="Refresh events"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${isCalendarLoading ? 'animate-spin' : ''}`} />
                                </button>
                              </div>

                              <div className={`rounded-xl border p-4 space-y-3 ${
                                theme === 'light' ? "border-gray-100 bg-gray-50/20" : "border-white/5 bg-black/10"
                              }`}>
                                {isCalendarLoading && googleCalendarEvents.length === 0 ? (
                                  <div className="text-center py-6 text-xs text-white/40">
                                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-blue-500" />
                                    <span>{t('dashboard.gcalLoadingEvents')}</span>
                                  </div>
                                ) : calendarError ? (
                                  <div className="text-center py-4 text-xs text-red-400">
                                    {calendarError}
                                  </div>
                                ) : googleCalendarEvents.length === 0 ? (
                                  <div className="text-center py-6 text-xs text-white/40">
                                    {t('dashboard.gcalNoUpcomingEvents')}
                                  </div>
                                ) : (
                                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {googleCalendarEvents.map((evt) => {
                                      const startRaw = evt.start.dateTime || evt.start.date || "";
                                      const dateFormatted = startRaw ? new Date(startRaw).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }) : t('dashboard.gcalNoDate');

                                      return (
                                        <div 
                                          key={evt.id} 
                                          className={`p-2.5 rounded-lg border text-left text-xs transition ${
                                            theme === 'light' 
                                              ? "bg-white border-gray-100 hover:border-gray-200" 
                                              : "bg-white/[0.02] border-white/5 hover:border-white/10"
                                          }`}
                                        >
                                          <div className="flex justify-between items-start gap-2">
                                            <span className={`font-semibold truncate max-w-[70%] ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                                              {evt.summary}
                                            </span>
                                            <span className={`text-[9px] font-mono shrink-0 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold`}>
                                              {dateFormatted}
                                            </span>
                                          </div>
                                          {evt.location && (
                                            <span className={`text-[10px] block mt-1 ${theme === 'light' ? 'text-gray-400' : 'text-white/30'}`}>
                                              📍 {evt.location}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unified reservations history panel */}
                  <div className="bg-[#16191F] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                    <div className="px-6 py-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-400" />
                        <h3 className="font-display font-bold text-base text-white">{t('dashboard.unifiedBookingsTitle')}</h3>
                        <span className="text-[10px] font-mono px-2.5 py-1 bg-white/5 border border-white/10 text-white/50 rounded-full font-bold uppercase">
                          {t('dashboard.unifiedBookingsTotal', { count: bookings.length })}
                        </span>
                      </div>

                      <div className="flex rounded-xl bg-white/5 p-1 border border-white/5 shrink-0 self-start sm:self-auto">
                        <button 
                          onClick={() => setBookingHistoryView('list')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${bookingHistoryView === 'list' ? 'bg-white/10 text-white shadow-xs font-bold' : 'text-white/40 hover:text-white'}`}
                        >
                          <List className="w-3.5 h-3.5" />
                          <span>{t('dashboard.listViewBtn')}</span>
                        </button>
                        <button 
                          onClick={() => setBookingHistoryView('calendar')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${bookingHistoryView === 'calendar' ? 'bg-white/10 text-white shadow-xs font-bold' : 'text-white/40 hover:text-white'}`}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{t('dashboard.calendarViewBtn')}</span>
                        </button>
                      </div>
                    </div>

                    {bookingHistoryView === 'list' ? (
                      bookings.length === 0 ? (
                        <div className="text-center py-12">
                          <Calendar className="w-8 h-8 text-white/20 mx-auto mb-2" />
                          <p className="text-sm text-white/60 font-medium">{t('dashboard.noActiveBookings')}</p>
                          <p className="text-xs text-white/40 mt-1">{t('dashboard.useSectionsHint')}</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {bookings.map((booking) => {
                            const isTable = booking.type === "table";
                            return (
                              <div key={booking.id} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/[0.01] transition">
                                <div className="flex items-start gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 border ${isTable ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>
                                    {isTable ? "🍽️" : "🌸"}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-sm text-white">
                                        {isTable ? `Столик #${booking.tableNumber} в ${(booking as any).restaurantName || 'Grand Atelier'}` : booking.serviceName}
                                      </span>
                                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${isTable ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>
                                        {isTable ? "Tabletop" : "Bookly"}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-white/40">
                                      {isTable ? (
                                        <>
                                          <span className="flex items-center gap-1"><Compass className="w-3.5 h-3.5 text-white/30" /> {t('dashboard.roomLabel', { room: booking.room === 'main' ? t('dashboard.roomMain') : booking.room === 'vip' ? t('dashboard.roomVip') : t('dashboard.roomTerrace') })}</span>
                                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-white/30" /> {t('dashboard.guestsCount', { count: booking.guests })}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-white/30" /> {t('dashboard.specialistName', { name: booking.staffName })}</span>
                                          <span className="flex items-center gap-1"><TagCategory category={booking.category} /></span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                                  <div className="text-left sm:text-right">
                                    <div className="flex items-center gap-1.5 text-xs text-white/80 font-semibold sm:justify-end">
                                      <Calendar className="w-3.5 h-3.5 text-white/30" />
                                      <span>{booking.date}</span>
                                      <Clock className="w-3.5 h-3.5 text-white/30 ml-1" />
                                      <span>{booking.time}</span>
                                    </div>
                                    <span className="text-xs text-white/30 font-mono block mt-0.5">ID: {booking.id}</span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <span className="text-xs text-white/40 block font-mono">{t('dashboard.costLabel')}</span>
                                      <span className="text-sm font-bold text-white font-mono">{booking.price.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US')} ₽</span>
                                    </div>
                                    
                                    <button 
                                      onClick={() => triggerUpcomingBookingAlert(booking, true)}
                                      className="p-2 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/20 text-amber-400 rounded-xl transition animate-hover"
                                      title={t('dashboard.reminderTooltip')}
                                    >
                                      <Bell className="w-4 h-4" />
                                    </button>

                                    <button 
                                      onClick={() => trigger30MinBrowserNotification(booking, true)}
                                      className="p-2 border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/20 text-teal-400 rounded-xl transition animate-hover flex items-center gap-1 text-[11px]"
                                      title="Test 30-min browser notification"
                                    >
                                      <Bell className="w-4 h-4 text-teal-400" />
                                      <span className="text-[9px] font-bold">30m</span>
                                    </button>

                                    <button 
                                      onClick={() => handleShare(booking)}
                                      className={`p-2 border rounded-xl transition duration-200 ${copiedBookingId === booking.id ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 scale-105' : 'border-white/10 hover:border-white/20 hover:bg-white/5 text-white/60 hover:text-white animate-hover'}`}
                                      title={t('dashboard.shareTooltip')}
                                    >
                                      {copiedBookingId === booking.id ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                                    </button>

                                    <button 
                                      onClick={() => setSelectedQrBooking(booking)}
                                      className="p-2 border border-[#14f195]/20 bg-[#14f195]/5 hover:bg-[#14f195]/20 text-[#14f195] rounded-xl transition animate-hover"
                                      title={t('dashboard.qrCheckinTooltip')}
                                    >
                                      <QrCode className="w-4 h-4" />
                                    </button>

                                    {isGoogleCalendarConnected && (
                                      <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                                        <span className={`text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${theme === 'light' ? 'text-gray-500' : 'text-white/40'}`}>
                                          {t('dashboard.gcalSyncToggle', 'Sync to Google Calendar')}
                                        </span>
                                        <button
                                          onClick={() => {
                                            if (autoSyncToCalendar) return;
                                            if (syncedBookingIds[booking.id]) {
                                              handleUnsyncBooking(booking);
                                            } else {
                                              triggerSyncBooking(booking);
                                            }
                                          }}
                                          disabled={isCalendarLoading || autoSyncToCalendar}
                                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                            syncedBookingIds[booking.id] || autoSyncToCalendar ? 'bg-emerald-500' : 'bg-white/10'
                                          } ${autoSyncToCalendar ? 'opacity-60 cursor-not-allowed' : ''}`}
                                          title={autoSyncToCalendar ? t('dashboard.gcalAutoSyncedTitle', 'Auto-synced') : (syncedBookingIds[booking.id] ? t('dashboard.gcalConnectedTooltip') : t('dashboard.gcalNotConnectedTooltip'))}
                                        >
                                          <span
                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                              syncedBookingIds[booking.id] || autoSyncToCalendar ? 'translate-x-4' : 'translate-x-0'
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    )}

                                    <button 
                                      onClick={() => {
                                        if (confirm(t('dashboard.cancelBookingConfirm'))) {
                                          setUser({ ...user, balance: user.balance + booking.price });
                                          setBookings(bookings.filter(b => b.id !== booking.id));
                                          setBookingSuccessMsg(t('dashboard.cancelBookingSuccess'));
                                        }
                                      }}
                                      className="p-2 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-white/40 transition animate-hover"
                                      title={t('dashboard.cancelBookingTooltip')}
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <FullMonthCalendar
                        bookings={bookings}
                        theme={theme}
                        user={user}
                        setUser={setUser}
                        setBookings={setBookings}
                        isGoogleCalendarConnected={isGoogleCalendarConnected}
                        syncedBookingIds={syncedBookingIds}
                        autoSyncToCalendar={autoSyncToCalendar}
                        isCalendarLoading={isCalendarLoading}
                        handleUnsyncBooking={handleUnsyncBooking}
                        triggerSyncBooking={triggerSyncBooking}
                        triggerUpcomingBookingAlert={triggerUpcomingBookingAlert}
                        trigger30MinBrowserNotification={trigger30MinBrowserNotification}
                        copiedBookingId={copiedBookingId}
                        handleShare={handleShare}
                        setBookingSuccessMsg={setBookingSuccessMsg}
                      />
                    )}
                  </div>

                </div>
              )}


              {/* B. TABLETOP MODULE (Interactive Dining Plan) */}
              {activeModule === 'tabletop' && !selectedRestaurant && (
                <div className="space-y-6" id="restaurants-selector">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="space-y-1">
                      <h3 className="font-display font-black text-2xl text-white tracking-tight">
                        {t('tabletop.selectGastronomicTitle')}
                      </h3>
                      <p className="text-xs text-white/60">
                        {t('tabletop.selectGastronomicDesc')}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowRegisterRestaurantModal(true)}
                      className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-teal-500/10 flex items-center justify-center gap-1.5 self-start md:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      👔 {t('tabletop.registerBusiness')}
                    </button>
                  </div>

                  {/* Weather Forecast Widget */}
                  <WeatherWidget 
                    currentWeatherId={currentWeatherId} 
                    onWeatherChange={setCurrentWeatherId} 
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    {restaurants.map((restaurant) => (
                      <motion.div
                        key={restaurant.id}
                        whileHover={{ y: -8, scale: 1.01 }}
                        className="bg-[#16191F] rounded-3xl border border-white/5 overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300"
                      >
                        <div>
                          <div className="relative h-48 overflow-hidden group">
                            <img
                              src={restaurant.image}
                              alt={restaurant.name}
                              className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#16191F] via-transparent to-transparent" />
                            <div className="absolute top-4 left-4 bg-teal-500/90 text-black px-3 py-1 rounded-xl text-xs font-black tracking-wide uppercase flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-black" />
                              {restaurant.rating}
                            </div>
                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white/90 px-3 py-1 rounded-xl text-xs font-bold">
                              {restaurant.cuisine}
                            </div>
                          </div>

                          <div className="p-6 space-y-3">
                            <h4 className="font-display font-bold text-xl text-white tracking-tight">
                              {restaurant.name}
                            </h4>
                            <p className="text-xs text-white/60 leading-relaxed min-h-[60px]">
                              {restaurant.description}
                            </p>

                            <div className="pt-2 flex flex-col gap-1.5 text-[11px] text-white/50 border-t border-white/5">
                              <div className="flex items-center justify-between">
                                <span>{t('tabletop.roomMain')}:</span>
                                <span className="font-semibold text-white/70">{restaurant.rooms.main}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>{t('tabletop.roomVip')}:</span>
                                <span className="font-semibold text-teal-400">{restaurant.rooms.vip}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>{t('tabletop.roomTerrace')}:</span>
                                <span className="font-semibold text-white/70">{restaurant.rooms.terrace}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 pt-0">
                          <button
                            onClick={() => {
                              setSelectedRestaurant(restaurant);
                              setSelectedTable(null);
                            }}
                            className="w-full py-3 bg-white/5 hover:bg-teal-500 text-white hover:text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition duration-300 flex items-center justify-center gap-2"
                          >
                            <Utensils className="w-4 h-4" />
                            {t('tabletop.selectTableBtn')}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeModule === 'tabletop' && selectedRestaurant && (
                <div className="space-y-6" id="tabletop-module">
                  
                  {/* Header with back button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#16191F] border border-white/5 rounded-3xl">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setSelectedRestaurant(null);
                          setSelectedTable(null);
                        }}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition duration-300 flex items-center gap-2 text-xs font-bold border border-white/5"
                      >
                        <ArrowLeft className="w-4 h-4 text-teal-400" />
                        <span>{t('tabletop.backToRestaurants')}</span>
                      </button>
                      <div className="h-6 w-px bg-white/10 hidden sm:block" />
                      <div>
                        <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">{t('tabletop.restaurantLabel')}</span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-black text-lg text-white leading-none">
                            {selectedRestaurant.name}
                          </h3>
                          {selectedTables.length > 1 && (
                            <span className="px-2 py-0.5 bg-orange-500 text-black font-extrabold text-[10px] uppercase font-mono rounded-full animate-pulse tracking-wide whitespace-nowrap">
                              {i18n.language === 'ru' ? `${selectedTables.length} столов выбрано` : i18n.language === 'ar' ? `تم اختيار ${selectedTables.length} طاولات` : i18n.language === 'hy' ? `${selectedTables.length} սեղան ընտրված է` : `${selectedTables.length} Tables Selected`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span className="px-2.5 py-1 bg-white/5 rounded-lg border border-white/5">{selectedRestaurant.cuisine}</span>
                      <span className="px-2.5 py-1 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/10 font-bold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-teal-400" />
                        {selectedRestaurant.rating}
                      </span>
                    </div>
                  </div>

                  {/* Grid layout containing the control panel and SVG seat plan map */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Visual Interactive Map Left Columns */}
                    <div className="lg:col-span-2 bg-[#16191F] rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
                      <div>
                        
                        {/* Map controllers */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          <div>
                            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                              <Map className="w-5 h-5 text-teal-400" />
                              {i18n.language === 'ru' ? 'Интерактивная 2D/3D схема столов' : i18n.language === 'ar' ? 'مخطط الطاولات التفاعلي ثنائي/ثلاثي الأبعاد' : i18n.language === 'hy' ? 'Սեղանների ինտերակտիվ 2D/3D սխեմա' : 'Interactive 2D/3D Table Map'}
                            </h3>
                            <p className="text-xs text-white/60">
                              {i18n.language === 'ru' ? 'Выберите нужную зону, рассмотрите расположение столов и кликните на свободный, чтобы забронировать его.' : i18n.language === 'ar' ? 'اختر المنطقة المطلوبة، واعرض موقع الطاولات وانقر على الطاولة الشاغرة لحجزها.' : i18n.language === 'hy' ? 'Ընտրեք ցանկալի գոտին, դիտեք սեղանների դասավորությունը և սեղմեք ազատ սեղանին՝ այն ամրագրելու համար:' : 'Choose the desired area, view the table layout, and click on an available table to book it.'}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Search Input Field */}
                            <div className="relative">
                              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder={i18n.language === 'ru' ? 'Поиск стола по №...' : i18n.language === 'ar' ? 'البحث عن طاولة برقم...' : i18n.language === 'hy' ? 'Սեղանի որոնում ըստ №-ի...' : 'Search table by #...'}
                                value={tableSearchQuery}
                                onChange={(e) => setTableSearchQuery(e.target.value)}
                                className="pl-9 pr-8 py-2 w-full sm:w-40 md:w-44 bg-[#0F1115] border border-white/10 hover:border-white/20 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 text-xs text-white rounded-xl focus:outline-none font-semibold transition placeholder:text-white/30"
                              />
                              {tableSearchQuery && (
                                <button
                                  type="button"
                                  onClick={() => setTableSearchQuery("")}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            {/* Room choice filters */}
                            <div className="flex rounded-xl bg-white/5 p-1 border border-white/5">
                              <button 
                                type="button"
                                onClick={() => { setSelectedRoom('main'); setSelectedTable(null); setHoveredSvgTable(null); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedRoom === 'main' ? 'bg-white/10 text-white shadow-xs' : 'text-white/40 hover:text-white'}`}
                              >
                                {selectedRestaurant.rooms.main}
                              </button>
                              <button 
                                type="button"
                                onClick={() => { setSelectedRoom('vip'); setSelectedTable(null); setHoveredSvgTable(null); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedRoom === 'vip' ? 'bg-white/10 text-white shadow-xs' : 'text-white/40 hover:text-white'}`}
                              >
                                {selectedRestaurant.rooms.vip}
                              </button>
                              <button 
                                type="button"
                                onClick={() => { setSelectedRoom('terrace'); setSelectedTable(null); setHoveredSvgTable(null); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedRoom === 'terrace' ? 'bg-white/10 text-white shadow-xs' : 'text-white/40 hover:text-white'}`}
                              >
                                {selectedRestaurant.rooms.terrace}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Filters & View switcher bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-4 mb-6 p-3 bg-[#0F1115]/50 border border-white/5 rounded-2xl text-xs">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-white/40 font-semibold flex items-center gap-1">
                              <Sliders className="w-3.5 h-3.5 text-teal-400" /> {i18n.language === 'ru' ? 'Фильтры:' : i18n.language === 'ar' ? 'الفلاتر:' : i18n.language === 'hy' ? 'Ֆիլտրեր:' : 'Filters:'}
                            </span>
                            
                            {/* Party Size Filter */}
                            <select
                              value={partySizeFilter}
                              onChange={(e) => setPartySizeFilter(Number(e.target.value))}
                              className="bg-[#16191F] border border-white/10 text-white/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-500 transition cursor-pointer"
                            >
                              <option value="0">{i18n.language === 'ru' ? 'Любая вместимость' : i18n.language === 'ar' ? 'أي سعة' : i18n.language === 'hy' ? 'Ցանկացած տարողություն' : 'Any capacity'}</option>
                              <option value="2">{i18n.language === 'ru' ? 'От 2 человек' : i18n.language === 'ar' ? 'من شخصين' : i18n.language === 'hy' ? 'Սկսած 2 հոգուց' : 'From 2 people'}</option>
                              <option value="4">{i18n.language === 'ru' ? 'От 4 человек' : i18n.language === 'ar' ? 'من 4 أشخاص' : i18n.language === 'hy' ? 'Սկսած 4 հոգուց' : 'From 4 people'}</option>
                              <option value="6">{i18n.language === 'ru' ? 'От 6 человек' : i18n.language === 'ar' ? 'من 6 أشخاص' : i18n.language === 'hy' ? 'Սկսած 6 հոգուց' : 'From 6 people'}</option>
                              <option value="8">{i18n.language === 'ru' ? 'От 8 человек' : i18n.language === 'ar' ? 'من 8 أشخاص' : i18n.language === 'hy' ? 'Սկսած 8 հոգուց' : 'From 8 people'}</option>
                            </select>

                            {/* Table Type Filter */}
                            <select
                              value={tableTypeFilter}
                              onChange={(e) => setTableTypeFilter(e.target.value)}
                              className="bg-[#16191F] border border-white/10 text-white/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-500 transition cursor-pointer"
                            >
                              <option value="all">{i18n.language === 'ru' ? 'Все типы столов' : i18n.language === 'ar' ? 'جميع أنواع الطاولات' : i18n.language === 'hy' ? 'Սեղանների բոլոր տեսակները' : 'All table types'}</option>
                              <option value="standard">{t('tabletop.type.standard')}</option>
                              <option value="window">{t('tabletop.type.window')}</option>
                              <option value="vip">{t('tabletop.type.vip')}</option>
                              <option value="terrace">{t('tabletop.type.terrace')}</option>
                            </select>
                          </div>

                          {/* 2D / 3D Toggle */}
                          <div className="flex rounded-xl bg-white/5 p-1 border border-white/5 shadow-inner">
                            <button
                              type="button"
                              onClick={() => setViewMode('2d')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                viewMode === '2d'
                                  ? "bg-white/10 text-white shadow"
                                  : "text-white/40 hover:text-white"
                              }`}
                            >
                              <Map className="w-3.5 h-3.5" />
                              {i18n.language === 'ru' ? '2D Схема' : i18n.language === 'ar' ? 'مخطط ثنائي الأبعاد' : i18n.language === 'hy' ? '2D Սխեմա' : '2D Layout'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setViewMode('3d')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                                viewMode === '3d'
                                  ? "bg-teal-500 text-black shadow-md shadow-teal-500/10 font-black"
                                  : "text-white/40 hover:text-white"
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 text-current animate-pulse" />
                              {i18n.language === 'ru' ? '3D Зал' : i18n.language === 'ar' ? 'صالة ثلاثية الأبعاد' : i18n.language === 'hy' ? '3D Սրահ' : '3D Hall'}
                            </button>
                          </div>
                        </div>

                        {/* Weather advice for Summer Terrace */}
                        {selectedRoom === 'terrace' && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`mb-4 p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-300 ${
                              currentWeatherId === 'sunny' 
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" 
                                : currentWeatherId === 'cloudy'
                                  ? "bg-teal-500/10 border-teal-500/20 text-teal-300"
                                  : currentWeatherId === 'rainy'
                                    ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="p-2 bg-white/5 rounded-xl shrink-0 text-base leading-none">
                                {currentWeatherId === 'sunny' && "☀️"}
                                {currentWeatherId === 'cloudy' && "☁️"}
                                {currentWeatherId === 'rainy' && "🌧️"}
                                {currentWeatherId === 'stormy' && "⛈️"}
                              </span>
                              <div>
                                <span className="font-extrabold uppercase tracking-wider text-[9px] block mb-0.5">
                                  {i18n.language === 'ru' ? `Влияние погоды на террасу (${weatherPresets[currentWeatherId].temp}°C)` : i18n.language === 'ar' ? `تأثير الطقس على التراس (${weatherPresets[currentWeatherId].temp}°م)` : i18n.language === 'hy' ? `Եղանակի ազդեցությունը տեռասի վրա (${weatherPresets[currentWeatherId].temp}°C)` : `Weather impact on terrace (${weatherPresets[currentWeatherId].temp}°C)`}
                                </span>
                                <p className="font-medium text-white/90">
                                  {t('weather.recommendation.' + currentWeatherId)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Weather condition switcher inside restaurant view for easier accessibility! */}
                            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-black/40 p-1 rounded-xl border border-white/5 shrink-0">
                              <span className="text-[9px] text-white/40 uppercase font-bold tracking-wide px-2 font-mono">
                                {i18n.language === 'ru' ? 'симулятор:' : i18n.language === 'ar' ? 'المحاكي:' : i18n.language === 'hy' ? 'սիմուլյատոր:' : 'simulator:'}
                              </span>
                              {(Object.keys(weatherPresets) as WeatherId[]).map((wId) => (
                                <button
                                  key={wId}
                                  type="button"
                                  onClick={() => setCurrentWeatherId(wId)}
                                  className={`px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition ${
                                    currentWeatherId === wId 
                                      ? "bg-teal-500 text-black" 
                                      : "text-white/40 hover:text-white"
                                  }`}
                                >
                                  {t('weather.shortName.' + wId)}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}

                        {/* Search matches bar */}
                        {isTableSearchActive && (
                          <div className="mb-6 p-3 bg-[#0F1115] border border-white/5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 text-white/70">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              <span>
                                {i18n.language === 'ru' ? 'Поиск' : i18n.language === 'ar' ? 'بحث' : i18n.language === 'hy' ? 'Որոնում' : 'Search'} <strong className="text-amber-400">"{tableSearchQuery}"</strong>:
                                {matchedTables.length > 0 ? (
                                  <> {i18n.language === 'ru' ? 'найдено' : i18n.language === 'ar' ? 'تم العثور على' : i18n.language === 'hy' ? 'գտնվել է' : 'found'} <strong className="text-white">{matchedTables.length}</strong> {i18n.language === 'ru' ? (matchedTables.length === 1 ? "столик" : "столика(ов)") : i18n.language === 'ar' ? "طاولة" : "table(s)"}</>
                                ) : (
                                  <> {i18n.language === 'ru' ? 'совпадений в этом зале нет' : i18n.language === 'ar' ? 'لا يوجد تطابق في هذه القاعة' : i18n.language === 'hy' ? 'այս սրահում համընկնումներ չկան' : 'no matches in this hall'}</>
                                )}
                              </span>
                            </div>
                            {matchedTables.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">
                                  {i18n.language === 'ru' ? 'Быстрый выбор:' : i18n.language === 'ar' ? 'اختيار سريع:' : i18n.language === 'hy' ? 'Արագ ընտրություն:' : 'Quick Select:'}
                                </span>
                                {matchedTables.map(t => {
                                  const isSelected = selectedTables.some(item => item.id === t.id) || selectedTable?.id === t.id;
                                  const isBooked = t.status === 'booked' || bookings.some(b => b.type === 'table' && b.tableId === t.id && b.date === tabletopDate && b.time === tabletopTime);
                                  return (
                                    <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => {
                                        if (!isBooked) {
                                          handleTableSelectToggle(t);
                                        }
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition flex items-center gap-1 ${
                                        isSelected
                                          ? "bg-teal-500 text-black border-teal-400 shadow-md shadow-teal-500/10"
                                          : isBooked
                                            ? "bg-red-500/10 text-red-400 border-red-500/20 cursor-not-allowed opacity-50"
                                            : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white"
                                      }`}
                                    >
                                      #{t.number} {isBooked ? '🔒' : `(${t.capacity}м)`}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Visual SVG or 3D Map stage */}
                        <div className="relative bg-black/40 rounded-2xl border border-white/5 overflow-hidden min-h-[450px]">
                          {loadingTables ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-2 bg-[#0F1115]/80 z-20">
                              <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                              <p className="text-xs text-stone-400">
                                {i18n.language === 'ru' ? 'Получаем статус столов...' : i18n.language === 'ar' ? 'جاري جلب حالة الطاولات...' : i18n.language === 'hy' ? 'Ստացվում է սեղանների կարգավիճակը...' : 'Fetching tables status...'}
                              </p>
                            </div>
                          ) : null}

                          {viewMode === "3d" ? (
                            <div className="w-full h-[500px] relative">
                              <Tabletop3DViewer
                                tables={availableTables}
                                selectedRoom={selectedRoom}
                                selectedTable={selectedTable}
                                selectedTables={selectedTables}
                                onSelectTable={handleTableSelectToggle}
                                bookedTableIds={bookings
                                  .filter(b => b.type === 'table' && b.date === tabletopDate && b.time === tabletopTime)
                                  .map(b => (b as TableBooking).tableId)}
                                partySizeFilter={partySizeFilter}
                                tableTypeFilter={tableTypeFilter}
                                tableSearchQuery={tableSearchQuery}
                              />
                            </div>
                          ) : (
                            <div className={`relative bg-[#0F1115] p-4 overflow-hidden min-h-[400px] flex items-center justify-center ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}>
                              {/* Compass indicator/decor */}
                              <div className="absolute top-4 left-4 bg-white/5 border border-white/5 rounded-xl p-2 flex items-center gap-1.5 text-[10px] text-white/40 font-mono z-10">
                                <Compass className="w-3.5 h-3.5 text-teal-400 animate-spin" style={{ animationDuration: '20s' }} />
                                <span>ORIENT: NORTH</span>
                              </div>

                              {/* Decorative restaurant elements representing space layout */}
                              {selectedRoom === 'main' && (
                                <>
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white/5 text-white/50 text-[10px] font-mono py-1 px-4 rounded-b-lg border-b border-x border-white/5 uppercase tracking-widest font-bold">
                                    {i18n.language === 'ru' ? 'ВХОД / РЕСЕПШН' : i18n.language === 'ar' ? 'المدخل / الاستقبال' : i18n.language === 'hy' ? 'ՄՈՒՏՔ / ԸՆԴՈՒՆԱՐԱՆ' : 'ENTRANCE / RECEPTION'}
                                  </div>
                                  <div className="absolute bottom-4 left-4 bg-white/5 text-white/50 text-[10px] font-mono py-2 px-3 rounded-xl border border-white/5 uppercase tracking-widest font-bold">
                                    {i18n.language === 'ru' ? 'БАРНАЯ ЗОНА' : i18n.language === 'ar' ? 'منطقة البار' : i18n.language === 'hy' ? 'ԲԱՐԻ ԳՈՏԻ' : 'BAR ZONE'}
                                  </div>
                                  <div className="absolute top-1/3 right-0 -translate-y-1/2 w-4 bg-white/5 h-24 rounded-l-md border-y border-l border-white/5 flex items-center justify-center">
                                    <span className="text-[9px] text-white/40 font-mono tracking-widest uppercase rotate-90 origin-center whitespace-nowrap block">
                                      {i18n.language === 'ru' ? 'ПАНОРАМНЫЕ ОКНА' : i18n.language === 'ar' ? 'نوافذ بانورامية' : i18n.language === 'hy' ? 'ՊԱՆՈՐԱՄԱՅԻՆ ՊԱՏՈՒՀԱՆՆԵՐ' : 'PANORAMIC WINDOWS'}
                                    </span>
                                  </div>
                                </>
                              )}
                              {selectedRoom === 'vip' && (
                                <>
                                  <div className="absolute top-0 left-4 bg-white/5 text-white/50 text-[10px] font-mono py-1 px-4 rounded-b-lg border-b border-x border-white/5 uppercase tracking-widest font-bold">
                                    {i18n.language === 'ru' ? 'КАМИННАЯ ЗОНА' : i18n.language === 'ar' ? 'منطقة المدفأة' : i18n.language === 'hy' ? 'ԲՈՒԽԱՐՈՒ ԳՈՏԻ' : 'FIREPLACE ZONE'}
                                  </div>
                                  <div className="absolute inset-0 border-4 border-white/5 rounded-2xl pointer-events-none" />
                                </>
                              )}
                              {selectedRoom === 'terrace' && (
                                <>
                                  <div className="absolute inset-x-0 bottom-0 bg-teal-500/5 text-teal-400/80 text-[10px] font-mono py-1 text-center border-t border-teal-500/10 uppercase tracking-widest font-bold">
                                    {i18n.language === 'ru' ? 'ЖИВОПИСНАЯ РЕКА & НАБЕРЕЖНАЯ' : i18n.language === 'ar' ? 'نهر خلاب وكورنيش' : i18n.language === 'hy' ? 'ԳԵՂԱՏԵՍԻԼ ԳԵՏ ԵՎ ԱՓԱՄԵՐՁ ԳՈՏԻ' : 'PICTURESQUE RIVER & WATERFRONT'}
                                  </div>
                                  <div className="absolute top-4 right-4 bg-teal-500/10 text-teal-400 text-[9px] font-mono py-1 px-2.5 rounded-full border border-teal-500/10 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                                    {i18n.language === 'ru' ? 'ОТКРЫТЫЙ ВОЗДУХ' : i18n.language === 'ar' ? 'في الهواء الطلق' : i18n.language === 'hy' ? 'ԲԱՑՕԹՅԱ' : 'OPEN AIR'}
                                  </div>
                                </>
                              )}

                              <svg 
                                ref={svgRef}
                                viewBox="0 0 700 400" 
                                className="w-full h-auto max-w-2xl overflow-visible filter drop-shadow-md select-none touch-none"
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                              >
                                {/* Draw tables for selected room inside transformed group */}
                                <g transform={`translate(${pan.x}, ${pan.y}) translate(350, 200) scale(${zoom}) translate(-350, -200)`}>
                                  {availableTables
                                    .filter(t => t.room === selectedRoom)
                                    .map((t) => {
                                      const isSelected = selectedTables.some(item => item.id === t.id) || selectedTable?.id === t.id;
                                      const isBooked = bookings.some(b => b.type === 'table' && b.tableId === t.id && b.date === tabletopDate && b.time === tabletopTime);
                                      const isMatch = isTableSearchActive && cleanTableSearchQuery && t.number.toString().includes(cleanTableSearchQuery);
                                      const isVisible = (partySizeFilter === 0 || t.capacity >= partySizeFilter) && (tableTypeFilter === "all" || t.type === tableTypeFilter);
                                      
                                      if (!isVisible) return null;

                                      // Determine color highlights based on status
                                      let fillColor = "url(#metal-gradient-available)";
                                      let strokeColor = "rgba(255, 255, 255, 0.15)";
                                      let chairColor = "rgba(255, 255, 255, 0.2)";
                                      
                                      if (isBooked) {
                                        fillColor = "url(#metal-gradient-booked)";
                                        strokeColor = "rgba(239, 68, 68, 0.2)";
                                        chairColor = "rgba(239, 68, 68, 0.15)";
                                      } else if (isSelected) {
                                        fillColor = "url(#metal-gradient-selected)";
                                        strokeColor = "#2DD4BF";
                                        chairColor = "#2DD4BF";
                                      }

                                      // Highlight match state with distinct amber color
                                      if (isMatch) {
                                        strokeColor = "#F59E0B";
                                        chairColor = "#F59E0B";
                                      }

                                      // Chairs coordinate offsets based on table shape & capacity
                                      const chairs: {cx: number, cy: number}[] = [];
                                      const cx = t.x + t.width / 2;
                                      const cy = t.y + t.height / 2;
                                      const radius = Math.max(t.width, t.height) / 2 + 15;

                                      for (let i = 0; i < t.capacity; i++) {
                                        const angle = (i * 2 * Math.PI) / t.capacity;
                                        chairs.push({
                                          cx: cx + radius * Math.cos(angle),
                                          cy: cy + radius * Math.sin(angle)
                                        });
                                      }

                                      // Status label & ARIA label calculation for accessibility and screen readers
                                      let statusLabel = i18n.language === 'ru' ? 'Свободен' : i18n.language === 'ar' ? 'متاح' : i18n.language === 'hy' ? 'Ազատ է' : 'Available';
                                      if (isBooked) {
                                        statusLabel = i18n.language === 'ru' ? 'Забронирован' : i18n.language === 'ar' ? 'محجوز' : i18n.language === 'hy' ? 'Ամրագրված է' : 'Reserved';
                                      } else if (isSelected) {
                                        statusLabel = i18n.language === 'ru' ? 'Выбран' : i18n.language === 'ar' ? 'محدد' : i18n.language === 'hy' ? 'Ընտրված է' : 'Selected';
                                      }

                                      const tableAriaLabel = i18n.language === 'ru'
                                        ? `Столик номер ${t.number}, Вместимость ${t.capacity} человек, Статус: ${statusLabel}`
                                        : i18n.language === 'ar'
                                          ? `طاولة رقم ${t.number}، السعة ${t.capacity} أشخاص، الحالة: ${statusLabel}`
                                          : i18n.language === 'hy'
                                            ? `Սեղան համար ${t.number}, Տարողություն ${t.capacity} անձ, Կարգավիճակ՝ ${statusLabel}`
                                            : `Table number ${t.number}, Capacity ${t.capacity} guests, Status: ${statusLabel}`;

                                      return (
                                        <g 
                                          key={t.id} 
                                          role="button"
                                          tabIndex={0}
                                          aria-label={tableAriaLabel}
                                          aria-disabled={isBooked}
                                          aria-pressed={isSelected}
                                          className={`${isBooked ? 'cursor-not-allowed' : 'cursor-pointer'} transition group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400`}
                                          opacity={isTableSearchActive && cleanTableSearchQuery ? (isMatch ? 1 : 0.25) : 1}
                                          onMouseEnter={() => setHoveredSvgTable(t)}
                                          onMouseLeave={() => setHoveredSvgTable(null)}
                                          onFocus={() => setHoveredSvgTable(t)}
                                          onBlur={() => setHoveredSvgTable(null)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault();
                                              if (!isBooked) {
                                                handleTableSelectToggle(t);
                                              }
                                            }
                                          }}
                                          onClick={(e) => {
                                            if (hasMoved) {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              return;
                                            }
                                            if (!isBooked) {
                                              handleTableSelectToggle(t);
                                            }
                                          }}
                                        >
                                          {/* Seating chairs around table */}
                                          {chairs.map((chair, cIdx) => (
                                            <rect 
                                              key={cIdx}
                                              x={chair.cx - 8}
                                              y={chair.cy - 8}
                                              width="16"
                                              height="16"
                                              rx="4"
                                              fill={chairColor}
                                              className="transition-all duration-300"
                                              opacity={isBooked ? 0.4 : isSelected || isMatch ? 1 : 0.7}
                                            />
                                          ))}

                                          {/* Main Table shape with realistic visual style */}
                                          {t.shape === 'circle' ? (
                                            <motion.circle 
                                              cx={cx}
                                              cy={cy}
                                              r={t.width / 2}
                                              fill={fillColor}
                                              stroke={strokeColor}
                                              strokeWidth={isMatch ? "5" : isSelected ? "4" : "3"}
                                              className={`transition-all duration-300 filter ${isMatch ? 'animate-pulse' : ''}`}
                                              whileHover={{ 
                                                scale: 1.08, 
                                                filter: isBooked 
                                                  ? "brightness(1.15) drop-shadow(0 0 8px rgba(239, 68, 68, 0.5))" 
                                                  : isSelected 
                                                    ? "brightness(1.2) drop-shadow(0 0 10px rgba(45, 212, 191, 0.7))" 
                                                    : "brightness(1.25) drop-shadow(0 0 8px rgba(255, 255, 255, 0.4))" 
                                              }}
                                              whileTap={isBooked ? {} : { scale: 0.94 }}
                                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                              style={{ 
                                                transformOrigin: "center", 
                                                transformBox: "fill-box",
                                                transition: "fill 0.5s ease-in-out, stroke 0.5s ease-in-out, stroke-width 0.5s ease-in-out"
                                              }}
                                            />
                                          ) : (
                                            <motion.rect 
                                              x={t.x}
                                              y={t.y}
                                              width={t.width}
                                              height={t.height}
                                              rx="12"
                                              fill={fillColor}
                                              stroke={strokeColor}
                                              strokeWidth={isMatch ? "5" : isSelected ? "4" : "3"}
                                              className={`transition-all duration-300 filter ${isMatch ? 'animate-pulse' : ''}`}
                                              whileHover={isBooked ? {} : { scale: 1.06, filter: "brightness(1.15)" }}
                                              whileTap={isBooked ? {} : { scale: 0.94 }}
                                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                              style={{ 
                                                transformOrigin: "center", 
                                                transformBox: "fill-box",
                                                transition: "fill 0.5s ease-in-out, stroke 0.5s ease-in-out, stroke-width 0.5s ease-in-out"
                                              }}
                                            />
                                          )}

                                          {/* Table details labels */}
                                          <text 
                                            x={cx}
                                            y={cy + 4}
                                            textAnchor="middle"
                                            className={`font-display text-xs font-bold pointer-events-none transition-all duration-500 ${isMatch ? "fill-amber-400 font-extrabold text-sm" : isBooked ? (theme === "light" ? "fill-red-800" : "fill-red-400") : isSelected ? "fill-black font-extrabold" : (theme === "light" ? "fill-gray-900" : "fill-white/90")}`}
                                            style={{ transition: "fill 0.5s ease-in-out" }}
                                          >
                                            #{t.number}
                                          </text>
                                          
                                          <text 
                                            x={cx}
                                            y={cy + 16}
                                            textAnchor="middle"
                                            className={`text-[9px] font-bold pointer-events-none font-mono transition-all duration-500 ${isSelected ? "fill-black/60" : (theme === "light" ? "fill-gray-500" : "fill-white/40")}`}
                                            style={{ transition: "fill 0.5s ease-in-out" }}
                                          >
                                            {t.capacity} {i18n.language === 'ru' ? "чел" : i18n.language === 'ar' ? "أشخاص" : i18n.language === 'hy' ? "անձ" : "pax"}
                                          </text>
                                        </g>
                                      );
                                    })}
                                </g>

                                   {/* Floating SVG Tooltip showing capacity & status on hover */}
                                   {hoveredSvgTable && (() => {
                                     const t = hoveredSvgTable;
                                     if (t.room !== selectedRoom) return null;

                                     const isBooked = bookings.some(b => b.type === 'table' && b.tableId === t.id && b.date === tabletopDate && b.time === tabletopTime);
                                     const isSelected = selectedTables.some(item => item.id === t.id) || selectedTable?.id === t.id;

                                     const cx = t.x + t.width / 2;
                                     const cy = t.y + t.height / 2;
                                     const tooltipWidth = 190;
                                     const tooltipHeight = 72;
                                     const tooltipX = cx - tooltipWidth / 2;
                                     const tooltipY = Math.max(5, cy - (t.height / 2) - tooltipHeight - 14);

                                     let statusText = i18n.language === 'ru' ? 'Свободен' : i18n.language === 'ar' ? 'متاح' : i18n.language === 'hy' ? 'Ազատ է' : 'Available';
                                     let statusBadgeBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                                     let statusDot = 'bg-emerald-400';

                                     if (isBooked) {
                                       statusText = i18n.language === 'ru' ? 'Забронирован' : i18n.language === 'ar' ? 'محجوز' : i18n.language === 'hy' ? 'Ամրագրված է' : 'Reserved';
                                       statusBadgeBg = 'bg-red-500/20 text-red-400 border-red-500/30';
                                       statusDot = 'bg-red-400';
                                     } else if (isSelected) {
                                       statusText = i18n.language === 'ru' ? 'Выбран' : i18n.language === 'ar' ? 'محدد' : i18n.language === 'hy' ? 'Ընտրված է' : 'Selected';
                                       statusBadgeBg = 'bg-teal-500/20 text-teal-300 border-teal-500/30';
                                       statusDot = 'bg-teal-400';
                                     }

                                     const capacityLabel = i18n.language === 'ru' 
                                       ? `Вместимость: ${t.capacity} чел.` 
                                       : i18n.language === 'ar' 
                                         ? `السعة: ${t.capacity} أشخاص` 
                                         : i18n.language === 'hy' 
                                           ? `Տարողություն՝ ${t.capacity} անձ` 
                                           : `Capacity: ${t.capacity} guests`;

                                     return (
                                       <g transform={`translate(${tooltipX}, ${tooltipY})`} className="pointer-events-none z-50">
                                         <foreignObject width={tooltipWidth} height={tooltipHeight + 15} className="overflow-visible">
                                           <div className="flex flex-col items-center">
                                             <div className="w-full bg-[#161920]/95 backdrop-blur-md border border-white/20 rounded-xl p-2.5 shadow-2xl text-left flex flex-col gap-1 text-white ring-1 ring-white/10">
                                               <div className="flex items-center justify-between border-b border-white/10 pb-1">
                                                 <span className="font-display font-black text-xs text-white">
                                                   {i18n.language === 'ru' ? `Столик #${t.number}` : i18n.language === 'ar' ? `طاولة #${t.number}` : i18n.language === 'hy' ? `Սեղան #${t.number}` : `Table #${t.number}`}
                                                 </span>
                                                 <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${statusBadgeBg}`}>
                                                   <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                                                   {statusText}
                                                 </span>
                                               </div>
                                               <div className="flex items-center justify-between text-[10px] text-white/80 font-mono pt-0.5">
                                                 <span>👥 {capacityLabel}</span>
                                                 <span className="capitalize text-teal-300 font-bold">{t.type}</span>
                                               </div>
                                             </div>
                                             {/* Tooltip pointer arrow */}
                                             <div className="w-2.5 h-2.5 bg-[#161920] border-r border-b border-white/20 rotate-45 -mt-1.5" />
                                           </div>
                                         </foreignObject>
                                       </g>
                                     );
                                   })()}

                                {/* SVG Gradient patterns definitions */}
                                <defs>
                                  <linearGradient id="metal-gradient-available" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={theme === "light" ? "#FFFFFF" : "#1E222B"} style={{ transition: "stop-color 0.5s ease-in-out" }} />
                                    <stop offset="100%" stopColor={theme === "light" ? "#E5E7EB" : "#161920"} style={{ transition: "stop-color 0.5s ease-in-out" }} />
                                  </linearGradient>
                                  <linearGradient id="metal-gradient-selected" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#2DD4BF" style={{ transition: "stop-color 0.5s ease-in-out" }} />
                                    <stop offset="100%" stopColor="#0D9488" style={{ transition: "stop-color 0.5s ease-in-out" }} />
                                  </linearGradient>
                                  <linearGradient id="metal-gradient-booked" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={theme === "light" ? "#FEE2E2" : "#2B161B"} style={{ transition: "stop-color 0.5s ease-in-out" }} />
                                    <stop offset="100%" stopColor={theme === "light" ? "#FCA5A5" : "#200F12"} style={{ transition: "stop-color 0.5s ease-in-out" }} />
                                  </linearGradient>
                                </defs>
                              </svg>

                              {/* Zoom / Pan Controls Overlay */}
                              {/* Zoom / Pan Controls Overlay */}
                              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                                <div className={`backdrop-blur-md rounded-xl p-1.5 flex flex-col gap-1.5 shadow-xl transition-all duration-500 border ${theme === "light" ? "bg-white/80 border-gray-200 text-gray-700" : "bg-black/75 border-white/10 text-white"}`}>
                                  <button
                                    onClick={() => setZoom(prev => Math.min(prev * 1.2, 4))}
                                    className={`p-2 rounded-lg transition cursor-pointer flex items-center justify-center ${theme === "light" ? "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-teal-600" : "bg-white/5 hover:bg-white/10 text-white hover:text-teal-400"}`}
                                    title={i18n.language === 'ru' ? "Приблизить" : i18n.language === 'ar' ? "تكبير" : i18n.language === 'hy' ? "Մեծացնել" : "Zoom In"}
                                  >
                                    <ZoomIn className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.8))}
                                    className={`p-2 rounded-lg transition cursor-pointer flex items-center justify-center ${theme === "light" ? "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-teal-600" : "bg-white/5 hover:bg-white/10 text-white hover:text-teal-400"}`}
                                    title={i18n.language === 'ru' ? "Отдалить" : i18n.language === 'ar' ? "تصغير" : i18n.language === 'hy' ? "Փոքրացնել" : "Zoom Out"}
                                  >
                                    <ZoomOut className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setZoom(1);
                                      setPan({ x: 0, y: 0 });
                                    }}
                                    className={`p-2 rounded-lg transition cursor-pointer flex items-center justify-center ${theme === "light" ? "bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-teal-600" : "bg-white/5 hover:bg-white/10 text-white hover:text-teal-400"}`}
                                    title={i18n.language === 'ru' ? "Сбросить" : i18n.language === 'ar' ? "إعادة تعيين" : i18n.language === 'hy' ? "Վերակայել" : "Reset View"}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Navigation instructions / indicator */}
                              <div className={`absolute bottom-4 left-4 pointer-events-none backdrop-blur-sm text-[9px] font-mono py-1 px-2.5 rounded-full z-10 flex items-center gap-1.5 transition-all duration-500 border ${theme === "light" ? "bg-white/80 border-gray-200 text-gray-500" : "bg-black/60 border-white/5 text-white/50"}`}>
                                <span>
                                  {i18n.language === 'ru' ? "Перетаскивайте для перемещения • Колёсико для масштаба" : i18n.language === 'ar' ? "اسحب للتحريك • عجلة الماوس للتكبير" : i18n.language === 'hy' ? "Քաշեք տեղաշարժելու համար • Պտտեք անիվը մասշտաբի համար" : "Drag to pan • Scroll to zoom"}
                                </span>
                                {zoom !== 1 || pan.x !== 0 || pan.y !== 0 ? (
                                  <span className="text-teal-400 font-bold">
                                    ({Math.round(zoom * 100)}%)
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Map legend */}
                      <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between text-xs text-white/60">
                        <div className="flex gap-4 items-center flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-md bg-[#1E222B] border border-white/10 inline-block"></span>
                            <span>{t('tabletop.free')}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-md bg-teal-500 border border-teal-300 inline-block"></span>
                            <span>{t('tabletop.yourChoice')}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-3.5 h-3.5 rounded-md bg-[#2B161B] border border-red-500/30 inline-block"></span>
                            <span>{t('tabletop.booked')}</span>
                          </div>
                        </div>
                        <span className="font-mono text-[10px] uppercase text-white/40">
                          {i18n.language === 'ru' ? 'Кликните на стол для выбора' : i18n.language === 'ar' ? 'انقر على طاولة للاختيار' : i18n.language === 'hy' ? 'Սեղմեք սեղանին՝ այն ընտրելու համար' : 'Click on table to select'}
                        </span>
                      </div>

                    </div>

                    {/* Booking parameters panel Right Columns */}
                    <div className="bg-[#16191F] rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
                      <div className="space-y-6">
                        
                        <div>
                          <h3 className="font-display font-bold text-base text-white mb-1">
                            {i18n.language === 'ru' ? 'Параметры визита' : i18n.language === 'ar' ? 'معايير الزيارة' : i18n.language === 'hy' ? 'Այցելության պարամետրեր' : 'Visit parameters'}
                          </h3>
                          <p className="text-xs text-white/40">
                            {i18n.language === 'ru' ? 'Установите дату и время посещения для обновления доступности.' : i18n.language === 'ar' ? 'حدد التاريخ ووقت الزيارة لتحديث التوفر.' : i18n.language === 'hy' ? 'Սահմանեք այցելության ամսաթիվն ու ժամը՝ հասանելիությունը թարմացնելու համար:' : 'Set the date and time of the visit to update availability.'}
                          </p>
                        </div>

                        {/* Date and Time inputs */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-white/60 mb-1.5">{t('auth.visitDateLabel')}</label>
                            <div className="relative">
                              <Calendar className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input 
                                type="date" 
                                value={tabletopDate} 
                                onChange={e => { setTabletopDate(e.target.value); setSelectedTable(null); }}
                                className="w-full pl-10 pr-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-teal-500 font-semibold"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-white/60 mb-1.5">
                              {i18n.language === 'ru' ? 'Время прибытия' : i18n.language === 'ar' ? 'وقت الوصول' : i18n.language === 'hy' ? 'Ժամանման ժամը' : 'Arrival time'}
                            </label>
                            <div className="relative">
                              <Clock className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                              <select 
                                value={tabletopTime} 
                                onChange={e => { setTabletopTime(e.target.value); setSelectedTable(null); }}
                                className="w-full pl-10 pr-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-teal-500 font-semibold"
                              >
                                <option value="12:00">12:00 ({i18n.language === 'ru' ? 'Обед' : i18n.language === 'ar' ? 'الغداء' : i18n.language === 'hy' ? 'Ճաշ' : 'Lunch'})</option>
                                <option value="13:30">13:30 ({i18n.language === 'ru' ? 'Обед' : i18n.language === 'ar' ? 'الغداء' : i18n.language === 'hy' ? 'Ճաշ' : 'Lunch'})</option>
                                <option value="15:00">15:00 ({i18n.language === 'ru' ? 'День' : i18n.language === 'ar' ? 'بعد الظهر' : i18n.language === 'hy' ? 'Ցերեկ' : 'Afternoon'})</option>
                                <option value="17:00">17:00 ({i18n.language === 'ru' ? 'Ранний ужин' : i18n.language === 'ar' ? 'عشاء مبكر' : i18n.language === 'hy' ? 'Վաղ ընթրիք' : 'Early dinner'})</option>
                                <option value="18:30">18:30 ({i18n.language === 'ru' ? '🔥 Премиум / Высокий спрос' : i18n.language === 'ar' ? '🔥 مميز / طلب مرتفع' : i18n.language === 'hy' ? '🔥 Պրեմիում / Բարձր պահանջարկ' : '🔥 Premium / High Demand'})</option>
                                <option value="19:00">19:00 ({i18n.language === 'ru' ? '🔥 Премиум / Высокий спрос' : i18n.language === 'ar' ? '🔥 مميز / طلب مرتفع' : i18n.language === 'hy' ? '🔥 Պրեմիում / Բարձր պահանջարկ' : '🔥 Premium / High Demand'})</option>
                                <option value="20:30">20:30 ({i18n.language === 'ru' ? '🔥 Премиум / Высокий спрос' : i18n.language === 'ar' ? '🔥 مميز / طلب مرتفع' : i18n.language === 'hy' ? '🔥 Պրեմիում / Բարձր պահանջարկ' : '🔥 Premium / High Demand'})</option>
                                <option value="22:00">22:00 ({i18n.language === 'ru' ? 'Ночь' : i18n.language === 'ar' ? 'مساءً' : i18n.language === 'hy' ? 'Գիշեր' : 'Night'})</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Selected table summary and notes */}
                        {selectedTables.length > 0 ? (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-teal-500/5 rounded-2xl border border-teal-500/20 space-y-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] font-mono uppercase text-teal-400 font-bold tracking-wider block">
                                  {selectedTables.length === 1 
                                    ? (i18n.language === 'ru' ? 'ВЫБРАННЫЙ СТОЛИК' : i18n.language === 'ar' ? 'الطاولة المحددة' : i18n.language === 'hy' ? 'SELECTED TABLE' : 'SELECTED TABLE')
                                    : (i18n.language === 'ru' ? 'ВЫБРАННЫЙ ПАКЕТ СТОЛОВ' : i18n.language === 'ar' ? 'مجموعة الطاولات المحددة' : i18n.language === 'hy' ? 'SELECTED TABLES PACKAGE' : 'SELECTED TABLES PACKAGE')
                                  }
                                </span>
                                <span className="font-display font-bold text-lg text-white block">
                                  {selectedTables.length === 1 
                                    ? t('tabletop.tableNumber', { n: selectedTables[0].number })
                                    : `${i18n.language === 'ru' ? 'Столы:' : i18n.language === 'hy' ? 'Սեղաններ՝' : 'Tables:'} ${selectedTables.map(t => `#${t.number}`).join(', ')}`
                                  }
                                </span>
                                {holdTimer !== null && (
                                  <span className="inline-flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/15 border border-amber-500/20 px-2 py-0.5 rounded-lg animate-pulse">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    {i18n.language === 'ru' ? 'Удержание:' : i18n.language === 'ar' ? 'حجز مؤقت:' : i18n.language === 'hy' ? 'Hold:' : 'Hold:'} {holdTimer}s
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                <span className="text-xs px-2.5 py-1 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-lg font-bold font-mono whitespace-nowrap">
                                  {totalSelectedPrice} ₽ {i18n.language === 'ru' ? 'депо' : i18n.language === 'ar' ? 'تأمين' : i18n.language === 'hy' ? 'deposit' : 'deposit'}
                                </span>
                                <span className="text-xs px-2.5 py-1 bg-orange-500/10 text-orange-300 border border-orange-500/20 rounded-lg font-bold font-mono flex items-center gap-1.5 whitespace-nowrap">
                                  <Users className="w-3.5 h-3.5 text-orange-400" />
                                  <span>
                                    {totalSelectedCapacity} {i18n.language === 'ru' ? 'чел' : i18n.language === 'ar' ? 'أشخاص' : i18n.language === 'hy' ? 'guests' : 'guests'}
                                  </span>
                                </span>
                              </div>
                            </div>

                            {/* Mini chips to manage/view selected tables */}
                            {selectedTables.length > 1 && (
                              <div className="flex flex-wrap gap-1.5 p-2 bg-black/20 rounded-xl border border-white/5">
                                {selectedTables.map(t => (
                                  <div 
                                    key={t.id} 
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-500/10 text-teal-300 rounded-lg text-[10px] font-bold border border-teal-500/10"
                                  >
                                    <span>#{t.number} ({t.capacity}м)</span>
                                    <button 
                                      onClick={() => handleTableSelectToggle(t)}
                                      className="hover:text-red-400 transition ml-1 cursor-pointer"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                              <div>
                                <span className="text-white/40 block text-[10px] uppercase">
                                  {i18n.language === 'ru' ? 'ОБЩАЯ ВМЕСТИМОСТЬ' : i18n.language === 'ar' ? 'إجمالي السعة' : i18n.language === 'hy' ? 'TOTAL CAPACITY' : 'TOTAL CAPACITY'}
                                </span>
                                <span className="font-semibold text-white/80">
                                  {i18n.language === 'ru' ? `до ${totalSelectedCapacity} человек` : i18n.language === 'ar' ? `حتى ${totalSelectedCapacity} أشخاص` : i18n.language === 'hy' ? `up to ${totalSelectedCapacity} people` : `up to ${totalSelectedCapacity} people`}
                                </span>
                              </div>
                              <div>
                                <span className="text-white/40 block text-[10px] uppercase">
                                  {i18n.language === 'ru' ? 'ЗОНА ЗАЛА' : i18n.language === 'ar' ? 'منطقة القاعة' : i18n.language === 'hy' ? 'HALL ZONE' : 'HALL ZONE'}
                                </span>
                                <span className="font-semibold text-white/80 uppercase">
                                  {selectedTables[0].room === 'main' 
                                    ? selectedRestaurant.rooms.main 
                                    : selectedTables[0].room === 'vip' 
                                      ? selectedRestaurant.rooms.vip 
                                      : selectedRestaurant.rooms.terrace}
                                </span>
                              </div>
                            </div>

                            {/* Guests input */}
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] font-semibold text-white/40">{t('auth.guestsCountLabel')}</label>
                                {guestsCount > totalSelectedCapacity && (
                                  <span className="text-[9px] font-bold text-red-400 animate-pulse">
                                    {i18n.language === 'ru' ? 'Недостаточно мест!' : i18n.language === 'hy' ? 'Տեղերը բավարար չեն:' : 'Over capacity!'}
                                  </span>
                                )}
                              </div>
                              
                              {totalSelectedCapacity <= 10 ? (
                                <div className="flex flex-wrap items-center gap-2">
                                  {[...Array(totalSelectedCapacity)].map((_, idx) => {
                                    const count = idx + 1;
                                    return (
                                      <button
                                        key={count}
                                        onClick={() => setGuestsCount(count)}
                                        className={`w-8 h-8 rounded-lg border font-mono text-xs transition ${guestsCount === count ? 'bg-teal-500 border-teal-500 text-black font-extrabold' : 'bg-[#0F1115] border-white/10 text-white/80 hover:bg-white/5'}`}
                                      >
                                        {count}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 bg-[#0F1115] p-2 rounded-xl border border-white/10">
                                  <button 
                                    onClick={() => setGuestsCount(prev => Math.max(1, prev - 1))}
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-bold flex items-center justify-center transition"
                                  >
                                    -
                                  </button>
                                  <span className="font-mono text-sm font-bold text-white flex-1 text-center">
                                    {guestsCount} {i18n.language === 'ru' ? 'чел.' : i18n.language === 'hy' ? 'հոգի' : 'guests'}
                                  </span>
                                  <button 
                                    onClick={() => setGuestsCount(prev => Math.min(totalSelectedCapacity, prev + 1))}
                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-bold flex items-center justify-center transition"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Booking comment notes */}
                            <div>
                              <label className="block text-[10px] font-semibold text-white/40 mb-1 uppercase">{t('auth.notesLabel')}</label>
                              <textarea 
                                value={tableNotes}
                                onChange={e => setTableNotes(e.target.value)}
                                placeholder={i18n.language === 'ru' ? 'Например: день рождения жены, нужен детский стул, тихая зона...' : i18n.language === 'ar' ? 'مثال: عيد ميلاد زوجتي، بحاجة لكرسي أطفال، منطقة هادئة...' : i18n.language === 'hy' ? 'Օրինակ՝ կնոջս ծննդյան օրն է, անհրաժեշտ է մանկական աթոռ, խաղաղ տարածք...' : 'For example: wife\'s birthday, need high chair, quiet area...'}
                                className="w-full p-2.5 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                                rows={2}
                              />
                            </div>

                            {/* Premium slot highlight banner */}
                            {["18:30", "19:00", "20:30"].includes(tabletopTime) && (
                              <div className="p-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[11px] text-amber-300 flex items-start gap-2">
                                <span className="text-base select-none leading-none">🔥</span>
                                <div className="space-y-0.5 text-left">
                                  <div className="font-bold">
                                    {i18n.language === 'ru' ? 'Высокий спрос (Премиум-слот)' : i18n.language === 'ar' ? 'طلب مرتفع (فترة مميزة)' : i18n.language === 'hy' ? 'High Demand (Premium slot)' : 'High Demand (Premium slot)'}
                                  </div>
                                  <div className="text-amber-300/80 leading-normal">
                                    {i18n.language === 'ru' ? 'В это время наблюдается максимальная нагрузка. К стандартному тарифу стола добавлена наценка +25%.' : i18n.language === 'ar' ? 'يوجد حد أقصى للطلب في هذا الوقت. تمت إضافة رسوم إضافية بنسبة +25% على السعر القياسي للطاولة.' : i18n.language === 'hy' ? 'Peak hours load. A +25% surcharge is added to the standard table rate.' : 'Peak hours load. A +25% surcharge is added to the standard table rate.'}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Price analysis and payment */}
                            <div className="pt-3 border-t border-teal-500/10 flex items-center justify-between text-xs">
                              <span className="text-white/40">{i18n.language === 'ru' ? 'Сумма депозита:' : i18n.language === 'ar' ? 'مبلغ التأمين:' : i18n.language === 'hy' ? 'Deposit amount:' : 'Deposit amount:'}</span>
                              <span className="font-bold text-white font-mono text-base">{totalSelectedPrice.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US')} ₽</span>
                            </div>

                            {user.balance < totalSelectedPrice ? (
                              <div className="p-2.5 bg-red-500/10 rounded-xl text-[11px] text-red-400 border border-red-500/20">
                                {i18n.language === 'ru' ? 'Недостаточно средств на балансе. Пожалуйста, пополните баланс в шапке профиля (+).' : i18n.language === 'ar' ? 'الرصيد غير كافٍ. يرجى إعادة شحن رصيدك من القائمة العلوية (+).' : i18n.language === 'hy' ? 'Insufficient balance. Please top up your balance from the header (+).' : 'Insufficient balance. Please top up your balance from the header (+).'}
                              </div>
                            ) : null}

                          </motion.div>
                        ) : (
                          <div className="p-8 bg-white/[0.01] rounded-2xl border border-dashed border-white/10 text-center text-xs text-white/40">
                            {i18n.language === 'ru' ? 'Выберите один или несколько свободных столиков на схеме слева, чтобы начать оформление заказа.' : i18n.language === 'ar' ? 'اختر أي طاولة شاغرة من المخطط على اليسار لبدء الحجز.' : i18n.language === 'hy' ? 'Select one or more available tables on the layout on the left to start booking.' : 'Select one or more available tables on the layout on the left to start booking.'}
                          </div>
                        )}

                      </div>

                      {/* Launch reservation button */}
                      <div className="pt-6 border-t border-white/5">
                        <button
                          onClick={handleBookTable}
                          disabled={selectedTables.length === 0 || user.balance < totalSelectedPrice || guestsCount > totalSelectedCapacity || tableActionLoading}
                          className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-teal-500/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {tableActionLoading 
                            ? (i18n.language === 'ru' ? 'Обработка...' : i18n.language === 'ar' ? 'جاري المعالجة...' : i18n.language === 'hy' ? 'Processing...' : 'Processing...') 
                            : (selectedTables.length > 1
                              ? (i18n.language === 'ru' ? `Забронировать пакет (${selectedTables.length} стола)` : i18n.language === 'hy' ? `Ամրագրել փաթեթը (${selectedTables.length} սեղան)` : `Book package (${selectedTables.length} tables)`)
                              : (i18n.language === 'ru' ? 'Забронировать этот столик' : i18n.language === 'ar' ? 'حجز هذه الطاولة' : i18n.language === 'hy' ? 'Book this table' : 'Book this table'))}
                        </button>
                      </div>

                    </div>

                  </div>

                  {/* Restaurant Info & Description Panel */}
                  <div className="bg-[#16191F] rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col md:flex-row gap-6 items-center">
                    <img 
                      src={selectedRestaurant.image} 
                      alt={selectedRestaurant.name}
                      className="w-full md:w-48 h-32 rounded-2xl object-cover border border-white/10"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-3 text-center md:text-left flex-1">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <h4 className="font-display font-black text-2xl text-white">
                          {i18n.language === 'ru' ? `О заведении ${selectedRestaurant.name}` : i18n.language === 'ar' ? `حول مطعم ${selectedRestaurant.name}` : i18n.language === 'hy' ? `About ${selectedRestaurant.name}` : `About ${selectedRestaurant.name}`}
                        </h4>
                        <span className="px-2.5 py-1 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/10 text-xs font-bold font-mono">
                          {selectedRestaurant.cuisine}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {selectedRestaurant.description}
                      </p>
                    </div>
                  </div>

                  {/* Reviews Component */}
                  <RestaurantReviews 
                    restaurant={selectedRestaurant} 
                    user={user}
                    onRatingUpdated={(newRating) => {
                      setSelectedRestaurant(prev => prev ? { ...prev, rating: newRating } : null);
                      setRestaurants(prev => prev.map(r => r.id === selectedRestaurant.id ? { ...r, rating: newRating } : r));
                    }}
                  />

                </div>
              )}


              {/* C. BOOKLY MODULE (Spa and Service Reservation) */}
              {activeModule === 'bookly' && (
                <div className="space-y-6" id="bookly-module">
                  
                  {!selectedSalon ? (
                    <div className="space-y-6" id="salons-selector">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-4">
                        <div className="space-y-1">
                          <h3 className="font-display font-black text-2xl text-white tracking-tight flex items-center gap-2">
                            <Compass className="w-5 h-5 text-teal-400 animate-spin" style={{ animationDuration: '40s' }} />
                            {i18n.language === 'ru' ? 'Выберите велнес-салон или бьюти-центр' : i18n.language === 'ar' ? 'اختر صالون عافية أو مركز تجميل' : i18n.language === 'hy' ? 'Select a wellness salon or beauty center' : 'Select a wellness salon or beauty center'}
                          </h3>
                          <p className="text-xs text-white/60">
                            {i18n.language === 'ru' ? 'Подарите себе минуты безупречного ухода. Выберите подходящее заведение или зарегистрируйте собственное!' : i18n.language === 'ar' ? 'امنح نفسك لحظات من العناية المثالية. اختر منشأة مناسبة أو سجل منشأتك الخاصة!' : i18n.language === 'hy' ? 'Treat yourself to moments of flawless care. Choose a suitable venue or register your own!' : 'Treat yourself to moments of flawless care. Choose a suitable venue or register your own!'}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowRegisterSalonModal(true)}
                          className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-teal-500/10 flex items-center justify-center gap-1.5 self-start md:self-auto"
                        >
                          <Plus className="w-4 h-4" />
                          {t('tabletop.registerBusiness')}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                        {salons.map((salon) => (
                          <motion.div
                            key={salon.id}
                            whileHover={{ y: -8, scale: 1.01 }}
                            className="bg-[#16191F] rounded-3xl border border-white/5 overflow-hidden flex flex-col justify-between shadow-xl transition-all duration-300"
                          >
                            <div>
                              <div className="relative h-48 overflow-hidden group">
                                <img
                                  src={salon.image}
                                  alt={salon.name}
                                  className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#16191F] via-transparent to-transparent" />
                                <div className="absolute top-4 left-4 bg-teal-500/90 text-black px-3 py-1 rounded-xl text-xs font-black tracking-wide uppercase flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 fill-black" />
                                  {salon.rating}
                                </div>
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white/90 px-3 py-1 rounded-xl text-xs font-bold">
                                  {salon.category}
                                </div>
                              </div>

                              <div className="p-6 space-y-3">
                                <h4 className="font-display font-bold text-xl text-white tracking-tight">
                                  {salon.name}
                                </h4>
                                <p className="text-xs text-white/60 leading-relaxed min-h-[60px]">
                                  {salon.description}
                                </p>
                                <div className="text-[11px] text-white/40 flex items-center gap-1">
                                  <span className="text-teal-400">📍</span> {salon.address}
                                </div>
                              </div>
                            </div>

                            <div className="p-6 pt-0">
                              <button
                                onClick={() => {
                                  setSelectedSalon(salon);
                                  setSelectedService(null);
                                  setSelectedStaff(null);
                                }}
                                className="w-full py-3 bg-white/5 hover:bg-teal-500 text-white hover:text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition duration-300 flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Compass className="w-4 h-4" />
                                {i18n.language === 'ru' ? 'Открыть услуги' : i18n.language === 'ar' ? 'عرض الخدمات' : i18n.language === 'hy' ? 'Open Services' : 'Open Services'}
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Service selector category tabs */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setSelectedSalon(null)}
                            className="p-2.5 bg-white/5 hover:bg-[#1E232E] text-white rounded-xl transition border border-white/10"
                            title={i18n.language === 'ru' ? 'Назад к списку салонов' : i18n.language === 'ar' ? 'العودة لقائمة الصالونات' : i18n.language === 'hy' ? 'Back to salon list' : 'Back to salon list'}
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <div>
                            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                              {selectedSalon.name}
                            </h3>
                            <p className="text-xs text-white/60">
                              {i18n.language === 'ru' ? 'Категория:' : i18n.language === 'ar' ? 'الفئة:' : i18n.language === 'hy' ? 'Category:' : 'Category:'} {selectedSalon.category} • {i18n.language === 'ru' ? 'Адрес:' : i18n.language === 'ar' ? 'العنوان:' : i18n.language === 'hy' ? 'Address:' : 'Address:'} {selectedSalon.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1.5 flex-wrap">
                          {(['all', 'Spa & Wellness', 'Fitness & Active', 'Beauty & Style'] as const).map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setSelectedCategory(cat)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${selectedCategory === cat ? 'bg-teal-500 border-teal-500 text-black shadow-md shadow-teal-500/10 font-bold' : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'}`}
                            >
                              {cat === 'all' ? (i18n.language === 'ru' ? 'Все категории' : i18n.language === 'ar' ? 'جميع الفئات' : i18n.language === 'hy' ? 'All categories' : 'All categories') : cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Main Grid layout with available services */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Services cards feed Left Column */}
                        <div className="lg:col-span-2 space-y-4 max-h-[600px] overflow-y-auto pr-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {services
                              .filter(s => s.salonId === selectedSalon.id && (selectedCategory === 'all' || s.category === selectedCategory))
                              .map((service) => {
                                const isSelected = selectedService?.id === service.id;
                                return (
                                  <div 
                                    key={service.id} 
                                    className={`rounded-2xl border transition overflow-hidden shadow-xl flex flex-col justify-between ${isSelected ? 'border-teal-500 bg-[#16191F] ring-2 ring-teal-500/20' : 'border-white/5 bg-[#16191F] hover:border-white/10'}`}
                                  >
                                    <div>
                                      <div className="relative h-40 bg-[#0F1115] overflow-hidden">
                                        <img 
                                          src={service.image} 
                                          alt={service.name} 
                                          className="w-full h-full object-cover hover:scale-105 transition duration-500"
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute top-3 left-3">
                                          <span className="text-[9px] font-bold px-2 py-1 bg-black/60 text-teal-300 border border-white/5 rounded-md backdrop-blur-md uppercase tracking-wider">
                                            {service.category}
                                          </span>
                                        </div>
                                        <div className="absolute bottom-3 right-3 bg-black/60 border border-white/5 text-teal-400 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
                                          ★ {service.rating}
                                        </div>
                                      </div>

                                      <div className="p-4 space-y-2">
                                        <h4 className="font-display font-bold text-sm text-white line-clamp-1">{service.name}</h4>
                                        <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">{service.description}</p>
                                        
                                        <div className="flex items-center gap-3 text-[11px] text-white/40 font-medium">
                                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {service.duration} {i18n.language === 'ru' ? 'мин' : i18n.language === 'ar' ? 'دقيقة' : i18n.language === 'hy' ? 'min' : 'min'}</span>
                                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {service.staff.length} {i18n.language === 'ru' ? 'специалиста' : i18n.language === 'ar' ? 'أخصائيين' : i18n.language === 'hy' ? 'specialists' : 'specialists'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                                      <div className="font-mono text-xs font-bold text-white">
                                        <span className="text-white/40 block text-[9px] font-sans font-semibold uppercase">
                                          {i18n.language === 'ru' ? 'Стоимость' : i18n.language === 'ar' ? 'السعر' : i18n.language === 'hy' ? 'Price' : 'Price'}
                                        </span>
                                        {service.price.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US')} ₽
                                      </div>
                                      <button
                                        onClick={() => {
                                          setSelectedService(service);
                                          setSelectedStaff(service.staff[0]);
                                        }}
                                        className="px-3.5 py-1.5 bg-white/5 hover:bg-teal-500 hover:text-black text-white font-bold rounded-lg text-xs transition border border-white/10 hover:border-transparent cursor-pointer animate-hover"
                                      >
                                        {i18n.language === 'ru' ? 'Записаться' : i18n.language === 'ar' ? 'حجز' : i18n.language === 'hy' ? 'Book Now' : 'Book Now'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* Booking parameter wizard Right Column */}
                        <div className="bg-[#16191F] rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
                          <div className="space-y-6">
                            
                            <div>
                              <h3 className="font-display font-bold text-base text-white mb-1">
                                {i18n.language === 'ru' ? 'Детали сеанса' : i18n.language === 'ar' ? 'تفاصيل الجلسة' : i18n.language === 'hy' ? 'Session details' : 'Session details'}
                              </h3>
                              <p className="text-xs text-white/40">
                                {i18n.language === 'ru' ? 'Выберите мастера, дату и желаемое время для сеанса.' : i18n.language === 'ar' ? 'اختر المعالج والتاريخ والوقت المطلوب للجلسة.' : i18n.language === 'hy' ? 'Select a specialist, date, and preferred time for the session.' : 'Select a specialist, date, and preferred time for the session.'}
                              </p>
                            </div>

                            {selectedService ? (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                              >
                                <div className="p-3 bg-[#0F1115] rounded-xl flex gap-3 border border-white/10">
                                  <img 
                                    src={selectedService.image} 
                                    alt={selectedService.name} 
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                  <div>
                                    <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest block">{selectedService.category}</span>
                                    <h4 className="font-display font-bold text-xs text-white line-clamp-1">{selectedService.name}</h4>
                                    <span className="text-[10px] font-mono text-white/40 block mt-0.5">{selectedService.duration} {i18n.language === 'ru' ? 'мин' : i18n.language === 'ar' ? 'دقيقة' : i18n.language === 'hy' ? 'min' : 'min'} • {selectedService.price} ₽</span>
                                  </div>
                                </div>

                                {/* Specialist selector */}
                                <div>
                                  <label className="block text-xs font-semibold text-white/60 mb-1.5">
                                    {i18n.language === 'ru' ? 'Выберите специалиста' : i18n.language === 'ar' ? 'اختر الأخصائي' : i18n.language === 'hy' ? 'Select specialist' : 'Select specialist'}
                                  </label>
                                  <div className="space-y-2">
                                    {selectedService.staff.map((st) => {
                                      const isSelected = selectedStaff?.id === st.id;
                                      return (
                                        <button
                                          key={st.id}
                                          onClick={() => setSelectedStaff(st)}
                                          className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${isSelected ? 'border-teal-500 bg-teal-500/5' : 'border-white/10 bg-[#0F1115] text-white/80 hover:bg-white/5'}`}
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <img 
                                              src={st.avatar} 
                                              alt={st.name} 
                                              className="w-8 h-8 rounded-full object-cover ring-2 ring-white/5"
                                            />
                                            <div>
                                              <span className="text-xs font-semibold text-white block leading-tight">{st.name}</span>
                                              <span className="text-[9px] text-white/40 block">{st.role}</span>
                                            </div>
                                          </div>
                                          <div className="text-right">
                                            <span className="text-[10px] font-bold text-teal-400 block">★ {st.rating}</span>
                                          </div>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Date Choice */}
                                <div>
                                  <label className="block text-xs font-semibold text-white/60 mb-1.5">
                                    {i18n.language === 'ru' ? 'Дата сеанса' : i18n.language === 'ar' ? 'تاريخ الجلسة' : i18n.language === 'hy' ? 'Session date' : 'Session date'}
                                  </label>
                                  <div className="relative">
                                    <Calendar className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input 
                                      type="date" 
                                      value={booklyDate} 
                                      onChange={e => setBooklyDate(e.target.value)}
                                      className="w-full pl-10 pr-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-teal-500 font-semibold"
                                    />
                                  </div>
                                </div>

                                {/* Time Slots Choice */}
                                <div>
                                  <label className="block text-xs font-semibold text-white/60 mb-1.5">
                                    {i18n.language === 'ru' ? 'Доступное время' : i18n.language === 'ar' ? 'الوقت المتاح' : i18n.language === 'hy' ? 'Available time' : 'Available time'}
                                  </label>
                                  <div className="grid grid-cols-4 gap-1.5">
                                    {["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00", "19:30"].map((slot) => {
                                      const isSelected = booklyTime === slot;
                                      return (
                                        <button
                                          key={slot}
                                          onClick={() => setBooklyTime(slot)}
                                          className={`py-1.5 px-1 rounded-lg border text-center font-mono text-[11px] font-bold transition ${isSelected ? 'bg-teal-500 border-teal-500 text-black font-extrabold' : 'bg-[#0F1115] border-white/10 text-white/80 hover:bg-white/5'}`}
                                        >
                                          {slot}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {user.balance < selectedService.price ? (
                                  <div className="p-2.5 bg-red-500/10 rounded-xl text-[11px] text-red-400 border border-red-500/20">
                                    {i18n.language === 'ru' ? 'Недостаточно средств на балансе. Пожалуйста, пополните баланс в шапке профиля (+).' : i18n.language === 'ar' ? 'الرصيد غير كافٍ. يرجى إعادة شحن رصيدك من القائمة العلوية (+).' : i18n.language === 'hy' ? 'Insufficient balance. Please top up your balance from the header (+).' : 'Insufficient balance. Please top up your balance from the header (+).'}
                                  </div>
                                ) : null}

                              </motion.div>
                            ) : (
                              <div className="p-8 bg-white/[0.01] rounded-2xl border border-dashed border-white/10 text-center text-xs text-white/40">
                                {i18n.language === 'ru' ? 'Выберите любую услугу в списке слева, чтобы начать оформление визита.' : i18n.language === 'ar' ? 'اختر أي خدمة من القائمة على اليسار لبدء الحجز.' : i18n.language === 'hy' ? 'Select any service from the list on the left to start booking your visit.' : 'Select any service from the list on the left to start booking your visit.'}
                              </div>
                            )}

                          </div>

                          {/* Launch reservation button */}
                          <div className="pt-6 border-t border-white/5">
                            <button
                              onClick={handleBookService}
                              disabled={!selectedService || !selectedStaff || user.balance < selectedService.price || serviceActionLoading}
                              className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-teal-500/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {serviceActionLoading 
                                ? (i18n.language === 'ru' ? 'Запись...' : i18n.language === 'ar' ? 'جاري التسجيل...' : i18n.language === 'hy' ? 'Booking...' : 'Booking...') 
                                : (i18n.language === 'ru' ? 'Подтвердить запись' : i18n.language === 'ar' ? 'تأكيد الحجز' : i18n.language === 'hy' ? 'Confirm appointment' : 'Confirm appointment')}
                            </button>
                          </div>

                        </div>

                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* E. RBAC ROLE MANAGEMENT PANEL */}
              {activeModule === 'rbac' && (
                <RbacPanel 
                  user={user}
                  setUser={setUser}
                  bookings={bookings}
                  setBookings={setBookings}
                  services={services}
                  setServices={setServices}
                  availableTables={availableTables}
                  onAddNotification={(title, message, type) => {
                    fetch("/api/notifications", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: user.id, title, message, type })
                    })
                      .then(res => res.json())
                      .then(() => loadUserNotifications(user.id))
                      .catch(err => console.error("Error creating notification:", err));
                  }}
                />
              )}

              {/* AI Assistant (OmniConcierge) Tab View */}
              {activeModule === 'ai-assistant' && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="text-left space-y-1">
                    <h2 className="text-2xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <Sparkles className="w-6 h-6 text-teal-400 animate-pulse" />
                      {i18n.language === 'ru' ? 'Персональный ИИ-Консьерж' : i18n.language === 'ar' ? 'المساعد الشخصي الذكي' : i18n.language === 'hy' ? 'Personal AI Concierge' : 'Personal AI Concierge'}
                    </h2>
                    <p className="text-xs text-white/50 leading-relaxed max-w-xl">
                      {i18n.language === 'ru' ? 'Заказывайте столы в ресторанах Sakura Zen или Grand Atelier, записывайтесь на тренировки и массаж в Lotus Spa в свободной форме. ИИ-помощник мгновенно создаст бронь.' : i18n.language === 'hy' ? 'Ամրագրեք սեղաններ Sakura Zen կամ Grand Atelier ռեստորաններում, գրանցվեք մարզումների և մերսման Lotus Spa-ում ազատ ոճով։ ԱԻ օգնականն ակնթարթորեն կստեղծի ամրագրումը։' : 'Book Michelin-starred tables, fitness coaches, or luxury spa sessions by simply talking to your elite concierge.'
                      }
                    </p>
                  </div>
                  
                  <div className="h-[650px]">
                    <AIConcierge 
                      user={user}
                      restaurants={restaurants}
                      services={services}
                      bookings={bookings}
                      onBookingSuccess={(newBooking, priceCharged, type, successMsg) => {
                        // Deduct deposit/charge from user balance
                        setUser(prevUser => prevUser ? { ...prevUser, balance: prevUser.balance - priceCharged } : null);
                        
                        // Add new booking to bookings lists
                        setBookings(prev => [newBooking, ...prev]);
                        
                        // Set success feedback banner
                        setBookingSuccessMsg(successMsg);
                        
                        // Refresh recommendations
                        if (typeof loadAIRecommendations === 'function') {
                          loadAIRecommendations(user.id);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* F. OVERNIGHT STAYS ENGINE (OmniStay) */}
              {activeModule === 'stays' && (
                <StayBookingModule
                  user={user}
                  setUser={setUser}
                  hotels={hotels}
                  rooms={rooms}
                  hotelBookings={hotelBookings}
                  setHotelBookings={setHotelBookings}
                />
              )}

              {/* G. INVEST & BACK — CROWDFUNDING VENUE MODULE */}
              {activeModule === 'invest' && (
                <InvestAndBack
                  user={user}
                  campaigns={campaigns}
                  setCampaigns={setCampaigns}
                  setUser={setUser}
                />
              )}

            </main>

            {/* Personal Universal QR Pass Modal */}
            <AnimatePresence>
              {showPersonalQr && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowPersonalQr(false)}
                    className="absolute inset-0 bg-black/85 backdrop-blur-xs"
                  />

                  {/* Card container */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#16191F] border border-white/10 rounded-3xl p-6 max-w-sm w-full relative z-10 text-center shadow-2xl overflow-hidden"
                  >
                    {/* Glow effect */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#14f195]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 relative">
                      <div className="flex items-center gap-2 text-left">
                        <div className="p-1.5 rounded-lg bg-[#14f195]/10 text-[#14f195]">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-sm text-white">
                            {i18n.language === 'ru' ? 'Универсальный QR-чекин' : i18n.language === 'ar' ? 'التحقق العالمي عبر رمز QR' : i18n.language === 'hy' ? 'Universal QR Check-in' : 'Universal QR Check-in'}
                          </h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                            {i18n.language === 'ru' ? 'Карта гостя OmniReserve' : i18n.language === 'ar' ? 'بطاقة ضيف OmniReserve' : i18n.language === 'hy' ? 'OmniReserve Guest Pass' : 'OmniReserve Guest Pass'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowPersonalQr(false)}
                        className="p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* QR Image Container */}
                    <div className="bg-white rounded-2xl p-4 inline-block shadow-inner mb-6 relative group">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`user-checkin:${user.id}:${user.email}`)}&color=0f1115&bgcolor=ffffff`}
                        alt="Personal QR Check-in"
                        className="w-44 h-44 rounded-lg block"
                      />
                    </div>

                    {/* Guest Details */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left space-y-2 mb-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">
                          {i18n.language === 'ru' ? 'ИМЯ ГОСТЯ:' : i18n.language === 'ar' ? 'اسم الضيف:' : i18n.language === 'hy' ? 'GUEST NAME:' : 'GUEST NAME:'}
                        </span>
                        <span className="text-white font-bold">{user.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">EMAIL:</span>
                        <span className="text-white font-mono font-bold truncate max-w-[180px]">{user.email}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">
                          {i18n.language === 'ru' ? 'РОЛЬ В СИСТЕМЕ:' : i18n.language === 'ar' ? 'الدور في النظام:' : i18n.language === 'hy' ? 'ԴԵՐԸ ՀԱՄԱԿԱՐԳՈՒՄ:' : 'SYSTEM ROLE:'}
                        </span>
                        <span className="text-teal-400 font-mono font-bold uppercase">{user.role}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/40 leading-relaxed px-4">
                      {i18n.language === 'ru' ? 'Предъявите этот QR-код при входе в ресторан или на ресепшн спа-центра для мгновенной регистрации вашего прибытия.' : i18n.language === 'ar' ? 'يرجى تقديم رمز QR هذا عند دخول المطعم أو في مكتب استقبال مركز السبا للتسجيل الفوري لوصولك.' : i18n.language === 'hy' ? 'Ներկայացրեք այս QR կոդը ռեստորանի մուտքի մոտ կամ սպա կենտրոնի ընդունարանում՝ Ձեր ժամանումն ակնթարթորեն գրանցելու համար:' : 'Present this QR code at the entrance of the restaurant or at the spa reception desk for instant check-in.'}
                    </p>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Specific Reservation QR Pass Modal */}
            <AnimatePresence>
              {selectedQrBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedQrBooking(null)}
                    className="absolute inset-0 bg-black/85 backdrop-blur-xs"
                  />

                  {/* Card container */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#16191F] border border-white/10 rounded-3xl p-6 max-w-sm w-full relative z-10 text-center shadow-2xl overflow-hidden"
                  >
                    {/* Glow effect */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 relative">
                      <div className="flex items-center gap-2 text-left">
                        <div className={`p-1.5 rounded-lg border ${selectedQrBooking.type === 'table' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-teal-500/10 text-teal-400 border-teal-500/20'}`}>
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-sm text-white">
                            {i18n.language === 'ru' ? 'QR-код Бронирования' : i18n.language === 'ar' ? 'رمز QR للحجز' : i18n.language === 'hy' ? 'Ամրագրման QR կոդ' : 'Booking QR Code'}
                          </h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">ID: {selectedQrBooking.id}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedQrBooking(null)}
                        className="p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* QR Image Container */}
                    <div className="bg-white rounded-2xl p-4 inline-block shadow-inner mb-6 relative">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`booking-checkin:${selectedQrBooking.id}:${selectedQrBooking.type}`)}&color=0f1115&bgcolor=ffffff`}
                        alt="Booking QR Check-in"
                        className="w-44 h-44 rounded-lg block"
                      />
                    </div>

                    {/* Reservation Details */}
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left space-y-2 mb-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">
                          {i18n.language === 'ru' ? 'НАЗВАНИЕ / ОБЪЕКТ:' : i18n.language === 'ar' ? 'الاسم / الكائن:' : i18n.language === 'hy' ? 'ԱՆՎԱՆՈՒՄ / ՎԱՅՐ:' : 'NAME / VENUE:'}
                        </span>
                        <span className="text-white font-bold text-right truncate max-w-[180px]">
                          {selectedQrBooking.type === 'table' 
                            ? (i18n.language === 'ru' ? `Столик #${selectedQrBooking.tableNumber} (Ресторан)` : i18n.language === 'ar' ? `طاولة #${selectedQrBooking.tableNumber} (المطعم)` : i18n.language === 'hy' ? `Սեղան #${selectedQrBooking.tableNumber} (Ռեստորան)` : `Table #${selectedQrBooking.tableNumber} (Restaurant)`) 
                            : selectedQrBooking.serviceName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">
                          {i18n.language === 'ru' ? 'ДАТА И ВРЕМЯ:' : i18n.language === 'ar' ? 'التاريخ والوقت:' : i18n.language === 'hy' ? 'ԱՄՍԱԹԻՎ ԵՎ ԺԱՄ:' : 'DATE & TIME:'}
                        </span>
                        <span className="text-teal-400 font-bold font-mono">
                          {selectedQrBooking.date} {i18n.language === 'ru' ? 'в' : i18n.language === 'ar' ? 'في' : i18n.language === 'hy' ? 'ժամը' : 'at'} {selectedQrBooking.time}
                        </span>
                      </div>
                      {selectedQrBooking.type === 'table' ? (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/40">
                            {i18n.language === 'ru' ? 'ЗАЛ И ГОСТИ:' : i18n.language === 'ar' ? 'القاعة والضيوف:' : i18n.language === 'hy' ? 'ՍՐԱՀ ԵՎ ՀՅՈՒՐԵՐ:' : 'ROOM & GUESTS:'}
                          </span>
                          <span className="text-white font-medium">
                            {selectedQrBooking.room === 'main' 
                              ? (i18n.language === 'ru' ? 'Главный' : i18n.language === 'ar' ? 'الرئيسية' : i18n.language === 'hy' ? 'Գլխավոր' : 'Main') 
                              : selectedQrBooking.room === 'vip' 
                                ? 'VIP' 
                                : (i18n.language === 'ru' ? 'Терраса' : i18n.language === 'ar' ? 'الشرفة' : i18n.language === 'hy' ? 'Տեռաս' : 'Terrace')
                            }, {selectedQrBooking.guests} {i18n.language === 'ru' ? 'чел' : i18n.language === 'ar' ? 'أشخاص' : i18n.language === 'hy' ? 'guests' : 'guests'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/40">
                            {i18n.language === 'ru' ? 'СПЕЦИАЛИСТ:' : i18n.language === 'ar' ? 'الأخصائي:' : i18n.language === 'hy' ? 'ՄԱՍՆԱԳԵՏ:' : 'SPECIALIST:'}
                          </span>
                          <span className="text-white font-medium">{selectedQrBooking.staffName}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">
                          {i18n.language === 'ru' ? 'СТАТУС ЧЕКИНА:' : i18n.language === 'ar' ? 'حالة تسجيل الوصول:' : i18n.language === 'hy' ? 'ԳՐԱՆՑՄԱՆ ԿԱՐԳԱՎԻՃԱԿ:' : 'CHECK-IN STATUS:'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider animate-pulse">
                          {i18n.language === 'ru' ? 'Ожидает прибытия' : i18n.language === 'ar' ? 'في انتظار الوصول' : i18n.language === 'hy' ? 'Սպասում է ժամանմանը' : 'Awaiting arrival'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/40 leading-relaxed px-4">
                      {i18n.language === 'ru' ? 'Покажите данный код менеджеру или просканируйте его на терминале при входе для автоматической активации визита.' : i18n.language === 'ar' ? 'يرجى إظهار هذا الرمز للمدير أو مسحه ضوئيًا عند المدخل لتفعيل زيارتك تلقائيًا.' : i18n.language === 'hy' ? 'Ցույց տվեք այս կոդը մենեջերին կամ սկանավորեք այն մուտքի մոտ գտնվող տերմինալով՝ այցն ավտոմատ ակտիվացնելու համար:' : 'Show this code to the manager or scan it at the terminal upon entrance for automatic visit activation.'}
                    </p>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Camera QR Code Scanner */}
            <QRScanner
              isOpen={showQrScanner}
              onClose={() => setShowQrScanner(false)}
              onScanSuccess={handleGlobalQrScanSuccess}
            />

            {/* Globally Scanned Check-In Confirmation Modal */}
            <AnimatePresence>
              {(scannedCheckInBooking || scannedCheckInUserPass) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      setScannedCheckInBooking(null);
                      setScannedCheckInUserPass(null);
                      setScannedUserBookings([]);
                    }}
                    className="absolute inset-0 bg-black/85 backdrop-blur-md"
                  />

                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 15 }}
                    className="bg-[#16191F] border border-white/10 rounded-3xl p-6 max-w-sm w-full relative z-10 text-center shadow-2xl overflow-hidden"
                  >
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 relative">
                      <div className="flex items-center gap-2 text-left">
                        <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                          <QrCode className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-sm text-white">
                            {i18n.language === 'ru' ? 'Результат сканирования' : 'Scan Result Verification'}
                          </h4>
                          <span className="text-[9px] font-mono text-teal-400 uppercase tracking-wider block font-bold">
                            OmniReserve Secure Check-In
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setScannedCheckInBooking(null);
                          setScannedCheckInUserPass(null);
                          setScannedUserBookings([]);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* SCENARIO 1: Booking QR Code successfully scanned */}
                    {scannedCheckInBooking && (
                      <div className="space-y-4">
                        <div className="text-center">
                          <h5 className="text-white/60 text-xs uppercase tracking-wider font-semibold">
                            {scannedCheckInBooking.type === 'table' ? (i18n.language === 'ru' ? 'БРОНИРОВАНИЕ СТОЛИКА' : 'TABLE RESERVATION') : (i18n.language === 'ru' ? 'БРОНИРОВАНИЕ УСЛУГИ' : 'SERVICE RESERVATION')}
                          </h5>
                          <h3 className="text-lg font-display font-bold text-white mt-1">
                            {scannedCheckInBooking.type === 'table' 
                              ? (i18n.language === 'ru' ? `Столик #${scannedCheckInBooking.tableNumber}` : `Table #${scannedCheckInBooking.tableNumber}`) 
                              : scannedCheckInBooking.serviceName}
                          </h3>
                          <span className="text-[10px] font-mono text-white/40 block mt-0.5">ID: {scannedCheckInBooking.id}</span>
                        </div>

                        {/* Details Grid */}
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left space-y-2.5 text-xs text-white/70">
                          <div className="flex justify-between items-center py-1 border-b border-white/[0.03]">
                            <span className="text-white/40">{i18n.language === 'ru' ? 'Заведение:' : 'Venue:'}</span>
                            <span className="text-white font-semibold">
                              {scannedCheckInBooking.type === 'table' ? scannedCheckInBooking.restaurantName : scannedCheckInBooking.salonName || 'Spa & Wellness Center'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-white/[0.03]">
                            <span className="text-white/40">{i18n.language === 'ru' ? 'Дата и время:' : 'Date & Time:'}</span>
                            <span className="text-teal-400 font-bold font-mono">{scannedCheckInBooking.date} в {scannedCheckInBooking.time}</span>
                          </div>
                          {scannedCheckInBooking.type === 'table' ? (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-white/40">{i18n.language === 'ru' ? 'Зал и Гости:' : 'Room & Guests:'}</span>
                              <span className="text-white font-medium">
                                <span className="capitalize">{scannedCheckInBooking.room}</span> room, {scannedCheckInBooking.guests} pax
                              </span>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-white/40">{i18n.language === 'ru' ? 'Специалист:' : 'Staff Member:'}</span>
                              <span className="text-white font-semibold">{scannedCheckInBooking.staffName}</span>
                            </div>
                          )}
                        </div>

                        {/* Scan status & confirmation triggers */}
                        {scannedCheckInBooking.checkedIn ? (
                          <div className="p-3 bg-[#14f195]/10 border border-[#14f195]/20 rounded-xl text-center space-y-1">
                            <span className="text-xs font-bold text-[#14f195] block">✓ {i18n.language === 'ru' ? 'УСПЕШНО ЗАРЕГИСТРИРОВАН' : 'CHECK-IN CONFIRMED'}</span>
                            <span className="text-[10px] text-white/40 block">
                              {i18n.language === 'ru' ? 'Гость успешно прошел верификацию.' : 'Guest has been registered successfully.'}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              handleCheckInBooking(scannedCheckInBooking.id);
                              toast.success(i18n.language === 'ru' ? "Чекин успешно выполнен!" : "Check-in completed!");
                            }}
                            className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20"
                          >
                            <Check className="w-4 h-4" />
                            {i18n.language === 'ru' ? 'Подтвердить прибытие гостя' : 'Confirm Guest Check-In'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* SCENARIO 2: Universal Guest Pass successfully scanned */}
                    {scannedCheckInUserPass && (
                      <div className="space-y-4">
                        <div className="text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#14f195]/10 text-[#14f195] border border-[#14f195]/20 text-[9px] font-mono uppercase tracking-wider font-bold">
                            {i18n.language === 'ru' ? 'КАРТА ГОСТЯ OmniReserve' : 'OMNIRESERVE GUEST CARD'}
                          </span>
                          <h3 className="text-base font-display font-bold text-white mt-2">
                            {scannedUserBookings.length > 0 && scannedUserBookings[0].userId === "user-1" 
                              ? "Мария Смирнова" 
                              : scannedUserBookings.length > 0 && scannedUserBookings[0].userId === "user-2"
                                ? "Алексей Иванов"
                                : user.name
                            }
                          </h3>
                          <span className="text-[10px] font-mono text-white/40 block mt-0.5">{scannedCheckInUserPass.email}</span>
                        </div>

                        {/* List of matched reservations */}
                        <div className="space-y-2 text-left">
                          <h5 className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                            {i18n.language === 'ru' ? 'НАЙДЕННЫЕ БРОНИРОВАНИЯ ГОСТЯ:' : 'MATCHED RESERVATIONS:'}
                          </h5>

                          {scannedUserBookings.length === 0 ? (
                            <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl text-center space-y-1">
                              <p className="text-xs text-white/40">{i18n.language === 'ru' ? 'Активных броней не найдено' : 'No upcoming bookings found'}</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {scannedUserBookings.map(b => (
                                <div key={b.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <span className="text-xs font-semibold text-white truncate block">
                                      {b.type === 'table' ? (i18n.language === 'ru' ? `Столик #${b.tableNumber}` : `Table #${b.tableNumber}`) : b.serviceName}
                                    </span>
                                    <span className="text-[10px] font-mono text-white/40 block mt-0.5">
                                      {b.date} в {b.time}
                                    </span>
                                  </div>

                                  <div>
                                    {b.checkedIn ? (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#14f195] bg-[#14f195]/10 border border-[#14f195]/20 px-2 py-0.5 rounded-full uppercase">
                                        <Check className="w-3 h-3" /> Ok
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleCheckInBooking(b.id)}
                                        className="px-2.5 py-1 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-[10px] uppercase rounded-lg transition"
                                      >
                                        {i18n.language === 'ru' ? 'Вход' : 'In'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setScannedCheckInBooking(null);
                        setScannedCheckInUserPass(null);
                        setScannedUserBookings([]);
                      }}
                      className="w-full mt-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-medium transition"
                    >
                      {i18n.language === 'ru' ? 'Закрыть панель' : 'Close Panel'}
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Booking Confirmation Modal */}
            <AnimatePresence>
              {showConfirmModal && confirmModalData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" id="booking-confirm-modal">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowConfirmModal(false)}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                  />

                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#16191F] border border-white/10 rounded-3xl p-6 max-w-lg w-full relative z-[101] shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto"
                  >
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 relative">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${confirmModalData.type === 'table' ? 'bg-teal-500/10 text-teal-400' : 'bg-purple-500/10 text-purple-400'}`}>
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-base text-white">{confirmModalData.title}</h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                            {i18n.language === 'ru' ? 'Проверка условий перед подтверждением' : i18n.language === 'ar' ? 'التحقق من الشروط قبل التأكيد' : i18n.language === 'hy' ? 'Պայմանների ստուգում հաստատումից առաջ' : 'Checking terms before confirmation'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowConfirmModal(false)}
                        className="p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-5 relative">
                      {/* Summary details */}
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 text-xs">
                        <span className="text-[10px] font-mono uppercase text-teal-400 font-bold tracking-wider block mb-2">
                          {i18n.language === 'ru' ? 'Детали заказа' : i18n.language === 'ar' ? 'تفاصيل الطلب' : i18n.language === 'hy' ? 'Պատվերի մանրամասներ' : 'Order details'}
                        </span>
                        {confirmModalData.details.map((detail, index) => {
                          const parts = detail.split(":");
                          if (parts.length > 1) {
                            return (
                              <div key={index} className="flex justify-between items-start py-1 border-b border-white/[0.02] last:border-0 text-left">
                                <span className="text-white/50">{parts[0]}:</span>
                                <span className="font-semibold text-white text-right ml-4">{parts.slice(1).join(":")}</span>
                              </div>
                            );
                          }
                          return (
                            <div key={index} className="text-white/80 py-0.5 text-left">
                              {detail}
                            </div>
                          );
                        })}
                      </div>

                      {/* Financial summary */}
                      <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-2xl flex justify-between items-center">
                        <div className="text-left">
                          <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-wider block">{t('common.totalToDebit')}</span>
                          <span className="text-xs text-white/50">{t('common.debitInstantly')}</span>
                        </div>
                        <span className="font-mono font-bold text-xl text-teal-300">
                          {confirmModalData.cost.toLocaleString(i18n.language === 'ru' ? 'ru-RU' : i18n.language === 'hy' ? 'hy-AM' : 'en-US')} ₽
                        </span>
                      </div>

                      {/* Cancellation policy */}
                      <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          <span>{t('common.cancellationRules')}</span>
                        </div>
                        <p className="text-[11px] text-amber-200/80 leading-relaxed text-left">
                          {confirmModalData.type === 'table' 
                            ? t('common.tableCancellationRules')
                            : t('common.serviceCancellationRules')}
                        </p>
                      </div>

                      {/* Confirmation Terms Note */}
                      <p className="text-[10px] text-white/30 leading-normal text-center">
                        {t('common.termsNote')}
                      </p>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmModal(false)}
                          className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          {t('common.back')}
                        </button>
                        <button 
                          type="button" 
                          onClick={confirmModalData.onConfirm}
                          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-black rounded-xl text-xs font-black transition cursor-pointer shadow-lg shadow-teal-500/10 flex items-center gap-1.5"
                        >
                          <span>{t('common.confirmBooking')}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Profile Settings Modal */}
            <AnimatePresence>
              {showSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSettingsModal(false)}
                    className="absolute inset-0 bg-black/85 backdrop-blur-xs"
                  />

                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#16191F] border border-white/10 rounded-3xl p-6 max-w-md w-full relative z-10 shadow-2xl overflow-y-auto max-h-[90vh]"
                  >
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex justify-between items-center mb-6 relative">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                          <Settings className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-base text-white">
                            {i18n.language === 'ru' ? 'Настройки профиля' : i18n.language === 'ar' ? 'إعدادات الملف الشخصي' : i18n.language === 'hy' ? 'Պրոֆիլի կարգավորումներ' : 'Profile Settings'}
                          </h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                            {i18n.language === 'ru' ? 'управление аккаунтом и темой' : i18n.language === 'ar' ? 'إدارة الحساب والمظهر' : i18n.language === 'hy' ? 'հաշվի և թեմայի կառավարում' : 'manage account and theme'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowSettingsModal(false)}
                        className="p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-6 relative">
                      {/* Avatar Selection & Profile Basics */}
                      <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-16 h-16 rounded-full ring-2 ring-teal-500/30 object-cover"
                        />
                        <div className="space-y-1">
                          <span className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider">
                            {i18n.language === 'ru' ? 'Ваш аккаунт' : i18n.language === 'ar' ? 'حسابك' : i18n.language === 'hy' ? 'Ձեր հաշիվը' : 'Your account'}
                          </span>
                          <h5 className="font-bold text-white text-sm">{user.name}</h5>
                          <span className="text-xs text-white/40 block font-mono">{user.email}</span>
                        </div>
                      </div>

                      {/* Edit Username Field */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-extrabold block">
                          {i18n.language === 'ru' ? 'Имя пользователя' : i18n.language === 'ar' ? 'اسم المستخدم' : i18n.language === 'hy' ? 'Օգտանուն' : 'Username'}
                        </label>
                        <input 
                          type="text" 
                          value={user.name} 
                          onChange={(e) => {
                            const updatedUser = { ...user, name: e.target.value };
                            setUser(updatedUser);
                            localStorage.setItem(`user_${user.email}`, JSON.stringify(updatedUser));
                          }}
                          className="w-full bg-black/40 border border-white/10 focus:border-teal-500/40 rounded-xl px-4 py-3 text-xs text-white focus:outline-hidden transition"
                          placeholder={i18n.language === 'ru' ? 'Ваше имя' : i18n.language === 'ar' ? 'اسمك' : i18n.language === 'hy' ? 'Ձեր անունը' : 'Your name'}
                        />
                      </div>

                      {/* Change Avatar Preset */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-extrabold block">
                          {i18n.language === 'ru' ? 'Выберите аватар' : i18n.language === 'ar' ? 'اختر صورتك الرمزية' : i18n.language === 'hy' ? 'Ընտրել ավատար' : 'Select avatar'}
                        </label>
                        <div className="flex gap-2">
                          {[
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
                            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
                            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
                            "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150"
                          ].map((avatarUrl, i) => {
                            const isSelected = user.avatar === avatarUrl;
                            return (
                              <button
                                key={i}
                                onClick={() => {
                                  const updatedUser = { ...user, avatar: avatarUrl };
                                  setUser(updatedUser);
                                  localStorage.setItem(`user_${user.email}`, JSON.stringify(updatedUser));
                                }}
                                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition ${
                                  isSelected ? "border-teal-500 scale-110" : "border-white/10 hover:border-white/30"
                                }`}
                              >
                                <img src={avatarUrl} alt="Preset Avatar" className="w-full h-full object-cover" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* More Details Section */}
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-extrabold block">
                          {i18n.language === 'ru' ? 'Детали профиля' : i18n.language === 'ar' ? 'تفاصيل الحساب' : i18n.language === 'hy' ? 'Պրոֆիլի մանրամասներ' : 'Profile Details'}
                        </label>
                        
                        <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3 text-xs">
                          {/* Role detail */}
                          <div className="flex justify-between items-center">
                            <span className="text-white/40">{i18n.language === 'ru' ? 'Роль:' : i18n.language === 'ar' ? 'الدور:' : i18n.language === 'hy' ? 'Դեր:' : 'User Role:'}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono tracking-wide uppercase ${
                              user.role === 'client' 
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' 
                                : 'bg-teal-500/10 text-teal-400 border border-teal-500/15'
                            }`}>
                              {user.role === 'client' 
                                ? (i18n.language === 'ru' ? 'Клиент' : i18n.language === 'ar' ? 'عميل' : i18n.language === 'hy' ? 'Հաճախորդ' : 'Client') 
                                : (user.role === 'business_owner' 
                                  ? (i18n.language === 'ru' ? 'Владелец бизнеса' : i18n.language === 'ar' ? 'مالك عمل' : i18n.language === 'hy' ? 'Բիզնեսի սեփականատեր' : 'Business Owner')
                                  : user.role)}
                            </span>
                          </div>

                          {/* Balance detail */}
                          <div className="flex justify-between items-center">
                            <span className="text-white/40">{i18n.language === 'ru' ? 'Баланс счета:' : i18n.language === 'ar' ? 'الرصيد:' : i18n.language === 'hy' ? 'Հաշվի հաշվեկշիռ:' : 'Account Balance:'}</span>
                            <span className="font-mono font-bold text-teal-400">{user.balance.toLocaleString('ru-RU')} ₽</span>
                          </div>

                          {/* Business Info if business user */}
                          {user.businessName && (
                            <div className="pt-2.5 border-t border-white/5 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-white/40">{i18n.language === 'ru' ? 'Компания:' : i18n.language === 'ar' ? 'الشركة:' : i18n.language === 'hy' ? 'Բիզնեսի անվանումը:' : 'Business Name:'}</span>
                                <span className="font-bold text-white text-right">{user.businessName}</span>
                              </div>
                              {user.businessCategory && (
                                <div className="flex justify-between">
                                  <span className="text-white/40">{i18n.language === 'ru' ? 'Категория:' : i18n.language === 'ar' ? 'الفئة:' : i18n.language === 'hy' ? 'Category:' : 'Category:'}</span>
                                  <span className="text-white/70 font-mono text-[11px]">{user.businessCategory}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Preferences Detail */}
                          {user.preferences && user.preferences.length > 0 && (
                            <div className="pt-2.5 border-t border-white/5">
                              <span className="text-white/40 block mb-1.5">{i18n.language === 'ru' ? 'Предпочтения:' : i18n.language === 'ar' ? 'التفضيلات:' : i18n.language === 'hy' ? 'Նախընտրություններ:' : 'Preferences:'}</span>
                              <div className="flex flex-wrap gap-1">
                                {user.preferences.map((pref, index) => (
                                  <span key={index} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-white/70">
                                    {pref}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* System Diagnostics */}
                          <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-[10px] text-white/30 font-mono">
                            <span>UID: {user.id.slice(0, 8).toUpperCase()}</span>
                            <span>{i18n.language === 'ru' ? 'СТАТУС: АКТИВЕН' : i18n.language === 'ar' ? 'الحالة: نشط' : i18n.language === 'hy' ? 'ԿԱՐԳԱՎԻՃԱԿ՝ ԱԿՏԻՎ' : 'STATUS: ACTIVE'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Theme Toggle Selection (Light/Dark) */}
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div>
                          <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-extrabold block">
                            {i18n.language === 'ru' ? 'Тема оформления' : i18n.language === 'ar' ? 'المظهر' : i18n.language === 'hy' ? 'Արտաքին տեսքի թեմա' : 'Visual theme'}
                          </label>
                          <span className="text-[10px] text-white/30 block">
                            {i18n.language === 'ru' ? 'Выберите визуальное оформление приложения' : i18n.language === 'ar' ? 'اختر المظهر المرئي للتطبيق' : i18n.language === 'hy' ? 'Ընտրեք հավելվածի արտաքին տեսքը' : 'Choose application visual appearance'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Dark Theme Button */}
                          <button
                            type="button"
                            onClick={() => setTheme('dark')}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition duration-300 ${
                              theme === 'dark' 
                                ? "bg-teal-500/10 border-teal-500 text-teal-400 font-bold" 
                                : "bg-black/20 border-white/5 text-white/50 hover:text-white hover:border-white/10"
                            }`}
                          >
                            <Moon className="w-4 h-4" />
                            <div className="text-left">
                              <span className="text-xs block leading-none font-bold">
                                {i18n.language === 'ru' ? 'Темная' : i18n.language === 'ar' ? 'داكن' : i18n.language === 'hy' ? 'Մուգ' : 'Dark'}
                              </span>
                              <span className="text-[8px] opacity-60 block mt-0.5">
                                {i18n.language === 'ru' ? 'Энергосберегающая' : i18n.language === 'ar' ? 'موفّر للطاقة' : i18n.language === 'hy' ? 'Էներգախնայող' : 'Energy saving'}
                              </span>
                            </div>
                          </button>

                          {/* Light Theme Button */}
                          <button
                            type="button"
                            onClick={() => setTheme('light')}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition duration-300 ${
                              theme === 'light' 
                                ? "bg-amber-500/10 border-amber-500 text-amber-500 font-bold" 
                                : "bg-black/20 border-white/5 text-white/50 hover:text-white hover:border-white/10"
                            }`}
                          >
                            <Sun className="w-4 h-4" />
                            <div className="text-left">
                              <span className="text-xs block leading-none font-bold">
                                {i18n.language === 'ru' ? 'Светлая' : i18n.language === 'ar' ? 'فاتح' : i18n.language === 'hy' ? 'Բաց' : 'Light'}
                              </span>
                              <span className="text-[8px] opacity-60 block mt-0.5">
                                {i18n.language === 'ru' ? 'Высококонтрастная' : i18n.language === 'ar' ? 'تباين عالي' : i18n.language === 'hy' ? 'Բարձր կոնտրաստայնություն' : 'High contrast'}
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Accessibility Settings (High Contrast Mode) */}
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <div>
                            <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-extrabold block">
                              {i18n.language === 'ru' ? 'Специальные возможности' : i18n.language === 'ar' ? 'إمكانية الوصول' : i18n.language === 'hy' ? 'Հատուկ հնարավորություններ' : 'Accessibility'}
                            </label>
                            <span className="text-[10px] text-white/30 block max-w-[280px]">
                              {i18n.language === 'ru' ? 'Высококонтрастный режим для слабовидящих пользователей (соответствие WCAG)' : i18n.language === 'ar' ? 'وضع التباين العالي للمستخدمين ضعاف البصر (متوافق مع WCAG)' : i18n.language === 'hy' ? 'Բարձր կոնտրաստային ռեժիմ թույլ տեսողություն ունեցողների համար (WCAG համատեղելի)' : 'High contrast mode for visually impaired users (WCAG compliant)'}
                            </span>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => setHighContrast(!highContrast)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              highContrast ? 'bg-teal-500' : 'bg-white/10'
                            }`}
                            aria-pressed={highContrast}
                          >
                            <span className="sr-only">Toggle High Contrast</span>
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                highContrast ? 'translate-x-5 bg-black' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Interactive Preview Button */}
                        <button
                          type="button"
                          onClick={() => setHighContrast(!highContrast)}
                          className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border transition ${
                            highContrast 
                              ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold' 
                              : 'bg-black/20 border-white/5 text-white/50 hover:text-white hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Contrast className="w-4 h-4" />
                            <div className="text-left">
                              <span className="text-xs block font-bold">
                                {i18n.language === 'ru' ? 'Высокий контраст' : i18n.language === 'ar' ? 'تباين عالي' : i18n.language === 'hy' ? 'Բարձր կոնտրաստ' : 'High Contrast Mode'}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-white/10">
                            {highContrast 
                              ? (i18n.language === 'ru' ? 'ВКЛ' : i18n.language === 'ar' ? 'مفعل' : i18n.language === 'hy' ? 'ՄԻԱՑՎԱԾ' : 'ON') 
                              : (i18n.language === 'ru' ? 'ВЫКЛ' : i18n.language === 'ar' ? 'معطل' : i18n.language === 'hy' ? 'ԱՆՋԱՏՎԱԾ' : 'OFF')}
                          </span>
                        </button>
                      </div>

                      {/* Save Status / Close button */}
                      <div className="pt-5 border-t border-white/5 flex flex-col gap-3">
                        <button
                          onClick={() => setShowSettingsModal(false)}
                          className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-teal-500/10 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {i18n.language === 'ru' ? 'Сохранить настройки' : i18n.language === 'ar' ? 'حفظ الإعدادات' : i18n.language === 'hy' ? 'Պահպանել կարգավորումները' : 'Save Settings'}
                        </button>

                        <button
                          onClick={() => {
                            setShowSettingsModal(false);
                            handleLogout();
                          }}
                          className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          {i18n.language === 'ru' ? 'Выйти из аккаунта' : i18n.language === 'ar' ? 'تسجيل الخروج' : i18n.language === 'hy' ? 'Դուրս գալ' : 'Log out'}
                        </button>
                      </div>

                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Salon Registration Modal */}
            <AnimatePresence>
              {showRegisterSalonModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowRegisterSalonModal(false)}
                    className="absolute inset-0 bg-black/85 backdrop-blur-xs"
                  />

                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#16191F] border border-white/10 rounded-3xl p-6 max-w-lg w-full relative z-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                  >
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 relative">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                          <Compass className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-base text-white">
                            {i18n.language === 'ru' ? 'Регистрация бьюти-бизнеса' : i18n.language === 'ar' ? 'تسجيل عمل تجاري جمالي' : i18n.language === 'hy' ? 'Գեղեցկության բիզնեսի գրանցում' : 'Beauty business registration'}
                          </h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                            {i18n.language === 'ru' ? 'Создание нового велнес/салонного центра' : i18n.language === 'ar' ? 'إنشاء مركز عافية/صالون جديد' : i18n.language === 'hy' ? 'Նոր վելնես/սրահի կենտրոնի ստեղծում' : 'Create new wellness/salon center'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowRegisterSalonModal(false)}
                        className="p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleRegisterSalon} className="space-y-4 relative">
                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          {i18n.language === 'ru' ? 'Название заведения *' : i18n.language === 'ar' ? 'اسم المنشأة *' : i18n.language === 'hy' ? 'Հաստատության անվանումը *' : 'Venue Name *'}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={newSalonForm.name}
                          onChange={e => setNewSalonForm({...newSalonForm, name: e.target.value})}
                          placeholder={i18n.language === 'ru' ? 'Например: Aura Spa & Wellness' : i18n.language === 'ar' ? 'مثال: Aura Spa & Wellness' : i18n.language === 'hy' ? 'Օրինակ՝ Aura Spa & Wellness' : 'Example: Aura Spa & Wellness'}
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-white/60 mb-1">
                            {i18n.language === 'ru' ? 'Категория *' : i18n.language === 'ar' ? 'الفئة *' : i18n.language === 'hy' ? 'Կատեգորիա *' : 'Category *'}
                          </label>
                          <select 
                            value={newSalonForm.category}
                            onChange={e => setNewSalonForm({...newSalonForm, category: e.target.value as any})}
                            className="w-full px-3 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                          >
                            <option value="Spa & Wellness">Spa & Wellness</option>
                            <option value="Fitness & Active">Fitness & Active</option>
                            <option value="Beauty & Style">Beauty & Style</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/60 mb-1">
                            {i18n.language === 'ru' ? 'Адрес *' : i18n.language === 'ar' ? 'العنوان *' : i18n.language === 'hy' ? 'Հասցե *' : 'Address *'}
                          </label>
                          <input 
                            type="text" 
                            required
                            value={newSalonForm.address}
                            onChange={e => setNewSalonForm({...newSalonForm, address: e.target.value})}
                            placeholder={i18n.language === 'ru' ? 'ул. Ленина, д. 45' : i18n.language === 'ar' ? 'شارع السلام، مبنى 45' : i18n.language === 'hy' ? 'Լենինի փ., տ. 45' : '45 Lenin St.'}
                            className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          {i18n.language === 'ru' ? 'Краткое описание' : i18n.language === 'ar' ? 'وصف قصير' : i18n.language === 'hy' ? 'Համառոտ նկարագրություն' : 'Brief description'}
                        </label>
                        <textarea 
                          value={newSalonForm.description}
                          onChange={e => setNewSalonForm({...newSalonForm, description: e.target.value})}
                          placeholder={i18n.language === 'ru' ? 'Опишите концепцию, удобства и особенности вашего салона...' : i18n.language === 'ar' ? 'صف المفهوم والمرافق والميزات للصالون الخاص بك...' : i18n.language === 'hy' ? 'Նկարագրեք Ձեր սրահի հայեցակարգը, հարմարություններն ու առանձնահատկությունները...' : 'Describe the concept, amenities, and features of your salon...'}
                          rows={2}
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          {i18n.language === 'ru' ? 'Ссылка на фото (URL)' : i18n.language === 'ar' ? 'رابط الصورة (URL)' : i18n.language === 'hy' ? 'Լուսանկարի հղում (URL)' : 'Photo Link (URL)'}
                        </label>
                        <input 
                          type="text" 
                          value={newSalonForm.image}
                          onChange={e => setNewSalonForm({...newSalonForm, image: e.target.value})}
                          placeholder={i18n.language === 'ru' ? 'https://images.unsplash.com/... (Оставьте пустым для автогенерации)' : i18n.language === 'ar' ? 'https://images.unsplash.com/... (اتركه فارغاً للتوليد التلقائي)' : i18n.language === 'hy' ? 'https://images.unsplash.com/... (Թողնել դատարկ ավտոմատ գեներացման համար)' : 'https://images.unsplash.com/... (Leave empty for auto-generation)'}
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                        <span className="text-[10px] font-mono uppercase text-teal-400 font-bold tracking-wider block">
                          {i18n.language === 'ru' ? 'Первая услуга салона (для старта)' : i18n.language === 'ar' ? 'أول خدمة للصالون (للبدء)' : i18n.language === 'hy' ? 'Սրահի առաջին ծառայությունը (սկսելու համար)' : 'First salon service (to start)'}
                        </span>
                        
                        <div>
                          <label className="block text-[11px] font-semibold text-white/50 mb-1">
                            {i18n.language === 'ru' ? 'Название услуги *' : i18n.language === 'ar' ? 'اسم الخدمة *' : i18n.language === 'hy' ? 'Ծառայության անվանումը *' : 'Service name *'}
                          </label>
                          <input 
                            type="text" 
                            required
                            value={newSalonForm.serviceName}
                            onChange={e => setNewSalonForm({...newSalonForm, serviceName: e.target.value})}
                            placeholder={i18n.language === 'ru' ? 'Например: Классический шведский массаж' : i18n.language === 'ar' ? 'مثال: تدليك سويدي كلاسيكي' : i18n.language === 'hy' ? 'Օրինակ՝ Դասական շվեդական մերսում' : 'Example: Classic Swedish Massage'}
                            className="w-full px-4 py-1.5 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-white/50 mb-1">
                              {i18n.language === 'ru' ? 'Стоимость (₽) *' : i18n.language === 'ar' ? 'السعر (₽) *' : i18n.language === 'hy' ? 'Արժեքը (₽) *' : 'Price (₽) *'}
                            </label>
                            <input 
                              type="number" 
                              required
                              value={newSalonForm.servicePrice}
                              onChange={e => setNewSalonForm({...newSalonForm, servicePrice: e.target.value})}
                              placeholder="3500"
                              className="w-full px-4 py-1.5 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-white/50 mb-1">
                              {i18n.language === 'ru' ? 'Длительность (мин) *' : i18n.language === 'ar' ? 'المدة (دقيقة) *' : i18n.language === 'hy' ? 'Տևողությունը (րոպե) *' : 'Duration (min) *'}
                            </label>
                            <input 
                              type="number" 
                              required
                              value={newSalonForm.serviceDuration}
                              onChange={e => setNewSalonForm({...newSalonForm, serviceDuration: e.target.value})}
                              placeholder="60"
                              className="w-full px-4 py-1.5 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                        <button 
                          type="button" 
                          onClick={() => setShowRegisterSalonModal(false)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          {i18n.language === 'ru' ? 'Отмена' : i18n.language === 'ar' ? 'إلغاء' : i18n.language === 'hy' ? 'Չեղարկել' : 'Cancel'}
                        </button>
                        <button 
                          type="submit" 
                          disabled={registeringSalon}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black rounded-xl text-xs font-black transition cursor-pointer shadow-lg shadow-teal-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {registeringSalon 
                            ? (i18n.language === 'ru' ? 'Регистрируем…' : i18n.language === 'ar' ? 'جاري التسجيل...' : i18n.language === 'hy' ? 'Գրանցվում է...' : 'Registering...') 
                            : (i18n.language === 'ru' ? 'Зарегистрировать салон' : i18n.language === 'ar' ? 'تسجيل الصالون' : i18n.language === 'hy' ? 'Գրանցել սրահը' : 'Register Salon')}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Restaurant Registration Modal */}
            <AnimatePresence>
              {showRegisterRestaurantModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowRegisterRestaurantModal(false)}
                    className="absolute inset-0 bg-black/85 backdrop-blur-xs"
                  />

                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#16191F] border border-white/10 rounded-3xl p-6 max-w-lg w-full relative z-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                  >
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 relative">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
                          <Utensils className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-base text-white">
                            {i18n.language === 'ru' ? 'Регистрация ресторана / кафе' : i18n.language === 'ar' ? 'تسجيل مطعم / مقهى' : i18n.language === 'hy' ? 'Ռեստորանի / սրճարանի գրանցում' : 'Restaurant / Cafe registration'}
                          </h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                            {i18n.language === 'ru' ? 'Создание нового гастрономического пространства' : i18n.language === 'ar' ? 'إنشاء مساحة طهي جديدة' : i18n.language === 'hy' ? 'Նոր գաստրոնոմիական տարածքի ստեղծում' : 'Create new gastronomic space'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowRegisterRestaurantModal(false)}
                        className="p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleRegisterRestaurant} className="space-y-4 relative">
                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          {i18n.language === 'ru' ? 'Название заведения *' : i18n.language === 'ar' ? 'اسم المنشأة *' : i18n.language === 'hy' ? 'Հաստատության անվանումը *' : 'Venue Name *'}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={newRestaurantForm.name}
                          onChange={e => setNewRestaurantForm({...newRestaurantForm, name: e.target.value})}
                          placeholder={i18n.language === 'ru' ? 'Например: Bistro Gusto' : i18n.language === 'ar' ? 'مثال: Bistro Gusto' : i18n.language === 'hy' ? 'Օրինակ՝ Bistro Gusto' : 'Example: Bistro Gusto'}
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-white/60 mb-1">
                            {i18n.language === 'ru' ? 'Кухня *' : i18n.language === 'ar' ? 'المطبخ *' : i18n.language === 'hy' ? 'Խոհանոց *' : 'Cuisine *'}
                          </label>
                          <input 
                            type="text" 
                            required
                            value={newRestaurantForm.cuisine}
                            onChange={e => setNewRestaurantForm({...newRestaurantForm, cuisine: e.target.value})}
                            placeholder={i18n.language === 'ru' ? 'Европейская, Азиатская, Итальянская' : i18n.language === 'ar' ? 'أوروبية، آسيوية، إيطالية' : i18n.language === 'hy' ? 'Եվրոպական, Ասիական, Իտալական' : 'European, Asian, Italian'}
                            className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/60 mb-1">
                            {i18n.language === 'ru' ? 'Количество столов для старта *' : i18n.language === 'ar' ? 'عدد الطاولات للبدء *' : i18n.language === 'hy' ? 'Սեղանների քանակը սկսելու համար *' : 'Number of tables to start *'}
                          </label>
                          <input 
                            type="number" 
                            required
                            min="2"
                            max="30"
                            value={newRestaurantForm.tablesCount}
                            onChange={e => setNewRestaurantForm({...newRestaurantForm, tablesCount: e.target.value})}
                            className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          {i18n.language === 'ru' ? 'Описание концепции' : i18n.language === 'ar' ? 'وصف المفهوم' : i18n.language === 'hy' ? 'Հայեցակարգի նկարագրություն' : 'Concept description'}
                        </label>
                        <textarea 
                          value={newRestaurantForm.description}
                          onChange={e => setNewRestaurantForm({...newRestaurantForm, description: e.target.value})}
                          placeholder={i18n.language === 'ru' ? 'Опишите атмосферу, фирменные блюда и особенности заведения...' : i18n.language === 'ar' ? 'صف الأجواء، الأطباق المميزة وميزات المنشأة...' : i18n.language === 'hy' ? 'Նկարագրեք մթնոլորտը...' : 'Describe atmosphere...'}
                          rows={3}
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          {i18n.language === 'ru' ? 'Ссылка на фото (URL)' : i18n.language === 'ar' ? 'رابط الصورة (URL)' : i18n.language === 'hy' ? 'Լուսանկարի հղում (URL)' : 'Photo Link (URL)'}
                        </label>
                        <input 
                          type="text" 
                          value={newRestaurantForm.image}
                          onChange={e => setNewRestaurantForm({...newRestaurantForm, image: e.target.value})}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                        <button 
                          type="button" 
                          onClick={() => setShowRegisterRestaurantModal(false)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          {i18n.language === 'ru' ? 'Отмена' : i18n.language === 'ar' ? 'إلغاء' : i18n.language === 'hy' ? 'Չեղարկել' : 'Cancel'}
                        </button>
                        <button 
                          type="submit" 
                          disabled={registeringRestaurant}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black rounded-xl text-xs font-black transition cursor-pointer shadow-lg shadow-teal-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {registeringRestaurant 
                            ? (i18n.language === 'ru' ? 'Создаём…' : i18n.language === 'ar' ? 'جاري الإنشاء...' : i18n.language === 'hy' ? 'Ստեղծվում է...' : 'Creating...') 
                            : (i18n.language === 'ru' ? 'Создать ресторан' : i18n.language === 'ar' ? 'إنشاء مطعم' : i18n.language === 'hy' ? 'Ստեղծել ռեստորան' : 'Create Restaurant')}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Google Calendar Sync Confirmation Modal */}
            <AnimatePresence>
              {showSyncConfirmModal && pendingSyncBooking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#16191F] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-left"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                          <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-base text-white">
                            {i18n.language === 'ru' ? 'Синхронизация с Google Календарём' : i18n.language === 'ar' ? 'مزامنة مع تقويم Google' : i18n.language === 'hy' ? 'Սինխրոնացում Google Օրացույցի հետ' : 'Google Calendar Sync'}
                          </h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                            OAuth 2.0 Integration
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setShowSyncConfirmModal(false);
                          setPendingSyncBooking(null);
                        }}
                        className="p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4 relative text-sm text-white/80">
                      <p className="text-xs text-white/60">
                        {i18n.language === 'ru' ? 'Вы собираетесь добавить следующее событие в ваш основной Google Календарь:' : i18n.language === 'ar' ? 'أنت على وشك إضافة الحدث التالي إلى تقويم Google الرئيسي الخاص بك:' : i18n.language === 'hy' ? 'Դուք պատրաստվում եք ավելացնել հետևյալ իրադարձությունը Ձեր հիմնական Google Օրացույցին՝' : 'You are about to add the following event to your main Google Calendar:'}
                      </p>

                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-white/[0.02]">
                          <span className="text-white/50">
                            {i18n.language === 'ru' ? 'Название:' : i18n.language === 'ar' ? 'الاسم:' : i18n.language === 'hy' ? 'Անվանում՝' : 'Name:'}
                          </span>
                          <span className="font-semibold text-white">
                            {pendingSyncBooking.type === "table" 
                              ? (i18n.language === 'ru' ? `🍽️ Бронь столика #${pendingSyncBooking.tableNumber} в ресторан` : i18n.language === 'ar' ? `🍽️ حجز طاولة #${pendingSyncBooking.tableNumber} في مطعم` : i18n.language === 'hy' ? `🍽️ Սեղանի ամրագրում #${pendingSyncBooking.tableNumber} ռեստորանում` : `🍽️ Table #${pendingSyncBooking.tableNumber} Restaurant Booking`)
                              : `🌸 ${pendingSyncBooking.serviceName}`}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/[0.02]">
                          <span className="text-white/50">
                            {i18n.language === 'ru' ? 'Дата и время:' : i18n.language === 'ar' ? 'التاريخ والوقت:' : i18n.language === 'hy' ? 'Ամսաթիվ և ժամ՝' : 'Date & time:'}
                          </span>
                          <span className="font-semibold text-white">
                            {pendingSyncBooking.date} {i18n.language === 'ru' ? 'в' : i18n.language === 'ar' ? 'في' : i18n.language === 'hy' ? 'ժամը' : 'at'} {pendingSyncBooking.time}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/[0.02]">
                          <span className="text-white/50">
                            {i18n.language === 'ru' ? 'Место:' : i18n.language === 'ar' ? 'الموقع:' : i18n.language === 'hy' ? 'Վայր՝' : 'Location:'}
                          </span>
                          <span className="font-semibold text-white">
                            {pendingSyncBooking.type === "table"
                              ? (i18n.language === 'ru' ? 'Ресторан OmniReserve, ул. Лесная, д. 5, стр. 2' : i18n.language === 'ar' ? 'مطعم OmniReserve، شارع ليسنايا، مبنى 5' : i18n.language === 'hy' ? 'OmniReserve ռեստորան, Լեսնայա փող., տ. 5, շին. 2' : 'OmniReserve Restaurant, 5 Lesnaya St.')
                              : (i18n.language === 'ru' ? 'Lotus Spa, ул. Лесная, д. 5, стр. 2' : i18n.language === 'ar' ? 'لوتس سبا، شارع ليسنايا، مبنى 5' : i18n.language === 'hy' ? 'Lotus Spa, Լեսնայա փող., տ. 5, շին. 2' : 'Lotus Spa, 5 Lesnaya St.')}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-white/50">
                            {i18n.language === 'ru' ? 'Напоминания:' : i18n.language === 'ar' ? 'التذكيرات:' : i18n.language === 'hy' ? 'Հիշեցումներ՝' : 'Reminders:'}
                          </span>
                          <span className="font-semibold text-teal-400">
                            {i18n.language === 'ru' ? 'Всплывающее (30 мин) & Email (2 ч)' : i18n.language === 'ar' ? 'منبثق (30 دقيقة) وبريد إلكتروني (ساعتان)' : i18n.language === 'hy' ? 'Ծագող պատուհան (30 րոպե) և Էլ. փոստ (2 ժ)' : 'Popup (30 min) & Email (2 hours)'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3 justify-end">
                        <button
                          onClick={() => {
                            setShowSyncConfirmModal(false);
                            setPendingSyncBooking(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          {i18n.language === 'ru' ? 'Отмена' : i18n.language === 'ar' ? 'إلغاء' : i18n.language === 'hy' ? 'Չեղարկել' : 'Cancel'}
                        </button>
                        <button
                          onClick={confirmSyncBooking}
                          disabled={isCalendarLoading}
                          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isCalendarLoading ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <span>
                              {i18n.language === 'ru' ? 'Подтвердить запись' : i18n.language === 'ar' ? 'تأكيد الحجز' : i18n.language === 'hy' ? 'Հաստատել գրանցումը' : 'Confirm reservation'}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Floating Upcoming Booking Alerts Toast Center */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-4 max-w-sm w-full pointer-events-none">
              <AnimatePresence>
                {upcomingAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    className="bg-[#16191F]/95 backdrop-blur-md border-2 border-amber-500/30 rounded-2xl p-4 shadow-2xl pointer-events-auto relative overflow-hidden"
                  >
                    {/* Pulsing state ring */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                        {i18n.language === 'ru' ? 'Через 2 часа' : i18n.language === 'ar' ? 'خلال ساعتين' : i18n.language === 'hy' ? '2 ժամից' : 'In 2 hours'}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl mt-0.5">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 pr-14 text-left">
                        <h5 className="font-display font-black text-xs text-white leading-tight">
                          {alert.title}
                        </h5>
                        <p className="text-[11px] text-white/70 leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                    </div>

                    {/* How to get there details section */}
                    <div className="mt-3 p-2.5 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5 text-left">
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>
                          {i18n.language === 'ru' ? 'Адрес назначения' : i18n.language === 'ar' ? 'عنوان الوجهة' : i18n.language === 'hy' ? 'Նպատակակետի հասցե' : 'Destination Address'}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-white leading-snug">
                        {alert.address}
                      </p>
                      <div className="flex items-start gap-1.5 text-[10px] text-white/40 pt-1.5 border-t border-white/[0.03]">
                        <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <strong>{i18n.language === 'ru' ? 'Как добраться:' : i18n.language === 'ar' ? 'كيفية الوصول:' : i18n.language === 'hy' ? 'Ինչպես հասնել՝' : 'How to get there:'}</strong> {alert.directions}
                        </span>
                      </div>
                    </div>

                    {/* Footer bar with Booking ID and close button */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-white/30 uppercase">
                        {i18n.language === 'ru' ? 'ID брони:' : i18n.language === 'ar' ? 'معرّف الحجز:' : i18n.language === 'hy' ? 'Ամրագրման ID:' : 'Booking ID:'} <strong className="text-white/60">{alert.bookingId}</strong>
                      </span>
                      <button
                        onClick={() => {
                          setUpcomingAlerts(prev => prev.filter(a => a.id !== alert.id));
                        }}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-bold transition cursor-pointer"
                      >
                        {i18n.language === 'ru' ? 'Понятно' : i18n.language === 'ar' ? 'مفهوم' : i18n.language === 'hy' ? 'Հասկանալի է' : 'Got it'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Sticky subtle footer with bottom padding to account for sticky bottom dock */}
            <footer className="bg-[#0F1115] border-t border-white/5 py-8 text-center text-xs text-white/40 mt-12 pb-28" id="main-footer">
              <div className="max-w-7xl mx-auto px-4">
                <p>
                  {i18n.language === 'ru' ? '© 2026 OmniReserve Booking Superapp. Объединенная клиентская база Bookly & Tabletop.' : i18n.language === 'ar' ? '© 2026 OmniReserve Booking Superapp. قاعدة عملاء موحدة لـ Bookly & Tabletop.' : i18n.language === 'hy' ? '© 2026 OmniReserve Booking Superapp: Bookly և Tabletop հաճախորդների միասնական բազա:' : '© 2026 OmniReserve Booking Superapp. Unified Bookly & Tabletop client base.'}
                </p>
                <p className="mt-1 font-mono text-[10px] text-white/20">SYSTEM TIME: 2026-07-10 | CLIENT: {user.name}</p>
              </div>
            </footer>

            {/* Elegant Sticky/Floating Bottom Navigation Dock */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#090A0D]/90 backdrop-blur-xl border-t border-white/5 py-3 px-4 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] pb-safe">
              <div className="max-w-2xl mx-auto flex items-center justify-around gap-2">
                {[
                  { id: 'ai-assistant' as const, label: i18n.language === 'ru' ? 'ИИ-Консьерж' : i18n.language === 'ar' ? 'المساعد الذكي' : i18n.language === 'hy' ? 'ԱԻ օգնական' : 'AI Assistant', icon: Sparkles },
                  { id: 'dashboard' as const, label: i18n.language === 'ru' ? 'Панель' : i18n.language === 'ar' ? 'لوحة التحكم' : i18n.language === 'hy' ? 'Կառավարման վահանակ' : 'Dashboard', icon: Grid },
                  { id: 'analytics' as const, label: i18n.language === 'ru' ? 'Аналитика' : i18n.language === 'ar' ? 'التحлиلات' : i18n.language === 'hy' ? 'Վերլուծություն' : 'Analytics', icon: TrendingUp },
                  { id: 'tabletop' as const, label: i18n.language === 'ru' ? 'Столики' : i18n.language === 'ar' ? 'حجز الطاولات' : i18n.language === 'hy' ? 'Սեղաններ' : 'Tabletop', icon: Utensils },
                  { id: 'bookly' as const, label: i18n.language === 'ru' ? 'Услуги' : i18n.language === 'ar' ? 'حجز الخدمات' : i18n.language === 'hy' ? 'Ծառայություններ' : 'Bookly', icon: Calendar },
                  { id: 'stays' as const, label: i18n.language === 'ru' ? 'Отели' : i18n.language === 'ar' ? 'الفنادق' : i18n.language === 'hy' ? 'Հյուրանոցներ' : 'Stays', icon: HotelIcon },
                  { id: 'invest' as const, label: i18n.language === 'ru' ? 'Инвестиции' : i18n.language === 'ar' ? 'استثمر' : i18n.language === 'hy' ? 'Ներդրում' : 'Invest & Back', icon: Coins },
                  { id: 'rbac' as const, label: i18n.language === 'ru' ? 'Доступ' : i18n.language === 'ar' ? 'الإدارة' : i18n.language === 'hy' ? 'Հասանելիություն' : 'RBAC', icon: Sliders },
                ].filter(item => item.id !== 'rbac' || (user && user.role !== 'client')).map((item) => {
                  const isActive = activeModule === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveModule(item.id)}
                      className={`flex flex-col items-center gap-1 py-1 px-3.5 rounded-xl transition-all duration-300 relative cursor-pointer group ${
                        isActive
                          ? "text-teal-400"
                          : "text-white/40 hover:text-white/80"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeTabGlow"
                          className="absolute -top-[13px] w-12 h-[3px] bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full shadow-[0_0_10px_#2dd4bf]"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      
                      <div className={`p-1.5 rounded-xl transition-transform duration-300 ${
                        isActive ? "scale-110 text-teal-400 bg-teal-500/10" : "group-hover:scale-105"
                      }`}>
                        <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                      </div>
                      
                      <span className={`text-[10px] font-medium tracking-tight transition-colors ${
                        isActive ? "font-bold text-white" : "font-semibold text-white/50"
                      }`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Floating OmniConcierge AI Chatbot (Moved slightly higher to avoid overlapping bottom bar) */}
            <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-3">
              <AnimatePresence>
                {isAIChatOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="shadow-2xl"
                  >
                    <AIConcierge 
                      user={user}
                      restaurants={restaurants}
                      services={services}
                      bookings={bookings}
                      isFloating={true}
                      onClose={() => setIsAIChatOpen(false)}
                      onBookingSuccess={(newBooking, priceCharged, type, successMsg) => {
                        // Deduct deposit/charge from user balance
                        setUser(prevUser => prevUser ? { ...prevUser, balance: prevUser.balance - priceCharged } : null);
                        
                        // Add new booking to bookings lists
                        setBookings(prev => [newBooking, ...prev]);
                        
                        // Set success feedback banner
                        setBookingSuccessMsg(successMsg);
                        
                        // Refresh recommendations
                        if (typeof loadAIRecommendations === 'function') {
                          loadAIRecommendations(user.id);
                        }
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Floating trigger button */}
              <motion.button
                onClick={() => setIsAIChatOpen(!isAIChatOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl cursor-pointer transition-colors duration-300 ${
                  isAIChatOpen 
                    ? "bg-[#1E2230] text-teal-400 border border-teal-500/20" 
                    : "bg-gradient-to-tr from-teal-500 to-emerald-400 text-black shadow-teal-500/20"
                }`}
                title={i18n.language === 'ru' ? 'Чат с OmniConcierge' : i18n.language === 'hy' ? 'Չաթ OmniConcierge-ի հետ' : 'Chat with OmniConcierge'}
              >
                {isAIChatOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <div className="relative">
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                )}
              </motion.button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Inline Sub-helper components
function TagCategory({ category }: { category: string }) {
  let colorClass = "bg-white/5 text-white/60 border-white/10";
  if (category === "Spa & Wellness") {
    colorClass = "bg-purple-500/10 text-purple-400 border-purple-500/20";
  } else if (category === "Fitness & Active") {
    colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
  } else if (category === "Beauty & Style") {
    colorClass = "bg-rose-500/10 text-rose-400 border-rose-500/20";
  }
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
      {category}
    </span>
  );
}
