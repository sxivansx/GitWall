// Spider-Man theme variants. Instead of a tile grid, the contribution calendar
// is rendered as one scene (see ./spidermanScene): a spider-web spun across the
// night with your year woven into its centre, re-graded and re-styled per suit.

export type SpidermanVariant = "classic" | "miles" | "symbiote" | "verse";

export const SPIDERMAN_VARIANTS: SpidermanVariant[] = [
  "classic",
  "miles",
  "symbiote",
  "verse",
];

// Each suit's words, shown as a tagline under the web.
export const SPIDERMAN_WORDS: Record<SpidermanVariant, string> = {
  classic: "With Great Power",
  miles: "Anyone Can Wear The Mask",
  symbiote: "We Are Venom",
  verse: "It Always Fits",
};
