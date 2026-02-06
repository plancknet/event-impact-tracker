-- Create table to store Lastlink webhook events
CREATE TABLE IF NOT EXISTS public.lastlink_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  buyer_email TEXT,
  payment_id TEXT,
  is_test BOOLEAN NOT NULL DEFAULT false,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.lastlink_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage lastlink events"
  ON public.lastlink_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
