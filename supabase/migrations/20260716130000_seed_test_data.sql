-- Seed a basic restaurant/service business for local testing.
-- This uses the base schema created by the bootstrap migration.

DO $$
DECLARE
  test_business_id uuid;
  test_room_id uuid;
BEGIN
  INSERT INTO public.businesses (id, owner_id, name, slug, kind, description, address, city, category, cuisine, is_published, price_tier)
  VALUES (
    '11111111-1111-1111-1111-111111111111'::uuid,
    auth.uid(),
    'Test Restaurant',
    'test-restaurant',
    'restaurant',
    'A polished demo restaurant for local testing.',
    '123 Demo Street',
    'San Francisco',
    'Dining',
    'Contemporary',
    true,
    2
  )
  RETURNING id INTO test_business_id;

  INSERT INTO public.rooms (id, business_id, name, mesh_url)
  VALUES (
    '22222222-2222-2222-2222-222222222222'::uuid,
    test_business_id,
    'Main Dining Room',
    null
  )
  RETURNING id INTO test_room_id;

  INSERT INTO public.dining_tables (id, room_id, label, capacity, features, base_price_cents, shape)
  VALUES
    ('33333333-3333-3333-3333-333333333333'::uuid, test_room_id, 'Table 1', 4, ARRAY['window','quiet'], 150000, 'round'),
    ('33333333-3333-3333-3333-333333333334'::uuid, test_room_id, 'Table 2', 2, ARRAY['corner'], 120000, 'square'),
    ('33333333-3333-3333-3333-333333333335'::uuid, test_room_id, 'Table 3', 6, ARRAY['private','window'], 220000, 'round'),
    ('33333333-3333-3333-3333-333333333336'::uuid, test_room_id, 'Table 4', 8, ARRAY['party'], 280000, 'rectangular');

  INSERT INTO public.services (id, business_id, name, description, price_cents, currency, duration_minutes, is_active)
  VALUES
    ('44444444-4444-4444-4444-444444444444'::uuid, test_business_id, 'Signature Tasting Menu', 'A chef-led tasting experience for demo guests.', 120000, 'USD', 90, true),
    ('44444444-4444-4444-4444-444444444445'::uuid, test_business_id, 'Chef''s Counter Experience', 'An intimate chef-led tasting at the counter.', 180000, 'USD', 120, true),
    ('44444444-4444-4444-4444-444444444446'::uuid, test_business_id, 'Wine Pairing Flight', 'A guided wine pairing for two or more guests.', 90000, 'USD', 60, true);
END $$;
