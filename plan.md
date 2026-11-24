# CART3R UI implementation plan

## Goal and approach
Replace the placeholder root route with a responsive CART3R dashboard and practical client-side workspaces using the existing Next.js 14 App Router, TypeScript, Auth.js, Prisma and API routes. Preserve honest analytics: unavailable metrics remain unavailable, never shown as invented zeroes. Connect UI actions to the existing `/api/videos/analyze`, `/api/campaigns`, and `/api/qr/generate` routes and surface authentication, loading, empty, success and error states. Keep the current TikTok integration limited to public oEmbed metadata and clearly label its limitations; do not add engagement manipulation or fabricate access to official metrics.

## Structure
- `src/app/page.tsx`: client dashboard shell with responsive navigation and routed workspaces for overview, videos, campaigns, analytics, captions, QR, reports, settings, and help.
- `src/app/globals.css`: shared responsive black/crimson design system and accessible interaction states.
- Existing `src/app/api/**` routes remain the backend source of truth; UI must handle their unauthorized and validation responses.
- Existing `src/auth.ts` and Prisma schema remain the authentication/data implementation. Render's production database URL is configured outside source control and must be corrected by the owner.

## Design
Reuse the approved premium black interface and crimson accent. **Movement:** editorial control-room SaaS, with restrained industrial dashboard cues. **Principles:** high contrast, crisp hierarchy, no fake data, mobile-first utility. **Color philosophy:** near-black surfaces anchor the interface; crimson signals brand and primary action, not errors alone; muted neutrals distinguish supporting information. **Layout:** narrow persistent desktop rail with a compact mobile bottom/side navigation and wide content canvas. **Signature elements:** crimson edge markers on active navigation; thin telemetry-style separators; compact status pills for data availability. **Interaction:** immediate feedback and safe empty states; form-driven actions; no decorative controls. **Animation:** brief fades/slides for workspace changes, reduced-motion aware; no constant motion. **Typography:** system sans stack with strong condensed-feeling heading weight and tabular numerals for counts. **Brand essence:** a reliable workspace for organizing and preparing TikTok promotions without promising artificial engagement; focused, candid, capable. **Voice:** direct, practical, transparent. Examples: “Keep every campaign in motion.” “Metrics appear when an authorized source provides them.” **Wordmark:** CART3R name with a simple crimson bracket/arrow motif. **Signature color:** deep crimson.

## Product behavior
- Overview summarizes only persisted campaign/video data; metric cards explain when metrics are unavailable.
- Analyzer validates and submits TikTok links to the API, displays available public metadata, and never claims private analytics access.
- Campaign workspace lists owned campaigns and submits creation forms to the existing API.
- Caption workspace creates local promotional draft suggestions and copy actions; it does not publish or interact with TikTok.
- QR workspace requests authenticated PNG/SVG outputs from the API and provides downloads.
- Reports export current available campaign/video records as CSV; absent metrics are left blank.
- Login/registration paths link users to existing Auth.js credentials and registration endpoints; UI states that a valid production database is required.
- Settings/help explain privacy, unavailable official API access and required TikTok developer approval.
