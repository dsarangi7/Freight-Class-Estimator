# Freight Class Estimator

**Brand:** Freight Class Estimator · **Short name:** FreightClassEstimator · **Domain:** [freightclassestimator.com](https://freightclassestimator.com/)

Production Astro **static** site for **NMFC-style freight class** estimates from shipment **density** (lb/ft³), plus volume, multi-pallet totals, and optional educational DIM weight.

> Educational only. Density-scale estimate (Jul 2025 13-class) — not binding classification. Not NMFTA ClassIT+. Not a shipping quote. Stowability, handling, liability, and specific NMFC item can change class.

---

## Stack

- Astro (`output: 'static'`)
- Tailwind CSS **v4** (`@tailwindcss/vite`)
- TypeScript math: `src/lib/freightClass.ts` (single source of truth; client imports the same module)
- `@astrojs/sitemap`
- Design: `DESIGN.md` from `npx getdesign@latest add vercel`
- Skills: `web-design-guidelines`, `tailwind-4-docs` under `.agents/skills/`

---

## Local development

```bash
 cd /workspace/freightclassestimator
npm i
npm run test:golden   # must pass
npm run favicons      # regenerate fc mark + OG (optional)
npm run dev           # http://localhost:4321
```

Production preview:

```bash
npm run build && npm run preview
```

---

## Math

| Step | Formula |
|------|---------|
| Volume (ft³) | `(L_in × W_in × H_in) / 1728` |
| Density (lb/ft³) | `weight_lb / volume_ft3` (guard ÷0) |
| Multi-pallet MVP | **Sum** all volumes & weights → **one blended** density → **one** class (not per-pallet) |
| DIM weight (optional, educational) | `volume_ft3 × dim_factor` (UI default **250**; also try **194**) — not used for class |

### Density → class (effective 2025-07-19) — inclusive-lower / exclusive-upper

| Class | Density rule (implemented) | Table text |
|------:|----------------------------|------------|
| 50 | `d ≥ 50` | ≥50 |
| 55 | `35 ≤ d < 50` | 35–<50 |
| 60 | `30 ≤ d < 35` | 30–<35 |
| 65 | `22.5 ≤ d < 30` | 22.5–<30 |
| 70 | `15 ≤ d < 22.5` | 15–<22.5 |
| 85 | `12 ≤ d < 15` | 12–<15 |
| 92.5 | `10 ≤ d < 12` | 10–<12 |
| 100 | `8 ≤ d < 10` | 8–<10 |
| 125 | `6 ≤ d < 8` | 6–<8 |
| 175 | `4 ≤ d < 6` | 4–<6 |
| 250 | `2 ≤ d < 4` | 2–<4 |
| 300 | `1 ≤ d < 2` | 1–<2 |
| 400 | `d < 1` | <1 |

Every non-negative density maps to **exactly one** class. Invalid / NaN / negative → `null`.

### Golden example

**48 × 40 × 48 in @ 350 lb**

- Volume = `48×40×48/1728` ≈ **53.333 ft³**
- Density ≈ **6.5625 lb/ft³**
- **Class 125**

---

## Environment

Copy `.env.example`:

```bash
PUBLIC_SITE_URL=https://freightclassestimator.com
PUBLIC_GA4_ID=          # set only when ready, e.g. G-XXXXXXXXXX
```

- Canonical + OG + sitemap use `PUBLIC_SITE_URL` / `astro.config` `site`.
- GA4 script injects **only if** `PUBLIC_GA4_ID` is set.
- **No AdSense** / no `adsbygoogle`. Do not leave empty visible ad slots.

---

## Deploy — Cloudflare Pages (static Astro, NOT Workers)

### A) Dashboard

1. Connect repo to Cloudflare Pages.
2. Build: `npm run build` · Output: `dist` · Node **22+**.
3. Env: `PUBLIC_SITE_URL`, optional `PUBLIC_GA4_ID`.
4. Attach the custom domain `freightclassestimator.com`.

### B) Wrangler CLI (do not run unless asked)

```bash
npm run pages:deploy
# = npm run build && wrangler pages deploy dist --project-name=freightclassestimator
```

`public/_headers` sets security headers and `X-Robots-Tag: noindex` for `*.pages.dev`.

---

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Local Astro dev server |
| `npm run build` | Static build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run test:golden` | Density/class regression tests |
| `npm run favicons` | Regenerate icons + OG |
| `npm run pages:deploy` | Build + wrangler Pages deploy (**manual only**) |

---

## Disclaimers (product)

Estimate from **density only**. Stowability, handling, liability, and specific NMFC item can change class. Not NMFTA ClassIT+. Not a shipping quote. Educational only — density-scale estimate (Jul 2025 13-class).
