import { Image, type CanvasRenderingContext2D } from "canvas";
import type { AttackOnTitanVariant } from "./attackontitan";
import {
  WINGS_EMBLEM_B64,
  MP_EMBLEM_B64,
  GARRISON_EMBLEM_B64,
  CADET_EMBLEM_B64,
  SCENE_COLOSSAL_B64,
  SCENE_ATTACK_B64,
} from "./aotAssets";

// Authentic regiment emblems (real artwork, decoded once). node-canvas decodes a
// PNG Buffer synchronously when assigned to Image.src.
const emblemCache: Record<string, Image> = {};
function getEmblem(key: string, b64: string): Image {
  if (!emblemCache[key]) {
    const img = new Image();
    img.src = Buffer.from(b64, "base64");
    emblemCache[key] = img;
  }
  return emblemCache[key];
}
const getWingsEmblem = () => getEmblem("wings", WINGS_EMBLEM_B64);
const getMpEmblem = () => getEmblem("mp", MP_EMBLEM_B64);
const getGarrisonEmblem = () => getEmblem("garrison", GARRISON_EMBLEM_B64);
const getCadetEmblem = () => getEmblem("cadet", CADET_EMBLEM_B64);
const stripDataUri = (s: string) => s.replace(/^data:[^,]+,/, "");
const getSceneColossal = () => getEmblem("scene_colossal", stripDataUri(SCENE_COLOSSAL_B64));
const getSceneAttack = () => getEmblem("scene_attack", stripDataUri(SCENE_ATTACK_B64));

// Full-canvas Attack on Titan wallpaper. Instead of drawing a tiny icon per
// cell, the whole screen is one composition: the contribution grid becomes the
// Wall (a day's activity = how intact/lit that stone block is), and the iconic
// hero — the Colossal Titan cresting the Wall, or the glowing Wings of Freedom —
// is painted smoothly on top, wreathed in steam, in the show's desaturated grade.

export interface AotSceneArgs {
  width: number;
  height: number;
  gridLeft: number;
  gridTop: number;
  numCols: number;
  numRows: number;
  cellSize: number;
  cellStep: number;
  cornerRadius: number;
  levels: number[]; // one per cell, row-major (-1 empty … 3 busiest)
  variant: AttackOnTitanVariant;
}

// Grey-green hardened-stone courses; brighter = more intact / catching the light.
const STONE = ["#3b443e", "#525c53", "#6a756a", "#8b958a"];
const STONE_HI = ["#4a544d", "#65706655", "#7e8a7e", "#a9b3a6"];
const STONE_LO = ["#23292600", "#2c332e", "#3a443c", "#4c564c"];
const GAP = "#0a0d10";

