# Cleaning report -- hosiery orders

Source: `hosiery_orders_raw (1).csv`  ->  `hosiery_orders_clean.csv`

The raw file's arithmetic was already sound: `qty x rate = amount` held in every row, nobody had paid more than they were billed, and no payment status contradicted its amounts. **Nothing below changes a number the raw file states.** Every step reformats, fills a blank the identity already determines, or records a judgement call.

## Reconciliation

| | Raw | Clean |
|---|---|---|
| Rows | 102 | 100 |
| Billed | Rs 699,040 | Rs 699,040 |
| Collected | Rs 481,878 | Rs 481,878 |
| Outstanding | Rs 217,162 | Rs 217,162 (31.1%) |

`order_no` 1001-1100, 100 orders, gaps: none

## 1. Duplicate rows removed

Rows identical across all 10 fields -- the same bill entered twice:

- **1011** Lucky Traders, T-Shirt, Rs 5,400
- **1042** Lucky Traders, T-Shirt, Rs 13,500

## 2. Values derived from qty x rate = amount

Blank cells the identity already determines. No guessing involved.

| order_no | was blank | derivation |
|---|---|---|
| 1005 | amount | 3 x 240 = **720** |
| 1026 | amount | 12 x 360 = **4,320** |
| 1034 | amount | 15 x 720 = **10,800** |
| 1042 | amount | 15 x 900 = **13,500** |
| 1053 | amount | 20 x 360 = **7,200** |
| 1058 | amount | 6 x 240 = **1,440** |
| 1063 | amount | 15 x 360 = **5,400** |
| 1066 | amount | 8 x 1100 = **8,800** |
| 1071 | amount | 12 x 900 = **10,800** |
| 1020 | qty_dozens | 14,500 / 1450 = **10** |
| 1030 | qty_dozens | 8,800 / 1100 = **8** |
| 1031 | qty_dozens | 9,000 / 1800 = **5** |
| 1035 | qty_dozens | 3,600 / 720 = **5** |
| 1081 | qty_dozens | 18,000 / 900 = **20** |
| 1087 | qty_dozens | 3,600 / 900 = **4** |

## 3. Blank `amount_paid` read as zero

All were Udhaar / Credit / Pending, i.e. genuinely nothing received -- the blank meant zero, not unknown.

1017 (Udhaar), 1053 (Udhaar), 1066 (UDHAR), 1082 (udhaar), 1083 (Udhaar), 1085 (UDHAR), 1086 (Credit), 1088 (Pending), 1097 (udhaar), 1098 (udhaar)

## 4. Currency and unit noise stripped

`Rs 2160`, `₹5400`, `4800/-`, padded ` 2160 ` -- **62 cells** across `amount` and `amount_paid` were text, not numbers.

`20 dozen` style units in `qty_dozens`: **8 cells** (1007, 1008, 1015, 1037, 1040, 1047, 1052, 1096).

`approx` in `rate_per_dozen`: **3 rows** (1003, 1039, 1086) -- value kept, and flagged in the new `rate_is_estimate` column rather than thrown away.

## 5. Customer names

**44 spellings -> 12 customers.**

| Cleaned | Raw variants |
|---|---|
| Arora Collection | ` Arora Collection`, `ARORA COLLECTION`, `Arora Collection`, `arora collection` |
| Bhalla Knitwear | `Bhalla Knitwear`, `bhalla knitwear` |
| Deep Hosiery | ` Deep Hosiery`, `DEEP HOSIERY`, `Deep Hosiery`, `deep hosiery` |
| Guru Nanak Hosiery | ` Guru Nanak Hosiery`, `Guru Nanak Hosiery`, `guru nanak hosiery` |
| Kapoor & Sons | ` Kapoor & Sons`, `KAPOOR & SONS`, `Kapoor & Sons`, `Kapoor & Sons `, `kapoor & sons` |
| Lucky Traders | ` Lucky Traders`, `Lucky Traders`, `Lucky Traders ` |
| Maa Durga Garments | ` Maa Durga Garments`, `Maa Durga Garments`, `Maa Durga Garments `, `maa durga garments` |
| New Punjab Cloth House | ` New Punjab Cloth House`, `NEW PUNJAB CLOTH HOUSE`, `New Punjab Cloth House`, `New Punjab Cloth House ` |
| Sharma Traders | ` Sharma Traders`, `SHARMA TRADERS`, `Sharma Traders`, `sharma traders` |
| Singla Textiles | `Singla Textiles`, `Singla Textiles `, `singla textiles` |
| Star Woollens | ` Star Woollens`, `STAR WOOLLENS`, `Star Woollens`, `Star Woollens `, `star woollens` |
| Verma Garments | `VERMA GARMENTS`, `Verma Garments`, `verma garments` |

## 6. Item names

**26 spellings -> 8 products.** Mapped from an explicit table, never fuzzy-matched, then re-checked against the rate card.

