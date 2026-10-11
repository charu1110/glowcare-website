# 🧒 Super-Simple Setup Guide: GitHub → Vercel → Supabase

Do the steps **in order**. Each step is small. Tick ✅ as you go.

---

## 🧠 Step 0: The big picture (read this first)

Think of it like a restaurant:

| Thing        | What it is                         | Restaurant version           |
|--------------|------------------------------------|------------------------------|
| **GitHub**   | Stores your **code**               | The recipe book              |
| **Vercel**   | **Runs** your website + `/api` code | The kitchen + waiter         |
| **Supabase** | Stores your **data** (tables)       | The fridge with ingredients  |
| **OpenWeatherMap** | Gives live weather           | A supplier you phone up      |

**Important:** your *code* never goes to Supabase. Supabase only keeps *data*.
What you actually want is this, and it is what we'll set up:

```
You type:  git push
              │
              ▼
          GitHub  ──(automatically)──►  Vercel builds & publishes your site
                                              │
                                              ▼
                               /api files talk to Supabase + Weather
                               using secret keys stored IN Vercel
```

So after setup, every `git push` = new live website within about 1 minute, and it
is already connected to Supabase. You only connect them **once**.

---

## 🌦️ Step 1: Get a weather key (OpenWeatherMap)

1. Go to **https://openweathermap.org** → click **Sign In** → **Create an Account**.
2. Fill in the form → open your email → click the **verify** link.
3. Sign in → click your name (top right) → **My API keys**.
4. You'll see a long key like `a1b2c3d4...`. **Copy it** and paste it into Notepad for now.

> ⏰ A new key can take **up to 2 hours** to start working. If you get
> "Invalid API key" at first, that's normal. Wait and try again.

✅ I have my weather key.

---

## 🗄️ Step 2: Make your Supabase database

### 2a. Create the project
1. Go to **https://supabase.com** → **Start your project** → sign in with **GitHub**.
2. Click **New project**.
3. Fill in:
   - **Name:** `mausam-menu`
   - **Database Password:** click *Generate*, then save it in Notepad
   - **Region:** **South Asia (Mumbai)**, the closest one to Punjab
4. Click **Create new project** → wait 1–2 minutes until it's ready.

### 2b. Create the tables (one copy-paste!)
1. In the left sidebar, click **SQL Editor** (the `>_` icon).
2. Click **+ New query**.
3. Open the file [`supabase/setup.sql`](supabase/setup.sql) from this project → select all (Ctrl+A) → copy (Ctrl+C).
4. Paste it into the Supabase editor → click **Run** (or press Ctrl+Enter).
5. You should see **"Success. No rows returned"**.
6. Click **Table Editor** in the sidebar. You should see 3 tables:
   `foods` (104 dishes), `orders` (3 rows), `searches` (empty for now).

### 2c. Copy your 2 Supabase secrets
1. Click the ⚙️ **Project Settings** (bottom of the sidebar).
2. Click **Data API** → copy the **Project URL** (looks like `https://abcd1234.supabase.co`).
3. Click **API Keys** → copy the **Publishable key** (starts with `sb_publishable_`).
   *(Older projects show an **anon public** key under "Legacy API keys". That one works too.)*
4. Paste both into Notepad.

> 🚫 Never copy the **secret** / **service_role** key. We don't need it.

✅ I have: Project URL + Publishable (anon) key.

---

## 💻 Step 3: Make it work on YOUR computer first

### 3a. Make the secret file
1. In VS Code, find the file **`.env.example`**.
2. Right-click → **Copy**, then right-click → **Paste**. Rename the copy to exactly **`.env.local`**.
3. Open `.env.local` and replace the fake values with your real ones from Notepad:

```
SUPABASE_URL=https://abcd1234.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxx
WEATHER_API_KEY=a1b2c3d4xxxxxxxx
```

No spaces around `=`, and no quotes. Save it.

