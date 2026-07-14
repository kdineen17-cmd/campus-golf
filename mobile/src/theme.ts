// Palette and type inspired by the traditional look of Augusta National and
// The Masters: deep pine green, brass/gold accents, and cream stock paper.
export const colors = {
  fairway: "#0B5D3B", // Augusta green
  fairwayDark: "#053824", // deepest pine, used for headline text
  green: "#1E7A4F",
  sky: "#F7F3E6", // cream/parchment background
  ink: "#231F14", // near-black warm ink, not pure black
  muted: "#7B7358", // faded taupe, like aged program print
  border: "#E1D8BE", // soft khaki hairline
  card: "#FFFDF7", // ivory card stock
  danger: "#7A1F1F", // oxblood, not fire-engine red
  gold: "#B7952B", // brass / green-jacket button gold
  goldBright: "#D4AF37", // for record/leaderboard highlights
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Loaded via @expo-google-fonts in App.tsx. Playfair Display is the
// tournament-program display serif; PT Serif is the readable body serif.
export const fonts = {
  display: "PlayfairDisplay_700Bold",
  displayBlack: "PlayfairDisplay_800ExtraBold",
  displaySemibold: "PlayfairDisplay_600SemiBold",
  displayItalic: "PlayfairDisplay_600SemiBold_Italic",
  serif: "PTSerif_400Regular",
  serifBold: "PTSerif_700Bold",
  serifItalic: "PTSerif_400Regular_Italic",
};

export const radii = {
  sm: 4,
  md: 6,
  lg: 8,
};
