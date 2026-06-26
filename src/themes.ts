import type { MinecraftVariant } from "./lib/minecraft";
import type { OnePieceVariant } from "./lib/onepiece";

export interface Theme {
  name: string;
  background: string;
  empty: string;
  levels: [string, string, string, string];
  text: string;
  subtext: string;
  // When set, cells are drawn as pixel-art icons instead of plain boxes/circles.
  // `empty`/`levels` only feed the theme-picker swatch in these modes.
  style?: "minecraft" | "onepiece";
  variant?: MinecraftVariant | OnePieceVariant;
}

export const THEMES: Record<string, Theme> = {
  classic: {
    name: "Classic",
    background: "#0C1116",
    empty: "#161C23",
    levels: ["#023A16", "#196E2D", "#2CA044", "#39d353"],
    text: "#ffffff",
    subtext: "#8b949e",
  },
  light: {
    name: "Light",
    background: "#ffffff",
    empty: "#ebedf0",
    levels: ["#9be9a8", "#40c463", "#30a14e", "#216e39"],
    text: "#24292f",
    subtext: "#57606a",
  },
  ocean: {
    name: "Ocean",
    background: "#0a192f",
    empty: "#112240",
    levels: ["#1d3461", "#1f5f8b", "#00b4d8", "#90e0ef"],
    text: "#ccd6f6",
    subtext: "#8892b0",
  },
  sunset: {
    name: "Sunset",
    background: "#1a1a2e",
    empty: "#16213e",
    levels: ["#e94560", "#f27121", "#e9724c", "#ffc857"],
    text: "#eee2dc",
    subtext: "#bab2b5",
  },
  mono: {
    name: "Mono",
    background: "#000000",
    empty: "#1a1a1a",
    levels: ["#404040", "#737373", "#a6a6a6", "#d9d9d9"],
    text: "#ffffff",
    subtext: "#999999",
  },
  bhagwa: {
    name: "Bhagwa",
    background: "#1a0d00",
    empty: "#3a2410",
    // True kesari/saffron ramp: golden saffron -> deep saffron (#FF9933,
    // India flag) -> temple saffron (#FF7722) -> kesari vermilion (#FF671F).
    // Staying in the saffron family keeps even sparse cells reading saffron
    // instead of muddy brown.
    levels: ["#f4c430", "#ff9933", "#ff7722", "#ff671f"],
    text: "#fff3e0",
    subtext: "#e0b483",
  },

  // ── Minecraft styles ──────────────────────────────────────────────────────
  // Cells render as pixel-art blocks (see src/lib/minecraft.ts). `empty`/`levels`
  // here only feed the theme-picker swatch. Slime is the default Minecraft style.
  "minecraft-slime": {
    name: "Slime",
    style: "minecraft",
    variant: "slime",
    background: "#10160e",
    empty: "#2b3326",
    levels: ["#4a7a35", "#5fa53f", "#74c24a", "#8ce05a"],
    text: "#e3f3da",
    subtext: "#7c9c66",
  },
  "minecraft-emerald": {
    name: "Emerald Ore",
    style: "minecraft",
    variant: "emerald",
    background: "#16191d",
    empty: "#7e7e7e",
    levels: ["#1c9e54", "#2cb262", "#34d878", "#7df0a8"],
    text: "#eaf6ee",
    subtext: "#7f9587",
  },
  "minecraft-chest": {
    name: "Loot Chest",
    style: "minecraft",
    variant: "chest",
    background: "#1b1712",
    empty: "#8a8a8a",
    levels: ["#9c6b35", "#b7843f", "#f4c430", "#34d878"],
    text: "#f3e9d8",
    subtext: "#9c8b70",
  },
  "minecraft-grass": {
    name: "Grass & Trees",
    style: "minecraft",
    variant: "grass",
    background: "#12150e",
    empty: "#7a5536",
    levels: ["#5aa83e", "#4a8c2c", "#3f8f2c", "#2c6e1e"],
    text: "#e9f3dc",
    subtext: "#8a9c70",
  },

  // ── One Piece styles ──────────────────────────────────────────────────────
  // Cells render as pixel-art icons (see src/lib/onepiece.ts).
  "onepiece-jollyroger": {
    name: "Jolly Roger",
    style: "onepiece",
    variant: "jollyroger",
    background: "#0b1828",
    empty: "#071422",
    levels: ["#2a2a52", "#5a5a9e", "#9898d8", "#e8e8ff"],
    text: "#e0e0ff",
    subtext: "#6868a0",
  },
  "onepiece-devilfruit": {
    name: "Devil Fruit",
    style: "onepiece",
    variant: "devilfruit",
    background: "#10081e",
    empty: "#1e1030",
    levels: ["#4a1068", "#7a20a8", "#aa48e8", "#e898ff"],
    text: "#f0d0ff",
    subtext: "#9060b0",
  },
  "onepiece-strawhat": {
    name: "Straw Hat",
    style: "onepiece",
    variant: "strawhat",
    background: "#180c00",
    empty: "#3e2a14",
    levels: ["#7a6420", "#b09030", "#d4b040", "#f0cc50"],
    text: "#fff0cc",
    subtext: "#c09840",
  },
};

export function getTheme(name: string): Theme {
  return THEMES[name] || THEMES.classic;
}
