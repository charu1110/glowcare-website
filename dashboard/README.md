# Hosiery Order Book — dashboard

A static HTML/CSS/JS dashboard over one quarter of wholesale hosiery trade
(100 bills, 12 buyers, 8 product lines, 2 Jul – 27 Sep 2026).

No build step, no framework, no dependencies. Open it and it works.

## Run it

Any static server will do:

```bash
python -m http.server 8130 --directory dashboard
```

Then open <http://localhost:8130>.

Opening `index.html` directly from the filesystem also works, since the data is
loaded as a plain script rather than by `fetch`.

## Files

| File | Role |
|---|---|
| `index.html` | Structure only — every figure is filled in at runtime |
| `css/styles.css` | All styling. Numbered sections, tokens at the top |
| `js/data.js` | The 100 cleaned bills as `window.ORDERS` — generated, not hand-edited |
| `js/dashboard.js` | Aggregation, charts, table, navigation, theme toggle |

## Refreshing the data

`js/data.js` is generated from the cleaned CSV. After re-running the cleaner
(`../data/clean_hosiery_orders.py`), regenerate it:

```bash
python -c "from pathlib import Path; Path('dashboard/js/data.js').write_text('window.ORDERS = ' + Path('data/orders.json').read_text(encoding='utf-8') + ';\n', encoding='utf-8')"
```

Nothing in `index.html` needs touching — the KPIs, ageing buckets, product and
buyer rankings, and the table all recompute from whatever `ORDERS` contains.

## How the numbers are produced

Every figure on the page is derived in the browser from the same 100 records, so
the dashboard cannot drift from its source. Totals reconcile exactly to the raw
ledger: **₹6,99,040 billed, ₹4,81,878 collected, ₹2,17,162 outstanding**.

Receivables ageing is measured against a fixed **10 September 2026** (`TODAY` in
`dashboard.js`). Change that constant if you re-date the analysis. Eleven bills
are dated after that point; they are held out of the ageing buckets as "not yet
due" rather than counted as current.

## Notes on the build

- **Colour** — the two data colours (blue `#2a78d6` collected, orange `#eb6834`
  outstanding) were checked for colour-vision deficiency against both the light
  and dark surfaces. Red / amber / green appear only as *status*, never as a
  data series.
- **Themes** — light and dark are both defined at token level. The page follows
  the OS by default; the toggle in the top bar overrides it and remembers the
  choice in `localStorage`.
- **Accessibility** — skip link, visible focus rings, `aria-expanded` on the
  mobile nav, real `<th scope>` headers, and `prefers-reduced-motion` honoured.
- **Print** — sidebar and controls drop out; cards avoid breaking across pages.
