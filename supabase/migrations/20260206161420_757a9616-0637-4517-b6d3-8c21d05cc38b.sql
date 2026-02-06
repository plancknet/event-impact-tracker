-- Create table to log all Lastlink webhook events for audit
CREATE TABLE public.lastlink_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lastlink_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by email
CREATE INDEX idx_lastlink_events_buyer_email ON public.lastlink_events(buyer_email);

-- Create index to prevent duplicate event processing
CREATE UNIQUE INDEX idx_lastlink_events_event_id ON public.lastlink_events(lastlink_event_id);

-- Enable RLS
ALTER TABLE public.lastlink_events ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can access this table
-- (No policies means no access via normal client, only service_role key bypasses RLS)