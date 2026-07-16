import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const isPremiumTime = (t: string) => ["18:30", "19:00", "20:30"].includes(t);
const priceFor = (base: number, t: string) =>
  isPremiumTime(t) ? Math.round((base * 1.25) / 50) * 50 : base;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: jsonHeaders });
  }

  let body: any;
  try { body = await req.json(); } catch { body = {}; }
  const {
    userId, tableId, tableNumber, room, restaurantId, restaurantName,
    date, time, guests, notes, basePrice, currentBalance,
    tableIds, tableNumbers, rooms, basePrices
  } = body ?? {};

  const hasMultiple = Array.isArray(tableIds) && tableIds.length > 0;
  const targetTableIds: string[] = hasMultiple ? tableIds : (tableId ? [tableId] : []);
  const targetTableNumbers: number[] = hasMultiple ? (tableNumbers ?? []) : (tableNumber ? [tableNumber] : []);
  const targetRooms: string[] = hasMultiple ? (rooms ?? []) : (room ? [room] : []);
  const targetBasePrices: number[] = hasMultiple ? (basePrices ?? []) : (typeof basePrice === 'number' ? [basePrice] : []);

  if (!userId || targetTableIds.length === 0 || !date || !time || !guests) {
    return new Response(JSON.stringify({ error: 'Неполные данные для бронирования стола.' }), { status: 400, headers: jsonHeaders });
  }

  let totalActualPrice = 0;
  const bookingsList = targetTableIds.map((tId, idx) => {
    const bPrice = targetBasePrices[idx] ?? basePrice ?? 0;
    const actualPrice = priceFor(bPrice, time);
    totalActualPrice += actualPrice;

    return {
      id: `b-${Date.now()}-${idx}`,
      userId,
      type: 'table' as const,
      tableId: tId,
      tableNumber: targetTableNumbers[idx] ?? null,
      room: targetRooms[idx] ?? 'main',
      date,
      time,
      guests,
      notes: notes ?? '',
      createdAt: new Date().toISOString(),
      price: actualPrice,
      restaurantId: restaurantId ?? null,
      restaurantName: restaurantName ?? 'Ресторан',
    };
  });

  if (typeof currentBalance === 'number' && currentBalance < totalActualPrice) {
    return new Response(JSON.stringify({ error: `Недостаточно средств для списания депозита. Требуется: ${totalActualPrice} ₽` }), { status: 400, headers: jsonHeaders });
  }

  const tableNumbersText = targetTableNumbers.length > 0 ? targetTableNumbers.join(', #') : '';
  const notification = {
    id: `notif-${Date.now()}`,
    userId,
    title: 'Столы забронированы',
    message: `Подтверждено: Столы (#${tableNumbersText}) в ресторане "${restaurantName ?? 'Ресторан'}" на ${date} в ${time}. Депозит ${totalActualPrice} ₽ списан.`,
    type: 'reminder',
    read: false,
    createdAt: new Date().toISOString(),
    linkToModule: 'dashboard',
  };

  return new Response(
    JSON.stringify({
      booking: bookingsList[0],
      bookings: bookingsList,
      notification,
      priceCharged: totalActualPrice
    }),
    { status: 201, headers: jsonHeaders }
  );
});
