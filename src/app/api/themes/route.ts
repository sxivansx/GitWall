import { NextResponse } from "next/server";
import { THEMES } from "@/themes";

export async function GET() {
  const themes = Object.entries(THEMES).map(([id, t]) => ({
    id,
    name: t.name,
    colors: t.levels,
    background: t.background,
  }));
  return NextResponse.json(themes);
}
