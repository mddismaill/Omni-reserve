import express from "express";
import path from "path";
import crypto from "crypto";
import http from "http";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { User, Table, Service, Booking, AIRecommendation, TableBooking, ServiceBooking, Notification, Restaurant, Salon, Review } from "./src/types";

// --- Password hashing (scrypt) ---
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${derived}`;
}
function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const [, salt, hash] = stored.split("$");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(derived, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// --- Session tokens (in-memory) ---
const sessions = new Map<string, string>(); // token -> userId
function issueToken(userId: string): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, userId);
  return token;
}

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY is not configured or still has placeholder value.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// In-memory Database state
const users: User[] = [
  {
    id: "user-1",
    name: "Мария Смирнова",
    email: "maria@example.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    role: "client",
    preferences: ["Спа", "Йога", "Уютные столики у окна"],
    balance: 15000
  },
  {
    id: "user-2",
    name: "Алексей Иванов",
    email: "alex@example.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    role: "client",
    preferences: ["Интенсивный фитнес", "Мясо на гриле", "VIP-комнаты"],
    balance: 8500
  },
  {
    id: "user-admin",
    name: "Александр Админ",
    email: "admin@example.com",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150",
    role: "platform_admin",
    preferences: [],
    balance: 999999
  },
  {
    id: "user-owner",
    name: "Виктор Владелец",
    email: "owner@example.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    role: "business_owner",
    preferences: [],
    balance: 50000
  },
  {
    id: "user-manager",
    name: "Екатерина Менеджер",
    email: "manager@example.com",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    role: "manager",
    preferences: [],
    balance: 20000
  },
  {
    id: "user-staff",
    name: "Елена Соколова",
    email: "staff@example.com",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150",
    role: "staff",
    preferences: [],
    balance: 12000
  }
];

// Password store — values are scrypt hashes, never plaintext.
const userPasswords: Record<string, string> = {};
for (const email of [
  "maria@example.com",
  "alex@example.com",
  "admin@example.com",
  "owner@example.com",
  "manager@example.com",
  "staff@example.com",
]) {
  userPasswords[email] = hashPassword("password");
}

// Staff list for Bookly services
const staffList = [
  { id: "staff-1", name: "Елена Соколова", role: "Ведущий спа-терапевт", rating: 4.9, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120" },
  { id: "staff-2", name: "Дмитрий Петров", role: "Элитный фитнес-тренер", rating: 4.9, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120" },
  { id: "staff-3", name: "Анна Кузнецова", role: "Топ-стилист", rating: 4.8, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" },
  { id: "staff-4", name: "Ольга Морозова", role: "Мастер массажа и йоги", rating: 4.7, avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120" }
];

// Salons & Other business centers list for Bookly
const salons: Salon[] = [
  {
    id: "lotus-spa",
    name: "Lotus Spa & Wellness",
    description: "Роскошный спа-оазис премиум-класса. Профессиональный массаж, расслабляющие ритуалы ухода, хаммам и фито-бар.",
    category: "Spa & Wellness",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    address: "ул. Лесная, д. 5, стр. 2"
  },
  {
    id: "gold-gym",
    name: "Gold Gym Active",
    description: "Современный фитнес-центр с Elite-инструкторами, инновационным силовым и кардио-оборудованием и залами для групповых программ.",
    category: "Fitness & Active",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    address: "пр-т Мира, д. 42"
  },
  {
    id: "prime-barber",
    name: "Prime Barber & Style",
    description: "Концептуальное пространство красоты и стиля. Авторские стрижки, премиальный уход от топ-стилистов и атмосфера закрытого клуба.",
    category: "Beauty & Style",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    address: "Большой Козихинский пер., д. 12"
  }
];

const services: Service[] = [
  {
    id: "spa-1",
    name: "Премиальный Спа-Ритуал «Гармония»",
    category: "Spa & Wellness",
    duration: 90,
    price: 4500,
    rating: 4.9,
    description: "Комплексный уход за телом и лицом: пилинг, расслабляющее обертывание и массаж с теплыми аромамаслами.",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=500",
    staff: [staffList[0], staffList[3]],
    salonId: "lotus-spa",
    salonName: "Lotus Spa & Wellness"
  },
  {
    id: "spa-2",
    name: "Глубокий массаж мышц (Deep Tissue)",
    category: "Spa & Wellness",
    duration: 60,
    price: 3200,
    rating: 4.8,
    description: "Интенсивный терапевтический массаж для снятия хронического напряжения и восстановления после нагрузок.",
    image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=500",
    staff: [staffList[0], staffList[3]],
    salonId: "lotus-spa",
    salonName: "Lotus Spa & Wellness"
  },
  {
    id: "fit-1",
    name: "Персональная тренировка с Elite-инструктором",
    category: "Fitness & Active",
    duration: 60,
    price: 2000,
    rating: 4.9,
    description: "Индивидуальный план занятий, постановка техники движений, рекомендации по питанию и высокая мотивация.",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=500",
    staff: [staffList[1]],
    salonId: "gold-gym",
    salonName: "Gold Gym Active"
  },
  {
    id: "fit-2",
    name: "Групповое занятие Хатха-Йогой",
    category: "Fitness & Active",
    duration: 75,
    price: 1200,
    rating: 4.6,
    description: "Практика асан, дыхательных упражнений и глубокая релаксация в конце класса для баланса ума и тела.",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=500",
    staff: [staffList[3]],
    salonId: "gold-gym",
    salonName: "Gold Gym Active"
  },
  {
    id: "beauty-1",
    name: "Стрижка, укладка и уход от Топ-стилиста",
    category: "Beauty & Style",
    duration: 60,
    price: 3500,
    rating: 4.9,
    description: "Создание индивидуального стиля, бережное мытье с профессиональным уходом и безупречная укладка.",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=500",
    staff: [staffList[2]],
    salonId: "prime-barber",
    salonName: "Prime Barber & Style"
  },
  {
    id: "beauty-2",
    name: "Аппаратный Маникюр & Спа-уход для рук",
    category: "Beauty & Style",
    duration: 45,
    price: 1800,
    rating: 4.8,
    description: "Профессиональная обработка ногтей, пилинг, питательная маска и легкий массаж кистей с ароматным кремом.",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=500",
    staff: [staffList[2]],
    salonId: "prime-barber",
    salonName: "Prime Barber & Style"
  }
];

// Restaurants and Tables Layout
const restaurants: Restaurant[] = [
  {
    id: "grand-atelier",
    name: "Grand Atelier",
    description: "Кухня высокой французской гастрономии от шеф-повара со звездой Мишлен. Идеальная винная карта, живая арфа и панорамный вид на реку.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    cuisine: "Французская высокая кухня",
    rooms: {
      main: "Основной зал Grand Hall",
      vip: "VIP Кабинет Atelier",
      terrace: "Терраса у воды"
    }
  },
  {
    id: "sakura-zen",
    name: "Sakura Zen",
    description: "Аутентичный японский минимализм. Свежайшие морепродукты с токийского рынка, живой теппан-гриль шоу и умиротворяющий дзен-сад с бамбуком.",
    image: "https://images.unsplash.com/photo-1579027989536-b7b1714a6e56?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    cuisine: "Японская / Суши / Теппан",
    rooms: {
      main: "Зал Дзен-Сад",
      vip: "VIP Чайная комната",
      terrace: "Бамбуковая веранда"
    }
  },
  {
    id: "bison-vine",
    name: "Bison & Vine",
    description: "Легендарный стейкхаус с открытым дровяным грилем. Премиальная мраморная говядина влажного и сухого вызревания, брутальный кирпичный декор.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    cuisine: "Гриль / Стейки / Барбекю",
    rooms: {
      main: "Главный Гриль-Зал",
      vip: "Каминный VIP Зал",
      terrace: "Уютная Патио-Веранда"
    }
  }
];

const restaurantReviews: Review[] = [
  {
    id: "rev-ga-1",
    restaurantId: "grand-atelier",
    userName: "Александр Волков",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150",
    rating: 5,
    text: "Потрясающая французская кухня! Утиная грудка с инжиром — это просто шедевр. Атмосфера очень изысканная, живая арфа создаёт волшебное настроение. Обязательно вернемся снова.",
    createdAt: "2026-07-01T19:30:00.000Z"
  },
  {
    id: "rev-ga-2",
    restaurantId: "grand-atelier",
    userName: "Екатерина Петрова",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    rating: 4,
    text: "Прекрасный вид на реку из окон! Обслуживание на высшем уровне, официанты очень внимательные. Немного завышены цены на вино, но качество блюд оправдывает всё.",
    createdAt: "2026-07-05T18:15:00.000Z"
  },
  {
    id: "rev-sz-1",
    restaurantId: "sakura-zen",
    userName: "Дмитрий Ким",
    userAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
    rating: 5,
    text: "Лучшие суши в городе! Теппан-шоу от повара завораживает, еда готовится прямо перед твоими глазами. Дзен-сад во внутреннем дворике добавляет умиротворения.",
    createdAt: "2026-07-03T20:00:00.000Z"
  },
  {
    id: "rev-sz-2",
    restaurantId: "sakura-zen",
    userName: "Ольга Соколова",
    userAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
    rating: 5,
    text: "Очень аутентичный интерьер и вежливый персонал. Сашими из тунца тает во рту. Подача блюд эстечески безупречна.",
    createdAt: "2026-07-08T19:00:00.000Z"
  },
  {
    id: "rev-bv-1",
    restaurantId: "bison-vine",
    userName: "Михаил Кузнецов",
    userAvatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150",
    rating: 5,
    text: "Стейк Рибай прожарки Medium Rare просто божественный! Сочный, нежный, с ароматом дровяного дымка. Отличный выбор крафтового пива и вина к мясу.",
    createdAt: "2026-07-02T21:00:00.000Z"
  },
  {
    id: "rev-bv-2",
    restaurantId: "bison-vine",
    userName: "Елена Морозова",
    userAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150",
    rating: 4,
    text: "Брутальный мужской интерьер, отличная вытяжка — запаха дыма в зале совсем нет. Стейки отличные, но порции гарниров могли бы быть чуть побольше.",
    createdAt: "2026-07-07T18:45:00.000Z"
  }
];

const tables: Table[] = [
  // 1. Grand Atelier
  { id: "ga-1", number: 1, capacity: 4, x: 100, y: 120, width: 70, height: 70, shape: "circle", type: "standard", room: "main", price: 1000, restaurantId: "grand-atelier" },
  { id: "ga-2", number: 2, capacity: 6, x: 230, y: 120, width: 100, height: 70, shape: "rect", type: "standard", room: "main", price: 1500, restaurantId: "grand-atelier" },
  { id: "ga-3", number: 3, capacity: 2, x: 420, y: 90, width: 60, height: 60, shape: "rect", type: "window", room: "main", price: 1200, restaurantId: "grand-atelier" },
  { id: "ga-4", number: 4, capacity: 4, x: 540, y: 90, width: 70, height: 70, shape: "circle", type: "window", room: "main", price: 1800, restaurantId: "grand-atelier" },
  { id: "ga-5", number: 5, capacity: 2, x: 100, y: 260, width: 60, height: 60, shape: "rect", type: "standard", room: "main", price: 1000, restaurantId: "grand-atelier" },
  { id: "ga-6", number: 6, capacity: 4, x: 250, y: 260, width: 70, height: 70, shape: "circle", type: "standard", room: "main", price: 1200, restaurantId: "grand-atelier" },
  { id: "ga-vip1", number: 11, capacity: 8, x: 160, y: 180, width: 120, height: 80, shape: "rect", type: "vip", room: "vip", price: 5000, restaurantId: "grand-atelier" },
  { id: "ga-vip2", number: 12, capacity: 4, x: 440, y: 180, width: 80, height: 80, shape: "circle", type: "vip", room: "vip", price: 3500, restaurantId: "grand-atelier" },
  { id: "ga-ter1", number: 21, capacity: 4, x: 100, y: 160, width: 70, height: 70, shape: "circle", type: "terrace", room: "terrace", price: 1500, restaurantId: "grand-atelier" },
  { id: "ga-ter2", number: 22, capacity: 4, x: 280, y: 160, width: 80, height: 70, shape: "rect", type: "terrace", room: "terrace", price: 1500, restaurantId: "grand-atelier" },
  { id: "ga-ter3", number: 23, capacity: 2, x: 480, y: 160, width: 60, height: 60, shape: "circle", type: "terrace", room: "terrace", price: 1000, restaurantId: "grand-atelier" },

  // 2. Sakura Zen
  { id: "sz-1", number: 31, capacity: 4, x: 100, y: 120, width: 70, height: 70, shape: "circle", type: "standard", room: "main", price: 1200, restaurantId: "sakura-zen" },
  { id: "sz-2", number: 32, capacity: 6, x: 230, y: 120, width: 100, height: 70, shape: "rect", type: "standard", room: "main", price: 1800, restaurantId: "sakura-zen" },
  { id: "sz-3", number: 33, capacity: 2, x: 420, y: 90, width: 60, height: 60, shape: "rect", type: "window", room: "main", price: 1500, restaurantId: "sakura-zen" },
  { id: "sz-4", number: 34, capacity: 4, x: 540, y: 90, width: 70, height: 70, shape: "circle", type: "window", room: "main", price: 2000, restaurantId: "sakura-zen" },
  { id: "sz-5", number: 35, capacity: 2, x: 100, y: 260, width: 60, height: 60, shape: "rect", type: "standard", room: "main", price: 1100, restaurantId: "sakura-zen" },
  { id: "sz-6", number: 36, capacity: 4, x: 250, y: 260, width: 70, height: 70, shape: "circle", type: "standard", room: "main", price: 1400, restaurantId: "sakura-zen" },
  { id: "sz-vip1", number: 41, capacity: 8, x: 160, y: 180, width: 120, height: 80, shape: "rect", type: "vip", room: "vip", price: 6000, restaurantId: "sakura-zen" },
  { id: "sz-vip2", number: 42, capacity: 4, x: 440, y: 180, width: 80, height: 80, shape: "circle", type: "vip", room: "vip", price: 4000, restaurantId: "sakura-zen" },
  { id: "sz-ter1", number: 51, capacity: 4, x: 100, y: 160, width: 70, height: 70, shape: "circle", type: "terrace", room: "terrace", price: 1800, restaurantId: "sakura-zen" },
  { id: "sz-ter2", number: 52, capacity: 4, x: 280, y: 160, width: 80, height: 70, shape: "rect", type: "terrace", room: "terrace", price: 1800, restaurantId: "sakura-zen" },
  { id: "sz-ter3", number: 53, capacity: 2, x: 480, y: 160, width: 60, height: 60, shape: "circle", type: "terrace", room: "terrace", price: 1200, restaurantId: "sakura-zen" },

  // 3. Bison & Vine
  { id: "bv-1", number: 61, capacity: 4, x: 100, y: 120, width: 70, height: 70, shape: "circle", type: "standard", room: "main", price: 1500, restaurantId: "bison-vine" },
  { id: "bv-2", number: 62, capacity: 6, x: 230, y: 120, width: 100, height: 70, shape: "rect", type: "standard", room: "main", price: 2200, restaurantId: "bison-vine" },
  { id: "bv-3", number: 63, capacity: 2, x: 420, y: 90, width: 60, height: 60, shape: "rect", type: "window", room: "main", price: 1700, restaurantId: "bison-vine" },
  { id: "bv-4", number: 64, capacity: 4, x: 540, y: 90, width: 70, height: 70, shape: "circle", type: "window", room: "main", price: 2500, restaurantId: "bison-vine" },
  { id: "bv-5", number: 65, capacity: 2, x: 100, y: 260, width: 60, height: 60, shape: "rect", type: "standard", room: "main", price: 1300, restaurantId: "bison-vine" },
  { id: "bv-6", number: 66, capacity: 4, x: 250, y: 260, width: 70, height: 70, shape: "circle", type: "standard", room: "main", price: 1600, restaurantId: "bison-vine" },
  { id: "bv-vip1", number: 71, capacity: 8, x: 160, y: 180, width: 120, height: 80, shape: "rect", type: "vip", room: "vip", price: 8000, restaurantId: "bison-vine" },
  { id: "bv-vip2", number: 72, capacity: 4, x: 440, y: 180, width: 80, height: 80, shape: "circle", type: "vip", room: "vip", price: 5000, restaurantId: "bison-vine" },
  { id: "bv-ter1", number: 81, capacity: 4, x: 100, y: 160, width: 70, height: 70, shape: "circle", type: "terrace", room: "terrace", price: 2000, restaurantId: "bison-vine" },
  { id: "bv-ter2", number: 82, capacity: 4, x: 280, y: 160, width: 80, height: 70, shape: "rect", type: "terrace", room: "terrace", price: 2000, restaurantId: "bison-vine" },
  { id: "bv-ter3", number: 83, capacity: 2, x: 480, y: 160, width: 60, height: 60, shape: "circle", type: "terrace", room: "terrace", price: 1500, restaurantId: "bison-vine" }
];

// Seed initial bookings for unified client base demonstration
const generateHistoricalBookings = () => {
  const list: Booking[] = [];
  const rooms: ('main' | 'vip' | 'terrace')[] = ['main', 'vip', 'terrace'];
  const categories = ['Spa & Wellness', 'Fitness & Active', 'Beauty & Style'];
  const serviceNames = [
    'Премиальный Спа-Ритуал «Гармония»',
    'Персональная тренировка с Elite-инструктором',
    'Индивидуальный уход и стрижка от стилиста',
    'Миофасциальный массаж лица и шеи',
    'Комплексный детокс-уход за телом'
  ];

  // Current date base is July 11, 2026
  const baseDate = new Date(2026, 6, 11);

  for (let i = 1; i <= 30; i++) {
    const dateObj = new Date(baseDate);
    dateObj.setDate(baseDate.getDate() - i);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`;

    // Add table booking on some days
    if (i % 2 === 0 || i % 5 === 0) {
      list.push({
        id: `seed-table-${i}`,
        userId: i % 3 === 0 ? "user-1" : "user-2",
        type: "table",
        tableId: `t-${(i % 4) + 1}`,
        tableNumber: (i % 4) + 1,
        room: rooms[i % rooms.length],
        date: dateStr,
        time: "19:00",
        guests: (i % 3) + 2,
        createdAt: new Date(dateObj.getTime() - 86400000).toISOString(),
        price: 1000 + (i % 3) * 500
      });
    }

    // Add service booking on some days
    if (i % 3 === 0 || i % 4 === 0) {
      list.push({
        id: `seed-service-${i}`,
        userId: i % 2 === 0 ? "user-1" : "user-2",
        type: "service",
        serviceId: `spa-${(i % 3) + 1}`,
        serviceName: serviceNames[i % serviceNames.length],
        category: categories[i % categories.length],
        staffId: `staff-${(i % 2) + 1}`,
        staffName: i % 2 === 0 ? "Елена Соколова" : "Дмитрий Петров",
        date: dateStr,
        time: "14:00",
        createdAt: new Date(dateObj.getTime() - 86400000).toISOString(),
        price: 2000 + (i % 4) * 800
      });
    }
  }
  return list;
};

