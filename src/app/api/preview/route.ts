import { NextRequest, NextResponse } from "next/server";
import { buildWallpaperResponse } from "@/lib/wallpaperResponse";

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
  const shape = searchParams.get("shape") === "circle" ? "circle" : "box";

  if (!user) {
    return NextResponse.json(
      { error: "Missing required parameter: user" },
      { status: 400 }
    );
  }

  const stats = statsParam !== "false";
  const cacheKey =
    `preview:${user}:${theme}:${stats}:${shape}:${usernamePosition}`;

  return buildWallpaperResponse(
    user,
    cacheKey,
    { theme, device: "preview", stats, user, shape, usernamePosition },
    "preview"
  );
}
