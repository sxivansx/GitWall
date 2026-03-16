import { NextResponse } from "next/server";
import { DEVICES } from "@/devices";

export async function GET() {
  const devices = Object.entries(DEVICES)
    .filter(([id]) => id !== "preview")
    .map(([id, d]) => ({ id, name: d.name, width: d.width, height: d.height }));
  return NextResponse.json(devices);
}
