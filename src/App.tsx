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
  MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from "recharts";
import { User as UserType, Table, Service, Booking, AIRecommendation, TableBooking, ServiceBooking, StaffMember, Restaurant, Salon } from "./types";
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
import AIConcierge from "./components/AIConcierge";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import Tabletop3DViewer from "./components/Tabletop3DViewer";
import RestaurantReviews from "./components/RestaurantReviews";
import WeatherWidget, { WeatherId, weatherPresets } from "./components/WeatherWidget";
import { 
  initCalendarAuth, 
  googleCalendarSignIn, 
  googleCalendarSignOut, 
  addBookingToGoogleCalendar, 
  fetchGoogleCalendarEvents, 
  deleteGoogleCalendarEvent, 
  CalendarEvent 
} from "./lib/googleCalendar";
import { RefreshCw, Trash2, CalendarDays, Link2, ZoomIn, ZoomOut } from "lucide-react";

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
  const [activeModule, setActiveModule] = useState<'dashboard' | 'tabletop' | 'bookly' | 'rbac' | 'ai-assistant'>('ai-assistant');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
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
          toast.error(i18n.language === 'ru' ? "Вы можете бронировать столы только в одной зоне за раз." : "You can only book tables in the same room zone at once.");
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
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    // Default to July 2026 since mock data has dates in July 2026, or current month if it is already July 2026
    const now = new Date();
    if (now.getFullYear() === 2026 && now.getMonth() === 6) {
      return now;
    }
    return new Date(2026, 6, 1);
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

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

  // Periodic check (every 10 seconds) for 2 hours upcoming bookings
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

  // Memoized 30-day analytics dataset for Recharts
  const bookingOverviewData = React.useMemo(() => {
    const data = [];
    const baseDate = new Date(2026, 6, 11); // Current date: July 11, 2026

    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const displayDate = d.toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US', { day: "numeric", month: "short" });

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

  // Helper to generate the monthly calendar grid
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    // Day of the week of the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    // Adjust so that Monday is 0, Sunday is 6
    const startOffset = (firstDayOfWeek + 6) % 7;

    // Number of days in the current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Number of days in the previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month's padding days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dayNumber: d,
        date: prevDate,
        isCurrentMonth: false,
        dateString: `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`
      });
    }

    // Current month's days
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(year, month, d);
      days.push({
        dayNumber: d,
        date: currDate,
        isCurrentMonth: true,
        dateString: `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, "0")}-${String(currDate.getDate()).padStart(2, "0")}`
      });
    }

    // Next month's padding days to fill 6 rows (42 cells) or 5 rows (35 cells)
    const totalCells = days.length <= 35 ? 35 : 42;
    const remainingCells = totalCells - days.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextDate = new Date(year, month + 1, d);
      days.push({
        dayNumber: d,
        date: nextDate,
        isCurrentMonth: false,
        dateString: `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(nextDate.getDate()).padStart(2, "0")}`
      });
    }

    return days;
  };

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
          i18n.language === 'ru'
            ? `Успешно забронировано! Столы: ${tableNumbersString} на ${tabletopDate} в ${tabletopTime}.`
            : `Success! Tables ${tableNumbersString} booked for ${tabletopDate} at ${tabletopTime}.`
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
      `${i18n.language === 'ru' ? 'Номера столов' : 'Table Numbers'}: ${tableNumbersText}`,
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
            <header className="bg-[#090A0D] border-b border-white/5 sticky top-0 z-30 shadow-md" id="main-header">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  
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
                                          {new Date(n.createdAt).toLocaleTimeString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
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
            </header>

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
                                {spending.total.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')} ₽
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
                                        title={`${t('dashboard.diningLabel')}: ${spending.diningTotal.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')} ₽`} 
                                      />
                                    )}
                                    {spending.wellnessTotal > 0 && (
                                      <div 
                                        style={{ width: `${spending.wellnessPercent}%` }} 
                                        className="bg-gradient-to-r from-teal-500 to-teal-400 h-full first:rounded-l-full last:rounded-r-full transition-all duration-500" 
                                        title={`${t('dashboard.wellnessLabel')}: ${spending.wellnessTotal.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')} ₽`} 
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
                                  <span className="text-xs font-bold text-white font-mono">{spending.diningTotal.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')} ₽</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-white/40 block font-mono">WELLNESS</span>
                                  <span className="text-xs font-bold text-white font-mono">{spending.wellnessTotal.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')} ₽</span>
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
                                      const dateFormatted = startRaw ? new Date(startRaw).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US', {
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
                                      <span className="text-sm font-bold text-white font-mono">{booking.price.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')} ₽</span>
                                    </div>
                                    
                                    <button 
                                      onClick={() => triggerUpcomingBookingAlert(booking, true)}
                                      className="p-2 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/20 text-amber-400 rounded-xl transition animate-hover"
                                      title={t('dashboard.reminderTooltip')}
                                    >
                                      <Bell className="w-4 h-4" />
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
                                      <button 
                                        onClick={() => {
                                          if (syncedBookingIds[booking.id]) {
                                            handleUnsyncBooking(booking);
                                          } else {
                                            triggerSyncBooking(booking);
                                          }
                                        }}
                                        className={`p-2 border rounded-xl transition animate-hover ${
                                          syncedBookingIds[booking.id]
                                            ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/20 text-emerald-400' 
                                            : 'border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/20 text-blue-400'
                                        }`}
                                        title={syncedBookingIds[booking.id] ? t('dashboard.gcalConnectedTooltip') : t('dashboard.gcalNotConnectedTooltip')}
                                      >
                                        <Calendar className="w-4 h-4" />
                                      </button>
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
                      /* Calendar view container */
                      <div className="p-4 sm:p-6 space-y-6 bg-[#16191F]">
                        {/* Month navigation and details */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                const prev = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
                                setCalendarMonth(prev);
                                setSelectedCalendarDay(null);
                              }}
                              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/60 transition cursor-pointer"
                              title={t('dashboard.prevMonthTooltip')}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-display font-bold text-sm text-white capitalize min-w-[120px] text-center">
                              {calendarMonth.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US', { month: 'long', year: 'numeric' })}
                            </span>
                            <button 
                              onClick={() => {
                                const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
                                setCalendarMonth(next);
                                setSelectedCalendarDay(null);
                              }}
                              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/60 transition cursor-pointer"
                              title={t('dashboard.nextMonthTooltip')}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-[10px] font-mono text-white/40 text-left sm:text-right">
                            {t('dashboard.calendarCellHint')}
                          </span>
                        </div>

                        {/* Weekday Labels */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-wider">
                          {(i18n.language === 'ru' 
                            ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] 
                            : i18n.language === 'ar' 
                              ? ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'] 
                              : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
                          ).map(day => (
                            <div key={day} className="py-2">{day}</div>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                          {getCalendarDays().map((cell, idx) => {
                            const cellBookings = bookings.filter(b => b.date === cell.dateString);
                            const hasBookings = cellBookings.length > 0;
                            const isSelected = selectedCalendarDay === cell.dateString;
                            const isToday = cell.dateString === new Date().toISOString().split('T')[0];

                            // Check types of bookings on this day for color code styling
                            const hasTable = cellBookings.some(b => b.type === 'table');
                            const hasService = cellBookings.some(b => b.type === 'service');

                            return (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSelectedCalendarDay(isSelected ? null : cell.dateString);
                                }}
                                className={`min-h-[70px] sm:min-h-[90px] p-2 rounded-xl border text-left flex flex-col justify-between transition relative overflow-hidden group cursor-pointer ${
                                  !cell.isCurrentMonth 
                                    ? 'bg-[#0F1115]/30 border-white/[0.02] text-white/10' 
                                    : isSelected
                                      ? 'bg-teal-500/10 border-teal-500 text-white shadow-lg shadow-teal-500/5'
                                      : hasBookings
                                        ? 'bg-white/[0.02] border-white/10 hover:border-white/20 text-white'
                                        : 'bg-white/[0.01] border-white/5 hover:border-white/10 text-white/70'
                                } ${isToday ? 'ring-1 ring-teal-400/30' : ''}`}
                              >
                                {/* Date Number */}
                                <div className="flex items-center justify-between w-full">
                                  <span className={`text-[11px] font-mono font-bold ${
                                    isToday 
                                      ? 'bg-teal-500 text-black w-5 h-5 rounded-full flex items-center justify-center font-extrabold shadow-sm' 
                                      : !cell.isCurrentMonth
                                        ? 'text-white/20'
                                        : 'text-white/80'
                                  }`}>
                                    {cell.dayNumber}
                                  </span>

                                  {/* Dots or Mini Indicators for Mobile / Compact View */}
                                  <div className="flex gap-1">
                                    {hasTable && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
                                    {hasService && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />}
                                  </div>
                                </div>

                                {/* Booking Labels inside cells (Desktop/Wide screens) */}
                                <div className="hidden sm:flex flex-col gap-1 mt-1.5 w-full overflow-hidden">
                                  {cellBookings.slice(0, 2).map((b) => {
                                    const bTable = b.type === 'table';
                                    return (
                                      <div 
                                        key={b.id} 
                                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md truncate border text-left ${
                                          bTable 
                                            ? 'bg-orange-500/10 text-orange-300 border-orange-500/20' 
                                            : 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                                        }`}
                                        title={bTable ? t('tabletop.tableNumber', { n: b.tableNumber }) : b.serviceName}
                                      >
                                        <span className="mr-0.5">{bTable ? '🍽️' : '🌸'}</span>
                                        {bTable ? t('tabletop.tableNumber', { n: b.tableNumber }) : b.serviceName}
                                      </div>
                                    );
                                  })}
                                  {cellBookings.length > 2 && (
                                    <div className="text-[8px] text-white/40 font-mono pl-1">
                                      {t('dashboard.moreBookingsCount', { count: cellBookings.length - 2 })}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Selected day details panel */}
                        <AnimatePresence mode="wait">
                          {selectedCalendarDay && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="mt-6 p-4 rounded-2xl bg-[#0F1115] border border-white/5 space-y-4"
                            >
                              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                                <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-teal-400" />
                                  <span>{t('dashboard.calendarDayDetailsTitle', { date: new Date(selectedCalendarDay).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) })}</span>
                                </h4>
                                <button 
                                  onClick={() => setSelectedCalendarDay(null)}
                                  className="text-white/40 hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {bookings.filter(b => b.date === selectedCalendarDay).length === 0 ? (
                                <p className="text-center py-6 text-xs text-white/40">{t('dashboard.noBookingsOnDay')}</p>
                              ) : (
                                <div className="space-y-3">
                                  {bookings.filter(b => b.date === selectedCalendarDay).map((booking) => {
                                    const isTable = booking.type === "table";
                                    return (
                                      <div 
                                        key={booking.id} 
                                        className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left"
                                      >
                                        <div className="flex items-start gap-3">
                                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base shrink-0 border ${
                                            isTable 
                                              ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                                              : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                          }`}>
                                            {isTable ? "🍽️" : "🌸"}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-semibold text-xs text-white">
                                                {isTable ? `Столик #${booking.tableNumber} в ${(booking as any).restaurantName || 'Grand Atelier'}` : booking.serviceName}
                                              </span>
                                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                                                isTable 
                                                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' 
                                                  : 'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                                              }`}>
                                                {isTable ? "Tabletop" : "Bookly"}
                                              </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-x-3 mt-1 text-[11px] text-white/40">
                                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {booking.time}</span>
                                              {isTable ? (
                                                <>
                                                  <span>{t('dashboard.roomLabel', { room: booking.room === 'main' ? t('dashboard.roomMain') : booking.room === 'vip' ? t('dashboard.roomVip') : t('dashboard.roomTerrace') })}</span>
                                                  <span>{t('dashboard.guestsCount', { count: booking.guests })}</span>
                                                </>
                                              ) : (
                                                <>
                                                  <span>{t('dashboard.specialistName', { name: booking.staffName })}</span>
                                                  <TagCategory category={booking.category} />
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5 font-mono">
                                          <div className="text-left sm:text-right">
                                            <span className="text-[9px] text-white/30 block">{t('dashboard.costLabel')}</span>
                                            <span className="text-xs font-bold text-white">{booking.price.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')} ₽</span>
                                          </div>

                                          <button 
                                            onClick={() => {
                                              if (confirm(t('dashboard.cancelBookingConfirm'))) {
                                                setUser({ ...user, balance: user.balance + booking.price });
                                                setBookings(bookings.filter(b => b.id !== booking.id));
                                                setBookingSuccessMsg(t('dashboard.cancelBookingSuccess'));
                                                // If that was the last booking on this day, collapse panel
                                                const remainingOnDay = bookings.filter(b => b.id !== booking.id && b.date === selectedCalendarDay);
                                                if (remainingOnDay.length === 0) {
                                                  setSelectedCalendarDay(null);
                                                }
                                              }
                                            }}
                                            className="p-1.5 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-white/40 transition cursor-pointer"
                                            title={t('dashboard.cancelBookingTooltip')}
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
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
                        <h3 className="font-display font-black text-lg text-white leading-none">
                          {selectedRestaurant.name}
                        </h3>
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
                              {i18n.language === 'ru' ? 'Интерактивная 2D/3D схема столов' : i18n.language === 'ar' ? 'مخطط الطاولات التفاعلي ثنائي/ثلاثي الأبعاد' : 'Interactive 2D/3D Table Map'}
                            </h3>
                            <p className="text-xs text-white/60">
                              {i18n.language === 'ru' ? 'Выберите нужную зону, рассмотрите расположение столов и кликните на свободный, чтобы забронировать его.' : i18n.language === 'ar' ? 'اختر المنطقة المطلوبة، واعرض موقع الطاولات وانقر على الطاولة الشاغرة لحجزها.' : 'Choose the desired area, view the table layout, and click on an available table to book it.'}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3">
                            {/* Search Input Field */}
                            <div className="relative">
                              <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder={i18n.language === 'ru' ? 'Поиск стола по №...' : i18n.language === 'ar' ? 'البحث عن طاولة برقم...' : 'Search table by #...'}
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
                                onClick={() => { setSelectedRoom('main'); setSelectedTable(null); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedRoom === 'main' ? 'bg-white/10 text-white shadow-xs' : 'text-white/40 hover:text-white'}`}
                              >
                                {selectedRestaurant.rooms.main}
                              </button>
                              <button 
                                type="button"
                                onClick={() => { setSelectedRoom('vip'); setSelectedTable(null); }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${selectedRoom === 'vip' ? 'bg-white/10 text-white shadow-xs' : 'text-white/40 hover:text-white'}`}
                              >
                                {selectedRestaurant.rooms.vip}
                              </button>
                              <button 
                                type="button"
                                onClick={() => { setSelectedRoom('terrace'); setSelectedTable(null); }}
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
                              <Sliders className="w-3.5 h-3.5 text-teal-400" /> {i18n.language === 'ru' ? 'Фильтры:' : i18n.language === 'ar' ? 'الفلاتر:' : 'Filters:'}
                            </span>
                            
                            {/* Party Size Filter */}
                            <select
                              value={partySizeFilter}
                              onChange={(e) => setPartySizeFilter(Number(e.target.value))}
                              className="bg-[#16191F] border border-white/10 text-white/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-500 transition cursor-pointer"
                            >
                              <option value="0">{i18n.language === 'ru' ? 'Любая вместимость' : i18n.language === 'ar' ? 'أي سعة' : 'Any capacity'}</option>
                              <option value="2">{i18n.language === 'ru' ? 'От 2 человек' : i18n.language === 'ar' ? 'من شخصين' : 'From 2 people'}</option>
                              <option value="4">{i18n.language === 'ru' ? 'От 4 человек' : i18n.language === 'ar' ? 'من 4 أشخاص' : 'From 4 people'}</option>
                              <option value="6">{i18n.language === 'ru' ? 'От 6 человек' : i18n.language === 'ar' ? 'من 6 أشخاص' : 'From 6 people'}</option>
                              <option value="8">{i18n.language === 'ru' ? 'От 8 человек' : i18n.language === 'ar' ? 'من 8 أشخاص' : 'From 8 people'}</option>
                            </select>

                            {/* Table Type Filter */}
                            <select
                              value={tableTypeFilter}
                              onChange={(e) => setTableTypeFilter(e.target.value)}
                              className="bg-[#16191F] border border-white/10 text-white/80 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-500 transition cursor-pointer"
                            >
                              <option value="all">{i18n.language === 'ru' ? 'Все типы столов' : i18n.language === 'ar' ? 'جميع أنواع الطاولات' : 'All table types'}</option>
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
                              {i18n.language === 'ru' ? '2D Схема' : i18n.language === 'ar' ? 'مخطط ثنائي الأبعاد' : '2D Layout'}
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
                              {i18n.language === 'ru' ? '3D Зал' : i18n.language === 'ar' ? 'صالة ثلاثية الأبعاد' : '3D Hall'}
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
                                  {i18n.language === 'ru' 
                                    ? `Влияние погоды на террасу (${weatherPresets[currentWeatherId].temp}°C)` 
                                    : i18n.language === 'ar' 
                                      ? `تأثير الطقس على التراس (${weatherPresets[currentWeatherId].temp}°م)` 
                                      : `Weather impact on terrace (${weatherPresets[currentWeatherId].temp}°C)`}
                                </span>
                                <p className="font-medium text-white/90">
                                  {t('weather.recommendation.' + currentWeatherId)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Weather condition switcher inside restaurant view for easier accessibility! */}
                            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-black/40 p-1 rounded-xl border border-white/5 shrink-0">
                              <span className="text-[9px] text-white/40 uppercase font-bold tracking-wide px-2 font-mono">
                                {i18n.language === 'ru' ? 'симулятор:' : i18n.language === 'ar' ? 'المحاكي:' : 'simulator:'}
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
                                {i18n.language === 'ru' ? 'Поиск' : i18n.language === 'ar' ? 'بحث' : 'Search'} <strong className="text-amber-400">"{tableSearchQuery}"</strong>:
                                {matchedTables.length > 0 ? (
                                  <> {i18n.language === 'ru' ? 'найдено' : i18n.language === 'ar' ? 'تم العثور على' : 'found'} <strong className="text-white">{matchedTables.length}</strong> {i18n.language === 'ru' ? (matchedTables.length === 1 ? "столик" : "столика(ов)") : i18n.language === 'ar' ? "طاولة" : "table(s)"}</>
                                ) : (
                                  <> {i18n.language === 'ru' ? 'совпадений в этом зале нет' : i18n.language === 'ar' ? 'لا يوجد تطابق في هذه القاعة' : 'no matches in this hall'}</>
                                )}
                              </span>
                            </div>
                            {matchedTables.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-white/40 text-[10px] uppercase tracking-wider font-semibold">
                                  {i18n.language === 'ru' ? 'Быстрый выбор:' : i18n.language === 'ar' ? 'اختيار سريع:' : 'Quick Select:'}
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
                                {i18n.language === 'ru' ? 'Получаем статус столов...' : i18n.language === 'ar' ? 'جاري جلب حالة الطاولات...' : 'Fetching tables status...'}
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
                                    {i18n.language === 'ru' ? 'ВХОД / РЕСЕПШН' : i18n.language === 'ar' ? 'المدخل / الاستقبال' : 'ENTRANCE / RECEPTION'}
                                  </div>
                                  <div className="absolute bottom-4 left-4 bg-white/5 text-white/50 text-[10px] font-mono py-2 px-3 rounded-xl border border-white/5 uppercase tracking-widest font-bold">
                                    {i18n.language === 'ru' ? 'БАРНАЯ ЗОНА' : i18n.language === 'ar' ? 'منطقة البار' : 'BAR ZONE'}
                                  </div>
                                  <div className="absolute top-1/3 right-0 -translate-y-1/2 w-4 bg-white/5 h-24 rounded-l-md border-y border-l border-white/5 flex items-center justify-center">
                                    <span className="text-[9px] text-white/40 font-mono tracking-widest uppercase rotate-90 origin-center whitespace-nowrap block">
                                      {i18n.language === 'ru' ? 'ПАНОРАМНЫЕ ОКНА' : i18n.language === 'ar' ? 'نوافذ بانورامية' : 'PANORAMIC WINDOWS'}
                                    </span>
                                  </div>
                                </>
                              )}
                              {selectedRoom === 'vip' && (
                                <>
                                  <div className="absolute top-0 left-4 bg-white/5 text-white/50 text-[10px] font-mono py-1 px-4 rounded-b-lg border-b border-x border-white/5 uppercase tracking-widest font-bold">
                                    {i18n.language === 'ru' ? 'КАМИННАЯ ЗОНА' : i18n.language === 'ar' ? 'منطقة المدفأة' : 'FIREPLACE ZONE'}
                                  </div>
                                  <div className="absolute inset-0 border-4 border-white/5 rounded-2xl pointer-events-none" />
                                </>
                              )}
                              {selectedRoom === 'terrace' && (
                                <>
                                  <div className="absolute inset-x-0 bottom-0 bg-teal-500/5 text-teal-400/80 text-[10px] font-mono py-1 text-center border-t border-teal-500/10 uppercase tracking-widest font-bold">
                                    {i18n.language === 'ru' ? 'ЖИВОПИСНАЯ РЕКА & НАБЕРЕЖНАЯ' : i18n.language === 'ar' ? 'نهر خلاب وكورنيش' : 'PICTURESQUE RIVER & WATERFRONT'}
                                  </div>
                                  <div className="absolute top-4 right-4 bg-teal-500/10 text-teal-400 text-[9px] font-mono py-1 px-2.5 rounded-full border border-teal-500/10 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                                    {i18n.language === 'ru' ? 'ОТКРЫТЫЙ ВОЗДУХ' : i18n.language === 'ar' ? 'في الهواء الطلق' : 'OPEN AIR'}
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

                                      return (
                                        <g 
                                          key={t.id} 
                                          className={`${isBooked ? 'cursor-not-allowed' : 'cursor-pointer'} transition group`}
                                          opacity={isTableSearchActive && cleanTableSearchQuery ? (isMatch ? 1 : 0.25) : 1}
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
                                              whileHover={isBooked ? {} : { scale: 1.06, filter: "brightness(1.15)" }}
                                              whileTap={isBooked ? {} : { scale: 0.94 }}
                                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                              style={{ transformOrigin: "center", transformBox: "fill-box" }}
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
                                              style={{ transformOrigin: "center", transformBox: "fill-box" }}
                                            />
                                          )}

                                          {/* Table details labels */}
                                          <text 
                                            x={cx}
                                            y={cy + 4}
                                            textAnchor="middle"
                                            className={`font-display text-xs font-bold pointer-events-none transition ${isMatch ? 'fill-amber-400 font-extrabold text-sm' : isBooked ? 'fill-red-400' : isSelected ? 'fill-black font-extrabold' : 'fill-white/90'}`}
                                          >
                                            #{t.number}
                                          </text>
                                          
                                          <text 
                                            x={cx}
                                            y={cy + 16}
                                            textAnchor="middle"
                                            className={`text-[9px] font-bold pointer-events-none font-mono ${isSelected ? 'fill-black/60' : 'fill-white/40'}`}
                                          >
                                            {t.capacity} {i18n.language === 'ru' ? 'чел' : i18n.language === 'ar' ? 'أشخاص' : 'pax'}
                                          </text>
                                        </g>
                                      );
                                    })}
                                </g>

                                {/* SVG Gradient patterns definitions */}
                                <defs>
                                  <linearGradient id="metal-gradient-available" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#1E222B" />
                                    <stop offset="100%" stopColor="#161920" />
                                  </linearGradient>
                                  <linearGradient id="metal-gradient-selected" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#2DD4BF" />
                                    <stop offset="100%" stopColor="#0D9488" />
                                  </linearGradient>
                                  <linearGradient id="metal-gradient-booked" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#2B161B" />
                                    <stop offset="100%" stopColor="#200F12" />
                                  </linearGradient>
                                </defs>
                              </svg>

                              {/* Zoom / Pan Controls Overlay */}
                              <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                                <div className="bg-black/75 backdrop-blur-md border border-white/10 rounded-xl p-1.5 flex flex-col gap-1.5 shadow-xl">
                                  <button
                                    onClick={() => setZoom(prev => Math.min(prev * 1.2, 4))}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-white hover:text-teal-400 rounded-lg transition cursor-pointer flex items-center justify-center"
                                    title={i18n.language === 'ru' ? 'Приблизить' : i18n.language === 'ar' ? 'تكبير' : 'Zoom In'}
                                  >
                                    <ZoomIn className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.8))}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-white hover:text-teal-400 rounded-lg transition cursor-pointer flex items-center justify-center"
                                    title={i18n.language === 'ru' ? 'Отдалить' : i18n.language === 'ar' ? 'تصغير' : 'Zoom Out'}
                                  >
                                    <ZoomOut className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setZoom(1);
                                      setPan({ x: 0, y: 0 });
                                    }}
                                    className="p-2 bg-white/5 hover:bg-white/10 text-white hover:text-teal-400 rounded-lg transition cursor-pointer flex items-center justify-center"
                                    title={i18n.language === 'ru' ? 'Сбросить' : i18n.language === 'ar' ? 'إعادة تعيين' : 'Reset View'}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Navigation instructions / indicator */}
                              <div className="absolute bottom-4 left-4 pointer-events-none bg-black/60 backdrop-blur-sm border border-white/5 text-[9px] font-mono text-white/50 py-1 px-2.5 rounded-full z-10 flex items-center gap-1.5">
                                <span>
                                  {i18n.language === 'ru' 
                                    ? 'Перетаскивайте для перемещения • Колёсико для масштаба' 
                                    : i18n.language === 'ar' 
                                      ? 'اسحب للتحريك • عجلة الماوس للتكبير' 
                                      : 'Drag to pan • Scroll to zoom'}
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
                          {i18n.language === 'ru' ? 'Кликните на стол для выбора' : i18n.language === 'ar' ? 'انقر على طاولة للاختيار' : 'Click on table to select'}
                        </span>
                      </div>

                    </div>

                    {/* Booking parameters panel Right Columns */}
                    <div className="bg-[#16191F] rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
                      <div className="space-y-6">
                        
                        <div>
                          <h3 className="font-display font-bold text-base text-white mb-1">
                            {i18n.language === 'ru' ? 'Параметры визита' : i18n.language === 'ar' ? 'معايير الزيارة' : 'Visit parameters'}
                          </h3>
                          <p className="text-xs text-white/40">
                            {i18n.language === 'ru' ? 'Установите дату и время посещения для обновления доступности.' : i18n.language === 'ar' ? 'حدد التاريخ ووقت الزيارة لتحديث التوفر.' : 'Set the date and time of the visit to update availability.'}
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
                              {i18n.language === 'ru' ? 'Время прибытия' : i18n.language === 'ar' ? 'وقت الوصول' : 'Arrival time'}
                            </label>
                            <div className="relative">
                              <Clock className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                              <select 
                                value={tabletopTime} 
                                onChange={e => { setTabletopTime(e.target.value); setSelectedTable(null); }}
                                className="w-full pl-10 pr-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:border-teal-500 font-semibold"
                              >
                                <option value="12:00">12:00 ({i18n.language === 'ru' ? 'Обед' : i18n.language === 'ar' ? 'الغداء' : 'Lunch'})</option>
                                <option value="13:30">13:30 ({i18n.language === 'ru' ? 'Обед' : i18n.language === 'ar' ? 'الغداء' : 'Lunch'})</option>
                                <option value="15:00">15:00 ({i18n.language === 'ru' ? 'День' : i18n.language === 'ar' ? 'بعد الظهر' : 'Afternoon'})</option>
                                <option value="17:00">17:00 ({i18n.language === 'ru' ? 'Ранний ужин' : i18n.language === 'ar' ? 'عشاء مبكر' : 'Early dinner'})</option>
                                <option value="18:30">18:30 ({i18n.language === 'ru' ? '🔥 Премиум / Высокий спрос' : i18n.language === 'ar' ? '🔥 مميز / طلب مرتفع' : '🔥 Premium / High Demand'})</option>
                                <option value="19:00">19:00 ({i18n.language === 'ru' ? '🔥 Премиум / Высокий спрос' : i18n.language === 'ar' ? '🔥 مميز / طلب مرتفع' : '🔥 Premium / High Demand'})</option>
                                <option value="20:30">20:30 ({i18n.language === 'ru' ? '🔥 Премиум / Высокий спрос' : i18n.language === 'ar' ? '🔥 مميز / طلب مرتفع' : '🔥 Premium / High Demand'})</option>
                                <option value="22:00">22:00 ({i18n.language === 'ru' ? 'Ночь' : i18n.language === 'ar' ? 'مساءً' : 'Night'})</option>
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
                                    ? (i18n.language === 'ru' ? 'ВЫБРАННЫЙ СТОЛИК' : i18n.language === 'ar' ? 'الطاولة المحددة' : 'SELECTED TABLE')
                                    : (i18n.language === 'ru' ? 'ВЫБРАННЫЙ ПАКЕТ СТОЛОВ' : i18n.language === 'ar' ? 'مجموعة الطاولات المحددة' : 'SELECTED TABLES PACKAGE')
                                  }
                                </span>
                                <span className="font-display font-bold text-lg text-white block">
                                  {selectedTables.length === 1 
                                    ? t('tabletop.tableNumber', { n: selectedTables[0].number })
                                    : `${i18n.language === 'ru' ? 'Столы:' : 'Tables:'} ${selectedTables.map(t => `#${t.number}`).join(', ')}`
                                  }
                                </span>
                                {holdTimer !== null && (
                                  <span className="inline-flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/15 border border-amber-500/20 px-2 py-0.5 rounded-lg animate-pulse">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    {i18n.language === 'ru' ? 'Удержание:' : i18n.language === 'ar' ? 'حجز مؤقت:' : 'Hold:'} {holdTimer}s
                                  </span>
                                )}
                              </div>
                              <span className="text-xs px-2.5 py-1 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded-lg font-bold font-mono">
                                {totalSelectedPrice} ₽ {i18n.language === 'ru' ? 'депо' : i18n.language === 'ar' ? 'تأمين' : 'deposit'}
                              </span>
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
                                  {i18n.language === 'ru' ? 'ОБЩАЯ ВМЕСТИМОСТЬ' : i18n.language === 'ar' ? 'إجمالي السعة' : 'TOTAL CAPACITY'}
                                </span>
                                <span className="font-semibold text-white/80">
                                  {i18n.language === 'ru' ? `до ${totalSelectedCapacity} человек` : i18n.language === 'ar' ? `حتى ${totalSelectedCapacity} أشخاص` : `up to ${totalSelectedCapacity} people`}
                                </span>
                              </div>
                              <div>
                                <span className="text-white/40 block text-[10px] uppercase">
                                  {i18n.language === 'ru' ? 'ЗОНА ЗАЛА' : i18n.language === 'ar' ? 'منطقة القاعة' : 'HALL ZONE'}
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
                                    {i18n.language === 'ru' ? 'Недостаточно мест!' : 'Over capacity!'}
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
                                    {guestsCount} {i18n.language === 'ru' ? 'чел.' : 'guests'}
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
                                placeholder={i18n.language === 'ru' ? 'Например: день рождения жены, нужен детский стул, тихая зона...' : i18n.language === 'ar' ? 'مثال: عيد ميلاد زوجتي، بحاجة لكرسي أطفال، منطقة هادئة...' : 'For example: wife\'s birthday, need high chair, quiet area...'}
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
                                    {i18n.language === 'ru' ? 'Высокий спрос (Премиум-слот)' : i18n.language === 'ar' ? 'طلب مرتفع (فترة مميزة)' : 'High Demand (Premium slot)'}
                                  </div>
                                  <div className="text-amber-300/80 leading-normal">
                                    {i18n.language === 'ru' ? 'В это время наблюдается максимальная нагрузка. К стандартному тарифу стола добавлена наценка +25%.' : i18n.language === 'ar' ? 'يوجد حد أقصى للطلب في هذا الوقت. تمت إضافة رسوم إضافية بنسبة +25% على السعر القياسي للطاولة.' : 'Peak hours load. A +25% surcharge is added to the standard table rate.'}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Price analysis and payment */}
                            <div className="pt-3 border-t border-teal-500/10 flex items-center justify-between text-xs">
                              <span className="text-white/40">{i18n.language === 'ru' ? 'Сумма депозита:' : i18n.language === 'ar' ? 'مبلغ التأمين:' : 'Deposit amount:'}</span>
                              <span className="font-bold text-white font-mono text-base">{totalSelectedPrice.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')} ₽</span>
                            </div>

                            {user.balance < totalSelectedPrice ? (
                              <div className="p-2.5 bg-red-500/10 rounded-xl text-[11px] text-red-400 border border-red-500/20">
                                {i18n.language === 'ru' ? 'Недостаточно средств на балансе. Пожалуйста, пополните баланс в шапке профиля (+).' : i18n.language === 'ar' ? 'الرصيد غير كافٍ. يرجى إعادة شحن رصيدك من القائمة العلوية (+).' : 'Insufficient balance. Please top up your balance from the header (+).'}
                              </div>
                            ) : null}

                          </motion.div>
                        ) : (
                          <div className="p-8 bg-white/[0.01] rounded-2xl border border-dashed border-white/10 text-center text-xs text-white/40">
                            {i18n.language === 'ru' ? 'Выберите один или несколько свободных столиков на схеме слева, чтобы начать оформление заказа.' : i18n.language === 'ar' ? 'اختر أي طاولة شاغرة من المخطط على اليسار لبدء الحجز.' : 'Select one or more available tables on the layout on the left to start booking.'}
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
                            ? (i18n.language === 'ru' ? 'Обработка...' : i18n.language === 'ar' ? 'جاري المعالجة...' : 'Processing...') 
                            : (selectedTables.length > 1
                              ? (i18n.language === 'ru' ? `Забронировать пакет (${selectedTables.length} стола)` : `Book package (${selectedTables.length} tables)`)
                              : (i18n.language === 'ru' ? 'Забронировать этот столик' : i18n.language === 'ar' ? 'حجز هذه الطاولة' : 'Book this table'))}
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
                          {i18n.language === 'ru' ? `О заведении ${selectedRestaurant.name}` : i18n.language === 'ar' ? `حول مطعم ${selectedRestaurant.name}` : `About ${selectedRestaurant.name}`}
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
                            {i18n.language === 'ru' ? 'Выберите велнес-салон или бьюти-центр' : i18n.language === 'ar' ? 'اختر صالون عافية أو مركز تجميل' : 'Select a wellness salon or beauty center'}
                          </h3>
                          <p className="text-xs text-white/60">
                            {i18n.language === 'ru' ? 'Подарите себе минуты безупречного ухода. Выберите подходящее заведение или зарегистрируйте собственное!' : i18n.language === 'ar' ? 'امنح نفسك لحظات من العناية المثالية. اختر منشأة مناسبة أو سجل منشأتك الخاصة!' : 'Treat yourself to moments of flawless care. Choose a suitable venue or register your own!'}
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
                                {i18n.language === 'ru' ? 'Открыть услуги' : i18n.language === 'ar' ? 'عرض الخدمات' : 'Open Services'}
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
                            title={i18n.language === 'ru' ? 'Назад к списку салонов' : i18n.language === 'ar' ? 'العودة لقائمة الصالونات' : 'Back to salon list'}
                          >
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <div>
                            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                              {selectedSalon.name}
                            </h3>
                            <p className="text-xs text-white/60">
                              {i18n.language === 'ru' ? 'Категория:' : i18n.language === 'ar' ? 'الفئة:' : 'Category:'} {selectedSalon.category} • {i18n.language === 'ru' ? 'Адрес:' : i18n.language === 'ar' ? 'العنوان:' : 'Address:'} {selectedSalon.address}
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
                              {cat === 'all' ? (i18n.language === 'ru' ? 'Все категории' : i18n.language === 'ar' ? 'جميع الفئات' : 'All categories') : cat}
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
                                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {service.duration} {i18n.language === 'ru' ? 'мин' : i18n.language === 'ar' ? 'دقيقة' : 'min'}</span>
                                          <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {service.staff.length} {i18n.language === 'ru' ? 'специалиста' : i18n.language === 'ar' ? 'أخصائيين' : 'specialists'}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                                      <div className="font-mono text-xs font-bold text-white">
                                        <span className="text-white/40 block text-[9px] font-sans font-semibold uppercase">
                                          {i18n.language === 'ru' ? 'Стоимость' : i18n.language === 'ar' ? 'السعر' : 'Price'}
                                        </span>
                                        {service.price.toLocaleString(i18n.language === 'ar' ? 'ar-EG' : i18n.language === 'ru' ? 'ru-RU' : 'en-US')} ₽
                                      </div>
                                      <button
                                        onClick={() => {
                                          setSelectedService(service);
                                          setSelectedStaff(service.staff[0]);
                                        }}
                                        className="px-3.5 py-1.5 bg-white/5 hover:bg-teal-500 hover:text-black text-white font-bold rounded-lg text-xs transition border border-white/10 hover:border-transparent cursor-pointer animate-hover"
                                      >
                                        {i18n.language === 'ru' ? 'Записаться' : i18n.language === 'ar' ? 'حجز' : 'Book Now'}
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
                                {i18n.language === 'ru' ? 'Детали сеанса' : i18n.language === 'ar' ? 'تفاصيل الجلسة' : 'Session details'}
                              </h3>
                              <p className="text-xs text-white/40">
                                {i18n.language === 'ru' ? 'Выберите мастера, дату и желаемое время для сеанса.' : i18n.language === 'ar' ? 'اختر المعالج والتاريخ والوقت المطلوب للجلسة.' : 'Select a specialist, date, and preferred time for the session.'}
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
                                    <span className="text-[10px] font-mono text-white/40 block mt-0.5">{selectedService.duration} {i18n.language === 'ru' ? 'мин' : i18n.language === 'ar' ? 'دقيقة' : 'min'} • {selectedService.price} ₽</span>
                                  </div>
                                </div>

                                {/* Specialist selector */}
                                <div>
                                  <label className="block text-xs font-semibold text-white/60 mb-1.5">
                                    {i18n.language === 'ru' ? 'Выберите специалиста' : i18n.language === 'ar' ? 'اختر الأخصائي' : 'Select specialist'}
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
                                    {i18n.language === 'ru' ? 'Дата сеанса' : i18n.language === 'ar' ? 'تاريخ الجلسة' : 'Session date'}
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
                                    {i18n.language === 'ru' ? 'Доступное время' : i18n.language === 'ar' ? 'الوقت المتاح' : 'Available time'}
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
                                    {i18n.language === 'ru' ? 'Недостаточно средств на балансе. Пожалуйста, пополните баланс в шапке профиля (+).' : i18n.language === 'ar' ? 'الرصيد غير كافٍ. يرجى إعادة شحن رصيدك من القائمة العلوية (+).' : 'Insufficient balance. Please top up your balance from the header (+).'}
                                  </div>
                                ) : null}

                              </motion.div>
                            ) : (
                              <div className="p-8 bg-white/[0.01] rounded-2xl border border-dashed border-white/10 text-center text-xs text-white/40">
                                {i18n.language === 'ru' ? 'Выберите любую услугу в списке слева, чтобы начать оформление визита.' : i18n.language === 'ar' ? 'اختر أي خدمة من القائمة على اليسار لبدء الحجز.' : 'Select any service from the list on the left to start booking your visit.'}
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
                                ? (i18n.language === 'ru' ? 'Запись...' : i18n.language === 'ar' ? 'جاري التسجيل...' : 'Booking...') 
                                : (i18n.language === 'ru' ? 'Подтвердить запись' : i18n.language === 'ar' ? 'تأكيد الحجز' : 'Confirm appointment')}
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
                      {i18n.language === 'ru' ? 'Персональный ИИ-Консьерж' : i18n.language === 'ar' ? 'المساعد الشخصي الذكي' : 'Personal AI Concierge'}
                    </h2>
                    <p className="text-xs text-white/50 leading-relaxed max-w-xl">
                      {i18n.language === 'ru' 
                        ? 'Заказывайте столы в ресторанах Sakura Zen или Grand Atelier, записывайтесь на тренировки и массаж в Lotus Spa в свободной форме. ИИ-помощник мгновенно создаст бронь.' 
                        : 'Book Michelin-starred tables, fitness coaches, or luxury spa sessions by simply talking to your elite concierge.'
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
                            {i18n.language === 'ru' ? 'Универсальный QR-чекин' : i18n.language === 'ar' ? 'التحقق العالمي عبر رمز QR' : 'Universal QR Check-in'}
                          </h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                            {i18n.language === 'ru' ? 'Карта гостя OmniReserve' : i18n.language === 'ar' ? 'بطاقة ضيف OmniReserve' : 'OmniReserve Guest Pass'}
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
                          {i18n.language === 'ru' ? 'ИМЯ ГОСТЯ:' : i18n.language === 'ar' ? 'اسم الضيف:' : 'GUEST NAME:'}
                        </span>
                        <span className="text-white font-bold">{user.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">EMAIL:</span>
                        <span className="text-white font-mono font-bold truncate max-w-[180px]">{user.email}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">
                          {i18n.language === 'ru' ? 'РОЛЬ В СИСТЕМЕ:' : i18n.language === 'ar' ? 'الدور في النظام:' : 'SYSTEM ROLE:'}
                        </span>
                        <span className="text-teal-400 font-mono font-bold uppercase">{user.role}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/40 leading-relaxed px-4">
                      {i18n.language === 'ru' ? 'Предъявите этот QR-код при входе в ресторан или на ресепшн спа-центра для мгновенной регистрации вашего прибытия.' : i18n.language === 'ar' ? 'يرجى تقديم رمز QR هذا عند دخول المطعم أو في مكتب استقبال مركز السبا للتسجيل الفوري لوصولك.' : 'Present this QR code at the entrance of the restaurant or at the spa reception desk for instant check-in.'}
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
                            {i18n.language === 'ru' ? 'QR-код Бронирования' : i18n.language === 'ar' ? 'رمز QR للحجز' : 'Booking QR Code'}
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
                          {i18n.language === 'ru' ? 'НАЗВАНИЕ / ОБЪЕКТ:' : i18n.language === 'ar' ? 'الاسم / الكائن:' : 'NAME / VENUE:'}
                        </span>
                        <span className="text-white font-bold text-right truncate max-w-[180px]">
                          {selectedQrBooking.type === 'table' 
                            ? (i18n.language === 'ru' ? `Столик #${selectedQrBooking.tableNumber} (Ресторан)` : i18n.language === 'ar' ? `طاولة #${selectedQrBooking.tableNumber} (المطعم)` : `Table #${selectedQrBooking.tableNumber} (Restaurant)`) 
                            : selectedQrBooking.serviceName}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">
                          {i18n.language === 'ru' ? 'ДАТА И ВРЕМЯ:' : i18n.language === 'ar' ? 'التاريخ والوقت:' : 'DATE & TIME:'}
                        </span>
                        <span className="text-teal-400 font-bold font-mono">
                          {selectedQrBooking.date} {i18n.language === 'ru' ? 'в' : i18n.language === 'ar' ? 'في' : 'at'} {selectedQrBooking.time}
                        </span>
                      </div>
                      {selectedQrBooking.type === 'table' ? (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/40">
                            {i18n.language === 'ru' ? 'ЗАЛ И ГОСТИ:' : i18n.language === 'ar' ? 'القاعة والضيوف:' : 'ROOM & GUESTS:'}
                          </span>
                          <span className="text-white font-medium">
                            {selectedQrBooking.room === 'main' 
                              ? (i18n.language === 'ru' ? 'Главный' : i18n.language === 'ar' ? 'الرئيسية' : 'Main') 
                              : selectedQrBooking.room === 'vip' 
                                ? 'VIP' 
                                : (i18n.language === 'ru' ? 'Терраса' : i18n.language === 'ar' ? 'الشرفة' : 'Terrace')
                            }, {selectedQrBooking.guests} {i18n.language === 'ru' ? 'чел' : i18n.language === 'ar' ? 'أشخاص' : 'guests'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-white/40">
                            {i18n.language === 'ru' ? 'СПЕЦИАЛИСТ:' : i18n.language === 'ar' ? 'الأخصائي:' : 'SPECIALIST:'}
                          </span>
                          <span className="text-white font-medium">{selectedQrBooking.staffName}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-white/40">
                          {i18n.language === 'ru' ? 'СТАТУС ЧЕКИНА:' : i18n.language === 'ar' ? 'حالة تسجيل الوصول:' : 'CHECK-IN STATUS:'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-wider animate-pulse">
                          {i18n.language === 'ru' ? 'Ожидает прибытия' : i18n.language === 'ar' ? 'في انتظار الوصول' : 'Awaiting arrival'}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/40 leading-relaxed px-4">
                      {i18n.language === 'ru' ? 'Покажите данный код менеджеру или просканируйте его на терминале при входе для автоматической активации визита.' : i18n.language === 'ar' ? 'يرجى إظهار هذا الرمز للمدير أو مسحه ضوئيًا عند المدخل لتفعيل زيارتك تلقائيًا.' : 'Show this code to the manager or scan it at the terminal upon entrance for automatic visit activation.'}
                    </p>
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
                            {i18n.language === 'ru' ? 'Проверка условий перед подтверждением' : i18n.language === 'ar' ? 'التحقق من الشروط قبل التأكيد' : 'Checking terms before confirmation'}
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
                          {i18n.language === 'ru' ? 'Детали заказа' : i18n.language === 'ar' ? 'تفاصيل الطلب' : 'Order details'}
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
                          {confirmModalData.cost.toLocaleString(i18n.language === 'ru' ? 'ru-RU' : 'en-US')} ₽
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
                            {i18n.language === 'ru' ? 'Настройки профиля' : i18n.language === 'ar' ? 'إعدادات الملف الشخصي' : 'Profile Settings'}
                          </h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                            {i18n.language === 'ru' ? 'управление аккаунтом и темой' : i18n.language === 'ar' ? 'إدارة الحساب والمظهر' : 'manage account and theme'}
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
                            {i18n.language === 'ru' ? 'Ваш аккаунт' : i18n.language === 'ar' ? 'حسابك' : 'Your account'}
                          </span>
                          <h5 className="font-bold text-white text-sm">{user.name}</h5>
                          <span className="text-xs text-white/40 block font-mono">{user.email}</span>
                        </div>
                      </div>

                      {/* Edit Username Field */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-extrabold block">
                          {i18n.language === 'ru' ? 'Имя пользователя' : i18n.language === 'ar' ? 'اسم المستخدم' : 'Username'}
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
                          placeholder={i18n.language === 'ru' ? 'Ваше имя' : i18n.language === 'ar' ? 'اسمك' : 'Your name'}
                        />
                      </div>

                      {/* Change Avatar Preset */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-extrabold block">
                          {i18n.language === 'ru' ? 'Выберите аватар' : i18n.language === 'ar' ? 'اختر صورتك الرمزية' : 'Select avatar'}
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
                          {i18n.language === 'ru' ? 'Детали профиля' : i18n.language === 'ar' ? 'تفاصيل الحساب' : 'Profile Details'}
                        </label>
                        
                        <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3 text-xs">
                          {/* Role detail */}
                          <div className="flex justify-between items-center">
                            <span className="text-white/40">{i18n.language === 'ru' ? 'Роль:' : i18n.language === 'ar' ? 'الدور:' : 'User Role:'}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono tracking-wide uppercase ${
                              user.role === 'client' 
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' 
                                : 'bg-teal-500/10 text-teal-400 border border-teal-500/15'
                            }`}>
                              {user.role === 'client' 
                                ? (i18n.language === 'ru' ? 'Клиент' : i18n.language === 'ar' ? 'عميل' : 'Client') 
                                : (user.role === 'business_owner' 
                                  ? (i18n.language === 'ru' ? 'Владелец бизнеса' : i18n.language === 'ar' ? 'مالك عمل' : 'Business Owner')
                                  : user.role)}
                            </span>
                          </div>

                          {/* Balance detail */}
                          <div className="flex justify-between items-center">
                            <span className="text-white/40">{i18n.language === 'ru' ? 'Баланс счета:' : i18n.language === 'ar' ? 'الرصيد:' : 'Account Balance:'}</span>
                            <span className="font-mono font-bold text-teal-400">{user.balance.toLocaleString('ru-RU')} ₽</span>
                          </div>

                          {/* Business Info if business user */}
                          {user.businessName && (
                            <div className="pt-2.5 border-t border-white/5 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-white/40">{i18n.language === 'ru' ? 'Компания:' : i18n.language === 'ar' ? 'الشركة:' : 'Business Name:'}</span>
                                <span className="font-bold text-white text-right">{user.businessName}</span>
                              </div>
                              {user.businessCategory && (
                                <div className="flex justify-between">
                                  <span className="text-white/40">{i18n.language === 'ru' ? 'Категория:' : i18n.language === 'ar' ? 'الفئة:' : 'Category:'}</span>
                                  <span className="text-white/70 font-mono text-[11px]">{user.businessCategory}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Preferences Detail */}
                          {user.preferences && user.preferences.length > 0 && (
                            <div className="pt-2.5 border-t border-white/5">
                              <span className="text-white/40 block mb-1.5">{i18n.language === 'ru' ? 'Предпочтения:' : i18n.language === 'ar' ? 'التفضيلات:' : 'Preferences:'}</span>
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
                            <span>{i18n.language === 'ru' ? 'СТАТУС: АКТИВЕН' : i18n.language === 'ar' ? 'الحالة: نشط' : 'STATUS: ACTIVE'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Theme Toggle Selection (Light/Dark) */}
                      <div className="space-y-3 pt-4 border-t border-white/5">
                        <div>
                          <label className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-extrabold block">
                            {i18n.language === 'ru' ? 'Тема оформления' : i18n.language === 'ar' ? 'المظهر' : 'Visual theme'}
                          </label>
                          <span className="text-[10px] text-white/30 block">
                            {i18n.language === 'ru' ? 'Выберите визуальное оформление приложения' : i18n.language === 'ar' ? 'اختر المظهر المرئي للتطبيق' : 'Choose application visual appearance'}
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
                                {i18n.language === 'ru' ? 'Темная' : i18n.language === 'ar' ? 'داكن' : 'Dark'}
                              </span>
                              <span className="text-[8px] opacity-60 block mt-0.5">
                                {i18n.language === 'ru' ? 'Энергосберегающая' : i18n.language === 'ar' ? 'موفّر للطاقة' : 'Energy saving'}
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
                                {i18n.language === 'ru' ? 'Светлая' : i18n.language === 'ar' ? 'فاتح' : 'Light'}
                              </span>
                              <span className="text-[8px] opacity-60 block mt-0.5">
                                {i18n.language === 'ru' ? 'Высококонтрастная' : i18n.language === 'ar' ? 'تباين عالي' : 'High contrast'}
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Save Status / Close button */}
                      <div className="pt-5 border-t border-white/5 flex flex-col gap-3">
                        <button
                          onClick={() => setShowSettingsModal(false)}
                          className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-teal-500/10 cursor-pointer flex items-center justify-center gap-2"
                        >
                          {i18n.language === 'ru' ? 'Сохранить настройки' : i18n.language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'}
                        </button>

                        <button
                          onClick={() => {
                            setShowSettingsModal(false);
                            handleLogout();
                          }}
                          className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          {i18n.language === 'ru' ? 'Выйти из аккаунта' : i18n.language === 'ar' ? 'تسجيل الخروج' : 'Log out'}
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
                            {i18n.language === 'ru' ? 'Регистрация бьюти-бизнеса' : i18n.language === 'ar' ? 'تسجيل عمل تجاري جمالي' : 'Beauty business registration'}
                          </h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                            {i18n.language === 'ru' ? 'Создание нового велнес/салонного центра' : i18n.language === 'ar' ? 'إنشاء مركز عافية/صالون جديد' : 'Create new wellness/salon center'}
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
                          {i18n.language === 'ru' ? 'Название заведения *' : i18n.language === 'ar' ? 'اسم المنشأة *' : 'Venue Name *'}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={newSalonForm.name}
                          onChange={e => setNewSalonForm({...newSalonForm, name: e.target.value})}
                          placeholder={i18n.language === 'ru' ? 'Например: Aura Spa & Wellness' : i18n.language === 'ar' ? 'مثال: Aura Spa & Wellness' : 'Example: Aura Spa & Wellness'}
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-white/60 mb-1">
                            {i18n.language === 'ru' ? 'Категория *' : i18n.language === 'ar' ? 'الفئة *' : 'Category *'}
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
                            {i18n.language === 'ru' ? 'Адрес *' : i18n.language === 'ar' ? 'العنوان *' : 'Address *'}
                          </label>
                          <input 
                            type="text" 
                            required
                            value={newSalonForm.address}
                            onChange={e => setNewSalonForm({...newSalonForm, address: e.target.value})}
                            placeholder={i18n.language === 'ru' ? 'ул. Ленина, д. 45' : i18n.language === 'ar' ? 'شارع السلام، مبنى 45' : '45 Lenin St.'}
                            className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          {i18n.language === 'ru' ? 'Краткое описание' : i18n.language === 'ar' ? 'وصف قصير' : 'Brief description'}
                        </label>
                        <textarea 
                          value={newSalonForm.description}
                          onChange={e => setNewSalonForm({...newSalonForm, description: e.target.value})}
                          placeholder={i18n.language === 'ru' ? 'Опишите концепцию, удобства и особенности вашего салона...' : i18n.language === 'ar' ? 'صف المفهوم والمرافق والميزات للصالون الخاص بك...' : 'Describe the concept, amenities, and features of your salon...'}
                          rows={2}
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          {i18n.language === 'ru' ? 'Ссылка на фото (URL)' : i18n.language === 'ar' ? 'رابط الصورة (URL)' : 'Photo Link (URL)'}
                        </label>
                        <input 
                          type="text" 
                          value={newSalonForm.image}
                          onChange={e => setNewSalonForm({...newSalonForm, image: e.target.value})}
                          placeholder={i18n.language === 'ru' ? 'https://images.unsplash.com/... (Оставьте пустым для автогенерации)' : i18n.language === 'ar' ? 'https://images.unsplash.com/... (اتركه فارغاً للتوليد التلقائي)' : 'https://images.unsplash.com/... (Leave empty for auto-generation)'}
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-3">
                        <span className="text-[10px] font-mono uppercase text-teal-400 font-bold tracking-wider block">
                          {i18n.language === 'ru' ? 'Первая услуга салона (для старта)' : i18n.language === 'ar' ? 'أول خدمة للصالون (للبدء)' : 'First salon service (to start)'}
                        </span>
                        
                        <div>
                          <label className="block text-[11px] font-semibold text-white/50 mb-1">
                            {i18n.language === 'ru' ? 'Название услуги *' : i18n.language === 'ar' ? 'اسم الخدمة *' : 'Service name *'}
                          </label>
                          <input 
                            type="text" 
                            required
                            value={newSalonForm.serviceName}
                            onChange={e => setNewSalonForm({...newSalonForm, serviceName: e.target.value})}
                            placeholder={i18n.language === 'ru' ? 'Например: Классический шведский массаж' : i18n.language === 'ar' ? 'مثال: تدليك سويدي كلاسيكي' : 'Example: Classic Swedish Massage'}
                            className="w-full px-4 py-1.5 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-white/50 mb-1">
                              {i18n.language === 'ru' ? 'Стоимость (₽) *' : i18n.language === 'ar' ? 'السعر (₽) *' : 'Price (₽) *'}
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
                              {i18n.language === 'ru' ? 'Длительность (мин) *' : i18n.language === 'ar' ? 'المدة (دقيقة) *' : 'Duration (min) *'}
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
                          {i18n.language === 'ru' ? 'Отмена' : i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button 
                          type="submit" 
                          disabled={registeringSalon}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black rounded-xl text-xs font-black transition cursor-pointer shadow-lg shadow-teal-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {registeringSalon 
                            ? (i18n.language === 'ru' ? 'Регистрируем…' : i18n.language === 'ar' ? 'جاري التسجيل...' : 'Registering...') 
                            : (i18n.language === 'ru' ? 'Зарегистрировать салон' : i18n.language === 'ar' ? 'تسجيل الصالون' : 'Register Salon')}
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
                            {i18n.language === 'ru' ? 'Регистрация ресторана / кафе' : i18n.language === 'ar' ? 'تسجيل مطعم / مقهى' : 'Restaurant / Cafe registration'}
                          </h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">
                            {i18n.language === 'ru' ? 'Создание нового гастрономического пространства' : i18n.language === 'ar' ? 'إنشاء مساحة طهي جديدة' : 'Create new gastronomic space'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowRegisterRestaurantModal(false)}
                        className="p-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleRegisterRestaurant} className="space-y-4 relative">
                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          {i18n.language === 'ru' ? 'Название заведения *' : i18n.language === 'ar' ? 'اسم المنشأة *' : 'Venue Name *'}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={newRestaurantForm.name}
                          onChange={e => setNewRestaurantForm({...newRestaurantForm, name: e.target.value})}
                          placeholder={i18n.language === 'ru' ? 'Например: Bistro Gusto' : i18n.language === 'ar' ? 'مثال: Bistro Gusto' : 'Example: Bistro Gusto'}
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-white/60 mb-1">
                            {i18n.language === 'ru' ? 'Кухня *' : i18n.language === 'ar' ? 'المطبخ *' : 'Cuisine *'}
                          </label>
                          <input 
                            type="text" 
                            required
                            value={newRestaurantForm.cuisine}
                            onChange={e => setNewRestaurantForm({...newRestaurantForm, cuisine: e.target.value})}
                            placeholder={i18n.language === 'ru' ? 'Европейская, Азиатская, Итальянская' : i18n.language === 'ar' ? 'أوروبية، آسيوية، إيطالية' : 'European, Asian, Italian'}
                            className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-white/60 mb-1">
                            {i18n.language === 'ru' ? 'Количество столов для старта *' : i18n.language === 'ar' ? 'عدد الطاولات للبدء *' : 'Number of tables to start *'}
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
                          {i18n.language === 'ru' ? 'Описание концепции' : i18n.language === 'ar' ? 'وصف المفهوم' : 'Concept description'}
                        </label>
                        <textarea 
                          value={newRestaurantForm.description}
                          onChange={e => setNewRestaurantForm({...newRestaurantForm, description: e.target.value})}
                          placeholder={i18n.language === 'ru' ? 'Опишите атмосферу, фирменные блюда и особенности заведения...' : i18n.language === 'ar' ? 'صف الأجواء، الأطباق المميزة وميزات المنشأة...' : 'Describe the atmosphere, signature dishes, and features of the venue...'}
                          rows={3}
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-white/60 mb-1">
                          {i18n.language === 'ru' ? 'Ссылка на фото (URL)' : i18n.language === 'ar' ? 'رابط الصورة (URL)' : 'Photo Link (URL)'}
                        </label>
                        <input 
                          type="text" 
                          value={newRestaurantForm.image}
                          onChange={e => setNewRestaurantForm({...newRestaurantForm, image: e.target.value})}
                          placeholder={i18n.language === 'ru' ? 'https://images.unsplash.com/... (Оставьте пустым для автогенерации)' : i18n.language === 'ar' ? 'https://images.unsplash.com/... (اتركه فارغاً للتوليد التلقائي)' : 'https://images.unsplash.com/... (Leave empty for auto-generation)'}
                          className="w-full px-4 py-2 bg-[#0F1115] border border-white/10 text-white rounded-xl text-xs focus:outline-none focus:border-teal-500"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                        <button 
                          type="button" 
                          onClick={() => setShowRegisterRestaurantModal(false)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          {i18n.language === 'ru' ? 'Отмена' : i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button 
                          type="submit" 
                          disabled={registeringRestaurant}
                          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black rounded-xl text-xs font-black transition cursor-pointer shadow-lg shadow-teal-500/10 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {registeringRestaurant 
                            ? (i18n.language === 'ru' ? 'Создаём…' : i18n.language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') 
                            : (i18n.language === 'ru' ? 'Создать ресторан' : i18n.language === 'ar' ? 'إنشاء مطعم' : 'Create Restaurant')}
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      setShowSyncConfirmModal(false);
                      setPendingSyncBooking(null);
                    }}
                    className="absolute inset-0 bg-black/90 backdrop-blur-md"
                  />

                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#16191F] border border-white/10 rounded-3xl p-6 max-w-lg w-full relative z-[101] shadow-2xl overflow-hidden text-left"
                  >
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex justify-between items-center mb-6 relative">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                          <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-base text-white">
                            {i18n.language === 'ru' ? 'Синхронизация события' : i18n.language === 'ar' ? 'مزامنة الحدث' : 'Event Synchronization'}
                          </h4>
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block">Google Calendar Confirmation</span>
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
                        {i18n.language === 'ru' ? 'Вы собираетесь добавить следующее событие в ваш основной Google Календарь:' : i18n.language === 'ar' ? 'أنت على وشك إضافة الحدث التالي إلى تقويم Google الرئيسي الخاص بك:' : 'You are about to add the following event to your main Google Calendar:'}
                      </p>

                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-white/[0.02]">
                          <span className="text-white/50">
                            {i18n.language === 'ru' ? 'Название:' : i18n.language === 'ar' ? 'الاسم:' : 'Name:'}
                          </span>
                          <span className="font-semibold text-white">
                            {pendingSyncBooking.type === "table" 
                              ? (i18n.language === 'ru' 
                                  ? `🍽️ Бронь столика #${pendingSyncBooking.tableNumber} в ресторан` 
                                  : i18n.language === 'ar' 
                                    ? `🍽️ حجز طاولة #${pendingSyncBooking.tableNumber} في مطعم` 
                                    : `🍽️ Table #${pendingSyncBooking.tableNumber} Restaurant Booking`)
                              : `🌸 ${pendingSyncBooking.serviceName}`}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/[0.02]">
                          <span className="text-white/50">
                            {i18n.language === 'ru' ? 'Дата и время:' : i18n.language === 'ar' ? 'التاريخ والوقت:' : 'Date & time:'}
                          </span>
                          <span className="font-semibold text-white">
                            {pendingSyncBooking.date} {i18n.language === 'ru' ? 'в' : i18n.language === 'ar' ? 'في' : 'at'} {pendingSyncBooking.time}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/[0.02]">
                          <span className="text-white/50">
                            {i18n.language === 'ru' ? 'Место:' : i18n.language === 'ar' ? 'الموقع:' : 'Location:'}
                          </span>
                          <span className="font-semibold text-white">
                            {pendingSyncBooking.type === "table"
                              ? (i18n.language === 'ru' 
                                  ? 'Ресторан OmniReserve, ул. Лесная, д. 5, стр. 2' 
                                  : i18n.language === 'ar' 
                                    ? 'مطعم OmniReserve، شارع ليسنايا، مبنى 5' 
                                    : 'OmniReserve Restaurant, 5 Lesnaya St.')
                              : (i18n.language === 'ru' 
                                  ? 'Lotus Spa, ул. Лесная, д. 5, стр. 2' 
                                  : i18n.language === 'ar' 
                                    ? 'لوتس سبا، شارع ليسنايا، مبنى 5' 
                                    : 'Lotus Spa, 5 Lesnaya St.')}
                          </span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-white/50">
                            {i18n.language === 'ru' ? 'Напоминания:' : i18n.language === 'ar' ? 'التذكيرات:' : 'Reminders:'}
                          </span>
                          <span className="font-semibold text-teal-400">
                            {i18n.language === 'ru' ? 'Всплывающее (30 мин) & Email (2 ч)' : i18n.language === 'ar' ? 'منبثق (30 دقيقة) وبريد إلكتروني (ساعتان)' : 'Popup (30 min) & Email (2 hours)'}
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
                          {i18n.language === 'ru' ? 'Отмена' : i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
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
                              {i18n.language === 'ru' ? 'Подтвердить запись' : i18n.language === 'ar' ? 'تأكيد الحجز' : 'Confirm reservation'}
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
                        {i18n.language === 'ru' ? 'Через 2 часа' : i18n.language === 'ar' ? 'خلال ساعتين' : 'In 2 hours'}
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
                          {i18n.language === 'ru' ? 'Адрес назначения' : i18n.language === 'ar' ? 'عنوان الوجهة' : 'Destination Address'}
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-white leading-snug">
                        {alert.address}
                      </p>
                      <div className="flex items-start gap-1.5 text-[10px] text-white/40 pt-1.5 border-t border-white/[0.03]">
                        <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">
                          <strong>{i18n.language === 'ru' ? 'Как добраться:' : i18n.language === 'ar' ? 'كيفية الوصول:' : 'How to get there:'}</strong> {alert.directions}
                        </span>
                      </div>
                    </div>

                    {/* Footer bar with Booking ID and close button */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-white/30 uppercase">
                        {i18n.language === 'ru' ? 'ID брони:' : i18n.language === 'ar' ? 'معرّف الحجز:' : 'Booking ID:'} <strong className="text-white/60">{alert.bookingId}</strong>
                      </span>
                      <button
                        onClick={() => {
                          setUpcomingAlerts(prev => prev.filter(a => a.id !== alert.id));
                        }}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-bold transition cursor-pointer"
                      >
                        {i18n.language === 'ru' ? 'Понятно' : i18n.language === 'ar' ? 'مفهوم' : 'Got it'}
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
                  {i18n.language === 'ru' 
                    ? '© 2026 OmniReserve Booking Superapp. Объединенная клиентская база Bookly & Tabletop.' 
                    : i18n.language === 'ar' 
                      ? '© 2026 OmniReserve Booking Superapp. قاعدة عملاء موحدة لـ Bookly & Tabletop.' 
                      : '© 2026 OmniReserve Booking Superapp. Unified Bookly & Tabletop client base.'}
                </p>
                <p className="mt-1 font-mono text-[10px] text-white/20">SYSTEM TIME: 2026-07-10 | CLIENT: {user.name}</p>
              </div>
            </footer>

            {/* Elegant Sticky/Floating Bottom Navigation Dock */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#090A0D]/90 backdrop-blur-xl border-t border-white/5 py-3 px-4 shadow-[0_-8px_30px_rgba(0,0,0,0.8)] pb-safe">
              <div className="max-w-xl mx-auto flex items-center justify-around gap-2">
                {[
                  { id: 'ai-assistant' as const, label: i18n.language === 'ru' ? 'ИИ-Консьерж' : i18n.language === 'ar' ? 'المساعد الذكي' : 'AI Assistant', icon: Sparkles },
                  { id: 'dashboard' as const, label: i18n.language === 'ru' ? 'Панель' : i18n.language === 'ar' ? 'لوحة التحكم' : 'Dashboard', icon: Grid },
                  { id: 'tabletop' as const, label: i18n.language === 'ru' ? 'Столики' : i18n.language === 'ar' ? 'حجز الطاولات' : 'Tabletop', icon: Utensils },
                  { id: 'bookly' as const, label: i18n.language === 'ru' ? 'Услуги' : i18n.language === 'ar' ? 'حجز الخدمات' : 'Bookly', icon: Calendar },
                  { id: 'rbac' as const, label: i18n.language === 'ru' ? 'Доступ' : i18n.language === 'ar' ? 'الإدارة' : 'RBAC', icon: Sliders },
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
                title={i18n.language === 'ru' ? 'Чат с OmniConcierge' : 'Chat with OmniConcierge'}
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
