"use client";

import { useState, useCallback } from "react";
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
import { Copy, Download, Loader2 } from "lucide-react";

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
  {
    title: "Generate your wallpaper above",
    desc: "Pick a theme and device, then copy the Shortcut URL.",
  },
  {
    title: "Create an iOS Shortcut",
    desc: 'Open the Shortcuts app → New Shortcut → Add "Get Contents of URL" action with the copied URL.',
  },
  {
    title: "Set the wallpaper",
    desc: 'Add "Set Wallpaper" action, pass the image from the previous step.',
  },
  {
    title: "Automate it",
    desc: "Go to Automation → Create Personal Automation → Time of Day → set it to run daily → run your shortcut.",
  },
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
    <div className="mx-auto max-w-[900px] px-5 py-10">
      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="mb-2 text-4xl font-bold tracking-tight bg-gradient-to-br from-green-400 to-blue-400 bg-clip-text text-transparent">
          GitWall
        </h1>
        <p className="text-muted-foreground text-lg">
          Turn your GitHub contributions into an iPhone wallpaper
        </p>
      </header>

      {/* Form Card */}
      <Card className="mb-6">
        <CardContent className="space-y-5">
          {/* Username + Generate */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label htmlFor="username" className="mb-1.5">
                GitHub Username
              </Label>
              <Input
                id="username"
                placeholder="e.g. torvalds"
                autoComplete="off"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
            </div>
            <Button onClick={generate} disabled={loading} size="lg">
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Generate"
              )}
            </Button>
          </div>

          {/* Theme Swatches */}
          <div>
            <Label className="mb-1.5">Theme</Label>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t.id)}
                  className={`rounded-lg p-2 text-center text-xs transition-all cursor-pointer border-2 ${
                    selectedTheme === t.id
                      ? "border-green-500"
                      : "border-transparent"
                  }`}
                  style={{ background: t.background }}
                >
                  <div className="flex justify-center gap-1 mb-1">
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

          {/* Device + Stats */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[150px]">
              <Label className="mb-1.5">Device</Label>
              <Select value={device} onValueChange={setDevice}>
                <SelectTrigger className="w-full">
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
            <div className="flex-1 min-w-[150px]">
              <Label className="mb-1.5">Show Stats</Label>
              <Select value={showStats} onValueChange={setShowStats}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <p className="text-destructive text-sm mb-4">{error}</p>
      )}

      {/* Phone Preview */}
      <div className="flex justify-center py-6">
        <div className="w-[195px] h-[422px] rounded-3xl overflow-hidden border-[3px] border-border bg-background relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}
          {!loading && !previewSrc && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm text-center px-5">
              Enter your GitHub username and click Generate
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

      {/* Shortcut URL Section */}
      {wallpaperUrl && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>iOS Shortcut URL</CardTitle>
            <CardDescription>
              Use this URL in an iOS Shortcut to automatically update your
              wallpaper daily.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              readOnly
              value={wallpaperUrl}
              className="font-mono text-xs text-green-400"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleCopy}>
                <Copy className="size-4" />
                {copied ? "Copied!" : "Copy URL"}
              </Button>
              <Button variant="secondary" onClick={handleDownload}>
                <Download className="size-4" />
                Download PNG
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Guide */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Set Up Auto-Updating Wallpaper</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative ml-3">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`relative pl-10 pb-6 ${
                  i < steps.length - 1
                    ? "border-l-2 border-border"
                    : ""
                }`}
              >
                <div className="absolute -left-[13px] top-0 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {i + 1}
                </div>
                <h3 className="text-sm font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <footer className="text-center py-10 text-muted-foreground text-xs">
        <p>
          GitWall &mdash; open source on{" "}
          <a
            href="https://github.com"
            className="text-green-400 hover:underline"
          >
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
