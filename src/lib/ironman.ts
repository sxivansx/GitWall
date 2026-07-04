import type { CanvasRenderingContext2D } from "canvas";

// Iron Man cell renderer. Each contribution cell is drawn as a 16×16 pixel-art
// Iron Man helmet whose appearance scales with the day's activity level
// (-1 empty … 3 busiest): the armour brightens and the eyes power up from dark
// to a full glow. Each variant is a different armour mark; "mixed" upgrades the
// mark with the level itself — Mk I on quiet days up to Mk LXXXV on the busiest,
// so a single wallpaper shows the whole Hall of Armor.

export type IronmanVariant = "mk1" | "mk2" | "mk3" | "mk42" | "mk85" | "mixed";

export const IRONMAN_VARIANTS: IronmanVariant[] = [
  "mk3",
  "mk1",
  "mk2",
  "mk42",
  "mk85",
  "mixed",
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

// Workshop-floor plating behind empty days, shared by every mark.
function workshopFloor(ctx: CanvasRenderingContext2D, x: number, y: number, u: number, seed: number) {
  noiseFill(ctx, x, y, u, "#14171b", "#1b1f24", "#0f1114", "#0a0c0e", seed);
}

// Cell backdrop behind the helmet (the Hall of Armor's dark display alcove).
const BG = "#0d1016";

// ── mark palettes ────────────────────────────────────────────────────────────
// Each colour is a 4-step ramp indexed by activity level (0 dim … 3 brightest).

type Ramp = [string, string, string, string];

interface MarkStyle {
  shell: Ramp;      // helmet body
  shellDark: Ramp;  // shell shading / seams
  shellHi: Ramp;    // crown highlight
  face: Ramp;       // faceplate
  faceDark: Ramp;   // faceplate shading (brow, mouth surround, chin)
  eyes: Ramp;       // eye slits, dark → full glow
  glow: string;     // halo dots around lit eyes at level 3
  mouth: string;
  accent?: Ramp;    // extra trim colour (Mk XLII's red striping)
}

// Mk I — the cave build: rough hammered iron, rivets, slit eyes.
const MK1: MarkStyle = {
  shell: ["#3e4246", "#4e5358", "#61676d", "#7a8188"],
  shellDark: ["#2a2d30", "#35383c", "#43474c", "#54595e"],
  shellHi: ["#565b60", "#6a7076", "#7f868d", "#9aa2aa"],
  face: ["#4a4e52", "#5c6166", "#71777d", "#8c939a"],
  faceDark: ["#33363a", "#404448", "#4f5459", "#62676d"],
  eyes: ["#202224", "#7a7a58", "#c8c8a0", "#fff8d8"],
  glow: "#b8b284",
  mouth: "#232528",
};

// Mk II — the flight prototype: bare polished chrome.
const MK2: MarkStyle = {
  shell: ["#565e66", "#6b747d", "#87919b", "#a8b4be"],
  shellDark: ["#3a4046", "#4a5158", "#5d656d", "#747d86"],
  shellHi: ["#78828c", "#939ea8", "#b0bcc6", "#d2dce4"],
  face: ["#626a72", "#79828c", "#98a2ac", "#bcc8d2"],
  faceDark: ["#464c53", "#565e66", "#6d757e", "#88919a"],
  eyes: ["#23272b", "#5a7a8c", "#a8d4e8", "#e8faff"],
  glow: "#8cc4da",
  mouth: "#2b3036",
};

// Mk III — the icon: hot-rod red shell, gold faceplate.
const MK3: MarkStyle = {
  shell: ["#5c1410", "#871a14", "#b62518", "#e63a22"],
  shellDark: ["#3d0d0a", "#5a120d", "#7d1910", "#a02414"],
  shellHi: ["#7a1f16", "#a8301c", "#d4462a", "#ff6a42"],
  face: ["#7a5a16", "#a3781e", "#cf9c28", "#f2c136"],
  faceDark: ["#57400f", "#755615", "#96701c", "#b58a24"],
  eyes: ["#26221a", "#8a8468", "#d8d4b8", "#ffffff"],
  glow: "#c8c4a0",
  mouth: "#3a2c10",
};

// Mk XLII — the house-party protocol: gold-dominant plating, red striping.
const MK42: MarkStyle = {
  shell: ["#6e5414", "#97731c", "#c29726", "#e9bd34"],
  shellDark: ["#4c3a0e", "#6a5013", "#886a1a", "#a88422"],
  shellHi: ["#8e701c", "#b89426", "#e0b930", "#ffdc52"],
  face: ["#7c6018", "#a88020", "#d4a82a", "#f8cc3c"],
  faceDark: ["#553f0c", "#755a12", "#947418", "#b58e1e"],
  eyes: ["#26221a", "#8a8468", "#d8d4b8", "#ffffff"],
  glow: "#c8c4a0",
  mouth: "#3a2c10",
  accent: ["#6e1812", "#96201a", "#c22c20", "#e83a28"],
};

// Mk LXXXV — the Endgame nano-suit: deep crimson, rich gold, cold blue eyes.
const MK85: MarkStyle = {
  shell: ["#4c0e1a", "#701527", "#9c1c30", "#cc283c"],
  shellDark: ["#320a12", "#4a0e18", "#67121e", "#881826"],
  shellHi: ["#68182a", "#8e2038", "#ba2c44", "#ea3c52"],
  face: ["#7a5c12", "#a67e1a", "#d2a424", "#f8cc38"],
  faceDark: ["#553f0c", "#755a12", "#947418", "#b58e1e"],
  eyes: ["#22262a", "#5a8ca0", "#a8e0f0", "#eafcff"],
  glow: "#7ec2d8",
  mouth: "#402e0c",
};

type MarkId = Exclude<IronmanVariant, "mixed">;

const MARKS: Record<MarkId, MarkStyle> = {
  mk1: MK1,
  mk2: MK2,
  mk3: MK3,
  mk42: MK42,
  mk85: MK85,
};

// ── the helmet ───────────────────────────────────────────────────────────────
// One shared 16×16 silhouette; palette + small per-mark details tell the marks
// apart. `lvl` indexes every ramp, so the whole helmet brightens together.

function drawHelmet(
  ctx: CanvasRenderingContext2D, ox: number, oy: number, u: number,
  mark: MarkId, lvl: number
) {
  const m = MARKS[mark];
  const shell = m.shell[lvl];
  const sDark = m.shellDark[lvl];
  const sHi = m.shellHi[lvl];
  const face = m.face[lvl];
  const fDark = m.faceDark[lvl];
  const eye = m.eyes[lvl];

  // crown
  rect(ctx, ox, oy, u, 5, 0, 10, 0, sHi);
  rect(ctx, ox, oy, u, 3, 1, 12, 1, shell);
  rect(ctx, ox, oy, u, 2, 2, 13, 2, shell);
  dot(ctx, ox, oy, u, 2, 2, sDark);
  dot(ctx, ox, oy, u, 13, 2, sDark);

  // forehead: red temples clasping a narrow gold peak
  rect(ctx, ox, oy, u, 1, 3, 4, 3, shell);
  rect(ctx, ox, oy, u, 11, 3, 14, 3, shell);
  rect(ctx, ox, oy, u, 5, 3, 10, 3, face);

  // side panels straight down the cheeks
  rect(ctx, ox, oy, u, 1, 4, 2, 9, shell);
  rect(ctx, ox, oy, u, 13, 4, 14, 9, shell);
  rect(ctx, ox, oy, u, 1, 6, 1, 9, sDark);
  rect(ctx, ox, oy, u, 14, 6, 14, 9, sDark);

  // jaw, tapering to a squared chin
  dot(ctx, ox, oy, u, 2, 10, shell);
  dot(ctx, ox, oy, u, 13, 10, shell);
  rect(ctx, ox, oy, u, 2, 11, 3, 11, shell);
  rect(ctx, ox, oy, u, 12, 11, 13, 11, shell);
  dot(ctx, ox, oy, u, 3, 12, shell);
  dot(ctx, ox, oy, u, 12, 12, shell);
  dot(ctx, ox, oy, u, 4, 13, shell);
  dot(ctx, ox, oy, u, 11, 13, shell);
  rect(ctx, ox, oy, u, 5, 14, 10, 14, sDark); // red under-jaw shadow

  // faceplate
  rect(ctx, ox, oy, u, 3, 4, 12, 9, face);
  rect(ctx, ox, oy, u, 3, 10, 12, 10, face);
  rect(ctx, ox, oy, u, 4, 11, 11, 11, face);
  rect(ctx, ox, oy, u, 4, 12, 11, 12, face);
  rect(ctx, ox, oy, u, 5, 13, 10, 13, face);

  // brow ridges over the eyes
  rect(ctx, ox, oy, u, 3, 4, 6, 4, fDark);
  rect(ctx, ox, oy, u, 9, 4, 12, 4, fDark);

  // eye slits
  rect(ctx, ox, oy, u, 3, 5, 6, 6, eye);
  rect(ctx, ox, oy, u, 9, 5, 12, 6, eye);

  // cheek seams under the outer eye corners
  dot(ctx, ox, oy, u, 3, 7, fDark);
  dot(ctx, ox, oy, u, 12, 7, fDark);

  // mouth slit
  rect(ctx, ox, oy, u, 5, 10, 10, 10, m.mouth);

  // ── per-mark details ──
  if (mark === "mk1") {
    // crude plate seam down the crown + rivets; eyes are narrow slits
    rect(ctx, ox, oy, u, 7, 0, 7, 2, sDark);
    dot(ctx, ox, oy, u, 2, 4, sDark);
    dot(ctx, ox, oy, u, 13, 4, sDark);
    dot(ctx, ox, oy, u, 2, 9, sDark);
    dot(ctx, ox, oy, u, 13, 9, sDark);
    rect(ctx, ox, oy, u, 3, 6, 6, 6, face);
    rect(ctx, ox, oy, u, 9, 6, 12, 6, face);
  } else if (mark === "mk2") {
    // machined panel joints on the crown and side vents
    dot(ctx, ox, oy, u, 5, 2, sDark);
    dot(ctx, ox, oy, u, 8, 2, sDark);
    dot(ctx, ox, oy, u, 11, 2, sDark);
    dot(ctx, ox, oy, u, 1, 5, sDark);
    dot(ctx, ox, oy, u, 14, 5, sDark);
  } else if (mark === "mk42") {
    // red striping: crown stripe, jaw accents, chin dots
    const a = m.accent![lvl];
    rect(ctx, ox, oy, u, 6, 0, 9, 2, a);
    dot(ctx, ox, oy, u, 2, 8, a);
    dot(ctx, ox, oy, u, 13, 8, a);
    dot(ctx, ox, oy, u, 3, 11, a);
    dot(ctx, ox, oy, u, 12, 11, a);
    dot(ctx, ox, oy, u, 7, 13, a);
    dot(ctx, ox, oy, u, 8, 13, a);
  } else if (mark === "mk85") {
    // gold peak on the crown and gold jaw hinges
    rect(ctx, ox, oy, u, 6, 1, 9, 2, face);
    dot(ctx, ox, oy, u, 2, 9, face);
    dot(ctx, ox, oy, u, 13, 9, face);
    dot(ctx, ox, oy, u, 3, 11, face);
    dot(ctx, ox, oy, u, 12, 11, face);
  }

  // full power-up at level 3: eye glow bleeding onto the cheeks + crown glint
  if (lvl === 3) {
    dot(ctx, ox, oy, u, 2, 5, m.glow);
    dot(ctx, ox, oy, u, 13, 5, m.glow);
    dot(ctx, ox, oy, u, 4, 1, sHi);
    dot(ctx, ox, oy, u, 3, 2, sHi);
  }
}

// "mixed" upgrades the armour with the level: Mk I → Mk II → Mk III / Mk XLII
// (alternating by grid position) → Mk LXXXV.
function mixedMark(level: number, seed: number): MarkId {
  if (level <= 0) return "mk1";
  if (level === 1) return "mk2";
  if (level === 2) return seed % 2 === 0 ? "mk3" : "mk42";
  return "mk85";
}

export function drawIronmanCell(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  level: number,
  variant: IronmanVariant,
  seed: number
) {
  const u = size / GRID;
  if (level === -1) {
    workshopFloor(ctx, x, y, u, seed);
    return;
  }
  rect(ctx, x, y, u, 0, 0, 15, 15, BG);
  const mark = variant === "mixed" ? mixedMark(level, seed) : variant;
  drawHelmet(ctx, x, y, u, mark, level);
}
