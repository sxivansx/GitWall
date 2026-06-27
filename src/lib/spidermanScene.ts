import { createCanvas, type CanvasRenderingContext2D } from "canvas";
import type { SpidermanVariant } from "./spiderman";

// Full-canvas Spider-Man wallpaper — "The Web-Slinger's Grid". A spider-web is
// spun across the night with a bold glowing chest-emblem as the hero; web threads
// drop from the emblem down to your contribution year, which is the readable grid
// (standard tile size/position — only background and cell style change). Each suit
// re-grades and re-styles it: classic = clean, Miles = venom lightning, symbiote =
// dripping ooze, Spider-Verse = halftone + chromatic glitch.

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

type Flourish = "clean" | "electric" | "drip" | "comic";

interface Grade {
  bgTop: string;
  bgBot: string;
  empty: string;
  ramp: [string, string, string, string];
  rampRGB: [number, number, number][];
  web: string;
  webAlpha: number;
  emblem: string;
  accent: string;
  flourish: Flourish;
}

// Four suits, four separated hue families, four web treatments.
const GRADES: Record<SpidermanVariant, Grade> = {
  classic: {
    bgTop: "#0e1426", bgBot: "#070a14",
    empty: "rgba(34,46,82,0.55)",
    ramp: ["#9c1a2e", "#cf1f3c", "#f23048", "#ff5e74"],
    rampRGB: [[156, 26, 46], [207, 31, 60], [242, 48, 72], [255, 94, 116]],
    web: "#4d7bff", webAlpha: 0.42,
    emblem: "#ff3b54", accent: "#7fa6ff",
    flourish: "clean",
  },
  miles: {
    bgTop: "#0a0712", bgBot: "#050308",
    empty: "rgba(40,30,68,0.55)",
    ramp: ["#1c2a8e", "#2f6fe6", "#26b4ff", "#8fe0ff"],
    rampRGB: [[28, 42, 142], [47, 111, 230], [38, 180, 255], [143, 224, 255]],
    web: "#ff3a64", webAlpha: 0.42,
    emblem: "#ff2d52", accent: "#36c8ff",
    flourish: "electric",
  },
  symbiote: {
    bgTop: "#0a090d", bgBot: "#050406",
    empty: "rgba(52,54,64,0.6)",
    ramp: ["#54555f", "#82838f", "#bdbec8", "#ffffff"],
    rampRGB: [[84, 85, 95], [130, 131, 143], [189, 190, 200], [255, 255, 255]],
    web: "#cfd0da", webAlpha: 0.4,
    emblem: "#ffffff", accent: "#bcb6e6",
    flourish: "drip",
  },
  verse: {
    bgTop: "#160a28", bgBot: "#0a0512",
    empty: "rgba(54,28,72,0.55)",
    ramp: ["#5a1a8c", "#9c1fc0", "#e01f90", "#ffe23d"],
    rampRGB: [[90, 26, 140], [156, 31, 192], [224, 31, 144], [255, 226, 61]],
    web: "#1fd6ff", webAlpha: 0.42,
    emblem: "#ff1fa0", accent: "#1fd6ff",
    flourish: "comic",
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

// --- Spider web (corner-anchored, catenary-sagging rings) ------------------
function drawWeb(
  ctx: CanvasRenderingContext2D,
  anchor: { x: number; y: number },
  angle0: number,
  angle1: number,
  radius: number,
  opts: { spokes?: number; rings?: number; sag?: number; ringStart?: number; stroke: string; alpha: number; lineWidth: number; glow?: number; dew?: boolean; dewColor?: string; dewRadius?: number; jitter?: number }
) {
  const { spokes = 9, rings = 7, sag = 0.16, ringStart = 0.12, stroke, alpha, lineWidth, glow = 0, dew = false, dewColor = "#dbe7f2", dewRadius = 2, jitter = 0 } = opts;
  const { x: ax, y: ay } = anchor;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (glow > 0) { ctx.shadowColor = stroke; ctx.shadowBlur = glow; }

  const spokeAngles: number[] = [];
  for (let s = 0; s < spokes; s++) {
    const base = lerp(angle0, angle1, spokes === 1 ? 0 : s / (spokes - 1));
    spokeAngles.push(base + (jitter ? Math.sin(s * 73.1) * jitter : 0));
  }
  for (const a of spokeAngles) {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax + Math.cos(a) * radius, ay + Math.sin(a) * radius);
    ctx.stroke();
  }
  for (let ri = 1; ri <= rings; ri++) {
    const r = radius * lerp(ringStart, 1, ri / rings) * (jitter ? 1 + Math.sin(ri * 41.7) * jitter * 0.25 : 1);
    ctx.beginPath();
    for (let s = 0; s < spokeAngles.length - 1; s++) {
      const a0 = spokeAngles[s];
      const a1 = spokeAngles[s + 1];
      const x0 = ax + Math.cos(a0) * r;
      const y0 = ay + Math.sin(a0) * r;
      const x1 = ax + Math.cos(a1) * r;
      const y1 = ay + Math.sin(a1) * r;
      const am = (a0 + a1) / 2;
      const rc = r * (1 - sag);
      const cx = ax + Math.cos(am) * rc;
      const cy = ay + Math.sin(am) * rc;
      if (s === 0) ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cx, cy, x1, y1);
    }
    ctx.stroke();
  }
  if (dew) {
    ctx.shadowBlur = glow > 0 ? glow * 0.6 : 0;
    ctx.globalAlpha = Math.min(1, alpha * 2.4);
    ctx.fillStyle = dewColor;
    for (let ri = 1; ri <= rings; ri++) {
      const r = radius * lerp(ringStart, 1, ri / rings);
      for (const a of spokeAngles) {
        if (((ri * 7 + Math.round(a * 100)) % 3) === 0) continue;
        ctx.beginPath();
        ctx.arc(ax + Math.cos(a) * r, ay + Math.sin(a) * r, dewRadius, 0, TAU);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

// Filled tapered segment (a quad whose half-width changes end to end).
function taperSeg(ctx: CanvasRenderingContext2D, x0: number, y0: number, w0: number, x1: number, y1: number, w1: number) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy) || 1;
  const ux = -dy / len, uy = dx / len;
  ctx.beginPath();
  ctx.moveTo(x0 + ux * w0, y0 + uy * w0);
  ctx.lineTo(x1 + ux * w1, y1 + uy * w1);
  ctx.lineTo(x1 - ux * w1, y1 - uy * w1);
  ctx.lineTo(x0 - ux * w0, y0 - uy * w0);
  ctx.closePath();
  ctx.fill();
}

// --- Spider emblem: filled, angular, symmetric, glowing --------------------
function drawEmblem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  opts: { alpha?: number; glow?: number } = {}
) {
  const { alpha = 1, glow = 0 } = opts;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  if (glow > 0) { ctx.shadowColor = color; ctx.shadowBlur = glow; }

  // Compact body: small cephalothorax + rounded abdomen.
  const ceph = { cy: -size * 0.17, rx: size * 0.1, ry: size * 0.12 };
  const abdo = { cy: size * 0.16, rx: size * 0.15, ry: size * 0.27 };

  // Four angular legs per side, tapering hip→knee→point, sharp knees.
  const hipX = size * 0.07;
  const hipYs = [-size * 0.24, -size * 0.12, 0, size * 0.1];
  const legSpec = [
    { reach: 0.82, kneeX: 0.52, kneeY: -0.5, footY: -0.34 },
    { reach: 0.98, kneeX: 0.62, kneeY: -0.32, footY: -0.02 },
    { reach: 0.98, kneeX: 0.62, kneeY: -0.08, footY: 0.3 },
    { reach: 0.82, kneeX: 0.52, kneeY: 0.14, footY: 0.56 },
  ];
  const wHip = size * 0.055;
  const wKnee = size * 0.03;
  const wTip = size * 0.006;
  const drawLeg = (side: number, hy: number, spec: typeof legSpec[number]) => {
    const hipx = side * hipX;
    const kneex = side * spec.kneeX * size;
    const kneey = hy + size * spec.kneeY;
    const footx = side * spec.reach * size;
    const footy = hy + size * spec.footY;
    taperSeg(ctx, hipx, hy, wHip, kneex, kneey, wKnee);
    taperSeg(ctx, kneex, kneey, wKnee, footx, footy, wTip);
    ctx.beginPath();
    ctx.arc(kneex, kneey, wKnee, 0, TAU); // round the knee joint
    ctx.fill();
  };
  for (let i = 0; i < hipYs.length; i++) {
    drawLeg(1, hipYs[i], legSpec[i]);
    drawLeg(-1, hipYs[i], legSpec[i]);
  }
  // Body on top of the hip joints.
  ctx.beginPath();
  ctx.ellipse(0, ceph.cy, ceph.rx, ceph.ry, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, abdo.cy, abdo.rx, abdo.ry, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// --- Halftone (Ben-Day) pattern, cached, for Spider-Verse ------------------
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
  const gap = cellStep - cellSize;

  const gridW = numCols * cellStep - gap;
  const gridH = numRows * cellStep - gap;

  // 1) Night-sky background.
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, g.bgTop);
  bg.addColorStop(1, g.bgBot);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // 2) Faint full web behind the whole scene.
  drawWeb(ctx, { x: width / 2, y: height * 0.6 }, 0, TAU, width * 0.8, {
    spokes: 16, rings: 9, sag: 0.1, stroke: g.web, alpha: 0.05, lineWidth: 1 * scale,
  });

  // 3) Comic halftone (Spider-Verse), screen-blended, subtle but visible.
  if (g.flourish === "comic") {
    const pat = halftonePattern(ctx, 11 * scale, 2 * scale, "rgba(255,255,255,0.6)");
    if (pat) {
      ctx.save();
      ctx.globalAlpha = 0.09;
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  // 4) Corner webs in the top third (kept clear of the grid).
  const cornerR = width * 0.62;
  const webJitter = g.flourish === "electric" ? 0.05 : g.flourish === "drip" ? 0.07 : 0;
  const webWidth = (g.flourish === "drip" ? 2.4 : 1.7) * scale;
  for (const [anchor, a0, a1] of [
    [{ x: 0, y: 0 }, 0, Math.PI / 2],
    [{ x: width, y: 0 }, Math.PI / 2, Math.PI],
  ] as [{ x: number; y: number }, number, number][]) {
    drawWeb(ctx, anchor, a0, a1, cornerR, {
      spokes: 9, rings: 7, sag: 0.16, stroke: g.web, alpha: g.webAlpha,
      lineWidth: webWidth, glow: 5 * scale, dew: true, dewColor: g.accent,
      dewRadius: 2 * scale, jitter: webJitter,
    });
  }

  // 5) Hero emblem, lower-centre so the head clears the clock and the legs reach
  //    toward the grid. Spider-Verse gets a chromatic split.
  const emblemCx = width / 2;
  const emblemCy = height * 0.225;
  const emblemSize = width * 0.32;
  if (g.flourish === "comic") {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawEmblem(ctx, emblemCx - 6 * scale, emblemCy, emblemSize, "#1fd6ff", { alpha: 0.6 });
    drawEmblem(ctx, emblemCx + 6 * scale, emblemCy, emblemSize, "#ff2d6a", { alpha: 0.6 });
    ctx.restore();
    drawEmblem(ctx, emblemCx, emblemCy, emblemSize, g.emblem, { glow: 22 * scale });
  } else {
    drawEmblem(ctx, emblemCx, emblemCy, emblemSize, g.emblem, { glow: 22 * scale });
  }

  // 6) Connectors — threads dropping from the emblem to the grid (closes the gap
  //    and ties hero to data). Per-suit treatment.
  const fromY = emblemCy + emblemSize * 0.42;
  drawConnectors(ctx, emblemCx, fromY, gridLeft, gridW, gridTop, g, scale);

  // 7) The grid — your year, the readable hero. Standard size.
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
    // tight bloom (small radius so neighbours don't merge)
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    softBlob(ctx, x + cellSize / 2, y + cellSize / 2, cellSize * (0.45 + lv * 0.1), rgbStr, 0.04 + lv * 0.025);
    ctx.restore();
    // face with a small rim glow
    ctx.save();
    ctx.shadowColor = `rgba(${rgbStr},${0.4 + lv * 0.1})`;
    ctx.shadowBlur = (1 + lv * 1.3) * scale;
    roundRectPath(ctx, x, y, cellSize, cellSize, cornerRadius);
    ctx.fillStyle = g.ramp[lv];
    ctx.fill();
    ctx.restore();
    // top highlight = a lighter TINT of the cell's own hue (never pure white)
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
      softBlob(ctx, x + cellSize / 2, y + cellSize / 2, cellSize * 0.24, lighten(rgb, 0.55), 0.4);
      ctx.restore();
    }
  }

  // 8) Vignette — center-weighted on the grid.
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const vig = ctx.createRadialGradient(width / 2, gridTop + gridH / 2, gridW * 0.5, width / 2, gridTop + gridH / 2, Math.max(width, height) * 0.72);
  vig.addColorStop(0, "rgba(255,255,255,1)");
  vig.addColorStop(1, "rgba(12,14,22,1)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// Per-suit connectors from the emblem down to the grid's top edge.
function drawConnectors(ctx: CanvasRenderingContext2D, cx: number, fromY: number, gridLeft: number, gridW: number, gridTop: number, g: Grade, scale: number) {
  const targets = [gridLeft + gridW * 0.22, gridLeft + gridW * 0.5, gridLeft + gridW * 0.78];

  if (g.flourish === "drip") {
    // Tapered ooze drips with a teardrop bead at the tip.
    ctx.save();
    ctx.fillStyle = g.emblem;
    const xs = [cx - gridW * 0.18, cx - gridW * 0.04, cx + gridW * 0.1, cx + gridW * 0.22];
    for (let i = 0; i < xs.length; i++) {
      const dx = xs[i];
      const len = (gridTop - fromY) * (0.5 + (Math.sin(i * 51.3) * 0.5 + 0.5) * 0.5);
      const wTop = (5 + (i % 2) * 2) * scale;
      const curve = Math.sin(i * 12.1) * 14 * scale;
      // tapered body
      ctx.beginPath();
      ctx.moveTo(dx - wTop, fromY);
      ctx.quadraticCurveTo(dx + curve - 1.5 * scale, fromY + len * 0.6, dx + curve, fromY + len);
      ctx.quadraticCurveTo(dx + curve + 1.5 * scale, fromY + len * 0.6, dx + wTop, fromY);
      ctx.closePath();
      ctx.fill();
      // bead
      ctx.beginPath();
      ctx.arc(dx + curve, fromY + len, 3.5 * scale, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // Default: thin glowing web strands with a dew dot where they meet the grid.
  ctx.save();
  ctx.strokeStyle = g.web;
  ctx.globalAlpha = Math.min(1, g.webAlpha + 0.2);
  ctx.lineWidth = 1.6 * scale;
  ctx.lineCap = "round";
  ctx.shadowColor = g.web;
  ctx.shadowBlur = 5 * scale;
  for (const tx of targets) {
    ctx.beginPath();
    ctx.moveTo(cx, fromY);
    const midX = (cx + tx) / 2;
    ctx.quadraticCurveTo(midX, lerp(fromY, gridTop, 0.5) + 12 * scale, tx, gridTop - 2 * scale);
    ctx.stroke();
  }
  ctx.fillStyle = g.accent;
  for (const tx of targets) {
    ctx.beginPath();
    ctx.arc(tx, gridTop - 2 * scale, 2.4 * scale, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  // Miles: jagged branching venom lightning over the strands.
  if (g.flourish === "electric") {
    drawLightning(ctx, cx, fromY, gridTop, g.accent, scale);
  }
}

// Jagged, branching venom lightning (Miles).
function drawLightning(ctx: CanvasRenderingContext2D, cx: number, fromY: number, gridTop: number, color: string, scale: number) {
  const bolt = (x0: number, y0: number, x1: number, y1: number, seed: number, width: number) => {
    const segs = 7;
    const pts: [number, number][] = [[x0, y0]];
    for (let s = 1; s < segs; s++) {
      const t = s / segs;
      const jx = Math.sin(seed * 12.9 + s * 7.3) * 22 * scale * (1 - Math.abs(t - 0.5));
      pts.push([lerp(x0, x1, t) + jx, lerp(y0, y1, t)]);
    }
    pts.push([x1, y1]);
    // outer glow
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14 * scale;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.stroke();
    // bright thin core
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.shadowBlur = 4 * scale;
    ctx.lineWidth = width * 0.4;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.stroke();
    ctx.restore();
    // a short branch off the middle
    const mid = pts[Math.floor(segs / 2)];
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 * scale;
    ctx.lineWidth = width * 0.6;
    ctx.beginPath();
    ctx.moveTo(mid[0], mid[1]);
    ctx.lineTo(mid[0] + (seed % 2 ? 1 : -1) * 34 * scale, mid[1] + 26 * scale);
    ctx.stroke();
    ctx.restore();
  };
  const span = gridTop - fromY;
  bolt(cx - 70 * scale, fromY + span * 0.1, cx - 90 * scale, gridTop - span * 0.1, 1, 3 * scale);
  bolt(cx + 60 * scale, fromY + span * 0.1, cx + 96 * scale, gridTop - span * 0.1, 2, 2.6 * scale);
}

// Small picker thumbnail.
export function drawSpidermanThumb(ctx: CanvasRenderingContext2D, variant: SpidermanVariant, S: number) {
  const g = GRADES[variant];
  ctx.fillStyle = g.bgBot;
  ctx.fillRect(0, 0, S, S);
  drawWeb(ctx, { x: 0, y: 0 }, 0, Math.PI / 2, S * 0.95, {
    spokes: 6, rings: 4, sag: 0.16, stroke: g.web, alpha: g.webAlpha, lineWidth: S * 0.018,
  });
  drawEmblem(ctx, S * 0.5, S * 0.4, S * 0.52, g.emblem, { glow: S * 0.1 });
  const cell = S * 0.16;
  const gp = S * 0.04;
  const totalW = 4 * cell + 3 * gp;
  const x0 = (S - totalW) / 2;
  const y0 = S - cell - S * 0.07;
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = g.ramp[i];
    ctx.beginPath();
    ctx.roundRect(x0 + i * (cell + gp), y0, cell, cell, cell * 0.2);
    ctx.fill();
  }
}
