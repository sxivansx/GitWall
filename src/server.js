const express = require("express");
const path = require("path");
const { fetchContributions } = require("./github");
const { renderWallpaper } = require("./render");
const { THEMES } = require("./themes");
const { DEVICES } = require("./devices");

const app = express();
const startTime = Date.now();

app.use(express.static(path.join(__dirname, "..", "public")));

// Simple in-memory cache (5 minute TTL)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
  // Evict old entries if cache grows too large
  if (cache.size > 200) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: Math.floor((Date.now() - startTime) / 1000),
  });
});

app.get("/wallpaper", async (req, res) => {
  const { user, theme = "classic", stats: statsParam, device = "iphone14" } = req.query;

  if (!user) {
    return res.status(400).json({ error: "Missing required parameter: user" });
  }

  const stats = statsParam !== "false";
  const cacheKey = `${user}:${theme}:${stats}:${device}`;

  try {
    let png = getCached(cacheKey);
    if (!png) {
      const calendar = await fetchContributions(user);
      png = renderWallpaper(calendar, { theme, device, stats, user });
      setCache(cacheKey, png);
    }

    res.set({
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
      "Content-Length": png.length,
    });
    res.send(png);
  } catch (err) {
    console.error(`Error generating wallpaper for ${user}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/preview", async (req, res) => {
  const { user, theme = "classic", stats: statsParam } = req.query;

  if (!user) {
    return res.status(400).json({ error: "Missing required parameter: user" });
  }

  const stats = statsParam !== "false";
  const cacheKey = `preview:${user}:${theme}:${stats}`;

  try {
    let png = getCached(cacheKey);
    if (!png) {
      const calendar = await fetchContributions(user);
      png = renderWallpaper(calendar, { theme, device: "preview", stats, user });
      setCache(cacheKey, png);
    }

    res.set({
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300",
      "Content-Length": png.length,
    });
    res.send(png);
  } catch (err) {
    console.error(`Error generating preview for ${user}:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/themes", (req, res) => {
  res.json(Object.entries(THEMES).map(([id, t]) => ({ id, name: t.name, colors: t.levels, background: t.background })));
});

app.get("/api/devices", (req, res) => {
  res.json(
    Object.entries(DEVICES)
      .filter(([id]) => id !== "preview")
      .map(([id, d]) => ({ id, name: d.name, width: d.width, height: d.height }))
  );
});

module.exports = app;