const bookings: Booking[] = [
  ...generateHistoricalBookings(),
  // User 1 (Maria) history: Complete Spa, Active table at Terrace
  {
    id: "b-1",
    userId: "user-1",
    type: "service",
    serviceId: "spa-1",
    serviceName: "Премиальный Спа-Ритуал «Гармония»",
    category: "Spa & Wellness",
    staffId: "staff-1",
    staffName: "Елена Соколова",
    date: "2026-07-08",
    time: "14:00",
    createdAt: "2026-07-07T10:00:00.000Z",
    price: 4500
  },
  {
    id: "b-2",
    userId: "user-1",
    type: "table",
    tableId: "t-ter2",
    tableNumber: 22,
    room: "terrace",
    date: "2026-07-11",
    time: "19:00",
    guests: 4,
    notes: "Стол повыше, у перил с видом на закат.",
    createdAt: "2026-07-09T15:30:00.000Z",
    price: 1500
  },
  // User 2 (Alex) history: Complete Fitness, Active Window table
  {
    id: "b-3",
    userId: "user-2",
    type: "service",
    serviceId: "fit-1",
    serviceName: "Персональная тренировка с Elite-инструктором",
    category: "Fitness & Active",
    staffId: "staff-2",
    staffName: "Дмитрий Петров",
    date: "2026-07-09",
    time: "10:00",
    createdAt: "2026-07-08T09:15:00.000Z",
    price: 2000
  },
  {
    id: "b-4",
    userId: "user-2",
    type: "table",
    tableId: "t-4",
    tableNumber: 4,
    room: "main",
    date: "2026-07-12",
    time: "18:30",
    guests: 2,
    notes: "По возможности потише.",
    createdAt: "2026-07-09T18:00:00.000Z",
    price: 1800
  },
  // Mock bookings for review authors to make them 'Verified' (Подтвержденный клиент)
  {
    id: "b-rev-ga-1",
    userId: "mock-author-1",
    type: "table",
    tableId: "ga-1",
    tableNumber: 1,
    room: "main",
    date: "2026-06-28",
    time: "19:00",
    guests: 2,
    createdAt: "2026-06-27T10:00:00.000Z",
    price: 1000,
    restaurantId: "grand-atelier",
    restaurantName: "Grand Atelier",
    guestName: "Александр Волков"
  } as any,
  {
    id: "b-rev-ga-2",
    userId: "mock-author-2",
    type: "table",
    tableId: "ga-2",
    tableNumber: 2,
    room: "main",
    date: "2026-07-02",
    time: "18:00",
    guests: 4,
    createdAt: "2026-07-01T11:00:00.000Z",
    price: 1500,
    restaurantId: "grand-atelier",
    restaurantName: "Grand Atelier",
    guestName: "Екатерина Петрова"
  } as any,
  {
    id: "b-rev-sz-1",
    userId: "mock-author-3",
    type: "table",
    tableId: "sz-1",
    tableNumber: 1,
    room: "main",
    date: "2026-07-01",
    time: "19:30",
    guests: 2,
    createdAt: "2026-06-30T14:00:00.000Z",
    price: 1500,
    restaurantId: "sakura-zen",
    restaurantName: "Sakura Zen",
    guestName: "Дмитрий Ким"
  } as any,
  {
    id: "b-rev-sz-2",
    userId: "mock-author-4",
    type: "table",
    tableId: "sz-2",
    tableNumber: 2,
    room: "main",
    date: "2026-07-06",
    time: "20:00",
    guests: 3,
    createdAt: "2026-07-05T12:00:00.000Z",
    price: 2000,
    restaurantId: "sakura-zen",
    restaurantName: "Sakura Zen",
    guestName: "Ольга Соколова"
  } as any,
  {
    id: "b-rev-bv-1",
    userId: "mock-author-5",
    type: "table",
    tableId: "bv-1",
    tableNumber: 1,
    room: "main",
    date: "2026-06-30",
    time: "19:00",
    guests: 2,
    createdAt: "2026-06-29T17:00:00.000Z",
    price: 2000,
    restaurantId: "bison-vine",
    restaurantName: "Bison & Vine",
    guestName: "Михаил Кузнецов"
  } as any,
  {
    id: "b-rev-bv-2",
    userId: "mock-author-6",
    type: "table",
    tableId: "bv-2",
    tableNumber: 2,
    room: "main",
    date: "2026-07-05",
    time: "18:00",
    guests: 4,
    createdAt: "2026-07-04T15:00:00.000Z",
    price: 2500,
    restaurantId: "bison-vine",
    restaurantName: "Bison & Vine",
    guestName: "Елена Морозова"
  } as any
];

