import React, { useState, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Users, 
  Percent, 
  Clock, 
  Sparkles, 
  Download, 
  Search, 
  ArrowUpRight, 
  BarChart2, 
  PieChart as PieIcon, 
  Activity, 
  Filter, 
  CalendarDays, 
  Sliders, 
  Briefcase, 
  RefreshCw, 
  Zap, 
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Coins,
  MapPin,
  Smile
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  BarChart, 
  Bar, 
  PieChart, 
  Cell, 
  Pie,
  LineChart,
  Line
} from "recharts";
import type { Booking, Restaurant, Salon, Hotel, Room, HotelBooking, User } from "../types";
import { useTranslation } from "react-i18next";

interface AnalyticsDashboardProps {
  user: User;
  bookings: Booking[];
  hotelBookings: HotelBooking[];
  restaurants: Restaurant[];
  salons: Salon[];
  hotels: Hotel[];
  rooms: Room[];
  theme: "light" | "dark";
  onTabChange: (tab: "dashboard" | "tabletop" | "bookly" | "stays" | "rbac") => void;
}

export default function AnalyticsDashboard({
  user,
  bookings,
  hotelBookings,
  restaurants,
  salons,
  hotels,
  rooms,
  theme,
  onTabChange
}: AnalyticsDashboardProps) {
  const { t, i18n } = useTranslation();
  
  // States
  const [dashboardMode, setDashboardMode] = useState<"business" | "personal">(
    user.role === "client" ? "personal" : "business"
  );
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "12m">("30d");
  const [activeMetric, setActiveMetric] = useState<"revenue" | "volume" | "average">("revenue");
  
  // Category Filters
  const [selectedCategories, setSelectedCategories] = useState({
    tabletop: true,
    bookly: true,
    stays: true
  });

  // Table Search and Sorting State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending" | "cancelled">("all");
  const [sortBy, setSortBy] = useState<"date" | "revenue" | "category" | "client">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // What-If Simulator States
  const [priceMultiplier, setPriceMultiplier] = useState<number>(1.0); // 1.0x baseline
  const [volumeTarget, setVolumeTarget] = useState<number>(25); // Target bookings/day
  const [occupancyGoal, setOccupancyGoal] = useState<number>(75); // Target hotel occupancy %

  // Strategic AI Advisor
  const [adviserAdvice, setAdviserAdvice] = useState<string | null>(null);
  const [adviserLoading, setAdviserLoading] = useState<boolean>(false);

  // Toggle categories helper
  const toggleCategory = (cat: "tabletop" | "bookly" | "stays") => {
    setSelectedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Merge everything into a normalized list of transactions for reporting/analysis
  const allNormalizedTransactions = useMemo(() => {
    const list: any[] = [];

    // 1. Add Table tabletop bookings
    bookings.forEach(b => {
      if (b.type === "table") {
        list.push({
          id: b.id,
          userId: b.userId,
          clientName: b.userId === "user-1" ? "Мария Смирнова" : b.userId === "user-2" ? "Алексей Иванов" : "Гость Omni",
          type: "table",
          categoryName: "Restaurant Dining",
          itemName: b.restaurantName || "Премиум Ресторан",
          detail: `Стол #${b.tableNumber} (${b.room === "vip" ? "VIP" : b.room === "terrace" ? "Терраса" : "Основной"})`,
          date: b.date,
          time: b.time || "19:00",
          revenue: b.price,
          status: "confirmed",
          createdAt: b.createdAt
        });
      } else if (b.type === "service") {
        // 2. Add Service bookings
        list.push({
          id: b.id,
          userId: b.userId,
          clientName: b.userId === "user-1" ? "Мария Смирнова" : b.userId === "user-2" ? "Алексей Иванов" : "Гость Omni",
          type: "service",
          categoryName: "Spa & Wellness Salon",
          itemName: b.serviceName || "Услуга",
          detail: `${b.category} • Спец: ${b.staffName || "Мастер"}`,
          date: b.date,
          time: b.time || "14:00",
          revenue: b.price,
          status: "confirmed",
          createdAt: b.createdAt
        });
      }
    });

    // 3. Add Hotel bookings
    hotelBookings.forEach(hb => {
      list.push({
        id: hb.id,
        userId: hb.userId,
        clientName: hb.userId === "user-1" ? "Мария Смирнова" : hb.userId === "user-2" ? "Алексей Иванов" : "Гость Omni",
        type: "stays",
        categoryName: "Hotel Luxury Stays",
        itemName: hb.hotelName,
        detail: hb.roomType,
        date: hb.checkInDate,
        time: "15:00 Check-In",
        revenue: hb.totalCost,
        status: hb.status || "confirmed",
        createdAt: hb.createdAt
      });
    });

    return list;
  }, [bookings, hotelBookings]);

  // Filters Transactions for the Active User / Business Scope
  const filteredTransactions = useMemo(() => {
    let list = [...allNormalizedTransactions];

    // Filter personal vs business
    if (dashboardMode === "personal") {
      list = list.filter(t => t.userId === user.id);
    }

    // Filter by Category checkmarks
    list = list.filter(t => {
      if (t.type === "table" && !selectedCategories.tabletop) return false;
      if (t.type === "service" && !selectedCategories.bookly) return false;
      if (t.type === "stays" && !selectedCategories.stays) return false;
      return true;
    });

    // Filter by Status
    if (statusFilter !== "all") {
      list = list.filter(t => t.status === statusFilter);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => 
        t.clientName.toLowerCase().includes(q) ||
        t.itemName.toLowerCase().includes(q) ||
        t.detail.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }

    // Sort transactions
    list.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === "client") {
        valA = a.clientName;
        valB = b.clientName;
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [allNormalizedTransactions, dashboardMode, selectedCategories, statusFilter, searchQuery, sortBy, sortOrder, user.id]);

  // Calculate high-level totals based on filters
  const statistics = useMemo(() => {
    const list = allNormalizedTransactions.filter(t => {
      if (dashboardMode === "personal" && t.userId !== user.id) return false;
      return true;
    });

    const totalRevenue = list.reduce((acc, curr) => acc + curr.revenue, 0);
    const bookingsCount = list.length;
    const avgTicket = bookingsCount > 0 ? Math.round(totalRevenue / bookingsCount) : 0;
    
    // Breakdowns
    const tableRev = list.filter(t => t.type === "table").reduce((acc, curr) => acc + curr.revenue, 0);
    const serviceRev = list.filter(t => t.type === "service").reduce((acc, curr) => acc + curr.revenue, 0);
    const stayRev = list.filter(t => t.type === "stays").reduce((acc, curr) => acc + curr.revenue, 0);

    const tableCount = list.filter(t => t.type === "table").length;
    const serviceCount = list.filter(t => t.type === "service").length;
    const stayCount = list.filter(t => t.type === "stays").length;

    // Occupancy (for hotels) - simulated occupancy based on bookings
    const totalSuitesAvailable = 25; // standard base
    const occupiedSuites = stayCount % totalSuitesAvailable;
    const hotelOccupancy = bookingsCount > 0 ? Math.min(96, Math.max(35, Math.round((occupiedSuites + 12) / totalSuitesAvailable * 100))) : 0;

    return {
      totalRevenue,
      bookingsCount,
      avgTicket,
      tableRev,
      serviceRev,
      stayRev,
      tableCount,
      serviceCount,
      stayCount,
      hotelOccupancy
    };
  }, [allNormalizedTransactions, dashboardMode, user.id]);

  // Recharts Chart Dataset Generation based on Time Horizon
  const chartData = useMemo(() => {
    const data = [];
    const baseDate = new Date(2026, 6, 11); // base date July 11, 2026

    const limit = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 12;

    if (timeRange === "12m") {
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      for (let i = 11; i >= 0; i--) {
        const mDate = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
        const label = `${monthNames[mDate.getMonth()]} ${mDate.getFullYear().toString().slice(-2)}`;
        
        // Simulating robust monthly corporate data with some variations + live records
        const baseMult = (i === 0) ? 1.1 : (i === 1) ? 0.95 : (i === 2) ? 1.05 : 0.9;
        const simulatedTableRev = Math.round((120000 + (i * 3500)) * baseMult);
        const simulatedWellnessRev = Math.round((190000 + (i * 8000)) * baseMult);
        const simulatedStaysRev = Math.round((380000 + (i * 12000)) * baseMult);

        const realMonthTrans = allNormalizedTransactions.filter(t => {
          if (dashboardMode === "personal" && t.userId !== user.id) return false;
          const tDate = new Date(t.date);
          return tDate.getMonth() === mDate.getMonth() && tDate.getFullYear() === mDate.getFullYear();
        });

        const liveTableRev = realMonthTrans.filter(t => t.type === "table").reduce((a, c) => a + c.revenue, 0);
        const liveWellnessRev = realMonthTrans.filter(t => t.type === "service").reduce((a, c) => a + c.revenue, 0);
        const liveStaysRev = realMonthTrans.filter(t => t.type === "stays").reduce((a, c) => a + c.revenue, 0);

        // Combine
        const tabletop = (dashboardMode === "personal" ? 0 : simulatedTableRev) + liveTableRev;
        const bookly = (dashboardMode === "personal" ? 0 : simulatedWellnessRev) + liveWellnessRev;
        const stays = (dashboardMode === "personal" ? 0 : simulatedStaysRev) + liveStaysRev;

        const volume = realMonthTrans.length + (dashboardMode === "personal" ? 0 : Math.round((tabletop + bookly + stays) / 4500));

        data.push({
          name: label,
          "Restaurant Tabletop": tabletop,
          "Spa & Wellness": bookly,
          "Hotel Luxury Stays": stays,
          "Total Revenue": tabletop + bookly + stays,
          "Bookings Volume": volume,
          "Average Order": volume > 0 ? Math.round((tabletop + bookly + stays) / volume) : 0
        });
      }
    } else {
      // Daily generation
      for (let i = limit - 1; i >= 0; i--) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        
        const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const label = d.toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', { day: "numeric", month: "short" });

        // Seed some organic base curves
        const seedValue = Math.sin(i * 0.5) * 1500 + 4000;
        const simulatedTableRev = Math.round(seedValue * 0.8);
        const simulatedWellnessRev = Math.round(seedValue * 1.2);
        const simulatedStaysRev = Math.round(seedValue * 2.5);

        // Filter actual records for this specific day
        const dayTrans = allNormalizedTransactions.filter(t => {
          if (dashboardMode === "personal" && t.userId !== user.id) return false;
          return t.date === dateString;
        });

        const liveTableRev = dayTrans.filter(t => t.type === "table").reduce((a, c) => a + c.revenue, 0);
        const liveWellnessRev = dayTrans.filter(t => t.type === "service").reduce((a, c) => a + c.revenue, 0);
        const liveStaysRev = dayTrans.filter(t => t.type === "stays").reduce((a, c) => a + c.revenue, 0);

        // Compute combined values
        const tabletop = (dashboardMode === "personal" ? 0 : simulatedTableRev) + liveTableRev;
        const bookly = (dashboardMode === "personal" ? 0 : simulatedWellnessRev) + liveWellnessRev;
        const stays = (dashboardMode === "personal" ? 0 : simulatedStaysRev) + liveStaysRev;

        const volume = dayTrans.length + (dashboardMode === "personal" ? 0 : Math.round((tabletop + bookly + stays) / 3800));

        data.push({
          name: label,
          "Restaurant Tabletop": tabletop,
          "Spa & Wellness": bookly,
          "Hotel Luxury Stays": stays,
          "Total Revenue": tabletop + bookly + stays,
          "Bookings Volume": volume,
          "Average Order": volume > 0 ? Math.round((tabletop + bookly + stays) / volume) : 0
        });
      }
    }
    return data;
  }, [timeRange, allNormalizedTransactions, dashboardMode, user.id, i18n.language]);

  // Hourly Peak Times (08:00 to 22:00)
  const peakLoadData = useMemo(() => {
    const hours = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
    const baseOccupancies = [20, 35, 55, 65, 50, 85, 95, 60]; // peak curves

    return hours.map((hour, idx) => {
      // Find matches in actual bookings
      const matchCount = allNormalizedTransactions.filter(t => {
        if (dashboardMode === "personal" && t.userId !== user.id) return false;
        return t.time.startsWith(hour.slice(0, 2));
      }).length;

      return {
        hour,
        "Capacity Utilization": Math.min(100, baseOccupancies[idx] + (matchCount * 12)),
        "Booking Frequency": 5 + (matchCount * 3) + Math.round(idx * 1.5)
      };
    });
  }, [allNormalizedTransactions, dashboardMode, user.id]);

  // Segment Breakdown Pie Data
  const segmentPieData = useMemo(() => {
    return [
      { name: "Restaurant Tabletop", value: statistics.tableRev || 14500, color: "#f97316" },
      { name: "Spa & Wellness Salon", value: statistics.serviceRev || 22000, color: "#0d9488" },
      { name: "Hotel Luxury Stays", value: statistics.stayRev || 56000, color: "#3b82f6" }
    ];
  }, [statistics]);

  // Best Performing Staff / Resources
  const topServicesData = useMemo(() => {
    return [
      { name: "Lotus Dream Massage", revenue: 45000, bookings: 12, category: "Spa & Wellness" },
      { name: "Presidential Glass Dome Suite", revenue: 96000, bookings: 4, category: "Hotel Stays" },
      { name: "VIP Red Room Dining", revenue: 28000, bookings: 14, category: "Restaurant Tabletop" },
      { name: "Elite Fitness Coach", revenue: 18000, bookings: 9, category: "Fitness & Active" },
      { name: "Premium Hair Redesign", revenue: 15400, bookings: 11, category: "Beauty & Style" }
    ];
  }, []);

  // What-If Simulator Real-time Output Calculations
  const simulatedResults = useMemo(() => {
    const baseMonthlyRevenue = dashboardMode === "personal" ? statistics.totalRevenue : 870000;
    const baseBookings = dashboardMode === "personal" ? statistics.bookingsCount : 180;
    
    // Multipliers
    const pricingMult = priceMultiplier;
    const volMult = volumeTarget / 25; // 25 bookings/day as baseline
    const occMult = occupancyGoal / 75; // 75% occupancy as baseline

    const estimatedRevenue = Math.round(
      baseMonthlyRevenue * pricingMult * (volMult * 0.4 + occMult * 0.6)
    );
    
    const profitMargin = 0.35; // 35% net profit margin baseline
    const simulatedProfit = Math.round(estimatedRevenue * (profitMargin + (pricingMult - 1) * 0.5));
    const baselineProfit = Math.round(baseMonthlyRevenue * profitMargin);
    const profitChange = simulatedProfit - baselineProfit;
    const percentageGrowth = baseMonthlyRevenue > 0 ? ((estimatedRevenue - baseMonthlyRevenue) / baseMonthlyRevenue) * 100 : 0;

    return {
      estimatedRevenue,
      simulatedProfit,
      profitChange,
      percentageGrowth
    };
  }, [priceMultiplier, volumeTarget, occupancyGoal, statistics, dashboardMode]);

  // Fetch Strategical Advice from Gemini API
  const fetchStrategicAdvice = async () => {
    setAdviserLoading(true);
    try {
      const response = await fetch("/api/analytics/ai-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          priceMultiplier,
          volumeTarget,
          occupancyGoal,
          language: i18n.language
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch advice");
      }

      const data = await response.json();
      setAdviserAdvice(data.advice);
      toast.success(
        i18n.language === "ru" ? "Совет Gemini сгенерирован!" : "Gemini Advice Generated!"
      );
    } catch (err: any) {
      console.error(err);
      toast.error(
        i18n.language === "ru" ? "Не удалось сгенерировать совет" : "Failed to generate strategy analysis",
        { description: err.message }
      );
    } finally {
      setAdviserLoading(false);
    }
  };

  // CSV Exporter Simulation
  const handleExportCSV = () => {
    try {
      const headers = ["Booking ID", "Customer Name", "Category", "Service/Facility", "Details", "Date", "Cost/Revenue", "Status"];
      const rows = filteredTransactions.map(t => [
        t.id,
        t.clientName,
        t.categoryName,
        t.itemName,
        t.detail,
        t.date,
        `${t.revenue} ₽`,
        t.status
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `OmniReserve_${dashboardMode}_Report_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(
        i18n.language === "ru" ? "CSV-отчет успешно загружен!" : "CSV Report Downloaded successfully!"
      );
    } catch (err: any) {
      toast.error("Export error", { description: err.message });
    }
  };

  return (
    <div className="space-y-8" id="analytics-module-root">
      {/* 1. Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-mono tracking-wider uppercase mb-3 border border-indigo-500/20">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            {t("dashboard.analyticsBadge", "CORPORATE PERFORMANCE")}
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight flex items-center gap-2">
            📊 {t("dashboard.analyticsTitle", "Interactive Analytics & Revenue")}
          </h1>
          <p className="text-white/50 text-xs sm:text-sm mt-1 max-w-xl">
            {t("dashboard.analyticsDesc", "Track multi-channel commercial yields, simulate pricing elasticity models, and receive custom Gemini operational advice.")}
          </p>
        </div>

        {/* Dashboard Mode Switcher */}
        <div className="flex bg-[#111318] p-1.5 rounded-xl border border-white/5 self-start sm:self-center">
          <button
            onClick={() => setDashboardMode("personal")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              dashboardMode === "personal"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            {t("analytics.personalTab", "My Spendings")}
          </button>
          <button
            onClick={() => setDashboardMode("business")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              dashboardMode === "business"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-white/40 hover:text-white/80"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            {t("analytics.businessTab", "Business Metrics")}
          </button>
        </div>
      </div>

      {/* 2. Bento Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric Card 1: Total Gross Yield */}
        <div className="bg-[#16191F] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-teal-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/40 font-mono tracking-wider uppercase">
              {dashboardMode === "personal" ? "TOTAL SPENT" : "GROSS REVENUE"}
            </span>
            <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
              {statistics.totalRevenue.toLocaleString()} ₽
            </h3>
            <span className="text-[10px] text-teal-400 font-bold font-mono flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14.2%
            </span>
          </div>
          <p className="text-[10px] text-white/40 mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            {t("analytics.vsLastMonth", "vs. previous 30-day index")}
          </p>
        </div>

        {/* Metric Card 2: Combined Bookings Count */}
        <div className="bg-[#16191F] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/40 font-mono tracking-wider uppercase">
              {t("analytics.bookingsVolume", "BOOKINGS VOLUME")}
            </span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
              {statistics.bookingsCount}
            </h3>
            <span className="text-[10px] text-indigo-400 font-bold font-mono flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +8.7%
            </span>
          </div>
          <p className="text-[10px] text-white/40 mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            {statistics.tableCount} dining • {statistics.serviceCount} wellness • {statistics.stayCount} stay
          </p>
        </div>

        {/* Metric Card 3: Dynamic Ticket Size */}
        <div className="bg-[#16191F] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/40 font-mono tracking-wider uppercase">
              {t("analytics.avgTicketSize", "AVERAGE TICKET")}
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
              {statistics.avgTicket.toLocaleString()} ₽
            </h3>
            <span className="text-[10px] text-amber-400 font-bold font-mono flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +5.1%
            </span>
          </div>
          <p className="text-[10px] text-white/40 mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {t("analytics.ticketStrength", "High value retention")}
          </p>
        </div>

        {/* Metric Card 4: Hotel Occupancy Rate */}
        <div className="bg-[#16191F] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-white/40 font-mono tracking-wider uppercase">
              {t("analytics.occupancyCapacity", "OCCUPANCY & UTILITY")}
            </span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-mono font-bold text-white tracking-tight">
              {statistics.hotelOccupancy}%
            </h3>
            <span className="text-[10px] text-blue-400 font-bold font-mono flex items-center gap-0.5">
              <TrendingDown className="w-3 h-3 text-red-400" /> -2.4%
            </span>
          </div>
          <p className="text-[10px] text-white/40 mt-1.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {t("analytics.suitesLoad", "25 Premium Suites tracked")}
          </p>
        </div>
      </div>

      {/* 3. Main Analytics Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Column (2 Cols) */}
        <div className="lg:col-span-2 bg-[#16191F] rounded-2xl border border-white/5 p-6 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display font-bold text-white text-base">
                📈 {t("analytics.financialYieldOverTime", "Commercial Yield Curve")}
              </h3>
              <p className="text-white/40 text-[11px] mt-0.5">
                {t("analytics.interactiveTimeHorizonDesc", "Select time scale to track gross revenue, ticket size, and booking density.")}
              </p>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Metric switcher */}
              <div className="flex bg-[#0D0E12] p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setActiveMetric("revenue")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition ${
                    activeMetric === "revenue" ? "bg-white/5 text-white" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {t("analytics.revMetric", "Revenue")}
                </button>
                <button
                  onClick={() => setActiveMetric("volume")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition ${
                    activeMetric === "volume" ? "bg-white/5 text-white" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {t("analytics.volMetric", "Volume")}
                </button>
                <button
                  onClick={() => setActiveMetric("average")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition ${
                    activeMetric === "average" ? "bg-white/5 text-white" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {t("analytics.avgMetric", "Average")}
                </button>
              </div>

              {/* Time Horizon selector */}
              <div className="flex bg-[#0D0E12] p-1 rounded-xl border border-white/5">
                {(["7d", "30d", "90d", "12m"] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition ${
                      timeRange === range ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-white/30 hover:text-white/60"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Area Chart visualization */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTabletop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBookly" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorStays" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.25)" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.25)" 
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => activeMetric === "volume" ? val : `${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#090A0D', 
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }} 
                  formatter={(value: any) => [activeMetric === "volume" ? value : `${Number(value).toLocaleString()} ₽`]}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)' }}
                />

                {activeMetric === "revenue" && (
                  <>
                    <Area 
                      type="monotone" 
                      dataKey="Restaurant Tabletop" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorTabletop)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Spa & Wellness" 
                      stroke="#0d9488" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorBookly)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="Hotel Luxury Stays" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorStays)" 
                    />
                  </>
                )}

                {activeMetric === "volume" && (
                  <Area 
                    type="monotone" 
                    dataKey="Bookings Volume" 
                    stroke="#a855f7" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="rgba(168, 85, 247, 0.05)" 
                  />
                )}

                {activeMetric === "average" && (
                  <Area 
                    type="monotone" 
                    dataKey="Average Order" 
                    stroke="#eab308" 
                    strokeWidth={2.5}
                    fillOpacity={1} 
                    fill="rgba(234, 179, 8, 0.05)" 
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Column (1 Col) */}
        <div className="bg-[#16191F] rounded-2xl border border-white/5 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-white text-base mb-1">
              🍩 {t("analytics.revenueBreakdown", "Portfolio Segment Shares")}
            </h3>
            <p className="text-white/40 text-[11px] mb-6">
              {t("analytics.segmentSharesDesc", "Review distribution of total incoming funds across business units.")}
            </p>
          </div>

          <div className="h-44 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segmentPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {segmentPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${Number(value).toLocaleString()} ₽`]}
                  contentStyle={{ backgroundColor: "#090A0D", borderColor: "rgba(255,255,255,0.08)", borderRadius: "12px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Absolute center text of donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-white/30 font-mono tracking-widest uppercase">Total Portfolio</span>
              <span className="text-base font-bold font-mono text-white">
                {(statistics.tableRev + statistics.serviceRev + statistics.stayRev).toLocaleString()} ₽
              </span>
            </div>
          </div>

          {/* Custom Legends list */}
          <div className="space-y-2 mt-4 pt-4 border-t border-white/5 text-xs">
            {segmentPieData.map((seg, idx) => {
              const total = statistics.tableRev + statistics.serviceRev + statistics.stayRev || 1;
              const percent = ((seg.value / total) * 100).toFixed(0);
              return (
                <div key={idx} className="flex items-center justify-between text-white/70">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="font-medium text-white/80">{seg.name}</span>
                  </div>
                  <div className="font-mono text-right">
                    <span className="text-white/50 mr-2">{percent}%</span>
                    <span className="font-bold text-white">{seg.value.toLocaleString()} ₽</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Hourly Demand & Performance Ranking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Peak Demand Hours BarChart */}
        <div className="bg-[#16191F] rounded-2xl border border-white/5 p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="font-display font-bold text-white text-base">
              ⏰ {t("analytics.busyTimesTitle", "Peak Hours & Capacity Utilization")}
            </h3>
            <p className="text-white/40 text-[11px]">
              {t("analytics.busyTimesDesc", "Average facility capacity utilization across critical operational windows.")}
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakLoadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#090A0D", borderColor: "rgba(255,255,255,0.08)", borderRadius: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "10px" }} />
                <Bar dataKey="Capacity Utilization" name="% Busy Rate" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Booking Frequency" name="Avg Bookings Count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Services List */}
        <div className="bg-[#16191F] rounded-2xl border border-white/5 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-display font-bold text-white text-base mb-1">
              🏆 {t("analytics.topPerformingTitle", "Top Revenue Generating Services")}
            </h3>
            <p className="text-white/40 text-[11px] mb-4">
              {t("analytics.topPerformingDesc", "Ranking of elite accommodations and treatments by absolute monthly turnover.")}
            </p>

            <div className="space-y-3.5">
              {topServicesData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 font-mono font-bold text-xs flex items-center justify-center border border-indigo-500/20">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-xs text-white block">{item.name}</span>
                      <span className="text-[9px] font-mono text-white/40 uppercase">{item.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-teal-400 block">{item.revenue.toLocaleString()} ₽</span>
                    <span className="text-[10px] text-white/40 font-mono">{item.bookings} reservations</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pt-3 border-t border-white/5 mt-4">
            <button
              onClick={() => onTabChange("bookly")}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 justify-center mx-auto hover:underline"
            >
              Configure Service Catalogs & Prices <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. What-If Financial Simulator & AI strategic adviser */}
      <div className="bg-[#111318] border border-indigo-500/10 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle accent background decoration */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Sliders Input Panel */}
          <div className="flex-1 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-mono tracking-wider uppercase mb-3">
                <Sliders className="w-3.5 h-3.5" />
                {t("simulator.financialBadge", "YIELD ENGINE SIMULATOR")}
              </div>
              <h3 className="font-display font-bold text-white text-xl">
                🎛️ {t("simulator.title", "Revenue Growth & Pricing Elasticity Simulator")}
              </h3>
              <p className="text-white/50 text-xs mt-1">
                {t("simulator.desc", "Adjust pricing strategies, operational reservation targets, and occupancy rates to instantly simulate projected growth models.")}
              </p>
            </div>

            {/* Slider 1: Pricing adjustment */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white/80">{t("simulator.priceMultiplier", "Average Price Adjustment")}</span>
                <span className="font-mono font-bold text-teal-400">
                  {priceMultiplier === 1.0 ? "Baseline (1.0x)" : priceMultiplier > 1 ? `+${Math.round((priceMultiplier - 1) * 100)}%` : `-${Math.round((1 - priceMultiplier) * 100)}%`}
                </span>
              </div>
              <input 
                type="range" 
                min="0.8" 
                max="1.3" 
                step="0.05"
                value={priceMultiplier}
                onChange={e => setPriceMultiplier(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>-20% Promo Discount</span>
                <span>Standard</span>
                <span>+30% Luxury Premium</span>
              </div>
            </div>

            {/* Slider 2: Daily Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white/80">{t("simulator.bookingsVolume", "Target Daily Reservations")}</span>
                <span className="font-mono font-bold text-teal-400">{volumeTarget} bookings/day</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                step="5"
                value={volumeTarget}
                onChange={e => setVolumeTarget(parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>10 (Low Season)</span>
                <span>50 (Moderate load)</span>
                <span>100 (Max Capacity)</span>
              </div>
            </div>

            {/* Slider 3: Hotel Occupancy Goal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white/80">{t("simulator.staysOccupancy", "Target Suites Occupancy")}</span>
                <span className="font-mono font-bold text-teal-400">{occupancyGoal}%</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="100" 
                step="5"
                value={occupancyGoal}
                onChange={e => setOccupancyGoal(parseInt(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/30 font-mono">
                <span>20% (Low)</span>
                <span>60% (Average)</span>
                <span>100% (Fully Booked)</span>
              </div>
            </div>
          </div>

          {/* Outputs & Gemini Advisor Panel */}
          <div className="w-full lg:w-[420px] bg-white/[0.01] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Dynamic Simulated Calculations */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">{t("simulator.estimatedMonthlyRev", "ESTIMATED MONTHLY REVENUE")}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    {simulatedResults.percentageGrowth >= 0 ? "+" : ""}{simulatedResults.percentageGrowth.toFixed(1)}%
                  </span>
                </div>
                <div className="text-3xl font-mono font-bold text-white tracking-tight">
                  {simulatedResults.estimatedRevenue.toLocaleString()} ₽
                </div>
                
                {/* Simulated Net Profit impact */}
                <div className="pt-3 border-t border-white/[0.03] flex items-center justify-between text-xs">
                  <span className="text-white/40">{t("simulator.netProfitImpact", "Net Profit impact:")}</span>
                  <span className={`font-mono font-bold ${simulatedResults.profitChange >= 0 ? "text-teal-400" : "text-red-400"}`}>
                    {simulatedResults.profitChange >= 0 ? "+" : ""}{simulatedResults.profitChange.toLocaleString()} ₽
                  </span>
                </div>
              </div>

              {/* Strategical Advice Panel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Gemini Strategy Advisor</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase text-indigo-300 px-2 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20">Active Grounding</span>
                </div>

                <AnimatePresence mode="wait">
                  {adviserLoading ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-12 flex flex-col items-center justify-center text-center space-y-3"
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      <p className="text-xs text-white/50 font-mono">Analyzing elasticity ratios with Gemini 3.5...</p>
                    </motion.div>
                  ) : adviserAdvice ? (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-xs text-white/80 leading-relaxed bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4.5 space-y-2.5 max-h-[160px] overflow-y-auto custom-scrollbar"
                    >
                      <p className="whitespace-pre-line text-[11px] leading-relaxed italic text-white/90">
                        «{adviserAdvice}»
                      </p>
                    </motion.div>
                  ) : (
                    <div className="text-center py-10 bg-white/[0.01] border border-dashed border-white/5 rounded-xl">
                      <p className="text-xs text-white/30 font-medium px-4">
                        Request Gemini dynamic analysis to optimize service scheduling, dynamic margins, and seasonal load balancing.
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Run Strategic Advisor Button */}
            <button
              onClick={fetchStrategicAdvice}
              disabled={adviserLoading}
              className="w-full mt-5 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              {adviserLoading ? "Processing Elasticity..." : "Consult Gemini Advisor"}
            </button>
          </div>
        </div>
      </div>

      {/* 6. Filterable & Sortable Ledger Table */}
      <div className="bg-[#16191F] rounded-3xl border border-white/5 p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h3 className="font-display font-bold text-white text-base">
              📋 {t("analytics.ledgerTitle", "Audit Ledger & Yield Register")}
            </h3>
            <p className="text-white/40 text-[11px]">
              {t("analytics.ledgerDesc", "Search, filter, and audit full booking transaction histories across all active business centers.")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ledger..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#0D0E12] border border-white/5 text-white placeholder-white/20 text-xs rounded-xl focus:border-indigo-500 outline-none w-52 transition-all"
              />
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl text-xs border border-white/10 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              {t("analytics.exportCsv", "Export CSV")}
            </button>
          </div>
        </div>

        {/* Categories togglers & Status tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs">
          {/* Categories Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/40 mr-1.5 font-medium">{t("analytics.filterSource", "Categories:")}</span>
            <button
              onClick={() => toggleCategory("tabletop")}
              className={`px-3 py-1.5 rounded-lg border transition text-[11px] font-medium flex items-center gap-1.5 ${
                selectedCategories.tabletop 
                  ? "bg-orange-500/10 border-orange-500/30 text-orange-400" 
                  : "bg-transparent border-white/5 text-white/30 hover:text-white/60"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> Restaurant
            </button>
            <button
              onClick={() => toggleCategory("bookly")}
              className={`px-3 py-1.5 rounded-lg border transition text-[11px] font-medium flex items-center gap-1.5 ${
                selectedCategories.bookly 
                  ? "bg-teal-500/10 border-teal-500/30 text-teal-400" 
                  : "bg-transparent border-white/5 text-white/30 hover:text-white/60"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" /> Salon
            </button>
            <button
              onClick={() => toggleCategory("stays")}
              className={`px-3 py-1.5 rounded-lg border transition text-[11px] font-medium flex items-center gap-1.5 ${
                selectedCategories.stays 
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-400" 
                  : "bg-transparent border-white/5 text-white/30 hover:text-white/60"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Stays Hotel
            </button>
          </div>

          {/* Status filtering tabs */}
          <div className="flex items-center gap-2 bg-[#0D0E12] p-1 rounded-xl border border-white/5 self-start">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                statusFilter === "all" ? "bg-white/5 text-white" : "text-white/40 hover:text-white/70"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("confirmed")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                statusFilter === "confirmed" ? "bg-emerald-500/10 text-emerald-400" : "text-white/40 hover:text-white/70"
              }`}
            >
              Confirmed
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                statusFilter === "pending" ? "bg-amber-500/10 text-amber-400" : "text-white/40 hover:text-white/70"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("cancelled")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition ${
                statusFilter === "cancelled" ? "bg-red-500/10 text-red-400" : "text-white/40 hover:text-white/70"
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Ledger Table rendering */}
        <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0D0E12]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-mono tracking-wider uppercase text-white/40 bg-white/[0.01]">
                <th 
                  className="p-3.5 pl-4 cursor-pointer hover:text-white transition"
                  onClick={() => { setSortBy("date"); setSortOrder(prev => prev === "asc" ? "desc" : "asc"); }}
                >
                  Date {sortBy === "date" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th 
                  className="p-3.5 cursor-pointer hover:text-white transition"
                  onClick={() => { setSortBy("client"); setSortOrder(prev => prev === "asc" ? "desc" : "asc"); }}
                >
                  Client {sortBy === "client" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th 
                  className="p-3.5 cursor-pointer hover:text-white transition"
                  onClick={() => { setSortBy("category"); setSortOrder(prev => prev === "asc" ? "desc" : "asc"); }}
                >
                  Category {sortBy === "category" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className="p-3.5">Service / Room</th>
                <th className="p-3.5">Details</th>
                <th 
                  className="p-3.5 cursor-pointer hover:text-white transition text-right pr-4"
                  onClick={() => { setSortBy("revenue"); setSortOrder(prev => prev === "asc" ? "desc" : "asc"); }}
                >
                  Cost/Revenue {sortBy === "revenue" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                </th>
                <th className="p-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx, idx) => {
                  return (
                    <tr 
                      key={idx} 
                      className="border-b border-white/[0.03] text-xs text-white/80 hover:bg-white/[0.01] transition-colors"
                    >
                      <td className="p-3.5 pl-4 font-mono font-medium whitespace-nowrap">
                        {tx.date}
                        <span className="block text-[10px] text-white/30 font-normal">{tx.time}</span>
                      </td>
                      <td className="p-3.5 font-semibold text-white whitespace-nowrap">
                        {tx.clientName}
                        <span className="block text-[9px] font-mono text-white/40 font-normal">ID: {tx.userId}</span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold font-mono ${
                          tx.type === "table" 
                            ? "text-orange-400" 
                            : tx.type === "service" 
                              ? "text-teal-400" 
                              : "text-blue-400"
                        }`}>
                          <span className={`w-1 h-1 rounded-full ${
                            tx.type === "table" 
                              ? "bg-orange-500" 
                              : tx.type === "service" 
                                ? "bg-teal-500" 
                                : "bg-blue-500"
                          }`} />
                          {tx.categoryName}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-white max-w-[180px] truncate" title={tx.itemName}>
                        {tx.itemName}
                      </td>
                      <td className="p-3.5 text-white/50 max-w-[200px] truncate" title={tx.detail}>
                        {tx.detail}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-white text-right pr-4 whitespace-nowrap">
                        {tx.revenue.toLocaleString()} ₽
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${
                          tx.status === "confirmed" 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : tx.status === "pending"
                              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                              : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-xs text-white/30 font-medium uppercase font-mono">
                    No transactions matching filter criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
