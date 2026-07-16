
-- Restrict public read of rooms to only rooms belonging to published businesses; owners still see their own.
DROP POLICY IF EXISTS "Rooms public read" ON public.rooms;
CREATE POLICY "Rooms public read"
  ON public.rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = rooms.business_id
        AND (b.is_published = true OR b.owner_id = auth.uid())
    )
  );

-- Restrict public read of dining_tables to tables in published businesses; owners still see their own.
DROP POLICY IF EXISTS "Dining tables public read" ON public.dining_tables;
CREATE POLICY "Dining tables public read"
  ON public.dining_tables
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.rooms r
      JOIN public.businesses b ON b.id = r.business_id
      WHERE r.id = dining_tables.room_id
        AND (b.is_published = true OR b.owner_id = auth.uid())
    )
  );

-- Restrict public read of reviews to reviews for published businesses;
-- the review author and the owning business always see their own.
DROP POLICY IF EXISTS "Reviews public read" ON public.reviews;
CREATE POLICY "Reviews public read"
  ON public.reviews
  FOR SELECT
  USING (
    auth.uid() = client_id
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = reviews.business_id
        AND (b.is_published = true OR b.owner_id = auth.uid())
    )
  );

-- Prevent double-booking the same dining table at the same start_time
-- (any non-cancelled booking blocks the slot). Complements the RLS-scoped
-- guest PII to make sure the booking dataset is internally consistent.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_unique_table_slot
  ON public.bookings (table_id, start_time)
  WHERE table_id IS NOT NULL AND status <> 'cancelled';
