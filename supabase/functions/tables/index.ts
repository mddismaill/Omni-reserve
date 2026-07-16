import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type Room = 'main' | 'vip' | 'terrace';
interface StaticTable {
  id: string;
  number: number;
  capacity: number;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'circle' | 'rect';
  type: 'vip' | 'window' | 'standard' | 'terrace';
  room: Room;
  price: number;
  restaurantId: string;
}

const tables: StaticTable[] = [
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

const isPremiumTime = (t: string) => ["18:30", "19:00", "20:30"].includes(t);
const priceFor = (base: number, t: string) =>
  isPremiumTime(t) ? Math.round((base * 1.25) / 50) * 50 : base;

Deno.serve((req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  }
  const url = new URL(req.url);
  const restaurantId = url.searchParams.get('restaurantId') || 'grand-atelier';
  const time = url.searchParams.get('time') || '19:00';
  const bookedIds = (url.searchParams.get('bookedIds') || '').split(',').filter(Boolean);
  const filtered = tables.filter(t => t.restaurantId === restaurantId);
  const withStatus = filtered.map(t => ({
    ...t,
    price: priceFor(t.price, time),
    isPremium: isPremiumTime(time),
    status: bookedIds.includes(t.id) ? 'booked' : 'available',
  }));
  return new Response(JSON.stringify(withStatus), { headers: jsonHeaders });
});
