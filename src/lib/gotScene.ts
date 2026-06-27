import { Image, createCanvas, type CanvasRenderingContext2D } from "canvas";
import type { GameOfThronesVariant } from "./gameofthrones";
import { DRAGON_SIL_B64 } from "./gotAssets";

// Full-canvas Game of Thrones wallpaper. The contribution calendar is not a grid
// of tiles — it is one wall of living fire. The flame skyline traces the year
// left→right: busy stretches blaze tall, quiet ones smoulder low. A dragon broods
// as a dark backlit silhouette in the upper third, lit from below by the fire.

// Process-lifetime cache: the dragon asset is static and immutable, so it's decoded
// once per process and reused across every render (intentional, not a leak).
const imgCache: Record<string, Image | null> = {};
function getImage(key: string, b64: string): Image | null {
  if (!(key in imgCache)) {
    if (!b64) {
      imgCache[key] = null;
    } else {
      const img = new Image();
      img.src = Buffer.from(b64.replace(/^data:[^,]+,/, ""), "base64");
      imgCache[key] = img;
    }
  }
  return imgCache[key];
}
const getDragon = () => getImage("dragon", DRAGON_SIL_B64);

export interface GotSceneArgs {
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
  variant: GameOfThronesVariant;
}

interface Grade {
  skyTop: string;
  skyHorizon: string; // warm-dark glow toward the fire (NO gray)
  core: string; // white-hot heart
  hot: string; // bright body
  mid: string; // outer flame
  deep: string; // smouldering tip / ember
  ember: string; // saturated molten-core hue (drives the base "color" grade)
}

// Each house is a distinct fire. Targaryen burns crimson (blood & fire),
// Lannister burns lion-gold, Stark is desaturated winter steel, and the Night
// King is an eerie, saturated supernatural cyan. Kept far apart in hue and
// saturation so no two houses read alike at a glance.
const GRADES: Record<GameOfThronesVariant, Grade> = {
  targaryen: {
    skyTop: "#0a0304", skyHorizon: "#330a05",
    core: "255,186,96", hot: "255,104,30", mid: "212,38,14", deep: "110,16,8",
    ember: "255,138,58",
  },
  lannister: {
    // Gold is high-luminance in every channel, so additive bloom clips it to white
    // fast. Kept deeper than the show-gold ideal — low blue especially — so stacked
    // glows stay rich molten gold instead of blowing out to a neutral white.
    skyTop: "#0a0701", skyHorizon: "#2c1e05",
    core: "255,214,92", hot: "236,168,32", mid: "180,108,14", deep: "104,56,6",
    ember: "246,188,54",
  },
  stark: {
    // Steel is near-balanced in RGB, so it blows to white faster than the cyan
    // Night King; kept deeper to hold the icy-steel colour in the hottest cells.
    skyTop: "#05080c", skyHorizon: "#162a36",
    core: "162,206,236", hot: "82,156,202", mid: "56,112,150", deep: "30,58,84",
    ember: "120,180,218",
  },
  nightking: {
    // Cyan already sits with green+blue near max, so it washes to cyan-white on
    // overlap; kept deeper to hold the electric-ice colour in the busiest cells.
    skyTop: "#02080c", skyHorizon: "#052430",
    core: "130,208,236", hot: "36,178,222", mid: "14,136,180", deep: "8,70,104",
    ember: "78,186,226",
  },
};

