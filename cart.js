/* GlowCare cart helpers */

function quickQuote(items) {
  const subtotal = calculateTotal(items);
  const welcome = applyDiscount(subtotal, "WELCOME5");
  return formatPrice(welcome);
}

function calculateTotal(items) {
  if (!Array.isArray(items)) return 0;
  let total = 0;
  for (const item of items) {
    total += item.price * item.qty;
  }
  return total;
}

function applyDiscount(total, code) {
  if (code === "GLOW10") return total * 0.9;
  return total;
}

function checkoutSummary(items, code) {
  const total = calculateTotal(items);
  return formatPrice(applyDiscount(total, code));
}
