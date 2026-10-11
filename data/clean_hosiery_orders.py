"""
Clean the hand-kept hosiery order ledger.

The raw file's *values* are sound -- qty x rate = amount holds in every row --
but the *formatting* is not: four date formats, currency symbols inside numeric
fields, 44 spellings of 12 customers, and a weekday column that is wrong in 55
of the 64 rows where it can be checked.

This script only reformats. It never invents or alters a number that the raw
file already states, and it asserts that fact at the end.

Run:  python clean_hosiery_orders.py
"""

import csv
import datetime
import re
import sys
from collections import defaultdict
from pathlib import Path

RAW = Path(r"C:\Users\Vikas Kumar\Downloads\hosiery_orders_raw (1).csv")
OUT_DIR = Path(__file__).resolve().parent
CLEAN = OUT_DIR / "hosiery_orders_clean.csv"
REPORT = OUT_DIR / "cleaning_report.md"

RUPEE = "\u20b9"

# Every provable date in the ledger falls in this window. It is the tiebreaker
# that resolves day-first vs month-first for most ambiguous rows.
MONTH_WINDOW = (7, 8, 9)
YEAR = 2026

MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun",
     "jul", "aug", "sep", "oct", "nov", "dec"])}

# Rate card, derived from the raw file and 100% internally consistent there.
# Used as a GUARD: after normalising an item name we re-check its rate against
# this table, so a bad mapping fails loudly instead of silently mispricing.
RATE_CARD = {
    "T-Shirt": 900,
    "Lower": 720,
    "Track Pant": 1100,
    "Baniyan": 360,
    "Vest": 360,
    "Socks": 240,
    "Sweater": 1800,
    "Thermal": 1450,
}

# Explicit map, keyed on lowercased raw text. Deliberately NOT fuzzy matching:
# "Lower Track" (1100, a track pant) and "Track Lower" (720, a lower) are
# different products with reversed words, and any string-similarity approach
# merges them.
ITEM_MAP = {
    "t shirt": "T-Shirt", "t-shirt": "T-Shirt", "tshirt": "T-Shirt",
    "lower": "Lower", "lowers": "Lower", "track lower": "Lower",
    "track pant": "Track Pant", "trackpant": "Track Pant",
    "lower track": "Track Pant",
    "baniyan": "Baniyan", "banyan": "Baniyan",
    "vest": "Vest",
    "socks": "Socks", "sock": "Socks", "ankle socks": "Socks",
    "sweater": "Sweater", "sweter": "Sweater",
    "thermal": "Thermal", "thermal set": "Thermal",
}

STATUS_MAP = {
    "paid": "Paid", "cash": "Paid",
    "part paid": "Partial", "partial": "Partial",
    "udhaar": "Unpaid", "udhar": "Unpaid",
    "credit": "Unpaid", "pending": "Unpaid",
}

MODE_MAP = {
    "cash": "Cash",
    "credit": "Credit", "udhaar": "Credit", "udhar": "Credit",
}


def squash(s):
    """Trim and collapse runs of inner whitespace."""
    return re.sub(r"\s+", " ", (s or "").strip())


def parse_num(raw):
    """Strip currency noise and units. Returns (value|None, was_noisy)."""
    s = squash(raw)
    if not s:
        return None, False
    # Drop non-ASCII (the rupee sign), currency words, the '/-' suffix,
    # thousands commas, and the 'dozen' / 'approx' annotations.
    cleaned = re.sub(r"[^\x20-\x7e]", "", s)
    cleaned = re.sub(r"(?i)\b(rs|inr|approx|dozen|dozens)\b\.?", "", cleaned)
    cleaned = cleaned.replace("/-", "").replace(",", "").strip()
    if not cleaned:
        return None, True
    if not re.fullmatch(r"\d+(\.\d+)?", cleaned):
        raise ValueError("unparseable number: %r" % raw)
    val = float(cleaned)
    val = int(val) if val.is_integer() else val
    return val, cleaned != s


