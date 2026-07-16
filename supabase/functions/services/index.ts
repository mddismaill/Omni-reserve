import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const staffList = [
  { id: "staff-1", name: "Елена Соколова", role: "Ведущий спа-терапевт", rating: 4.9, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120" },
  { id: "staff-2", name: "Дмитрий Петров", role: "Элитный фитнес-тренер", rating: 4.9, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120" },
  { id: "staff-3", name: "Анна Кузнецова", role: "Топ-стилист", rating: 4.8, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120" },
  { id: "staff-4", name: "Ольга Морозова", role: "Мастер массажа и йоги", rating: 4.7, avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120" }
];

const services = [
  { id: "spa-1", name: "Премиальный Спа-Ритуал «Гармония»", category: "Spa & Wellness", duration: 90, price: 4500, rating: 4.9, description: "Комплексный уход за телом и лицом: пилинг, расслабляющее обертывание и массаж с теплыми аромамаслами.", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=500", staff: [staffList[0], staffList[3]], salonId: "lotus-spa", salonName: "Lotus Spa & Wellness" },
  { id: "spa-2", name: "Глубокий массаж мышц (Deep Tissue)", category: "Spa & Wellness", duration: 60, price: 3200, rating: 4.8, description: "Интенсивный терапевтический массаж для снятия хронического напряжения и восстановления после нагрузок.", image: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=500", staff: [staffList[0], staffList[3]], salonId: "lotus-spa", salonName: "Lotus Spa & Wellness" },
  { id: "fit-1", name: "Персональная тренировка с Elite-инструктором", category: "Fitness & Active", duration: 60, price: 2000, rating: 4.9, description: "Индивидуальный план занятий, постановка техники движений, рекомендации по питанию и высокая мотивация.", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=500", staff: [staffList[1]], salonId: "gold-gym", salonName: "Gold Gym Active" },
  { id: "fit-2", name: "Групповое занятие Хатха-Йогой", category: "Fitness & Active", duration: 75, price: 1200, rating: 4.6, description: "Практика асан, дыхательных упражнений и глубокая релаксация в конце класса для баланса ума и тела.", image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=500", staff: [staffList[3]], salonId: "gold-gym", salonName: "Gold Gym Active" },
  { id: "beauty-1", name: "Стрижка, укладка и уход от Топ-стилиста", category: "Beauty & Style", duration: 60, price: 3500, rating: 4.9, description: "Создание индивидуального стиля, бережное мытье с профессиональным уходом и безупречная укладка.", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=500", staff: [staffList[2]], salonId: "prime-barber", salonName: "Prime Barber & Style" },
  { id: "beauty-2", name: "Аппаратный Маникюр & Спа-уход для рук", category: "Beauty & Style", duration: 45, price: 1800, rating: 4.8, description: "Профессиональная обработка ногтей, пилинг, питательная маска и легкий массаж кистей с ароматным кремом.", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=500", staff: [staffList[2]], salonId: "prime-barber", salonName: "Prime Barber & Style" }
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (req.method === 'GET') {
    return new Response(JSON.stringify(services), { headers: jsonHeaders });
  }
  return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
});
