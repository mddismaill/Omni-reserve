import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Shield, 
  Users, 
  ClipboardList, 
  Clock, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit, 
  FileDown, 
  FileUp, 
  Settings, 
  Radio, 
  Layers, 
  Activity, 
  CreditCard, 
  Percent, 
  ArrowUpRight, 
  TrendingUp, 
  Search, 
  Calendar, 
  Heart, 
  Award, 
  Check,
  X,
  RefreshCw,
  Bell,
  Coins,
  ChevronRight,
  User,
  Grid,
  Scissors,
  Camera,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserType, Booking, Service, StaffMember, Notification, Table } from "../types";
import QRScanner from "./QRScanner";


interface RbacPanelProps {
  user: UserType;
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  availableTables: Table[];
  onAddNotification: (title: string, message: string, type: 'reminder' | 'offer' | 'status') => void;
}

export default function RbacPanel({ 
  user, 
  setUser, 
  bookings, 
  setBookings, 
  services, 
  setServices,
  availableTables,
  onAddNotification 
}: RbacPanelProps) {
  const { t } = useTranslation();
  const currentRole = user.role;

  // --- QR SCANNER STATE ---
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannedBooking, setScannedBooking] = useState<Booking | null>(null);
  const [scannedUserBookings, setScannedUserBookings] = useState<Booking[]>([]);
  const [scannedUserInfo, setScannedUserInfo] = useState<{ id: string; email: string } | null>(null);
  const [scanResultError, setScanResultError] = useState<string | null>(null);

  // --- PLATFORM ADMIN STATE ---
  const [businesses, setBusinesses] = useState([
    { id: "biz-1", name: "Lotus Spa Salon", owner: "Виктор Владелец", subscription: "professional", status: "active", revenue: 145000, logo: "🌸" },
    { id: "biz-2", name: "Gold Gym Active", owner: "Игорь Тренер", subscription: "starter", status: "active", revenue: 82000, logo: "⚡" },
    { id: "biz-3", name: "Prime Barber", owner: "Сергей Стиль", subscription: "enterprise", status: "active", revenue: 310000, logo: "💈" },
    { id: "biz-4", name: "Dent Clinic Pro", owner: "Анна Мед", subscription: "professional", status: "suspended", revenue: 0, logo: "🦷" }
  ]);
  const [globalTaxes, setGlobalTaxes] = useState({
    spaTax: 15,
    fitnessTax: 10,
    beautyTax: 12
  });
  const [permissionsMatrix, setPermissionsMatrix] = useState<Record<string, string[]>>({
    platform_admin: ["all_access", "manage_subscriptions", "view_analytics", "edit_services", "manage_calendar", "view_schedule", "book_appointments"],
    business_owner: ["manage_subscriptions", "view_analytics", "edit_services", "manage_calendar", "view_schedule", "book_appointments"],
    business_admin: ["manage_subscriptions", "view_analytics", "edit_services", "manage_calendar", "view_schedule", "book_appointments"],
    manager: ["view_analytics", "manage_calendar", "view_schedule", "book_appointments"],
    staff: ["view_schedule", "manage_assigned_appointments"],
    client: ["book_appointments", "manage_own_appointments", "view_loyalty"]
  });
  const [webhooks, setWebhooks] = useState([
    { id: "wh-1", url: "https://crm.lotusspa.ru/webhooks/booking", event: "booking.created", status: "active", deliveries: 24 },
    { id: "wh-2", url: "https://tele-bot.activegym.ru/events", event: "invoice.paid", status: "active", deliveries: 12 }
  ]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvent, setNewWebhookEvent] = useState("booking.created");
  const [webhookLogs, setWebhookLogs] = useState<any[]>([
    { id: "log-1", event: "booking.created", timestamp: "2026-07-10 14:15:22", status: 200, url: "https://crm.lotusspa.ru/webhooks/booking" },
    { id: "log-2", event: "invoice.paid", timestamp: "2026-07-10 13:02:11", status: 200, url: "https://tele-bot.activegym.ru/events" }
  ]);

  // CSV State
  const [csvPaste, setCsvPaste] = useState("");
  const [csvMessage, setCsvMessage] = useState("");

  // --- BUSINESS OWNER STATE ---
  const [bizBranding, setBizBranding] = useState({
    name: "Lotus & Tabletop Superhub",
    color: "#0d9488", // teal-600
    theme: "light"
  });
  const [isAddingService, setIsAddingService] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    category: "Spa & Wellness" as any,
    duration: 60,
    price: 3000,
    description: "",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=500"
  });
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "Терапевт",
    rating: 4.8,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"
  });
  const [ownerPayouts, setOwnerPayouts] = useState([
    { id: "pay-1", date: "2026-07-01", amount: 45000, status: "completed", account: "•••• 4821" },
    { id: "pay-2", date: "2026-07-08", amount: 28000, status: "completed", account: "•••• 4821" },
    { id: "pay-3", date: "2026-07-10", amount: 12500, status: "pending", account: "•••• 4821" }
  ]);

  // --- MANAGER STATE ---
  const [managerSearchTerm, setManagerSearchTerm] = useState("");
  const [managerActiveFilter, setManagerActiveFilter] = useState<'all' | 'table' | 'service'>('all');

  // --- STAFF STATE ---
  const [staffActiveStatus, setStaffActiveStatus] = useState<Record<string, string>>({});

  // --- CLIENT STATE ---
  const [loyaltyPoints, setLoyaltyPoints] = useState(1250);
  const [clientProfile, setClientProfile] = useState({
    phone: "+7 (999) 123-45-67",
    gender: "Женский",
    notificationsEnabled: true
  });
  const [favorites, setFavorites] = useState<string[]>(["spa-1", "fit-1"]);

  // --- NEW WORKERS & ROLE ASSIGNMENT STATE ---
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [invitationsList, setInvitationsList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("staff");
  const [assigningRoleId, setAssigningRoleId] = useState<string | null>(null);

  const fetchUsersAndInvitations = () => {
    setIsLoadingUsers(true);
    fetch("/api/users")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then(data => {
        setUsersList(data);
        setIsLoadingUsers(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoadingUsers(false);
      });

    fetch("/api/invitations")
      .then(res => res.json())
      .then(data => setInvitationsList(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchUsersAndInvitations();
  }, [user]);

  const handleAssignRole = (targetUserId: string, targetRole: string) => {
    setAssigningRoleId(targetUserId);
    fetch(`/api/users/${targetUserId}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: targetRole })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to assign role");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          onAddNotification(
            "Роль изменена",
            `Пользователю успешно назначена роль "${targetRole}"`,
            "status"
          );
          fetchUsersAndInvitations();
        }
        setAssigningRoleId(null);
      })
      .catch(err => {
        console.error(err);
        setAssigningRoleId(null);
      });
  };

  const handleInviteWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: inviteName, email: inviteEmail, role: inviteRole })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to invite worker");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          onAddNotification(
            "Приглашение отправлено",
            `Приглашение для сотрудника "${inviteName}" успешно отправлено! Роль: ${inviteRole}`,
            "status"
          );
          setInviteName("");
          setInviteEmail("");
          fetchUsersAndInvitations();
        }
      })
      .catch(err => console.error(err));
  };

  const handleAcceptInvitationSimulate = (inviteId: string) => {
    fetch(`/api/invitations/${inviteId}/accept`, {
      method: "POST"
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to accept invitation");
        return res.json();
      })
      .then(data => {
        if (data.success) {
          onAddNotification(
            "Приглашение принято",
            `Сотрудник "${data.user.name}" принял приглашение. Автоматически присвоена роль: ${data.user.role}`,
            "status"
          );
          fetchUsersAndInvitations();
        }
      })
      .catch(err => console.error(err));
  };

  const handleLoginAsUser = (email: string) => {
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password" })
    })
      .then(res => {
        if (!res.ok) throw new Error("Wrong credentials");
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        onAddNotification(
          "Вход выполнен",
          `Вы вошли под учетной записью: ${data.user.name} (${data.user.role})`,
          "status"
        );
      })
      .catch(err => console.error(err));
  };

  // Set default active status for staff bookings
  useEffect(() => {
    const statuses: Record<string, string> = {};
    bookings.forEach(b => {
      statuses[b.id] = staffActiveStatus[b.id] || "Confirmed";
    });
    setStaffActiveStatus(statuses);
  }, [bookings]);

  // CSV Exporter Simulation
  const handleExportCSV = (type: string) => {
    let headers = "";
    let rows: string[] = [];
    
    if (type === "users") {
      headers = "ID,Name,Email,Role,Balance\n";
      rows = [
        "user-1,Мария Смирнова,maria@example.com,client,15000",
        "user-2,Алексей Иванов,alex@example.com,client,8500",
        "user-admin,Александр Админ,admin@example.com,platform_admin,999999",
        "user-owner,Виктор Владелец,owner@example.com,business_owner,50000"
      ];
    } else if (type === "bookings") {
      headers = "ID,Type,User,Date,Time,Price,Details\n";
      rows = bookings.map(b => {
        const details = b.type === "table" 
          ? `Столик #${b.tableNumber} (${b.room})` 
          : `${b.serviceName} (${b.staffName})`;
        return `${b.id},${b.type},${b.userId},${b.date},${b.time},${b.price},"${details}"`;
      });
    } else {
      headers = "ID,Business,Owner,Subscription,Status,Revenue\n";
      rows = businesses.map(b => `${b.id},${b.name},${b.owner},${b.subscription},${b.status},${b.revenue}`);
    }

    const csvContent = "data:text/csv;charset=utf-8," + headers + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bookly_${type}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    onAddNotification(
      "Экспорт CSV завершен",
      `Файл bookly_${type}_export.csv успешно сгенерирован и скачан в систему.`,
      "status"
    );
  };

  // CSV Importer Simulation
  const handleImportCSV = () => {
    if (!csvPaste.trim()) {
      setCsvMessage("Пожалуйста, вставьте валидный CSV-текст для импорта.");
      return;
    }

    try {
      const lines = csvPaste.trim().split("\n");
      if (lines.length < 2) {
        setCsvMessage("Ошибка: в CSV должны быть заголовки и как минимум одна строка с данными.");
        return;
      }

      const headers = lines[0].toLowerCase().split(",");
      
      // Check if it's a service csv
      if (headers.includes("service_name") || headers.includes("name")) {
        const nameIdx = headers.findIndex(h => h.includes("name"));
        const priceIdx = headers.findIndex(h => h.includes("price"));
        const catIdx = headers.findIndex(h => h.includes("category"));
        const descIdx = headers.findIndex(h => h.includes("desc"));
        
        let count = 0;
        const importedServices: Service[] = [...services];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",");
          if (cols.length >= 2) {
            const name = cols[nameIdx]?.replace(/['"]/g, "").trim() || `Импортированная услуга ${i}`;
            const price = parseFloat(cols[priceIdx]) || 1500;
            const category = (cols[catIdx]?.replace(/['"]/g, "").trim() as any) || "Spa & Wellness";
            const description = cols[descIdx]?.replace(/['"]/g, "").trim() || "Быстрый импорт через CSV";
            
            const imported: Service = {
              id: `imported-svc-${Date.now()}-${i}`,
              name,
              category,
              duration: 60,
              price,
              rating: 4.8,
              description,
              image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=500",
              staff: [
                { id: "staff-1", name: "Елена Соколова", role: "Терапевт", rating: 4.9, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120" }
              ]
            };
            importedServices.push(imported);
            count++;
          }
        }
        
        setServices(importedServices);
        setCsvMessage(`Успешно импортировано услуг: ${count}! Новые услуги добавлены в Bookly.`);
        setCsvPaste("");
        onAddNotification("CSV Импорт услуг", `Успешно добавлено ${count} новых услуг в каталог.`, "status");
      } else {
        setCsvMessage("Ошибка: Неизвестный формат CSV. Убедитесь, что заголовки содержат 'name', 'price', 'category'.");
      }
    } catch (e: any) {
      setCsvMessage(`Ошибка разбора CSV: ${e.message}`);
    }
  };

  // Toggle global matrix permissions
  const handleTogglePermission = (role: string, permission: string) => {
    const currentPerms = permissionsMatrix[role] || [];
    let updatedPerms: string[];
    if (currentPerms.includes(permission)) {
      updatedPerms = currentPerms.filter(p => p !== permission);
    } else {
      updatedPerms = [...currentPerms, permission];
    }

    setPermissionsMatrix({
      ...permissionsMatrix,
      [role]: updatedPerms
    });

    onAddNotification(
      "Права изменены",
      `Права "${permission}" для роли "${role}" были изменены. Настройки применены ко всем пользователям.`,
      "status"
    );
  };

  // Add webhook
  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;

    const newWh = {
      id: `wh-${Date.now()}`,
      url: newWebhookUrl.trim(),
      event: newWebhookEvent,
      status: "active",
      deliveries: 0
    };

    setWebhooks([...webhooks, newWh]);
    setNewWebhookUrl("");
    onAddNotification("Вебхук добавлен", `Новый URL-адрес для события ${newWebhookEvent} успешно сохранен.`, "status");
  };

  // Simulate Trigger Webhook event
  const handleSimulateWebhook = (webhook: any) => {
    const newLog = {
      id: `log-${Date.now()}`,
      event: webhook.event,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      status: 200,
      url: webhook.url
    };

    setWebhookLogs([newLog, ...webhookLogs]);
    
    // Update delivery count
    setWebhooks(webhooks.map(w => w.id === webhook.id ? { ...w, deliveries: w.deliveries + 1 } : w));

    onAddNotification(
      "Симуляция вебхука",
      `Событие "${webhook.event}" отправлено на ${webhook.url}. Ответ: 200 OK.`,
      "status"
    );
  };

  // Add Business Service
  const handleAddBusinessService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name.trim()) return;

    const svc: Service = {
      id: `svc-${Date.now()}`,
      name: newService.name.trim(),
      category: newService.category,
      duration: newService.duration,
      price: newService.price,
      rating: 5.0,
      description: newService.description || "Новая премиальная услуга",
      image: newService.image,
      staff: [
        { id: "staff-3", name: "Анна Кузнецова", role: "Топ-стилист", rating: 4.8, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" }
      ]
    };

    setServices([svc, ...services]);
    setIsAddingService(false);
    setNewService({
      name: "",
      category: "Spa & Wellness",
      duration: 60,
      price: 3000,
      description: "",
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=500"
    });

    onAddNotification(
      "Услуга добавлена",
      `Услуга "${svc.name}" успешно внесена в каталог вашего филиала.`,
      "status"
    );
  };

  // Add Business Staff
  const handleAddBusinessStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim()) return;

    // Create custom staff
    onAddNotification(
      "Специалист нанят",
      `Новый специалист "${newStaff.name}" (${newStaff.role}) успешно привязан к расписанию.`,
      "status"
    );
    setIsAddingStaff(false);
    setNewStaff({
      name: "",
      role: "Терапевт",
      rating: 4.8,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"
    });
  };

  // Manager action: reschedule or update booking
  const handleManagerUpdateBooking = (bookingId: string, status: string) => {
    setStaffActiveStatus({
      ...staffActiveStatus,
      [bookingId]: status
    });

    const target = bookings.find(b => b.id === bookingId);
    if (target) {
      onAddNotification(
        "Статус бронирования изменен",
        `Бронирование ${target.id} переведено менеджером в статус "${status}". Клиент уведомлен.`,
        "status"
      );
    }
  };

  const playScanSound = (type: 'success' | 'error') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      
      // Resume context if suspended (common in browsers)
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      if (type === 'success') {
        // High-pitched pleasant double-beep
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6 note
        gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        
        osc1.start(audioCtx.currentTime);
        osc1.stop(audioCtx.currentTime + 0.08);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.1); // E6 note
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
        
        osc2.start(audioCtx.currentTime + 0.1);
        osc2.stop(audioCtx.currentTime + 0.22);
      } else {
        // Low frequency buzzer tone
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, audioCtx.currentTime); // Low pitch
        
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        // Quickly drop frequency to create a downward "buzz" effect
        osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (err) {
      console.warn("Web Audio API not supported or autoplay restricted:", err);
    }
  };

  const handleQrScanSuccess = (text: string) => {
    setShowQrScanner(false);
    
    if (text.startsWith("booking-checkin:")) {
      const parts = text.split(":");
      const bookingId = parts[1];
      const foundBooking = bookings.find(b => b.id === bookingId);
      
      if (foundBooking) {
        playScanSound('success');
        handleManagerUpdateBooking(bookingId, "Completed");
        setScannedBooking(foundBooking);
        setScanResultError(null);
      } else {
        playScanSound('error');
        setScanResultError(`Бронирование с ID "${bookingId}" не найдено в базе данных.`);
      }
    } else if (text.startsWith("user-checkin:")) {
      const parts = text.split(":");
      const userId = parts[1];
      const email = parts[2] || "client";
      
      const userReservations = bookings.filter(b => b.userId === userId);
      setScannedUserInfo({ id: userId, email });
      setScannedUserBookings(userReservations);
      
      if (userReservations.length === 0) {
        playScanSound('error');
        setScanResultError(`У пользователя "${email}" нет активных бронирований.`);
      } else {
        playScanSound('success');
        setScanResultError(null);
      }
    } else {
      playScanSound('error');
      setScanResultError("Неподдерживаемый формат QR-кода. Пожалуйста, отсканируйте корректный QR-код чекина гостя.");
    }
  };

  // Staff action: update assignment state
  const handleStaffUpdateState = (bookingId: string, newState: string) => {
    setStaffActiveStatus({
      ...staffActiveStatus,
      [bookingId]: newState
    });

    const target = bookings.find(b => b.id === bookingId);
    if (target) {
      onAddNotification(
        "Процедура обновлена",
        `Мастер перевел процедуру "${target.type === "service" ? target.serviceName : "Стол #" + target.tableNumber}" в статус "${newState}".`,
        "status"
      );
    }
  };

  // Client actions
  const handleToggleFavorite = (svcId: string) => {
    if (favorites.includes(svcId)) {
      setFavorites(favorites.filter(id => id !== svcId));
    } else {
      setFavorites([...favorites, svcId]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* 1. LEFT COLUMN: RBAC SWITCHER & SYSTEM CARD */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* Current Active Role Highlight */}
        <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-teal-400 font-mono tracking-widest uppercase font-bold block">{t('rbac.activeRole')}</span>
              <span className="text-sm font-display font-bold text-white uppercase tracking-tight block">
                {currentRole === 'platform_admin' && t('rbac.rolePlatformAdmin')}
                {currentRole === 'business_owner' && t('rbac.roleBusinessOwner')}
                {currentRole === 'business_admin' && t('rbac.roleBusinessAdmin')}
                {currentRole === 'manager' && t('rbac.roleManager')}
                {currentRole === 'staff' && t('rbac.roleStaff')}
                {currentRole === 'client' && t('rbac.roleClient')}
              </span>
            </div>
          </div>

          <p className="text-xs text-white/50 leading-relaxed mb-4">
            {t('rbac.roleDesc')}
          </p>

          <div className="pt-4 border-t border-white/5 space-y-3">
            <span className="text-[10px] text-teal-400 font-mono block uppercase font-bold">
              👤 Войти под профилем (Демо)
            </span>
            <p className="text-[10px] text-white/40 leading-normal">
              ⚠️ Вы не можете изменить свою собственную роль в профиле. Роли назначаются только Администратором или Владельцем бизнеса. Войдите под другим аккаунтом для проверки полномочий.
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { role: 'platform_admin', label: t('rbac.rolePlatformAdmin'), email: "admin@example.com", icon: "👑" },
                { role: 'business_owner', label: t('rbac.roleBusinessOwner'), email: "owner@example.com", icon: "👔" },
                { role: 'manager', label: t('rbac.roleManager'), email: "manager@example.com", icon: "💼" },
                { role: 'staff', label: t('rbac.roleStaff'), email: "staff@example.com", icon: "👩‍⚕️" },
                { role: 'client', label: t('rbac.roleClient'), email: "maria@example.com", icon: "👤" }
              ].map((r) => {
                const isActive = currentRole === r.role;
                return (
                  <button
                    key={r.role}
                    onClick={() => {
                      fetch("/api/auth/login", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: r.email, password: "password" })
                      })
                        .then(res => res.json())
                        .then(data => {
                          setUser(data.user);
                          onAddNotification(
                            t("common.success"),
                            `Вы вошли как ${data.user.name} (${r.label})`,
                            "status"
                          );
                        });
                    }}
                    className={`w-full py-1.5 px-3 rounded-lg text-left text-xs transition flex items-center justify-between ${isActive ? 'bg-[#162D2C] text-teal-300 border border-teal-500/30 font-extrabold' : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/5'}`}
                  >
                    <span>{r.icon} {r.label}</span>
                    {isActive && <Check className="w-3 h-3 text-teal-400 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dynamic Context Card */}
        <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5 text-xs text-white/50 leading-relaxed space-y-3">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Activity className="w-4 h-4 text-teal-400" />
            <span>{t('rbac.securityLogs')}</span>
          </div>
          <div className="font-mono text-[10px] space-y-2 max-h-40 overflow-y-auto divide-y divide-white/5">
            <div className="pt-1.5"><span className="text-teal-400">[OK]</span> Access granted for {user.name} ({currentRole})</div>
            <div className="pt-1.5"><span className="text-teal-400">[INFO]</span> Loaded role config from types.ts</div>
            <div className="pt-1.5"><span className="text-teal-400">[SEC]</span> Method API: GET /api/bookings approved</div>
            {currentRole === 'platform_admin' && <div className="pt-1.5 text-purple-400"><span className="text-purple-400">[SUDO]</span> Session enabled full admin bypass</div>}
          </div>
        </div>

      </div>

      {/* 2. RIGHT COLUMN: DETAIL PANEL FOR THE ACTIVE ROLE */}
      <div className="lg:col-span-3 space-y-6">

        {/* --- SYSTEM ROLE & WORKER DELEGATION HUB --- */}
        <div className="bg-[#16191F] rounded-2xl p-6 border border-white/5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-teal-500 via-purple-500 to-teal-500" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-teal-500/[0.02] rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-white tracking-tight">Делегирование прав и приглашение сотрудников</h2>
                <p className="text-xs text-white/40 mt-0.5">Назначайте роли, приглашайте сотрудников и просматривайте статусы доступов</p>
              </div>
            </div>
            
            <button 
              onClick={fetchUsersAndInvitations}
              className="p-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-xl border border-white/10 transition flex items-center gap-2 text-xs font-semibold cursor-pointer"
              title="Обновить списки"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
              <span>Обновить</span>
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Left Box: Users & Roles List (7 columns) */}
            <div className="xl:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/40 font-mono uppercase font-bold tracking-wider">Зарегистрированные пользователи ({usersList.length})</span>
                {!(currentRole === 'platform_admin' || currentRole === 'business_owner') && (
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    🔒 Только чтение
                  </span>
                )}
              </div>

              {isLoadingUsers ? (
                <div className="py-12 flex flex-col items-center justify-center text-xs text-white/30 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
                  <span>Загрузка списка пользователей...</span>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {usersList.map((u) => {
                    const isSelf = u.id === user.id;
                    return (
                      <div key={u.id} className="p-3 bg-[#090A0D] rounded-xl border border-white/5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full border border-white/10" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-white truncate">{u.name}</span>
                              {isSelf && <span className="bg-teal-500/10 text-teal-400 text-[8px] font-bold uppercase px-1.5 py-0.2 rounded font-mono">Вы</span>}
                            </div>
                            <span className="text-[10px] text-white/40 block truncate">{u.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Role Selection Dropdown for Admin or Owner */}
                          {(currentRole === 'platform_admin' || currentRole === 'business_owner') ? (
                            <select
                              value={u.role}
                              disabled={assigningRoleId === u.id || isSelf}
                              onChange={(e) => handleAssignRole(u.id, e.target.value)}
                              className="px-2 py-1.5 bg-[#16191F] border border-white/10 rounded-lg text-[11px] text-white focus:outline-none focus:border-teal-500 font-semibold cursor-pointer disabled:opacity-50"
                            >
                              <option value="client">Client (Клиент)</option>
                              <option value="staff">Staff (Мастер)</option>
                              <option value="manager">Manager (Менеджер)</option>
                              <option value="business_admin">Business Admin</option>
                              <option value="business_owner">Business Owner</option>
                              <option value="platform_admin">Platform Admin</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase font-mono border ${
                              u.role === 'platform_admin' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                              u.role === 'business_owner' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                              u.role === 'manager' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                              u.role === 'staff' ? 'bg-teal-500/15 text-teal-400 border-teal-500/30' :
                              'bg-white/5 text-white/60 border-white/10'
                            }`}>
                              {u.role}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Box: Worker Invitations Form & Invitations List (5 columns) */}
            <div className="xl:col-span-5 space-y-6">
              
              {/* Form to Invite Workers */}
              {(currentRole === 'platform_admin' || currentRole === 'business_owner') ? (
                <form onSubmit={handleInviteWorker} className="space-y-3 p-4 bg-[#090A0D] rounded-xl border border-white/5">
                  <span className="text-[10px] text-purple-400 font-mono uppercase font-bold block mb-1">Пригласить сотрудника</span>
                  
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Имя сотрудника"
                      value={inviteName}
                      onChange={e => setInviteName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#16191F] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                    />
                  </div>

                  <div>
                    <input
                      type="email"
                      required
                      placeholder="Email сотрудника"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-[#16191F] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[#16191F] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-semibold cursor-pointer"
                    >
                      <option value="staff">Staff (Мастер)</option>
                      <option value="manager">Manager (Менеджер)</option>
                      <option value="business_admin">Business Admin</option>
                    </select>

                    <button
                      type="submit"
                      className="px-4 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Пригласить</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 bg-[#090A0D] rounded-xl border border-white/5 text-xs text-white/40 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Форма приглашения сотрудников заблокирована. Требуются права Администратора или Владельца.</span>
                </div>
              )}

              {/* Active Invitations List */}
              <div className="space-y-3">
                <span className="text-[10px] text-white/40 font-mono uppercase font-bold block">Приглашения сотрудников ({invitationsList.length})</span>
                
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {invitationsList.map((inv) => (
                    <div key={inv.id} className="p-3 bg-[#090A0D] rounded-xl border border-white/5 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            <span>{inv.name}</span>
                            <span className="text-[9px] bg-purple-500/10 text-purple-400 px-1.5 py-0.2 rounded font-mono uppercase">{inv.role}</span>
                          </div>
                          <span className="text-[10px] text-white/40 font-mono block mt-0.5">{inv.email}</span>
                        </div>

                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${inv.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-400/20 animate-pulse'}`}>
                          {inv.status === 'accepted' ? 'Принято' : 'Ожидает'}
                        </span>
                      </div>

                      {inv.status === 'pending' ? (
                        <div className="pt-2 border-t border-white/5 flex justify-end">
                          <button
                            onClick={() => handleAcceptInvitationSimulate(inv.id)}
                            className="w-full py-1.5 px-3 bg-[#1A2522] hover:bg-teal-500 hover:text-black border border-teal-500/20 text-teal-300 font-extrabold rounded-lg text-[10px] transition uppercase tracking-wider cursor-pointer"
                          >
                            🤝 Имитировать принятие сотрудником
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-white/5 flex gap-2 justify-between items-center">
                          <span className="text-[9px] text-emerald-400 font-mono">✓ Роль успешно присвоена!</span>
                          <button
                            onClick={() => handleLoginAsUser(inv.email)}
                            className="py-1 px-2.5 bg-teal-500 hover:bg-teal-400 text-black font-extrabold rounded-lg text-[9px] transition uppercase tracking-wider cursor-pointer"
                          >
                            Войти как {inv.name}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* --- ROLE VIEW 1: PLATFORM ADMIN --- */}
        {currentRole === 'platform_admin' && (
          <div className="space-y-6">
            
            {/* Header statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#16191F] rounded-xl p-4 border border-white/5">
                <span className="text-[10px] text-white/40 block font-mono">{t('rbac.globalRevenue')}</span>
                <span className="text-lg font-bold text-teal-400 font-mono">537 000 ₽</span>
                <span className="text-[9px] text-emerald-400 block mt-1">+12.4% с этой недели</span>
              </div>
              <div className="bg-[#16191F] rounded-xl p-4 border border-white/5">
                <span className="text-[10px] text-white/40 block font-mono">{t('rbac.activeBranches')}</span>
                <span className="text-lg font-bold text-white font-mono">4 бизнеса</span>
                <span className="text-[9px] text-teal-400 block mt-1">{t('rbac.saasModel')}</span>
              </div>
              <div className="bg-[#16191F] rounded-xl p-4 border border-white/5">
                <span className="text-[10px] text-white/40 block font-mono">{t('rbac.vatRate')}</span>
                <span className="text-lg font-bold text-white font-mono">10% - 15%</span>
                <span className="text-[9px] text-white/30 block mt-1">{t('rbac.realTimeAdjust')}</span>
              </div>
              <div className="bg-[#16191F] rounded-xl p-4 border border-white/5">
                <span className="text-[10px] text-white/40 block font-mono">{t('rbac.marketCommission')}</span>
                <span className="text-lg font-bold text-teal-400 font-mono">10% с транзакции</span>
                <span className="text-[9px] text-emerald-400 block mt-1">{t('rbac.directSplit')}</span>
              </div>
            </div>

            {/* Subscriptions & Tenants */}
            <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  Управление SaaS-подписками филиалов
                </h3>
                <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-full font-mono font-bold">БИЛЛИНГ СИСТЕМА</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 font-mono">
                      <th className="py-2.5 font-medium">Филиал / Бизнес</th>
                      <th className="py-2.5 font-medium">Владелец</th>
                      <th className="py-2.5 font-medium">Тариф подписки</th>
                      <th className="py-2.5 font-medium">Статус</th>
                      <th className="py-2.5 font-medium text-right">Накоплено</th>
                      <th className="py-2.5 font-medium text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {businesses.map((b) => (
                      <tr key={b.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 font-semibold text-white flex items-center gap-2">
                          <span className="text-lg">{b.logo}</span>
                          <span>{b.name}</span>
                        </td>
                        <td className="py-3 text-white/70">{b.owner}</td>
                        <td className="py-3 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${b.subscription === 'enterprise' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : b.subscription === 'professional' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-white/5 text-white/70 border border-white/10'}`}>
                            {b.subscription}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`w-2 h-2 rounded-full inline-block mr-1.5 ${b.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="capitalize text-[11px] text-white/60">{b.status}</span>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-white">{b.revenue.toLocaleString('ru-RU')} ₽</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              const updated = businesses.map(biz => biz.id === b.id ? { ...biz, status: biz.status === 'active' ? 'suspended' : 'active' } : biz);
                              setBusinesses(updated);
                              onAddNotification("Бизнес изменен", `Статус филиала ${b.name} успешно обновлен.`, "status");
                            }}
                            className="text-[10px] text-teal-400 hover:text-teal-300 font-bold px-2 py-1 rounded bg-white/5 hover:bg-white/10"
                          >
                            {b.status === 'active' ? "Приостановить" : "Активировать"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Grid: Role & Permission Matrix */}
            <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-400" />
                Интерактивная матрица ролей и полномочий (RBAC Grid)
              </h3>
              <p className="text-xs text-white/50 mb-4">
                Администратор платформы имеет право в реальном времени перестраивать цепочку авторизации (RBAC). Кликните по чекбоксу для применения.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 font-mono">
                      <th className="py-2 font-medium">Полномочие (Permission)</th>
                      <th className="py-2 text-center font-medium">Платформа-Админ</th>
                      <th className="py-2 text-center font-medium">Владелец Бизнеса</th>
                      <th className="py-2 text-center font-medium">Админ Бизнеса</th>
                      <th className="py-2 text-center font-medium">Менеджер</th>
                      <th className="py-2 text-center font-medium">Мастер / Staff</th>
                      <th className="py-2 text-center font-medium">Клиент</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {[
                      { key: "manage_subscriptions", label: "Управление подписками & биллингом" },
                      { key: "view_analytics", label: "Просмотр глобальной аналитики финансов" },
                      { key: "edit_services", label: "Редактирование услуг и тарифов" },
                      { key: "manage_calendar", label: "Администрирование всего календаря записей" },
                      { key: "view_schedule", label: "Просмотр назначенного личного расписания" },
                      { key: "book_appointments", label: "Создание и оплата бронирований" }
                    ].map((perm) => (
                      <tr key={perm.key} className="hover:bg-white/[0.01]">
                        <td className="py-2.5 text-white/80 font-semibold">{perm.label}</td>
                        {['platform_admin', 'business_owner', 'business_admin', 'manager', 'staff', 'client'].map((r) => {
                          const hasPerm = permissionsMatrix[r]?.includes(perm.key) || permissionsMatrix[r]?.includes("all_access");
                          const isStaticAll = permissionsMatrix[r]?.includes("all_access") && r === 'platform_admin';
                          return (
                            <td key={r} className="py-2.5 text-center">
                              <button
                                disabled={isStaticAll}
                                onClick={() => handleTogglePermission(r, perm.key)}
                                className={`w-5 h-5 rounded flex items-center justify-center mx-auto transition ${hasPerm ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40' : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'}`}
                              >
                                {hasPerm ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CSV Import/Export Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 mb-1.5">
                  <FileDown className="w-4 h-4 text-teal-400" />
                  Экспорт системных данных (CSV)
                </h3>
                <p className="text-xs text-white/50 mb-4">
                  Выгрузите актуальные срезы таблиц базы данных в формате CSV для внешнего аудита или бухгалтерии.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={() => handleExportCSV("users")}
                    className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-xs font-semibold rounded-xl text-left flex items-center justify-between transition"
                  >
                    <span>Выгрузить пользователей (Users)</span>
                    <FileDown className="w-4 h-4 text-teal-400" />
                  </button>
                  <button
                    onClick={() => handleExportCSV("bookings")}
                    className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-xs font-semibold rounded-xl text-left flex items-center justify-between transition"
                  >
                    <span>Выгрузить бронирования (Bookings)</span>
                    <FileDown className="w-4 h-4 text-teal-400" />
                  </button>
                  <button
                    onClick={() => handleExportCSV("businesses")}
                    className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white border border-white/5 text-xs font-semibold rounded-xl text-left flex items-center justify-between transition"
                  >
                    <span>Выгрузить биллинг SaaS (Subscribers)</span>
                    <FileDown className="w-4 h-4 text-teal-400" />
                  </button>
                </div>
              </div>

              <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 mb-1.5">
                  <FileUp className="w-4 h-4 text-purple-400" />
                  Пакетный импорт услуг (CSV Parser)
                </h3>
                <p className="text-xs text-white/50 mb-3">
                  Быстро импортируйте прайс-лист новых услуг. Вставьте CSV строку с колонками `name,price,category,desc` и нажмите импорт.
                </p>

                <div className="space-y-3">
                  <textarea
                    rows={3}
                    value={csvPaste}
                    onChange={e => setCsvPaste(e.target.value)}
                    placeholder="name,price,category,desc&#10;Медицинский Пилинг,3800,Beauty & Style,Очищение кожи&#10;Кардио Интенсив,2500,Fitness & Active,Кардиотренировка"
                    className="w-full px-3 py-2 bg-[#090A0D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                  
                  {csvMessage && (
                    <div className="text-[11px] font-mono text-teal-400 bg-teal-500/5 p-2 rounded-lg border border-teal-500/20">
                      {csvMessage}
                    </div>
                  )}

                  <button
                    onClick={handleImportCSV}
                    className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs rounded-xl transition uppercase tracking-wider"
                  >
                    Запустить импорт CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Webhooks & API Integration */}
            <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4 text-purple-400" />
                Интеграции & Webhooks система
              </h3>
              <p className="text-xs text-white/50 mb-4">
                Настройте отправку мгновенных уведомлений (Webhooks) на внешние CRM/ERP системы при изменении статусов бронирования.
              </p>

              <form onSubmit={handleAddWebhook} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                <div className="md:col-span-2">
                  <input
                    type="url"
                    value={newWebhookUrl}
                    onChange={e => setNewWebhookUrl(e.target.value)}
                    placeholder="https://your-domain.com/webhook-listener"
                    className="w-full px-3 py-2 bg-[#090A0D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <select
                    value={newWebhookEvent}
                    onChange={e => setNewWebhookEvent(e.target.value)}
                    className="w-full px-3 py-2 bg-[#090A0D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="booking.created">booking.created</option>
                    <option value="booking.cancelled">booking.cancelled</option>
                    <option value="invoice.paid">invoice.paid</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="py-2 px-3 bg-white/10 hover:bg-white/15 text-white border border-white/5 text-xs font-bold rounded-xl transition"
                >
                  Добавить вебхук
                </button>
              </form>

              <div className="space-y-4">
                <div className="font-mono text-[10px] text-white/40 mb-2 uppercase font-bold">Список зарегистрированных вебхуков:</div>
                <div className="space-y-2">
                  {webhooks.map((w) => (
                    <div key={w.id} className="p-3 bg-[#090A0D] rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{w.url}</span>
                          <span className="bg-purple-500/15 text-purple-400 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded">
                            {w.event}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/40 mt-1">Доставлено событий: {w.deliveries}</div>
                      </div>
                      
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          onClick={() => handleSimulateWebhook(w)}
                          className="py-1 px-2.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded text-[10px] font-bold border border-teal-500/20"
                        >
                          Симулировать вызов
                        </button>
                        <button
                          onClick={() => setWebhooks(webhooks.filter(wh => wh.id !== w.id))}
                          className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="font-mono text-[10px] text-white/40 mb-2 uppercase font-bold">Лог последних HTTP вызовов вебхуков:</div>
                  <div className="bg-[#090A0D] rounded-xl p-3 border border-white/5 divide-y divide-white/5 max-h-40 overflow-y-auto">
                    {webhookLogs.map((log) => (
                      <div key={log.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between text-[10px] font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400">[{log.status} OK]</span>
                          <span className="text-white/60">{log.event}</span>
                          <span className="text-white/30">→</span>
                          <span className="text-white/40 truncate max-w-xs">{log.url}</span>
                        </div>
                        <span className="text-white/30">{log.timestamp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- ROLE VIEW 2: BUSINESS OWNER / ADMIN --- */}
        {(currentRole === 'business_owner' || currentRole === 'business_admin') && (
          <div className="space-y-6">
            
            {/* Quick Actions Panel */}
            <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/[0.03] rounded-full blur-2xl pointer-events-none" />
              <div>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-teal-400 animate-pulse" />
                  Экспресс QR-регистрация гостей
                </h3>
                <p className="text-xs text-white/50">
                  Мгновенно отмечайте визиты клиентов, сканируя QR-коды бронирований или универсальные пропуска со смартфона гостя.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQrScanner(true)}
                className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-teal-500/10 shrink-0 self-start md:self-auto"
              >
                <Camera className="w-4 h-4" />
                Запустить QR-сканер
              </button>
            </div>

            {/* Branding customizer & Info */}
            <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-teal-400" />
                  Управление брендингом филиала
                </h3>
                <p className="text-xs text-white/50 leading-relaxed">
                  Настройте локальное позиционирование вашего бизнеса. Изменения коснутся отображения ваших услуг в глобальном каталоге OmniReserve.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 mb-1">НАЗВАНИЕ БИЗНЕСА</label>
                    <input
                      type="text"
                      value={bizBranding.name}
                      onChange={e => setBizBranding({ ...bizBranding, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#090A0D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 mb-1">ФИРМЕННЫЙ ЦВЕТ</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={bizBranding.color}
                        onChange={e => setBizBranding({ ...bizBranding, color: e.target.value })}
                        className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={bizBranding.color}
                        onChange={e => setBizBranding({ ...bizBranding, color: e.target.value })}
                        className="flex-1 px-3 py-1.5 bg-[#090A0D] border border-white/10 rounded-xl text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#090A0D] rounded-xl p-4 border border-white/5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-white/30 font-mono uppercase font-bold block mb-2">Превью Карточки</span>
                  <div className="p-3 bg-[#16191F] rounded-lg border border-white/5 flex items-center gap-3">
                    <span className="text-2xl">🌸</span>
                    <div>
                      <h4 className="font-semibold text-xs text-white" style={{ color: bizBranding.color }}>{bizBranding.name}</h4>
                      <p className="text-[10px] text-white/40">Wellness Hub • 5★</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onAddNotification("Настройки сохранены", "Брендинг успешно обновлен и синхронизирован.", "status")}
                  className="w-full mt-4 py-2 bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs rounded-lg transition"
                >
                  Сохранить брендинг
                </button>
              </div>

            </div>

            {/* Services pricing management */}
            <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-purple-400" />
                  Управление каталогом услуг и прайс-листами
                </h3>
                
                <button
                  onClick={() => setIsAddingService(!isAddingService)}
                  className="py-1.5 px-3 bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Plus className="w-4.5 h-4.5" />
                  Добавить услугу
                </button>
              </div>

              {/* Form Add Service */}
              <AnimatePresence>
                {isAddingService && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleAddBusinessService}
                    className="p-4 bg-[#090A0D] rounded-xl border border-white/5 mb-6 space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-mono text-white/40 mb-1">НАЗВАНИЕ УСЛУГИ</label>
                        <input
                          type="text"
                          value={newService.name}
                          onChange={e => setNewService({ ...newService, name: e.target.value })}
                          placeholder="Тайский массаж стоп"
                          className="w-full px-3 py-2 bg-[#16191F] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-white/40 mb-1">КАТЕГОРИЯ</label>
                        <select
                          value={newService.category}
                          onChange={e => setNewService({ ...newService, category: e.target.value as any })}
                          className="w-full px-3 py-2 bg-[#16191F] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                        >
                          <option value="Spa & Wellness">Spa & Wellness</option>
                          <option value="Fitness & Active">Fitness & Active</option>
                          <option value="Beauty & Style">Beauty & Style</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-white/40 mb-1">ЦЕНА УСЛУГИ (₽)</label>
                        <input
                          type="number"
                          value={newService.price}
                          onChange={e => setNewService({ ...newService, price: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-[#16191F] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-white/40 mb-1">ОПИСАНИЕ УСЛУГИ</label>
                      <input
                        type="text"
                        value={newService.description}
                        onChange={e => setNewService({ ...newService, description: e.target.value })}
                        placeholder="Краткое описание процедуры для карточки в каталоге..."
                        className="w-full px-3 py-2 bg-[#16191F] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingService(false)}
                        className="py-1.5 px-3 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-white"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="py-1.5 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-black font-bold text-xs"
                      >
                        Сохранить в каталог
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((s) => (
                  <div key={s.id} className="p-3.5 bg-[#090A0D] rounded-xl border border-white/5 flex gap-3">
                    <img
                      src={s.image}
                      alt={s.name}
                      className="w-16 h-16 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[9px] font-mono font-bold text-teal-400 uppercase">{s.category}</span>
                        <span className="text-xs font-mono font-bold text-white shrink-0">{s.price} ₽</span>
                      </div>
                      <h4 className="font-semibold text-xs text-white truncate mt-0.5">{s.name}</h4>
                      <p className="text-[10px] text-white/40 line-clamp-2 mt-1">{s.description}</p>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[9px] font-mono text-white/30">Мастеров: {s.staff?.length || 1}</span>
                        <button
                          onClick={() => {
                            setServices(services.filter(svc => svc.id !== s.id));
                            onAddNotification("Услуга удалена", `Процедура "${s.name}" удалена из прайс-листа.`, "status");
                          }}
                          className="p-1 text-red-400 hover:bg-red-500/10 rounded"
                          title="Удалить услугу"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payouts, Commissions, & Invoices */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="md:col-span-2 bg-[#16191F] rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-teal-400" />
                    Выплаты & Рассчет комиссий (Stripe Payouts)
                  </h3>
                  <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded font-mono font-bold">10% MARKETPLACE CUT</span>
                </div>

                <p className="text-xs text-white/50 leading-relaxed mb-4">
                  Выплаты осуществляются напрямую на ваш Express Connect аккаунт. Выручка перечисляется за вычетом 10% комиссии маркетплейса OmniReserve.
                </p>

                <div className="space-y-2">
                  <div className="font-mono text-[10px] text-white/40 mb-2 uppercase font-bold">История выплат:</div>
                  <div className="divide-y divide-white/5 bg-[#090A0D] rounded-xl border border-white/5 p-2">
                    {ownerPayouts.map((p) => (
                      <div key={p.id} className="py-2.5 px-2 flex items-center justify-between text-xs hover:bg-white/[0.01]">
                        <div>
                          <div className="font-semibold text-white">{p.amount.toLocaleString('ru-RU')} ₽</div>
                          <div className="text-[10px] text-white/40 font-mono">{p.date} • {p.account}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${p.status === 'completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                          {p.status === 'completed' ? 'Зачислено' : 'В процессе'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onAddNotification("Запрос отправлен", "Перевод средств со счета Stripe Connect на банковский счет успешно инициирован.", "status");
                  }}
                  className="w-full mt-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition"
                >
                  Вывести свободный баланс на реквизиты банка
                </button>
              </div>

              <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 mb-1.5">
                    <Award className="w-4 h-4 text-purple-400" />
                    Финансовая Сводка
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Сводный финансовый отчет по операциям филиала за текущий отчетный период.
                  </p>

                  <div className="mt-4 space-y-2 font-mono text-xs">
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-white/40">Оборот по заказам:</span>
                      <span className="text-white font-bold">85 000 ₽</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-white/5">
                      <span className="text-white/40">Комиссия (10%):</span>
                      <span className="text-red-400">-8 500 ₽</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-white/40">К выводу (Net):</span>
                      <span className="text-emerald-400 font-bold">76 500 ₽</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 space-y-1.5">
                  <span className="text-[10px] text-white/30 font-mono uppercase font-bold block">Счета-фактуры (Invoices):</span>
                  <button
                    onClick={() => onAddNotification("Счет сгенерирован", "Симуляция счета-фактуры: PDF-файл сформирован и готов к печати.", "status")}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold rounded-lg transition"
                  >
                    Экспортировать отчет за Июль 2026 (PDF)
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* --- ROLE VIEW 3: MANAGER / RECEPTIONIST --- */}
        {currentRole === 'manager' && (
          <div className="space-y-6">
            
            {/* Search and filters */}
            <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-teal-400" />
                  Панель диспетчера бронирований
                </h3>
                <p className="text-xs text-white/50">
                  Менеджер имеет доступ к полному календарю встреч и может корректировать записи в реальном времени.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowQrScanner(true)}
                  className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-teal-500/10"
                  title="Сканировать QR-код чекина гостя"
                >
                  <Camera className="w-4 h-4" />
                  <span>Сканировать QR</span>
                </button>

                <div className="relative">
                  <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={managerSearchTerm}
                    onChange={e => setManagerSearchTerm(e.target.value)}
                    placeholder="Поиск по ID / имени..."
                    className="pl-9 pr-4 py-1.5 bg-[#090A0D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 w-full sm:w-48 font-semibold"
                  />
                </div>

                <div className="flex bg-white/5 border border-white/10 p-0.5 rounded-lg">
                  {[
                    { id: 'all', label: "Все" },
                    { id: 'table', label: "Столы" },
                    { id: 'service', label: "Услуги" }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setManagerActiveFilter(f.id as any)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition ${managerActiveFilter === f.id ? 'bg-teal-500 text-black font-bold' : 'text-white/60 hover:text-white'}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Central Master Schedule / Calendar list */}
            <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5">
              <h4 className="font-mono text-[10px] text-white/40 mb-3 uppercase font-bold">Активные бронирования клиентов:</h4>
              
              <div className="space-y-3">
                {bookings.length === 0 ? (
                  <div className="py-12 text-center text-xs text-white/30 border border-dashed border-white/10 rounded-xl">
                    В системе нет активных бронирований.
                  </div>
                ) : (
                  bookings
                    .filter(b => {
                      if (managerActiveFilter !== 'all' && b.type !== managerActiveFilter) return false;
                      if (managerSearchTerm.trim()) {
                        const term = managerSearchTerm.toLowerCase();
                        if (b.id.toLowerCase().includes(term)) return true;
                        if (b.type === 'service' && b.serviceName.toLowerCase().includes(term)) return true;
                        if (b.type === 'service' && b.staffName.toLowerCase().includes(term)) return true;
                        if (b.type === 'table' && b.room.toLowerCase().includes(term)) return true;
                        return false;
                      }
                      return true;
                    })
                    .map((b) => {
                      const bStatus = staffActiveStatus[b.id] || "Confirmed";
                      return (
                        <div key={b.id} className="p-4 bg-[#090A0D] rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex gap-3">
                            <div className={`p-2.5 rounded-xl shrink-0 ${b.type === 'table' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                              {b.type === 'table' ? <Grid className="w-5 h-5" /> : <Scissors className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-white">
                                  {b.type === 'table' ? `Бронь стола #${b.tableNumber}` : `${b.serviceName}`}
                                </span>
                                <span className="text-[10px] font-mono text-white/30">{b.id}</span>
                              </div>
                              <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                                {b.type === 'table' ? `Зал: ${b.room} • Гостей: ${b.guests} • Депозит: ${b.price} ₽` : `Специалист: ${b.staffName} • Категория: ${b.category} • Стоимость: ${b.price} ₽`}
                              </p>
                              
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-white/40">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.date}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.time}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="text-[10px] font-mono text-white/30 uppercase mr-1">Статус:</span>
                            <select
                              value={bStatus}
                              onChange={e => handleManagerUpdateBooking(b.id, e.target.value)}
                              className="px-2 py-1 bg-[#16191F] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                            >
                              <option value="Confirmed">Подтвержден</option>
                              <option value="In Progress">В процессе</option>
                              <option value="Completed">Выполнен</option>
                              <option value="Cancelled">Отменен</option>
                            </select>

                            <button
                              onClick={() => {
                                setBookings(bookings.filter(bk => bk.id !== b.id));
                                onAddNotification("Бронирование удалено", `Запись ${b.id} полностью удалена из базы менеджером.`, "status");
                              }}
                              className="p-1 text-red-400 hover:bg-red-500/15 rounded"
                              title="Удалить запись"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Clients profiles CRM */}
            <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-purple-400" />
                База клиентов & CRM-профили
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: "Мария Смирнова", email: "maria@example.com", phone: "+7 (999) 043-12-11", notes: "Предпочитает лавандовое масло, столы у окна на летней веранде.", tier: "Gold VIP" },
                  { name: "Алексей Иванов", email: "alex@example.com", phone: "+7 (911) 450-20-30", notes: "Тренировки высокой интенсивности, VIP комнаты в ресторане.", tier: "Platinum VIP" }
                ].map((c, idx) => (
                  <div key={idx} className="p-3.5 bg-[#090A0D] rounded-xl border border-white/5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-white">{c.name}</span>
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 font-bold px-2 py-0.5 rounded border border-purple-500/20 font-mono uppercase">{c.tier}</span>
                      </div>
                      <p className="text-[11px] text-white/40 font-mono mt-0.5">{c.email} • {c.phone}</p>
                      <p className="text-xs text-white/60 mt-2 italic leading-relaxed">«{c.notes}»</p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                      <button
                        onClick={() => {
                          onAddNotification("Профиль отправлен", `Напомнили клиенту ${c.name} о его персональных скидках.`, "status");
                        }}
                        className="text-[10px] text-teal-400 hover:text-teal-300 font-bold px-2 py-1 rounded bg-white/5"
                      >
                        Отправить промокод
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* --- ROLE VIEW 4: STAFF / PRACTITIONER --- */}
        {currentRole === 'staff' && (
          <div className="space-y-6">
            
            <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 mb-1.5">
                <Calendar className="w-4 h-4 text-teal-400" />
                Расписание назначенного специалиста: Елена Соколова
              </h3>
              <p className="text-xs text-white/50 mb-4">
                Вы вошли как специалист **Елена Соколова** (Ведущий спа-терапевт). Ниже отображаются только те бронирования, где вы назначены исполнителем.
              </p>

              <div className="space-y-3">
                {bookings.filter(b => b.type === 'service' && b.staffName.toLowerCase().includes("елена")).length === 0 ? (
                  <div className="py-12 text-center text-xs text-white/30 border border-dashed border-white/10 rounded-xl">
                    У вас пока нет назначенных записей на выбранную дату.
                  </div>
                ) : (
                  bookings
                    .filter(b => b.type === 'service' && b.staffName.toLowerCase().includes("елена"))
                    .map((b) => {
                      const bStatus = staffActiveStatus[b.id] || "Confirmed";
                      return (
                        <div key={b.id} className="p-4 bg-[#090A0D] rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex gap-3">
                            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0 self-start">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-white">{b.type === 'service' ? b.serviceName : ""}</span>
                                <span className="text-[10px] font-mono text-white/30">{b.id}</span>
                              </div>
                              <p className="text-[11px] text-white/50 mt-0.5 leading-relaxed">
                                Категория: {b.type === 'service' ? b.category : ""} • Гость: Мария Смирнова • Длительность: 90 минут
                              </p>
                              
                              <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-white/40">
                                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {b.date}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {b.time}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="text-[10px] font-mono text-white/30 uppercase">Мой статус:</span>
                            <div className="flex gap-1">
                              {[
                                { id: "Confirmed", label: "Ожидаю", color: "bg-white/5 text-white border-white/10" },
                                { id: "In Progress", label: "Прием", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
                                { id: "Completed", label: "Выполнен", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" }
                              ].map((st) => {
                                const isCurrent = bStatus === st.id;
                                return (
                                  <button
                                    key={st.id}
                                    onClick={() => handleStaffUpdateState(b.id, st.id)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold border transition ${isCurrent ? st.color + ' font-extrabold ring-1 ring-white/10' : 'bg-[#16191F] text-white/40 border-white/5 hover:bg-white/5'}`}
                                  >
                                    {st.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

          </div>
        )}

        {/* --- ROLE VIEW 5: CLIENT --- */}
        {currentRole === 'client' && (
          <div className="space-y-6">
            
            {/* Loyalty points banner */}
            <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-teal-400 uppercase tracking-widest font-mono font-bold">ПРОГРАММА ЛОЯЛЬНОСТИ</span>
                    <span className="bg-teal-500 text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded font-mono">GOLD MEMBER</span>
                  </div>
                  <h3 className="font-display font-bold text-lg text-white mt-1">Золотой статус привилегий</h3>
                  <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                    Вам начисляется 10% кэшбека бонусами с каждой оплаченной спа-процедуры и брони стола.
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right relative z-10 bg-[#090A0D] p-4 rounded-xl border border-white/5 min-w-[140px]">
                <span className="text-[10px] text-white/40 font-mono block uppercase">ДОСТУПНЫЕ БОНУСЫ</span>
                <span className="text-xl font-bold text-teal-400 font-mono">{loyaltyPoints} БОН</span>
                <span className="text-[9px] text-white/30 block mt-0.5">= {loyaltyPoints} руб на скидку</span>
              </div>
            </div>

            {/* Profile Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-purple-400" />
                  Персональный профиль
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 mb-1">ФИО КЛИЕНТА</label>
                    <input
                      type="text"
                      value={user.name}
                      onChange={e => setUser({ ...user, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#090A0D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 mb-1">ТЕЛЕФОН СВЯЗИ</label>
                    <input
                      type="text"
                      value={clientProfile.phone}
                      onChange={e => setClientProfile({ ...clientProfile, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#090A0D] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-white/40 mb-1">МГНОВЕННЫЕ PUSH УВЕДОМЛЕНИЯ</label>
                    <button
                      type="button"
                      onClick={() => setClientProfile({ ...clientProfile, notificationsEnabled: !clientProfile.notificationsEnabled })}
                      className={`w-full py-2 px-3 rounded-xl border text-left transition flex items-center justify-between ${clientProfile.notificationsEnabled ? 'bg-teal-500/5 border-teal-500/30 text-teal-400' : 'bg-[#090A0D] border-white/10 text-white/40'}`}
                    >
                      <span>{clientProfile.notificationsEnabled ? "Включены (SMS / Telegram)" : "Отключены"}</span>
                      <Check className={`w-4 h-4 transition ${clientProfile.notificationsEnabled ? 'opacity-100' : 'opacity-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#16191F] rounded-2xl p-5 border border-white/5">
                <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-red-400" />
                  Моё Избранное (Favorites)
                </h3>
                <p className="text-xs text-white/50 mb-3 leading-relaxed">
                  Быстрый доступ к вашим любимым услугам и процедурам в одно касание:
                </p>

                <div className="space-y-2">
                  {services.map((s) => {
                    const isFav = favorites.includes(s.id);
                    return (
                      <div key={s.id} className="p-2.5 bg-[#090A0D] rounded-xl border border-white/5 flex items-center justify-between gap-2 text-xs">
                        <div className="truncate pr-2">
                          <span className="font-semibold text-white block truncate leading-tight">{s.name}</span>
                          <span className="text-[9px] text-white/40 font-mono mt-0.5">{s.price} ₽ • {s.category}</span>
                        </div>

                        <button
                          onClick={() => handleToggleFavorite(s.id)}
                          className={`p-1.5 rounded-lg transition shrink-0 ${isFav ? 'bg-red-500/10 text-red-400' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Camera-based QR Scanner Component */}
      <QRScanner
        isOpen={showQrScanner}
        onClose={() => setShowQrScanner(false)}
        onScanSuccess={handleQrScanSuccess}
      />

      {/* QR Scan Result Feedback Dialog */}
      <AnimatePresence>
        {(scannedBooking || scannedUserInfo || scanResultError) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setScannedBooking(null);
                setScannedUserInfo(null);
                setScannedUserBookings([]);
                setScanResultError(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#16191F] border border-white/10 rounded-3xl p-6 max-w-md w-full relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Scanned Specific Booking Successfully */}
              {scannedBooking && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center text-center pb-4 border-b border-white/5">
                    <div className="w-16 h-16 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20 mb-3 animate-bounce">
                      <Check className="w-8 h-8 stroke-[3]" />
                    </div>
                    <h4 className="font-display font-bold text-lg text-white">Визит подтвержден!</h4>
                    <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider block font-bold">Бронирование успешно отмечено как выполнено</span>
                  </div>

                  <div className="space-y-3 bg-black/30 p-4 rounded-2xl border border-white/5 text-xs text-white/70">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">ID бронирования:</span>
                      <span className="font-mono font-bold text-white">{scannedBooking.id}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">Категория:</span>
                      <span className="font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono">
                        {scannedBooking.type === "table" ? "Ресторан" : "Спа и Салон"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">Позиция / Услуга:</span>
                      <span className="font-bold text-white">
                        {scannedBooking.type === "table" ? `Столик #${scannedBooking.tableNumber} (${scannedBooking.room === 'main' ? 'Главный зал' : scannedBooking.room === 'vip' ? 'VIP' : 'Терраса'})` : scannedBooking.serviceName}
                      </span>
                    </div>
                    {scannedBooking.type === "service" && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/40">Мастер:</span>
                        <span className="font-bold text-white">{scannedBooking.staffName}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">Запись на:</span>
                      <span className="font-bold text-teal-400">{scannedBooking.date} в {scannedBooking.time}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40">Сумма депозита:</span>
                      <span className="font-mono text-white font-bold">{scannedBooking.price} ₽</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setScannedBooking(null)}
                      className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs uppercase tracking-wider transition cursor-pointer shadow-lg shadow-teal-500/10"
                    >
                      Отлично
                    </button>
                  </div>
                </div>
              )}

              {/* Scanned Personal User Card */}
              {scannedUserInfo && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center text-center pb-4 border-b border-white/5">
                    <div className="w-16 h-16 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 mb-3 animate-pulse">
                      <User className="w-8 h-8" />
                    </div>
                    <h4 className="font-display font-bold text-lg text-white">Клиент зарегистрирован</h4>
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block font-mono font-bold">{scannedUserInfo.email}</span>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-[11px] font-mono text-white/40 uppercase tracking-wider font-extrabold">Активные записи гостя:</h5>
                    
                    {scannedUserBookings.length === 0 ? (
                      <div className="py-6 text-center text-xs text-white/40 border border-dashed border-white/10 rounded-xl bg-black/20">
                        Нет предстоящих визитов для этого клиента.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {scannedUserBookings.map((b) => {
                          const isCompleted = staffActiveStatus[b.id] === "Completed";
                          return (
                            <div key={b.id} className="p-3 bg-[#090A0D] border border-white/5 rounded-xl flex justify-between items-center gap-3 text-xs">
                              <div>
                                <div className="font-bold text-white">
                                  {b.type === 'table' ? `Ресторан • Стол #${b.tableNumber}` : b.serviceName}
                                </div>
                                <span className="text-[10px] text-white/40 font-mono block mt-0.5">{b.date} в {b.time}</span>
                              </div>
                              
                              {isCompleted ? (
                                <span className="text-[10px] font-mono text-teal-400 font-bold bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded">Выполнен</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleManagerUpdateBooking(b.id, "Completed");
                                    // Update local item status for instant UI update in feedback modal
                                    setScannedUserBookings(prev => 
                                      prev.map(item => item.id === b.id ? { ...item } : item)
                                    );
                                  }}
                                  className="px-2.5 py-1 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-[10px] uppercase rounded-lg transition cursor-pointer"
                                >
                                  Чекин
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScannedUserInfo(null);
                        setScannedUserBookings([]);
                      }}
                      className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              )}

              {/* Scanned Error State */}
              {scanResultError && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center text-center pb-4 border-b border-white/5">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 mb-3">
                      <AlertTriangle className="w-8 h-8 animate-bounce" />
                    </div>
                    <h4 className="font-display font-bold text-lg text-white">Ошибка сканирования</h4>
                    <span className="text-[10px] font-mono text-red-400 uppercase tracking-wider block font-bold">Информация не распознана</span>
                  </div>

                  <p className="text-center text-xs text-white/70 leading-relaxed font-semibold">
                    {scanResultError}
                  </p>

                  <div className="flex justify-end pt-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScanResultError(null);
                        setShowQrScanner(true);
                      }}
                      className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer shadow-lg shadow-teal-500/10"
                    >
                      Повторить
                    </button>
                    <button
                      type="button"
                      onClick={() => setScanResultError(null)}
                      className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-extrabold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
