# GitWall

Turn your GitHub contribution graph into an iPhone wallpaper.

## Features

- Generates retina-quality wallpapers from your GitHub contributions
- 7 themes — Classic, Light, Dracula, Nord, Ocean, Sunset, Mono
- Supports iPhone 14 through 16 Pro Max resolutions
- Shows contribution stats: total, today's count, and current streak
- iOS Shortcut-compatible URL for daily auto-updating wallpapers
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

Open `http://localhost:3000` in your browser, enter a GitHub username, pick a theme and device, and download your wallpaper.

### API Endpoints

| Endpoint | Description |
|---|---|
| `GET /wallpaper?user=<username>` | Full-resolution wallpaper PNG |
| `GET /preview?user=<username>` | Low-res preview |
| `GET /api/themes` | List available themes |
| `GET /api/devices` | List supported devices |
| `GET /health` | Server health check |

**Wallpaper query params:** `user` (required), `theme`, `device`, `stats` (true/false)

### Auto-Updating iOS Wallpaper

1. Generate your wallpaper and copy the Shortcut URL
2. Open iOS Shortcuts → New Shortcut
3. Add **Get Contents of URL** with the copied URL
4. Add **Set Wallpaper** using the result
5. Automate it: Automation → Time of Day → run daily

## Tech Stack

- **Express** — HTTP server
- **node-canvas** — Server-side PNG rendering
- **GitHub GraphQL API** — Contribution data

## License

ISC
