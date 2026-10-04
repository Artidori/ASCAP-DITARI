# ASCAP Ditari – PRD
## Problem
Albanian teacher lesson-diary (ditar) generator to sell. Teachers upload book photos; AI distributes content into the official diary sections.
## Implemented (2026-06)
- Admin panel (pw from ADMIN_PASSWORD env): create 1/2/3-subject license codes, deactivate, reset, delete (MongoDB `licenses`)
- Teacher activation by code (bound to email), session via X-License header
- Up to 6 book photos (client resized) -> Gemini 3 Flash (Emergent key) -> JSON -> official table (original structure)
- Editable preview, save, print, Word download (.docx via html-docx-js CDN, .doc fallback), archive (MongoDB `ditare`)
## Backlog
- P1: Online payment (Stripe) for auto license sales; license expiry dates
- P2: PDF export, school logo/header, yearly plan generator
