"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Download, Loader2, ChevronRight, Smartphone, Search, X } from "lucide-react";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const themes = [
  { id: "classic", name: "Classic", colors: ["#023A16", "#196E2D", "#2CA044", "#39d353"], background: "#0C1116" },
  { id: "light", name: "Light", colors: ["#9be9a8", "#40c463", "#30a14e", "#216e39"], background: "#ffffff" },
  { id: "dracula", name: "Dracula", colors: ["#6272a4", "#bd93f9", "#ff79c6", "#50fa7b"], background: "#282a36" },
  { id: "nord", name: "Nord", colors: ["#5e81ac", "#81a1c1", "#88c0d0", "#8fbcbb"], background: "#2e3440" },
  { id: "ocean", name: "Ocean", colors: ["#1d3461", "#1f5f8b", "#00b4d8", "#90e0ef"], background: "#0a192f" },
  { id: "sunset", name: "Sunset", colors: ["#e94560", "#f27121", "#e9724c", "#ffc857"], background: "#1a1a2e" },
  { id: "mono", name: "Mono", colors: ["#404040", "#737373", "#a6a6a6", "#d9d9d9"], background: "#000000" },
] as const;

const iphoneDevices = [
  { id: "iphone14", name: "iPhone 14" },
  { id: "iphone14pro", name: "iPhone 14 Pro" },
  { id: "iphone14promax", name: "iPhone 14 Pro Max" },
  { id: "iphone15", name: "iPhone 15" },
  { id: "iphone15pro", name: "iPhone 15 Pro" },
  { id: "iphone15promax", name: "iPhone 15 Pro Max" },
  { id: "iphone16", name: "iPhone 16" },
  { id: "iphone16pro", name: "iPhone 16 Pro" },
  { id: "iphone16promax", name: "iPhone 16 Pro Max" },
] as const;

type AndroidDevice = {
  id: string;
  name: string;
  brand: string;
  width: number;
  height: number;
};

