# OpenCode / local agent handoff — Freight Class Estimator

Static Astro site: **density → NMFTA Jul 2025 13-class freight class ESTIMATE** (+ volume, density, optional educational DIM). Not ClassIT+ / not a rate quote.

## Hard rules (Dwight-cleared)
1. Inclusive lower bounds: ≥50→50 … ≥1→300, <1→400
2. Inches: volume_ft³ = L×W×H / 1728; density = lb / ft³
3. Multi-pallet MVP: **sum weights & volumes**, then one density (blended) — labeled as such
4. Never claim accurate NMFC / ClassIT+ / carrier rates
5. Keep golden tests green: `npm run test:golden` (48×40×48@350 → class 125)

## Stack
Astro static, Tailwind 4, CF Pages scripts, no AdSense. GA4 via env when ready.

## Local
```bash
 cd freightclassestimator
npm i
npm run test:golden
npm run dev
npm run build && npm run preview
```

## Deploy
Cloudflare **Pages** (not Workers). `npm run pages:deploy` after wrangler login. `_headers` noindexes *.pages.dev.

## Competitors (context)
inchcalculator.com/freight-class-calculator — education + table
freightrate.com/freight-class-calculator — lead-gen fancy

## Next for agent
Domain, GA4, CF Pages + custom domain, GSC/Bing; optional soft quote CTA later.
