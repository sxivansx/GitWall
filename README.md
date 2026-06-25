# GitWall

Turn your GitHub contribution graph into a phone wallpaper.

## Features

- Generates retina-quality wallpapers from your GitHub contributions
- 7 themes — Classic, Light, Dracula, Nord, Ocean, Sunset, Mono
- **iPhone** support: iPhone 14 through 16 Pro Max
- **Android** support: 70+ devices across Samsung, Google Pixel, OnePlus, Xiaomi, Nothing, Motorola, Sony, ASUS, OPPO, vivo, Realme, and Honor
- Shows contribution stats: total count and current streak
- iOS Shortcut-compatible URL for daily auto-updating wallpapers (iPhone)
- MacroDroid-compatible URL for daily auto-updating wallpapers (Android)
- In-memory caching with 5-minute TTL

## Setup

```bash
git clone https://github.com/sxivansx/GitWall.git
cd GitWall
npm install
```

Create a `.env` file:

```
GITHUB_TOKEN=your_github_personal_access_token
PORT=3000
```

The token needs the `read:user` scope. [Create one here](https://github.com/settings/tokens).

## Usage

```bash
npm start
```

Open `http://localhost:3000`, enter a GitHub username, pick your platform (iPhone or Android), choose a theme and device, and download your wallpaper.

### API Endpoints

| Endpoint | Description |
|---|---|
| `GET /wallpaper?user=<username>` | Full-resolution wallpaper PNG (iPhone) |
| `GET /wallpaper?user=<username>&width=1440&height=3120` | Full-resolution wallpaper PNG (Android) |
| `GET /preview?user=<username>` | Low-res preview |
| `GET /api/themes` | List available themes |
| `GET /api/devices` | List supported iPhone devices |
| `GET /api/android-devices` | List supported Android devices |
| `GET /health` | Server health check |

**Wallpaper query params:** `user` (required), `theme`, `stats` (true/false), `device` (iPhone), `width` + `height` (Android)

### Auto-Updating Wallpaper

**iPhone (iOS Shortcuts)**
1. Generate your wallpaper and copy the Shortcut URL
2. Open iOS Shortcuts → New Shortcut
3. Add **Get Contents of URL** with the copied URL
4. Add **Set Wallpaper** using the result
5. Automate it: Automation → Time of Day → run daily

**Android (MacroDroid)**
1. Generate your wallpaper, select your phone model, and copy the MacroDroid URL
2. Install [MacroDroid](https://play.google.com/store/apps/details?id=com.arlosoft.macrodroid) from Google Play
3. Add Macro → Trigger: Date/Time → Daily at 00:01
4. Action 1: HTTP Request (GET) → save response to `/Download/gitwall.png`
5. Action 2: Device Settings → Set Wallpaper → `/Download/gitwall.png`
6. Name the macro and tap **Create Macro**

> Use the **exact same filename** in both actions.

## Tech Stack

- **Next.js** — Frontend + API routes
- **node-canvas** — Server-side PNG rendering
- **GitHub GraphQL API** — Contribution data

## License

ISC
