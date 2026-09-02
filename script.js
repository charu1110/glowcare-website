/* =========================================================
   GlowCare — script.js
   Vanilla JS only. No frameworks, no build step, no APIs.
   ---------------------------------------------------------
   1.  Product data
   2.  Product artwork (inline SVG)
   3.  Product rendering + filtering
   4.  Cart drawer
   5.  Toast
   6.  Navigation (burger, sticky header, scroll spy)
   7.  Scroll reveal + stat counters
   8.  Testimonials slider
   9.  Newsletter form
   10. Back to top + footer year
   ========================================================= */

(function () {
  "use strict";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };
  var money = function (n) { return "₹" + n.toLocaleString("en-IN"); };

  /* ---------- 1. PRODUCT DATA ---------- */
  var PRODUCTS = [
    {
      id: "gc-01",
      name: "Radiance Vitamin C Serum",
      cat: "serum",
      catLabel: "Serum",
      desc: "12% stabilised vitamin C with ferulic acid for visibly brighter, even-toned skin.",
      price: 1299, was: 1599,
      rating: 4.9, reviews: 2841,
      tag: "Bestseller",
      shape: "dropper",
      colors: ["#FFF3E6", "#F6B98E", "#D9607F"]
    },
    {
      id: "gc-02",
      name: "Hydra Bounce Water Cream",
      cat: "moisturiser",
      catLabel: "Moisturiser",
      desc: "Weightless gel-cream with 5 molecular weights of hyaluronic acid. 72-hour hydration.",
      price: 1149, was: null,
      rating: 4.8, reviews: 1963,
      tag: "New",
      shape: "jar",
      colors: ["#EAF4F6", "#A8D3DE", "#5FA3B5"]
    },
    {
      id: "gc-03",
      name: "Calm Down Oat Cleanser",
      cat: "cleanser",
      catLabel: "Cleanser",
      desc: "Sulphate-free milky cleanser with colloidal oatmeal — melts SPF without stripping.",
      price: 749, was: 899,
      rating: 4.7, reviews: 1420,
      tag: "Sale",
      shape: "pump",
      colors: ["#FBF3E7", "#F0D9AE", "#C9A46B"]
    },
    {
      id: "gc-04",
      name: "Daily Shield SPF 50 PA++++",
      cat: "sun",
      catLabel: "Sun Care",
      desc: "Invisible hybrid sunscreen. No white cast, no pilling under makeup, reef safe.",
      price: 999, was: null,
      rating: 4.9, reviews: 3502,
      tag: "Editor's pick",
      shape: "tube",
      colors: ["#FFF7E3", "#FBE08A", "#EFA93B"]
    },
    {
      id: "gc-05",
      name: "Night Repair Retinal 0.1%",
      cat: "serum",
      catLabel: "Serum",
      desc: "Encapsulated retinal in a squalane base — smooths fine lines while you sleep.",
      price: 1699, was: 1899,
      rating: 4.8, reviews: 1187,
      tag: "Sale",
      shape: "dropper",
      colors: ["#F1ECFA", "#C7B4E8", "#7C5FC0"]
    },
    {
      id: "gc-06",
      name: "Green Clay Detox Mask",
      cat: "cleanser",
      catLabel: "Cleanser",
      desc: "French green clay + zinc PCA to draw out congestion in 10 gentle minutes.",
      price: 899, was: null,
      rating: 4.6, reviews: 812,
      tag: "Limited",
      shape: "jar",
      colors: ["#EDF4EC", "#B8D6BD", "#6E9C7C"]
    },
    {
      id: "gc-07",
      name: "Barrier Rescue Ceramide Balm",
      cat: "moisturiser",
      catLabel: "Moisturiser",
      desc: "Ceramide NP and cholesterol blend for compromised, flaky or post-actives skin.",
      price: 1249, was: 1449,
      rating: 4.9, reviews: 1076,
      tag: "Bestseller",
      shape: "jar",
      colors: ["#FDF0EE", "#F3C7BE", "#D98878"]
    },
    {
      id: "gc-08",
      name: "Glow Mist SPF 30 Refresh",
      cat: "sun",
      catLabel: "Sun Care",
      desc: "Reapply protection over makeup with a fine, non-sticky rosewater mist.",
      price: 849, was: null,
      rating: 4.5, reviews: 634,
      tag: "New",
      shape: "pump",
      colors: ["#FDEFF3", "#F4C3D3", "#DB7C9E"]
    }
  ];

  /* ---------- 2. PRODUCT ARTWORK ---------- */
  /* Each product gets a hand-built SVG so there are no external image files. */
  function bottleSVG(p) {
    var light = p.colors[0], mid = p.colors[1], deep = p.colors[2];
    var gid = "g-" + p.id;
    var body;

    if (p.shape === "dropper") {
      body =
        '<rect x="66" y="10" width="28" height="42" rx="8" fill="#3B2432"/>' +
        '<rect x="72" y="48" width="16" height="14" fill="' + mid + '"/>' +
        '<rect x="40" y="58" width="80" height="132" rx="20" fill="url(#' + gid + ')" stroke="' + mid + '" stroke-width="2"/>' +
        '<rect x="50" y="112" width="60" height="70" rx="14" fill="' + deep + '" opacity=".85"/>';
    } else if (p.shape === "pump") {
      body =
        '<rect x="72" y="6" width="16" height="26" rx="5" fill="#3B2432"/>' +
        '<rect x="58" y="26" width="30" height="12" rx="5" fill="#3B2432"/>' +
        '<rect x="64" y="36" width="32" height="20" rx="6" fill="' + mid + '"/>' +
        '<rect x="38" y="54" width="84" height="140" rx="26" fill="url(#' + gid + ')" stroke="' + mid + '" stroke-width="2"/>' +
        '<rect x="48" y="118" width="64" height="68" rx="18" fill="' + deep + '" opacity=".8"/>';
    } else if (p.shape === "jar") {
      body =
        '<rect x="34" y="52" width="92" height="34" rx="12" fill="#3B2432"/>' +
        '<rect x="30" y="82" width="100" height="104" rx="26" fill="url(#' + gid + ')" stroke="' + mid + '" stroke-width="2"/>' +
        '<ellipse cx="80" cy="140" rx="34" ry="26" fill="' + deep + '" opacity=".8"/>';
    } else {
      /* tube */
      body =
        '<rect x="66" y="12" width="28" height="20" rx="6" fill="#3B2432"/>' +
        '<path d="M46 32h68l-8 152a14 14 0 0 1-14 13H68a14 14 0 0 1-14-13z" fill="url(#' + gid + ')" stroke="' + mid + '" stroke-width="2"/>' +
        '<rect x="58" y="112" width="44" height="62" rx="14" fill="' + deep + '" opacity=".75"/>';
    }

    return (
      '<svg viewBox="0 0 160 210" role="img" aria-label="' + p.name + '">' +
        '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="#ffffff"/>' +
          '<stop offset="60%" stop-color="' + light + '"/>' +
          '<stop offset="100%" stop-color="' + mid + '"/>' +
        '</linearGradient></defs>' +
        body +
        '<rect x="48" y="140" width="64" height="34" rx="8" fill="#ffffff" opacity=".92"/>' +
        '<text x="80" y="157" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="13" fill="#3B2432">GlowCare</text>' +
        '<text x="80" y="169" text-anchor="middle" font-family="Inter, sans-serif" font-size="7" letter-spacing="2" fill="#8b6c79">' +
          p.catLabel.toUpperCase() +
        '</text>' +
      '</svg>'
    );
  }

  /* Accurate part-stars: a gold row clipped to a percentage over a grey row. */
  function starsFor(rating) {
    var pct = Math.max(0, Math.min(5, rating)) / 5 * 100;
    return (
      '<span class="stars" style="--pct:' + pct.toFixed(1) + '%" ' +
        'role="img" aria-label="Rated ' + rating + ' out of 5">' +
        '<span class="stars__bg" aria-hidden="true">★★★★★</span>' +
        '<span class="stars__fill" aria-hidden="true">★★★★★</span>' +
      '</span>'
    );
  }

  /* ---------- 3. RENDER + FILTER PRODUCTS ---------- */
  var grid = $("#productGrid");
  var gridEmpty = $("#gridEmpty");

  function cardHTML(p) {
    var tagClass = p.tag === "Sale" ? "card__tag card__tag--sale" : "card__tag";
    return (
      '<article class="card" data-cat="' + p.cat + '">' +
        '<div class="card__media" style="background:linear-gradient(160deg,' + p.colors[0] + ' 0%, #ffffff 100%)">' +
          '<span class="' + tagClass + '">' + p.tag + '</span>' +
          bottleSVG(p) +
        '</div>' +
        '<div class="card__body">' +
          '<span class="card__cat">' + p.catLabel + '</span>' +
          '<h3 class="card__name">' + p.name + '</h3>' +
          '<p class="card__desc">' + p.desc + '</p>' +
          '<p class="rating">' + starsFor(p.rating) +
            '<span>' + p.rating.toFixed(1) + ' (' + p.reviews.toLocaleString("en-IN") + ')</span></p>' +
          '<div class="card__foot">' +
            '<span class="price"><span class="price__now">' + money(p.price) + '</span>' +
              (p.was ? '<span class="price__was">' + money(p.was) + '</span>' : "") +
            '</span>' +
            '<button class="card__btn" type="button" data-add="' + p.id + '">Shop Now</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderProducts(filter) {
    if (!grid) return;
    var list = filter === "all" ? PRODUCTS : PRODUCTS.filter(function (p) { return p.cat === filter; });

    /* home.html shows a short bestsellers row via data-limit="4" */
    var limit = parseInt(grid.dataset.limit, 10);
    if (limit > 0) list = list.slice(0, limit);

    grid.innerHTML = list.map(cardHTML).join("");
    if (gridEmpty) gridEmpty.hidden = list.length > 0;
    $$(".card", grid).forEach(function (card, i) {
      card.style.transitionDelay = (i % 4) * 70 + "ms";
      revealObserver.observe(card);
    });
  }

  $$(".filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $$(".filter").forEach(function (b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      renderProducts(btn.dataset.filter);
    });
  });

  /* ---------- 4. CART ---------- */
  /* Saved in localStorage so the bag survives moving between home.html and
     index.html. Wrapped in try/catch — private mode can block storage. */
  var STORE_KEY = "glowcare.cart";

  function loadCart() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      var saved = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(saved)) return [];
      /* Rebuild from the product list so prices/colours stay authoritative. */
      return saved.map(function (s) {
        var p = findProduct(s.id);
        if (!p) return null;
        return { id: p.id, name: p.name, price: p.price, colors: p.colors, qty: Math.max(1, parseInt(s.qty, 10) || 1) };
      }).filter(Boolean);
    } catch (err) {
      return [];
    }
  }

  function saveCart() {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(cart.map(function (i) {
        return { id: i.id, qty: i.qty };
      })));
    } catch (err) {
      /* Storage unavailable — the cart simply won't persist. */
    }
  }

  var cart = [];
  var cartEl = $("#cart");
  var overlay = $("#overlay");
  var cartList = $("#cartList");
  var cartEmpty = $("#cartEmpty");
  var cartCount = $("#cartCount");
  var cartTotal = $("#cartTotal");

  function openCart() {
    if (!cartEl || !overlay) return;
    overlay.hidden = false;
    /* next frame so the transition runs */
    requestAnimationFrame(function () { overlay.classList.add("is-visible"); });
    cartEl.classList.add("is-open");
    cartEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked");
  }

  function closeCart() {
    if (!cartEl || !overlay) return;
    overlay.classList.remove("is-visible");
    cartEl.classList.remove("is-open");
    cartEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    window.setTimeout(function () { overlay.hidden = true; }, 350);
  }

  function findProduct(id) {
    return PRODUCTS.filter(function (p) { return p.id === id; })[0];
  }

  function addToCart(id) {
    var existing = cart.filter(function (i) { return i.id === id; })[0];
    if (existing) {
      existing.qty += 1;
    } else {
      var p = findProduct(id);
      if (!p) return;
      cart.push({ id: p.id, name: p.name, price: p.price, colors: p.colors, qty: 1 });
    }
    drawCart();
  }

  function changeQty(id, delta) {
    var item = cart.filter(function (i) { return i.id === id; })[0];
    if (!item) return;
    item.qty += delta;
    if (item.qty < 1) {
      cart = cart.filter(function (i) { return i.id !== id; });
    }
    drawCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(function (i) { return i.id !== id; });
    drawCart();
  }

  function drawCart() {
    saveCart();
    var units = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    var total = cart.reduce(function (s, i) { return s + i.qty * i.price; }, 0);

    if (cartCount) {
      cartCount.textContent = units;
      cartCount.classList.toggle("is-visible", units > 0);
    }
    if (cartTotal) cartTotal.textContent = money(total);
    if (cartEmpty) cartEmpty.hidden = cart.length > 0;

    if (!cartList) return;
    cartList.innerHTML = cart.map(function (i) {
      return (
        '<li class="cart-item">' +
          '<span class="cart-item__thumb" style="background:linear-gradient(150deg,' + i.colors[0] + ',' + i.colors[1] + ')">' +
            i.name.charAt(0) +
          '</span>' +
          '<div>' +
            '<p class="cart-item__name">' + i.name + '</p>' +
            '<p class="cart-item__price">' + money(i.price) + '</p>' +
            '<div class="qty">' +
              '<button type="button" data-qty="-1" data-id="' + i.id + '" aria-label="Decrease quantity">&minus;</button>' +
              '<span>' + i.qty + '</span>' +
              '<button type="button" data-qty="1" data-id="' + i.id + '" aria-label="Increase quantity">+</button>' +
            '</div>' +
          '</div>' +
          '<button class="cart-item__remove" type="button" data-remove="' + i.id + '">Remove</button>' +
        '</li>'
      );
    }).join("");
  }

  /* One delegated listener covers every "Shop Now" button, present and future. */
  document.addEventListener("click", function (e) {
    var addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      var p = findProduct(addBtn.dataset.add);
      addToCart(addBtn.dataset.add);
      addBtn.classList.add("is-added");
      addBtn.textContent = "Added ✓";
      window.setTimeout(function () {
        addBtn.classList.remove("is-added");
        addBtn.textContent = "Shop Now";
      }, 1400);
      if (p) showToast(p.name + " added to your bag");
      return;
    }

    var qtyBtn = e.target.closest("[data-qty]");
    if (qtyBtn) { changeQty(qtyBtn.dataset.id, parseInt(qtyBtn.dataset.qty, 10)); return; }

    var rmBtn = e.target.closest("[data-remove]");
    if (rmBtn) { removeFromCart(rmBtn.dataset.remove); showToast("Removed from your bag"); }
  });

  var cartBtn = $("#cartBtn");
  var cartClose = $("#cartClose");
  var checkoutBtn = $("#checkoutBtn");

  if (cartBtn) cartBtn.addEventListener("click", openCart);
  if (cartClose) cartClose.addEventListener("click", closeCart);
  if (overlay) overlay.addEventListener("click", closeCart);
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", function () {
      if (!cart.length) { showToast("Your bag is empty — add a product first"); return; }
      showToast("This is a demo store, so checkout is disabled ✨");
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeCart();
      closeNav();
    }
  });

  /* ---------- 5. TOAST ---------- */
  var toast = $("#toast");
  var toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2600);
  }

  /* ---------- 6. NAVIGATION ---------- */
  var header = $("#header");
  var burger = $("#burger");
  var nav = $("#nav");

  function closeNav() {
    if (!nav || !burger) return;
    nav.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }

  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
    $$(".nav__link", nav).forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
  }

  /* Scroll spy only applies to same-page anchors. Links to another page
     (home.html, index.html#products …) are skipped. */
  var navLinks = $$(".nav__link").filter(function (l) {
    return (l.getAttribute("href") || "").charAt(0) === "#";
  });
  var sections = navLinks
    .map(function (l) { return document.querySelector(l.getAttribute("href")); })
    .filter(Boolean);

  var toTop = $("#toTop");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle("is-stuck", y > 10);
    if (toTop) toTop.classList.toggle("is-visible", y > 600);

    /* Scroll spy — highlight the section currently under the header.
       Above the first tracked section, nothing is highlighted. */
    var current = null;
    sections.forEach(function (sec) {
      if (sec.getBoundingClientRect().top <= 140) current = sec;
    });
    navLinks.forEach(function (l) {
      l.classList.toggle("is-active", !!current && l.getAttribute("href") === "#" + current.id);
    });
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      onScroll();
      ticking = false;
    });
  }, { passive: true });

  /* ---------- 7. SCROLL REVEAL + COUNTERS ---------- */
  var revealObserver;

  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
  } else {
    /* Graceful fallback for very old browsers: show everything. */
    revealObserver = {
      observe: function (el) { el.classList.add("is-visible"); },
      unobserve: function () {}
    };
  }

  $$(".reveal").forEach(function (el) { revealObserver.observe(el); });

  function runCounter(el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    var suffix = el.dataset.suffix || "";
    var start = null;
    var duration = 1400;

    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.floor(eased * target);
      el.textContent = value.toLocaleString("en-IN") + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
      else el.textContent = target.toLocaleString("en-IN") + suffix;
    }
    window.requestAnimationFrame(step);
  }

  var counters = $$("[data-count]");
  if (counters.length) {
    if ("IntersectionObserver" in window) {
      var countObserver = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      counters.forEach(function (c) { countObserver.observe(c); });
    } else {
      counters.forEach(runCounter);
    }
  }

  /* ---------- 8. TESTIMONIALS SLIDER ---------- */
  var REVIEWS = [
    {
      quote: "Three weeks with the Vitamin C serum and the dark spots from last summer have genuinely faded. It layers beautifully under sunscreen and never pills.",
      name: "Ananya Rao",
      role: "Verified buyer · Bengaluru",
      rating: 5
    },
    {
      quote: "I have rosacea-prone skin and almost nothing agrees with it. The oat cleanser is the first one in years that doesn't leave my cheeks burning.",
      name: "Meera Krishnan",
      role: "Verified buyer · Chennai",
      rating: 5
    },
    {
      quote: "Finally a SPF 50 that disappears on brown skin. No cast, no grease, and the bottle actually lasts a full month of daily use.",
      name: "Rohit Sharma",
      role: "Verified buyer · Mumbai",
      rating: 5
    },
    {
      quote: "The refill programme sold me. Same formula, half the packaging, cheaper each time. My barrier balm has been on repeat since December.",
      name: "Kavya Nair",
      role: "Verified buyer · Kochi",
      rating: 4.5
    }
  ];

  var track = $("#sliderTrack");
  var dotsWrap = $("#sliderDots");
  var index = 0;
  var autoTimer = null;

  function initialsOf(name) {
    return name.split(" ").map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase();
  }

  function buildSlider() {
    if (!track) return;

    track.innerHTML = REVIEWS.map(function (r) {
      return (
        '<article class="slide">' +
          '<p class="slide__stars">' + starsFor(r.rating) + '</p>' +
          '<blockquote class="slide__quote">“' + r.quote + '”</blockquote>' +
          '<div class="slide__person">' +
            '<span class="slide__avatar" aria-hidden="true">' + initialsOf(r.name) + '</span>' +
            '<span class="slide__meta">' +
              '<span class="slide__name">' + r.name + '</span><br>' +
              '<span class="slide__role">' + r.role + '</span>' +
            '</span>' +
          '</div>' +
        '</article>'
      );
    }).join("");

    if (dotsWrap) {
      dotsWrap.innerHTML = REVIEWS.map(function (r, i) {
        return '<button class="dot' + (i === 0 ? " is-active" : "") +
               '" type="button" data-slide="' + i + '" aria-label="Go to testimonial ' + (i + 1) + '"></button>';
      }).join("");

      $$(".dot", dotsWrap).forEach(function (dot) {
        dot.addEventListener("click", function () {
          goTo(parseInt(dot.dataset.slide, 10));
          restartAuto();
        });
      });
    }
    goTo(0);
  }

  function goTo(i) {
    if (!track) return;
    index = (i + REVIEWS.length) % REVIEWS.length;
    track.style.transform = "translateX(-" + index * 100 + "%)";
    $$(".dot").forEach(function (d, di) {
      d.classList.toggle("is-active", di === index);
    });
  }

  function restartAuto() {
    window.clearInterval(autoTimer);
    autoTimer = window.setInterval(function () { goTo(index + 1); }, 6000);
  }

  var prevBtn = $("#prevBtn");
  var nextBtn = $("#nextBtn");
  if (prevBtn) prevBtn.addEventListener("click", function () { goTo(index - 1); restartAuto(); });
  if (nextBtn) nextBtn.addEventListener("click", function () { goTo(index + 1); restartAuto(); });

  /* Touch swipe for phones */
  var slider = $("#slider");
  if (slider) {
    var startX = 0;
    var moved = false;

    slider.addEventListener("touchstart", function (e) {
      startX = e.changedTouches[0].clientX;
      moved = false;
    }, { passive: true });

    slider.addEventListener("touchmove", function () { moved = true; }, { passive: true });

    slider.addEventListener("touchend", function (e) {
      if (!moved) return;
      var diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) < 45) return;
      goTo(diff < 0 ? index + 1 : index - 1);
      restartAuto();
    });

    slider.addEventListener("mouseenter", function () { window.clearInterval(autoTimer); });
    slider.addEventListener("mouseleave", restartAuto);
  }

  /* ---------- 9. NEWSLETTER FORM ---------- */
  var form = $("#newsletterForm");
  if (form) {
    var emailInput = $("#email");
    var formMsg = $("#formMsg");
    var field = $(".field", form);
    var pattern = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var value = emailInput.value.trim();

      if (!value) {
        setMsg("Please enter your email address.", "is-error", true);
        return;
      }
      if (!pattern.test(value)) {
        setMsg("That email doesn't look right — check for typos.", "is-error", true);
        return;
      }

      setMsg("You're in! Your GLOW10 code is on its way to " + value + ".", "is-success", false);
      showToast("Welcome to the glow list ✨");
      form.reset();
    });

    emailInput.addEventListener("input", function () {
      if (field) field.classList.remove("is-error");
      if (formMsg) { formMsg.textContent = ""; formMsg.className = "form-msg"; }
    });

    function setMsg(text, cls, isError) {
      if (formMsg) {
        formMsg.textContent = text;
        formMsg.className = "form-msg " + cls;
      }
      if (field) field.classList.toggle("is-error", !!isError);
    }
  }

  /* ---------- 10. BACK TO TOP + YEAR ---------- */
  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- BOOT ---------- */
  renderProducts("all");
  buildSlider();
  cart = loadCart();
  drawCart();
  restartAuto();
  onScroll();
})();
