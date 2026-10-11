// api/weather.js — calls the keyed OpenWeatherMap API.
// /api/weather?city=Ludhiana → { city, temp, condition, humidity, windSpeed, ... }
import { getWeather } from "../lib/weather.js";

export default async function handler(req, res) {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: "Add ?city=YourCity to the URL" });

  try {
    res.status(200).json(await getWeather(city));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
}
