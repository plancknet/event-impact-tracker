-- Drop tables that are no longer needed for the current version
-- These were part of the old news pipeline that has been removed

-- Drop foreign key dependent tables first, then parent tables
DROP TABLE IF EXISTS news_ai_analysis CASCADE;
DROP TABLE IF EXISTS full_news_content CASCADE;
DROP TABLE IF EXISTS alert_news_results CASCADE;
DROP TABLE IF EXISTS alert_query_results CASCADE;
DROP TABLE IF EXISTS search_terms CASCADE;