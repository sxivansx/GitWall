import { NextRequest, NextResponse } from "next/server";
import { fetchContributions } from "@/github";
import { renderWallpaper } from "@/render";
import { getCached, setCache } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const user = searchParams.get("user");
  const theme = searchParams.get("theme") || "classic";
  const statsParam = searchParams.get("stats");

  if (!user) {
    return NextResponse.json(
      { error: "Missing required parameter: user" },
      { status: 400 }
    );
  }

  const stats = statsParam !== "false";
  const cacheKey = `preview:${user}:${theme}:${stats}`;

  try {
    let png = getCached(cacheKey);
    if (!png) {
      const calendar = await fetchContributions(user);
      png = renderWallpaper(calendar, {
        theme,
        device: "preview",
        stats,
        user,
      });
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
    console.error(`Error generating preview for ${user}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
