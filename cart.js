/* GlowCare cart helpers */

function calculateTotal(items) {
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
