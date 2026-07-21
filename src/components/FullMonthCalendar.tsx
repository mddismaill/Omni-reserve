import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, Users, Compass, User, X, Check, Share2, Bell, Sparkles, Activity
} from 'lucide-react';
import { Booking } from '../types';

interface FullMonthCalendarProps {
  bookings: Booking[];
  theme?: 'light' | 'dark';
  user: any;
  setUser: (user: any) => void;
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  isGoogleCalendarConnected: boolean;
  syncedBookingIds: Record<string, string>;
  autoSyncToCalendar: boolean;
  isCalendarLoading: boolean;
  handleUnsyncBooking: (booking: any) => Promise<void>;
  triggerSyncBooking: (booking: any) => void;
  triggerUpcomingBookingAlert: (booking: any, isTest?: boolean) => void;
  trigger30MinBrowserNotification: (booking: Booking, isTest?: boolean) => void;
  copiedBookingId: string | null;
  handleShare: (booking: Booking) => void;
  setBookingSuccessMsg: (msg: string) => void;
}

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

export default function FullMonthCalendar({
  bookings,
  theme = 'dark',
  user,
  setUser,
  setBookings,
  isGoogleCalendarConnected,
  syncedBookingIds,
  autoSyncToCalendar,
  isCalendarLoading,
  handleUnsyncBooking,
  triggerSyncBooking,
  triggerUpcomingBookingAlert,
  trigger30MinBrowserNotification,
  copiedBookingId,
  handleShare,
  setBookingSuccessMsg
}: FullMonthCalendarProps) {
  const { t, i18n } = useTranslation();
  
  // State for current visible month in the calendar
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    // Default to July 2026 based on mock database timeline
    return new Date("2026-07-10");
  });
  
  // State for tapped/clicked day
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Helper to generate monthly grid
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    // First day of the month
    const firstDayOfMonth = new Date(year, month, 1);
    // Day of the week of first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    // Adjust Monday as start (0 = Mo, 6 = Su)
    const startOffset = (firstDayOfWeek + 6) % 7;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding days
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

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(year, month, d);
      days.push({
        dayNumber: d,
        date: currDate,
        isCurrentMonth: true,
        dateString: `${currDate.getFullYear()}-${String(currDate.getMonth() + 1).padStart(2, "0")}-${String(currDate.getDate()).padStart(2, "0")}`
      });
    }

    // Next month padding days to fill 5 or 6 rows
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

  const daysGrid = getCalendarDays();
  const selectedDayBookings = bookings.filter(b => b.date === selectedCalendarDay);

  // Quick helper to translate dynamic strings or fallback
  const isRussian = i18n.language === 'ru';
  const isArabic = i18n.language === 'ar';
  const isArmenian = i18n.language === 'hy';

  return (
    <div className="space-y-6">
      {/* Calendar view container */}
      <div className="p-4 sm:p-6 space-y-6 bg-[#16191F]/90 border border-white/5 rounded-2xl">
        {/* Month navigation and details */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const prev = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
                setCalendarMonth(prev);
                setSelectedCalendarDay(null);
              }}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/60 transition cursor-pointer"
              title={t('dashboard.prevMonthTooltip', 'Previous Month')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-display font-bold text-sm text-white capitalize min-w-[140px] text-center tracking-wide">
              {calendarMonth.toLocaleString(isArabic ? 'ar-EG' : isRussian ? 'ru-RU' : isArmenian ? 'hy-AM' : 'en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button 
              onClick={() => {
                const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
                setCalendarMonth(next);
                setSelectedCalendarDay(null);
              }}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-white/60 transition cursor-pointer"
              title={t('dashboard.nextMonthTooltip', 'Next Month')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400 block" />
              <span>{isRussian ? 'Столы' : 'Dining'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 block" />
              <span>{isRussian ? 'Службы' : 'Wellness'}</span>
            </div>
            <span className="text-[10px] font-mono text-white/30 hidden md:inline">
              {t('dashboard.calendarCellHint', 'Tap dates to view active reservations')}
            </span>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-bold text-white/40 uppercase tracking-wider">
          {(isRussian ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : isArabic ? ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'] : isArmenian ? ['Երկ', 'Երք', 'Չոր', 'Հնգ', 'Ուրբ', 'Շաբ', 'Կիր'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']).map(day => (
            <div key={day} className="py-2 font-display">{day}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {daysGrid.map((cell, idx) => {
            const cellBookings = bookings.filter(b => b.date === cell.dateString);
            const hasBookings = cellBookings.length > 0;
            const isSelected = selectedCalendarDay === cell.dateString;
            const isToday = cell.dateString === new Date().toISOString().split('T')[0];

            const hasTable = cellBookings.some(b => b.type === 'table');
            const hasService = cellBookings.some(b => b.type === 'service');

            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedCalendarDay(isSelected ? null : cell.dateString);
                }}
                className={`min-h-[75px] sm:min-h-[100px] p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative overflow-hidden group cursor-pointer ${
                  !cell.isCurrentMonth 
                    ? 'bg-[#0F1115]/20 border-white/[0.02] text-white/10' 
                    : isSelected
                      ? 'bg-teal-500/10 border-teal-500 text-white shadow-lg shadow-teal-500/5'
                      : hasBookings
                        ? 'bg-white/[0.03] border-white/10 hover:border-white/20 text-white'
                        : 'bg-white/[0.01] border-white/5 hover:border-white/10 text-white/70'
                } ${isToday ? 'ring-1 ring-teal-400/30' : ''}`}
              >
                {/* Date Number and Indicators */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[11px] font-mono font-bold ${
                    isToday 
                      ? 'bg-teal-500 text-black w-5 h-5 rounded-full flex items-center justify-center font-extrabold shadow-xs' 
                      : !cell.isCurrentMonth
                        ? 'text-white/20'
                        : 'text-white/80'
                  }`}>
                    {cell.dayNumber}
                  </span>

                  {/* Dots / Mini Indicators */}
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
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded-lg truncate border text-left ${
                          bTable 
                            ? 'bg-orange-500/10 text-orange-300 border-orange-500/20' 
                            : 'bg-teal-500/10 text-teal-300 border-teal-500/20'
                        }`}
                        title={bTable ? t('tabletop.tableNumber', { n: b.tableNumber }) : b.serviceName}
                      >
                        <span className="mr-0.5">{bTable ? '🍽️' : '🌸'}</span>
                        {bTable ? `Tab #${b.tableNumber}` : b.serviceName}
                      </div>
                    );
                  })}
                  {cellBookings.length > 2 && (
                    <div className="text-[8px] text-white/40 font-mono pl-1">
                      +{cellBookings.length - 2} {isRussian ? 'еще' : 'more'}
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="mt-6 p-5 rounded-2xl bg-[#0F1115] border border-white/5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-400" />
                  <span>
                    {isRussian 
                      ? `Записи на ${new Date(selectedCalendarDay).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`
                      : `Reservations for ${new Date(selectedCalendarDay).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                  </span>
                </h4>
                <button 
                  onClick={() => setSelectedCalendarDay(null)}
                  className="text-white/40 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selectedDayBookings.length === 0 ? (
                <div className="text-center py-8 text-xs text-white/40 flex flex-col items-center justify-center gap-2">
                  <Activity className="w-5 h-5 text-white/20" />
                  <span>{t('dashboard.noBookingsOnDay', 'No reservations scheduled for this day.')}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayBookings.map((booking) => {
                    const isTable = booking.type === "table";
                    return (
                      <div 
                        key={booking.id} 
                        className="p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left hover:bg-white/[0.02] transition"
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
                                {isTable 
                                  ? (isRussian ? `Столик #${booking.tableNumber} в ${booking.restaurantName || 'Grand Atelier'}` : `Table #${booking.tableNumber} at ${booking.restaurantName || 'Grand Atelier'}`)
                                  : booking.serviceName}
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
                                  <TagCategory category={booking.category || ''} />
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Interactive Actions for tapped item */}
                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                          <div className="text-right pr-2">
                            <span className="text-[9px] text-white/30 block font-mono uppercase">{t('dashboard.costLabel', 'Price')}</span>
                            <span className="text-xs font-bold text-white font-mono">{booking.price.toLocaleString(isRussian ? 'ru-RU' : 'en-US')} ₽</span>
                          </div>

                          {/* Trigger alerts */}
                          <button 
                            onClick={() => triggerUpcomingBookingAlert(booking, true)}
                            className="p-1.5 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/20 text-amber-400 rounded-lg transition"
                            title={t('dashboard.reminderTooltip')}
                          >
                            <Bell className="w-3.5 h-3.5" />
                          </button>

                          {/* Browser Notify */}
                          <button 
                            onClick={() => trigger30MinBrowserNotification(booking, true)}
                            className="p-1.5 border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/20 text-teal-400 rounded-lg transition flex items-center gap-1"
                            title="Test 30-min browser notification"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span className="text-[8px] font-bold">30m</span>
                          </button>

                          {/* Share */}
                          <button 
                            onClick={() => handleShare(booking)}
                            className={`p-1.5 border rounded-lg transition ${copiedBookingId === booking.id ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 scale-105' : 'border-white/10 hover:border-white/20 hover:bg-white/5 text-white/60'}`}
                            title={t('dashboard.shareTooltip')}
                          >
                            {copiedBookingId === booking.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                          </button>

                          {/* Sync Google Calendar Toggle */}
                          {isGoogleCalendarConnected && (
                            <div className="flex items-center gap-1.5">
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
                                className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out ${
                                  syncedBookingIds[booking.id] || autoSyncToCalendar ? 'bg-emerald-500' : 'bg-white/10'
                                } ${autoSyncToCalendar ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title={autoSyncToCalendar ? t('dashboard.gcalAutoSyncedTitle', 'Auto-synced') : (syncedBookingIds[booking.id] ? t('dashboard.gcalConnectedTooltip') : t('dashboard.gcalNotConnectedTooltip'))}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                                    syncedBookingIds[booking.id] || autoSyncToCalendar ? 'translate-x-3' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                          )}

                          {/* Cancel Booking */}
                          <button 
                            onClick={() => {
                              if (confirm(t('dashboard.cancelBookingConfirm', 'Are you sure you want to cancel the booking?'))) {
                                setUser({ ...user, balance: user.balance + booking.price });
                                setBookings(bookings.filter(b => b.id !== booking.id));
                                setBookingSuccessMsg(t('dashboard.cancelBookingSuccess', 'Booking successfully cancelled.'));
                                // If that was the last booking on this day, collapse panel
                                const remainingOnDay = bookings.filter(b => b.id !== booking.id && b.date === selectedCalendarDay);
                                if (remainingOnDay.length === 0) {
                                  setSelectedCalendarDay(null);
                                }
                              }
                            }}
                            className="p-1.5 border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-white/40 transition cursor-pointer"
                            title={t('dashboard.cancelBookingTooltip', 'Cancel Booking')}
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
    </div>
  );
}
