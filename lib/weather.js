// lib/weather.js — calls OpenWeatherMap and turns the reply into simple JSON.
// Shared by api/weather.js and api/food-suggest.js.

export async function getWeather(city) {
  const key = process.env.WEATHER_API_KEY;
  if (!key) {
    const err = new Error("WEATHER_API_KEY is not set");
    err.status = 500;
    throw err;
  }

  const url =
    "https://api.openweathermap.org/data/2.5/weather" +
    `?q=${encodeURIComponent(city)},IN&units=metric&appid=${key}`;

  const response = await fetch(url);
  const body = await response.json();

  if (!response.ok) {
    // 401 = bad/new key (new keys take up to 2 hours to start working)
    // 404 = city not found
    const err = new Error(body.message || "Weather service error");
    err.status = response.status === 404 ? 404 : 502;
    throw err;
  }

  return {
    city: body.name,
    temp: Math.round(body.main.temp),
    feelsLike: Math.round(body.main.feels_like),
    humidity: body.main.humidity,
    windSpeed: Math.round(body.wind.speed * 3.6), // m/s → km/h
    condition: body.weather[0].main,              // e.g. "Rain", "Clear"
    description: body.weather[0].description,     // e.g. "light rain"
    icon: `https://openweathermap.org/img/wn/${body.weather[0].icon}@2x.png`
  };
}

// Turn the weather into one of four "food moods" stored in the foods table.
export function weatherMood({ temp, condition }) {
  if (["Rain", "Drizzle", "Thunderstorm"].includes(condition)) return "rainy";
  if (condition === "Snow" || temp < 15) return "cold";
  if (temp >= 30) return "hot";
  return "pleasant";
}