function fillRound(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawWall(ctx: CanvasRenderingContext2D, a: AotSceneArgs) {
  const { levels, numCols, gridLeft, gridTop, cellStep, cellSize, cornerRadius } = a;
  const bevel = Math.max(2, Math.round(cellSize * 0.1));
  for (let i = 0; i < levels.length; i++) {
    const col = i % numCols;
    const row = Math.floor(i / numCols);
    const x = gridLeft + col * cellStep;
    const y = gridTop + row * cellStep;
    const lv = levels[i];
    if (lv === -1) {
      // a missing block — a dark gap the Titans exploit
      ctx.fillStyle = GAP;
      fillRound(ctx, x, y, cellSize, cellSize, cornerRadius);
      continue;
    }
    ctx.fillStyle = STONE[lv];
    fillRound(ctx, x, y, cellSize, cellSize, cornerRadius);
    // top-left light bevel, bottom-right shadow — gives the stone depth
    ctx.fillStyle = STONE_HI[lv];
    ctx.fillRect(x + bevel, y + bevel, cellSize - 2 * bevel, bevel);
    ctx.fillRect(x + bevel, y + bevel, bevel, cellSize - 2 * bevel);
    ctx.fillStyle = STONE_LO[lv];
    ctx.fillRect(x + bevel, y + cellSize - 2 * bevel, cellSize - 2 * bevel, bevel);
    ctx.fillRect(x + cellSize - 2 * bevel, y + bevel, bevel, cellSize - 2 * bevel);
  }
}

function steamBlob(
  ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, alpha: number
) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, `rgba(214,206,196,${alpha})`);
  g.addColorStop(0.5, `rgba(190,182,172,${alpha * 0.5})`);
  g.addColorStop(1, "rgba(190,182,172,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// Draw an emblem image centered at (cx,cy) with half-width `span`, preserving
// aspect ratio.
function drawEmblemImage(
  ctx: CanvasRenderingContext2D, img: Image, cx: number, cy: number, span: number
) {
  const w = span * 2;
  const h = (img.height / img.width) * w;
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

// The Wings of Freedom emblem floating above the wall, with a sky glow behind it.
// A regiment emblem floating above the wall with a coloured sky glow behind it.
function drawEmblemScene(
  ctx: CanvasRenderingContext2D, a: AotSceneArgs, wallTop: number,
  img: Image, glowRGB: string, spanF = 0.3, cyF = 0.22
) {
  const { width } = a;
  const cx = width / 2;
  const cy = wallTop - width * cyF;
  const span = width * spanF;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, span * 2.4);
  glow.addColorStop(0, `rgba(${glowRGB},0.30)`);
  glow.addColorStop(1, `rgba(${glowRGB},0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, cy - span * 1.8, width, span * 3.8);
  drawEmblemImage(ctx, img, cx, cy, span);
}

// Full-bleed key-art scene: a real AoT still fills the sky band above the wall
// (cover-fit, no keying so no cut-out edges), graded down so the wall emerges
// from it. Used by the Titan variants instead of a pasted silhouette.
function drawSkyBandScene(
  ctx: CanvasRenderingContext2D, a: AotSceneArgs, wallTop: number,
  img: Image, tint: string
) {
  const { width } = a;
  const bandH = wallTop + a.cellSize * 1.6;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, width, bandH);
  ctx.clip();
  const scale = Math.max(width / img.width, bandH / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  ctx.drawImage(img, (width - dw) / 2, (bandH - dh) / 2, dw, dh);
  // vertical grade: mute the top to the sky colour, crush the seam into the wall
  const g = ctx.createLinearGradient(0, 0, 0, bandH);
  g.addColorStop(0, "rgba(8,9,13,0.6)");
  g.addColorStop(0.4, `rgba(${tint},0.12)`);
  g.addColorStop(0.8, "rgba(10,11,14,0.4)");
  g.addColorStop(1, "rgba(7,8,10,0.95)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, bandH);
  // side vignette so it never reads as a flat pasted rectangle
  const sv = ctx.createLinearGradient(0, 0, width, 0);
  sv.addColorStop(0, "rgba(7,8,10,0.55)");
  sv.addColorStop(0.5, "rgba(0,0,0,0)");
  sv.addColorStop(1, "rgba(7,8,10,0.55)");
  ctx.fillStyle = sv;
  ctx.fillRect(0, 0, width, bandH);
  ctx.restore();
}

export function renderAotScene(ctx: CanvasRenderingContext2D, a: AotSceneArgs) {
  const { width, height, gridTop, numRows, cellStep, cellSize } = a;
  const wallTop = gridTop;
  const wallBottom = gridTop + numRows * cellStep - (cellStep - cellSize);

  // Per-variant colour grade (sky horizon tint + bright-stone glow).
  const GRADE: Record<string, { horizon: string; glow: string }> = {
    wingsoffreedom: { horizon: "#101a22", glow: "rgba(150,180,230,0.9)" },
    militarypolice: { horizon: "#101a12", glow: "rgba(120,200,140,0.85)" },
    garrison: { horizon: "#1c1010", glow: "rgba(210,90,80,0.85)" },
    cadetcorps: { horizon: "#121821", glow: "rgba(150,175,205,0.85)" },
    colossal: { horizon: "#1a0e0c", glow: "rgba(200,80,50,0.8)" },
    attacktitan: { horizon: "#1c1408", glow: "rgba(220,150,60,0.85)" },
  };
  const grade = GRADE[a.variant] ?? GRADE.colossal;

  // 1) Sky — cold near-black, a smoulder toward the horizon line.
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#090b10");
  sky.addColorStop(0.34, "#0c1016");
  sky.addColorStop(0.52, grade.horizon);
  sky.addColorStop(1, "#070809");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // 2) Hero painted above the wall, with steam behind it.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let s = 0; s < 5; s++) {
    const sx = width * (0.5 + Math.cos(s * 2.1) * 0.22);
    steamBlob(ctx, sx, wallTop - width * 0.05 - s * 30, width * (0.18 + s * 0.03), 0.1);
  }
  ctx.restore();

  if (a.variant === "wingsoffreedom") drawEmblemScene(ctx, a, wallTop, getWingsEmblem(), "120,150,200");
  else if (a.variant === "militarypolice") drawEmblemScene(ctx, a, wallTop, getMpEmblem(), "100,180,120");
  else if (a.variant === "garrison") drawEmblemScene(ctx, a, wallTop, getGarrisonEmblem(), "190,80,70", 0.21, 0.27);
  else if (a.variant === "cadetcorps") drawEmblemScene(ctx, a, wallTop, getCadetEmblem(), "130,155,185", 0.2, 0.26);
  else if (a.variant === "attacktitan") drawSkyBandScene(ctx, a, wallTop, getSceneAttack(), "210,140,50");
  else drawSkyBandScene(ctx, a, wallTop, getSceneColossal(), "150,60,40");

  // 3) The Wall — the contribution grid as cyclopean stone.
  drawWall(ctx, a);

  // 4) Steam drifting up the face of the wall + glow on the brightest stones.
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let s = 0; s < 4; s++) {
    steamBlob(ctx, width * (0.2 + s * 0.2), wallTop + cellSize * 0.5, width * 0.14, 0.07);
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowColor = grade.glow;
  ctx.shadowBlur = Math.round(cellSize * 0.5);
  for (let i = 0; i < a.levels.length; i++) {
    if (a.levels[i] < 3) continue;
    const col = i % a.numCols, row = Math.floor(i / a.numCols);
    const x = a.gridLeft + col * cellStep, y = wallTop + row * cellStep;
    ctx.fillStyle = "rgba(150,170,150,0.35)";
    fillRound(ctx, x, y, cellSize, cellSize, a.cornerRadius);
  }
  ctx.restore();

  // 5) Vignette — crush the corners toward black for the grim AoT grade.
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const vg = ctx.createRadialGradient(width / 2, height * 0.5, height * 0.22, width / 2, height * 0.5, height * 0.62);
  vg.addColorStop(0, "rgba(255,255,255,1)");
  vg.addColorStop(1, "rgba(70,70,82,1)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  void wallBottom;
}

// Picker thumbnail: a representative mini of each variant on an S×S canvas.
export function drawAotThumb(
  ctx: CanvasRenderingContext2D, variant: AttackOnTitanVariant, S: number
) {
  ctx.fillStyle = "#0c0f14";
  ctx.fillRect(0, 0, S, S);
  if (variant === "wingsoffreedom") drawEmblemImage(ctx, getWingsEmblem(), S / 2, S * 0.5, S * 0.42);
  else if (variant === "militarypolice") drawEmblemImage(ctx, getMpEmblem(), S / 2, S * 0.5, S * 0.4);
  else if (variant === "garrison") drawEmblemImage(ctx, getGarrisonEmblem(), S / 2, S * 0.5, S * 0.44);
  else if (variant === "cadetcorps") drawEmblemImage(ctx, getCadetEmblem(), S / 2, S * 0.5, S * 0.4);
  else drawSceneThumb(ctx, variant === "attacktitan" ? getSceneAttack() : getSceneColossal(), S);
}

// Scene-variant thumbnail: cover-fit the key-art into the S×S tile with a slight
// dark grade so it sits with the emblem tiles.
function drawSceneThumb(ctx: CanvasRenderingContext2D, img: Image, S: number) {
  const scale = Math.max(S / img.width, S / img.height);
  const dw = img.width * scale, dh = img.height * scale;
  ctx.drawImage(img, (S - dw) / 2, (S - dh) / 2, dw, dh);
  const g = ctx.createLinearGradient(0, 0, 0, S);
  g.addColorStop(0, "rgba(8,9,13,0.25)");
  g.addColorStop(1, "rgba(8,9,13,0.5)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
}
