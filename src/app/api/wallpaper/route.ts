import { NextRequest, NextResponse } from "next/server";
import { fetchContributions } from "@/github";
import { renderWallpaper } from "@/render";
import { getCached, setCache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const user = searchParams.get("user");
  const theme = searchParams.get("theme") || "classic";
  const statsParam = searchParams.get("stats");
  const device = searchParams.get("device") || "iphone14";

  // Custom width/height override (for Android devices)
  const customWidth = searchParams.get("width");
  const customHeight = searchParams.get("height");

  if (!user) {
    return NextResponse.json(
      { error: "Missing required parameter: user" },
      { status: 400 }
    );
  }

  const stats = statsParam !== "false";
  const cacheKey = customWidth && customHeight
    ? `${user}:${theme}:${stats}:custom:${customWidth}x${customHeight}`
    : `${user}:${theme}:${stats}:${device}`;

  try {
    let png = getCached(cacheKey);
    if (!png) {
      const calendar = await fetchContributions(user);
      const renderOptions: Record<string, unknown> = { theme, stats, user };
      if (customWidth && customHeight) {
        renderOptions.customWidth = parseInt(customWidth);
        renderOptions.customHeight = parseInt(customHeight);
      } else {
        renderOptions.device = device;
      }
      png = renderWallpaper(calendar, renderOptions);
      setCache(cacheKey, png);
    }

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=300",
        "Content-Length": String(png.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Error generating wallpaper for ${user}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
