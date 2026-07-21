import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  MapPin, 
  Star, 
  Wifi, 
  Tv, 
  Wind, 
  Car, 
  Coffee, 
  Shield, 
  CalendarDays, 
  Users, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  Sliders, 
  Bed, 
  Plus, 
  Sparkles,
  Info,
  Hotel as HotelIcon
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Hotel, Room, HotelBooking, User } from "../types";

interface StayBookingModuleProps {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  hotels: Hotel[];
  rooms: Room[];
  hotelBookings: HotelBooking[];
  setHotelBookings: React.Dispatch<React.SetStateAction<HotelBooking[]>>;
}

export default function StayBookingModule({
  user,
  setUser,
  hotels,
  rooms,
  hotelBookings,
  setHotelBookings
}: StayBookingModuleProps) {
  const { t, i18n } = useTranslation();
  
  // Tab states: 'client' (Search & Book) vs 'pms' (Admin Timeline Matrix)
  const [activeTab, setActiveTab] = useState<'client' | 'pms'>('client');
  
  // Search state
  const [selectedDestination, setSelectedDestination] = useState<string>("all");
  const [checkInDate, setCheckInDate] = useState<string>("2026-07-15");
  const [checkOutDate, setCheckOutDate] = useState<string>("2026-07-18");
  const [guestCount, setGuestCount] = useState<number>(2);
  const [searchTriggered, setSearchTriggered] = useState<boolean>(false);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>(hotels);

  // Carousel images index mapping: hotelId -> current image index
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({});

  // Active expanded hotel (null means none, otherwise hotel ID)
  const [expandedHotelId, setExpandedHotelId] = useState<string | null>("hotel-1");

  // Booking drawer / checkout modal
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | null>(null);
  const [selectedHotelForBooking, setSelectedHotelForBooking] = useState<Hotel | null>(null);
  const [checkoutNights, setCheckoutNights] = useState<number>(3);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [authHoldOnly, setAuthHoldOnly] = useState<boolean>(false); // 1-night deposit hold vs full prepayment
  const [stripeSchemaVisible, setStripeSchemaVisible] = useState<boolean>(true);

  // PMS Interactive timeline states (X-axis dates from July 11 to July 22, 2026)
  const pmsDates = [
    "2026-07-11", "2026-07-12", "2026-07-13", "2026-07-14", "2026-07-15", 
    "2026-07-16", "2026-07-17", "2026-07-18", "2026-07-19", "2026-07-20", 
    "2026-07-21", "2026-07-22"
  ];
  const [pmsSelectedHotel, setPmsSelectedHotel] = useState<string>("hotel-1");
  const [showPmsQuickBook, setShowPmsQuickBook] = useState<boolean>(false);
  const [selectedPmsRoom, setSelectedPmsRoom] = useState<string>("");
  const [pmsCheckIn, setPmsCheckIn] = useState<string>("2026-07-15");
  const [pmsCheckOut, setPmsCheckOut] = useState<string>("2026-07-17");
  const [pmsGuestName, setPmsGuestName] = useState<string>("");

  // Filter hotels based on destination / amenities
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Dates validation
    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      toast.error(
        i18n.language === "ru" 
          ? "Дата выезда должна быть позже даты заезда" 
          : "Check-out date must be after check-in date"
      );
      return;
    }

    let results = hotels;
    if (selectedDestination !== "all") {
      results = hotels.filter(h => h.id === selectedDestination);
    }
    
    setFilteredHotels(results);
    setSearchTriggered(true);
    toast.success(
      i18n.language === "ru" 
        ? `Найдено отелей: ${results.length}` 
        : `Found ${results.length} available hotels`
    );
  };

  // Calculate checkout nights whenever dates change
  useEffect(() => {
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (end > start) {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setCheckoutNights(diffDays);
    } else {
      setCheckoutNights(1);
    }
  }, [checkInDate, checkOutDate]);

  // Image slider handlers
  const prevImage = (hotelId: string, maxImages: number) => {
    setCarouselIndex(prev => {
      const current = prev[hotelId] || 0;
      return { ...prev, [hotelId]: current === 0 ? maxImages - 1 : current - 1 };
    });
  };

  const nextImage = (hotelId: string, maxImages: number) => {
    setCarouselIndex(prev => {
      const current = prev[hotelId] || 0;
      return { ...prev, [hotelId]: current === maxImages - 1 ? 0 : current + 1 };
    });
  };

  // Check if a room is available for specific dates
  const isRoomAvailable = (roomId: string, checkIn: string, checkOut: string): boolean => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    
    // Check overlap with existing bookings
    return !hotelBookings.some(booking => {
      if (booking.roomId !== roomId || booking.status === "cancelled") return false;
      const bStart = new Date(booking.checkInDate);
      const bEnd = new Date(booking.checkOutDate);
      
      // Overlap formula: (start < bEnd) && (end > bStart)
      return (start < bEnd) && (end > bStart);
    });
  };

  // Dynamic Stripe payment intent schema preparation
  const getStripePayload = (room: Room, nights: number, holdOnly: boolean) => {
    const total = room.pricePerNight * nights;
    const holdAmount = room.pricePerNight; // 1-night hold deposit
    const finalAmount = holdOnly ? holdAmount : total;

    return {
      amount: finalAmount,
      currency: "rub",
      payment_method_types: ["card"],
      capture_method: holdOnly ? "manual" : "automatic", // manual = auth hold, automatic = instant capture
      metadata: {
        booking_type: "overnight_stay",
        hotel_id: room.hotelId,
        room_id: room.id,
        check_in: checkInDate,
        check_out: checkOutDate,
        nights: nights,
        guest_count: guestCount,
        user_id: user?.id || "anonymous",
        deposit_hold_only: holdOnly ? "true" : "false"
      },
      description: `OmniStay: ${room.type} (Nights: ${nights})`
    };
  };

  // Confirm booking & charge balance
  const confirmStayBooking = () => {
    if (!user) {
      toast.error(
        i18n.language === "ru" 
          ? "Пожалуйста, войдите в аккаунт, чтобы завершить бронирование." 
          : "Please log in to complete booking."
      );
      return;
    }

    if (!selectedRoomForBooking || !selectedHotelForBooking) return;

    // Check availability
    const available = isRoomAvailable(selectedRoomForBooking.id, checkInDate, checkOutDate);
    if (!available) {
      toast.error(
        i18n.language === "ru" 
          ? "Данный номер уже забронирован на выбранные даты!" 
          : "This room is already booked for the selected dates!"
      );
      return;
    }

    const pricePerNight = selectedRoomForBooking.pricePerNight;
    const totalCost = pricePerNight * checkoutNights;
    const deduction = authHoldOnly ? pricePerNight : totalCost;

    if (user.balance < deduction) {
      toast.error(
        i18n.language === "ru" 
          ? `Недостаточно средств на депозите! Необходимый баланс: ${deduction.toLocaleString()} ₽` 
          : `Insufficient funds! Required: ${deduction.toLocaleString()} ₽`
      );
      return;
    }

    // Success - subtract balance
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        balance: prev.balance - deduction
      };
    });

    const newBooking: HotelBooking = {
      id: `hbook-${Date.now()}`,
      userId: user.id,
      type: "hotel",
      hotelId: selectedHotelForBooking.id,
      hotelName: selectedHotelForBooking.name,
      roomId: selectedRoomForBooking.id,
      roomType: selectedRoomForBooking.type,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      totalGuests: guestCount,
      totalCost: totalCost,
      status: "confirmed",
      createdAt: new Date().toISOString()
    };

    setHotelBookings(prev => [newBooking, ...prev]);
    setIsCheckoutOpen(false);

    toast.success(
      i18n.language === "ru" 
        ? `Бронирование подтверждено! Списано ${deduction.toLocaleString()} ₽ (${authHoldOnly ? "Авторизация холда 1 ночи" : "Полная оплата"})` 
        : `Booking confirmed! Charged ${deduction.toLocaleString()} ₽ (${authHoldOnly ? "1-night Auth hold deposit" : "Full payment"})`
    );
  };

  // Walk-in booking from PMS interactive matrix
  const handlePmsQuickBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPmsRoom) {
      toast.error(i18n.language === "ru" ? "Выберите номер" : "Please select a room");
      return;
    }

    if (new Date(pmsCheckOut) <= new Date(pmsCheckIn)) {
      toast.error(i18n.language === "ru" ? "Дата выезда не может быть раньше даты заезда" : "Invalid checkout date");
      return;
    }

    const available = isRoomAvailable(selectedPmsRoom, pmsCheckIn, pmsCheckOut);
    if (!available) {
      toast.error(i18n.language === "ru" ? "Этот номер занят на указанные даты!" : "Selected dates conflict with existing bookings!");
      return;
    }

    const roomObj = rooms.find(r => r.id === selectedPmsRoom);
    if (!roomObj) return;

    const start = new Date(pmsCheckIn);
    const end = new Date(pmsCheckOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalCost = roomObj.pricePerNight * nights;

    const hotelObj = hotels.find(h => h.id === pmsSelectedHotel);
    if (!hotelObj) return;

    const newBooking: HotelBooking = {
      id: `pms-book-${Date.now()}`,
      userId: "user-walkin",
      type: "hotel",
      hotelId: pmsSelectedHotel,
      hotelName: hotelObj.name,
      roomId: selectedPmsRoom,
      roomType: roomObj.type,
      checkInDate: pmsCheckIn,
      checkOutDate: pmsCheckOut,
      totalGuests: 2,
      totalCost: totalCost,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      guestName: pmsGuestName || "Walk-In Guest"
    } as any;

    setHotelBookings(prev => [newBooking, ...prev]);
    setShowPmsQuickBook(false);
    setPmsGuestName("");
    toast.success(i18n.language === "ru" ? "Офлайн-бронь успешно внесена в PMS шахматку!" : "Walk-in booking successfully entered into PMS Grid!");
  };

  // Helper to find booking on a specific date for a room
  const getBookingForRoomDate = (roomId: string, dateStr: string): HotelBooking | undefined => {
    return hotelBookings.find(b => {
      if (b.roomId !== roomId || b.status === "cancelled") return false;
      const d = new Date(dateStr);
      const start = new Date(b.checkInDate);
      const end = new Date(b.checkOutDate);
      return d >= start && d < end;
    });
  };

  const getAmenitiesIcons = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi": return <Wifi className="w-3.5 h-3.5 text-teal-400" />;
      case "pool": return <Sparkles className="w-3.5 h-3.5 text-blue-400" />;
      case "spa": return <Coffee className="w-3.5 h-3.5 text-purple-400" />;
      case "gym": return <Sliders className="w-3.5 h-3.5 text-amber-400" />;
      case "ac": return <Wind className="w-3.5 h-3.5 text-cyan-400" />;
      case "parking": return <Car className="w-3.5 h-3.5 text-emerald-400" />;
      case "room service": return <Tv className="w-3.5 h-3.5 text-indigo-400" />;
      default: return <Shield className="w-3.5 h-3.5 text-white/50" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[10px] font-bold font-mono tracking-wider text-teal-400 bg-teal-500/10 rounded-full border border-teal-500/20 uppercase">
              Stay Booking Engine
            </span>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-white/40">
              <Clock className="w-3 h-3 text-white/30" />
              <span>JULY 2026</span>
            </div>
          </div>
          <h2 className="text-3xl font-display font-black text-white mt-1 uppercase tracking-tight flex items-center gap-2">
            <HotelIcon className="w-8 h-8 text-teal-400 stroke-[1.5]" />
            {i18n.language === "ru" ? "Бронирование Отелей" : i18n.language === "hy" ? "Հյուրանոցային Համակարգ" : "Overnight Stays"}
          </h2>
          <p className="text-xs text-white/50 max-w-xl leading-relaxed mt-0.5">
            {i18n.language === "ru" 
              ? "Эксклюзивный выбор премиальных номеров. Находите идеальные отели, бронируйте номера с авторизацией холдов Stripe или управляйте сеткой занятости."
              : "Discover elite hospitality. Secure bespoke rooms with dynamic Stripe Auth holds, or optimize daily hotel availability via the integrated PMS timeline Grid."}
          </p>
        </div>

        {/* Dynamic Controls Toggler */}
        <div className="flex bg-[#090A0D] border border-white/5 p-1 rounded-xl shrink-0 self-start md:self-center">
          <button
            onClick={() => setActiveTab("client")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "client"
                ? "bg-teal-500 text-black shadow-md shadow-teal-500/10"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Bed className="w-4 h-4" />
            {i18n.language === "ru" ? "Клиентский поиск" : "Search & Book"}
          </button>
          
          <button
            onClick={() => setActiveTab("pms")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "pms"
                ? "bg-teal-500 text-black shadow-md shadow-teal-500/10"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Sliders className="w-4 h-4" />
            {i18n.language === "ru" ? "Таблица PMS (Админ)" : "PMS Occupancy Board"}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "client" ? (
          <motion.div
            key="client-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* 2. Client View: Search & Filters */}
            <form onSubmit={handleSearch} className="bg-[#12141A] border border-white/5 rounded-2xl p-5 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end relative overflow-hidden">
              <div className="absolute -top-16 -left-16 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div>
                <label className="block text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2">
                  {i18n.language === "ru" ? "Выбрать отель / Направление" : "Select Hotel / Destination"}
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <select
                    value={selectedDestination}
                    onChange={(e) => setSelectedDestination(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white text-xs font-bold focus:outline-none focus:border-teal-500 transition appearance-none"
                  >
                    <option value="all">{i18n.language === "ru" ? "Все отели (Москва)" : "All Hotels"}</option>
                    {hotels.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2">
                  {t('stays.checkIn')}
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="date"
                    min="2026-07-01"
                    max="2026-08-31"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white text-xs font-mono font-bold focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2">
                  {t('stays.checkOut')}
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type="date"
                    min="2026-07-01"
                    max="2026-08-31"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white text-xs font-mono font-bold focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold tracking-wider text-white/50 uppercase mb-2">
                    {i18n.language === "ru" ? "Взрослые / Дети" : "Guests"}
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white text-xs font-bold focus:outline-none focus:border-teal-500 transition appearance-none"
                    >
                      <option value={1}>1 {i18n.language === "ru" ? "Гость" : "Guest"}</option>
                      <option value={2}>2 {i18n.language === "ru" ? "Гостя" : "Guests"}</option>
                      <option value={3}>3 {i18n.language === "ru" ? "Гостя" : "Guests"}</option>
                      <option value={4}>4 {i18n.language === "ru" ? "Гостя" : "Guests"}</option>
                      <option value={5}>5 {i18n.language === "ru" ? "Гостей" : "Guests"}</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs rounded-xl transition shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 h-[41px]"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden lg:inline">{t('stays.searchHotels')}</span>
                </button>
              </div>
            </form>

            {/* 3. Hotel Cards Grid */}
            <div className="space-y-6">
              {filteredHotels.map((hotel) => {
                const currentImgIdx = carouselIndex[hotel.id] || 0;
                const isExpanded = expandedHotelId === hotel.id;
                const hotelRooms = rooms.filter(r => r.hotelId === hotel.id);

                return (
                  <div
                    key={hotel.id}
                    className="bg-[#12141A] border border-white/5 rounded-2xl overflow-hidden shadow-xl transition-all duration-300"
                  >
                    {/* Top Row: Hotel summary */}
                    <div className="flex flex-col lg:flex-row">
                      {/* Image block */}
                      <div className="relative lg:w-96 h-64 shrink-0 overflow-hidden bg-black/40">
                        <img
                          src={hotel.images[currentImgIdx]}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Shadow Gradient overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                        {/* Slide selectors */}
                        <button
                          onClick={() => prevImage(hotel.id, hotel.images.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white transition-all cursor-pointer border border-white/5"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => nextImage(hotel.id, hotel.images.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white transition-all cursor-pointer border border-white/5"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Image index indicators */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {hotel.images.map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 rounded-full transition-all ${
                                i === currentImgIdx ? "w-4 bg-teal-400" : "w-1 bg-white/40"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Info block */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-400 font-mono bg-amber-400/5 px-2.5 py-1 rounded-lg border border-amber-400/10">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              <span>{hotel.rating}</span>
                            </span>
                            
                            <div className="flex flex-wrap gap-1">
                              {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                                <div
                                  key={idx}
                                  className="p-1 px-2 text-[10px] font-bold text-white/60 bg-white/[0.03] border border-white/5 rounded-lg flex items-center gap-1.5"
                                >
                                  {getAmenitiesIcons(amenity)}
                                  <span>{amenity}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <h3 className="text-xl font-display font-black text-white leading-tight uppercase tracking-tight">
                            {hotel.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-white/40 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span>{hotel.address}</span>
                          </div>
                          
                          <p className="text-xs text-white/60 leading-relaxed mt-4">
                            {hotel.description}
                          </p>
                        </div>

                        {/* Expand Button */}
                        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-white/40">
                            {i18n.language === "ru" ? `ДОСТУПНО НОМЕРОВ: ${hotelRooms.length}` : `AVAILABLE ROOMS: ${hotelRooms.length}`}
                          </span>
                          <button
                            onClick={() => setExpandedHotelId(isExpanded ? null : hotel.id)}
                            className="text-xs font-bold text-teal-400 hover:text-teal-300 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? (i18n.language === "ru" ? "Скрыть номера" : "Hide Rooms") : (i18n.language === "ru" ? "Показать доступные номера" : "View Rooms")}</span>
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Room Grid (Expands smoothly) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden bg-[#0A0B0E] border-t border-white/5"
                        >
                          <div className="p-6 space-y-4">
                            <h4 className="text-[10px] font-bold tracking-wider text-white/40 uppercase mb-1">
                              {i18n.language === "ru" ? "Доступные варианты размещения" : "Select Room Package"}
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {hotelRooms.map((room) => {
                                const isAvailable = isRoomAvailable(room.id, checkInDate, checkOutDate);
                                
                                return (
                                  <div
                                    key={room.id}
                                    className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                                      isAvailable
                                        ? "bg-[#12141A] border-white/5 hover:border-teal-500/30"
                                        : "bg-white/[0.01] border-dashed border-white/5 opacity-50"
                                    }`}
                                  >
                                    <div>
                                      <div className="flex justify-between items-start mb-2">
                                        <h5 className="font-display font-bold text-sm text-white uppercase leading-snug">
                                          {room.type}
                                        </h5>
                                        {isAvailable ? (
                                          <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded">
                                            {i18n.language === "ru" ? "Свободен" : "Available"}
                                          </span>
                                        ) : (
                                          <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded">
                                            {i18n.language === "ru" ? "Занят" : "Reserved"}
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-3 text-[11px] text-white/50 mb-4">
                                        <div className="flex items-center gap-1 font-mono">
                                          <Users className="w-3.5 h-3.5" />
                                          <span>x{room.capacity}</span>
                                        </div>
                                        <div className="flex items-center gap-1 font-mono">
                                          <Bed className="w-3.5 h-3.5" />
                                          <span>{room.bedsCount} {i18n.language === "ru" ? "кровати" : "beds"}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="pt-3 border-t border-white/[0.03] flex items-center justify-between">
                                      <div>
                                        <span className="text-[10px] text-white/40 block leading-tight">
                                          {i18n.language === "ru" ? "Цена за ночь" : "Per Night"}
                                        </span>
                                        <span className="text-sm font-bold text-white font-mono">
                                          {room.pricePerNight.toLocaleString()} ₽
                                        </span>
                                      </div>

                                      <button
                                        onClick={() => {
                                          if (!isAvailable) return;
                                          setSelectedRoomForBooking(room);
                                          setSelectedHotelForBooking(hotel);
                                          setIsCheckoutOpen(true);
                                        }}
                                        disabled={!isAvailable}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                          isAvailable
                                            ? "bg-teal-500 hover:bg-teal-400 text-black shadow-md shadow-teal-500/10 cursor-pointer"
                                            : "bg-white/5 text-white/20 cursor-not-allowed"
                                        }`}
                                      >
                                        <span>{t('stays.bookRoom')}</span>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pms-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* 4. PMS Interactive Board: Admin Hotel Selection Header */}
            <div className="bg-[#12141A] border border-white/5 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sliders className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-tight">
                    {i18n.language === "ru" ? "PMS Шахматка Занятости" : "Interactive Property Management Grid"}
                  </h3>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                    {i18n.language === "ru" ? "Управление сеткой номеров в реальном времени. Кликните, чтобы добавить офлайн-бронь." : "Real-time room occupancy flow. Click empty cells to spawn manual walk-in hotel bookings."}
                  </p>
                </div>
              </div>

              {/* Selector */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={pmsSelectedHotel}
                  onChange={(e) => setPmsSelectedHotel(e.target.value)}
                  className="w-full md:w-56 px-4 py-2 rounded-xl border border-white/10 bg-[#090A0D] text-white text-xs font-bold focus:outline-none focus:border-teal-500 transition appearance-none"
                >
                  {hotels.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    const hotelRooms = rooms.filter(r => r.hotelId === pmsSelectedHotel);
                    if (hotelRooms.length > 0) {
                      setSelectedPmsRoom(hotelRooms[0].id);
                    }
                    setShowPmsQuickBook(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl transition flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{i18n.language === "ru" ? "Разместить гостя" : "Walk-In"}</span>
                </button>
              </div>
            </div>

            {/* Matrix Timeline Container */}
            <div className="bg-[#12141A] border border-white/5 rounded-2xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[900px]">
                  {/* Timeline Dates Header */}
                  <thead>
                    <tr className="border-b border-white/5 bg-black/40">
                      <th className="p-4 text-left text-[10px] font-bold tracking-wider text-white/40 uppercase font-mono w-56 sticky left-0 bg-[#12141A] z-10">
                        {i18n.language === "ru" ? "Номер / Категория" : "Room Unit"}
                      </th>
                      {pmsDates.map((dateStr, idx) => {
                        const dateObj = new Date(dateStr);
                        const dayName = dateObj.toLocaleDateString(i18n.language === "ru" ? "ru-RU" : "en-US", { weekday: "short" });
                        const isToday = dateStr === "2026-07-15"; // simulated current focal date

                        return (
                          <th
                            key={idx}
                            className={`p-3 text-center border-l border-white/5 font-mono text-[10px] min-w-[70px] ${
                              isToday ? "bg-teal-500/10 text-teal-400 font-bold" : "text-white/50"
                            }`}
                          >
                            <span className="block text-[8px] uppercase font-sans tracking-widest text-white/30">{dayName}</span>
                            <span className="block text-xs mt-0.5">{dateObj.getDate()}</span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  {/* Rooms Matrix Y-axis mapping */}
                  <tbody>
                    {rooms.filter(r => r.hotelId === pmsSelectedHotel).map((room) => {
                      return (
                        <tr key={room.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                          <td className="p-4 sticky left-0 bg-[#12141A] border-r border-white/5 font-display text-xs font-bold text-white leading-tight z-10">
                            <span className="block uppercase tracking-tight text-[11px] text-white">{room.type}</span>
                            <span className="block text-[9px] font-mono font-semibold text-white/40 mt-1 uppercase">
                              ID: {room.id} • {room.pricePerNight.toLocaleString()} ₽ / {i18n.language === "ru" ? "ночь" : "nt"}
                            </span>
                          </td>

                          {pmsDates.map((dateStr, idx) => {
                            const booking = getBookingForRoomDate(room.id, dateStr);
                            const isToday = dateStr === "2026-07-15";

                            // Determine status & display styles if booked
                            if (booking) {
                              const isStart = booking.checkInDate === dateStr;
                              const isEnd = booking.checkOutDate === dateStr;
                              
                              // Create nice visual span representing booking flow
                              const guestLabel = (booking as any).guestName || (booking.userId === "user-1" ? "Мария Смирнова (Verified)" : booking.userId === "user-2" ? "Алексей Иванов (VIP)" : "Walk-In Guest");

                              return (
                                <td
                                  key={idx}
                                  className={`p-1.5 text-center border-l border-white/5 font-mono text-[10px] align-middle ${
                                    isToday ? "bg-teal-500/5" : ""
                                  }`}
                                >
                                  <div
                                    className={`py-2 px-1 text-[9px] font-bold text-black rounded-lg shadow-sm truncate ${
                                      booking.userId === "user-1"
                                        ? "bg-gradient-to-r from-teal-400 to-emerald-300"
                                        : booking.userId === "user-2"
                                          ? "bg-gradient-to-r from-amber-400 to-orange-300"
                                          : "bg-gradient-to-r from-indigo-400 to-purple-300"
                                    }`}
                                    title={`${guestLabel} (${booking.checkInDate} - ${booking.checkOutDate})`}
                                  >
                                    {isStart ? `🔑 ${guestLabel.split(" ")[0]}` : "•"}
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={idx}
                                onClick={() => {
                                  setSelectedPmsRoom(room.id);
                                  setPmsCheckIn(dateStr);
                                  // Auto set 2 nights checkout
                                  const checkOutDateObj = new Date(dateStr);
                                  checkOutDateObj.setDate(checkOutDateObj.getDate() + 2);
                                  const checkOutStr = `${checkOutDateObj.getFullYear()}-${String(checkOutDateObj.getMonth() + 1).padStart(2, "0")}-${String(checkOutDateObj.getDate()).padStart(2, "0")}`;
                                  setPmsCheckOut(checkOutStr);
                                  setShowPmsQuickBook(true);
                                }}
                                className={`p-3 text-center border-l border-white/5 font-mono text-[10px] hover:bg-teal-500/10 cursor-pointer text-white/20 transition-all ${
                                  isToday ? "bg-teal-500/5" : ""
                                }`}
                                title="Click to book room"
                              >
                                <span className="opacity-0 group-hover:opacity-100">+</span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Legend row */}
              <div className="p-4 bg-black/30 border-t border-white/5 flex flex-wrap gap-4 items-center justify-between text-[10px] font-mono text-white/50">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-gradient-to-r from-teal-400 to-emerald-300 rounded" />
                    <span>Мария Смирнова (Verified)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-300 rounded" />
                    <span>Алексей Иванов (VIP Customer)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-300 rounded" />
                    <span>Walk-In Offline bookings</span>
                  </div>
                </div>

                <div className="text-right">
                  <span>Current Focal Date: <strong className="text-teal-400">July 15, 2026</strong></span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SIDE DRAWER: Elite Stripe Prepayment Checkout Panel */}
      <AnimatePresence>
        {isCheckoutOpen && selectedRoomForBooking && selectedHotelForBooking && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs"
            />

            {/* Slide-over panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-xl bg-[#0F1115] border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <div>
                    <span className="text-[10px] font-bold font-mono tracking-wider text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded uppercase">
                      Confirming Overnight Stay
                    </span>
                    <h3 className="text-lg font-display font-black text-white mt-1 uppercase tracking-tight">
                      {i18n.language === "ru" ? "Оплата и Оформление" : "Stripe Checkout & Auth"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCheckoutOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Hotel & Room Brief Card */}
                  <div className="bg-[#12141A] border border-white/5 rounded-xl p-4 flex gap-4">
                    <img
                      src={selectedHotelForBooking.images[0]}
                      alt={selectedHotelForBooking.name}
                      className="w-20 h-20 rounded-lg object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-display font-bold text-sm text-white uppercase">{selectedHotelForBooking.name}</h4>
                      <p className="text-xs text-white/40 leading-snug mt-0.5">{selectedHotelForBooking.address}</p>
                      
                      <div className="mt-2 text-xs font-semibold text-teal-400 bg-teal-500/5 border border-teal-500/10 rounded-lg px-2 py-0.5 inline-block uppercase">
                        {selectedRoomForBooking.type}
                      </div>
                    </div>
                  </div>

                  {/* Booking parameters overview */}
                  <div className="bg-[#12141A] border border-white/5 rounded-xl p-4 space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center text-white/50">
                      <span>{i18n.language === "ru" ? "ВРЕМЯ ЗАЕЗДА:" : "CHECK-IN:"}</span>
                      <strong className="text-white font-bold">{checkInDate} (14:00)</strong>
                    </div>
                    <div className="flex justify-between items-center text-white/50">
                      <span>{i18n.language === "ru" ? "ВРЕМЯ ВЫЕЗДА:" : "CHECK-OUT:"}</span>
                      <strong className="text-white font-bold">{checkOutDate} (12:00)</strong>
                    </div>
                    <div className="flex justify-between items-center text-white/50">
                      <span>{i18n.language === "ru" ? "КОЛИЧЕСТВО НОЧЕЙ:" : "TOTAL NIGHTS:"}</span>
                      <strong className="text-teal-400 font-bold">{checkoutNights} {checkoutNights === 1 ? "night" : "nights"}</strong>
                    </div>
                    <div className="flex justify-between items-center text-white/50">
                      <span>{i18n.language === "ru" ? "КОЛИЧЕСТВО ГОСТЕЙ:" : "TOTAL GUESTS:"}</span>
                      <strong className="text-white font-bold">{guestCount}</strong>
                    </div>
                  </div>

                  {/* Payment capture options */}
                  <div className="bg-[#12141A] border border-white/5 rounded-xl p-5 space-y-4">
                    <h4 className="text-[10px] font-bold tracking-wider text-white/50 uppercase">
                      {i18n.language === "ru" ? "Параметры транзакции Stripe" : "Stripe Capture Preference"}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAuthHoldOnly(false)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          !authHoldOnly
                            ? "bg-teal-500/10 border-teal-500 text-white"
                            : "bg-[#090A0D] border-white/5 text-white/40 hover:text-white"
                        }`}
                      >
                        <span className="block font-bold text-xs uppercase">{i18n.language === "ru" ? "Полная оплата" : "Prepayment"}</span>
                        <span className="block text-[9px] mt-1 leading-snug">{i18n.language === "ru" ? "Полное списание за проживание" : "Capture 100% stay cost instantly"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAuthHoldOnly(true)}
                        className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                          authHoldOnly
                            ? "bg-amber-500/10 border-amber-500 text-white"
                            : "bg-[#090A0D] border-white/5 text-white/40 hover:text-white"
                        }`}
                      >
                        <span className="block font-bold text-xs uppercase">{i18n.language === "ru" ? "Депозит 1 ночь" : "Auth Hold"}</span>
                        <span className="block text-[9px] mt-1 leading-snug">{i18n.language === "ru" ? "Холдирование только стоимости 1 ночи" : "Authorize 1-night deposit hold only"}</span>
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-white/5 font-mono text-xs">
                      <span className="text-white/50">{i18n.language === "ru" ? "Сумма к холдированию / списанию:" : "Amount to charge/hold:"}</span>
                      <strong className="text-white font-bold text-sm">
                        {(authHoldOnly ? selectedRoomForBooking.pricePerNight : selectedRoomForBooking.pricePerNight * checkoutNights).toLocaleString()} ₽
                      </strong>
                    </div>
                  </div>

                  {/* Schema breakdown code blocks */}
                  <div>
                    <button
                      onClick={() => setStripeSchemaVisible(!stripeSchemaVisible)}
                      className="text-[10px] font-bold text-white/50 hover:text-white flex items-center gap-1 uppercase mb-2 cursor-pointer font-mono"
                    >
                      <span>{stripeSchemaVisible ? "[-] Hide Stripe Intent Payload" : "[+] Show Stripe Intent Payload"}</span>
                    </button>

                    <AnimatePresence>
                      {stripeSchemaVisible && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <pre className="p-4 rounded-xl bg-black/60 text-[10px] font-mono text-teal-300 leading-relaxed overflow-x-auto max-h-56 border border-white/5">
                            {JSON.stringify(getStripePayload(selectedRoomForBooking, checkoutNights, authHoldOnly), null, 2)}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Checkout CTA footer */}
              <div className="pt-6 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-white/40 block leading-tight">{i18n.language === "ru" ? "Итоговая стоимость проживания" : "Full Stay Cost"}</span>
                    <span className="text-xl font-bold text-white font-mono">
                      {(selectedRoomForBooking.pricePerNight * checkoutNights).toLocaleString()} ₽
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-white/40 block leading-tight">{i18n.language === "ru" ? "Ваш баланс" : "Your Deposit Balance"}</span>
                    <span className="text-sm font-bold text-teal-400 font-mono">
                      {user?.balance.toLocaleString()} ₽
                    </span>
                  </div>
                </div>

                <button
                  onClick={confirmStayBooking}
                  className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-black font-black uppercase text-xs rounded-xl transition-all shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{i18n.language === "ru" ? "Подтвердить бронирование в Stripe" : "Secure booking with Stripe"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Admin PMS QuickBook Walk-In Modal */}
      <AnimatePresence>
        {showPmsQuickBook && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#16191F] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowPmsQuickBook(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 rotate-90" />
              </button>
              
              <h3 className="text-md font-display font-black text-white uppercase tracking-tight flex items-center gap-2 mb-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                {i18n.language === "ru" ? "Заселить гостя (Offline Walk-In)" : "Register Offline Walk-In"}
              </h3>
              <p className="text-[11px] text-white/50 mb-4 leading-normal">
                {i18n.language === "ru" ? "Внесите бронирование напрямую в сетку номеров. Оплата будет зафиксирована офлайн." : "Manual dashboard reservation manager. Registers offline cash/card walk-in clients into hotel state."}
              </p>

              <form onSubmit={handlePmsQuickBook} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5">{i18n.language === "ru" ? "ФИО Клиента" : "Guest Full Name"}</label>
                  <input
                    type="text"
                    required
                    value={pmsGuestName}
                    onChange={(e) => setPmsGuestName(e.target.value)}
                    placeholder={i18n.language === "ru" ? "Дмитрий Нарышкин" : "Johnathan Doe"}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white text-xs font-semibold focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5">{i18n.language === "ru" ? "Выберите номер" : "Select Room Package"}</label>
                  <select
                    value={selectedPmsRoom}
                    onChange={(e) => setSelectedPmsRoom(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#090A0D] text-white text-xs font-bold focus:outline-none focus:border-amber-500 transition appearance-none"
                  >
                    {rooms.filter(r => r.hotelId === pmsSelectedHotel).map((room) => (
                      <option key={room.id} value={room.id}>{room.type} (Unit ID: {room.id})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5">{i18n.language === "ru" ? "Заезд" : "Check-In"}</label>
                    <input
                      type="date"
                      value={pmsCheckIn}
                      onChange={(e) => setPmsCheckIn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#090A0D] text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase mb-1.5">{i18n.language === "ru" ? "Выезд" : "Check-Out"}</label>
                    <input
                      type="date"
                      value={pmsCheckOut}
                      onChange={(e) => setPmsCheckOut(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-white/10 bg-[#090A0D] text-white text-xs font-mono font-bold focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowPmsQuickBook(false)}
                    className="px-4 py-2 border border-white/10 rounded-xl text-xs text-white/60 hover:bg-white/5 hover:text-white transition cursor-pointer"
                  >
                    {t('dashboard.cancelBtn')}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    {i18n.language === "ru" ? "Разместить" : "Check-In Guest"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