| Cleaned | Rate | Raw variants |
|---|---|---|
| Baniyan | 360 | `Baniyan`, `Banyan` |
| Lower | 720 | `Lower`, `Lowers`, `Track Lower`, `lower` |
| Socks | 240 | `Ankle Socks`, `Sock`, `Socks`, `socks` |
| Sweater | 1800 | `Sweater`, `Sweter`, `sweater` |
| T-Shirt | 900 | `T Shirt`, `T-Shirt`, `Tshirt`, `t-shirt` |
| Thermal | 1450 | `Thermal`, `Thermal Set`, `thermal` |
| Track Pant | 1100 | `Lower Track`, `Track Pant`, `Trackpant`, `track pant` |
| Vest | 360 | `Vest`, `vest` |

> **The trap:** `Lower Track` is a **track pant** (Rs 1100) and `Track Lower` is a **lower** (Rs 720) -- same two words, reversed, different products. Any similarity-based matcher merges them and misprices ~Rs 11,000. The script asserts each mapped item's rate against the rate card, so a bad mapping aborts the run instead of silently corrupting the file.

> `Ankle Socks` (2 orders) was folded into `Socks` -- same Rs 240 rate. If you track it as a separate SKU, the original text is preserved in `item_raw`.

## 7. Payment status split into state and method

`Cash` and `Credit` described *how* a bill was settled, not *whether* it was. Mixing them into one column made 12 values where there are 3 states.

| payment_status | payment_mode | Raw values |
|---|---|---|
| Paid | Cash | `Cash` |
| Paid | Unspecified | `PAID`, `Paid`, `paid` |
| Partial | Unspecified | `Part Paid`, `Partial`, `part paid` |
| Unpaid | Credit | `Credit`, `UDHAR`, `Udhaar`, `udhaar` |
| Unpaid | Unspecified | `Pending` |

The original text is kept in `payment_status_raw`.

## 8. Dates

Four formats in one column: `dd-mm-yyyy`, `d-m-yy`, `nn/nn/yyyy`, and `27 Aug` with no year at all.

The file provably mixes **both** day-first and month-first conventions -- `18/07/2026` can only be 18 July, while `07/23/2026` can only be 23 July -- so no single rule works. Where a date read two ways, the reading falling in the ledger's Jul-Sep 2026 window was taken; that resolved all but 6.

### The 6 dates that stayed ambiguous

Both readings land inside the quarter, and neither the `day` column (unreliable, see below) nor `order_no` (not chronological, r = -0.197) breaks the tie. **Day-first was used**, and these rows carry `date_confidence = ambiguous`:

| order_no | raw | used | alternative | customer | item | amount |
|---|---|---|---|---|---|---|
| 1024 | `9-7-26` | **09 Jul** | 07 Sep | Kapoor & Sons | Baniyan | Rs 1,440 |
| 1025 | `08-07-2026` | **08 Jul** | 07 Aug | Deep Hosiery | Socks | Rs 2,400 |
| 1030 | `09/08/2026` | **09 Aug** | 08 Sep | Arora Collection | Track Pant | Rs 8,800 |
| 1086 | `08/07/2026` | **08 Jul** | 07 Aug | Sharma Traders | Vest | Rs 2,160 |
| 1090 | `7-8-26` | **07 Aug** | 08 Jul | New Punjab Cloth House | Baniyan | Rs 1,080 |
| 1094 | `7-8-26` | **07 Aug** | 08 Jul | Verma Garments | T-Shirt | Rs 3,600 |

Rs 19,480 in total. Revenue overall is unaffected either way -- only which month it falls in. Correct these against the bill book if the monthly split matters.

## 9. The `day` column was rebuilt

The original weekday disagreed with the actual calendar date in **83 of 100 rows** -- it was decorative, not data, and could not be used to resolve the date ambiguity above. `day` is now computed from the parsed date; the original is preserved in `day_raw`, with `day_raw_mismatch` marking every row that was wrong.

First 10 mismatches:

| order_no | raw date | said | actually |
|---|---|---|---|
| 1002 | `26-09-2026` | Wed | Sat |
| 1004 | `18/07/2026` | Fri | Sat |
| 1005 | `27 Aug` | Mon | Thu |
| 1006 | `01/09/2026` | Wed | Tue |
| 1008 | `16-07-2026` | Fri | Thu |
| 1009 | `16 Sep` | Tue | Wed |
| 1010 | `23/09/2026` | Sat | Wed |
| 1011 | `28 Aug` | Sun | Fri |
| 1013 | `07/23/2026` | Fri | Thu |
| 1014 | `25-08-2026` | Thu | Tue |

## Output columns

`order_no`, `date`, `day`, `customer`, `item`, `qty_dozens`, `rate_per_dozen`, `amount`, `amount_paid`, `balance_due`, `payment_status`, `payment_mode`, `date_confidence`, `rate_is_estimate`, `item_raw`, `day_raw`, `day_raw_mismatch`, `payment_status_raw`

Every original value is either cleaned in place or preserved in a `*_raw` column, so nothing in the source is lost.
