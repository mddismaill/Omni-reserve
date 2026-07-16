import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { 
  Sparkles, 
  Send, 
  X, 
  Bot, 
  User as UserIcon, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  Utensils, 
  Scissors, 
  Check, 
  AlertCircle,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { bookTable, bookService } from "../lib/api";
import { TableBooking, ServiceBooking, User, Restaurant, Service, Booking } from "../types";
import { toast } from "sonner";

export interface AIConciergeProps {
  user: User;
  onBookingSuccess: (booking: any, priceCharged: number, type: 'table' | 'service', successMsg: string) => void;
  restaurants: Restaurant[];
  services: Service[];
  bookings: Booking[];
  isFloating?: boolean;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  createdAt: string;
  proposal?: any;
  booked?: boolean;
}

export default function AIConcierge({
  user,
  onBookingSuccess,
  restaurants,
  services,
  bookings,
  isFloating = false,
  onClose
}: AIConciergeProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Initial friendly greeting based on language
    const isRu = i18n.language === "ru";
    const isAr = i18n.language === "ar";
    const isHy = i18n.language === "hy";

    let greeting = "";
    if (isRu) {
      greeting = `Здравствуйте, ${user.name}! Я ваш персональный консьерж OmniConcierge. ✨\n\nЯ помогу вам забронировать столик в одном из наших премиальных ресторанов (Grand Atelier, Sakura Zen, Bison & Vine) или записаться на роскошные спа-услуги, массаж или тренировки. \n\nСкажите, чем я могу украсить ваш сегодняшний день?`;
    } else if (isAr) {
      greeting = `مرحباً ${user.name}! أنا مساعدك الشخصي OmniConcierge. ✨\n\nيمكنني مساعدتك في حجز طاولة في أحد مطاعمنا الفاخرة أو حجز خدمات السبا الفاخرة وجلسات المساج أو التدريب.\n\nأخبرني، كيف يمكنني تلبية احتياجاتك اليوم؟`;
    } else if (isHy) {
      greeting = `Ողջույն, ${user.name}: Ես ձեր անձնական կոնսյերժն եմ՝ OmniConcierge-ը: ✨\n\nԵս կօգնեմ ձեզ ամրագրել սեղան մեր պրեմիում ռեստորաններից մեկում կամ գրանցվել շքեղ սպա ծառայությունների, մերսման կամ մարզումների համար:\n\nԱսեք, ինչպե՞ս կարող եմ օգնել ձեզ այսօր:`;
    } else {
      greeting = `Hello, ${user.name}! I am your personal OmniConcierge assistant. ✨\n\nI am here to help you reserve a table at our Michelin-starred restaurants or schedule custom wellness treatments, massage, or fitness slots.\n\nHow may I elevate your day today?`;
    }

    return [{
      id: "welcome",
      sender: "bot",
      text: greeting,
      createdAt: new Date().toISOString()
    }];
  });

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bookingLoadingId, setBookingLoadingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Quick Reply Choice
  const handleQuickReply = (text: string) => {
    setInputText("");
    sendMessage(text);
  };

  // Send Message to Express API
  const sendMessage = async (textToSend?: string) => {
    const text = textToSend?.trim() || inputText.trim();
    if (!text || isLoading) return;

    if (!textToSend) {
      setInputText("");
    }

    // Add User message
    const userMsg: ChatMessage = {
      id: `m-user-${Date.now()}`,
      sender: "user",
      text,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ sender: m.sender, text: m.text })),
          context: {
            userBalance: user.balance,
            currentDate: "2026-07-16"
          }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response from assistant.");
      }

      const data = await response.json();
      
      const botMsg: ChatMessage = {
        id: `m-bot-${Date.now()}`,
        sender: "bot",
        text: data.reply || "Извините, я не смог обработать ваш запрос.",
        createdAt: new Date().toISOString(),
        proposal: data.proposal || null
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      const isRu = i18n.language === "ru";
      const errorText = isRu 
        ? "Прошу прощения, у меня возникли трудности при связи со спутником. Пожалуйста, повторите запрос."
        : "I apologize, I am experiencing temporary connection difficulties. Please try again.";
      
      setMessages(prev => [...prev, {
        id: `m-bot-err-${Date.now()}`,
        sender: "bot",
        text: errorText,
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle click on Proposal card
  const handleConfirmProposal = async (msgId: string, proposal: any) => {
    if (proposal.price > user.balance) {
      toast.error(
        i18n.language === "ru" 
          ? `Недостаточно средств. Стоимость: ${proposal.price} ₽. Ваш баланс: ${user.balance} ₽.` 
          : `Insufficient funds. Cost: ${proposal.price} ₽. Your balance: ${user.balance} ₽.`
      );
      return;
    }

    setBookingLoadingId(msgId);

    try {
      if (proposal.type === "table") {
        const result = await bookTable({
          userId: user.id,
          tableId: proposal.tableId,
          tableNumber: proposal.tableNumber,
          room: proposal.room,
          restaurantId: proposal.restaurantId,
          restaurantName: proposal.restaurantName,
          date: proposal.date,
          time: proposal.time,
          guests: proposal.guests || 2,
          notes: proposal.notes || "AI booking assist",
          basePrice: proposal.price,
          currentBalance: user.balance
        });

        // Trigger Success Callback to parent App.tsx
        const successMessage = i18n.language === 'ru'
          ? `Стол #${proposal.tableNumber} в "${proposal.restaurantName}" забронирован!`
          : `Table #${proposal.tableNumber} at "${proposal.restaurantName}" has been reserved!`;
        
        onBookingSuccess(result.booking, result.priceCharged, 'table', successMessage);

      } else {
        const result = await bookService({
          userId: user.id,
          serviceId: proposal.serviceId,
          serviceName: proposal.serviceName,
          category: proposal.category,
          staffId: proposal.staffId,
          staffName: proposal.staffName,
          date: proposal.date,
          time: proposal.time,
          price: proposal.price,
          salonId: proposal.salonId,
          salonName: proposal.salonName,
          currentBalance: user.balance
        });

        const successMessage = i18n.language === 'ru'
          ? `Услуга "${proposal.serviceName}" оформлена!`
          : `Service "${proposal.serviceName}" successfully booked!`;

        onBookingSuccess(result.booking, result.priceCharged, 'service', successMessage);
      }

      // Mark this message proposal as booked
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, booked: true } : m));
      toast.success(
        i18n.language === "ru" 
          ? "Бронирование успешно подтверждено!" 
          : "Reservation successfully confirmed!"
      );
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Ошибка при совершении бронирования");
    } finally {
      setBookingLoadingId(null);
    }
  };

  // Quick reply strings
  const getQuickReplies = () => {
    const isRu = i18n.language === "ru";
    const isAr = i18n.language === "ar";
    const isHy = i18n.language === "hy";

    if (isRu) {
      return [
        "Забронировать стол в Grand Atelier на завтра в 19:00",
        "Порекомендуй лучший спа-ритуал",
        "Хочу массаж в субботу в Lotus Spa",
        "Покажи свободные столики у окна"
      ];
    } else if (isAr) {
      return [
        "احجز طاولة في Grand Atelier غداً الساعة 7 مساءً",
        "أوصني بأفضل جلسة سبا مريحة",
        "أريد حجز جلسة تدليك يوم السبت",
        "عرض الطاولات الشاغرة بجوار النافذة"
      ];
    } else if (isHy) {
      return [
        "Ամրագրել սեղան Grand Atelier-ում վաղը ժամը 19:00-ին",
        "Առաջարկիր լավագույն սպա ռիտուալը",
        "Ցանկանում եմ մերսում շաբաթ օրը",
        "Ցույց տուր ազատ սեղանները պատուհանի մոտ"
      ];
    } else {
      return [
        "Book a table at Grand Atelier for tomorrow at 7 PM",
        "Recommend the best relaxing spa ritual",
        "Massage appointment this Saturday",
        "Show available tables near the window"
      ];
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#0B0D12] rounded-2xl border border-white/5 overflow-hidden ${isFloating ? "w-96 shadow-2xl h-[550px]" : "w-full min-h-[500px]"}`}>
      {/* Header */}
      <div className="bg-[#121620] px-4 py-3.5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-[#121620]" />
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-500/10">
              <Sparkles className="w-4.5 h-4.5 text-black" />
            </div>
          </div>
          <div className="text-left">
            <h4 className="text-xs font-bold text-white tracking-wide uppercase">OmniConcierge</h4>
            <span className="text-[9px] text-teal-400 font-mono font-bold flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-teal-400 animate-ping" />
              {i18n.language === "ru" ? "ИИ-Консьерж Онлайн" : "AI Concierge Active"}
            </span>
          </div>
        </div>

        {isFloating && onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m) => {
          const isBot = m.sender === "bot";
          return (
            <div key={m.id} className={`flex items-start gap-2.5 ${!isBot ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              {isBot ? (
                <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-400/20 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-teal-400" />
                </div>
              ) : (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white/10" 
                />
              )}

              {/* Text content */}
              <div className="max-w-[82%] space-y-2">
                <div className={`p-3 rounded-2xl text-[12px] leading-relaxed text-left ${
                  isBot 
                    ? "bg-[#141824] border border-white/5 text-white/90" 
                    : "bg-teal-500 text-black font-medium"
                }`}>
                  <p className="whitespace-pre-line">{m.text}</p>
                </div>

                {/* Proposal Ticket rendering */}
                {isBot && m.proposal && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="overflow-hidden border border-[#2DD4BF]/20 bg-[#10131E] rounded-2xl shadow-xl flex flex-col text-left"
                  >
                    {/* Badge */}
                    <div className="px-3.5 py-1.5 bg-[#142323] border-b border-[#2DD4BF]/10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[9px] uppercase font-black tracking-wider text-teal-400 font-mono">
                        {m.proposal.type === "table" ? <Utensils className="w-3 h-3 text-teal-400" /> : <Scissors className="w-3 h-3 text-teal-400" />}
                        {m.proposal.type === "table" 
                          ? (i18n.language === "ru" ? "РЕКОМЕНДАЦИЯ СТОЛИКА" : "TABLE RECOMMENDATION")
                          : (i18n.language === "ru" ? "РЕКОМЕНДАЦИЯ УСЛУГИ" : "SERVICE BOOKING")
                        }
                      </div>
                      <span className="text-[10px] font-mono text-teal-300 font-bold">{m.proposal.price} ₽</span>
                    </div>

                    {/* Details content */}
                    <div className="p-3.5 space-y-2 text-[11px] text-white/70">
                      {m.proposal.type === "table" ? (
                        <>
                          <div className="font-bold text-white text-[12px]">{m.proposal.restaurantName}</div>
                          <div className="grid grid-cols-2 gap-y-1 text-white/50">
                            <div>{i18n.language === "ru" ? "Стол:" : "Table:"} <span className="text-white font-bold">#{m.proposal.tableNumber}</span></div>
                            <div>{i18n.language === "ru" ? "Вместимость:" : "Capacity:"} <span className="text-white font-bold">{m.proposal.guests || 2} чел.</span></div>
                            <div className="col-span-2 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-white/30" />
                              <span className="text-white font-medium">{m.proposal.date}</span>
                              <span className="text-white/30 px-1">•</span>
                              <Clock className="w-3 h-3 text-white/30" />
                              <span className="text-white font-medium">{m.proposal.time}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-white text-[12px]">{m.proposal.serviceName}</div>
                          <div className="grid grid-cols-2 gap-y-1 text-white/50">
                            <div className="col-span-2">{i18n.language === "ru" ? "Салон:" : "Salon:"} <span className="text-white font-bold">{m.proposal.salonName}</span></div>
                            <div className="col-span-2">{i18n.language === "ru" ? "Специалист:" : "Specialist:"} <span className="text-teal-400 font-medium">{m.proposal.staffName}</span></div>
                            <div className="col-span-2 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-white/30" />
                              <span className="text-white font-medium">{m.proposal.date}</span>
                              <span className="text-white/30 px-1">•</span>
                              <Clock className="w-3 h-3 text-white/30" />
                              <span className="text-white font-medium">{m.proposal.time}</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* CTA confirm button */}
                      <div className="pt-2 border-t border-white/5">
                        {m.booked ? (
                          <div className="w-full py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center gap-1 text-[11px] font-bold">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            {i18n.language === "ru" ? "Успешно забронировано" : "Successfully reserved"}
                          </div>
                        ) : m.proposal.price > user.balance ? (
                          <div className="space-y-1">
                            <button
                              disabled
                              className="w-full py-2 rounded-xl bg-white/5 text-white/20 cursor-not-allowed text-[11px] font-bold"
                            >
                              {i18n.language === "ru" ? "Подтвердить" : "Confirm Booking"}
                            </button>
                            <p className="text-[9px] text-rose-400 flex items-center gap-1 justify-center leading-tight">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              {i18n.language === "ru" 
                                ? `Недостаточно средств. Пополните баланс на +${m.proposal.price - user.balance} ₽` 
                                : `Insufficient balance. Add +${m.proposal.price - user.balance} ₽`}
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConfirmProposal(m.id, m.proposal)}
                            disabled={bookingLoadingId !== null}
                            className="w-full py-2 rounded-xl bg-[#2DD4BF] text-black hover:bg-[#2DD4BF]/90 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {bookingLoadingId === m.id ? (
                              <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            {i18n.language === "ru" ? "Подтвердить и забронировать" : "Confirm and Reserve"}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-400/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-teal-400" />
            </div>
            <div className="bg-[#141824] border border-white/5 px-4 py-2.5 rounded-2xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested quick prompts inside chat stream */}
      {messages.length === 1 && (
        <div className="px-4 pb-2 text-left">
          <div className="text-[10px] uppercase font-bold tracking-wider text-white/30 flex items-center gap-1 mb-2">
            <HelpCircle className="w-3 h-3 text-white/30" />
            {i18n.language === "ru" ? "Варианты вопросов:" : "Suggested Questions:"}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {getQuickReplies().map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickReply(reply)}
                className="text-[10px] text-teal-400 border border-teal-500/10 hover:border-teal-500/40 bg-teal-500/[0.02] hover:bg-teal-500/[0.06] py-1.5 px-3 rounded-full transition text-left leading-normal cursor-pointer"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form 
        onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
        className="p-3 border-t border-white/5 bg-[#121620] flex gap-2"
      >
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          placeholder={i18n.language === "ru" ? "Спросите о ресторанах, столиках или спа-услугах..." : "Ask about tables, salons, or services..."}
          className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3.5 py-2 text-[12px] text-white placeholder-white/20 focus:outline-none focus:border-teal-500/30 transition text-left"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2 rounded-xl bg-teal-500 text-black hover:bg-[#2DD4BF] disabled:opacity-40 disabled:hover:bg-teal-500 transition cursor-pointer flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
