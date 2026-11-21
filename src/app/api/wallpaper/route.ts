import { NextRequest, NextResponse } from "next/server";
import { buildWallpaperResponse } from "@/lib/wallpaperResponse";

// Upper bound on a custom (Android) canvas edge. The largest real device is
// 1440×3216; 4096 leaves generous headroom while preventing a single crafted
// URL from requesting a multi-gigabyte allocation that would OOM the host.
const MAX_DIMENSION = 4096;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const user = searchParams.get("user");
  const theme = searchParams.get("theme") || "classic";
  const statsParam = searchParams.get("stats");
  const positionParam = searchParams.get("usernamePosition");

  const usernamePosition =
    positionParam === "top" || positionParam === "hidden"
      ? positionParam
      : "bottom";
  const device = searchParams.get("device") || "iphone14";
  const shape = searchParams.get("shape") === "circle" ? "circle" : "box";

  // Custom width/height override (for Android devices)
  const widthParam = searchParams.get("width");
  const heightParam = searchParams.get("height");

  if (!user) {
    return NextResponse.json(
      { error: "Missing required parameter: user" },
      { status: 400 }
    );
  }

  const stats = statsParam !== "false";

  // If either dimension is supplied we treat it as a custom-size request and
  // require both to be valid, positive, bounded integers. This rejects garbage
  // (NaN → would otherwise silently fall back to an iPhone canvas) and caps the
  // allocation size instead of trusting the URL.
  if (widthParam !== null || heightParam !== null) {
    const customWidth = Number(widthParam);
    const customHeight = Number(heightParam);
    if (
      !Number.isInteger(customWidth) ||
      !Number.isInteger(customHeight) ||
      customWidth < 1 ||
      customHeight < 1 ||
      customWidth > MAX_DIMENSION ||
      customHeight > MAX_DIMENSION
    ) {
      return NextResponse.json(
        {
          error: `width and height must be integers between 1 and ${MAX_DIMENSION}`,
        },
        { status: 400 }
      );
    }

    const cacheKey =
      `${user}:${theme}:${stats}:custom:${customWidth}x${customHeight}:${shape}:${usernamePosition}`;
    return buildWallpaperResponse(
      user,
      cacheKey,
      { theme, stats, user, shape, customWidth, customHeight, usernamePosition },
      "wallpaper"
    );
  }

  const cacheKey =
    `${user}:${theme}:${stats}:${device}:${shape}:${usernamePosition}`;
  return buildWallpaperResponse(
    user,
    cacheKey,
    { theme, device, stats, user, shape, usernamePosition },
    "wallpaper"
  );
}
