# News Pipeline - ThinkAndTalk

## Purpose
Surface timely, relevant facts that improve creator scripts without adding noise.

## Inputs
- Creator topic focus
- Audience and region
- Desired freshness window (default 30 days)
- Platform and content goal

## Pipeline steps
1. Build search terms based on creator focus and audience
2. Query trusted sources (RSS or official APIs)
3. Deduplicate by URL and canonical title
4. Score by relevance, recency, and source credibility
5. Extract full text when allowed
6. Summarize to 3-5 bullet facts with citations
7. Store and attach to script drafts

## Scoring signals
- Keyword overlap with creator focus
- Publication date decay
- Geographic relevance
- Source trust tier

## Output
- Small set of high-signal facts
- Links and publication metadata
- Suggested angles or hooks

## Constraints
- Lovable runtime only (no custom infrastructure)
- Use built-in jobs or schedules provided by Lovable
