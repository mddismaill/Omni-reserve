import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const salons = [
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    if (req.method === 'GET') {
      return new Response(JSON.stringify(salons), { headers: jsonHeaders });
    }
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { name, description, image, category, address } = body ?? {};
      if (!name) {
        return new Response(JSON.stringify({ error: 'Название салона обязательно' }), { status: 400, headers: jsonHeaders });
      }
      const newSalon = {
        id: `salon-${Date.now()}`,
        name,
        description: description || 'Новый центр услуг на нашей платформе.',
        category: category || 'Spa & Wellness',
        image: image || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=600',
        rating: 5.0,
        address: address || 'Центральный бульвар, д. 10'
      };
      return new Response(JSON.stringify(newSalon), { status: 201, headers: jsonHeaders });
    }
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: jsonHeaders });
  }
});
