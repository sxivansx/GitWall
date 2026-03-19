"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Copy,
  Download,
  Loader2,
  ChevronDown,
  Smartphone,
} from "lucide-react";

const themes = [
  { id: "classic", name: "Classic", colors: ["#0e4429", "#006d32", "#26a641", "#39d353"], background: "#0d1117" },
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
  { title: "iOS Shortcut", desc: "\"Get Contents of URL\" action." },
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

    const params = new URLSearchParams({
      user,
      theme: selectedTheme,
      stats: showStats,
    });

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
      const message =
        err instanceof Error ? err.message : "Something went wrong";
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
    <div className="mx-auto max-w-[1100px] px-5 py-10">
      {/* Hero */}
      <header className="mb-10 text-center">
        <h1 className="mb-2 text-4xl font-bold tracking-tight bg-gradient-to-br from-green-400 to-cyan-400 bg-clip-text text-transparent">
          GitWall
        </h1>
        <p className="text-muted-foreground text-lg">
          Turn your GitHub contributions into an iPhone wallpaper
        </p>
      </header>

      {/* Two-column split view */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 mb-10">
        {/* LEFT — Workspace */}
        <div className="space-y-5">
          {/* Card 1: Account */}
          <Card>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label htmlFor="username" className="mb-2">
                    GitHub Username
                  </Label>
                  <Input
                    id="username"
                    placeholder="e.g. torvalds"
                    autoComplete="off"
                    spellCheck={false}
                    className="h-10"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && generate()}
                  />
                </div>
                <Button
                  onClick={generate}
                  disabled={loading}
                  className="h-10 px-6 bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-destructive text-sm mt-2">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* Card 2: Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Device + Stats row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Label>Device</Label>
                    {autoDetected && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-600/20 text-cyan-400 font-medium">
                        auto-detected
                      </span>
                    )}
                  </div>
                  <Select value={device} onValueChange={setDevice}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {devices.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="mb-2">Show Stats</Label>
                  <Select value={showStats} onValueChange={setShowStats}>
                    <SelectTrigger className="w-full h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Theme Swatches */}
              <div>
                <Label className="mb-2">Theme</Label>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(85px,1fr))] gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTheme(t.id)}
                      className={`rounded-lg p-2.5 text-center text-xs transition-all cursor-pointer border-2 ${
                        selectedTheme === t.id
                          ? "border-cyan-500 ring-1 ring-cyan-500/30"
                          : "border-transparent hover:border-border"
                      }`}
                      style={{ background: t.background }}
                    >
                      <div className="flex justify-center gap-1 mb-1.5">
                        {t.colors.map((c, i) => (
                          <span
                            key={i}
                            className="size-3 rounded-sm"
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                      <span
                        style={{
                          color: t.id === "light" ? "#24292f" : "#c9d1d9",
                        }}
                      >
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Export & Automate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Export & Automate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Download CTA */}
              <Button
                onClick={handleDownload}
                disabled={!wallpaperUrl}
                className="w-full h-10 bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Download className="size-4" />
                Download PNG
              </Button>

              {/* Shortcut URL */}
              <div className="space-y-2">
                <CardDescription className="text-xs">
                  iOS Shortcut URL for auto-updating wallpaper
                </CardDescription>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={wallpaperUrl || ""}
                    placeholder="Generate a wallpaper first..."
                    className="h-10 font-mono text-xs text-green-400 flex-1"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    disabled={!wallpaperUrl}
                    className="h-10 shrink-0"
                  >
                    <Copy className="size-4" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
              </div>

              {/* Collapsible guide */}
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full cursor-pointer"
              >
                <ChevronDown
                  className={`size-3.5 transition-transform ${
                    showGuide ? "rotate-180" : ""
                  }`}
                />
                How do I automate this?
              </button>

              {showGuide && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      className="text-center space-y-1.5 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="mx-auto flex size-7 items-center justify-center rounded-full bg-cyan-600 text-white text-xs font-bold">
                        {i + 1}
                      </div>
                      <h4 className="text-xs font-medium">{step.title}</h4>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Sticky Phone Preview */}
        <div className="flex justify-center lg:sticky lg:top-8 lg:self-start">
          <div className="w-[260px] h-[562px] rounded-[2.5rem] overflow-hidden border-[3px] border-border bg-[#0d1117] relative shadow-2xl shadow-black/40">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[28px] bg-black rounded-b-2xl z-10" />

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Loader2 className="size-8 animate-spin" />
              </div>
            )}
            {!loading && !previewSrc && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-8 gap-4">
                <Smartphone className="size-10 opacity-30" />
                <p className="text-sm text-center opacity-60">
                  Enter your GitHub username and click Generate
                </p>
              </div>
            )}
            {previewSrc && (
              <img
                src={previewSrc}
                alt="Wallpaper preview"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-muted-foreground text-xs">
        <p>
          GitWall &mdash; open source on{" "}
          <a
            href="https://github.com/sxivansx/GitWall"
            className="text-cyan-400 hover:underline"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
