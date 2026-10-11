# Class Activity — Design Your Endpoint (Session 7)

**Product:** Mausam Menu, a weather-based food suggestion page.
**Problem:** A food stall or dhaba doesn't know what to promote today. If the weather says
"rain", people want pakode and chai. If it says "hot", they want lassi.

---

## 01 · Endpoint + method

```
GET /api/food-suggest
```

GET, because we only *ask* for data (the search log is a side effect).

## 02 · Input and output

**Input: query parameters**

| Param    | Required | Example    | Rule                                   |
|----------|----------|------------|----------------------------------------|
| `region` | yes      | `Punjab`   | Must be one of the regions in `lib/places.js` |
| `place`  | yes      | `Ludhiana` | Must be a place inside that region      |

Example call:

```
/api/food-suggest?region=Punjab&place=Ludhiana
```

**Output: JSON (status 200)**

```json
{
  "region": "Punjab",
  "place": "Ludhiana",
  "weather": {
    "city": "Ludhiana", "temp": 25, "feelsLike": 25,
    "humidity": 88, "windSpeed": 11,
    "condition": "Rain", "description": "light rain"
  },
  "mood": "rainy",
  "suggestions": [
    { "name": "Pakode & Adrak Chai", "emoji": "☕", "description": "...", "region": "Punjab" },
    { "name": "Aloo Paratha",        "emoji": "🫓", "description": "...", "region": "Punjab" },
    { "name": "Maggi",               "emoji": "🍜", "description": "...", "region": "All" }
  ]
}
```

**How the weather becomes a "mood"**

| Weather                                  | Mood       |
|------------------------------------------|------------|
| Rain / Drizzle / Thunderstorm            | `rainy`    |
| Snow, or temperature below 15 °C         | `cold`     |
| Temperature 30 °C or more                | `hot`      |
| Everything else                          | `pleasant` |

**Errors**

| Status | When                                         |
|--------|----------------------------------------------|
| 400    | `region` or `place` missing, or not in the list |
| 404    | OpenWeatherMap can't find the city            |
| 405    | Method is not GET                            |
| 500    | Database error or a key is missing           |
| 502    | Weather service error (for example, a wrong API key) |

## 03 · Database + keys

**Supabase tables** (created by `supabase/setup.sql`)

| Table      | Used for | Columns                                            |
|------------|----------|----------------------------------------------------|
| `foods`    | READ     | region, weather (mood), name, emoji, description   |
| `searches` | WRITE    | region, place, temp, condition, mood, created_at   |

**External service:** OpenWeatherMap Current Weather API (keyed).

**Environment variables** (in `.env.local` and in Vercel; never in GitHub)

| Name                | From where                         |
|---------------------|------------------------------------|
| `SUPABASE_URL`      | Supabase → Project Settings → Data API |
| `SUPABASE_ANON_KEY` | Supabase → Project Settings → API Keys |
| `WEATHER_API_KEY`   | openweathermap.org → My API keys    |

**Flow**

```
food.html ──► /api/food-suggest ──► OpenWeatherMap   (get weather)
                     │
                     ├──────────► Supabase foods     (read dishes)
                     └──────────► Supabase searches  (save the search)
```

The browser never sees any key and never talks to the database directly.
