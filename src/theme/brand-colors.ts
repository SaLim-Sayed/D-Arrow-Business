// Single source of truth for the app's color palette. tailwind.config.js,
// print/PDF templates (invoice/quotation themes), and the runtime per-company
// brand color override all import from here instead of duplicating hex
// literals — previously the same orange/pink values were hardcoded in at
// least four separate files and could drift out of sync.

export type ColorScale = {
  "50": string;
  "100": string;
  "200": string;
  "300": string;
  "400": string;
  "500": string;
  "600": string;
  "700": string;
  "800": string;
  "900": string;
  DEFAULT: string;
  foreground: string;
};

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToHsl(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const delta = max - min;

  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  if (h < 0) h += 360;

  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number) {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

// Fixed lightness ladder shared by every palette, so all generated scales
// read as one consistent system regardless of each palette's base hue.
const LIGHTNESS_STEPS: [keyof Omit<ColorScale, "DEFAULT" | "foreground">, number][] = [
  ["50", 96],
  ["100", 91],
  ["200", 82],
  ["300", 70],
  ["400", 58],
  ["500", 50],
  ["600", 42],
  ["700", 34],
  ["800", 26],
  ["900", 18],
];

/** Builds a full 50–900 tint/shade scale from a single base hex, keeping its hue. */
export function buildColorScale(baseHex: string, foreground: string): ColorScale {
  const { h, s } = hexToHsl(baseHex);
  const scale = {} as ColorScale;

  for (const [step, l] of LIGHTNESS_STEPS) {
    const stepNum = Number(step);
    // Light tints are softened (less saturated) so they don't look neon;
    // mid/dark steps keep the base saturation for a punchy, on-brand feel.
    const satAdj = stepNum <= 200 ? Math.max(20, s - 25) : stepNum <= 400 ? Math.max(30, s - 10) : s;
    scale[step] = hslToHex(h, clamp(satAdj, 0, 100), l);
  }

  scale.DEFAULT = baseHex;
  scale.foreground = foreground;
  return scale;
}

export const BRAND_PRIMARY_HEX = "#ff6b4a";
export const BRAND_SECONDARY_HEX = "#d53a81";
// Success/warning/danger are picked to harmonize with the warm orange/pink
// brand instead of falling back to HeroUI's stock blue-leaning defaults —
// each hue is kept clearly distinct from the primary orange (~11°) so status
// colors stay unambiguous.
const BRAND_SUCCESS_HEX = "#1db876"; // warm-leaning emerald
const BRAND_WARNING_HEX = "#f5a623"; // gold — distinct hue from primary orange
const BRAND_DANGER_HEX = "#e5383b"; // true red — distinct hue from primary orange

export const brandPalette = {
  primary: buildColorScale(BRAND_PRIMARY_HEX, "#FFFFFF"),
  secondary: buildColorScale(BRAND_SECONDARY_HEX, "#FFFFFF"),
  success: buildColorScale(BRAND_SUCCESS_HEX, "#FFFFFF"),
  warning: buildColorScale(BRAND_WARNING_HEX, "#111116"),
  danger: buildColorScale(BRAND_DANGER_HEX, "#FFFFFF"),
};

/** Regenerates the primary/secondary scales from a company's custom brand colors. */
export function buildCustomBrandPalette(primaryHex?: string, secondaryHex?: string) {
  return {
    primary: buildColorScale(primaryHex ?? BRAND_PRIMARY_HEX, "#FFFFFF"),
    secondary: buildColorScale(secondaryHex ?? BRAND_SECONDARY_HEX, "#FFFFFF"),
  };
}