// Seed initial notifications for notification system
const notifications: Notification[] = [
  {
    id: "notif-1",
    userId: "user-1",
    title: "Бронирование завтра",
    message: "Напоминание: Ваш столик #22 забронирован на летней веранде завтра в 19:00. Будем рады видеть вас!",
    type: "reminder",
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  }
];

// Recommender Algorithm Engine (Unified Scoring Logic)
function calculateScores(user: User, userBookings: Booking[]) {
  const prefs = user.preferences || [];
  
  // Calculate service scores
  const scoredServices = services.map(s => {
    let score = 50; // base score
    const details: string[] = ["Базовое соответствие услуги: +50"];
    
    // Preference match
    const hasPrefMatch = prefs.some(p => {
      const pL = p.toLowerCase();
      const sN = s.name.toLowerCase();
      const sC = s.category.toLowerCase();
      if (pL.includes("спа") && sC.includes("spa")) return true;
      if (pL.includes("массаж") && sN.includes("массаж")) return true;
      if (pL.includes("йога") && sN.includes("йога")) return true;
      if (pL.includes("фитнес") && sC.includes("fitness")) return true;
      if (pL.includes("красот") && sC.includes("beauty")) return true;
      if (pL.includes("стиль") && sC.includes("beauty")) return true;
      return false;
    });
    
    if (hasPrefMatch) {
      score += 30;
      details.push("Совпадение с предпочтениями в профиле: +30");
    }
    
    // History match
    const previousOfCategory = userBookings.filter(b => b.type === "service" && b.category === s.category);
    if (previousOfCategory.length > 0) {
      const historyBoost = Math.min(previousOfCategory.length * 15, 45);
      score += historyBoost;
      details.push(`Ранее посещали эту категорию (${previousOfCategory.length} раз): +${historyBoost}`);
    }
    
    // Rating boost
    const ratingBoost = Math.round(s.rating * 5);
    score += ratingBoost;
    details.push(`Оценка специалистов (★${s.rating}): +${ratingBoost}`);
    
    // Balance check
    if (user.balance < s.price) {
      score -= 20;
      details.push("Превышает комфортный бюджет (стоимость выше баланса): -20");
    } else {
      score += 10;
      details.push("Укладывается в ваш доступный баланс: +10");
    }
    
    return {
      id: s.id,
      name: s.name,
      price: s.price,
      rating: s.rating,
      category: s.category,
      score,
      details
    };
  }).sort((a, b) => b.score - a.score);

  // Calculate table scores
  const scoredTables = tables.map(t => {
    let score = 40; // base score
    const details: string[] = ["Базовое соответствие стола: +40"];
    
    // Preference match
    const hasPrefMatch = prefs.some(p => {
      const pL = p.toLowerCase();
      if (pL.includes("окн") && t.type === "window") return true;
      if (pL.includes("vip") && t.type === "vip") return true;
      if (pL.includes("веранд") && t.type === "terrace") return true;
      return false;
    });
    
    if (hasPrefMatch) {
      score += 35;
      details.push("Соответствие предпочтениям по типу зоны: +35");
    }
    
    // Complementary category booster
    const hasSpaPref = prefs.some(p => p.toLowerCase().includes("спа"));
    if (hasSpaPref && (t.type === "vip" || t.type === "terrace")) {
      score += 15;
      details.push("Премиум-зона для отдыха после СПА-процедур: +15");
    }
    
    const hasFitnessPref = prefs.some(p => p.toLowerCase().includes("фитнес"));
    if (hasFitnessPref && t.capacity >= 4) {
      score += 10;
      details.push("Повышенная вместимость для компании после тренировки: +10");
    }
    
    // History match
    const previousOfRoom = userBookings.filter(b => b.type === "table" && b.room === t.room);
    if (previousOfRoom.length > 0) {
      const historyBoost = Math.min(previousOfRoom.length * 10, 30);
      score += historyBoost;
      details.push(`Ранее заказывали столики в этой зоне (${t.room}): +${historyBoost}`);
    }
    
    // Capacity check
    if (t.capacity >= 4) {
      score += 10;
      details.push("Просторный стол на 4+ гостей: +10");
    }
    
    // Balance constraint
    if (user.balance < t.price) {
      score -= 25;
      details.push("Сумма депозита превышает текущий баланс: -25");
    } else {
      score += 10;
      details.push("Полностью доступно к оплате депозита: +10");
    }
    
    return {
      id: t.id,
      number: t.number,
      room: t.room,
      type: t.type,
      capacity: t.capacity,
      price: t.price,
      score,
      details
    };
  }).sort((a, b) => b.score - a.score);

  return { scoredServices, scoredTables };
}

