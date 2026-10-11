// api/food-suggest.js — HOMEWORK endpoint.
// GET /api/food-suggest?region=Punjab&place=Ludhiana
//   1. checks the region/place against lib/places.js
//   2. gets live weather from OpenWeatherMap      (external keyed API)
//   3. reads matching dishes from Supabase `foods` (database read)
//   4. logs the search in Supabase `searches`      (database write)
import { supabase } from "../lib/supabase.js";
import { PLACES } from "../lib/places.js";
import { getWeather, weatherMood } from "../lib/weather.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET" });

  const { region, place } = req.query;
  if (!region || !place) {
    return res.status(400).json({ error: "Add ?region=...&place=... to the URL" });
  }
  if (!PLACES[region] || !PLACES[region].includes(place)) {
    return res.status(400).json({ error: `Unknown region/place: ${region} / ${place}` });
  }

  let weather;
  try {
    weather = await getWeather(place);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }

  const mood = weatherMood(weather);

  const { data: foods, error } = await supabase
    .from("foods")
    .select("name, emoji, description, region")
    .eq("weather", mood)
    .in("region", [region, "All"]);
  if (error) return res.status(500).json({ error: error.message });

  // Local dishes first, then the "All" (any region) fallbacks.
  foods.sort((a, b) => (a.region === "All") - (b.region === "All"));

  // Logging is a bonus — don't fail the whole request if it doesn't work.
  const { error: logError } = await supabase.from("searches").insert([
    { region, place, temp: weather.temp, condition: weather.condition, mood }
  ]);
  if (logError) console.error("Could not log search:", logError.message);

  res.status(200).json({
    region,
    place,
    weather,
    mood,
    suggestions: foods.slice(0, 4)
  });
}
