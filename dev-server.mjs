// dev-server.mjs — run the site + /api functions on your own computer.
//   npm run dev   →   http://localhost:8080
// It behaves like Vercel: /api/hello runs api/hello.js, everything else is a file.
// Vercel never uses this file (see .vercelignore).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");
else console.warn("⚠  No .env.local found — copy .env.example to .env.local first.");

const PORT = 8080;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon"
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname.startsWith("/api/")) {
    const file = path.resolve("api", url.pathname.slice(5).replace(/\/$/, "") + ".js");
    if (!file.startsWith(path.resolve("api")) || !fs.existsSync(file)) {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "No such API" }));
    }

    // Give req/res the same helpers Vercel adds.
    req.query = Object.fromEntries(url.searchParams);
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try { req.body = raw ? JSON.parse(raw) : undefined; } catch { req.body = raw; }
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(data)); };

    try {
      const { default: handler } = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
      await handler(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
    console.log(`${req.method} ${url.pathname}${url.search} → ${res.statusCode}`);
    return;
  }

  let file = path.resolve("." + decodeURIComponent(url.pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!file.startsWith(process.cwd()) || !fs.existsSync(file)) {
    res.writeHead(404);
    return res.end("Not found");
  }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Running at http://localhost:${PORT}  (Ctrl+C to stop)`));
