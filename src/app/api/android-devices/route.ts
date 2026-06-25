import { NextResponse } from "next/server";
import { ANDROID_DEVICES } from "@/devices";

export async function GET() {
  return NextResponse.json(ANDROID_DEVICES);
}
