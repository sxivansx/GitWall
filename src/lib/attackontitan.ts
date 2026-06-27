// Attack on Titan theme variants. The actual drawing (full-canvas wallpaper
// scene + picker thumbnails) lives in ./aotScene — each variant is a painted
// "hero" composited over a contribution-grid Wall, not a per-cell icon.

export type AttackOnTitanVariant =
  | "wingsoffreedom"
  | "militarypolice"
  | "garrison"
  | "cadetcorps"
  | "colossal"
  | "attacktitan";

export const ATTACKONTITAN_VARIANTS: AttackOnTitanVariant[] = [
  "wingsoffreedom",
  "militarypolice",
  "garrison",
  "cadetcorps",
  "colossal",
  "attacktitan",
];
