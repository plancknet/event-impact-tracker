-- Create search_terms table
CREATE TABLE public.search_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alert_query_results table
CREATE TABLE public.alert_query_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    term_id UUID NOT NULL REFERENCES public.search_terms(id) ON DELETE CASCADE,
    raw_html TEXT,
    queried_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'error'))
);

-- Create alert_news_results table
CREATE TABLE public.alert_news_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_result_id UUID NOT NULL REFERENCES public.alert_query_results(id) ON DELETE CASCADE,
    title TEXT,
    snippet TEXT,
    link_url TEXT,
    source_raw TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_alert_query_results_term_id ON public.alert_query_results(term_id);
CREATE INDEX idx_alert_news_results_query_result_id ON public.alert_news_results(query_result_id);

-- Enable RLS but allow public access for this tool
ALTER TABLE public.search_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_query_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_news_results ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for this tool)
CREATE POLICY "Allow public read access on search_terms" ON public.search_terms FOR SELECT USING (true);
CREATE POLICY "Allow public insert on search_terms" ON public.search_terms FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on search_terms" ON public.search_terms FOR DELETE USING (true);

CREATE POLICY "Allow public read access on alert_query_results" ON public.alert_query_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert on alert_query_results" ON public.alert_query_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on alert_query_results" ON public.alert_query_results FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on alert_query_results" ON public.alert_query_results FOR DELETE USING (true);

CREATE POLICY "Allow public read access on alert_news_results" ON public.alert_news_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert on alert_news_results" ON public.alert_news_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete on alert_news_results" ON public.alert_news_results FOR DELETE USING (true);