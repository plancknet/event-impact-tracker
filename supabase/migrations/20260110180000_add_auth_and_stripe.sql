CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_type TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'STANDARD', 'INFLUENCER')),
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  plan_confirmed BOOLEAN NOT NULL DEFAULT false,
  purchase_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,
  stripe_latest_invoice_id TEXT,
  current_period_end TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  last_subscription_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_users_updated_at();

CREATE TABLE IF NOT EXISTS public.stripe_subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
