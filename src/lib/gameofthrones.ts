// Game of Thrones theme variants. Instead of a tile grid, the contribution
// calendar is rendered as a field of living fire (see ./gotScene): each day is a
// flame whose height and heat track that day's activity, set against a brooding
// house backdrop. Each variant re-grades the fire and swaps the backdrop.

export type GameOfThronesVariant =
  | "targaryen"
  | "stark"
  | "lannister"
  | "nightking";

export const GAMEOFTHRONES_VARIANTS: GameOfThronesVariant[] = [
  "targaryen",
  "stark",
  "lannister",
  "nightking",
];

// Each house's words, shown as a motto under the fire. The Night King leads the
// army of the dead — no house, no words — so it carries their defining threat.
export const GAMEOFTHRONES_WORDS: Record<GameOfThronesVariant, string> = {
  targaryen: "Fire and Blood",
  stark: "Winter Is Coming",
  lannister: "Hear Me Roar",
  nightking: "The Long Night",
};
