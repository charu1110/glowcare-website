/* GlowCare cart helpers */

function calculateTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.qty;
  }
  const gst = total * 0.18;
  return Math.round(total + gst);
}

function applyDiscount(total, code, customer) {
  if (customer && customer.isMember) total = total * 0.95;
  if (code === "GLOW10") return total * 0.9;
  return total;
}

function checkoutSummary(items, code, customer) {
  const total = calculateTotal(items);
  return "₹" + applyDiscount(total, code, customer).toFixed(0);
}