### 3b. Install and run
Open the terminal in VS Code (**Ctrl + `**) and run these one at a time:

```bash
npm install
```

```bash
npm run dev
```

You'll see `Running at http://localhost:8080`.

### 3c. Test it in your browser (open each link)

| Link | You should see |
|---|---|
| http://localhost:8080/api/hello | `{"message":"Hello from your first API!", ...}` |
| http://localhost:8080/api/greet?name=Charu | `{"message":"Hello, Charu!"}` |
| http://localhost:8080/api/orders | 3 orders from Supabase |
| http://localhost:8080/api/weather?city=Ludhiana | Live weather |
| http://localhost:8080/api/food-suggest?region=Punjab&place=Ludhiana | Weather + food 🎉 |
| http://localhost:8080/food.html | The full page. Pick a region and a place |

Then go to Supabase → **Table Editor** → **searches**. Your search is saved there!

Press **Ctrl + C** in the terminal to stop the server.

✅ It works on my computer.

---

## 🔒 Step 4: Make sure secrets will NOT go to GitHub

Run:

```bash
git status
```

Look at the list. **`.env.local` must NOT be in it.** (The `.gitignore` file hides it.)
`node_modules` must not be there either.

If you **do** see `.env.local`, stop and fix `.gitignore` before going further.

✅ `.env.local` is not in the list.

---

## 📤 Step 5: Push your code to GitHub

Run these one at a time:

```bash
git add .
```

```bash
git commit -m "Add APIs and Mausam Menu weather food page"
```

```bash
git push origin main
```

Open **https://github.com/charu1110/glowcare-website** and check:
- ✅ You can see the `api/` folder, `food.html` and `supabase/setup.sql`
- ✅ You can **NOT** see `.env.local` anywhere

---

## 🚀 Step 6: Connect GitHub → Vercel (one time only)

1. Go to **https://vercel.com** → **Sign Up / Log In** → **Continue with GitHub**.

### Case A: the project is NOT on Vercel yet
2. Click **Add New…** → **Project**.
3. Find **glowcare-website** → click **Import**.
   (If you can't see it, click **Adjust GitHub App Permissions** and allow that repo.)
4. **Framework Preset:** `Other`. Leave Build Command and Output Directory **empty**.
5. Open **Environment Variables** and add these 3 (Key, then Value, then **Add**):

   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | your Project URL |
   | `SUPABASE_ANON_KEY` | your publishable/anon key |
   | `WEATHER_API_KEY` | your weather key |

6. Click **Deploy** → wait about 1 minute → 🎉 confetti!

### Case B: the project is ALREADY on Vercel
2. Open your project → **Settings** → **Environment Variables**.
3. Add the same 3 variables as in the table above → **Save**.
4. Go to **Deployments** → on the top one click **⋯** → **Redeploy**.
   *(Vercel only reads new variables on a new deploy.)*

✅ My site is live on Vercel.

---

## 🧪 Step 7: Test the LIVE site + homework screenshot

Your site address is shown on the Vercel project page, like
`https://glowcare-website.vercel.app`. Open:

```
https://YOUR-SITE.vercel.app/api/food-suggest?region=Punjab&place=Ludhiana
https://YOUR-SITE.vercel.app/food.html
```

**📸 Homework submission:**
1. The endpoint URL: `https://YOUR-SITE.vercel.app/api/food-suggest?region=Punjab&place=Ludhiana`
2. A screenshot of that URL showing the real JSON (weather + dishes).
   Also screenshot Supabase → `searches` table to prove it writes to the database.

---

## 🔁 Step 8: Your everyday routine from now on

```
1. Change code in VS Code
2. npm run dev          → test on localhost:8080
3. git add .
4. git commit -m "what I changed"
5. git push origin main → Vercel auto-deploys in about 1 min ✨
```

That's it. You never need to touch Supabase or Vercel settings again unless you:
- **add a new secret key** → add it in Vercel → Settings → Environment Variables, then Redeploy
- **add a new table** → run the SQL in the Supabase SQL Editor

---

## 🆘 If something breaks

| You see | Why | Fix |
|---|---|---|
| `Invalid API key` (weather) | New key not active yet, or a typo | Wait up to 2 hours; re-copy the key |
| `SUPABASE_URL or SUPABASE_ANON_KEY is not set` | Missing env variable | Locally: check `.env.local`. On Vercel: add the variable, then **Redeploy** |
| `relation "foods" does not exist` | Tables were not created | Run `supabase/setup.sql` again (Step 2b) |
| `new row violates row-level security` | Policies missing | Run `supabase/setup.sql` again |
| `city not found` | OpenWeatherMap doesn't know that name | Change the name in `lib/places.js` |
| Works locally, fails on Vercel | Env variables not added to Vercel | Step 6, Case B |
| `/api/...` gives 404 on Vercel | Old deploy | Check Vercel → Deployments, wait for "Ready" |
| See errors on Vercel | — | Vercel → your project → **Logs** tab shows the real error |

---

## 🎁 Optional: the one-click Supabase ↔ Vercel integration

Instead of typing the 2 Supabase variables by hand, you can go to Vercel →
your project → **Integrations** → search **Supabase** → **Add**, and pick your
project. It fills in `SUPABASE_URL` and `SUPABASE_ANON_KEY` (plus a few extra) for you.
You still add `WEATHER_API_KEY` yourself. Either way gives the same result.
