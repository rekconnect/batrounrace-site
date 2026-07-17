#!/bin/bash
# Batroun Race — image rescue script
# Run this on YOUR machine (Git Bash / WSL / macOS / Linux) BEFORE closing the Shopify store.
# The cdn.shopify.com URLs die when the store is deactivated.
# Usage: bash download-images.sh   → saves originals into ./images/

mkdir -p images
cd images

# Branding
curl -L -o logo.png "https://www.batrounrace.com/cdn/shop/files/Untitled_design_1.png"

# Homepage hero
curl -L -o hero-race-crowd.jpg "https://www.batrounrace.com/cdn/shop/files/IMG-20250707-WA0052.jpg"

# About page / general race photos
curl -L -o start_line_2.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/start_line_2.jpg"
curl -L -o run_for_a_cause.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/Run_for_a_cause.jpg"
curl -L -o race_day.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/race_day.jpg"
curl -L -o finish_line.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/finish_line.jpg"
curl -L -o hang_loose.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/hang_loose.jpg"
curl -L -o podium.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/podium.jpg"

# Results 2025 — podium photos
curl -L -o podium_women_20_34.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/podium_women_age_20_34n.jpg"
curl -L -o podium_women_60_64.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/podium_women_60_64.jpg"
curl -L -o podium_man_55_59.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/podium_man_age_55_59.jpg"
curl -L -o podium_women_45_49.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/podium_women_age_45_49.jpg"
curl -L -o podium_women_17_19.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/podium_women_17_19.jpg"
curl -L -o podium_man_14_16.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/podium_man_14_16.jpg"
curl -L -o podium_women_14_16.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/podium_women_age_14_16.jpg"
curl -L -o podium_man_40_44.jpg "https://cdn.shopify.com/s/files/1/0770/7790/5662/files/podium_man_age_40_44.jpg"

echo ""
echo "Done. Check the images/ folder — you should have 16 files."
echo "STILL MISSING (loaded dynamically, not in static HTML):"
echo "  - Sponsor/partner LOGOS (logo wall + belt) — use your original logo files"
echo "  - Any images inside the theme sections not captured above"
echo "Tip: also check Shopify Admin > Content > Files and download everything there."
