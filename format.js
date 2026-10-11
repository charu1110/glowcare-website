/* GlowCare price formatting */

function formatPrice(amount) {
  return "₹" + Math.round(amount).toLocaleString("en-IN");
}
