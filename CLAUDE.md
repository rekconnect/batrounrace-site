# CLAUDE.md — batrounrace-site

## What this is
The new official website for **Batroun Race** (batrounrace.com) — Lebanon's coastal
running event (5KM & 10KM) organized by Raed with Selaata Sporting Club and the
Lebanese Athletics Federation. This site REPLACES the current Shopify site.
Registration/payments/results stay on the separate existing system:
**https://register.batrounrace.com** (Firebase + GitHub Pages) — never rebuild those here.

## Stack & hosting
- Static site: plain HTML + CSS + vanilla JS. No framework, no build step.
- Hosting: Vercel, auto-deploy from this GitHub repo (main branch).
- Domain batrounrace.com will point to Vercel at launch. Shopify stays live until then.

## Design system (already approved — do not change without asking)
Reference implementation: `index.html` (homepage, finished and approved).

### Themes (CSS variables on :root)
Default = **Brand** (from the official logo):
- --ink: #030F2B (deep navy, dark sections)
- --sea: #0668CD (royal blue) · --azure: #0491D8 (bright azure)
- --coral: #F7A00A (sun orange — sole energy accent: CTAs, KM markers, route fill)
- --foam: #F4F7FC (light sections)
Alt theme `[data-theme="coastal"]`: petrol #082A2E / teal #17666B / coral #FF4D2E / seafoam #F2F7F6.
Theme toggle button in nav. On this deployed site, persist choice in localStorage.

### Typography
- Display: 'Bricolage Grotesque' (800 for h1/h2, 600 for h3) — uppercase for hero only
- Body: 'Instrument Sans'
- Data/labels/timing: 'IBM Plex Mono' (KM markers, stats, results tables)
- Google Fonts, loaded in <head>

### Signature concept: "the page is the route"
- Fixed vertical route line on the left (desktop only, hidden <1320px) filling
  with --coral on scroll (#routeFill)
- Sections open with a KM marker label (.km): mono, uppercase, coral, with dash
- Register CTA = race-bib card (.bib): rounded, punched holes, -1.5° tilt, hover straightens
- Dashed .startline divider after hero

### Motion rules
- Reveal-on-scroll: opacity+translateY(18px), .5s ease-out, IntersectionObserver
- Hovers: translateY(-4px) + soft shadow on cards, .2s ease-out
- transform+opacity only; ALWAYS respect prefers-reduced-motion
- :focus-visible outline in --coral

## Pages to build (content in /content/*.md — extracted from old site, use as source of truth)
| File | Content source | Old Shopify URL (301) |
|---|---|---|
| index.html ✅ done | 01-homepage.md | / |
| about.html | 02-about.md | /pages/about-batroun-race |
| contact.html | 03-contact.md | /pages/contact |
| sponsors.html | 04-sponsors-partners.md | /pages/pages-sponsors-partners |
| sponsor-packages.html | 05-sponsor-preview.md | /pages/batroun-race-sponsors |
| results-2025.html | 06-results-2025.md | /pages/batroun-race-2025-winners-official-podium-result |

Shared header/footer must match index.html exactly on every page (copy the markup;
if duplication becomes painful we can add a tiny JS include later — keep it simple first).

## Content rules
- Real content only — everything is in /content/. Never invent runners, results, stats.
- Registration links ALWAYS → https://register.batrounrace.com/
- 2026 results → https://register.batrounrace.com/results
- Contact: Batrounrace@gmail.com · WhatsApp wa.me/message/IJ45O3ILIUGMF1 ·
  Instagram @batrounrace · Phone: ⚠️ TWO numbers found on old site (81 300 625 vs
  70 544 217) — ASK RAED which before publishing contact page.
- Contact form: old Shopify form is dead. Options: WhatsApp deep-link (simplest),
  mailto, or Firebase (Raed has it). Ask before implementing.
- Sponsor-packages page: old page exposed internal sales playbook (CPA benchmarks,
  copy-paste sales emails). Build the CLEAN public version: hero, 3-phase model,
  packages (Kiosk $250–300 / Bronze $500 / Silver $1,000 / Gold $3,000 / Platinum
  $5,000), decision chart, CTA. Playbook details go in the PDF deck, not the site.

## Images
- /images/ — rescued from Shopify CDN (see content pack download-images.sh)
- Sponsor logos: pending from Raed's design assets (chips as placeholder meanwhile)
- Any <img> must have alt text; use onerror hide pattern from index.html for
  not-yet-present files

## SEO / launch
- Each page: <title> + meta description (drafts in each /content/*.md header)
- vercel.json has the 301 redirect map — keep in sync with table above
- Launch checklist lives in content/README.md (bottom)

## Style of collaboration
- Small commits, one page or one concern per commit
- Mobile-first responsive; test at 380px and 1440px
- No frameworks, no npm deps, no build tools unless Raed asks
