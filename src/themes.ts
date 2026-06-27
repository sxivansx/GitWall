import type { MinecraftVariant } from "./lib/minecraft";
import type { OnePieceVariant } from "./lib/onepiece";
import type { AttackOnTitanVariant } from "./lib/attackontitan";
import type { GameOfThronesVariant } from "./lib/gameofthrones";

export interface Theme {
  name: string;
  background: string;
  empty: string;
  levels: [string, string, string, string];
  text: string;
  subtext: string;
  // When set, cells are drawn as pixel-art icons instead of plain boxes/circles,
  // or (attackontitan/gameofthrones) the whole calendar is rendered as one scene.
  // `empty`/`levels` only feed the theme-picker swatch in these modes.
  style?: "minecraft" | "onepiece" | "attackontitan" | "gameofthrones" | "pointblank";
  variant?: MinecraftVariant | OnePieceVariant | AttackOnTitanVariant | GameOfThronesVariant;
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

  // ── Attack on Titan styles ────────────────────────────────────────────────
  // Cells render as the Survey Corps "Wings of Freedom" pixel emblem
  // (see src/lib/attackontitan.ts). `empty`/`levels` only feed the swatch.
  "aot-wingsoffreedom": {
    name: "Wings of Freedom",
    style: "attackontitan",
    variant: "wingsoffreedom",
    background: "#0e1117",
    empty: "#1c222c",
    levels: ["#39477a", "#4a63b0", "#6f93e0", "#a7c4ff"],
    text: "#e8edf6",
    subtext: "#7e8aa0",
  },
  "aot-colossal": {
    name: "Colossal Titan",
    style: "attackontitan",
    variant: "colossal",
    background: "#140a0a",
    empty: "#1a1416",
    levels: ["#5a1a14", "#8a241a", "#b83020", "#e04030"],
    text: "#f6e6e2",
    subtext: "#a07c74",
  },
  "aot-attacktitan": {
    name: "Attack Titan",
    style: "attackontitan",
    variant: "attacktitan",
    background: "#100c08",
    empty: "#1e150e",
    levels: ["#4a3418", "#7a5420", "#b07c2e", "#e0a848"],
    text: "#f6ecd8",
    subtext: "#b09a72",
  },
  "aot-militarypolice": {
    name: "Military Police",
    style: "attackontitan",
    variant: "militarypolice",
    background: "#0e140e",
    empty: "#16241a",
    levels: ["#2c4a30", "#3f6b44", "#5a9458", "#7fbe72"],
    text: "#e6f0e6",
    subtext: "#88a888",
  },
  "aot-garrison": {
    name: "Garrison Regiment",
    style: "attackontitan",
    variant: "garrison",
    background: "#16100e",
    empty: "#241612",
    levels: ["#5a2420", "#8a352c", "#b3463a", "#d65a48"],
    text: "#f6e4e0",
    subtext: "#b08a82",
  },
  "aot-cadetcorps": {
    name: "Cadet Corps",
    style: "attackontitan",
    variant: "cadetcorps",
    background: "#0f1216",
    empty: "#1a2028",
    levels: ["#3a4654", "#566678", "#7c8da0", "#aab8c8"],
    text: "#eaeef4",
    subtext: "#8c98a6",
  },

  // ── Game of Thrones styles ────────────────────────────────────────────────
  // The whole calendar renders as one fire scene (see src/lib/gotScene.ts):
  // every day is a flame over a brooding house backdrop. `empty`/`levels` only
  // feed the theme-picker swatch.
  "got-targaryen": {
    name: "House Targaryen",
    style: "gameofthrones",
    variant: "targaryen",
    background: "#0a0505",
    empty: "#1d0a07",
    levels: ["#961c0c", "#ff521a", "#ffb23c", "#fff8d6"],
    text: "#f6e4dc",
    subtext: "#b08a7a",
  },
  "got-stark": {
    name: "House Stark",
    style: "gameofthrones",
    variant: "stark",
    background: "#04070c",
    empty: "#081320",
    levels: ["#143a70", "#4292e2", "#a2d6ff", "#ecf7ff"],
    text: "#e6eef8",
    subtext: "#8298b0",
  },
  "got-lannister": {
    name: "House Lannister",
    style: "gameofthrones",
    variant: "lannister",
    background: "#0a0804",
    empty: "#1d1505",
    levels: ["#78141a", "#e6461c", "#ffd450", "#fff6c2"],
    text: "#f6eccc",
    subtext: "#b09a6a",
  },
  "got-nightking": {
    name: "The Night King",
    style: "gameofthrones",
    variant: "nightking",
    background: "#03060b",
    empty: "#06111e",
    levels: ["#1a4e96", "#5cb4ff", "#c4ecff", "#ffffff"],
    text: "#eaf4ff",
    subtext: "#88a4c0",
  },

  // ── Point Blank ───────────────────────────────────────────────────────────
  // The whole calendar renders as one terminal screen (see src/lib/pbScene.ts):
  // your year is the code, clasped by the giant `<.>` brackets of the logo, with
  // a cursor block on today. `empty`/`levels` only feed the theme-picker swatch.
  pointblank: {
    name: "Point Blank",
    style: "pointblank",
    background: "#04070a",
    empty: "#1a3022",
    levels: ["#0d5230", "#10914c", "#00c853", "#5dffa0"],
    text: "#d6ffe6",
    subtext: "#6fbf90",
  },
};

export function getTheme(name: string): Theme {
  return THEMES[name] || THEMES.classic;
}
