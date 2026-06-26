import type { CanvasRenderingContext2D } from "canvas";

// One Piece cell renderer. Each contribution cell is drawn as a 16×16 pixel-art
// icon whose appearance scales with the day's activity level (-1 empty … 3 busiest).

export type OnePieceVariant = "jollyroger" | "devilfruit" | "strawhat";

export const ONEPIECE_VARIANTS: OnePieceVariant[] = [
  "jollyroger",
  "devilfruit",
  "strawhat",
];

const GRID = 16;

function rect(
  ctx: CanvasRenderingContext2D,
  ox: number, oy: number, u: number,
  c0: number, r0: number, c1: number, r1: number,
  color: string
) {
  const x0 = Math.round(ox + c0 * u);
  const x1 = Math.round(ox + (c1 + 1) * u);
  const y0 = Math.round(oy + r0 * u);
  const y1 = Math.round(oy + (r1 + 1) * u);
  ctx.fillStyle = color;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}

function dot(ctx: CanvasRenderingContext2D, ox: number, oy: number, u: number, c: number, r: number, color: string) {
  rect(ctx, ox, oy, u, c, r, c, r, color);
}

function noiseFill(
  ctx: CanvasRenderingContext2D, ox: number, oy: number, u: number,
  base: string, light: string, dark: string, darkest: string, seed: number
) {
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const h = (c * 7 + r * 13 + seed * 5 + ((c * c + r) % 3)) % 7;
      let col = base;
      if (h === 2) col = light;
      else if (h === 4) col = dark;
      else if (h === 6) col = darkest;
      dot(ctx, ox, oy, u, c, r, col);
    }
  }
}

// ── 1. JOLLY ROGER: sea → skull (dim→bright) + crossbones ────────────────────

const SKULL_COLORS = ["#2a2a52", "#5a5a9e", "#9898d8", "#e8e8ff"] as const;

function drawSkull(
  ctx: CanvasRenderingContext2D, ox: number, oy: number, u: number,
  sk: string, bg: string
) {
  // head — wide oval
  rect(ctx, ox, oy, u, 4, 0, 11, 0, sk);
  rect(ctx, ox, oy, u, 2, 1, 13, 1, sk);
  rect(ctx, ox, oy, u, 1, 2, 14, 6, sk);
  rect(ctx, ox, oy, u, 2, 7, 13, 7, sk);

  // left eye socket
  rect(ctx, ox, oy, u, 2, 3, 4, 5, bg);
  // right eye socket
  rect(ctx, ox, oy, u, 10, 3, 12, 5, bg);

  // nose
  dot(ctx, ox, oy, u, 7, 5, bg);
  dot(ctx, ox, oy, u, 8, 5, bg);

  // jaw gap
  rect(ctx, ox, oy, u, 3, 7, 12, 7, bg);
  // teeth
  for (let c = 3; c <= 12; c += 2) dot(ctx, ox, oy, u, c, 7, sk);
}

function drawCrossbones(
  ctx: CanvasRenderingContext2D, ox: number, oy: number, u: number, sk: string
) {
  // \ diagonal
  rect(ctx, ox, oy, u, 0, 9, 1, 10, sk);
  rect(ctx, ox, oy, u, 2, 11, 3, 12, sk);
  rect(ctx, ox, oy, u, 4, 13, 5, 14, sk);
  // / diagonal
  rect(ctx, ox, oy, u, 14, 9, 15, 10, sk);
  rect(ctx, ox, oy, u, 12, 11, 13, 12, sk);
  rect(ctx, ox, oy, u, 10, 13, 11, 14, sk);
  // centre knot
  rect(ctx, ox, oy, u, 6, 11, 9, 12, sk);
}

function drawJollyRoger(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number,
  level: number, seed: number
) {
  const u = size / GRID;
  const BG = "#0b1828";

  if (level === -1) {
    noiseFill(ctx, x, y, u, "#071422", "#0a1e32", "#050e18", "#030a10", seed);
    return;
  }

  rect(ctx, x, y, u, 0, 0, 15, 15, BG);
  const sk = SKULL_COLORS[level];
  drawSkull(ctx, x, y, u, sk, BG);
  if (level >= 2) drawCrossbones(ctx, x, y, u, sk);
  if (level === 3) {
    dot(ctx, x, y, u, 4, 1, "#ffffff");
    dot(ctx, x, y, u, 5, 0, "#ffffff");
  }
}

// ── 2. DEVIL FRUIT: stone → swirly fruit (purple → magenta glow) ─────────────

const DF = [
  { skin: "#4a1068", mid: "#6a1890", hi: "#8a28b8", swirl: "#a838d8", glow: "#c050e8" },
  { skin: "#6a18a0", mid: "#8a28c8", hi: "#aa40e8", swirl: "#c860f8", glow: "#e078ff" },
  { skin: "#8a28c8", mid: "#aa48e8", hi: "#cc68ff", swirl: "#e080ff", glow: "#f4a8ff" },
  { skin: "#aa40e8", mid: "#cc70ff", hi: "#e898ff", swirl: "#f8b8ff", glow: "#ffd8ff" },
] as const;