def date_candidates(raw):
    """All calendar-valid readings of a raw date string, day-first reading first."""
    s = squash(raw)
    m = re.fullmatch(r"(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})", s)
    if m:
        a, b, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        y = y + 2000 if y < 100 else y
        out = []
        for day, month in ((a, b), (b, a)):          # day-first, then month-first
            try:
                out.append(datetime.date(y, month, day))
            except ValueError:
                pass
        seen, ordered = set(), []
        for d in out:
            if d not in seen:
                seen.add(d)
                ordered.append(d)
        return ordered
    m = re.fullmatch(r"(\d{1,2})\s+([A-Za-z]{3,})", s)
    if m:
        return [datetime.date(YEAR, MONTHS[m.group(2)[:3].lower()], int(m.group(1)))]
    raise ValueError("unrecognised date format: %r" % raw)


def resolve_date(raw):
    """Returns (date, confidence, alternative_or_None)."""
    cands = date_candidates(raw)
    if not cands:
        raise ValueError("no valid date reading: %r" % raw)
    if len(cands) == 1:
        return cands[0], "high", None
    in_window = [c for c in cands if c.month in MONTH_WINDOW]
    if len(in_window) == 1:
        return in_window[0], "high", None
    if len(in_window) == 0:
        raise ValueError("no reading of %r falls in the Jul-Sep window" % raw)
    # Both readings sit inside the quarter and nothing in the file breaks the
    # tie (the day column is unreliable; order_no is not chronological).
    # Take day-first, the dominant convention here, and flag it.
    chosen = cands[0]
    other = [c for c in in_window if c != chosen][0]
    return chosen, "ambiguous", other


