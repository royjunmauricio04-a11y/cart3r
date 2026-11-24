# CART3R TIKTOK BOOST

Campaign management and analytics for TikTok videos. **No fake engagement, bots, or automation.**

## Status (honest)
Implemented in this scaffold, NOT yet executed/verified (no network in the build sandbox):
- Prisma schema (all required models, unique constraints, indexes, cascades; nullable metrics = "unavailable")
- Auth.js credentials auth (+ [...nextauth] route), bcrypt hashing, register route with rate limit
- SSRF-safe TikTok URL parser/short-link resolver (host allowlist, https only, manual redirects)
- Routes: `POST /api/videos/analyze`, `GET/POST /api/campaigns`, `POST /api/qr/generate`
- Vitest URL-validation tests, Dockerfile, docker-compose

Not yet built: UI (Tailwind/shadcn dashboard), remaining CRUD routes ([id] GET/PATCH/DELETE), analytics/report/CSV routes,
TikTok Login Kit / Display API (needs developer-app approval), token encryption helper, Playwright E2E, security headers.

## Run
    cp .env.example .env   # fill AUTH_SECRET
    npm install && npx prisma migrate dev --name init
    npm test && npm run typecheck && npm run dev
Docker: `docker compose up --build`