async function startServer() {
  const app = express();
  const portArgIdx = process.argv.indexOf("--port");
  const portArg = portArgIdx !== -1 ? process.argv[portArgIdx + 1] : undefined;
  const PORT = Number(portArg ?? process.env.PORT ?? 3000);

  app.use(express.json({ limit: "256kb" }));

  // --- Structured logging store (bounded, in-memory) ---
  type ServerLog = {
    id: string;
    level: "info" | "warn" | "error" | "perf" | "request";
    timestamp: string;
    message: string;
    method?: string;
    path?: string;
    status?: number;
    durationMs?: number;
    userId?: string;
    stack?: string;
    context?: Record<string, unknown>;
    source: "server" | "client";
  };
  const LOG_CAP = 2000;
  const logStore: ServerLog[] = [];
  function pushLog(entry: Omit<ServerLog, "id" | "timestamp"> & { timestamp?: string }) {
    const log: ServerLog = {
      id: crypto.randomBytes(8).toString("hex"),
      timestamp: entry.timestamp || new Date().toISOString(),
      ...entry,
    };
    logStore.push(log);
    if (logStore.length > LOG_CAP) logStore.splice(0, logStore.length - LOG_CAP);
    // Mirror errors/warnings to stdout for edge-log capture.
    if (log.level === "error") {
      console.error(`[${log.source}] ${log.message}${log.stack ? "\n" + log.stack : ""}`);
    } else if (log.level === "warn") {
      console.warn(`[${log.source}] ${log.message}`);
    }
  }

  // --- Request logging middleware ---
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      // Skip logging the log-ingestion endpoint itself to avoid noise loops.
      if (req.path === "/api/logs") return;
      // Only log API routes to keep signal high.
      if (!req.path.startsWith("/api/")) return;
      const durationMs = Date.now() - start;
      pushLog({
        level: res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "request",
        source: "server",
        message: `${req.method} ${req.path} ${res.statusCode} ${durationMs}ms`,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs,
        userId: (req as AuthedRequest).authUserId,
      });
    });
    next();
  });

  // --- Auth helpers ---
  type AuthedRequest = express.Request & { authUserId?: string; authUser?: User };
  const attachAuth: express.RequestHandler = (req, _res, next) => {
    const header = req.headers.authorization || "";
    const m = header.match(/^Bearer\s+(.+)$/i);
    if (m) {
      const userId = sessions.get(m[1]);
      if (userId) {
        const u = users.find(x => x.id === userId);
        if (u) {
          (req as AuthedRequest).authUserId = u.id;
          (req as AuthedRequest).authUser = u;
        }
      }
    }
    next();
  };
  const requireAuth: express.RequestHandler = (req, res, next) => {
    if (!(req as AuthedRequest).authUserId) {
      return res.status(401).json({ error: "Требуется авторизация." });
    }
    next();
  };
  const requireAdmin: express.RequestHandler = (req, res, next) => {
    const u = (req as AuthedRequest).authUser;
    if (!u || (u.role !== "platform_admin" && u.role !== "business_admin" && u.role !== "business_owner")) {
      return res.status(403).json({ error: "Недостаточно прав." });
    }
    next();
  };
  app.use(attachAuth);

  // --- Log ingestion (client -> server) ---
  app.post("/api/logs", (req, res) => {
    const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    const userId = (req as AuthedRequest).authUserId;
    let accepted = 0;
    for (const raw of entries.slice(0, 50)) {
      if (!raw || typeof raw !== "object") continue;
      const level = ["error", "warn", "info", "perf"].includes(raw.level) ? raw.level : "info";
      pushLog({
        level,
        source: "client",
        message: String(raw.message || "client_event").slice(0, 500),
        stack: raw.stack ? String(raw.stack).slice(0, 4000) : undefined,
        userId,
        context: {
          ...(raw.context && typeof raw.context === "object" ? raw.context : {}),
          url: raw.url,
          userAgent: raw.userAgent,
          clientTimestamp: raw.timestamp,
        },
      });
      accepted++;
    }
    res.json({ accepted });
  });

  // --- Log viewer (admin only) ---
  app.get("/api/logs", requireAuth, requireAdmin, (req, res) => {
    const level = typeof req.query.level === "string" ? req.query.level : undefined;
    const source = typeof req.query.source === "string" ? req.query.source : undefined;
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
    let out = logStore.slice();
    if (level) out = out.filter(l => l.level === level);
    if (source) out = out.filter(l => l.source === source);
    out = out.slice(-limit).reverse();
    res.json({ logs: out, total: logStore.length });
  });



  // API - Auth - Register
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, preferences, role, businessName, businessCategory, businessDescription } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Пожалуйста, заполните все поля." });
    }

    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "Пользователь с таким email уже зарегистрирован." });
    }

    // Never trust the client-supplied role. Allow only self-service roles;
    // platform_admin cannot be granted through public signup.
    const SELF_SIGNUP_ROLES = ["client", "business_admin", "business_owner"] as const;
    type SelfSignupRole = typeof SELF_SIGNUP_ROLES[number];
    const safeRole: SelfSignupRole = (SELF_SIGNUP_ROLES as readonly string[]).includes(role)
      ? (role as SelfSignupRole)
      : "client";
    const isBusiness = safeRole === "business_admin" || safeRole === "business_owner";

    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      avatar: isBusiness
        ? `https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150`
        : `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&q=80&w=150`,
      role: safeRole,
      preferences: preferences || [],
      balance: isBusiness ? 50000 : 10000, // business gets higher starting balance for demo
      businessName,
      businessCategory,
      businessDescription
    };

    users.push(newUser);
    userPasswords[email.toLowerCase()] = hashPassword(password);

    if (isBusiness && businessName) {
      // Auto-register appropriate facility based on category
      const isRestaurant = businessCategory && (
        businessCategory.toLowerCase().includes("rest") || 
        businessCategory.toLowerCase().includes("cafe") || 
        businessCategory.toLowerCase().includes("coffee") ||
        businessCategory.toLowerCase().includes("food") ||
        businessCategory.toLowerCase().includes("ресторан") ||
        businessCategory.toLowerCase().includes("кафе")
      );

      if (isRestaurant) {
        // Register Restaurant (Tabletop)
        const newRestaurant: Restaurant = {
          id: `restaurant-${Date.now()}`,
          name: businessName,
          description: businessDescription || "Новое гастрономическое заведение, зарегистрированное партнером.",
          image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600",
          rating: 5.0,
          cuisine: "Европейская",
          rooms: { main: "Главный зал", vip: "VIP-кабинет", terrace: "Летняя веранда" }
        };
        restaurants.push(newRestaurant);

        // Auto-generate some tables for this restaurant to make it bookable right away!
        for (let i = 1; i <= 8; i++) {
          const roomType = i <= 4 ? "main" : i <= 6 ? "vip" : "terrace";
          const tablePrice = roomType === "vip" ? 3000 : roomType === "terrace" ? 1500 : 1000;
          tables.push({
            id: `table-${newRestaurant.id}-${i}`,
            number: i,
            capacity: i % 2 === 0 ? 4 : 2,
            x: 100 + ((i - 1) % 4) * 180,
            y: 120 + Math.floor((i - 1) / 4) * 160,
            width: 80,
            height: 80,
            shape: i % 2 === 0 ? "rect" : "circle",
            type: roomType === "vip" ? "vip" : roomType === "terrace" ? "terrace" : "standard",
            room: roomType,
            price: tablePrice,
            restaurantId: newRestaurant.id
          });
        }
      } else {
        // Register Salon (Bookly)
        const newSalon: Salon = {
          id: `salon-${Date.now()}`,
          name: businessName,
          description: businessDescription || "Новый велнес-салон или фитнес-центр.",
          category: (businessCategory as any) || "Spa & Wellness",
          image: businessCategory === "Fitness & Active" 
            ? "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=600" 
            : businessCategory === "Beauty & Style"
              ? "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=600"
              : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600",
          rating: 5.0,
          address: "Центральный бульвар, д. 10"
        };
        salons.push(newSalon);

        // Auto-create a primary service for this salon
        services.push({
          id: `svc-${Date.now()}`,
          name: `Базовая процедура от ${businessName}`,
          category: newSalon.category,
          duration: 60,
          price: 2500,
          rating: 5.0,
          description: `Авторский сеанс в пространстве ${businessName}.`,
          image: newSalon.image,
          staff: [
            { id: `staff-${Date.now()}-1`, name: name, role: "Ведущий специалист / Владелец", rating: 5.0, avatar: newUser.avatar }
          ],
          salonId: newSalon.id,
          salonName: newSalon.name
        });
      }

      notifications.unshift({
        id: `notif-biz-${Date.now()}`,
        userId: newUser.id,
        title: "Бизнес зарегистрирован! 👔",
        message: `Добро пожаловать, ${name}! Ваша компания "${businessName}" (${businessCategory}) успешно добавлена на платформу OmniReserve. Настроен кабинет управления.`,
        type: "status",
        read: false,
        createdAt: new Date().toISOString(),
        linkToModule: "dashboard"
      });
    }

    const token = issueToken(newUser.id);
    res.status(201).json({ user: newUser, token });
  });

  // API - Auth - Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Пожалуйста, введите email и пароль." });
    }

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !verifyPassword(password, userPasswords[email.toLowerCase()])) {
      return res.status(401).json({ error: "Неверный email или пароль." });
    }

    const token = issueToken(user.id);
    res.json({ user, token });
  });

  // API - Get Restaurants
  app.get("/api/restaurants", (req, res) => {
    res.json(restaurants);
  });

  // API - Get Reviews for a Restaurant
  app.get("/api/restaurants/:id/reviews", (req, res) => {
    const restaurantId = req.params.id;
    const reviews = restaurantReviews
      .filter(r => r.restaurantId === restaurantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const verifiedReviews = reviews.map(r => {
      const isVerified = bookings.some(b => {
        if (b.type !== 'table') return false;
        
        let bRestId = b.restaurantId;
        if (!bRestId) {
          if (b.tableId && b.tableId.startsWith('ga-')) {
            bRestId = 'grand-atelier';
          } else if (b.tableId && b.tableId.startsWith('sz-')) {
            bRestId = 'sakura-zen';
          } else if (b.tableId && b.tableId.startsWith('bv-')) {
            bRestId = 'bison-vine';
          } else {
            bRestId = 'grand-atelier';
          }
        }
        
        if (bRestId !== r.restaurantId) return false;
        
        // Exact user match
        if (r.userId && b.userId === r.userId) return true;
        
        // Match by username fallback
        const bUser = users.find(u => u.id === b.userId);
        if (bUser && bUser.name === r.userName) return true;
        
        // Match explicit booking guestName fallback
        if ((b as any).guestName === r.userName) return true;
        
        return false;
      });
      
      return {
        ...r,
        isVerified
      };
    });
    
    res.json(verifiedReviews);
  });

  // API - Add Review for a Restaurant
  app.post("/api/restaurants/:id/reviews", requireAuth, (req, res) => {
    const restaurantId = req.params.id;
    const { rating, text } = req.body;
    const authUser = (req as AuthedRequest).authUser!;
    const userId = authUser.id;

    if (!rating || !text) {
      return res.status(400).json({ error: "Рейтинг и текст отзыва обязательны." });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ error: "Рейтинг должен быть числом от 1 до 5." });
    }

    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: "Ресторан не найден." });
    }

    const newReview: Review = {
      id: `review-${Date.now()}`,
      restaurantId,
      userId,
      // Identity always comes from the verified session, never the request body.
      userName: authUser.name,
      userAvatar: authUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      rating: numericRating,
      text,
      createdAt: new Date().toISOString()
    };

    restaurantReviews.push(newReview);

    // Recalculate average rating of the restaurant
    const reviewsForRestaurant = restaurantReviews.filter(r => r.restaurantId === restaurantId);
    const sumRatings = reviewsForRestaurant.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Number((sumRatings / reviewsForRestaurant.length).toFixed(1));
    restaurant.rating = avgRating;

    // Check if verified dynamically for the response
    const isVerified = bookings.some(b => {
      if (b.type !== 'table') return false;
      let bRestId = b.restaurantId || (b.tableId?.startsWith('ga') ? 'grand-atelier' : b.tableId?.startsWith('sz') ? 'sakura-zen' : b.tableId?.startsWith('bv') ? 'bison-vine' : 'grand-atelier');
      if (bRestId !== restaurantId) return false;
      if (userId && b.userId === userId) return true;
      return false;
    });

    res.status(201).json({ 
      review: { ...newReview, isVerified }, 
      updatedRating: avgRating 
    });
  });

  // API - Register Restaurant (Tabletop)
  app.post("/api/restaurants", (req, res) => {
    const { name, description, image, cuisine, rooms, tablesCount } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Название ресторана обязательно" });
    }
    const newRestaurant: Restaurant = {
      id: `restaurant-${Date.now()}`,
      name,
      description: description || "Свежезарегистрированное гастрономическое заведение на платформе OmniReserve.",
      image: image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600",
      rating: 5.0,
      cuisine: cuisine || "Европейская",
      rooms: rooms || { main: "Главный зал", vip: "VIP-кабинет", terrace: "Летняя веранда" }
    };
    restaurants.push(newRestaurant);

    // Auto-generate some tables for this restaurant to make it bookable right away!
    const count = parseInt(tablesCount) || 8;
    for (let i = 1; i <= count; i++) {
      const roomType = i <= 4 ? "main" : i <= 6 ? "vip" : "terrace";
      const tablePrice = roomType === "vip" ? 3000 : roomType === "terrace" ? 1500 : 1000;
      tables.push({
        id: `table-${newRestaurant.id}-${i}`,
        number: i,
        capacity: i % 2 === 0 ? 4 : 2,
        x: 100 + ((i - 1) % 4) * 180,
        y: 120 + Math.floor((i - 1) / 4) * 160,
        width: 80,
        height: 80,
        shape: i % 2 === 0 ? "rect" : "circle",
        type: roomType === "vip" ? "vip" : roomType === "terrace" ? "terrace" : "standard",
        room: roomType,
        price: tablePrice,
        restaurantId: newRestaurant.id
      });
    }

    res.status(201).json(newRestaurant);
  });

  // API - Get Salons
  app.get("/api/salons", (req, res) => {
    res.json(salons);
  });

  // API - Register Salon (Bookly)
  app.post("/api/salons", (req, res) => {
    const { name, description, image, category, address, serviceName, servicePrice, serviceDuration } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Название салона обязательно" });
    }
    const newSalon: Salon = {
      id: `salon-${Date.now()}`,
      name,
      description: description || "Новый центр услуг на нашей платформе.",
      category: category || "Spa & Wellness",
      image: image || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600",
      rating: 5.0,
      address: address || "Центральный бульвар, д. 10"
    };
    salons.push(newSalon);

    // If an initial service was specified during registration, auto-create it!
    if (serviceName) {
      services.push({
        id: `svc-${Date.now()}`,
        name: serviceName,
        category: newSalon.category,
        duration: parseInt(serviceDuration) || 60,
        price: parseFloat(servicePrice) || 2000,
        rating: 5.0,
        description: "Первая услуга, созданная при регистрации салона.",
        image: newSalon.image,
        staff: [
          { id: `staff-${Date.now()}-1`, name: "Александр Мастер", role: "Ведущий специалист", rating: 5.0, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120" }
        ],
        salonId: newSalon.id,
        salonName: newSalon.name
      });
    }

    res.status(201).json(newSalon);
  });

  const isPremiumTime = (tStr: string) => {
    const premiumSlots = ["18:30", "19:00", "20:30"];
    return premiumSlots.includes(tStr);
  };

  const getTablePrice = (table: Table, tStr: string) => {
    if (isPremiumTime(tStr)) {
      // Add 25% surcharge
      return Math.round((table.price * 1.25) / 50) * 50;
    }
    return table.price;
  };

  // API - Get Tables (checks bookings for table occupied states on specific date and restaurantId)
  app.get("/api/tables", (req, res) => {
    const { date, time, restaurantId } = req.query;
    
    // Check occupied tables for selected date
    const occupiedTableIds = bookings
      .filter(b => b.type === "table" && b.date === date)
      .map(b => (b as TableBooking).tableId);

    // Filter by restaurantId if provided, otherwise default to "grand-atelier"
    const targetRestaurantId = (restaurantId as string) || "grand-atelier";
    const filteredTables = tables.filter(t => t.restaurantId === targetRestaurantId);

    const tablesWithStatus = filteredTables.map(t => {
      const tTime = (time as string) || "19:00";
      const actualPrice = getTablePrice(t, tTime);
      return {
        ...t,
        price: actualPrice,
        isPremium: isPremiumTime(tTime),
        status: occupiedTableIds.includes(t.id) ? "booked" : "available"
      };
    });

    res.json(tablesWithStatus);
  });

  // API - Book Table
  app.post("/api/tables/book", requireAuth, (req, res) => {
    const { tableId, tableIds, date, time, guests, notes } = req.body;
    const userId = (req as AuthedRequest).authUserId!;

    const hasMultiple = Array.isArray(tableIds) && tableIds.length > 0;
    const targetTableIds: string[] = hasMultiple ? (tableIds as string[]) : (tableId ? [tableId] : []);

    if (targetTableIds.length === 0 || !date || !time || !guests) {
      return res.status(400).json({ error: "Неполные данные для бронирования стола." });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден." });
    }

    // Find all requested tables
    const requestedTables = tables.filter(t => targetTableIds.includes(t.id));
    if (requestedTables.length !== targetTableIds.length) {
      return res.status(404).json({ error: "Один или несколько столов не найдены." });
    }

    // Check if any of these tables are already booked on this date
    const alreadyBookedTables = bookings.filter(b => b.type === "table" && targetTableIds.includes(b.tableId) && b.date === date);
    if (alreadyBookedTables.length > 0) {
      const bookedNumbers = alreadyBookedTables.map(b => b.tableNumber).join(", #");
      return res.status(400).json({ error: `Один или несколько столов уже забронированы на эту дату (Стол #${bookedNumbers}).` });
    }

    // Calculate total price for all tables
    const totalPrice = requestedTables.reduce((sum, t) => sum + getTablePrice(t, time), 0);

    if (user.balance < totalPrice) {
      return res.status(400).json({ error: `Недостаточно средств для списания депозита. Требуется: ${totalPrice} ₽, у вас: ${user.balance} ₽` });
    }

    user.balance -= totalPrice;

    const firstTable = requestedTables[0];
    const restaurant = restaurants.find(r => r.id === firstTable.restaurantId);

    const newBookings: TableBooking[] = requestedTables.map((t, idx) => {
      const actualPrice = getTablePrice(t, time);
      return {
        id: `b-${Date.now()}-${idx}`,
        userId,
        type: "table",
        tableId: t.id,
        tableNumber: t.number,
        room: t.room,
        date,
        time,
        guests,
        notes,
        createdAt: new Date().toISOString(),
        price: actualPrice,
        restaurantId: t.restaurantId,
        restaurantName: restaurant?.name || "Ресторан"
      };
    });

    bookings.push(...newBookings);

    // Create Notification
    const tableNumbersText = requestedTables.map(t => `#${t.number}`).join(", ");
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      title: "Столы забронированы",
      message: `Подтверждено: Столы (${tableNumbersText}) в ресторане "${restaurant?.name || 'Ресторан'}" на ${date} в ${time}. Депозит ${totalPrice} ₽ списан.`,
      type: "reminder",
      read: false,
      createdAt: new Date().toISOString(),
      linkToModule: "dashboard"
    };
    notifications.unshift(newNotif);

    res.status(201).json({
      booking: newBookings[0],
      bookings: newBookings,
      balance: user.balance
    });
  });

  // API - Book Service
  app.post("/api/services/book", requireAuth, (req, res) => {
    const { serviceId, staffId, date, time } = req.body;
    const userId = (req as AuthedRequest).authUserId!;
    if (!serviceId || !staffId || !date || !time) {
      return res.status(400).json({ error: "Неполные данные для бронирования услуги." });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден." });
    }

    const service = services.find(s => s.id === serviceId);
    if (!service) {
      return res.status(404).json({ error: "Услуга не найдена." });
    }

    const staff = staffList.find(st => st.id === staffId);
    if (!staff) {
      return res.status(404).json({ error: "Специалист не найден." });
    }

    if (user.balance < service.price) {
      return res.status(400).json({ error: "Недостаточно средств для бронирования услуги." });
    }

    user.balance -= service.price;

    const newBooking: ServiceBooking = {
      id: `b-${Date.now()}`,
      userId,
      type: "service",
      serviceId,
      serviceName: service.name,
      category: service.category,
      staffId,
      staffName: staff.name,
      date,
      time,
      createdAt: new Date().toISOString(),
      price: service.price,
      salonId: service.salonId,
      salonName: service.salonName
    };

    bookings.push(newBooking);

    // Create Notification
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      title: "Услуга забронирована",
      message: `Подтверждено: ${service.name} (${service.category}) на ${date} в ${time}. Специалист: ${staff.name}. Списано ${service.price} ₽.`,
      type: "reminder",
      read: false,
      createdAt: new Date().toISOString(),
      linkToModule: "dashboard"
    };
    notifications.unshift(newNotif);

    res.status(201).json({ booking: newBooking, balance: user.balance });
  });

  // API - Get Services
  app.get("/api/services", (req, res) => {
    res.json(services);
  });

  // API - Get User Bookings (only your own, unless admin/owner)
  app.get("/api/bookings/:userId", requireAuth, (req, res) => {
    const { userId } = req.params;
    const authUser = (req as AuthedRequest).authUser!;
    const isPrivileged = authUser.role === "platform_admin" || authUser.role === "business_admin" || authUser.role === "business_owner";
    if (userId !== authUser.id && !isPrivileged) {
      return res.status(403).json({ error: "Недостаточно прав." });
    }
    const userBookings = bookings.filter(b => b.userId === userId);
    res.json(userBookings);
  });

  // API - Get Global Booking Stats (Analytics) — admin/owner only
  app.get("/api/analytics/bookings", requireAuth, requireAdmin, (_req, res) => {
    res.json(bookings);
  });

  // API - Get User Notifications
  app.get("/api/notifications/:userId", requireAuth, (req, res) => {
    const { userId } = req.params;
    const authUser = (req as AuthedRequest).authUser!;
    if (userId !== authUser.id && authUser.role !== "platform_admin") {
      return res.status(403).json({ error: "Недостаточно прав." });
    }
    const userNotifs = notifications.filter(n => n.userId === userId);
    res.json(userNotifs);
  });

  // API - Mark Notification as Read (only if it belongs to the caller)
  app.post("/api/notifications/:id/read", requireAuth, (req, res) => {
    const { id } = req.params;
    const authUser = (req as AuthedRequest).authUser!;
    const notif = notifications.find(n => n.id === id);
    if (!notif) return res.status(404).json({ error: "Уведомление не найдено." });
    if (notif.userId !== authUser.id && authUser.role !== "platform_admin") {
      return res.status(403).json({ error: "Недостаточно прав." });
    }
    notif.read = true;
    res.json({ success: true });
  });

  // API - Mark All Notifications as Read
  app.post("/api/notifications/read-all", requireAuth, (req, res) => {
    const userId = (req as AuthedRequest).authUserId!;
    notifications.forEach(n => {
      if (n.userId === userId) {
        n.read = true;
      }
    });
    res.json({ success: true });
  });

  // API - Create Notification (only for yourself)
  app.post("/api/notifications", requireAuth, (req, res) => {
    const { title, message, type } = req.body;
    const userId = (req as AuthedRequest).authUserId!;
    if (!title || !message) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      title,
      message,
      type: type || "status",
      read: false,
      createdAt: new Date().toISOString(),
      linkToModule: "dashboard"
    };
    notifications.unshift(newNotif);
    res.status(201).json(newNotif);
  });

  // API - Balance is server-managed only. Clients can read their own balance
  // but cannot set it — balances change only as a side effect of validated
  // booking/payment flows above.
  app.get("/api/users/:userId/balance", requireAuth, (req, res) => {
    const { userId } = req.params;
    const authUser = (req as AuthedRequest).authUser!;
    if (userId !== authUser.id && authUser.role !== "platform_admin") {
      return res.status(403).json({ error: "Недостаточно прав." });
    }
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "Пользователь не найден." });
    res.json({ balance: user.balance });
  });
  app.post("/api/users/:userId/balance", (_req, res) => {
    res.status(410).json({ error: "Изменение баланса напрямую отключено. Баланс обновляется автоматически при бронировании." });
  });

  // API - Get all users
  app.get("/api/users", requireAuth, requireAdmin, (req, res) => {
    res.json(users);
  });

  // API - Assign role to user
  app.post("/api/users/:userId/role", requireAuth, requireAdmin, (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    
    const validRoles = ['platform_admin', 'business_owner', 'manager', 'staff', 'client', 'business_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Недопустимая роль." });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден." });
    }

    user.role = role as any;

    const newNotif = {
      id: `notif-${Date.now()}`,
      userId,
      title: "Ваша роль изменена! 🛡️",
      message: `Администратор или владелец бизнеса назначил вам новую роль: ${role}.`,
      type: "status" as const,
      read: false,
      createdAt: new Date().toISOString(),
      linkToModule: "rbac"
    };
    notifications.unshift(newNotif);

    res.json({ success: true, user });
  });

  // Invitations state
  const invitations: any[] = [
    {
      id: "inv-1",
      name: "Дмитрий Шеф",
      email: "chef@example.com",
      role: "staff",
      status: "pending",
      invitedBy: "Александр Админ",
      createdAt: "2026-07-15T12:00:00.000Z"
    }
  ];

  // API - Get invitations
  app.get("/api/invitations", requireAuth, (req, res) => {
    res.json(invitations);
  });

  // API - Create invitation
  app.post("/api/invitations", requireAuth, requireAdmin, (req, res) => {
    const { name, email, role } = req.body;
    const authUser = (req as AuthedRequest).authUser!;
    if (!name || !email || !role) {
      return res.status(400).json({ error: "Пожалуйста, заполните все поля." });
    }

    const newInv = {
      id: `inv-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role,
      status: 'pending',
      invitedBy: authUser.name,
      createdAt: new Date().toISOString()
    };

    invitations.push(newInv);
    res.json({ success: true, invitation: newInv });
  });

  // API - Accept invitation
  app.post("/api/invitations/:inviteId/accept", (req, res) => {
    const { inviteId } = req.params;
    const inv = invitations.find(i => i.id === inviteId);
    if (!inv) {
      return res.status(404).json({ error: "Приглашение не найдено." });
    }
    if (inv.status === 'accepted') {
      return res.status(400).json({ error: "Приглашение уже принято." });
    }

    inv.status = 'accepted';

    let user = users.find(u => u.email.toLowerCase() === inv.email);
    if (user) {
      user.role = inv.role as any;
    } else {
      user = {
        id: `user-${Date.now()}`,
        name: inv.name,
        email: inv.email,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 900000)}?auto=format&fit=crop&q=80&w=150`,
        role: inv.role as any,
        preferences: [],
        balance: 5000
      };
      users.push(user);
      userPasswords[inv.email] = hashPassword("password");
    }

    res.json({ success: true, user, invitation: inv });
  });

  // API - Get AI Recommendation (POST and GET versions)
  const handleAIRecommendation = async (req: express.Request, res: express.Response) => {
    const userId = (req.method === "POST" ? req.body.userId : req.query.userId) as string;
    if (!userId) {
      return res.status(400).json({ error: "Не передан ID пользователя." });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден." });
    }

    // Prepare User booking history
    const userBookings = bookings.filter(b => b.userId === userId);
    const historySummary = userBookings.map(b => {
      if (b.type === "table") {
        return `- Забронирован столик #${b.tableNumber} в зале "${b.room}" на ${b.date} в ${b.time} (цена: ${b.price} ₽)`;
      } else {
        return `- Забронирована услуга "${b.serviceName}" (${b.category}) на ${b.date} в ${b.time} (специалист: ${b.staffName}, цена: ${b.price} ₽)`;
      }
    }).join("\n");

    const availableServicesList = services.map(s => `- ID: ${s.id}, Название: "${s.name}", Категория: ${s.category}, Длительность: ${s.duration} мин, Цена: ${s.price} ₽, Описание: ${s.description}`).join("\n");
    const availableTablesList = tables.map(t => `- ID: ${t.id}, Столик #: ${t.number}, Зал: ${t.room}, Тип: ${t.type}, Вместимость: ${t.capacity} чел, Депозит: ${t.price} ₽`).join("\n");

    const algorithmAnalysis = `[Анализ Omni-Core]
- Поиск совпадений по предпочтениям пользователя (${user.preferences?.join(", ") || 'нет'})
- Фильтровая сетка свободных слотов
- Сопоставление свободных столиков и доступных спа-процедур
- Генерация оптимального бесшовного таймлайна "процедура -> ужин"`;

    const prompt = `
Ты - умный персональный AI-помощник в объединенном люксовом суперсервисе, который включает в себя:
1. Bookly - бронирование спа-процедур, йоги, массажа, ухода и фитнес-тренировок.
2. Tabletop - интерактивное бронирование столиков в ресторане премиум-класса с точным выбором мест на схеме.

У нас общая клиентская база и единый профиль клиента. Наша задача - проанализировать историю бронирований пользователя и его предпочтения, чтобы составить уникальное, высоко персонализированное предложение!

ИНФОРМАЦИЯ О КЛИЕНТЕ:
Имя: ${user.name}
Предпочтения: ${user.preferences?.join(", ") || "не указаны"}
Баланс: ${user.balance} руб

ИСТОРИЯ БРОНИРОВАНИЙ:
${historySummary || "История пока пуста. Это первое знакомство с суперсервисом!"}

СПИСОК ДОСТУПНЫХ УСЛУГ (Bookly):
${availableServicesList}

СПИСОК ДОСТУПНЫХ СТОЛИКОВ (Tabletop):
${availableTablesList}

На основе этой информации составь персонализированную рекомендацию. Твое предложение должно связывать обе части суперсервиса: например, порекомендуй спа после тренировки или ужин за конкретным типом стола (у окна, в VIP или на террасе) после расслабряющей процедуры. Будь вежлив, используй изысканный тон, обращайся по имени.

Верни ответ СТРОГО в формате JSON, соответствующем следующей схеме:
{
  "summary": "Текст рекомендации в изысканном люксовом стиле на русском языке. Объясни, почему мы предлагаем именно это, ссылаясь на его прошлый опыт и предпочтения. Объем 3-4 предложения.",
  "suggestedServiceIds": ["ID рекомендованной услуги 1", "ID рекомендованной услуги 2 (опционально)"],
  "suggestedTableIds": ["ID рекомендованного столика 1", "ID рекомендованного столика 2 (опционально)"],
  "tips": [
    "Короткий полезный совет 1 на русском языке (например: 'Попробуйте забронировать стол у окна на закате сразу после спа-процедуры')",
    "Короткий полезный совет 2 на русском языке",
    "Короткий полезный совет 3 на русском языке"
  ],
  "promoCode": "Один уникальный персонализированный промокод (например, OMNILUXE, RECHARGE, HARMONY) со скидкой 10-15%"
}
Убедись, что предложенные ID услуг и столиков СТРОГО соответствуют реальным ID из списков выше.
`;

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              suggestedServiceIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              suggestedTableIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              tips: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              promoCode: { type: Type.STRING }
            },
            required: ["summary", "suggestedServiceIds", "suggestedTableIds", "tips"]
          }
        }
      });

      const recommendationData = JSON.parse(response.text || "{}");
      res.json({ ...recommendationData, algorithmAnalysis });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      // Fallback response if API Key is not set or failed
      const fallback: AIRecommendation = {
        summary: `Рады приветствовать вас, ${user.name}! На основе ваших предпочтений мы рекомендуем совместить приятный расслабряющий уход и изысканный ужин. Ознакомьтесь с нашими спа-программами и лучшими VIP-местами для незабываемого вечера.`,
        suggestedServiceIds: [services[0].id, services[1].id],
        suggestedTableIds: [tables[2].id, tables[6].id],
        tips: [
          "Забронируйте столик у окна, чтобы насладиться прекрасным панорамным видом.",
          "Для максимальной релаксации посетите спа-ритуал перед ужином.",
          "Попробуйте заказать индивидуальную тренировку для отличного тонуса."
        ],
        promoCode: "OMNIWELCOME"
      };
      res.json({ ...fallback, algorithmAnalysis });
    }
  };

  app.post("/api/recommendations", handleAIRecommendation);
  app.get("/api/recommendation", handleAIRecommendation);

  // API - AI Chat Agent for booking help
  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    const { messages } = req.body;
    const userId = (req as AuthedRequest).authUserId!;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "История сообщений обязательна." });
    }

    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден." });
    }

    // Combine static information and user context for the system prompt
    const availableServicesList = services.map(s => 
      `- Услуга ID: ${s.id}, Название: "${s.name}", Категория: "${s.category}", Длительность: ${s.duration} мин, Цена: ${s.price} ₽, Описание: "${s.description}", Салон: "${s.salonName}" (ID: ${s.salonId}), Специалисты: [${s.staff.map(st => `${st.name} (${st.role}, рейтинг ★${st.rating}, ID: ${st.id})`).join(", ")}]`
    ).join("\n");

    const availableRestaurantsAndTablesList = restaurants.map(r => {
      const rTables = tables.filter(t => t.restaurantId === r.id);
      const tablesStr = rTables.map(t => 
        `  • Стол ID: ${t.id}, Номер: #${t.number}, Зал: "${t.room}" (${r.rooms[t.room as keyof typeof r.rooms] || t.room}), Вместимость: до ${t.capacity} чел, Депозит: ${t.price} ₽, Тип: ${t.type}`
      ).join("\n");
      return `Ресторан: "${r.name}" (ID: ${r.id}, Кухня: "${r.cuisine}", Рейтинг: ★${r.rating})\nОписание: "${r.description}"\nЗалы: ${JSON.stringify(r.rooms)}\nСтолики:\n${tablesStr}`;
    }).join("\n\n");

    const systemPrompt = `Ты - OmniConcierge, изысканный, вежливый и невероятно умный персональный AI-помощник и консьерж в объединенном люксовом суперсервисе OmniReserve.
Ты помогаешь клиентам ориентироваться в услугах и заведениях, даешь персональные рекомендации и помогаешь БРОНИРОВАТЬ столики в ресторанах и услуги спа, велнеса или красоты.

ИНФОРМАЦИЯ О ТЕКУЩЕМ КЛИЕНТЕ:
• Имя: ${user.name}
• Предпочтения: ${user.preferences?.join(", ") || "не указаны"}
• Текущий баланс: ${user.balance} ₽
• Твой ID пользователя: ${user.id}

ТЕКУЩАЯ ДАТА НА ПЛАТФОРМЕ:
Четверг, 16 июля 2026 года. (Вся твоя логика планирования дат должна исходить из того, что сегодня - 16 июля 2026 года).

НАШИ ДОСТУПНЫЕ УСЛУГИ (Bookly - велнес, спа, фитнес, бьюти):
${availableServicesList}

НАШИ РЕСТОРАНЫ И СТОЛЫ (Tabletop - ресторанное бронирование):
${availableRestaurantsAndTablesList}

ПРАВИЛА И ИНСТРУКЦИИ ДЛЯ ЧАТА:
1. Твоя основная цель - помочь клиенту найти подходящее заведение/услугу и совершить бронирование.
2. Будь исключительно вежлив, используй изысканный, люксовый тон, обращайся к клиенту по имени (${user.name}).
3. Отвечай на том же языке, на котором обращается клиент. По умолчанию используй русский язык.
4. Если клиент хочет забронировать столик или услугу, помоги ему определиться с заведением, специалистом (для услуг), датой, временем и количеством гостей.
5. Когда все детали ясны или когда клиент просит забронировать конкретный вариант, предложи конкретное бронирование.
6. Для этого ты ОБЯЗАТЕЛЬНО должен включить объект "proposal" в свой JSON-ответ. Если предложение готово, заполни поля структуры proposal максимально точно, чтобы они СТРОГО соответствовали реальным ID ресторанов, услуг, столов и специалистов.
7. Не придумывай несуществующие ID! Бери ID строго из списков выше.
8. Если у пользователя недостаточно баланса (баланс ${user.balance} ₽), вежливо предупреди его об этом и подскажи, что он может пополнить баланс в верхнем меню дашборда с помощью кнопки "+".
9. Твой текстовый ответ (поле "reply") должен быть емким, элегантным, вежливым и изысканным. Никогда не перечисляй все доступные заведения, услуги или столики в своем текстовом ответе. Ограничивай свой ответ максимум 3-5 предложениями. Не выводи длинные списки или простыни текста.

СТРУКТУРА JSON ОТВЕТА:
Ты должен вернуть ответ СТРОГО в формате JSON, соответствующем следующей схеме:
{
  "reply": "Разговорный ответ ассистента в изысканном люксовом стиле. Объясни свой выбор, порекомендуй вежливо, пожелай отличного дня.",
  "proposal": {
    "type": "table" | "service",
    // Если type === "table":
    "restaurantId": "ID ресторана",
    "restaurantName": "Название ресторана",
    "tableId": "ID столика",
    "tableNumber": Номер столика (число),
    "room": "main" | "vip" | "terrace",
    "guests": Количество гостей (число),
    "notes": "Опциональные примечания от клиента",
    // Если type === "service":
    "salonId": "ID салона",
    "salonName": "Название салона",
    "serviceId": "ID услуги",
    "serviceName": "Название услуги",
    "category": "Категория услуги",
    "staffId": "ID специалиста",
    "staffName": "Имя специалиста",
    // Общие поля для обоих типов:
    "price": Стоимость/Депозит в рублях (число),
    "date": "Дата бронирования в формате YYYY-MM-DD (например: '2026-07-17')",
    "time": "Время бронирования в формате HH:MM (например: '19:00')"
  }
}

Если в данном сообщении нет конкретного предложения бронирования, не включай поле "proposal" в объект ответа (или оставь его undefined/null).`;

    // Map conversation messages to Gemini format
    // Convert client message history to contents parts
    const contents = messages.slice(-10).map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              proposal: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  restaurantId: { type: Type.STRING },
                  restaurantName: { type: Type.STRING },
                  tableId: { type: Type.STRING },
                  tableNumber: { type: Type.NUMBER },
                  room: { type: Type.STRING },
                  salonId: { type: Type.STRING },
                  salonName: { type: Type.STRING },
                  serviceId: { type: Type.STRING },
                  serviceName: { type: Type.STRING },
                  category: { type: Type.STRING },
                  staffId: { type: Type.STRING },
                  staffName: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  date: { type: Type.STRING },
                  time: { type: Type.STRING },
                  guests: { type: Type.NUMBER },
                  notes: { type: Type.STRING }
                },
                required: ["type", "price", "date", "time"]
              }
            },
            required: ["reply"]
          }
        }
      });

      let responseData: any = null;
      const responseText = response.text || "";
      try {
        responseData = JSON.parse(responseText || "{}");
      } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON. Raw text length:", responseText.length);
        console.error("Truncated raw response text:", responseText.slice(0, 1500));
        
        // Salvage using regex to extract 'reply' if it's somehow incomplete or has syntax issues
        const replyMatch = responseText.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
        if (replyMatch && replyMatch[1]) {
          const cleanReply = replyMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
          
          responseData = { reply: cleanReply };
        } else {
          throw parseError; // Rethrow to let the catch-block run fallback
        }
      }
      res.json(responseData);
    } catch (error: any) {
      console.error("AI Chat Error (using robust local fallback helper):", error);
      
      // Smart Rule-based Fallback Assistant so that chat NEVER fails even if Gemini is unavailable
      const lastUserMsg = messages.filter((m: any) => m.sender === "user").pop();
      const userText = lastUserMsg ? lastUserMsg.text.toLowerCase() : "";
      
      let reply = `Приветствую вас в качестве вашего персонального консьержа OmniConcierge, любезный ${user.name}! Наша интеллектуальная система временно испытывает технические работы со спутниковой связью, но я по-прежнему к вашим услугам в ручном режиме. `;
      let proposal: any = null;
      
      if (userText.includes("стол") || userText.includes("ресторан") || userText.includes("ужин") || userText.includes("обед") || userText.includes("atelier") || userText.includes("zen") || userText.includes("bison")) {
        const isZen = userText.includes("zen") || userText.includes("сакур") || userText.includes("японск");
        const isBison = userText.includes("bison") || userText.includes("vine") || userText.includes("бизон") || userText.includes("стейк");
        
        const targetRest = isZen ? restaurants[1] : (isBison ? restaurants[2] : restaurants[0]);
        const targetTable = tables.find(t => t.restaurantId === targetRest.id && t.room === "main") || tables[0];
        
        reply += `С удовольствием подберу для вас роскошный столик в ресторане "${targetRest.name}". Позвольте предложить вам наш лучший столик #${targetTable.number} в основном зале с панорамным видом. Ниже вы найдете готовое предложение для бронирования.`;
        proposal = {
          type: "table",
          restaurantId: targetRest.id,
          restaurantName: targetRest.name,
          tableId: targetTable.id,
          tableNumber: targetTable.number,
          room: targetTable.room,
          guests: 2,
          price: targetTable.price,
          date: "2026-07-17",
          time: "19:00",
          notes: "Резерв через OmniConcierge Concierge-Direct"
        };
      } else if (userText.includes("спа") || userText.includes("массаж") || userText.includes("тренировк") || userText.includes("йога") || userText.includes("фитнес") || userText.includes("spa") || userText.includes("massage")) {
        const isFitness = userText.includes("тренировк") || userText.includes("фитнес") || userText.includes("йог");
        const isBeauty = userText.includes("стрижк") || userText.includes("стилист") || userText.includes("волос");
        
        let targetService = services[0];
        if (isFitness) {
          targetService = services.find(s => s.category === "Fitness & Active") || services[2] || services[0];
        } else if (isBeauty) {
          targetService = services.find(s => s.category === "Beauty & Style") || services[4] || services[0];
        }
        
        const staffMember = targetService.staff[0] || { id: "staff-1", name: "Елена" };
        reply += `Замечательный выбор! Я подобрал для вас услугу "${targetService.name}" в элитном салоне ${targetService.salonName}. Буду искренне рад подтвердить вашу запись на прием к специалисту ${staffMember.name}. Вы можете мгновенно подтвердить бронирование ниже.`;
        proposal = {
          type: "service",
          salonId: targetService.salonId,
          salonName: targetService.salonName,
          serviceId: targetService.id,
          serviceName: targetService.name,
          category: targetService.category,
          staffId: staffMember.id,
          staffName: staffMember.name,
          price: targetService.price,
          date: "2026-07-17",
          time: "14:00"
        };
      } else {
        reply += `Пожалуйста, уточните ваши пожелания: вы можете сказать, например: «хочу забронировать столик в ресторане Sakura Zen завтра в 20:00» или «запиши меня на массаж», и я мгновенно сформирую резерв по лучшим тарифам нашей клубной карты!`;
      }
      
      res.json({ reply, proposal });
    }
  });

  // --- Global API error handler: capture stack traces on 5xx ---
  const apiErrorHandler: express.ErrorRequestHandler = (err, req, res, _next) => {
    const e = err instanceof Error ? err : new Error(String(err));
    pushLog({
      level: "error",
      source: "server",
      message: `Unhandled error at ${req.method} ${req.path}: ${e.message}`,
      stack: e.stack,
      method: req.method,
      path: req.path,
      status: 500,
      userId: (req as AuthedRequest).authUserId,
    });
    if (res.headersSent) return;
    res.status(500).json({ error: "Внутренняя ошибка сервера." });
  };
  app.use("/api", apiErrorHandler);



  // Vite middleware / production serving
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Attach Vite's HMR websocket to our HTTP server so live reload works
        // in the sandbox preview (single port, no separate WS server).
        hmr: { server: httpServer },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
