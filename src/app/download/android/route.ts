import { NextRequest, NextResponse } from "next/server";

// Stable download link for the Android app. The signed APK ships with the
// site as public/gitwall.apk, so it is served from the same host as the
// website. Set ANDROID_APK_URL to point somewhere else when self-hosting.
export async function GET(request: NextRequest) {
  const target = process.env.ANDROID_APK_URL || new URL("/gitwall.apk", request.nextUrl.origin).toString();
  return NextResponse.redirect(target, 302);
}
