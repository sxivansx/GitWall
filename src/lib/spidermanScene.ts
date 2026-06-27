import { createCanvas, type CanvasRenderingContext2D } from "canvas";
import type { SpidermanVariant } from "./spiderman";

// Full-canvas Spider-Man wallpaper — "The Lenses". The hero motif is the mask
// eyes: two big angular lenses with a black web-line border, watching from the
// dark in the top third. Below them your contribution year is the readable grid,
// kept at the standard tile size/position of every other theme (only background
// and cell style change). Each suit restyles the lenses and the palette: classic
// = glossy white, Miles = red-rimmed + venom spark, symbiote = inverted black
// lenses with white fangs, Spider-Verse = halftone + chromatic print.

const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export interface SpidermanSceneArgs {
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
  variant: SpidermanVariant;
}

type Treatment = "classic" | "miles" | "noir" | "verse";

interface Grade {
  bgTop: string;
  bgBot: string;
  empty: string;
  ramp: [string, string, string, string];
  rampRGB: [number, number, number][];
  accent: string;
  accentRGB: string; // "r,g,b" for halos/dew
  web: string; // faint corner webbing + seam
  treatment: Treatment;
}

const GRADES: Record<SpidermanVariant, Grade> = {
  classic: {
    bgTop: "#0e1426", bgBot: "#070a14",
    empty: "rgba(34,46,82,0.55)",
    ramp: ["#9c1a2e", "#cf1f3c", "#f23048", "#ff5e74"],
    rampRGB: [[156, 26, 46], [207, 31, 60], [242, 48, 72], [255, 94, 116]],
    accent: "#5d7bd6", accentRGB: "93,123,214",
    web: "#5d7bd6",
    treatment: "classic",
  },
  miles: {
    bgTop: "#0e0c1e", bgBot: "#080611",
    empty: "rgba(44,36,78,0.6)",
    ramp: ["#27349e", "#3a7bf0", "#33beff", "#9ee6ff"],
    rampRGB: [[39, 52, 158], [58, 123, 240], [51, 190, 255], [158, 230, 255]],
    accent: "#36c8ff", accentRGB: "54,200,255",
    web: "#4a4488",
    treatment: "miles",
  },
  symbiote: {
    bgTop: "#0a090d", bgBot: "#040305",
    empty: "rgba(28,29,36,0.65)",
    ramp: ["#6e6f7c", "#9b9ca8", "#cccdd8", "#ffffff"],
    rampRGB: [[110, 111, 124], [155, 156, 168], [204, 205, 216], [255, 255, 255]],
    accent: "#d8d9e2", accentRGB: "216,217,226",
    web: "#cfd0da",
    treatment: "noir",
  },
  verse: {
    bgTop: "#160a28", bgBot: "#0a0512",
    empty: "rgba(54,28,72,0.55)",
    ramp: ["#3a1470", "#6a1fb0", "#a020c0", "#ffe23d"],
    rampRGB: [[58, 20, 112], [106, 31, 176], [160, 32, 192], [255, 226, 61]],
    accent: "#1fd6ff", accentRGB: "31,214,255",
    web: "#1fd6ff",
    treatment: "verse",
  },
};

function lighten([r, g, b]: [number, number, number], t: number): string {
  return `${Math.round(r + (255 - r) * t)},${Math.round(g + (255 - g) * t)},${Math.round(b + (255 - b) * t)}`;
}