// Full Android device database (mirrors src/devices.js)
const androidDevices: AndroidDevice[] = [
  // Samsung S
  { id: "galaxy-s25-ultra", name: "Samsung Galaxy S25 Ultra", brand: "Samsung", width: 1440, height: 3120 },
  { id: "galaxy-s25-plus", name: "Samsung Galaxy S25+", brand: "Samsung", width: 1440, height: 3120 },
  { id: "galaxy-s25", name: "Samsung Galaxy S25", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s24-ultra", name: "Samsung Galaxy S24 Ultra", brand: "Samsung", width: 1440, height: 3120 },
  { id: "galaxy-s24-plus", name: "Samsung Galaxy S24+", brand: "Samsung", width: 1440, height: 3120 },
  { id: "galaxy-s24", name: "Samsung Galaxy S24", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s23-ultra", name: "Samsung Galaxy S23 Ultra", brand: "Samsung", width: 1440, height: 3088 },
  { id: "galaxy-s23-plus", name: "Samsung Galaxy S23+", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s23", name: "Samsung Galaxy S23", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s22-ultra", name: "Samsung Galaxy S22 Ultra", brand: "Samsung", width: 1440, height: 3088 },
  { id: "galaxy-s22-plus", name: "Samsung Galaxy S22+", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-s22", name: "Samsung Galaxy S22", brand: "Samsung", width: 1080, height: 2340 },
  // Samsung A
  { id: "galaxy-a55", name: "Samsung Galaxy A55", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-a54", name: "Samsung Galaxy A54", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-a35", name: "Samsung Galaxy A35", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-a25", name: "Samsung Galaxy A25", brand: "Samsung", width: 1080, height: 2340 },
  { id: "galaxy-a15", name: "Samsung Galaxy A15", brand: "Samsung", width: 1080, height: 2340 },
  // Google Pixel
  { id: "pixel-9-pro-xl", name: "Google Pixel 9 Pro XL", brand: "Google", width: 1344, height: 2992 },
  { id: "pixel-9-pro", name: "Google Pixel 9 Pro", brand: "Google", width: 1280, height: 2856 },
  { id: "pixel-9", name: "Google Pixel 9", brand: "Google", width: 1080, height: 2424 },
  { id: "pixel-8-pro", name: "Google Pixel 8 Pro", brand: "Google", width: 1344, height: 2992 },
  { id: "pixel-8", name: "Google Pixel 8", brand: "Google", width: 1080, height: 2400 },
  { id: "pixel-8a", name: "Google Pixel 8a", brand: "Google", width: 1080, height: 2400 },
  { id: "pixel-7-pro", name: "Google Pixel 7 Pro", brand: "Google", width: 1440, height: 3120 },
  { id: "pixel-7", name: "Google Pixel 7", brand: "Google", width: 1080, height: 2400 },
  { id: "pixel-7a", name: "Google Pixel 7a", brand: "Google", width: 1080, height: 2310 },
  { id: "pixel-6-pro", name: "Google Pixel 6 Pro", brand: "Google", width: 1440, height: 3120 },
  { id: "pixel-6", name: "Google Pixel 6", brand: "Google", width: 1080, height: 2400 },
  // OnePlus
  { id: "oneplus-13", name: "OnePlus 13", brand: "OnePlus", width: 1440, height: 3168 },
  { id: "oneplus-12", name: "OnePlus 12", brand: "OnePlus", width: 1440, height: 3168 },
  { id: "oneplus-11", name: "OnePlus 11", brand: "OnePlus", width: 1440, height: 3216 },
  { id: "oneplus-open", name: "OnePlus Open", brand: "OnePlus", width: 1440, height: 3168 },
  { id: "oneplus-nord-4", name: "OnePlus Nord 4", brand: "OnePlus", width: 1240, height: 2772 },
  { id: "oneplus-nord-ce4", name: "OnePlus Nord CE 4", brand: "OnePlus", width: 1080, height: 2360 },
  // Xiaomi
  { id: "xiaomi-15-pro", name: "Xiaomi 15 Pro", brand: "Xiaomi", width: 1440, height: 3200 },
  { id: "xiaomi-15", name: "Xiaomi 15", brand: "Xiaomi", width: 1200, height: 2670 },
  { id: "xiaomi-14-ultra", name: "Xiaomi 14 Ultra", brand: "Xiaomi", width: 1440, height: 3200 },
  { id: "xiaomi-14-pro", name: "Xiaomi 14 Pro", brand: "Xiaomi", width: 1440, height: 3200 },
  { id: "xiaomi-14", name: "Xiaomi 14", brand: "Xiaomi", width: 1200, height: 2670 },
  { id: "redmi-note-13-pro", name: "Redmi Note 13 Pro", brand: "Xiaomi", width: 1220, height: 2712 },
  { id: "redmi-note-13", name: "Redmi Note 13", brand: "Xiaomi", width: 1080, height: 2400 },
  // Nothing
  { id: "nothing-phone-3", name: "Nothing Phone (3)", brand: "Nothing", width: 1260, height: 2800 },
  { id: "nothing-phone-2a-plus", name: "Nothing Phone (2a) Plus", brand: "Nothing", width: 1080, height: 2412 },
  { id: "nothing-phone-2a", name: "Nothing Phone (2a)", brand: "Nothing", width: 1080, height: 2412 },
  { id: "nothing-phone-2", name: "Nothing Phone (2)", brand: "Nothing", width: 1080, height: 2412 },
  { id: "nothing-phone-1", name: "Nothing Phone (1)", brand: "Nothing", width: 1080, height: 2400 },
  // Motorola
  { id: "moto-edge-50-ultra", name: "Motorola Edge 50 Ultra", brand: "Motorola", width: 1220, height: 2712 },
  { id: "moto-edge-50-pro", name: "Motorola Edge 50 Pro", brand: "Motorola", width: 1220, height: 2712 },
  { id: "moto-edge-50", name: "Motorola Edge 50", brand: "Motorola", width: 1220, height: 2712 },
  { id: "moto-edge-40-neo", name: "Motorola Edge 40 Neo", brand: "Motorola", width: 1080, height: 2400 },
  { id: "moto-g85", name: "Motorola Moto G85", brand: "Motorola", width: 1080, height: 2400 },
  { id: "moto-g54", name: "Motorola Moto G54", brand: "Motorola", width: 1080, height: 2400 },
  // Sony
  { id: "xperia-1-vi", name: "Sony Xperia 1 VI", brand: "Sony", width: 1080, height: 2340 },
  { id: "xperia-5-v", name: "Sony Xperia 5 V", brand: "Sony", width: 1080, height: 2520 },
  { id: "xperia-10-vi", name: "Sony Xperia 10 VI", brand: "Sony", width: 1080, height: 2340 },
  // ASUS
  { id: "zenfone-11-ultra", name: "ASUS Zenfone 11 Ultra", brand: "ASUS", width: 1080, height: 2400 },
  { id: "rog-phone-8-pro", name: "ASUS ROG Phone 8 Pro", brand: "ASUS", width: 1080, height: 2400 },
  // OPPO
  { id: "oppo-find-x8-pro", name: "OPPO Find X8 Pro", brand: "OPPO", width: 1264, height: 2780 },
  { id: "oppo-find-x8", name: "OPPO Find X8", brand: "OPPO", width: 1256, height: 2760 },
  { id: "oppo-reno-12-pro", name: "OPPO Reno 12 Pro", brand: "OPPO", width: 1080, height: 2412 },
  // vivo
  { id: "vivo-x200-pro", name: "vivo X200 Pro", brand: "vivo", width: 1260, height: 2800 },
  { id: "vivo-x200", name: "vivo X200", brand: "vivo", width: 1260, height: 2800 },
  { id: "vivo-v30-pro", name: "vivo V30 Pro", brand: "vivo", width: 1080, height: 2376 },
  // Realme
  { id: "realme-gt-7-pro", name: "Realme GT 7 Pro", brand: "Realme", width: 1264, height: 2780 },
  { id: "realme-13-pro-plus", name: "Realme 13 Pro+", brand: "Realme", width: 1080, height: 2412 },
  { id: "realme-12-pro-plus", name: "Realme 12 Pro+", brand: "Realme", width: 1080, height: 2412 },
  // Honor
  { id: "honor-magic-7-pro", name: "Honor Magic 7 Pro", brand: "Honor", width: 1280, height: 2800 },
  { id: "honor-200-pro", name: "Honor 200 Pro", brand: "Honor", width: 1200, height: 2664 },
  { id: "honor-200", name: "Honor 200", brand: "Honor", width: 1080, height: 2376 },
];

const iosSteps = [
  { title: "Generate", desc: "Pick theme & device, then generate." },
  { title: "Create Automation", desc: 'Shortcuts → Automation → Time of Day → Daily → "Create New Shortcut".' },
  { title: "Add Actions", desc: '"Get Contents of URL" with your URL, then "Set Wallpaper Photo".' },
  { title: "Automate", desc: "Runs daily at 6 AM — your wallpaper updates automatically." },
];

const androidSteps = [
  { title: "Generate", desc: "Pick your Android model, theme, then generate and copy the URL." },
  { title: "Install MacroDroid", desc: "Get MacroDroid free from Google Play Store." },
  { title: "HTTP Request Action", desc: 'Web Interactions → HTTP Request → GET → paste URL. ✓ Check \"Block next actions until complete\". Response: Save to file → Storage Access Framework → pick any folder → filename: gitwall.png.' },
  { title: "Set Wallpaper Action", desc: 'Device Settings → Set Wallpaper → browse to the same folder and file (gitwall.png). Name the macro → Create Macro.' },
];

export default function Home() {
  const [platform, setPlatform] = useState<"iphone" | "android">("iphone");
  const [username, setUsername] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("classic");
  // iPhone device state
  const [iphoneDevice, setIphoneDevice] = useState("iphone14");
  // Android device state
  const [androidDevice, setAndroidDevice] = useState<AndroidDevice | null>(null);
  const [androidSearch, setAndroidSearch] = useState("");
  const [showAndroidDropdown, setShowAndroidDropdown] = useState(false);
  const androidSearchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showStats, setShowStats] = useState("true");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  // Auto-detect device
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/Android/.test(ua)) {
      setPlatform("android");
      const w = Math.min(screen.width, screen.height) * window.devicePixelRatio;
      const h = Math.max(screen.width, screen.height) * window.devicePixelRatio;
      const match = androidDevices.find(
        (d) => Math.abs(d.width - w) < 40 && Math.abs(d.height - h) < 80
      );
      if (match) {
        setAndroidDevice(match);
        setAndroidSearch(match.name);
        setAutoDetected(true);
      }
    } else if (/iPhone/.test(ua)) {
      setPlatform("iphone");
      const w = Math.min(screen.width, screen.height);
      const h = Math.max(screen.width, screen.height);
      const map: Record<string, string> = {
        "390x844": "iphone14",
        "393x852": "iphone16",
        "402x874": "iphone16pro",
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

  // Close android dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowAndroidDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filteredAndroid = androidSearch
    ? androidDevices.filter((d) =>
        d.name.toLowerCase().includes(androidSearch.toLowerCase()) ||
        d.brand.toLowerCase().includes(androidSearch.toLowerCase())
      )
    : androidDevices;

  const generate = useCallback(async () => {
    const user = username.trim();
    if (!user) {
      setError("Please enter a GitHub username.");
      return;
    }
    if (platform === "android" && !androidDevice) {
      setError("Please select your Android phone model.");
      return;
    }
    setError(null);
    setLoading(true);
    setPreviewSrc(null);

    const previewParams = new URLSearchParams({ user, theme: selectedTheme, stats: showStats });
    const previewUrl = `/api/preview?${previewParams}`;

    let fullUrl: string;
    if (platform === "android" && androidDevice) {
      const params = new URLSearchParams({
        user,
        theme: selectedTheme,
        stats: showStats,
        width: String(androidDevice.width),
        height: String(androidDevice.height),
      });
      fullUrl = `${window.location.origin}/api/wallpaper?${params}`;
    } else {
      const params = new URLSearchParams({ user, theme: selectedTheme, stats: showStats, device: iphoneDevice });
      fullUrl = `${window.location.origin}/api/wallpaper?${params}`;
    }

    try {
      const res = await fetch(previewUrl);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to generate wallpaper");
      }
      const blob = await res.blob();
      setPreviewSrc(URL.createObjectURL(blob));
      setWallpaperUrl(fullUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [username, selectedTheme, iphoneDevice, androidDevice, platform, showStats]);

  const handleCopy = useCallback(() => {
    if (wallpaperUrl) {
      navigator.clipboard.writeText(wallpaperUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [wallpaperUrl]);

  const handleDownload = useCallback(() => {
    if (wallpaperUrl) {
      const a = document.createElement("a");
      a.href = wallpaperUrl;
      a.download = `gitwall-${username.trim()}.png`;
      a.click();
    }
  }, [wallpaperUrl, username]);

  const steps = platform === "android" ? androidSteps : iosSteps;

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${jakarta.className}`}>
      <div className="mx-auto max-w-[1060px] px-6">

        {/* Hero */}
        <header className="pt-16 pb-14 border-b border-white/[0.06]">
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
              <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-3">
                GitHub Username
              </label>
              <div className="flex gap-2.5">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generate()}
                  placeholder="e.g. torvalds"
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3 text-[15px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors"
                />
                <button
                  onClick={generate}
                  disabled={loading}
                  className="px-6 py-3 bg-white text-black text-[13px] font-bold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Generate →"}
                </button>
              </div>
              {error && (
                <p className="text-red-400/80 text-[13px] mt-2.5 font-medium">{error}</p>
              )}
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
                    onClick={() => { setPlatform("iphone"); setShowGuide(false); }}
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
                    onClick={() => { setPlatform("android"); setShowGuide(false); }}
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
                  <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2.5">
                    Device{autoDetected && <span className="text-white/25 normal-case tracking-normal font-normal ml-1.5">· auto-detected</span>}
                  </label>

                  {platform === "iphone" ? (
                    <div className="relative">
                      <select
                        value={iphoneDevice}
                        onChange={(e) => setIphoneDevice(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[13px] text-white focus:outline-none focus:border-white/25 transition-colors cursor-pointer appearance-none font-medium"
                      >
                        {iphoneDevices.map((d) => (
                          <option key={d.id} value={d.id} className="bg-[#111] text-white">
                            {d.name}
                          </option>
                        ))}
                      </select>
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30 text-[10px]">▾</span>
                    </div>
                  ) : (
                    /* Android searchable dropdown */
                    <div className="relative" ref={dropdownRef}>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-white/25 pointer-events-none" />
                        <input
                          ref={androidSearchRef}
                          value={androidSearch}
                          onChange={(e) => {
                            setAndroidSearch(e.target.value);
                            setAndroidDevice(null);
                            setShowAndroidDropdown(true);
                          }}
                          onFocus={() => setShowAndroidDropdown(true)}
                          placeholder="Search phone model..."
                          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg pl-8 pr-8 py-2.5 text-[13px] text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors font-medium"
                        />
                        {androidSearch && (
                          <button
                            onClick={() => { setAndroidSearch(""); setAndroidDevice(null); setShowAndroidDropdown(true); androidSearchRef.current?.focus(); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                      {showAndroidDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-white/[0.1] rounded-lg overflow-hidden z-50 max-h-56 overflow-y-auto shadow-2xl">
                          {filteredAndroid.length === 0 ? (
                            <div className="px-3.5 py-3 text-[12px] text-white/30">No devices found</div>
                          ) : (
                            filteredAndroid.map((d) => (
                              <button
                                key={d.id}
                                onClick={() => {
                                  setAndroidDevice(d);
                                  setAndroidSearch(d.name);
                                  setShowAndroidDropdown(false);
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-white/[0.06] transition-colors group"
                              >
                                <div className="text-[13px] font-medium text-white/80 group-hover:text-white leading-none mb-0.5">{d.name}</div>
                                <div className="text-[10px] text-white/25">{d.width}×{d.height}px</div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
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
                <div className="flex flex-wrap gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`px-3.5 py-2.5 rounded-lg border transition-all cursor-pointer ${
                        selectedTheme === t.id
                          ? "border-white/50 ring-1 ring-white/10"
                          : "border-white/[0.07] hover:border-white/20"
                      }`}
                      style={{ background: t.background === "#ffffff" ? "#f8f8f8" : t.background }}
                    >
                      <div className="flex gap-1 justify-center mb-1.5">
                        {t.colors.map((c, i) => (
                          <span key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
                        ))}
                      </div>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider block text-center"
                        style={{ color: t.id === "light" ? "#1a1a1a" : "rgba(255,255,255,0.6)" }}
                      >
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Export */}
            <div className="pt-8 border-t border-white/[0.06]">
              <p className="text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-5">
                Export & Automate
              </p>

              <button
                onClick={handleDownload}
                disabled={!wallpaperUrl}
                className="w-full py-3.5 bg-white text-black text-[13px] font-bold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-20 disabled:cursor-not-allowed mb-5 flex items-center justify-center gap-2"
              >
                <Download className="size-3.5" />
                Download PNG
              </button>

              <div className="mb-6">
                <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2.5">
                  {platform === "android" ? "MacroDroid URL" : "iOS Shortcut URL"}
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={wallpaperUrl || ""}
                    placeholder="Generate a wallpaper first..."
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[12px] text-emerald-400/80 placeholder:text-white/15 focus:outline-none font-mono"
                  />
                  <button
                    onClick={handleCopy}
                    disabled={!wallpaperUrl}
                    className="border border-white/[0.12] rounded-lg px-5 text-[13px] font-semibold text-white/50 hover:text-white hover:border-white/30 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-1.5 text-[12px] font-medium text-white/25 hover:text-white/50 transition-colors"
              >
                <ChevronRight className={`size-3 transition-transform ${showGuide ? "rotate-90" : ""}`} />
                {platform === "android" ? "How to set up MacroDroid?" : "How do I automate this?"}
              </button>

              {showGuide && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 mt-4 border border-white/[0.07] rounded-lg overflow-hidden">
                    {steps.map((step, i) => (
                      <div
                        key={i}
                        className={`p-4 bg-white/[0.02] ${i < steps.length - 1 ? "border-r border-white/[0.06]" : ""}`}
                      >
                        <div className="text-[10px] font-semibold text-white/20 mb-2">{String(i + 1).padStart(2, "0")}</div>
                        <div className="text-[13px] font-semibold text-white mb-1">{step.title}</div>
                        <div className="text-[11px] text-white/35 leading-relaxed font-normal">{step.desc}</div>
                      </div>
                    ))}
                  </div>

                  {platform === "android" && (
                    <div className="mt-3 p-3.5 bg-amber-500/[0.06] border border-amber-500/20 rounded-lg">
                      <p className="text-[11px] text-amber-400/70 leading-relaxed">
                        <span className="font-semibold text-amber-400/90">Important:</span> Use <span className="font-semibold text-amber-300/80">Storage Access Framework</span> (not All File Access) — modern Android blocks direct path access. Pick any folder you own (e.g. Pictures), set filename <span className="font-mono text-amber-300/70">gitwall.png</span>, and browse to that <em>same</em> file in the Set Wallpaper action. Also make sure <span className="font-semibold text-amber-300/80">"Block next actions until complete"</span> is checked in the HTTP Request settings.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Phone Preview */}
          <div className="flex justify-center lg:sticky lg:top-8 lg:self-start">
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
                  <img src={previewSrc} alt="Wallpaper preview" className="w-full h-full object-cover" />
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
                      {androidDevice ? `${androidDevice.name} selected` : "Search your Android model"}
                    </p>
                  </div>
                )}
                {previewSrc && (
                  <img src={previewSrc} alt="Wallpaper preview" className="w-full h-full object-cover" />
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
