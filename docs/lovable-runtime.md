# Lovable Runtime Assumptions

ThinkAndTalk runs entirely on Lovable.

## Lovable provides
- Hosting
- Build and deploy
- Auth
- Database
- Environment variables
- Scheduled jobs or background tasks

## Constraints
- No Docker
- No custom servers
- No custom infrastructure
- No cloud-provider assumptions outside Lovable

## Integrations
- External APIs must be simple HTTP services
- Prefer RSS feeds or official APIs
- Store all results in the Lovable database
