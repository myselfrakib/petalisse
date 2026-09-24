// Color mapping and utility functions for Petalisse product color variants

export const COLOR_MAP: Record<string, string> = {
  // Pinks & Roses
  pink: '#F4A7B9',
  'blush pink': '#F8B9C4',
  blush: '#F9C0C8',
  'rose pink': '#F299AC',
  rose: '#E86F88',
  'rose gold': '#B76E79',
  dustyrose: '#DCAE96',
  'dusty rose': '#DCAE96',
  magenta: '#D0417E',
  coral: '#F88379',
  peach: '#FFDAB9',
  salmon: '#FA8072',

  // Whites, Creams & Neutrals
  white: '#FFFFFF',
  'ivory white': '#FFFFF0',
  ivory: '#FFFFF0',
  cream: '#FFFDD0',
  pearl: '#F8F6F0',
  'pearl cream': '#FBF6E9',
  offwhite: '#FAF9F6',
  'off white': '#FAF9F6',
  beige: '#F5F5DC',
  tan: '#D2B48C',
  sand: '#C2B280',
  champagne: '#F7E7CE',
  nude: '#E3BC9A',

  // Purples & Lilacs
  purple: '#8E4585',
  lavender: '#E6E6FA',
  lilac: '#C8A2C8',
  violet: '#7F00FF',
  plum: '#8E4585',
  mauve: '#E0B0FF',
  orchid: '#DA70D6',

  // Greens
  green: '#5E8B65',
  'sage green': '#9CAF88',
  sage: '#9CAF88',
  mint: '#98FF98',
  'mint green': '#A8E6CF',
  olive: '#708238',
  emerald: '#50C878',
  forest: '#2E5A36',
  pistachio: '#93C572',
  matcha: '#B3C890',

  // Blues
  blue: '#6BA4B8',
  'sky blue': '#87CEEB',
  'baby blue': '#A2CFFE',
  pastel: '#E6E6FA',
  navy: '#000080',
  'navy blue': '#1B2A4A',
  teal: '#008080',
  cyan: '#00FFFF',
  turquoise: '#40E0D0',
  powder: '#B0E0E6',
  'powder blue': '#B0E0E6',
  denim: '#1560BD',

  // Reds & Warm tones
  red: '#D93848',
  burgundy: '#800020',
  wine: '#722F37',
  cherry: '#DE3163',
  crimson: '#DC143C',
  maroon: '#800000',
  terracotta: '#E2725B',
  orange: '#FFA07A',
  rust: '#B7410E',

  // Yellows & Golds
  yellow: '#FBE870',
  butter: '#FFF1A8',
  lemon: '#FFF44F',
  gold: '#D4AF37',
  honey: '#EB9605',
  mustard: '#FFDB58',

  // Darks & Metallics
  silver: '#C0C0C0',
  grey: '#9E9E9E',
  gray: '#9E9E9E',
  charcoal: '#36454F',
  black: '#1F1F1F',
  'midnight black': '#141414',
  brown: '#8B4513',
  chocolate: '#7B3F00',
  mocha: '#967969',
};

export const SUGGESTED_COLORS = [
  'Blush Pink',
  'Ivory White',
  'Sage Green',
  'Lavender',
  'Rose Gold',
  'Burgundy',
  'Sky Blue',
  'Champagne',
  'Lilac',
  'Mint Green',
  'Pearl Cream',
  'Midnight Black',
];

/**
 * Returns a CSS hex/hsl color for any color name or hex input.
 */
export function getColorHex(colorName?: string): string {
  if (!colorName) return '#E8A598';
  const trimmed = colorName.trim();

  // If already a valid hex string (e.g. #FFF or #FFFFFF)
  if (/^#([0-9A-F]{3}){1,2}$/i.test(trimmed)) {
    return trimmed;
  }

  const lower = trimmed.toLowerCase();

  // Exact match
  if (COLOR_MAP[lower]) {
    return COLOR_MAP[lower];
  }

  // Substring match
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) {
      return hex;
    }
  }

  // Graceful deterministic soft pastel fallback based on hash
  let hash = 0;
  for (let i = 0; i < lower.length; i++) {
    hash = lower.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 72%)`;
}
