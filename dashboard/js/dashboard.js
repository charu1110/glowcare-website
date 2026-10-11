/* ============================================================
   Hosiery Order Book — dashboard behaviour
   Reads window.ORDERS (js/data.js) and renders every figure on
   the page. Nothing is hard-coded in the markup, so replacing
   data.js with a fresh export updates the whole dashboard.
   ============================================================ */
(function () {
  "use strict";

  var ORDERS = window.ORDERS || [];
  var TODAY = new Date("2026-09-10T00:00:00");
  var MONTH_NAMES = { "07": "July", "08": "August", "09": "September" };

  /* ---------- formatting ---------- */

  /* Indian digit grouping: 2,17,162 — not 217,162 */
  function inr(n) {
    return "₹" + Math.round(n).toLocaleString("en-IN");
  }
  function pct(part, whole) {
    return whole ? (part / whole * 100).toFixed(1) + "%" : "—";
  }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ---------- aggregation ---------- */
  function group(keyFn) {
    var map = new Map();
    ORDERS.forEach(function (o) {
      var k = keyFn(o);
      var g = map.get(k);
      if (!g) { g = { key: k, bills: 0, amt: 0, paid: 0, due: 0, qty: 0 }; map.set(k, g); }
      g.bills++; g.amt += o.amt; g.paid += o.paid; g.due += o.due; g.qty += o.qty;
    });
    return Array.from(map.values());
  }

  var TOTAL = ORDERS.reduce(function (t, o) {
    t.amt += o.amt; t.paid += o.paid; t.due += o.due; t.qty += o.qty;
    return t;
  }, { amt: 0, paid: 0, due: 0, qty: 0 });

  var byStatus = { Paid: 0, Partial: 0, Unpaid: 0 };
  ORDERS.forEach(function (o) { byStatus[o.st]++; });

  /* ---------- tooltip ---------- */
  var tip = document.getElementById("tooltip");

  function attachTip(node, title, rows) {
    function place(e) {
      var pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
      var x = e.clientX + pad, y = e.clientY + pad;
      if (x + w > window.innerWidth - 8) x = e.clientX - w - pad;
      if (y + h > window.innerHeight - 8) y = e.clientY - h - pad;
      tip.style.left = x + "px";
      tip.style.top = y + "px";
    }
    node.addEventListener("mouseenter", function (e) {
      tip.innerHTML = '<div class="tt-title">' + title + "</div>" +
        rows.map(function (r) { return '<div class="tt-row">' + r + "</div>"; }).join("");
      tip.classList.add("is-on");
      place(e);
    });
    node.addEventListener("mousemove", place);
    node.addEventListener("mouseleave", function () { tip.classList.remove("is-on"); });
  }

  /* ---------- KPIs & sidebar ---------- */
  function renderKpis() {
    document.getElementById("kBilled").textContent = inr(TOTAL.amt);
    document.getElementById("kBilledSub").textContent =
      TOTAL.qty + " dozen across " + ORDERS.length + " bills";

    document.getElementById("kColl").textContent = inr(TOTAL.paid);
    document.getElementById("kCollSub").textContent = byStatus.Paid + " bills settled in full";

    document.getElementById("kDue").textContent = inr(TOTAL.due);
    document.getElementById("kDueSub").textContent =
      (byStatus.Partial + byStatus.Unpaid) + " bills part-paid or on udhaar";

    document.getElementById("kRate").textContent = pct(TOTAL.paid, TOTAL.amt);

    document.getElementById("sideDue").textContent = inr(TOTAL.due);
    document.getElementById("sideBilled").textContent = inr(TOTAL.amt);
    document.getElementById("sideMeter").style.width = (TOTAL.paid / TOTAL.amt * 100) + "%";
  }

  /* ---------- monthly ---------- */
  var months = group(function (o) { return o.date.slice(5, 7); })
    .sort(function (a, b) { return a.key < b.key ? -1 : 1; });

  function renderInversion() {
    var ranked = months.slice().sort(function (a, b) {
      return (a.paid / a.amt) - (b.paid / b.amt);
    });
    var worst = ranked[0].key, best = ranked[ranked.length - 1].key;
    var host = document.getElementById("inversion");

    months.forEach(function (m) {
      var cls = "inv-cell" + (m.key === worst ? " is-worst" : m.key === best ? " is-best" : "");
      var label = MONTH_NAMES[m.key] +
        (m.key === months[0].key ? " · oldest" : m.key === months[months.length - 1].key ? " · newest" : "");
      host.appendChild(el("div", cls,
        '<span class="inv-month">' + label + "</span>" +
        '<span class="inv-rate">' + pct(m.paid, m.amt) + "</span>" +
        '<span class="inv-note">' + m.bills + " bills · " + inr(m.due) + " still due</span>"
      ));
    });
  }

  function renderMonthly() {
    var host = document.getElementById("monthly");
    var max = Math.max.apply(null, months.map(function (m) { return m.amt; }));
    var PLOT = 188;

    months.forEach(function (m) {
      var h = m.amt / max * PLOT;
      var paidH = m.paid / m.amt * h;
      var dueH = h - paidH;
      var rate = m.paid / m.amt;

      var col = el("div", "col");
      var stack = el("div", "col-stack");
      stack.style.height = h + "px";

      if (dueH > 1) {
        var dueBar = el("div", "col-bar is-top");
        dueBar.style.height = dueH + "px";
        dueBar.style.background = "var(--outstanding)";
        attachTip(dueBar, MONTH_NAMES[m.key] + " — outstanding",
          [inr(m.due) + "  of  " + inr(m.amt), m.bills + " bills · " + pct(m.paid, m.amt) + " collected"]);
        stack.appendChild(dueBar);
      }

      var paidBar = el("div", "col-bar " + (dueH > 1 ? "is-bot" : "is-only"));
      paidBar.style.height = paidH + "px";
      paidBar.style.background = "var(--collected)";
      attachTip(paidBar, MONTH_NAMES[m.key] + " — collected",
        [inr(m.paid) + "  of  " + inr(m.amt), m.bills + " bills · " + pct(m.paid, m.amt) + " collected"]);
      stack.appendChild(paidBar);

      col.appendChild(stack);
      col.appendChild(el("div", "col-foot",
        '<span class="col-name">' + MONTH_NAMES[m.key] + "</span>" +
        '<span class="col-val">' + inr(m.amt) + " · " + m.bills + " bills</span>" +
        '<span class="col-pct ' + (rate < 0.6 ? "is-bad" : "is-good") + '">' + pct(m.paid, m.amt) + " collected</span>"
      ));
      host.appendChild(col);
    });
  }

  /* ---------- ageing ---------- */
  function buildAgeing() {
    var buckets = [
      { key: "0–30 days", max: 30, bills: 0, value: 0, colour: "var(--age-1)" },
      { key: "31–60 days", max: 60, bills: 0, value: 0, colour: "var(--age-2)" },
      { key: "61–90 days", max: 90, bills: 0, value: 0, colour: "var(--age-3)" }
    ];
    var future = { bills: 0, value: 0 };

    ORDERS.forEach(function (o) {
      if (o.due <= 0) return;
      var days = Math.round((TODAY - new Date(o.date + "T00:00:00")) / 86400000);
      if (days < 0) { future.bills++; future.value += o.due; return; }
      for (var i = 0; i < buckets.length; i++) {
        if (days <= buckets[i].max) { buckets[i].bills++; buckets[i].value += o.due; return; }
      }
    });
    return { buckets: buckets, future: future };
  }

  function renderAgeing() {
    var data = buildAgeing();
    var host = document.getElementById("ageing");
    var max = Math.max.apply(null, data.buckets.map(function (b) { return b.value; }));
    var total = data.buckets.reduce(function (s, b) { return s + b.value; }, 0);

    data.buckets.forEach(function (b) {
      var row = el("div", "bar-row");
      row.appendChild(el("div", "bar-head",
        '<span class="bar-name">' + b.key + "</span>" +
        '<span class="bar-total">' + inr(b.value) + " · " + Math.round(b.value / total * 100) + "%</span>"
      ));
      var track = el("div", "bar-track");
      var seg = el("div", "bar-seg");
      seg.style.width = (b.value / max * 100) + "%";
      seg.style.background = b.colour;
      attachTip(seg, b.key + " overdue",
        [inr(b.value) + " across " + b.bills + " bills", (b.value / total * 100).toFixed(1) + "% of aged debt"]);
      track.appendChild(seg);
      row.appendChild(track);
      row.appendChild(el("div", "bar-note", b.bills + " bills"));
      host.appendChild(row);
    });
  }

  /* ---------- status breakdown ---------- */
  function renderStatuses() {
    var host = document.getElementById("statuses");
    var defs = [
      { key: "Paid", colour: "var(--good)" },
      { key: "Partial", colour: "var(--warning)" },
      { key: "Unpaid", colour: "var(--critical)" }
    ];
    var rows = group(function (o) { return o.st; });

    defs.forEach(function (d) {
      var g = rows.filter(function (r) { return r.key === d.key; })[0];
      if (!g) return;
      var row = el("div", "st-row");
      row.appendChild(el("div", "st-name",
        '<i class="dot" style="background:' + d.colour + '"></i>' + d.key + " · " + g.bills + " bills"));
      row.appendChild(el("div", "st-figs", inr(g.amt) + " billed · " + inr(g.due) + " due"));
      var track = el("div", "st-track");
      var fill = el("div", "st-fill");
      fill.style.width = (g.amt / TOTAL.amt * 100) + "%";
      fill.style.background = d.colour;
      track.appendChild(fill);
      row.appendChild(track);
      host.appendChild(row);
    });
  }

  /* ---------- split bar lists (products, buyers) ---------- */
  function renderSplitList(hostId, data, noteFn) {
    var host = document.getElementById(hostId);
    var max = Math.max.apply(null, data.map(function (d) { return d.amt; }));

    data.forEach(function (d) {
      var row = el("div", "bar-row");
      row.appendChild(el("div", "bar-head",
        '<span class="bar-name">' + d.key + "</span>" +
        '<span class="bar-total">' + inr(d.amt) + "</span>"
      ));

      var track = el("div", "bar-track");
      track.style.width = (d.amt / max * 100) + "%";

      var paidSeg = el("div", "bar-seg");
      paidSeg.style.flex = String(d.paid);
      paidSeg.style.background = "var(--collected)";
      attachTip(paidSeg, d.key + " — collected",
        [inr(d.paid) + "  of  " + inr(d.amt),
         d.bills + " bills · " + d.qty + " dozen · " + pct(d.paid, d.amt) + " collected"]);
      track.appendChild(paidSeg);

      if (d.due > 0) {
        var dueSeg = el("div", "bar-seg");
        dueSeg.style.flex = String(d.due);
        dueSeg.style.background = "var(--outstanding)";
        attachTip(dueSeg, d.key + " — outstanding",
          [inr(d.due) + "  of  " + inr(d.amt),
           d.bills + " bills · " + d.qty + " dozen · " + pct(d.paid, d.amt) + " collected"]);
        track.appendChild(dueSeg);
      }

      row.appendChild(track);
      row.appendChild(el("div", "bar-note", noteFn(d)));
      host.appendChild(row);
    });
  }

  /* ---------- data table ---------- */
  var tbody = document.getElementById("tbody");
  var tally = document.getElementById("tally");
  var empty = document.getElementById("empty");
  var inputs = {
    q: document.getElementById("q"),
    cust: document.getElementById("fc"),
    item: document.getElementById("fi"),
    st: document.getElementById("fs"),
    month: document.getElementById("fm")
  };

  var sortKey = "no";
  var sortAsc = true;
  var NUMERIC = { no: 1, qty: 1, rate: 1, amt: 1, paid: 1, due: 1 };

  function fillFilters() {
    var custs = Array.from(new Set(ORDERS.map(function (o) { return o.cust; }))).sort();
    var items = Array.from(new Set(ORDERS.map(function (o) { return o.item; }))).sort();
    custs.forEach(function (c) { inputs.cust.add(new Option(c, c)); });
    items.forEach(function (i) { inputs.item.add(new Option(i, i)); });
  }

  function visibleRows() {
    var term = inputs.q.value.trim().toLowerCase();
    return ORDERS.filter(function (o) {
      if (term && o.cust.toLowerCase().indexOf(term) === -1 && o.no.indexOf(term) === -1) return false;
      if (inputs.cust.value && o.cust !== inputs.cust.value) return false;
      if (inputs.item.value && o.item !== inputs.item.value) return false;
      if (inputs.st.value && o.st !== inputs.st.value) return false;
      if (inputs.month.value && o.date.slice(5, 7) !== inputs.month.value) return false;
      return true;
    }).sort(function (a, b) {
      var x = a[sortKey], y = b[sortKey];
      if (NUMERIC[sortKey]) { x = +x; y = +y; }
      return (x < y ? -1 : x > y ? 1 : 0) * (sortAsc ? 1 : -1);
    });
  }

  function shortDate(iso) {
    return new Date(iso + "T00:00:00")
      .toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }

  function renderTable() {
    var rows = visibleRows();
    var billed = rows.reduce(function (s, o) { return s + o.amt; }, 0);
    var due = rows.reduce(function (s, o) { return s + o.due; }, 0);

    tally.textContent = rows.length + " of " + ORDERS.length + " bills · " +
      inr(billed) + " billed · " + inr(due) + " due";
    empty.hidden = rows.length > 0;

    tbody.innerHTML = rows.map(function (o) {
      return "<tr>" +
        '<td class="mono">' + o.no + "</td>" +
        '<td class="mono">' + shortDate(o.date) +
          (o.conf === "ambiguous" ? '<span class="flagmark">date?</span>' : "") + "</td>" +
        '<td class="cell-name">' + o.cust + "</td>" +
        "<td>" + o.item + "</td>" +
        '<td class="col-r">' + o.qty + "</td>" +
        '<td class="col-r">' + o.rate + (o.est ? '<span class="flagmark">rate≈</span>' : "") + "</td>" +
        '<td class="col-r">' + inr(o.amt) + "</td>" +
        '<td class="col-r">' + inr(o.paid) + "</td>" +
        '<td class="col-r ' + (o.due ? "cell-due" : "cell-nil") + '">' + (o.due ? inr(o.due) : "—") + "</td>" +
        '<td><span class="pill pill-' + o.st.toLowerCase() + '">' + o.st + "</span></td>" +
        "</tr>";
    }).join("");
  }

  function wireTable() {
    Array.prototype.forEach.call(document.querySelectorAll(".data-table th button"), function (btn) {
      btn.addEventListener("click", function () {
        var k = btn.dataset.k;
        if (k === sortKey) {
          sortAsc = !sortAsc;
        } else {
          sortKey = k;
          sortAsc = !NUMERIC[k] || k === "no";
        }
        Array.prototype.forEach.call(document.querySelectorAll(".data-table th"), function (th) {
          th.classList.toggle("is-sorted", th.contains(btn));
        });
        renderTable();
      });
    });
    Object.keys(inputs).forEach(function (k) {
      inputs[k].addEventListener("input", renderTable);
    });
    document.getElementById("reset").addEventListener("click", function () {
      Object.keys(inputs).forEach(function (k) { inputs[k].value = ""; });
      renderTable();
    });
  }

  /* ---------- navigation ---------- */
  function wireNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-link"));
    var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    var sidebar = document.getElementById("sidebar");
    var scrim = document.getElementById("scrim");
    var menuBtn = document.getElementById("menuBtn");

    function closeMenu() {
      sidebar.classList.remove("is-open");
      scrim.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    }
    menuBtn.addEventListener("click", function () {
      var open = sidebar.classList.toggle("is-open");
      scrim.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    scrim.addEventListener("click", closeMenu);
    links.forEach(function (a) { a.addEventListener("click", closeMenu); });

    if (!("IntersectionObserver" in window)) return;
    var seen = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen.set(e.target, e.intersectionRatio); });
      var best = null, bestRatio = 0;
      seen.forEach(function (ratio, node) {
        if (ratio > bestRatio) { bestRatio = ratio; best = node; }
      });
      if (!best) return;
      links.forEach(function (a, i) { a.classList.toggle("is-active", sections[i] === best); });
    }, { rootMargin: "-78px 0px -55% 0px", threshold: [0, 0.15, 0.4, 0.75, 1] });
    sections.forEach(function (s) { if (s) io.observe(s); });
  }

  /* ---------- theme toggle ---------- */
  function wireTheme() {
    var root = document.documentElement;
    var btn = document.getElementById("themeBtn");
    var saved = null;
    try { saved = localStorage.getItem("hb-theme"); } catch (err) { /* private mode */ }
    if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

    btn.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (current !== "light" && current !== "dark") current = systemDark ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("hb-theme", next); } catch (err) { /* private mode */ }
    });
  }

  /* ---------- boot ---------- */
  if (!ORDERS.length) {
    document.getElementById("main").innerHTML =
      '<p class="empty">No order data loaded. Check that <code>js/data.js</code> is present.</p>';
    return;
  }

  renderKpis();
  renderInversion();
  renderMonthly();
  renderAgeing();
  renderStatuses();

  renderSplitList(
    "productList",
    group(function (o) { return o.item; }).sort(function (a, b) { return b.amt - a.amt; }),
    function (d) { return d.bills + " bills · " + d.qty + " dozen · " + pct(d.paid, d.amt) + " collected"; }
  );

  renderSplitList(
    "buyerList",
    group(function (o) { return o.cust; }).sort(function (a, b) { return b.due - a.due; }),
    function (d) { return d.bills + " bills · " + pct(d.paid, d.amt) + " collected · " + inr(d.due) + " owed"; }
  );

  fillFilters();
  wireTable();
  renderTable();
  wireNav();
  wireTheme();
})();
