# GitWall

Turn your GitHub contribution graph into a phone wallpaper.

## Features

- Generates retina-quality wallpapers from your GitHub contributions
- 11 themes — Classic, Light, Dracula, Nord, Ocean, Sunset, Mono, Catppuccin, Gruvbox, Rosé Pine, Synthwave
- Box or circular cell shapes
- **iPhone** support: iPhone 14 through 17 Pro Max (and iPhone Air)
- **Android** support: 70+ devices across Samsung, Google Pixel, OnePlus, Xiaomi, Nothing, Motorola, Sony, ASUS, OPPO, vivo, Realme, and Honor
- Shows contribution stats: total count and current streak
- iOS Shortcut-compatible URL for daily auto-updating wallpapers (iPhone)
- GitWall Android app (`android/`) that sets the lock screen and/or home screen from the same URL and refreshes daily
- In-memory caching with 5-minute TTL

## Setup

```bash
git clone https://github.com/govindup63/GitWall.git
cd GitWall
npm install
```

Create a `.env` file in the project root:

```
GITHUB_TOKEN=your_github_personal_access_token
```

A token with the `read:user` scope works. [Create one here](https://github.com/settings/tokens). Next.js loads `.env` automatically.

## Usage

For development:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

Open `http://localhost:3000`, enter a GitHub username, pick your platform (iPhone or Android), choose a theme, and download your wallpaper.

### API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/wallpaper?user=<username>` | Full-resolution wallpaper PNG (iPhone) |
| `GET /api/wallpaper?user=<username>&width=1080&height=2340` | Wallpaper PNG at an exact size (used by the Android app) |
| `GET /download/android` | Redirects to the Android APK (`/gitwall.apk`) |
| `GET /api/preview?user=<username>` | Low-res preview PNG |
| `GET /api/themes` | List available themes |
| `GET /api/devices` | List supported iPhone devices |
| `GET /api/health` | Server health check |

**Wallpaper query params:** `user` (required), `theme`, `device` (iPhone), `width` + `height` (Android), `stats` (true/false), `shape` (box/circle)

The API returns proper status codes: `400` for a missing or malformed username, `404` for a user that does not exist, `429` when GitHub rate-limits the request, and `500` for server-side issues.

### Auto-Updating Wallpaper

**iPhone (iOS Shortcuts)**
1. Generate your wallpaper and copy the Shortcut URL
2. Open iOS Shortcuts → New Shortcut
3. Add **Get Contents of URL** with the copied URL
4. Add **Set Wallpaper Photo** using the result and choose Lock Screen, Home Screen, or both
5. Automate it: Automation → Time of Day → run daily

**Android (GitWall app)**
1. Generate your wallpaper and copy the URL (no phone model needed)
2. Install the GitWall app from the website's **Download APK** button (`/download/android`)
3. Tap **Open in GitWall app**, or paste the URL into the app
4. Choose Lock screen, Home screen, or both, then tap **Set wallpaper**. The app appends your phone's real resolution, sets the wallpaper directly through Android's wallpaper API, and refreshes daily at a time you pick (06:00 by default)

Task-automation apps such as MacroDroid cannot do this reliably: Android copies wallpapers into private system storage, so replacing a file on disk never changes the lock screen, and newer Android versions block writes to shared folders.

### Android app

The app lives in `android/` (Kotlin, Jetpack Compose, WorkManager, minSdk 26).

```bash
cd android
./gradlew assembleDebug        # android/app/build/outputs/apk/debug/app-debug.apk (allows plain http for local testing)
./gradlew assembleRelease      # signed when android/keystore.properties exists
```

The signed release APK is committed as `public/gitwall.apk` and served by the website at `/gitwall.apk`. To ship a new version, bump `versionCode` and `versionName` in `android/app/build.gradle.kts`, rebuild with the same keystore, and replace that file. `keystore.properties` (git-ignored) holds `storeFile`, `storePassword`, `keyAlias`, `keyPassword`; the keystore must stay the same across releases or existing installs cannot update. Set `ANDROID_APK_URL` to point `/download/android` elsewhere when self-hosting.

## Tech Stack

- **Next.js** (App Router) — HTTP server and frontend
- **node-canvas** — Server-side PNG rendering
- **GitHub GraphQL API** — Contribution data

## License

ISC
