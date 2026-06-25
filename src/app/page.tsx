"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Download, Loader2, ChevronRight, Smartphone } from "lucide-react";

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

const devices = [
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

const steps = [
  { title: "Generate", desc: "Pick theme & device, then generate." },
  { title: "Copy URL", desc: "Copy the Shortcut URL below." },
  { title: "iOS Shortcut", desc: '"Get Contents of URL" action.' },
  { title: "Automate", desc: "Daily trigger sets wallpaper." },
];

export default function Home() {
  const [username, setUsername] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("classic");
  const [device, setDevice] = useState("iphone14");
  const [showStats, setShowStats] = useState("true");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [autoDetected, setAutoDetected] = useState(false);

  useEffect(() => {
    if (!/iPhone/.test(navigator.userAgent)) return;
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
      setDevice(detected);
      setAutoDetected(true);
    }
  }, []);

  const generate = useCallback(async () => {
    const user = username.trim();
    if (!user) {
      setError("Please enter a GitHub username.");
      return;
    }
    setError(null);
    setLoading(true);
    setPreviewSrc(null);
    const params = new URLSearchParams({ user, theme: selectedTheme, stats: showStats });
    const previewUrl = `/api/preview?${params}`;
    const fullUrl = `${window.location.origin}/api/wallpaper?${params}&device=${device}`;
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
  }, [username, selectedTheme, device, showStats]);

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

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-white ${jakarta.className}`}>


<div className="mx-auto max-w-[1060px] px-6">

        {/* Hero */}
        <header className="pt-16 pb-14 border-b border-white/[0.06]">
          <h1 className="text-[52px] lg:text-[64px] font-extrabold leading-[1.05] tracking-[-0.03em] mb-5 max-w-2xl">
            GitHub contributions as your wallpaper.
          </h1>
          <p className="text-[15px] text-white/40 font-normal leading-relaxed">
            Generate iPhone wallpapers from your contribution graph.<br />
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

              <div className="grid grid-cols-2 gap-4 mb-7">
                <div>
                  <label className="block text-[11px] font-semibold text-white/35 uppercase tracking-widest mb-2.5">
                    Device{autoDetected && <span className="text-white/25 normal-case tracking-normal font-normal ml-1.5">· auto-detected</span>}
                  </label>
                  <div className="relative">
                    <select
                      value={device}
                      onChange={(e) => setDevice(e.target.value)}
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
                  iOS Shortcut URL
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
                How do I automate this?
              </button>

              {showGuide && (
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
              )}
            </div>
          </div>

          {/* RIGHT: Phone Preview */}
          <div className="flex justify-center lg:sticky lg:top-8 lg:self-start">
            <div className="w-[240px] h-[520px] border border-white/[0.1] bg-[#0d1117] relative overflow-hidden rounded-[2.2rem] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
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