function drawDevilFruit(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number,
  level: number, seed: number
) {
  const u = size / GRID;

  if (level === -1) {
    noiseFill(ctx, x, y, u, "#281840", "#321e50", "#1e1030", "#160a24", seed);
    return;
  }

  const BG = "#10081e";
  rect(ctx, x, y, u, 0, 0, 15, 15, BG);
  const f = DF[level];

  // fruit body — roundish
  rect(ctx, x, y, u, 4, 1, 11, 1, f.skin);
  rect(ctx, x, y, u, 2, 2, 13, 2, f.skin);
  rect(ctx, x, y, u, 1, 3, 14, 12, f.skin);
  rect(ctx, x, y, u, 2, 13, 13, 13, f.skin);
  rect(ctx, x, y, u, 4, 14, 11, 14, f.skin);

  // characteristic swirl (anticlockwise spiral)
  rect(ctx, x, y, u, 4, 5, 11, 5, f.swirl);       // top arc
  rect(ctx, x, y, u, 4, 5, 4, 9, f.swirl);         // left side
  rect(ctx, x, y, u, 4, 9, 9, 9, f.swirl);         // inner bottom
  rect(ctx, x, y, u, 9, 7, 9, 9, f.swirl);         // inner right
  dot(ctx, x, y, u, 7, 7, f.mid);                  // centre dot

  // highlight (top-left sheen)
  rect(ctx, x, y, u, 4, 3, 7, 3, f.hi);
  dot(ctx, x, y, u, 4, 4, f.hi);
  dot(ctx, x, y, u, 3, 5, f.hi);

  // bumps (devil fruits have a bumpy exterior)
  const bumps: [number, number][] = [[2, 4], [12, 4], [2, 10], [12, 10], [7, 13]];
  for (const [bc, br] of bumps) dot(ctx, x, y, u, bc, br, f.glow);

  // stem
  rect(ctx, x, y, u, 7, 0, 8, 0, "#2a5a1e");
  dot(ctx, x, y, u, 9, 1, "#2a5a1e");
}

// ── 3. STRAW HAT: wood deck → straw hat with red band ────────────────────────

const SH = [
  { straw: "#7a6420", band: "#6e1808", hi: "#9a8030" },
  { straw: "#b09030", band: "#b02820", hi: "#d4ae3e" },
  { straw: "#d4b040", band: "#cc3828", hi: "#eece5a" },
  { straw: "#f0cc50", band: "#e84838", hi: "#fff07a" },
] as const;

function drawStrawHat(
  ctx: CanvasRenderingContext2D, x: number, y: number, size: number,
  level: number, seed: number
) {
  const u = size / GRID;

  if (level === -1) {
    // dark wood ship deck
    noiseFill(ctx, x, y, u, "#3e2a14", "#4e3418", "#2e1e0e", "#221608", seed);
    rect(ctx, x, y, u, 0, 5, 15, 5, "#2a1a08");
    rect(ctx, x, y, u, 0, 10, 15, 10, "#2a1a08");
    return;
  }

  const BG = "#180c00";
  rect(ctx, x, y, u, 0, 0, 15, 15, BG);
  const s = SH[level];

  // dome top
  rect(ctx, x, y, u, 5, 0, 10, 0, s.straw);
  rect(ctx, x, y, u, 4, 1, 11, 1, s.straw);
  rect(ctx, x, y, u, 3, 2, 12, 2, s.straw);
  rect(ctx, x, y, u, 3, 3, 12, 5, s.straw);
  rect(ctx, x, y, u, 4, 6, 11, 6, s.straw);

  // red band (the iconic part)
  rect(ctx, x, y, u, 2, 7, 13, 8, s.band);
  // band highlight
  rect(ctx, x, y, u, 2, 7, 13, 7, s.band === "#6e1808" ? "#881e0e" : "#ff6050");

  // wide brim
  rect(ctx, x, y, u, 0, 9, 15, 9, s.straw);
  rect(ctx, x, y, u, 0, 10, 15, 10, s.straw);
  rect(ctx, x, y, u, 1, 11, 14, 11, s.straw);

  // straw highlights on dome
  rect(ctx, x, y, u, 5, 2, 8, 3, s.hi);
  dot(ctx, x, y, u, 5, 1, s.hi);

  // straw texture on brim
  for (let c = 1; c < 15; c += 3) dot(ctx, x, y, u, c, 10, s.hi);
}

// ── dispatch ──────────────────────────────────────────────────────────────────

const RENDERERS: Record<
  OnePieceVariant,
  (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, level: number, seed: number) => void
> = {
  jollyroger: drawJollyRoger,
  devilfruit: drawDevilFruit,
  strawhat: drawStrawHat,
};

export function drawOnePieceCell(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  level: number,
  variant: OnePieceVariant,
  seed: number
) {
  (RENDERERS[variant] ?? drawJollyRoger)(ctx, x, y, size, level, seed);
}
