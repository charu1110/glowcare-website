# GlowCare — Skincare Landing Page

A modern, fully responsive one-page website for a clean-beauty brand.
Built with **plain HTML, CSS and vanilla JavaScript** — no frameworks, no build
step, no dependencies.

## Files

```
index.html    Page structure and content
style.css     All styling (design tokens, layout, responsive rules)
script.js     Product rendering, filters, cart, slider, form, scroll effects
```

## Run it locally

Just double-click `index.html` — that's it. Nothing to install.

## Deploy on Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, click **Add New → Project** and import the repo.
3. Framework Preset: **Other**. Leave Build Command and Output Directory empty.
4. Click **Deploy**.

Vercel serves `index.html` from the repository root. All asset paths are
relative, so the site works identically locally, on GitHub Pages and on Vercel.

## What's inside

- Sticky navbar with animated mobile menu and scroll-spy highlighting
- Hero with animated counters and floating product visual (inline SVG)
- Featured products rendered from a JS data array, with category filters
- Working cart drawer — add, change quantity, remove, live subtotal
- Why Choose Us, About, testimonial slider (autoplay + swipe), newsletter form
- Toast notifications, back-to-top button, scroll-reveal animations
- Respects `prefers-reduced-motion`, keyboard accessible, no console errors

All product imagery is generated as inline SVG, so there are no external image
files to break.

## APIs (Session 7) — Vercel serverless functions

| Endpoint | What it does |
|---|---|
| `GET /api/hello` | Proves the pipeline works |
| `GET /api/greet?name=Priya` | Reads a query parameter |
| `GET/POST /api/orders` | Reads / writes the Supabase `orders` table |
| `GET /api/weather?city=Ludhiana` | Live weather from OpenWeatherMap |
| `GET /api/food-suggest?region=Punjab&place=Ludhiana` | Weather-based food suggestions (homework) |

The page that uses them is `food.html`. To run locally: copy `.env.example` to
`.env.local`, fill in the keys, then `npm install` and `npm run dev`.
The full step-by-step setup is in `SETUP_GUIDE.md`; the endpoint spec is in `API_SPEC.md`.