function softBlob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Faint corner web (hairline, low alpha) — frames the lenses, never the grid.
function drawCornerWeb(ctx: CanvasRenderingContext2D, ax: number, ay: number, a0: number, a1: number, radius: number, stroke: string, scale: number) {
  const spokes = 8, rings = 6, sag = 0.16;
  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 1 * scale;
  const angs: number[] = [];
  for (let s = 0; s < spokes; s++) angs.push(lerp(a0, a1, s / (spokes - 1)));
  for (const a of angs) {
    const grad = ctx.createLinearGradient(ax, ay, ax + Math.cos(a) * radius, ay + Math.sin(a) * radius);
    grad.addColorStop(0, stroke);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + Math.cos(a) * radius, ay + Math.sin(a) * radius);
    ctx.stroke();
  }
  ctx.strokeStyle = stroke;
  for (let ri = 1; ri <= rings; ri++) {
    const r = radius * lerp(0.14, 1, ri / rings);
    ctx.globalAlpha = 0.14 * (1 - ri / (rings + 2));
    ctx.beginPath();
    for (let s = 0; s < angs.length - 1; s++) {
      const x0 = ax + Math.cos(angs[s]) * r, y0 = ay + Math.sin(angs[s]) * r;
      const x1 = ax + Math.cos(angs[s + 1]) * r, y1 = ay + Math.sin(angs[s + 1]) * r;
      const am = (angs[s] + angs[s + 1]) / 2, rc = r * (1 - sag);
      if (s === 0) ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(ax + Math.cos(am) * rc, ay + Math.sin(am) * rc, x1, y1);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Build one lens path in a local frame (inner edge at x=0, vertical centre y=0),
// x growing in `mirror` direction, scaled by `s` about the lens centre.
function lensPath(ctx: CanvasRenderingContext2D, W: number, H: number, mirror: number, s: number) {
  const cxl = mirror * 0.5 * W;
  const P = (fx: number, fy: number): [number, number] => {
    const x = mirror * fx * W, y = fy * H;
    return [cxl + (x - cxl) * s, y * s];
  };
  const pin = P(0, 0.18), ptop = P(0.42, -0.5), pout = P(1.0, -0.16), pbot = P(0.46, 0.5);
  ctx.beginPath();
  ctx.moveTo(pin[0], pin[1]);
  const c = (fx: number, fy: number) => P(fx, fy);
  let a = c(0.1, -0.3), b = c(0.26, -0.5);
  ctx.bezierCurveTo(a[0], a[1], b[0], b[1], ptop[0], ptop[1]);
  a = c(0.66, -0.5); b = c(0.92, -0.38);
  ctx.bezierCurveTo(a[0], a[1], b[0], b[1], pout[0], pout[1]);
  a = c(0.92, 0.34); b = c(0.66, 0.5);
  ctx.bezierCurveTo(a[0], a[1], b[0], b[1], pbot[0], pbot[1]);
  a = c(0.3, 0.5); b = c(0.1, 0.4);
  ctx.bezierCurveTo(a[0], a[1], b[0], b[1], pin[0], pin[1]);
  ctx.closePath();
}

function drawLens(ctx: CanvasRenderingContext2D, originX: number, cy: number, W: number, H: number, mirror: number, g: Grade, scale: number) {
  ctx.save();
  ctx.translate(originX, cy);
  ctx.rotate(mirror * (-9 * Math.PI) / 180); // brow raised at the temple

  // verse: chromatic ghosts under the white face.
  if (g.treatment === "verse") {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(mirror * -5 * scale, 0); lensPath(ctx, W, H, mirror, 1); ctx.fillStyle = "rgba(31,214,255,0.6)"; ctx.fill();
    ctx.translate(mirror * 10 * scale, 0); lensPath(ctx, W, H, mirror, 1); ctx.fillStyle = "rgba(255,45,106,0.6)"; ctx.fill();
    ctx.restore();
  }

  // white face (per-treatment gradient)
  lensPath(ctx, W, H, mirror, 1);
  let face: CanvasGradient;
  if (g.treatment === "miles") {
    face = ctx.createLinearGradient(0, 0, mirror * W, 0);
    face.addColorStop(0, "#ffffff");
    face.addColorStop(0.62, "#eef2fb");
    face.addColorStop(1, "#ff2d52");
  } else {
    face = ctx.createLinearGradient(0, -H / 2, 0, H / 2);
    face.addColorStop(0, "#ffffff");
    face.addColorStop(0.6, "#f4f7fc");
    face.addColorStop(1, "#dde6f2");
  }
  ctx.fillStyle = face;
  ctx.fill();

  // verse: halftone overprint clipped to the lens
  if (g.treatment === "verse") {
    const pat = halftonePattern(ctx, 9 * scale, 1.7 * scale, "rgba(120,40,160,0.9)");
    if (pat) {
      ctx.save();
      lensPath(ctx, W, H, mirror, 1);
      ctx.clip();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = pat;
      ctx.fillRect(-W, -H, W * 2, H * 2);
      ctx.restore();
    }
  }

  // Gloss + webbed-lens detail, clipped inside the lens.
  ctx.save();
  lensPath(ctx, W, H, mirror, 1);
  ctx.clip();
  // faint web mesh (concentric ribs + radial spokes)
  ctx.strokeStyle = "rgba(70,80,100,0.16)";
  ctx.lineWidth = 1.4 * scale;
  ctx.lineJoin = "round";
  for (const s of [0.74, 0.5, 0.26]) {
    lensPath(ctx, W, H, mirror, s);
    ctx.stroke();
  }
  const meshCx = mirror * 0.5 * W;
  for (let k = 0; k < 5; k++) {
    const ang = lerp(-1.1, 1.1, k / 4);
    ctx.beginPath();
    ctx.moveTo(meshCx, 0);
    ctx.lineTo(meshCx + Math.cos(ang) * W * 0.6 * mirror, Math.sin(ang) * H * 0.55);
    ctx.stroke();
  }
  // specular highlight near the upper-inner edge
  ctx.globalCompositeOperation = "lighter";
  softBlob(ctx, mirror * 0.32 * W, -H * 0.22, W * 0.42, "255,255,255", 0.45);
  ctx.restore();

  // inner thin web rib
  lensPath(ctx, W, H, mirror, 0.9);
  ctx.strokeStyle = "rgba(10,10,12,0.5)";
  ctx.lineWidth = 2.5 * scale;
  ctx.lineJoin = "round";
  ctx.stroke();

  // outer black keyline (on top for a crisp edge)
  lensPath(ctx, W, H, mirror, 1);
  if (g.treatment === "verse") {
    // print-misalign fringe
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(mirror * -1.5 * scale, 0); lensPath(ctx, W, H, mirror, 1);
    ctx.strokeStyle = "rgba(31,214,255,0.5)"; ctx.lineWidth = 7 * scale; ctx.lineJoin = "round"; ctx.stroke();
    ctx.restore();
    lensPath(ctx, W, H, mirror, 1);
  }
  ctx.strokeStyle = "#0a0a0c";
  ctx.lineWidth = 7 * scale;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
}

function halftonePattern(ctx: CanvasRenderingContext2D, spacing: number, radius: number, color: string) {
  const tile = createCanvas(spacing, spacing * 2);
  const t = tile.getContext("2d");
  t.fillStyle = color;
  t.beginPath(); t.arc(spacing / 2, spacing / 2, radius, 0, TAU); t.fill();
  t.beginPath(); t.arc(0, spacing * 1.5, radius, 0, TAU); t.fill();
  t.beginPath(); t.arc(spacing, spacing * 1.5, radius, 0, TAU); t.fill();
  return ctx.createPattern(tile, "repeat");
}

export function renderSpidermanScene(ctx: CanvasRenderingContext2D, a: SpidermanSceneArgs): void {
  const { width, height, gridLeft, gridTop, numCols, numRows, cellSize, cellStep, cornerRadius, levels } = a;
  const g = GRADES[a.variant];
  const scale = width / 393;
  const gridW = numCols * cellStep - (cellStep - cellSize);
  const gridH = numRows * cellStep - (cellStep - cellSize);

  // 1) Night-sky background.
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, g.bgTop);
  bg.addColorStop(1, g.bgBot);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Lens geometry — sized and lowered so the motif anchors to the grid.
  const lensCy = height * 0.282;
  const lensW = width * 0.345;
  const lensH = lensW * 0.62;
  const gap = width * 0.075;

  // classic: faint implied-red suit glow behind the lenses.
  if (g.treatment === "classic") {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    softBlob(ctx, width / 2, lensCy + lensH * 0.1, width * 0.55, "207,31,60", 0.07);
    ctx.restore();
  }

  // 2) Hero halo so the lenses feel lit, not pasted.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  softBlob(ctx, width / 2, lensCy, width * 0.5, g.accentRGB, 0.1);
  ctx.restore();

  // 3) Faint corner webbing (top corners only).
  drawCornerWeb(ctx, 0, 0, 0, Math.PI / 2, width * 0.5, g.web, scale);
  drawCornerWeb(ctx, width, 0, Math.PI / 2, Math.PI, width * 0.5, g.web, scale);

  // 4) The lenses.
  drawLens(ctx, width / 2 + gap / 2, lensCy, lensW, lensH, 1, g, scale);
  drawLens(ctx, width / 2 - gap / 2, lensCy, lensW, lensH, -1, g, scale);

  // Miles: a single clean cyan venom spark arcing between the inner tips.
  if (g.treatment === "miles") {
    drawSpark(ctx, width / 2, lensCy + lensH * 0.2, lensW * 0.5, g.accent, scale);
  }

  // 5) The grid — your year, the readable hero. Standard size.
  for (let i = 0; i < levels.length; i++) {
    const col = i % numCols;
    const row = Math.floor(i / numCols);
    const x = gridLeft + col * cellStep;
    const y = gridTop + row * cellStep;
    const lv = levels[i];
    if (lv < 0) {
      roundRectPath(ctx, x, y, cellSize, cellSize, cornerRadius);
      ctx.fillStyle = g.empty;
      ctx.fill();
      continue;
    }
    const rgb = g.rampRGB[lv];
    const rgbStr = `${rgb[0]},${rgb[1]},${rgb[2]}`;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    softBlob(ctx, x + cellSize / 2, y + cellSize / 2, cellSize * (0.4 + lv * 0.08), rgbStr, 0.03 + lv * 0.018);
    ctx.restore();
    ctx.save();
    ctx.shadowColor = `rgba(${rgbStr},${0.35 + lv * 0.08})`;
    ctx.shadowBlur = (1 + lv * 1) * scale;
    roundRectPath(ctx, x, y, cellSize, cellSize, cornerRadius);
    ctx.fillStyle = g.ramp[lv];
    ctx.fill();
    ctx.restore();
    if (lv >= 1) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.12 + (lv - 1) * 0.08;
      roundRectPath(ctx, x, y, cellSize, cellSize * 0.4, cornerRadius);
      ctx.fillStyle = `rgb(${lighten(rgb, 0.45)})`;
      ctx.fill();
      ctx.restore();
    }
    if (lv === 3) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      softBlob(ctx, x + cellSize / 2, y + cellSize / 2, cellSize * 0.2, lighten(rgb, 0.5), 0.3);
      ctx.restore();
    }
  }

  // 7) Vignette — center-weighted on the grid.
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const vig = ctx.createRadialGradient(width / 2, gridTop + gridH / 2, gridW * 0.5, width / 2, gridTop + gridH / 2, Math.max(width, height) * 0.72);
  vig.addColorStop(0, "rgba(255,255,255,1)");
  vig.addColorStop(1, "rgba(12,14,22,1)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// A single clean energized arc (Miles).
function drawSpark(ctx: CanvasRenderingContext2D, cx: number, cy: number, span: number, color: string, scale: number) {
  const pts: [number, number][] = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = cx + (t - 0.5) * span;
    const y = cy + Math.sin(t * Math.PI) * -span * 0.12 + Math.sin(i * 9.3) * span * 0.04;
    pts.push([x, y]);
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12 * scale;
  ctx.lineWidth = 2.4 * scale;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.shadowBlur = 4 * scale;
  ctx.lineWidth = 1 * scale;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts) ctx.lineTo(p[0], p[1]);
  ctx.stroke();
  ctx.restore();
}

// Small picker thumbnail: the lenses on the suit background.
export function drawSpidermanThumb(ctx: CanvasRenderingContext2D, variant: SpidermanVariant, S: number) {
  const g = GRADES[variant];
  ctx.fillStyle = g.bgBot;
  ctx.fillRect(0, 0, S, S);
  const lw = S * 0.4;
  const lh = lw * 0.62;
  const gp = S * 0.07;
  drawLens(ctx, S / 2 + gp / 2, S * 0.42, lw, lh, 1, g, S / 393 * 3);
  drawLens(ctx, S / 2 - gp / 2, S * 0.42, lw, lh, -1, g, S / 393 * 3);
  const cell = S * 0.15;
  const g2 = S * 0.04;
  const totalW = 4 * cell + 3 * g2;
  const x0 = (S - totalW) / 2;
  const y0 = S - cell - S * 0.06;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = g.ramp[i];
    ctx.beginPath();
    ctx.roundRect(x0 + i * (cell + g2), y0, cell, cell, cell * 0.2);
    ctx.fill();
  }
}
