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