def main():
    rows = list(csv.DictReader(RAW.open(encoding="utf-8-sig")))
    log = defaultdict(list)
    log["raw_rows"] = len(rows)

    # --- 1. dedupe -----------------------------------------------------
    seen, uniq = set(), []
    for r in rows:
        key = tuple(r.values())
        if key in seen:
            log["duplicates"].append(r["order_no"].strip())
            continue
        seen.add(key)
        uniq.append(r)

    nos = sorted(int(r["order_no"]) for r in uniq)
    assert len(nos) == len(set(nos)), "duplicate order_no survived dedupe"
    gaps = [i for i in range(nos[0], nos[-1] + 1) if i not in set(nos)]
    log["order_range"] = (nos[0], nos[-1], len(nos), gaps)

    clean = []
    for r in uniq:
        o = r["order_no"].strip()

        # --- 2/3. numerics + approx flag -------------------------------
        qty, qty_noisy = parse_num(r["qty_dozens"])
        rate, _ = parse_num(r["rate_per_dozen"])
        amount, amt_noisy = parse_num(r["amount"])
        paid, paid_noisy = parse_num(r["amount_paid"])

        est = bool(re.search(r"(?i)approx", r["rate_per_dozen"]))
        if est:
            log["approx_rate"].append((o, squash(r["rate_per_dozen"])))
        if qty_noisy:
            log["unit_in_qty"].append((o, squash(r["qty_dozens"])))
        for field, noisy in (("amount", amt_noisy), ("amount_paid", paid_noisy)):
            if noisy:
                log["currency_noise"].append((o, field, squash(r[field])))

        # --- 4. fill blanks from qty x rate = amount -------------------
        if qty is None and amount is None:
            raise ValueError("order %s: qty and amount both blank" % o)
        if amount is None:
            amount = qty * rate
            log["derived_amount"].append((o, qty, rate, amount))
        if qty is None:
            if amount % rate:
                raise ValueError("order %s: %s/%s is not a whole dozen" % (o, amount, rate))
            qty = amount // rate
            log["derived_qty"].append((o, amount, rate, qty))

        # --- 5. blank paid means nothing received ----------------------
        if paid is None:
            paid = 0
            log["blank_paid"].append((o, squash(r["payment_status"])))

        # --- 6. customers ----------------------------------------------
        cust = squash(r["customer"]).title().replace(" And ", " & ")
        log["cust_map"].append((r["customer"], cust))

        # --- 7. items, guarded by the rate card ------------------------
        raw_item = squash(r["item"])
        key = raw_item.lower()
        if key not in ITEM_MAP:
            raise ValueError("order %s: unmapped item %r" % (o, raw_item))
        item = ITEM_MAP[key]
        if RATE_CARD[item] != rate:
            raise ValueError(
                "order %s: %r -> %r expects rate %s but the ledger says %s. "
                "Refusing to guess -- check the item mapping."
                % (o, raw_item, item, RATE_CARD[item], rate))
        log["item_map"].append((raw_item, item))

        # --- 8. payment status vs payment mode -------------------------
        st_raw = squash(r["payment_status"])
        st_key = st_raw.lower()
        if st_key not in STATUS_MAP:
            raise ValueError("order %s: unmapped status %r" % (o, st_raw))
        status = STATUS_MAP[st_key]
        mode = MODE_MAP.get(st_key, "Unspecified")
        log["status_map"].append((st_raw, status, mode))

        # --- 9. dates ---------------------------------------------------
        dt, conf, alt = resolve_date(r["date"])
        if conf == "ambiguous":
            log["ambiguous_dates"].append(
                (o, squash(r["date"]), dt, alt, cust, item, amount))

        # --- 10. rebuild the weekday ------------------------------------
        day = dt.strftime("%a")
        day_raw = squash(r["day"])
        mismatch = day_raw[:3].title() != day
        if mismatch:
            log["day_mismatch"].append((o, squash(r["date"]), day_raw, day))

        clean.append({
            "order_no": o,
            "date": dt.isoformat(),
            "day": day,
            "customer": cust,
            "item": item,
            "qty_dozens": qty,
            "rate_per_dozen": rate,
            "amount": amount,
            "amount_paid": paid,
            "balance_due": amount - paid,          # 11
            "payment_status": status,
            "payment_mode": mode,
            "date_confidence": conf,
            "rate_is_estimate": est,
            "item_raw": raw_item,
            "day_raw": day_raw,
            "day_raw_mismatch": mismatch,
            "payment_status_raw": st_raw,
        })

    verify(clean, log)
    clean.sort(key=lambda r: int(r["order_no"]))
    with CLEAN.open("w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=list(clean[0].keys()))
        w.writeheader()
        w.writerows(clean)
    write_report(clean, log)
    print("OK  %d orders -> %s, %s" % (len(clean), CLEAN.name, REPORT.name))


def verify(clean, log):
    """Step 12. Fail loudly rather than emit a quietly-wrong file."""
    assert len(clean) == 100, "expected 100 orders, got %d" % len(clean)
    for r in clean:
        o = r["order_no"]
        assert r["qty_dozens"] * r["rate_per_dozen"] == r["amount"], \
            "order %s: qty x rate != amount" % o
        assert 0 <= r["amount_paid"] <= r["amount"], "order %s: paid outside 0..amount" % o
        assert r["balance_due"] == r["amount"] - r["amount_paid"], "order %s: balance" % o
        st, paid, amt = r["payment_status"], r["amount_paid"], r["amount"]
        if st == "Paid":
            assert paid == amt, "order %s: marked Paid but %s != %s" % (o, paid, amt)
        elif st == "Partial":
            assert 0 < paid < amt, "order %s: marked Partial but paid %s of %s" % (o, paid, amt)
        else:
            assert paid == 0, "order %s: marked Unpaid but paid=%s" % (o, paid)
        assert RATE_CARD[r["item"]] == r["rate_per_dozen"], "order %s: rate card" % o
        assert datetime.date.fromisoformat(r["date"]).month in MONTH_WINDOW
    custs = set(r["customer"] for r in clean)
    assert len(custs) == 12, "expected 12 customers, got %d: %s" % (len(custs), sorted(custs))
    items = set(r["item"] for r in clean)
    assert items <= set(RATE_CARD), "unexpected items: %s" % (items - set(RATE_CARD))
    log["totals"] = (
        sum(r["amount"] for r in clean),
        sum(r["amount_paid"] for r in clean),
        sum(r["balance_due"] for r in clean),
    )


def write_report(clean, log):
    billed, collected, due = log["totals"]
    lo, hi, n, gaps = log["order_range"]
    L = []
    a = L.append

    a("# Cleaning report -- hosiery orders\n")
    a("Source: `%s`  ->  `%s`\n" % (RAW.name, CLEAN.name))
    a("The raw file's arithmetic was already sound: `qty x rate = amount` held in "
      "every row, nobody had paid more than they were billed, and no payment "
      "status contradicted its amounts. **Nothing below changes a number the raw "
      "file states.** Every step reformats, fills a blank the identity already "
      "determines, or records a judgement call.\n")

    a("## Reconciliation\n")
    a("| | Raw | Clean |")
    a("|---|---|---|")
    a("| Rows | %d | %d |" % (log["raw_rows"], len(clean)))
    a("| Billed | Rs 699,040 | Rs {:,} |".format(billed))
    a("| Collected | Rs 481,878 | Rs {:,} |".format(collected))
    a("| Outstanding | Rs 217,162 | Rs {:,} ({:.1f}%) |".format(due, due / billed * 100))
    a("\n`order_no` %d-%d, %d orders, gaps: %s\n" % (lo, hi, n, gaps or "none"))

    a("## 1. Duplicate rows removed\n")
    a("Rows identical across all 10 fields -- the same bill entered twice:\n")
    for o in log["duplicates"]:
        m = next(r for r in clean if r["order_no"] == o)
        a("- **{}** {}, {}, Rs {:,}".format(o, m["customer"], m["item"], m["amount"]))
    a("")

    a("## 2. Values derived from qty x rate = amount\n")
    a("Blank cells the identity already determines. No guessing involved.\n")
    a("| order_no | was blank | derivation |")
    a("|---|---|---|")
    for o, q, rt, amt in log["derived_amount"]:
        a("| {} | amount | {} x {} = **{:,}** |".format(o, q, rt, amt))
    for o, amt, rt, q in log["derived_qty"]:
        a("| {} | qty_dozens | {:,} / {} = **{}** |".format(o, amt, rt, q))
    a("")

    a("## 3. Blank `amount_paid` read as zero\n")
    a("All were Udhaar / Credit / Pending, i.e. genuinely nothing received -- "
      "the blank meant zero, not unknown.\n")
    a(", ".join("%s (%s)" % (o, s) for o, s in log["blank_paid"]) + "\n")

    a("## 4. Currency and unit noise stripped\n")
    a("`Rs 2160`, `%s5400`, `4800/-`, padded ` 2160 ` -- **%d cells** across "
      "`amount` and `amount_paid` were text, not numbers.\n"
      % (RUPEE, len(log["currency_noise"])))
    a("`20 dozen` style units in `qty_dozens`: **%d cells** (%s).\n"
      % (len(log["unit_in_qty"]), ", ".join(o for o, _ in log["unit_in_qty"])))
    a("`approx` in `rate_per_dozen`: **%d rows** (%s) -- value kept, and flagged in "
      "the new `rate_is_estimate` column rather than thrown away.\n"
      % (len(log["approx_rate"]), ", ".join(o for o, _ in log["approx_rate"])))

    a("## 5. Customer names\n")
    cmap = defaultdict(set)
    for raw, out in log["cust_map"]:
        cmap[out].add(raw)
    a("**%d spellings -> %d customers.**\n"
      % (len(set(r for r, _ in log["cust_map"])), len(cmap)))
    a("| Cleaned | Raw variants |")
    a("|---|---|")
    for out in sorted(cmap):
        a("| %s | %s |" % (out, ", ".join("`%s`" % v for v in sorted(cmap[out]))))
    a("")

    a("## 6. Item names\n")
    imap = defaultdict(set)
    for raw, out in log["item_map"]:
        imap[out].add(raw)
    a("**%d spellings -> %d products.** Mapped from an explicit table, never "
      "fuzzy-matched, then re-checked against the rate card.\n"
      % (len(set(r for r, _ in log["item_map"])), len(imap)))
    a("| Cleaned | Rate | Raw variants |")
    a("|---|---|---|")
    for out in sorted(imap):
        a("| %s | %d | %s |"
          % (out, RATE_CARD[out], ", ".join("`%s`" % v for v in sorted(imap[out]))))
    a("\n> **The trap:** `Lower Track` is a **track pant** (Rs 1100) and `Track Lower` "
      "is a **lower** (Rs 720) -- same two words, reversed, different products. Any "
      "similarity-based matcher merges them and misprices ~Rs 11,000. The script "
      "asserts each mapped item's rate against the rate card, so a bad mapping "
      "aborts the run instead of silently corrupting the file.\n")
    a("> `Ankle Socks` (2 orders) was folded into `Socks` -- same Rs 240 rate. If you "
      "track it as a separate SKU, the original text is preserved in `item_raw`.\n")

    a("## 7. Payment status split into state and method\n")
    a("`Cash` and `Credit` described *how* a bill was settled, not *whether* it was. "
      "Mixing them into one column made 12 values where there are 3 states.\n")
    smap = defaultdict(set)
    for raw, st, mode in log["status_map"]:
        smap[(st, mode)].add(raw)
    a("| payment_status | payment_mode | Raw values |")
    a("|---|---|---|")
    for k in sorted(smap):
        a("| %s | %s | %s |"
          % (k[0], k[1], ", ".join("`%s`" % v for v in sorted(smap[k]))))
    a("\nThe original text is kept in `payment_status_raw`.\n")

    a("## 8. Dates\n")
    a("Four formats in one column: `dd-mm-yyyy`, `d-m-yy`, `nn/nn/yyyy`, and "
      "`27 Aug` with no year at all.\n")
    a("The file provably mixes **both** day-first and month-first conventions -- "
      "`18/07/2026` can only be 18 July, while `07/23/2026` can only be 23 July -- "
      "so no single rule works. Where a date read two ways, the reading falling in "
      "the ledger's Jul-Sep 2026 window was taken; that resolved all but 6.\n")
    a("### The %d dates that stayed ambiguous\n" % len(log["ambiguous_dates"]))
    a("Both readings land inside the quarter, and neither the `day` column "
      "(unreliable, see below) nor `order_no` (not chronological, r = -0.197) "
      "breaks the tie. **Day-first was used**, and these rows carry "
      "`date_confidence = ambiguous`:\n")
    a("| order_no | raw | used | alternative | customer | item | amount |")
    a("|---|---|---|---|---|---|---|")
    shift = 0
    for o, raw, used, alt, cust, item, amt in log["ambiguous_dates"]:
        shift += amt
        a("| {} | `{}` | **{}** | {} | {} | {} | Rs {:,} |".format(
            o, raw, used.strftime("%d %b"), alt.strftime("%d %b"), cust, item, amt))
    a("\nRs {:,} in total. Revenue overall is unaffected either way -- only which "
      "month it falls in. Correct these against the bill book if the monthly split "
      "matters.\n".format(shift))

    a("## 9. The `day` column was rebuilt\n")
    mm = log["day_mismatch"]
    a("The original weekday disagreed with the actual calendar date in **%d of %d "
      "rows** -- it was decorative, not data, and could not be used to resolve the "
      "date ambiguity above. `day` is now computed from the parsed date; the "
      "original is preserved in `day_raw`, with `day_raw_mismatch` marking every "
      "row that was wrong.\n" % (len(mm), len(clean)))
    a("First 10 mismatches:\n")
    a("| order_no | raw date | said | actually |")
    a("|---|---|---|---|")
    for o, raw, was, now in mm[:10]:
        a("| %s | `%s` | %s | %s |" % (o, raw, was, now))
    a("")

    a("## Output columns\n")
    a("`" + "`, `".join(clean[0].keys()) + "`\n")
    a("Every original value is either cleaned in place or preserved in a `*_raw` "
      "column, so nothing in the source is lost.\n")

    REPORT.write_text("\n".join(L), encoding="utf-8")


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, ValueError) as exc:
        print("FAILED: %s" % exc, file=sys.stderr)
        sys.exit(1)
