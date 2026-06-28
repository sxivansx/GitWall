import { Image, createCanvas, type CanvasRenderingContext2D } from "canvas";
import fs from "fs";
import path from "path";
import type { PokemonVariant } from "./pokemon";

// Full-canvas Pokémon wallpaper: a retro Pokédex handheld whose Game Boy-style
// screen shows the featured Pokémon (posterized to four shades) up top and your
// contribution grid as chunky pixels on a recessed panel below. Each variant is
// a different Pokémon with its own device colour and screen tint.

const TAU = Math.PI * 2;

export interface PokemonSceneArgs {
  width: number;
  height: number;
  gridLeft: number;
  gridTop: number;
  numCols: number;
  numRows: number;
  cellSize: number;
  cellStep: number;
  cornerRadius: number;
  levels: number[];
  variant: PokemonVariant;
}

interface Grade {
  art: string;
  no: string;
  name: string;
  body: [string, string]; // body gradient top/bottom
  rim: string; // screen bezel
  screen: [string, string, string, string]; // 4-shade palette, dark→light
  lens: string;
}

const GRADES: Record<PokemonVariant, Grade> = {
  pikachu: { art: "pikachu", no: "025", name: "PIKACHU", body: ["#e8b81c", "#b88c0e"], rim: "#7a5c08", screen: ["#2a2406", "#6e5e12", "#c2a426", "#f2d63e"], lens: "#39a0c8" },
  charizard: { art: "charizard", no: "006", name: "CHARIZARD", body: ["#d4452a", "#9c2a18"], rim: "#6e1c10", screen: ["#341206", "#7a3010", "#c86420", "#f4a23a"], lens: "#39a0c8" },
  mewtwo: { art: "mewtwo", no: "150", name: "MEWTWO", body: ["#7a52b0", "#4e3076"], rim: "#33204e", screen: ["#241636", "#4c2c74", "#8a4cc2", "#caa0f0"], lens: "#c85ad0" },
  rayquaza: { art: "rayquaza", no: "384", name: "RAYQUAZA", body: ["#2f9a52", "#1c5e34"], rim: "#123f22", screen: ["#0f380f", "#306230", "#73a92f", "#9bbc0c"], lens: "#39c87a" },
};

