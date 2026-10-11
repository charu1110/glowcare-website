// api/places.js — the region → places list that fills the dropdowns.
import { PLACES } from "../lib/places.js";

export default function handler(req, res) {
  res.status(200).json(PLACES);
}