function rnd(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// node-canvas supports ctx.filter at runtime but its TS types omit it; the
// try/catch also guards builds where the backend lacks blur support.
function setFilter(ctx: CanvasRenderingContext2D, value: string) {
  try {
    (ctx as unknown as { filter: string }).filter = value;
  } catch {
    /* filter unsupported */
  }
}

function softBlob(
  ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rgb: string, alpha: number
) {
  const r = Math.max(rx, ry);
  if (r < 0.5 || alpha <= 0) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(rx / r, ry / r);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(0.55, `rgba(${rgb},${alpha * 0.4})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function buildProfile(a: GotSceneArgs): number[] {
  const cols = a.numCols;
  const raw: number[] = [];
  for (let c = 0; c < cols; c++) {
    let sum = 0;
    for (let r = 0; r < a.numRows; r++) {
      const lv = a.levels[r * cols + c];
      if (lv !== undefined && lv >= 0) sum += lv + 1;
    }
    raw.push(sum);
  }
  const max = Math.max(1, ...raw);
  const norm = raw.map((v) => v / max);
  return norm.map((v, i) => ((norm[i - 1] ?? v) + v * 2 + (norm[i + 1] ?? v)) / 4);
}

function sampleProfile(profile: number[], t: number): number {
  const x = t * (profile.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a0 = profile[Math.max(0, Math.min(profile.length - 1, i))];
  const a1 = profile[Math.max(0, Math.min(profile.length - 1, i + 1))];
  return a0 + (a1 - a0) * f;
}

// One licking flame tongue: soft blobs riding a swaying centreline. The line
// curls sideways more the higher it climbs, the width stays broad at the base and
// narrows (never to a thread), and the colour climbs the temperature ramp:
// white-hot heart → yellow-orange body → orange → deep-red smoke tip. Alpha fades
// out at the tip so it dissolves into the dark instead of ending on a hard edge.
function drawTongue(
  ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number, w: number, g: Grade, seed: number, heat: number
) {
  const n = Math.max(10, Math.round(h / (w * 0.4)));
  const lean = (rnd(seed * 5.5) - 0.5) * 3.0;
  const waves = 2.4 + rnd(seed * 1.7) * 3.0;
  const phase = rnd(seed * 3.3) * 6.283;
  const amp = w * (1.15 + rnd(seed * 2.9) * 1.6);
  for (let j = 0; j < n; j++) {
    const frac = j / (n - 1);
    const yy = baseY - frac * h;
    // sideways sway grows with height; plus a steady lean → flames curl and lick
    const xx = x + Math.sin(frac * waves + phase) * amp * frac
      + lean * frac * frac * w * 1.9;
    // broad at the base, tapering toward the tip but never collapsing to a line
    const rx = w * (0.45 + 0.78 * (1 - frac)) * (0.8 + 0.42 * Math.sin(frac * 7 + seed));
    const ry = (h / n) * 2.0;
    let rgb: string;
    let a: number;
    if (frac < 0.12 && heat > 0.45) { rgb = g.core; a = 0.14; }
    else if (frac < 0.34) { rgb = g.hot; a = 0.17; }
    else if (frac < 0.64) { rgb = g.mid; a = 0.14; }
    else { rgb = g.deep; a = 0.1; }
    a *= (0.55 + heat * 0.7) * (1 - frac * 0.85);
    if (a > 0.004) softBlob(ctx, xx, yy, Math.max(2, rx), ry, rgb, a);
  }
}

function drawFireWall(ctx: CanvasRenderingContext2D, a: GotSceneArgs, g: Grade, floorY: number, maxH: number) {
  const profile = buildProfile(a);
  const minH = a.height * 0.045;
  const heatAt = (x: number) =>
    0.2 + 0.8 * sampleProfile(profile, Math.max(0, Math.min(1, x / a.width)));

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // (A) full-width ember haze low down — binds the wall into one connected sheet so
  // the spaces between tongues glow instead of dropping to pure black
  const haze = ctx.createLinearGradient(0, floorY - maxH * 0.5, 0, floorY + a.cellSize * 2);
  haze.addColorStop(0, `rgba(${g.deep},0)`);
  haze.addColorStop(0.5, `rgba(${g.deep},0.30)`);
  haze.addColorStop(0.82, `rgba(${g.mid},0.30)`);
  haze.addColorStop(1, `rgba(${g.deep},0)`);
  ctx.fillStyle = haze;
  ctx.fillRect(0, floorY - maxH * 0.5, a.width, maxH * 0.5 + a.cellSize * 2);

  // (B) three layers of tongues, back → front: wide dim swells fill the wall, then
  // orange mid flames, then narrow bright licks. Background swells keep a heat
  // floor so even quiet columns smoulder (no black gaps).
  const layers = [
    { wMul: 1.5, hMul: 0.72, spacing: 0.95, heatFloor: 0.55, jitter: 1.6 },
    { wMul: 0.85, hMul: 1.0, spacing: 0.72, heatFloor: 0.15, jitter: 2.0 },
    { wMul: 0.52, hMul: 1.28, spacing: 0.66, heatFloor: 0.0, jitter: 2.0 },
  ];
  for (let pass = 0; pass < layers.length; pass++) {
    const L = layers[pass];
    const N = Math.round(a.width / (a.cellSize * L.spacing));
    for (let k = 0; k < N; k++) {
      const sd = pass * 1000 + k;
      const t0 = (k + (rnd(sd * 1.3) - 0.5) * L.jitter) / N;
      const x = Math.max(0, Math.min(1, t0)) * a.width;
      let heat = heatAt(x);
      heat = L.heatFloor + (1 - L.heatFloor) * heat;
      const tall = rnd(sd * 7.1) > 0.9 ? 1.35 : 1.0;
      const hv = 0.45 + rnd(sd * 3.7) * 1.0;
      const h = (minH + (maxH - minH) * heat) * L.hMul * hv * tall;
      const w = a.cellSize * L.wMul * (0.7 + rnd(sd * 2.1) * 0.8);
      const baseY = floorY + (rnd(sd * 9.9) - 0.5) * a.cellSize * 1.6;
      drawTongue(ctx, x, baseY, h, w, g, sd, heat);
    }
  }

  // (C) molten crest along the floor. First a continuous feathered underline so the
  // base never drops to black between flames (no dark vertical gaps in the brightest
  // zone), then white-hot pools under the busiest columns give it variation. Drawn
  // last so it reads as the base the flames rise out of, feathered top and bottom so
  // there's no hard horizontal seam.
  const base = ctx.createLinearGradient(0, floorY - a.cellSize * 1.3, 0, floorY + a.cellSize * 1.3);
  base.addColorStop(0, `rgba(${g.hot},0)`);
  base.addColorStop(0.5, `rgba(${g.hot},0.12)`);
  base.addColorStop(1, `rgba(${g.deep},0)`);
  ctx.fillStyle = base;
  ctx.fillRect(0, floorY - a.cellSize * 1.3, a.width, a.cellSize * 2.6);
  const step = a.cellSize * 0.34;
  for (let x = -step; x <= a.width + step; x += step) {
    const he = heatAt(x);
    const jx = (rnd(x * 0.7) - 0.5) * step;
    const by = floorY + (rnd(x * 1.9) - 0.5) * a.cellSize * 0.45;
    softBlob(ctx, x + jx, by, a.cellSize * (0.95 + rnd(x) * 0.7),
      a.cellSize * (0.5 + he * 0.55), g.hot, 0.13 * (0.5 + he * 0.6));
    // always lay at least a dim warm-white core so no column bottoms out to a dark
    // vertical gap; the busiest columns burn brightest. Kept well below full blowout
    // so the hottest zone keeps warm-yellow flame structure, not a clipped white wash.
    softBlob(ctx, x + jx, by, a.cellSize * (0.24 + 0.24 * he),
      a.cellSize * 0.34, g.core, 0.07 * Math.max(0.16, he));
    // a hint of orange over the hottest cores so they read as molten, not paper-white
    if (he > 0.6) softBlob(ctx, x + jx, by, a.cellSize * 0.5, a.cellSize * 0.4, g.hot, 0.12 * he);
  }

  ctx.restore();

  return { floorY, maxH };
}

// Dragon as a dark, backlit silhouette diving toward the viewer over the fire,
// wings spread. The body is a SOLID dark cutout (the fire must never show through
// it); warmth is added on top, never by lowering opacity. Backlight is uneven —
// bright on the lower, fire-facing edges and dim along the top — so it reads as a
// real rim, not a uniform traced outline.
function drawDragonSilhouette(ctx: CanvasRenderingContext2D, a: GotSceneArgs, img: Image, g: Grade) {
  const dw = a.width * 0.62;
  const scale = dw / img.width;
  const dh = img.height * scale;
  const cx = a.width * 0.5;
  const cy = a.height * 0.285;
  const angle = (-4 * Math.PI) / 180;
  const W = Math.max(1, Math.ceil(dw));
  const H = Math.max(1, Math.ceil(dh));

  // Solid black body — one dense, uniformly dark, fully opaque mass so the whole
  // dragon reads as a confident silhouette (the darkest thing in the frame), never
  // a hollow outline.
  const tc = createCanvas(W, H);
  const t = tc.getContext("2d");
  t.drawImage(img, 0, 0, dw, dh);
  t.globalCompositeOperation = "source-in";
  t.fillStyle = "#020203"; // near-black so the body stays a hard cutout over the dark sky
  t.fillRect(0, 0, dw, dh);

  // Warm ember light ADDED onto the very bottom, fire-facing edge only (additive,
  // so the body stays fully opaque) — just enough to tie the underside to the fire.
  const mc = createCanvas(W, H);
  const m = mc.getContext("2d");
  m.drawImage(img, 0, 0, dw, dh);
  m.globalCompositeOperation = "source-in";
  const mg = m.createLinearGradient(0, dh * 0.72, 0, dh);
  mg.addColorStop(0, `rgba(${g.mid},0)`);
  mg.addColorStop(1, `rgba(${g.hot},0.4)`);
  m.fillStyle = mg;
  m.fillRect(0, 0, dw, dh);

  // Warm rim copy (red, soft), alpha-graded so the rim is essentially gone across
  // the top of the wings/back and present only on the lower, fire-facing edges. Kept
  // dim and red — it's a hint of backlight to separate the dark-sky portions, not a
  // bright traced outline. The lower body separates from the fire by contrast alone.
  const rc = createCanvas(W, H);
  const r = rc.getContext("2d");
  r.drawImage(img, 0, 0, dw, dh);
  r.globalCompositeOperation = "source-in";
  r.fillStyle = `rgba(${g.hot},1)`;
  r.fillRect(0, 0, dw, dh);
  r.globalCompositeOperation = "destination-out";
  const rg = r.createLinearGradient(0, 0, 0, dh);
  // Directional backlight from the fire BELOW: the rim is concentrated on the lower,
  // fire-facing edges (belly, tail, wingtips, lower wing edges) and fully gone on the
  // top-facing edges (tops of the wings, top of the head). Not a uniform outline.
  rg.addColorStop(0, "rgba(0,0,0,1)");
  rg.addColorStop(0.45, "rgba(0,0,0,0.72)");
  rg.addColorStop(0.78, "rgba(0,0,0,0.16)");
  rg.addColorStop(1, "rgba(0,0,0,0)");
  r.fillStyle = rg;
  r.fillRect(0, 0, dw, dh);

  // A faint, cool, dim ambient sky-bounce on the TOP edges only — so the big upper
  // wing reads as a shape against the night sky instead of a flat dead void, without
  // the warm "traced outline" look (it's the opposite gradient and a desaturated tone).
  const ac = createCanvas(W, H);
  const ac2 = ac.getContext("2d");
  ac2.drawImage(img, 0, 0, dw, dh);
  ac2.globalCompositeOperation = "source-in";
  ac2.fillStyle = "rgba(120,96,86,1)";
  ac2.fillRect(0, 0, dw, dh);
  ac2.globalCompositeOperation = "destination-out";
  const ag = ac2.createLinearGradient(0, 0, 0, dh);
  ag.addColorStop(0, "rgba(0,0,0,0)");
  ag.addColorStop(0.4, "rgba(0,0,0,0.78)");
  ag.addColorStop(1, "rgba(0,0,0,1)");
  ac2.fillStyle = ag;
  ac2.fillRect(0, 0, dw, dh);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = "lighter";
  // faint cool ambient on the top edges
  setFilter(ctx, `blur(${Math.max(1, Math.round(a.cellSize * 0.2))}px)`);
  ctx.globalAlpha = 0.5;
  ctx.drawImage(ac, -dw / 2, -dh / 2, dw, dh);
  // two soft, overlapping warm bloom passes — a diffuse glow that decays along each
  // edge rather than a hard, equal-weight traced line
  setFilter(ctx, `blur(${Math.max(2, Math.round(a.cellSize * 0.65))}px)`);
  ctx.globalAlpha = 0.55;
  ctx.drawImage(rc, -dw / 2, -dh / 2, dw, dh);
  setFilter(ctx, `blur(${Math.max(2, Math.round(a.cellSize * 0.34))}px)`);
  ctx.globalAlpha = 0.45;
  ctx.drawImage(rc, -dw / 2, -dh / 2, dw, dh);
  setFilter(ctx, "none");
  ctx.globalAlpha = 1;
  // solid black body
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(tc, -dw / 2, -dh / 2);
  // warm underside spill
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.28;
  ctx.drawImage(mc, -dw / 2, -dh / 2);
  ctx.restore();
}

// The contribution calendar rendered as a wall of glowing coals: every day is a
// runestone tile set into a dark hearth-wall. Empty days are cold black stone;
// busy days burn up the house's heat ramp (deep → mid → hot → white-core) with a
// soft additive bloom so clusters of activity glow into one molten mass. This is
// the readable GitHub graph — the data is the fuel the fire feeds on.
function drawContributionGrid(ctx: CanvasRenderingContext2D, a: GotSceneArgs, g: Grade) {
  const { gridLeft, gridTop, numCols, numRows, cellSize, cellStep, cornerRadius, levels } = a;
  // The brightest level uses the saturated `hot` colour, NOT the near-white `core`.
  // Stacking core (fill + bloom + heart) blew the busiest cells out to flat white on
  // every house; keeping the cell body in `hot` and adding only a small core pinpoint
  // keeps hot days saturated in the house's colour instead of clipping.
  const ramp = [g.deep, g.mid, g.hot, g.hot];
  const fill = [0.42, 0.58, 0.66, 0.76];

  // Pass 1: dark coal-stone base for every cell so the wall reads as a solid grid
  // even where days are empty.
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const lv = levels[r * numCols + c];
      if (lv === undefined) continue;
      const x = gridLeft + c * cellStep;
      const y = gridTop + r * cellStep;
      ctx.beginPath();
      ctx.roundRect(x, y, cellSize, cellSize, cornerRadius);
      ctx.fillStyle = lv < 0 ? "rgba(14,11,12,0.9)" : `rgba(${g.deep},0.34)`;
      ctx.fill();
    }
  }

  // Pass 2: additive glow for active cells — the molten faces of the coals. Hotter
  // days bloom past their tile so busy stretches melt together into one glow.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const lv = levels[r * numCols + c];
      if (lv === undefined || lv < 0) continue;
      const x = gridLeft + c * cellStep;
      const y = gridTop + r * cellStep;
      const cxx = x + cellSize / 2;
      const cyy = y + cellSize / 2;
      const rgb = ramp[lv];
      // bloom halo, growing with heat, ties neighbouring hot cells together. Kept
      // modest so overlapping blooms in dense clusters don't stack up to a white clip.
      softBlob(ctx, cxx, cyy, cellSize * (0.7 + lv * 0.3), cellSize * (0.7 + lv * 0.3), rgb, 0.06 + lv * 0.038);
      // the lit face of the coal
      ctx.beginPath();
      ctx.roundRect(x, y, cellSize, cellSize, cornerRadius);
      ctx.fillStyle = `rgba(${rgb},${fill[lv] * 0.55})`;
      ctx.fill();
      // a small white-hot pinpoint at the centre of the very busiest days only — a
      // bright spark, not a full-cell wash, so the cell keeps its house colour
      if (lv === 3) softBlob(ctx, cxx, cyy, cellSize * 0.22, cellSize * 0.22, g.core, 0.26);
    }
  }
  ctx.restore();
}

export function renderGotScene(ctx: CanvasRenderingContext2D, a: GotSceneArgs) {
  const { width, height } = a;
  const g = GRADES[a.variant] ?? GRADES.targaryen;

  // 1) Warm-dark sky (no gray) — black at top, smouldering toward the fire
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, g.skyTop);
  sky.addColorStop(0.5, g.skyTop);
  sky.addColorStop(0.82, g.skyHorizon);
  sky.addColorStop(1, "#040304");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // The hearth-wall of coals (the contribution grid) sits in the mid-field; the
  // fire's burning base is anchored to its bottom edge so the flames look like they
  // rise out of the glowing coals rather than from an unrelated floor.
  const gridBottom = a.gridTop + a.numRows * a.cellStep - (a.cellStep - a.cellSize);
  const floorY = gridBottom + a.cellSize * 0.5;
  const maxH = height * 0.24;

  // 2) Brooding backlight behind the coal-wall so the grid glows out of a warm
  // field instead of floating on flat black. Kept off the very top so the clock
  // zone stays dark and clean.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const blCy = a.gridTop + (gridBottom - a.gridTop) * 0.62;
  const bl = ctx.createRadialGradient(width / 2, blCy, 0, width / 2, blCy, width * 0.95);
  bl.addColorStop(0, `rgba(${g.mid},0.2)`);
  bl.addColorStop(0.45, `rgba(${g.deep},0.12)`);
  bl.addColorStop(1, `rgba(${g.deep},0)`);
  ctx.fillStyle = bl;
  ctx.fillRect(0, height * 0.16, width, height * 0.7);
  ctx.restore();

  // 3) The contribution grid as a wall of glowing coals — the readable GitHub data
  drawContributionGrid(ctx, a, g);

  // 4) The wall of fire rising out of the coals' burning base
  drawFireWall(ctx, a, g, floorY, maxH);

  // 5) Warm uplight rising from the fire over the lower coals so the burning base
  // bleeds light up into the wall rather than ending on a hard line
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const upTop = a.gridTop;
  const up = ctx.createLinearGradient(0, floorY, 0, upTop);
  up.addColorStop(0, `rgba(${g.mid},0)`); // 0 at the floor — fire covers it, no seam
  up.addColorStop(0.3, `rgba(${g.mid},0.12)`);
  up.addColorStop(0.7, `rgba(${g.deep},0.05)`);
  up.addColorStop(1, `rgba(${g.deep},0)`); // 0 at the top — no seam
  ctx.fillStyle = up;
  ctx.fillRect(0, upTop, width, floorY - upTop);
  ctx.restore();

  // 6) Embers: warm, glowing, dense near the fire and thinning with height, sizes
  // varying widely. Each is a soft halo with a brighter heart — never a cold-white
  // speck (which would read as snow or sensor dust).
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let s = 0; s < 78; s++) {
    const sx = rnd(s * 3.1) * width;
    const climb = Math.pow(rnd(s * 1.3), 1.9); // biased low → cluster near the fire
    const sy = floorY - climb * (maxH + height * 0.07) + (rnd(s * 5.7) - 0.5) * a.cellSize;
    const sr = (0.3 + Math.pow(rnd(s * 9.3), 2) * 2.4) * (a.cellSize * 0.1);
    const sa = (0.22 + rnd(s * 2.2) * 0.5) * (1 - climb * 0.75);
    const tone = rnd(s * 6.6);
    const rgb = tone > 0.85 ? g.core : tone > 0.4 ? g.hot : g.mid;
    softBlob(ctx, sx, sy, sr * 3.2, sr * 3.2, rgb, sa * 0.45); // halo
    softBlob(ctx, sx, sy, sr * 1.1, sr * 1.1, rgb, sa);        // heart
  }
  ctx.restore();

  // 7) Dark smoke wisps drifting up off the fire for depth
  ctx.save();
  for (let s = 0; s < 6; s++) {
    const hx = (0.12 + s * 0.16) * width + (rnd(s * 7.4) - 0.5) * width * 0.12;
    const hy = floorY - maxH * (0.7 + rnd(s * 3.1) * 0.5);
    const hr = a.cellSize * (2.6 + rnd(s) * 2.2);
    const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr);
    hg.addColorStop(0, "rgba(10,7,7,0.34)");
    hg.addColorStop(1, "rgba(8,6,6,0)");
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 8) A backlight pool behind the dragon so its dark silhouette reads against a
  // bright field instead of vanishing into the near-black sky — it flies above the
  // coal-wall, away from the fire that used to light it. Centred on the dragon's
  // body, kept below the clock zone (top ~18%).
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  // Pool the glow in the sky behind the dragon's body and let it fade out by the top
  // of the coal-wall, so it lifts the dark-sky silhouette without over-boosting the
  // top grid cells (which already glow on their own and would otherwise clip).
  const haloCy = height * 0.29;
  const dbl = ctx.createRadialGradient(width / 2, haloCy, 0, width / 2, haloCy, width * 0.42);
  dbl.addColorStop(0, `rgba(${g.hot},0.26)`);
  dbl.addColorStop(0.4, `rgba(${g.mid},0.2)`);
  dbl.addColorStop(0.75, `rgba(${g.deep},0.08)`);
  dbl.addColorStop(1, `rgba(${g.deep},0)`);
  ctx.fillStyle = dbl;
  ctx.fillRect(0, height * 0.15, width, height * 0.29);
  ctx.restore();

  // 9) A few foreground sparks drifting in front of the dragon so it sits inside
  // the scene rather than pasted on top of it
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let s = 0; s < 15; s++) {
    const sx = rnd(s * 4.7 + 1) * width;
    const sy = floorY - Math.pow(rnd(s * 2.9 + 2), 1.7) * (maxH + height * 0.08);
    const sr = (0.4 + rnd(s * 7.1) * 1.2) * (a.cellSize * 0.09);
    const sa = 0.3 + rnd(s * 3.3) * 0.4;
    const rgb = rnd(s * 5.5) > 0.6 ? g.core : g.hot;
    softBlob(ctx, sx, sy, sr * 2.6, sr * 2.6, rgb, sa * 0.4);
    softBlob(ctx, sx, sy, sr, sr, rgb, sa);
  }
  ctx.restore();

  // 9.5) Molten incandescence grade over the base band. The additive fire, embers
  // and sparks blow the hottest cores out to a near-white wash (luminance ~0.95)
  // that reads as neutral photographic white, not fire. A hue/saturation blend
  // can't fix it — a saturated gold physically lives at luminance ~0.65, so any
  // blend that preserves the white's luminance can't saturate it. Multiply does
  // both: multiplying a white core by the saturated ember yields exactly the ember
  // (molten gold, or ice-blue for the Stark/Night King houses), darkening and
  // saturating in one step. Applied last so it catches the fire, embers and sparks
  // alike. Alpha fades in from the top of the band so there is no seam and the
  // cooler mid-flames above stay untouched.
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const bandTop = floorY - maxH * 0.62;
  const bandBot = floorY + a.cellSize * 1.4;
  const gband = ctx.createLinearGradient(0, bandTop, 0, bandBot);
  gband.addColorStop(0, "rgba(255,255,255,0)");
  gband.addColorStop(0.32, `rgba(${g.ember},0.42)`);
  gband.addColorStop(0.66, `rgba(${g.ember},0.9)`);
  gband.addColorStop(1, `rgba(${g.ember},0.8)`);
  ctx.fillStyle = gband;
  ctx.fillRect(0, bandTop, width, bandBot - bandTop);
  ctx.restore();

  // 10) Vignette
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const vg = ctx.createRadialGradient(width / 2, height * 0.5, height * 0.28, width / 2, height * 0.5, height * 0.68);
  vg.addColorStop(0, "rgba(255,255,255,1)");
  vg.addColorStop(1, "rgba(24,20,22,1)"); // neutral-dark edge so it darkens without tinting any house's hue
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // 11) Bottom scrim — the username/stats sit just below the fire base. Darken that
  // band so near-white product text stays legible over the bright crest.
  ctx.save();
  const scrim = ctx.createLinearGradient(0, height * 0.85, 0, height);
  scrim.addColorStop(0, "rgba(3,2,3,0)");
  scrim.addColorStop(0.45, "rgba(3,2,3,0.6)");
  scrim.addColorStop(1, "rgba(3,2,3,0.9)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, height * 0.85, width, height * 0.15);
  ctx.restore();

  // 12) Fine film grain over the whole frame — dithers the dark sky gradient so it
  // doesn't band, and adds a subtle photographic texture
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const grainStep = Math.max(3, Math.round(a.cellSize * 0.18));
  for (let gy = 0; gy < height; gy += grainStep) {
    for (let gx = 0; gx < width; gx += grainStep) {
      const v = rnd(gx * 12.9898 + gy * 78.233);
      if (v < 0.5) continue;
      ctx.globalAlpha = (v - 0.5) * 0.05;
      ctx.fillStyle = "rgb(236,238,242)"; // neutral so it doesn't warm-tint the cool houses
      ctx.fillRect(gx, gy, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Dragon silhouette — drawn LAST of all, after the vignette and grain, so nothing
  // lifts or tints its body. It stays a hard, fully-opaque cutout against the
  // backlight pool laid down behind it earlier.
  const dragon = getDragon();
  if (dragon) drawDragonSilhouette(ctx, a, dragon, g);
}

// Picker thumbnail: a small wall of fire in the house grade.
export function drawGotThumb(
  ctx: CanvasRenderingContext2D, variant: GameOfThronesVariant, S: number
) {
  const g = GRADES[variant] ?? GRADES.targaryen;
  const sky = ctx.createLinearGradient(0, 0, 0, S);
  sky.addColorStop(0, g.skyTop);
  sky.addColorStop(0.8, g.skyHorizon);
  sky.addColorStop(1, "#040304");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, S, S);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const floorY = S * 0.8;
  const heights = [0.32, 0.5, 0.78, 1.0, 0.62, 0.46, 0.36];
  for (let i = 0; i < heights.length; i++) {
    const x = S * (0.1 + i * 0.13);
    drawTongue(ctx, x, floorY, S * heights[i] * 0.62, S * 0.05, g, i + 1, heights[i]);
  }
  ctx.restore();
}
