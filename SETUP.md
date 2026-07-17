# Setup — moving to Claude Code (10 minutes)

## 1. Create the repo
On github.com → New repository → name: `batrounrace-site` → Private → Create.
Clone it locally:
    git clone https://github.com/YOUR_USERNAME/batrounrace-site.git
    cd batrounrace-site

## 2. Drop in the files
Arrange like this:

    batrounrace-site/
    ├── CLAUDE.md              ← from this handoff pack
    ├── vercel.json            ← from this handoff pack
    ├── index.html             ← the approved homepage
    ├── images/                ← from download-images.sh (16 files)
    │   └── logo.png, hero-race-crowd.jpg, podium_*.jpg ...
    └── content/               ← the "pages/" folder from the migration pack
        ├── README.md
        ├── 01-homepage.md ... 06-results-2025.md

## 3. First commit
    git add -A
    git commit -m "Initial: approved homepage + content pack + project config"
    git push

## 4. Connect Vercel (one time)
- vercel.com → Sign up / Log in **with GitHub**
- "Add New… → Project" → Import `batrounrace-site`
- Framework preset: **Other** (it's static) → Deploy
- You get a live preview URL like batrounrace-site.vercel.app
- From now on: every `git push` auto-deploys. Nothing else to do.

## 5. Start Claude Code
    cd batrounrace-site
    claude

First message suggestion:
    "Read CLAUDE.md and index.html, then build about.html from
     content/02-about.md following the design system exactly."

Then one page per session/commit:
    contact.html → sponsors.html → sponsor-packages.html → results-2025.html

## 6. Later — launch day (NOT yet)
- Verify all pages + redirects on the vercel.app URL
- Add domain in Vercel → follow its DNS instructions at your registrar
- Keep Shopify alive ~1–2 weeks as fallback, then cancel
- Submit sitemap to Google Search Console

## Open questions to resolve along the way
1. Which phone number is correct: 81 300 625 or 70 544 217?
2. Contact form: WhatsApp link / mailto / Firebase?
3. Sponsor logo files — needed for sponsors.html logo wall
4. Keep the theme toggle at launch, or lock in Brand theme only?
