# Batroun Race — Shopify → Custom Site Migration Pack
Generated: 2026-07-17 · Source: batrounrace.com (Shopify)

## What's in this pack
- `pages/01-homepage.md` … `06-results-2025.md` — full content of every page, cleaned of Shopify chrome (cart, account, "powered by")
- `download-images.sh` — run locally to rescue all images before the store closes
- This README — plan, redirect map, open questions

## Site map (new)
| New URL | Content | Old Shopify URL (301 redirect from) |
|---|---|---|
| `/` | Homepage (rebuilt as real landing page) | `/` |
| `/about` | Who We Are | `/pages/about-batroun-race` |
| `/contact` | Build With Us | `/pages/contact` |
| `/sponsors` | Sponsors & Partners | `/pages/pages-sponsors-partners` |
| `/sponsor-packages` | Packages & pricing (consider trimming, see below) | `/pages/batroun-race-sponsors` |
| `/results/2025` | 2025 podium results | `/pages/batroun-race-2025-winners-official-podium-result` |
| `/results/2026` | → already at register.batrounrace.com/results | n/a |
| external | Registration → register.batrounrace.com | n/a |

## Recommended architecture
- **Static site** (no CMS needed for 7 pages updated ~once/year)
- Host: GitHub Pages (same as register.batrounrace.com — consistent, free) or Vercel
- Stack options:
  a) Plain HTML/CSS/JS — simplest, matches your registration site
  b) Next.js static export — if you want to reuse EduLM-style components
- Point batrounrace.com DNS to the new host when live; keep Shopify until verified

## Bugs/issues found on current site (fix in rebuild)
1. Homepage "Register Now" links to `/collections/all` (empty shop) instead of register.batrounrace.com
2. Two different phone numbers on Contact page: 81 300 625 vs +961 70 544 217 — confirm
3. Footer email signup uses shop language ("exclusive deals… new products") — replace with race-appropriate copy or Instagram follow
4. Nav inconsistent between pages (some have Results 2026, some don't)
5. Entry List 2025 page renders via JS — table data not in HTML (you have it in Firebase anyway)

## Still needed from you
- [ ] Run `download-images.sh` locally; also download everything in Shopify Admin → Content → Files
- [ ] Sponsor/partner logo files (logo wall + belt) — from your design assets
- [ ] Confirm phone number(s)
- [ ] Decide: keep full public pricing/playbook page, or split into clean public page + private PDF deck
- [ ] Entry list 2025: export from Firebase if you want to keep that page

## SEO / launch checklist
- [ ] 301 redirects for every /pages/* URL (table above)
- [ ] Keep the same meta titles/descriptions initially (they're already written — in each page file)
- [ ] Submit new sitemap to Google Search Console
- [ ] Keep Shopify live until DNS propagated + redirects verified, then cancel
