// api/greet.js — Step 2: input shapes the response.
// /api/greet?name=Priya  →  { "message": "Hello, Priya!" }
export default function handler(req, res) {
  const name = req.query.name || "there";
  res.status(200).json({ message: `Hello, ${name}!` });
}
