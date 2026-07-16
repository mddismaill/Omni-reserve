
CREATE TABLE public.business_financials (
  business_id UUID PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  tax_id TEXT,
  payout_iban TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_financials_tax_id_check CHECK (tax_id IS NULL OR tax_id ~ '^[0-9]{8}$'),
  CONSTRAINT business_financials_iban_check CHECK (payout_iban IS NULL OR payout_iban ~ '^AM[A-Z0-9]{20}$')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_financials TO authenticated;
GRANT ALL ON public.business_financials TO service_role;

ALTER TABLE public.business_financials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their financials"
  ON public.business_financials FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their financials"
  ON public.business_financials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their financials"
  ON public.business_financials FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their financials"
  ON public.business_financials FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE TRIGGER update_business_financials_updated_at
  BEFORE UPDATE ON public.business_financials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Ensure legacy columns exist so the migration can run on fresh databases.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS payout_iban TEXT;

-- Migrate existing data
INSERT INTO public.business_financials (business_id, owner_id, tax_id, payout_iban)
SELECT id, owner_id, tax_id, payout_iban
FROM public.businesses
WHERE tax_id IS NOT NULL OR payout_iban IS NOT NULL
ON CONFLICT (business_id) DO NOTHING;

-- Drop sensitive columns from businesses
ALTER TABLE public.businesses DROP COLUMN IF EXISTS tax_id;
ALTER TABLE public.businesses DROP COLUMN IF EXISTS payout_iban;
