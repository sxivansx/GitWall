"use client";

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { Download, Loader2, Smartphone, Square, Circle, Copy, Check, ExternalLink } from "lucide-react";
import { DEVICES } from "@/devices";
import { THEMES } from "@/themes";
import { MINECRAFT_THUMBS } from "@/lib/minecraftThumbs";
import { ONEPIECE_THUMBS } from "@/lib/onepieceThumbs";
import { AOT_THUMBS } from "@/lib/aotThumbs";
import { GOT_THUMBS } from "@/lib/gotThumbs";
import { SPIDERMAN_THUMBS } from "@/lib/spidermanThumbs";
import { POKEMON_THUMBS } from "@/lib/pokemonThumbs";
import { IRONMAN_THUMBS } from "@/lib/ironmanThumbs";

const MINECRAFT_DEFAULT = "minecraft-slime";
const ONEPIECE_DEFAULT = "onepiece-jollyroger";
const AOT_DEFAULT = "aot-wingsoffreedom";
const GOT_DEFAULT = "got-targaryen";
const SPIDERMAN_DEFAULT = "spiderman-classic";
const POINTBLANK_ID = "pointblank";
const POKEMON_DEFAULT = "pokemon-pikachu";
const BREAKINGBAD_ID = "breakingbad";
const BETTERCALLSAUL_ID = "bettercallsaul";
const IRONMAN_DEFAULT = "ironman-mk3";
const isMinecraftId = (id: string) => id.startsWith("minecraft-");
const isOnePieceId = (id: string) => id.startsWith("onepiece-");
const isAotId = (id: string) => id.startsWith("aot-");
const isGotId = (id: string) => id.startsWith("got-");
const isSpidermanId = (id: string) => id.startsWith("spiderman-");
const isPointBlankId = (id: string) => id === POINTBLANK_ID;
const isBreakingBadId = (id: string) => id === BREAKINGBAD_ID;
const isBetterCallSaulId = (id: string) => id === BETTERCALLSAUL_ID;
const isPokemonId = (id: string) => id.startsWith("pokemon-");
const isIronmanId = (id: string) => id.startsWith("ironman-");

type Theme = { id: string; name: string; colors: string[]; background: string; levels?: string[]; text?: string; };
type Device = { id: string; name: string };
type ScreenSize = { width: number; height: number };

// The Android app is served from the website; /download/android redirects to
// the latest APK so this link never changes when a new build is released.
const ANDROID_APP_PATH = "/download/android";
const ANDROID_APP_PACKAGE = "space.gitwall.app";

// Chrome and other Android browsers open the app through an intent: URL when
// it is installed, and fall back to the APK download when it is not.
function androidAppLink(wallpaperUrl: string, fallbackUrl: string): string {
  return `intent://setup?url=${encodeURIComponent(wallpaperUrl)}#Intent;scheme=gitwall;package=${ANDROID_APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
}

// First-paint fallbacks derived from the same source-of-truth modules the API
// serves, so there is no second hand-maintained copy to drift. The live lists
// are still fetched on mount to pick up anything added server-side.
const FALLBACK_THEMES: Theme[] = Object.entries(THEMES).map(([id, t]) => ({
  id,
  name: t.name,
  colors: t.levels,
  background: t.background,
  text: t.text,
}));

const FALLBACK_DEVICES: Device[] = Object.entries(DEVICES)
  .filter(([id]) => id !== "preview")
  .map(([id, d]) => ({ id, name: d.name }));

// A signature of every input that affects the rendered wallpaper. Comparing the
// current signature to the one that produced the visible preview tells us when
// the preview is stale (→ show "Regenerate").
function settingsKey(p: {
  user: string;
  theme: string;
  stats: string;
  shape: string;
  platform: string;
  device: string | undefined;
}): string {
  return JSON.stringify(p);
}

function StepCard({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border border-white/[0.07] rounded-xl p-5 bg-white/[0.02]">
      <div className="flex items-center gap-3 mb-3.5">
        <span className="flex items-center justify-center shrink-0 w-7 h-7 rounded-lg bg-white/[0.08] text-white text-[13px] font-bold">
          {num}
        </span>
        <h4 className="text-[15px] font-semibold text-white tracking-tight">{title}</h4>
      </div>
      <div className="text-[13px] text-white/45 leading-relaxed pl-10 space-y-2.5">
        {children}
      </div>
    </div>
  );
}

function SubStep({ num, children }: { num: string; children: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="text-white/30 font-mono text-[12px] pt-px shrink-0">{num}</span>
      <div className="flex-1 space-y-1.5">{children}</div>
    </div>
  );
}


function ImportantNote({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 p-3.5 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg">
      <p className="text-[12px] text-amber-200/70 leading-relaxed">{children}</p>
    </div>
  );
}

function UrlBox({ url }: { url: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API needs a secure context; select the text so a long-press
      // or Cmd/Ctrl+C still works.
      inputRef.current?.select();
    }
  }, [url]);
  return (
    <div className="flex gap-2 mt-1.5">
      <input
        ref={inputRef}
        readOnly
        value={url || ""}
        placeholder="Complete step 1 first…"
        onClick={(e) => (e.target as HTMLInputElement).select()}
        className="flex-1 min-w-0 bg-black/30 border border-white/[0.08] rounded-md px-3 py-2 text-[12px] text-emerald-400/80 placeholder:text-white/20 focus:outline-none font-mono"
      />
      <button
        onClick={copy}
        disabled={!url}
        aria-label="Copy wallpaper URL"
        className="shrink-0 border border-white/[0.12] rounded-md px-3 text-white/50 hover:text-white hover:border-white/30 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
      >
        {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}

// Relative luminance of a #rrggbb colour, used to keep tile labels and the
// selection ring readable on light backgrounds (Better Call Saul, Pokémon, Light).
function isLightColor(hex: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.6;
}

function ThemeTile({
  theme,
  label,
  selected,
  onSelect,
  square = false,
}: {
  theme: Theme;
  label: string;
  selected: boolean;
  onSelect: () => void;
  square?: boolean;
}) {
  const light = isLightColor(theme.background);
  // Full-scene themes sometimes use the background as level 0; skip dots that
  // would vanish against the tile.
  const dots = theme.colors.filter((c) => c.toLowerCase() !== theme.background.toLowerCase());
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${label} theme`}
      className={`px-3.5 py-2.5 rounded-lg border transition-all cursor-pointer ${
        selected
          ? light
            ? "border-black/60 ring-2 ring-black/20"
            : "border-white/50 ring-1 ring-white/10"
          : light
            ? "border-black/10 hover:border-black/30"
            : "border-white/[0.07] hover:border-white/20"
      }`}
      style={{ background: theme.background === "#ffffff" ? "#f8f8f8" : theme.background }}
    >
      <div className="flex gap-1 justify-center mb-1.5">
        {dots.map((c, i) => (
          <span
            key={i}
            className={`w-2 h-2 ${square ? "" : "rounded-full"} ${light ? "ring-1 ring-black/10" : ""}`}
            style={{ background: c }}
          />
        ))}
      </div>
      <span
        className="text-[10px] font-semibold uppercase tracking-wider block text-center"
        style={{ color: theme.text ?? (light ? "#1a1a1a" : "rgba(255,255,255,0.6)") }}
      >
        {label}
      </span>
    </button>
  );
}

