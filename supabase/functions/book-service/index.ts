import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  }

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const {
    userId, serviceId, serviceName, category, staffId, staffName,
    date, time, price, salonId, salonName, currentBalance
  } = body ?? {};

  if (!userId || !serviceId || !staffId || !date || !time || typeof price !== 'number') {
    return new Response(JSON.stringify({ error: 'Неполные данные для бронирования услуги.' }), { status: 400, headers: jsonHeaders });
  }

  if (typeof currentBalance === 'number' && currentBalance < price) {
    return new Response(JSON.stringify({ error: 'Недостаточно средств для бронирования услуги.' }), { status: 400, headers: jsonHeaders });
  }

  const now = new Date().toISOString();
  const booking = {
    id: `b-${Date.now()}`,
    userId,
    type: 'service' as const,
    serviceId,
    serviceName: serviceName ?? '',
    category: category ?? '',
    staffId,
    staffName: staffName ?? '',
    date,
    time,
    createdAt: now,
    price,
    salonId: salonId ?? null,
    salonName: salonName ?? null,
  };

  const notification = {
    id: `notif-${Date.now()}`,
    userId,
    title: 'Услуга забронирована',
    message: `Подтверждено: ${serviceName ?? ''} (${category ?? ''}) на ${date} в ${time}. Специалист: ${staffName ?? ''}. Списано ${price} ₽.`,
    type: 'reminder',
    read: false,
    createdAt: now,
    linkToModule: 'dashboard',
  };

  return new Response(
    JSON.stringify({ booking, notification, priceCharged: price }),
    { status: 201, headers: jsonHeaders }
  );
});
