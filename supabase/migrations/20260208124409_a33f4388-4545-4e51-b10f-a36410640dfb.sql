-- Create stripe_subscription_events table with RLS
CREATE TABLE IF NOT EXISTS public.stripe_subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_subscription_events ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service role can insert events (for webhook processing)
CREATE POLICY "Service role can insert stripe events"
  ON public.stripe_subscription_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Users can view their own events (if user_id is set)
CREATE POLICY "Users can view own stripe events"
  ON public.stripe_subscription_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 3: Admins can view all events
CREATE POLICY "Admins can view all stripe events"
  ON public.stripe_subscription_events
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));