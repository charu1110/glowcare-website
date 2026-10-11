// api/orders.js — Steps 3 & 4: read from and write to the Supabase `orders` table.
// GET  /api/orders                         → all orders
// POST /api/orders {item, quantity, price} → creates one order
import { supabase } from "../lib/supabase.js";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { item, quantity, price } = req.body || {};
    if (!item || !quantity || !price) {
      return res.status(400).json({ error: "item, quantity and price are required" });
    }
    const { data, error } = await supabase
      .from("orders")
      .insert([{ item, quantity, price }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  res.status(405).json({ error: "Use GET or POST" });
}