// --- colour helpers ---------------------------------------------------------
function hexRgb(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}
function mix(a: string, b: string, t: number): string {
  const A = hexRgb(a), B = hexRgb(b);
  const r = clamp255(A[0] + (B[0] - A[0]) * t);
  const g = clamp255(A[1] + (B[1] - A[1]) * t);
  const bl = clamp255(A[2] + (B[2] - A[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

// Six clearly separated steps for the contribution grid: a dark panel floor, a
// visible "empty" cell, then four filled intensities. Level 0 used to collapse
// into the screen background — this keeps every step distinct.
function gridRamp(g: Grade) {
  const s = g.screen;
  // Panel floor darkest, empty cells one clear step up (the screen base), then a
  // full one-step jump to level 1 — keeps empty vs filled obvious on every body.
  return {
    floor: mix(s[0], "#000000", 0.55),
    empty: s[0],
    fill: [s[1], mix(s[1], s[2], 0.5), s[2], s[3]] as const,
  };
}

const ART_CACHE: Record<string, Image | null> = {};
function getArt(name: string): Image | null {
  if (!(name in ART_CACHE)) {
    try {
      const img = new Image();
      img.src = fs.readFileSync(path.join(process.cwd(), "assets", "pokemon", `${name}.png`));
      ART_CACHE[name] = img;
    } catch {
      ART_CACHE[name] = null;
    }
  }
  return ART_CACHE[name];
}

// Posterize the artwork to the variant's 4-shade screen palette (cached per size).
const POST_CACHE: Record<string, ReturnType<typeof createCanvas> | null> = {};
function posterize(g: Grade, w: number, h: number) {
  const key = `${g.art}:${w}x${h}`;
  if (key in POST_CACHE) return POST_CACHE[key];
  const img = getArt(g.art);
  if (!img || !img.width) { POST_CACHE[key] = null; return null; }
  const cv = createCanvas(w, h);
  const t = cv.getContext("2d");
  const scale = Math.min((w * 0.92) / img.width, (h * 0.96) / img.height);
  const aw = img.width * scale, ah = img.height * scale;
  t.drawImage(img, (w - aw) / 2, (h - ah) / 2, aw, ah);
  const id = t.getImageData(0, 0, w, h);
  const d = id.data;
  const cols = g.screen.map((c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]);
  for (let p = 0; p < d.length; p += 4) {
    if (d[p + 3] < 40) continue;
    const lum = (d[p] * 0.299 + d[p + 1] * 0.587 + d[p + 2] * 0.114) / 255;
    const idx = lum < 0.32 ? 1 : lum < 0.58 ? 2 : 3;
    d[p] = cols[idx][0]; d[p + 1] = cols[idx][1]; d[p + 2] = cols[idx][2]; d[p + 3] = 235;
  }
  t.putImageData(id, 0, 0);
  POST_CACHE[key] = cv;
  return cv;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function renderPokemonScene(ctx: CanvasRenderingContext2D, a: PokemonSceneArgs): void {
  const { width: W, height: H, levels } = a;
  const g = GRADES[a.variant];
  const ramp = gridRamp(g);

  // Backdrop behind the device.
  ctx.fillStyle = "#07090d";
  ctx.fillRect(0, 0, W, H);

  // Device body.
  const bx = W * 0.05, by = H * 0.03, bw = W * 0.9, bh = H * 0.94;
  const corner = W * 0.075;
  const bg = ctx.createLinearGradient(0, by, 0, by + bh);
  bg.addColorStop(0, g.body[0]);
  bg.addColorStop(1, g.body[1]);
  rr(ctx, bx, by, bw, bh, corner);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.lineWidth = Math.max(1, W * 0.005);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.stroke();
  // top sheen
  ctx.save();
  rr(ctx, bx, by, bw, bh, corner);
  ctx.clip();
  const sheen = ctx.createLinearGradient(0, by, 0, by + bh * 0.4);
  sheen.addColorStop(0, "rgba(255,255,255,0.16)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(bx, by, bw, bh * 0.4);
  ctx.restore();

  // Lens (top-left).
  const lx = bx + W * 0.11, ly = by + H * 0.052, lr = W * 0.062;
  ctx.beginPath(); ctx.arc(lx, ly, lr, 0, TAU); ctx.fillStyle = "#f2f2f2"; ctx.fill();
  ctx.beginPath(); ctx.arc(lx, ly, lr * 0.78, 0, TAU); ctx.fillStyle = g.lens; ctx.fill();
  ctx.beginPath(); ctx.arc(lx - lr * 0.28, ly - lr * 0.28, lr * 0.26, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.fill();

  // Screen bezel + screen.
  const mx = bx + W * 0.06, my = by + H * 0.105, mw = bw - W * 0.12, mh = H * 0.5;
  rr(ctx, mx, my, mw, mh, W * 0.04); ctx.fillStyle = g.rim; ctx.fill();
  const inset = W * 0.035;
  const sx = mx + inset, sy = my + inset, sw = mw - inset * 2, sh = mh - inset * 2;
  rr(ctx, sx, sy, sw, sh, W * 0.025); ctx.fillStyle = g.screen[0]; ctx.fill();

  // Zone split inside the screen: sprite on top, contribution grid on a recessed
  // panel below, a hard divider between them so the sprite never bleeds in.
  const spriteH = sh * 0.50;
  const dividerY = sy + spriteH;
  const gridTopY = dividerY + sh * 0.02;
  const gridBotY = sy + sh - W * 0.025;

  // --- sprite zone -----------------------------------------------------------
  ctx.save();
  rr(ctx, sx, sy, sw, spriteH, W * 0.025);
  ctx.clip();
  ctx.globalAlpha = 0.16; ctx.fillStyle = g.screen[1]; ctx.fillRect(sx, sy, sw, spriteH); ctx.globalAlpha = 1;
  const post = posterize(g, Math.round(sw), Math.round(spriteH));
  if (post) ctx.drawImage(post, sx, sy);
  // dex label, with a shadow so it reads over the sprite
  ctx.textAlign = "left";
  ctx.font = `bold ${Math.round(W * 0.034)}px monospace`;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillText(`No.${g.no}  ${g.name}`, sx + W * 0.03 + 2, sy + W * 0.05 + 2);
  ctx.fillStyle = g.screen[3];
  ctx.fillText(`No.${g.no}  ${g.name}`, sx + W * 0.03, sy + W * 0.05);
  ctx.restore();

  // divider groove
  ctx.fillStyle = mix(g.screen[0], "#000000", 0.4);
  ctx.fillRect(sx, dividerY, sw, Math.max(2, W * 0.006));
  ctx.fillStyle = mix(g.screen[1], g.screen[2], 0.3);
  ctx.fillRect(sx, dividerY + Math.max(2, W * 0.006), sw, Math.max(1, W * 0.003));

  // --- grid zone -------------------------------------------------------------
  const gzX = sx, gzY = gridTopY, gzW = sw, gzH = gridBotY - gridTopY;
  ctx.save();
  rr(ctx, gzX, gzY, gzW, gzH, W * 0.018);
  ctx.clip();
  ctx.fillStyle = ramp.floor;
  ctx.fillRect(gzX, gzY, gzW, gzH);

  // small "activity" caption so the panel reads as data, not noise
  ctx.textAlign = "left";
  ctx.font = `bold ${Math.round(W * 0.022)}px monospace`;
  ctx.fillStyle = mix(g.screen[2], g.screen[3], 0.4);
  const capY = gzY + W * 0.04;
  ctx.fillText("ACTIVITY", gzX + W * 0.025, capY);

  // chunky contribution pixels, full rectangle (padded so no ragged edge)
  const gcols = 14;
  const padX = W * 0.025;
  const blockTop = capY + W * 0.022;
  const pstep = (gzW - padX * 2) / gcols;
  const psize = pstep * 0.86;
  const gridRows = Math.max(1, Math.floor((gzY + gzH - W * 0.025 - blockTop) / pstep));
  const capacity = gcols * gridRows;
  const data = levels.slice(-capacity); // most-recent days
  for (let i = 0; i < capacity; i++) {
    const c = i % gcols, r = Math.floor(i / gcols);
    const x = gzX + padX + c * pstep;
    const y = blockTop + r * pstep;
    const lv = i < data.length ? data[i] : -1;
    ctx.fillStyle = lv < 0 ? ramp.empty : ramp.fill[lv];
    ctx.beginPath();
    ctx.roundRect(x, y, psize, psize, psize * 0.12);
    ctx.fill();
  }
  ctx.restore();

  // scanlines over the whole screen
  ctx.save();
  rr(ctx, sx, sy, sw, sh, W * 0.025);
  ctx.clip();
  ctx.globalAlpha = 0.05; ctx.fillStyle = "#000";
  for (let y = sy; y < sy + sh; y += 4 * (W / 393)) ctx.fillRect(sx, y, sw, Math.max(1, W / 600));
  ctx.globalAlpha = 1;
  ctx.restore();

  // Controls: chunky d-pad (left) + two round A/B buttons (right). Beveled with a
  // dark recess and a light top rim so they read as buttons on any body colour.
  const cyc = my + mh + (H * 0.86 - (my + mh)) * 0.45;
  const ctrlBase = mix(g.body[1], "#000000", 0.58);
  const ctrlHi = "rgba(255,255,255,0.28)";
  const ctrlShadow = "rgba(0,0,0,0.55)";

  // d-pad
  const dpx = bx + W * 0.2, arm = W * 0.22, thick = W * 0.06, rad = thick * 0.28;
  const drawCross = (ox: number, oy: number, fill: string) => {
    rr(ctx, dpx - arm / 2 + ox, cyc - thick / 2 + oy, arm, thick, rad); ctx.fillStyle = fill; ctx.fill();
    rr(ctx, dpx - thick / 2 + ox, cyc - arm / 2 + oy, thick, arm, rad); ctx.fillStyle = fill; ctx.fill();
  };
  drawCross(W * 0.007, W * 0.008, ctrlShadow); // drop shadow
  drawCross(0, 0, ctrlBase);
  drawCross(-W * 0.0025, -W * 0.003, ctrlHi); // top-left rim
  drawCross(0, 0, ctrlBase);
  ctx.beginPath(); ctx.arc(dpx, cyc, thick * 0.4, 0, TAU); ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fill();

  // A/B buttons
  const abx = bx + bw - W * 0.24, br = W * 0.056;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  for (const [ox, oy, label] of [[W * 0.12, W * 0.035, "A"], [0, -W * 0.035, "B"]] as const) {
    const cx = abx + (ox as number), cy = cyc + (oy as number);
    ctx.beginPath(); ctx.arc(cx + W * 0.007, cy + W * 0.008, br, 0, TAU); ctx.fillStyle = ctrlShadow; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, br, 0, TAU); ctx.fillStyle = ctrlBase; ctx.fill();
    ctx.lineWidth = Math.max(1, W * 0.004); ctx.strokeStyle = ctrlHi; ctx.stroke();
    ctx.font = `bold ${Math.round(W * 0.03)}px monospace`;
    ctx.fillStyle = mix(g.body[0], "#ffffff", 0.3);
    ctx.fillText(label, cx, cy + W * 0.002);
  }
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}

// Picker thumbnail: a mini device.
export function drawPokemonThumb(ctx: CanvasRenderingContext2D, variant: PokemonVariant, S: number) {
  const g = GRADES[variant];
  const ramp = gridRamp(g);
  ctx.fillStyle = "#07090d"; ctx.fillRect(0, 0, S, S);
  const bx = S * 0.2, by = S * 0.06, bw = S * 0.6, bh = S * 0.88;
  rr(ctx, bx, by, bw, bh, S * 0.08);
  const bg = ctx.createLinearGradient(0, by, 0, by + bh);
  bg.addColorStop(0, g.body[0]); bg.addColorStop(1, g.body[1]);
  ctx.fillStyle = bg; ctx.fill();
  // lens
  ctx.beginPath(); ctx.arc(bx + S * 0.1, by + S * 0.08, S * 0.04, 0, TAU); ctx.fillStyle = g.lens; ctx.fill();
  // screen with a few pixel rows
  const sx = bx + S * 0.07, sy = by + S * 0.16, sw = bw - S * 0.14, sh = bh * 0.52;
  rr(ctx, sx, sy, sw, sh, S * 0.02); ctx.fillStyle = g.screen[0]; ctx.fill();
  // grid panel in lower half
  const gy = sy + sh * 0.5;
  ctx.fillStyle = ramp.floor; ctx.fillRect(sx, gy, sw, sh * 0.5);
  const cols = 5, ps = (sw - S * 0.04) / cols;
  for (let r = 0; r < 3; r++) for (let c = 0; c < cols; c++) {
    const lv = (r + c) % 4;
    ctx.fillStyle = ramp.fill[lv];
    ctx.fillRect(sx + S * 0.02 + c * ps, gy + S * 0.015 + r * ps * 0.95, ps * 0.82, ps * 0.82);
  }
}
