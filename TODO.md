# CART3R outcome checklist

- [x] **Dashboard and navigation:** show tracked videos and active campaigns, latest authorized metric snapshots, recent user activity and campaign summary; preserve loading, empty and error states; responsive desktop/mobile navigation; never fabricate metric values.
- [~] **Video analyzer:** validates TikTok video URLs, resolves supported short links, saves videos and displays public metadata/thumbnail and an open-on-TikTok link; TikTok embed preview is not implemented, and metrics remain unavailable without authorized API access.
- [x] **Campaign manager:** create, list, edit and delete account-owned campaigns; retain names, descriptions, statuses, dates and video counts; attach only videos owned by the current user; provide confirmation and feedback for deletion and errors.
- [~] **Analytics:** display only authorized views, likes, comments, shares and engagement-rate snapshots; missing values remain blank; a historical time series, date filters and comparison/report history need an authorized data source and additional implementation.
- [x] **Caption generator:** create local promotional drafts in three writing styles with calls to action and hashtags; copy-to-clipboard action reports success or clipboard failure; no automatic posting.
- [~] **QR generator:** generate authenticated PNG/SVG downloads from validated TikTok links; campaign-specific QR association remains to be added.
- [~] **Sharing/reporting:** copy and open saved video links and export currently available campaign/video records to CSV with missing metrics blank; shareable campaign pages, click analytics, date filters and PDF export remain unimplemented.
- [x] **Authentication entry points:** provide sign-in and registration forms wired to Auth.js and the account registration endpoint; server APIs enforce user-scoped records and the UI reports access/configuration errors.
- [x] **Settings/help:** explain account-scoped storage, privacy, unavailable metrics and TikTok developer approval requirements.
- [x] **Build and safety:** preserve the existing backend/data model and legitimate-promotion-only policy; tests, TypeScript type-check, Prisma validation, and production build all pass.
