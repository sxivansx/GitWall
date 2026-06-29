import { type CanvasRenderingContext2D } from "canvas";

export interface BreakingBadSceneArgs {
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
}

const BG_SKY = "#1c2e17"; // dark toxic green sky
const BG_MESA = "#111f0d"; // very dark mesa
const BG_DESERT = "#1e2e1a"; // dark desert floor

const RAMP = ["#8a7c2b", "#b06623", "#3e8c3b", "#3bbaba"]; // grungy yellow, orange, green, blue
const EMPTY = "rgba(45, 62, 35, 0.4)"; // translucent empty block

const ELEMENTS = [
  "H","He","Li","Be","B","C","N","O","F","Ne","Na","Mg","Al","Si","P","S","Cl","Ar",
  "K","Ca","Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br",
  "Kr","Rb","Sr","Y","Zr","Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb","Te",
  "I","Xe","Cs","Ba","La","Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm",
  "Yb","Lu","Hf","Ta","W","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn",
  "Fr","Ra","Ac","Th","Pa","U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr"
];

function drawMesa(ctx: CanvasRenderingContext2D, width: number, y: number, scale: number) {
  ctx.save();
  ctx.fillStyle = BG_MESA;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(0, y - 60 * scale);
  ctx.lineTo(40 * scale, y - 70 * scale);
  ctx.lineTo(80 * scale, y - 40 * scale);
  ctx.lineTo(150 * scale, y - 80 * scale);
  ctx.lineTo(220 * scale, y - 50 * scale);
  ctx.lineTo(width, y - 90 * scale);
  ctx.lineTo(width, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRV(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  ctx.save();
  
  // RV Body
  ctx.fillStyle = "#d1cda9"; // grungy cream
  const rvW = 160 * scale;
  const rvH = 60 * scale;
  const rvX = cx - rvW / 2;
  const rvY = cy - rvH;
  
  ctx.beginPath();
  ctx.moveTo(rvX + 10 * scale, rvY);
  ctx.lineTo(rvX + rvW - 20 * scale, rvY);
  ctx.lineTo(rvX + rvW, rvY + rvH);
  ctx.lineTo(rvX, rvY + rvH);
  ctx.closePath();
  ctx.fill();
  
  ctx.lineWidth = 1.5 * scale;
  ctx.strokeStyle = "#000000";
  ctx.stroke();

  // Stripes (Yellow and Orange)
  ctx.fillStyle = "#c28132";
  ctx.fillRect(rvX, rvY + rvH * 0.5, rvW - 5 * scale, 5 * scale);
  ctx.fillStyle = "#a85025";
  ctx.fillRect(rvX, rvY + rvH * 0.6, rvW - 3 * scale, 5 * scale);

  // Wheels
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(rvX + 30 * scale, rvY + rvH, 12 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rvX + rvW - 40 * scale, rvY + rvH, 12 * scale, 0, Math.PI * 2); ctx.fill();
  
  // Wheel Hubs
  ctx.fillStyle = "#aaa";
  ctx.beginPath(); ctx.arc(rvX + 30 * scale, rvY + rvH, 5 * scale, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(rvX + rvW - 40 * scale, rvY + rvH, 5 * scale, 0, Math.PI * 2); ctx.fill();

  // Windshield
  ctx.fillStyle = "#557788";
  ctx.beginPath();
  ctx.moveTo(rvX + rvW - 35 * scale, rvY + 5 * scale);
  ctx.lineTo(rvX + rvW - 22 * scale, rvY + 5 * scale);
  ctx.lineTo(rvX + rvW - 8 * scale, rvY + 30 * scale);
  ctx.lineTo(rvX + rvW - 35 * scale, rvY + 30 * scale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Windows
  ctx.fillStyle = "#334455";
  ctx.fillRect(rvX + 20 * scale, rvY + 10 * scale, 30 * scale, 20 * scale);
  ctx.strokeRect(rvX + 20 * scale, rvY + 10 * scale, 30 * scale, 20 * scale);
  
  ctx.fillRect(rvX + 60 * scale, rvY + 10 * scale, 25 * scale, 20 * scale);
  ctx.strokeRect(rvX + 60 * scale, rvY + 10 * scale, 25 * scale, 20 * scale);

  // Door
  ctx.fillStyle = "#c1bd9a";
  ctx.fillRect(rvX + 95 * scale, rvY + 10 * scale, 25 * scale, rvH - 15 * scale);
  ctx.strokeRect(rvX + 95 * scale, rvY + 10 * scale, 25 * scale, rvH - 15 * scale);

  // Roof vents
  ctx.fillStyle = "#aaa";
  ctx.fillRect(rvX + 20 * scale, rvY - 5 * scale, 20 * scale, 5 * scale);
  ctx.fillRect(rvX + 80 * scale, rvY - 6 * scale, 15 * scale, 6 * scale);
  
  ctx.restore();
}

export function renderBreakingBadScene(ctx: CanvasRenderingContext2D, a: BreakingBadSceneArgs): void {
  const { width, height, gridLeft, gridTop, numCols, numRows, cellSize, cellStep, cornerRadius, levels } = a;
  const scale = width / 393;

  // Sky gradient (Toxic green/yellow)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.4);
  skyGrad.addColorStop(0, "#4a5933");
  skyGrad.addColorStop(1, BG_SKY);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  const horizon = height * 0.35;

  // Mesas
  drawMesa(ctx, width, horizon, scale);

  // Desert Floor (dark green/brown)
  const floorGrad = ctx.createLinearGradient(0, horizon, 0, height);
  floorGrad.addColorStop(0, "#192415");
  floorGrad.addColorStop(1, BG_DESERT);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizon, width, height - horizon);

  // The RV (placed above the grid)
  drawRV(ctx, width / 2, horizon + 50 * scale, scale);

  // The Grid (Periodic Table Elements)
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  
  for (let i = 0; i < levels.length; i++) {
    const col = i % numCols;
    const row = Math.floor(i / numCols);
    const x = gridLeft + col * cellStep;
    const y = gridTop + row * cellStep;
    const lv = levels[i];

    if (lv < 0) {
      // Empty outline
      ctx.fillStyle = EMPTY;
      ctx.fillRect(x, y, cellSize, cellSize);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);
    } else {
      const element = ELEMENTS[i % ELEMENTS.length];
      
      // Box
      ctx.fillStyle = RAMP[lv];
      ctx.fillRect(x, y, cellSize, cellSize);
      
      // Outline
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1 * scale;
      ctx.strokeRect(x, y, cellSize, cellSize);
      
      // Text
      ctx.fillStyle = "#ffffff";
      const fontSize = Math.max(8, cellSize * 0.55);
      ctx.font = `bold ${fontSize}px Inter`;
      ctx.fillText(element, x + cellSize / 2, y + cellSize / 2 + cellSize * 0.05);
      
      // Atomic Number (tiny)
      ctx.font = `${Math.max(5, cellSize * 0.25)}px Inter`;
      ctx.textAlign = "left";
      ctx.fillText(`${(i % ELEMENTS.length) + 1}`, x + cellSize * 0.1, y + cellSize * 0.2);
      ctx.textAlign = "center";
    }
  }
  ctx.restore();

  // Dark vignette at the bottom for readability of user stats
  const vig = ctx.createLinearGradient(0, height * 0.8, 0, height);
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.8)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, height * 0.8, width, height * 0.2);
}
