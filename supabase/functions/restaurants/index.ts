import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const restaurants = [
  {
    id: "grand-atelier",
    name: "Grand Atelier",
    description: "Кухня высокой французской гастрономии от шеф-повара со звездой Мишлен. Идеальная винная карта, живая арфа и панорамный вид на реку.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600",
    rating: 4.9,
    cuisine: "Французская высокая кухня",
    rooms: { main: "Основной зал Grand Hall", vip: "VIP Кабинет Atelier", terrace: "Терраса у воды" }
  },
  {
    id: "sakura-zen",
    name: "Sakura Zen",
    description: "Аутентичный японский минимализм. Свежайшие морепродукты с токийского рынка, живой теппан-гриль шоу и умиротворяющий дзен-сад с бамбуком.",
    image: "https://images.unsplash.com/photo-1579027989536-b7b1714a6e56?auto=format&fit=crop&q=80&w=600",
    rating: 4.8,
    cuisine: "Японская / Суши / Теппан",
    rooms: { main: "Зал Дзен-Сад", vip: "VIP Чайная комната", terrace: "Бамбуковая веранда" }
  },
  {
    id: "bison-vine",
    name: "Bison & Vine",
    description: "Легендарный стейкхаус с открытым дровяным грилем. Премиальная мраморная говядина влажного и сухого вызревания, брутальный кирпичный декор.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600",
    rating: 4.7,
    cuisine: "Гриль / Стейки / Барбекю",
    rooms: { main: "Главный Гриль-Зал", vip: "Каминный VIP Зал", terrace: "Уютная Патио-Веранда" }
  }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  try {
    if (req.method === 'GET') {
      return new Response(JSON.stringify(restaurants), { headers: jsonHeaders });
    }
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const { name, description, image, cuisine } = body ?? {};
      if (!name) {
        return new Response(JSON.stringify({ error: 'Название ресторана обязательно' }), { status: 400, headers: jsonHeaders });
      }
      const newRestaurant = {
        id: `restaurant-${Date.now()}`,
        name,
        description: description || 'Свежезарегистрированное гастрономическое заведение на платформе OmniReserve.',
        image: image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
        rating: 5.0,
        cuisine: cuisine || 'Европейская',
        rooms: { main: 'Главный зал', vip: 'VIP-кабинет', terrace: 'Летняя веранда' }
      };
      return new Response(JSON.stringify(newRestaurant), { status: 201, headers: jsonHeaders });
    }
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: jsonHeaders });
  }
});