export default function Home() {
  const [platform, setPlatform] = useState<"iphone" | "android">("iphone");
  const [username, setUsername] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("classic");
  // iPhone device state
  const [iphoneDevice, setIphoneDevice] = useState("iphone17");
  // Physical screen size of the visiting Android phone, used only for the
  // Download PNG link. The app measures the real size itself.
  const [androidScreen, setAndroidScreen] = useState<ScreenSize | null>(null);

  const [showStats, setShowStats] = useState("true");
  const [shape, setShape] = useState("box");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);
  const [isAndroidVisitor, setIsAndroidVisitor] = useState(false);
  const [themes, setThemes] = useState<Theme[]>(FALLBACK_THEMES);
  const [devices, setDevices] = useState<Device[]>(FALLBACK_DEVICES);
  // Monotonic id so an out-of-order preview fetch can't overwrite a newer one.
  const reqIdRef = useRef(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/themes").then((r) => r.json()),
      fetch("/api/devices").then((r) => r.json()),
    ])
      .then(([t, d]: [Theme[], Device[]]) => {
        if (!active) return;
        if (Array.isArray(t) && t.length) setThemes(t);
        if (Array.isArray(d) && d.length) setDevices(d);
      })
      .catch(() => {
        /* keep fallbacks if the API is unreachable */
      });
    return () => {
      active = false;
    };
  }, []);

  // Auto-detect device
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) {
      setPlatform("android");
      setIsAndroidVisitor(true);
      const dpr = window.devicePixelRatio || 1;
      setAndroidScreen({
        width: Math.round(Math.min(screen.width, screen.height) * dpr),
        height: Math.round(Math.max(screen.width, screen.height) * dpr),
      });
    } else if (/iPhone/.test(ua)) {
      setPlatform("iphone");
      const w = Math.min(screen.width, screen.height);
      const h = Math.max(screen.width, screen.height);
      const map: Record<string, string> = {
        "390x844": "iphone14",
        "393x852": "iphone16",
        "402x874": "iphone16pro",
        "420x912": "iphoneair",
        "430x932": "iphone15promax",
        "440x956": "iphone16promax",
      };
      const detected = map[`${w}x${h}`];
      if (detected) {
        setIphoneDevice(detected);
        setAutoDetected(true);
      }
    }
  }, []);

  // Release the last preview blob when the page unmounts.
  const previewSrcRef = useRef<string | null>(null);
  useEffect(() => {
    previewSrcRef.current = previewSrc;
  }, [previewSrc]);
  useEffect(() => {
    return () => {
      if (previewSrcRef.current) URL.revokeObjectURL(previewSrcRef.current);
    };
  }, []);

  // Restore the last username on load and persist it across refreshes.
  useEffect(() => {
    const saved = localStorage.getItem("gitwall:username");
    if (saved) setUsername(saved);
  }, []);
  useEffect(() => {
    if (username.trim()) {
      localStorage.setItem("gitwall:username", username.trim());
    } else {
      localStorage.removeItem("gitwall:username");
    }
  }, [username]);

  const generate = useCallback(async () => {
    const user = username.trim();
    if (!user) {
      setError("Please enter a GitHub username.");
      return;
    }
    setError(null);
    setLoading(true);
    const reqId = ++reqIdRef.current;

    const key = settingsKey({
      user,
      theme: selectedTheme,
      stats: showStats,
      shape,
      platform,
      device: platform === "android" ? undefined : iphoneDevice,
    });

    const previewParams = new URLSearchParams({ user, theme: selectedTheme, stats: showStats, shape });
    const previewUrl = `/api/preview?${previewParams}`;

    // The Android URL carries no size on purpose: the GitWall app appends the
    // phone's real resolution, so one URL works on any Android device.
    const params = new URLSearchParams({ user, theme: selectedTheme, stats: showStats, shape });
    if (platform === "iphone") params.set("device", iphoneDevice);
    const fullUrl = `${window.location.origin}/api/wallpaper?${params}`;

    try {
      const res = await fetch(previewUrl);
      if (!res.ok) {
        // The route returns JSON errors, but a proxy 5xx can be HTML — guard
        // the parse so the real failure isn't masked by a JSON syntax error.
        let message = "Failed to generate wallpaper";
        try {
          const err = await res.json();
          if (err?.error) message = err.error;
        } catch {
          /* non-JSON body (e.g. a gateway error page) — keep the generic message */
        }
        throw new Error(message);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      // A newer request superseded this one while it was in flight — drop it.
      if (reqIdRef.current !== reqId) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      setPreviewSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return objectUrl;
      });
      setWallpaperUrl(fullUrl);
      setGeneratedKey(key);
    } catch (err: unknown) {
      if (reqIdRef.current !== reqId) return;
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      if (reqIdRef.current === reqId) setLoading(false);
    }
  }, [username, selectedTheme, iphoneDevice, platform, showStats, shape]);

  // Direct download for Android uses the browser-reported screen size so the
  // PNG matches the phone even without the app.
  const downloadUrl = (() => {
    if (!wallpaperUrl) return null;
    if (platform !== "android" || !androidScreen) return wallpaperUrl;
    const u = new URL(wallpaperUrl);
    u.searchParams.set("width", String(androidScreen.width));
    u.searchParams.set("height", String(androidScreen.height));
    return u.toString();
  })();

  const handleDownload = useCallback(() => {
    if (downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `gitwall-${username.trim()}.png`;
      a.click();
    }
  }, [downloadUrl, username]);

  const currentKey = settingsKey({
    user: username.trim(),
    theme: selectedTheme,
    stats: showStats,
    shape,
    platform,
    device: platform === "android" ? undefined : iphoneDevice,
  });
  const hasGenerated = generatedKey !== null;
  const isDirty = hasGenerated && currentKey !== generatedKey;

  // Auto-regenerate when theme changes if user has already generated once
  const generateRef = useRef(generate);
  useEffect(() => { generateRef.current = generate; }, [generate]);
  const prevThemeRef = useRef(selectedTheme);
  useEffect(() => {
    if (prevThemeRef.current === selectedTheme) return;
    prevThemeRef.current = selectedTheme;
    if (username.trim() && hasGenerated) generateRef.current();
  }, [selectedTheme, username, hasGenerated]);

  // Minecraft, One Piece, Attack on Titan and Game of Thrones are grouped under
  // single picker tiles that expand to show their variants; everything else stays
  // in the flat theme grid.
  const gridThemes = themes.filter(
    (t) => !isMinecraftId(t.id) && !isOnePieceId(t.id) && !isAotId(t.id) && !isGotId(t.id) && !isSpidermanId(t.id) && !isPointBlankId(t.id) && !isPokemonId(t.id) && !isBreakingBadId(t.id) && !isBetterCallSaulId(t.id) && !isIronmanId(t.id)
  );
  const minecraftThemes = themes.filter((t) => isMinecraftId(t.id));
  const onepieceThemes = themes.filter((t) => isOnePieceId(t.id));
  const aotThemes = themes.filter((t) => isAotId(t.id));
  const gotThemes = themes.filter((t) => isGotId(t.id));
  const minecraftSelected = isMinecraftId(selectedTheme);
  const onepieceSelected = isOnePieceId(selectedTheme);
  const aotSelected = isAotId(selectedTheme);
  const gotSelected = isGotId(selectedTheme);
  const pointblankSelected = isPointBlankId(selectedTheme);
  const aotGroup = aotThemes.find((t) => t.id === AOT_DEFAULT) ?? aotThemes[0];
  const minecraftGroup = minecraftThemes.find((t) => t.id === MINECRAFT_DEFAULT) ?? minecraftThemes[0];
  const onepieceGroup = onepieceThemes.find((t) => t.id === ONEPIECE_DEFAULT) ?? onepieceThemes[0];
  const gotGroup = gotThemes.find((t) => t.id === GOT_DEFAULT) ?? gotThemes[0];
  const spidermanThemes = themes.filter((t) => isSpidermanId(t.id));
  const spidermanSelected = isSpidermanId(selectedTheme);
  const spidermanGroup = spidermanThemes.find((t) => t.id === SPIDERMAN_DEFAULT) ?? spidermanThemes[0];
  const pointblankTheme = themes.find((t) => isPointBlankId(t.id));
  const breakingbadSelected = isBreakingBadId(selectedTheme);
  const bettercallsaulSelected = isBetterCallSaulId(selectedTheme);
  const breakingbadTheme = themes.find((t) => isBreakingBadId(t.id));
  const bettercallsaulTheme = themes.find((t) => isBetterCallSaulId(t.id));
  const pokemonThemes = themes.filter((t) => isPokemonId(t.id));
  const pokemonSelected = isPokemonId(selectedTheme);
  const pokemonGroup = pokemonThemes.find((t) => t.id === POKEMON_DEFAULT) ?? pokemonThemes[0];
  const ironmanThemes = themes.filter((t) => isIronmanId(t.id));
  const ironmanSelected = isIronmanId(selectedTheme);
  const ironmanGroup = ironmanThemes.find((t) => t.id === IRONMAN_DEFAULT) ?? ironmanThemes[0];

  // Tiles in the Special row. Groups open their variant picker below; single
  // themes select directly. Missing themes (API drift) simply do not render.
  const specialGroups = (
    [
      { id: "minecraft", label: "Minecraft", theme: minecraftGroup, selected: minecraftSelected, defaultId: MINECRAFT_DEFAULT },
      { id: "onepiece", label: "One Piece", theme: onepieceGroup, selected: onepieceSelected, defaultId: ONEPIECE_DEFAULT },
      { id: "aot", label: "Attack on Titan", theme: aotGroup, selected: aotSelected, defaultId: AOT_DEFAULT },
      { id: "got", label: "Game of Thrones", theme: gotGroup, selected: gotSelected, defaultId: GOT_DEFAULT },
      { id: "spiderman", label: "Spider-Man", theme: spidermanGroup, selected: spidermanSelected, defaultId: SPIDERMAN_DEFAULT },
      { id: "ironman", label: "Iron Man", theme: ironmanGroup, selected: ironmanSelected, defaultId: IRONMAN_DEFAULT },
      { id: "pointblank", label: "Point Blank", theme: pointblankTheme, selected: pointblankSelected, defaultId: POINTBLANK_ID },
      { id: "breakingbad", label: "Breaking Bad", theme: breakingbadTheme, selected: breakingbadSelected, defaultId: BREAKINGBAD_ID },
      { id: "bettercallsaul", label: "Better Call Saul", theme: bettercallsaulTheme, selected: bettercallsaulSelected, defaultId: BETTERCALLSAUL_ID },
      { id: "pokemon", label: "Pokémon", theme: pokemonGroup, selected: pokemonSelected, defaultId: POKEMON_DEFAULT },
    ] as const
  ).filter((g): g is typeof g & { theme: Theme } => g.theme !== undefined);


  const iphoneGuide = (
    <div className="space-y-3">
      <StepCard num="1" title="Generate">
        <p>Enter your GitHub username, choose a theme and your device above, then tap <b className="font-semibold text-white/75">Generate</b>.</p>
      </StepCard>
      <StepCard num="2" title="Create Automation">
        <p>
          Open the <b className="font-semibold text-white/75">Shortcuts</b> app → <b className="font-semibold text-white/75">Automation</b> tab → <b className="font-semibold text-white/75">New Automation</b> → <b className="font-semibold text-white/75">Time of Day</b> → set <b className="font-semibold text-white/75">6:00 AM</b> → Repeat <b className="font-semibold text-white/75">Daily</b> → <b className="font-semibold text-white/75">Run Immediately</b> → <b className="font-semibold text-white/75">Create New Shortcut</b>.
        </p>
      </StepCard>
      <StepCard num="3" title="Create Shortcut">
        <p className="text-[11px] font-semibold text-white/30 tracking-wide uppercase">Add these actions</p>
        <SubStep num="3.1">
          <p><b className="font-semibold text-white/75">“Get Contents of URL”</b> → paste your wallpaper URL:</p>
          <UrlBox url={wallpaperUrl} />
        </SubStep>
        <SubStep num="3.2">
          <p><b className="font-semibold text-white/75">“Set Wallpaper Photo”</b> → choose <b className="font-semibold text-white/75">Lock Screen</b>.</p>
        </SubStep>
        <ImportantNote>
          <b className="font-semibold text-amber-300/90">Important:</b> In “Set Wallpaper Photo”, tap the arrow (→) to show options → disable both <b className="font-semibold text-amber-200/90">“Crop to Subject”</b> and <b className="font-semibold text-amber-200/90">“Show Preview”</b>. This stops iOS from cropping the image and asking for confirmation every day.
        </ImportantNote>
      </StepCard>
    </div>
  );

  const androidAppDownload =
    typeof window === "undefined" ? ANDROID_APP_PATH : `${window.location.origin}${ANDROID_APP_PATH}`;

  const androidGuide = (
    <div className="space-y-3">
      <StepCard num="1" title="Generate">
        <p>Enter your GitHub username, choose a theme above, then tap <b className="font-semibold text-white/75">Generate</b>. No phone model needed: the app measures your screen.</p>
      </StepCard>
      <StepCard num="2" title="Install the GitWall app">
        <p>A small app that does one thing: fetches your wallpaper and sets it as the lock screen, then repeats every day at a time you choose.</p>
        <a
          href={ANDROID_APP_PATH}
          className="inline-flex items-center gap-2 mt-1 px-3.5 py-2 rounded-md border border-[#3ddc84]/30 bg-[#3ddc84]/[0.06] text-[#3ddc84] text-[12px] font-semibold hover:bg-[#3ddc84]/[0.12] transition-colors"
        >
          <Download className="size-3.5" />
          Download APK
        </a>
        <ImportantNote>
          Android asks once to allow installs from your browser. On Samsung phones also turn off <b className="font-semibold text-amber-200/90">Auto Blocker</b> in Settings → Security and privacy, then turn it back on after installing.
        </ImportantNote>
      </StepCard>
      <StepCard num="3" title="Send the URL to the app">
        <p>On your phone, tap the button below and the app opens with the URL filled in. Or copy the URL and paste it into the app.</p>
        {!wallpaperUrl ? (
          <p className="text-white/30 text-[12px]">Complete step 1 to enable this button.</p>
        ) : !isAndroidVisitor ? (
          <p className="text-white/30 text-[12px]">You are not on an Android phone. Open gitwall.space on your phone to use this button, or copy the URL below into the app.</p>
        ) : (
          <a
            href={androidAppLink(wallpaperUrl, androidAppDownload)}
            className="inline-flex items-center gap-2 mt-1 px-3.5 py-2 rounded-md bg-white text-black text-[12px] font-bold hover:bg-white/90 transition-colors"
          >
            <ExternalLink className="size-3.5" />
            Open in GitWall app
          </a>
        )}
        <UrlBox url={wallpaperUrl} />
      </StepCard>
      <StepCard num="4" title="Set it">
        <p>In the app tap <b className="font-semibold text-white/75">Set lock screen wallpaper</b>. Your lock screen updates right away and refreshes every day at the time you choose (6:00 by default).</p>
        <p>Tap <b className="font-semibold text-white/75">Allow</b> next to Background refresh so Android lets the app fetch while the phone sleeps.</p>
        <ImportantNote>
          If your phone has a rotating lock screen feature such as Samsung <b className="font-semibold text-amber-200/90">Dynamic Lock screen</b> or Xiaomi <b className="font-semibold text-amber-200/90">Wallpaper Carousel</b>, turn it off or it will replace GitWall.
        </ImportantNote>
      </StepCard>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-[1060px] px-6">

        {/* Hero */}
        <header className="pt-10 pb-14 border-b border-white/[0.06]">
          {/* Brand row: the same four-cell mark as the favicon and the Android app icon */}
          <div className="flex items-center gap-3 mb-12">
            <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
              <rect x="0" y="0" width="14" height="14" rx="3" fill="#161b22" />
              <rect x="18" y="0" width="14" height="14" rx="3" fill="#39d353" />
              <rect x="0" y="18" width="14" height="14" rx="3" fill="#39d353" />
              <rect x="18" y="18" width="14" height="14" rx="3" fill="#161b22" />
            </svg>
            <span className="text-[17px] font-bold tracking-tight text-white">GitWall</span>
          </div>
          <h1 className="text-[52px] lg:text-[64px] font-extrabold leading-[1.05] tracking-[-0.03em] mb-5 max-w-2xl">
            GitHub contributions as your wallpaper.
          </h1>
          <p className="text-[15px] text-white/40 font-normal leading-relaxed">
            Generate phone wallpapers from your contribution graph.<br />
            Updates automatically on your lock screen.
          </p>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-14 py-12">

          {/* LEFT: Form */}
          <div className="space-y-10">

            {/* Username */}
            <div>
              <label htmlFor="gh-username" className="block text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                GitHub Username
              </label>
              <input
                id="gh-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder="e.g. torvalds"
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-[15px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>

            {/* Appearance */}
            <div className="pt-8 border-t border-white/[0.06]">
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-6">
                Appearance
              </p>

              {/* Platform Toggle */}
              <div className="mb-6">
                <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                  Platform
                </label>
                <div className="flex gap-2">
                  <button
                    id="platform-iphone"
                    onClick={() => setPlatform("iphone")}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-[13px] font-semibold transition-all ${
                      platform === "iphone"
                        ? "border-white/40 bg-white/[0.08] text-white"
                        : "border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    {/* Apple icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    iPhone
                  </button>
                  <button
                    id="platform-android"
                    onClick={() => setPlatform("android")}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-[13px] font-semibold transition-all ${
                      platform === "android"
                        ? "border-[#3ddc84]/50 bg-[#3ddc84]/[0.06] text-[#3ddc84]"
                        : "border-white/[0.08] text-white/40 hover:border-white/20 hover:text-white/60"
                    }`}
                  >
                    {/* Android icon */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
                    </svg>
                    Android
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-7">
                {/* Device selector */}
                <div>
                  <label htmlFor="device-select" className="block text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2.5">
                    Device{autoDetected && platform === "iphone" && <span className="text-white/25 normal-case tracking-normal font-normal ml-1.5">· auto-detected</span>}
                  </label>

                  {platform === "iphone" ? (
                    <div className="relative">
                      <select
                        id="device-select"
                        value={iphoneDevice}
                        onChange={(e) => { setIphoneDevice(e.target.value); setAutoDetected(false); }}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-white/25 transition-colors cursor-pointer appearance-none font-medium"
                      >
                        {devices.map((d) => (
                          <option key={d.id} value={d.id} className="bg-[#111] text-white">
                            {d.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-[10px]">▾</span>
                    </div>
                  ) : (
                    /* Android: any phone. The app supplies the exact screen size. */
                    <div className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white/70 font-medium">
                      Any Android phone
                      <span className="block text-[10px] text-white/25 font-normal mt-0.5">
                        {androidScreen ? `Detected ${androidScreen.width}×${androidScreen.height}px` : "Sized by the GitWall app"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2.5">
                    Show Stats
                  </label>
                  <div className="relative">
                    <select
                      value={showStats}
                      onChange={(e) => setShowStats(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-white/25 transition-colors cursor-pointer appearance-none font-medium"
                    >
                      <option value="true" className="bg-[#111]">Yes</option>
                      <option value="false" className="bg-[#111]">No</option>
                    </select>
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-[10px]">▾</span>
                  </div>
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                  Theme
                </label>

                {/* General — solid box/dot themes; the Shape selector applies to these */}
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-2.5">
                  General
                </p>
                <div className="flex flex-wrap gap-2">
                  {gridThemes.map((t) => (
                    <ThemeTile key={t.id} theme={t} label={t.name} selected={selectedTheme === t.id} onSelect={() => setSelectedTheme(t.id)} />
                  ))}
                </div>

                {/* Shape lives with General — it only changes how these solid cells
                    are drawn (box vs circle); pixel-art/full-scene themes ignore it. */}
                {!minecraftSelected && !onepieceSelected && !aotSelected && !gotSelected && !spidermanSelected && !pointblankSelected && !pokemonSelected && !ironmanSelected && (
                  <div className="mt-3 flex items-center gap-2.5">
                    <span className="text-[11px] font-medium text-white/30">Shape</span>
                    <div className="inline-flex gap-1 p-1 bg-white/[0.04] border border-white/[0.08] rounded-lg">
                      {[
                        { id: "box", name: "Box", Icon: Square },
                        { id: "circle", name: "Circular", Icon: Circle },
                      ].map(({ id, name, Icon }) => (
                        <button
                          key={id}
                          onClick={() => setShape(id)}
                          aria-pressed={shape === id}
                          aria-label={`${name} cells`}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[12px] font-semibold transition-colors cursor-pointer ${
                            shape === id
                              ? "bg-white text-black"
                              : "text-white/50 hover:text-white"
                          }`}
                        >
                          <Icon className="size-3.5" />
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special — show themes; selecting one expands its variants below */}
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mt-5 mb-2.5">
                  Special
                </p>
                <div className="flex flex-wrap gap-2">
                  {specialGroups.map((g) => (
                    <ThemeTile
                      key={g.id}
                      theme={g.theme}
                      label={g.label}
                      selected={g.selected}
                      square={g.id === "minecraft"}
                      onSelect={() => { if (!g.selected) setSelectedTheme(g.defaultId); }}
                    />
                  ))}
                </div>

                {/* Minecraft block variants */}
                {minecraftSelected && minecraftThemes.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                      Minecraft block
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {minecraftThemes.map((t) => {
                        const variant = t.id.replace("minecraft-", "");
                        const active = selectedTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTheme(t.id)}
                            aria-pressed={active}
                            aria-label={`${t.name} block`}
                            className={`flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              active
                                ? "border-white/50 ring-1 ring-white/10 bg-white/[0.04]"
                                : "border-white/[0.07] hover:border-white/20"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={MINECRAFT_THUMBS[variant]}
                              alt=""
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-[3px]"
                              style={{ imageRendering: "pixelated" }}
                            />
                            <span className={`text-[12px] font-semibold ${active ? "text-white" : "text-white/55"}`}>
                              {t.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* One Piece variants */}
                {onepieceSelected && onepieceThemes.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                      One Piece style
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {onepieceThemes.map((t) => {
                        const variant = t.id.replace("onepiece-", "");
                        const active = selectedTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTheme(t.id)}
                            aria-pressed={active}
                            aria-label={`${t.name} style`}
                            className={`flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              active
                                ? "border-white/50 ring-1 ring-white/10 bg-white/[0.04]"
                                : "border-white/[0.07] hover:border-white/20"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={ONEPIECE_THUMBS[variant]}
                              alt=""
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-[3px]"
                              style={{ imageRendering: "pixelated" }}
                            />
                            <span className={`text-[12px] font-semibold ${active ? "text-white" : "text-white/55"}`}>
                              {t.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Attack on Titan variants */}
                {aotSelected && aotThemes.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                      Attack on Titan
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {aotThemes.map((t) => {
                        const variant = t.id.replace("aot-", "");
                        const active = selectedTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTheme(t.id)}
                            aria-pressed={active}
                            aria-label={`${t.name} style`}
                            className={`flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              active
                                ? "border-white/50 ring-1 ring-white/10 bg-white/[0.04]"
                                : "border-white/[0.07] hover:border-white/20"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={AOT_THUMBS[variant]}
                              alt=""
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-[3px]"
                              style={{ imageRendering: "pixelated" }}
                            />
                            <span className={`text-[12px] font-semibold ${active ? "text-white" : "text-white/55"}`}>
                              {t.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Game of Thrones variants */}
                {gotSelected && gotThemes.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                      House
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {gotThemes.map((t) => {
                        const variant = t.id.replace("got-", "");
                        const active = selectedTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTheme(t.id)}
                            aria-pressed={active}
                            aria-label={`${t.name} house`}
                            className={`flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              active
                                ? "border-white/50 ring-1 ring-white/10 bg-white/[0.04]"
                                : "border-white/[0.07] hover:border-white/20"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={GOT_THUMBS[variant]}
                              alt=""
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-[3px]"
                            />
                            <span className={`text-[12px] font-semibold ${active ? "text-white" : "text-white/55"}`}>
                              {t.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Spider-Man variants */}
                {spidermanSelected && spidermanThemes.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                      Suit
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {spidermanThemes.map((t) => {
                        const variant = t.id.replace("spiderman-", "");
                        const active = selectedTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTheme(t.id)}
                            aria-pressed={active}
                            aria-label={`${t.name} suit`}
                            className={`flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              active
                                ? "border-white/50 ring-1 ring-white/10 bg-white/[0.04]"
                                : "border-white/[0.07] hover:border-white/20"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={SPIDERMAN_THUMBS[variant]}
                              alt=""
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-[3px]"
                            />
                            <span className={`text-[12px] font-semibold ${active ? "text-white" : "text-white/55"}`}>
                              {t.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Iron Man armour marks */}
                {ironmanSelected && ironmanThemes.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                      Armor Mark
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ironmanThemes.map((t) => {
                        const variant = t.id.replace("ironman-", "");
                        const active = selectedTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTheme(t.id)}
                            aria-pressed={active}
                            aria-label={`${t.name} armor`}
                            className={`flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              active
                                ? "border-white/50 ring-1 ring-white/10 bg-white/[0.04]"
                                : "border-white/[0.07] hover:border-white/20"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={IRONMAN_THUMBS[variant]}
                              alt=""
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-[3px]"
                              style={{ imageRendering: "pixelated" }}
                            />
                            <span className={`text-[12px] font-semibold ${active ? "text-white" : "text-white/55"}`}>
                              {t.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pokémon variants */}
                {pokemonSelected && pokemonThemes.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                    <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                      Pokémon
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {pokemonThemes.map((t) => {
                        const variant = t.id.replace("pokemon-", "");
                        const active = selectedTheme === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTheme(t.id)}
                            aria-pressed={active}
                            aria-label={`${t.name}`}
                            className={`flex items-center gap-2.5 pl-1.5 pr-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                              active
                                ? "border-white/50 ring-1 ring-white/10 bg-white/[0.04]"
                                : "border-white/[0.07] hover:border-white/20"
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={POKEMON_THUMBS[variant]}
                              alt=""
                              width={28}
                              height={28}
                              className="w-7 h-7 rounded-[3px]"
                            />
                            <span className={`text-[12px] font-semibold ${active ? "text-white" : "text-white/55"}`}>
                              {t.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Generate / Regenerate — below the theme picker */}
              <div className="mt-8">
                <button
                  id="generate-btn"
                  onClick={generate}
                  disabled={loading}
                  className="w-full py-3.5 bg-white text-black text-[14px] font-bold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    `${hasGenerated ? "Regenerate" : "Generate"} →`
                  )}
                </button>
                {isDirty && !loading && (
                  <p className="text-amber-300/70 text-[12px] mt-2.5 text-center font-medium">
                    Settings changed — regenerate to update your wallpaper.
                  </p>
                )}
                {error && (
                  <p className="text-red-400/80 text-[13px] mt-2.5 font-medium text-center">{error}</p>
                )}
              </div>
            </div>

            {/* Mobile-only phone preview — shown below Generate, hidden on desktop */}
            <div className="flex justify-center lg:hidden">
              {platform === "iphone" ? (
                <div className="w-[200px] h-[432px] border border-white/[0.1] bg-[#0d1117] relative overflow-hidden rounded-[2.2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[60px] h-[17px] bg-black rounded-full z-10" />
                  {loading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="size-5 animate-spin text-white/20" /></div>}
                  {!loading && !previewSrc && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
                      <Smartphone className="size-7 text-white/10" />
                      <p className="text-[11px] font-medium text-white/20 text-center leading-relaxed">Enter your username and generate</p>
                    </div>
                  )}
                  {previewSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewSrc} alt="Wallpaper preview" className={`w-full h-full object-cover transition-opacity ${isDirty ? "opacity-40" : ""}`} />
                  )}
                  {previewSrc && isDirty && !loading && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 py-2 text-center text-[10px] font-medium text-white/70">Preview out of date</div>
                  )}
                </div>
              ) : (
                <div className="w-[200px] h-[432px] border border-[#3ddc84]/[0.15] bg-[#0a0d0b] relative overflow-hidden rounded-[1.8rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                  <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-[13px] h-[13px] bg-black rounded-full z-10 ring-1 ring-white/[0.08]" />
                  {loading && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="size-5 animate-spin text-[#3ddc84]/30" /></div>}
                  {!loading && !previewSrc && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
                      <Smartphone className="size-7 text-white/10" />
                      <p className="text-[11px] font-medium text-white/20 text-center leading-relaxed">Enter your username and generate</p>
                    </div>
                  )}
                  {previewSrc && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewSrc} alt="Wallpaper preview" className={`w-full h-full object-cover transition-opacity ${isDirty ? "opacity-40" : ""}`} />
                  )}
                  {previewSrc && isDirty && !loading && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/70 py-2 text-center text-[10px] font-medium text-white/70">Preview out of date</div>
                  )}
                </div>
              )}
            </div>

            {/* Export & Automate */}
            <div className="pt-8 border-t border-white/[0.06]">
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-5">
                Export & Automate
              </p>

              <button
                onClick={handleDownload}
                disabled={!wallpaperUrl}
                className="w-full py-3.5 bg-white/[0.06] border border-white/[0.08] text-white text-[13px] font-semibold rounded-lg hover:bg-white/[0.1] transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="size-3.5" />
                Download PNG
              </button>

              <div className="mt-7">
                <p className="text-[13px] font-semibold text-white/70 mb-4">
                  {platform === "android"
                    ? "Auto-update daily with the GitWall app"
                    : "Auto-update daily with iOS Shortcuts"}
                </p>
                {platform === "iphone" ? iphoneGuide : androidGuide}
              </div>
            </div>
          </div>

          {/* RIGHT: Phone Preview — desktop only */}
          <div className="hidden lg:flex justify-center lg:sticky lg:top-8 lg:self-start">
            {platform === "iphone" ? (
              /* iPhone frame */
              <div className="w-[240px] h-[520px] border border-white/[0.1] bg-[#0d1117] relative overflow-hidden rounded-[2.2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                {/* Dynamic Island */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[72px] h-[20px] bg-black rounded-full z-10" />
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-white/20" />
                  </div>
                )}
                {!loading && !previewSrc && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
                    <Smartphone className="size-7 text-white/10" />
                    <p className="text-[11px] font-medium text-white/20 text-center leading-relaxed">
                      Enter your username and generate
                    </p>
                  </div>
                )}
                {previewSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="Wallpaper preview" className={`w-full h-full object-cover transition-opacity ${isDirty ? "opacity-40" : ""}`} />
                )}
                {previewSrc && isDirty && !loading && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 py-2 text-center text-[10px] font-medium text-white/70">
                    Preview out of date
                  </div>
                )}
              </div>
            ) : (
              /* Android frame */
              <div className="w-[240px] h-[520px] border border-[#3ddc84]/[0.15] bg-[#0a0d0b] relative overflow-hidden rounded-[1.8rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                {/* Punch-hole camera */}
                <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-[13px] h-[13px] bg-black rounded-full z-10 ring-1 ring-white/[0.08]" />
                {/* Side button hints */}
                <div className="absolute right-0 top-[100px] w-[3px] h-[60px] bg-white/[0.08] rounded-l-full" />
                <div className="absolute left-0 top-[80px] w-[3px] h-[40px] bg-white/[0.06] rounded-r-full" />
                <div className="absolute left-0 top-[130px] w-[3px] h-[40px] bg-white/[0.06] rounded-r-full" />
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="size-5 animate-spin text-[#3ddc84]/30" />
                  </div>
                )}
                {!loading && !previewSrc && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
                    <svg className="w-7 h-7 opacity-10" viewBox="0 0 24 24" fill="#3ddc84">
                      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
                    </svg>
                    <p className="text-[11px] font-medium text-white/20 text-center leading-relaxed">
                      Enter your username and generate
                    </p>
                  </div>
                )}
                {previewSrc && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="Wallpaper preview" className={`w-full h-full object-cover transition-opacity ${isDirty ? "opacity-40" : ""}`} />
                )}
                {previewSrc && isDirty && !loading && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 py-2 text-center text-[10px] font-medium text-white/70">
                    Preview out of date
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 border-t border-white/[0.06]">
          <p className="text-[12px] font-medium text-white/20">
            GitWall — open source on{" "}
            <a
              href="https://github.com/sxivansx/GitWall"
              className="text-white/35 hover:text-white/60 transition-colors underline underline-offset-2"
            >
              GitHub
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
