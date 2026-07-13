import { buildCustomBrandPalette, hexToHsl, type ColorScale } from "./brand-colors";

const SCALE_STEPS: (keyof ColorScale)[] = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "DEFAULT",
  "foreground",
];

function cssVarName(prefix: string, step: keyof ColorScale) {
  if (step === "DEFAULT") return `--heroui-${prefix}`;
  return `--heroui-${prefix}-${step.toLowerCase()}`;
}

function toHslTriplet(hex: string) {
  const { h, s, l } = hexToHsl(hex);
  return `${h} ${s}% ${l}%`;
}

function applyScale(prefix: string, scale: ColorScale) {
  const root = document.documentElement;
  for (const step of SCALE_STEPS) {
    root.style.setProperty(cssVarName(prefix, step), toHslTriplet(scale[step]));
  }
}

function clearScale(prefix: string) {
  const root = document.documentElement;
  for (const step of SCALE_STEPS) {
    root.style.removeProperty(cssVarName(prefix, step));
  }
}

/**
 * Overrides HeroUI's compiled --heroui-primary/-secondary CSS variables with a
 * company's custom brand colors, regenerating the full 50–900 scale so shade
 * variants (bg-primary-100, text-primary-700, etc.) stay consistent with the
 * override rather than falling back to the compiled default hue.
 *
 * Pass undefined for either color to fall back to the app's default brand
 * palette (compiled into tailwind.config.js via src/theme/brand-colors.ts).
 */
export function applyCompanyBrandTheme(primaryHex?: string, secondaryHex?: string) {
  if (!primaryHex && !secondaryHex) {
    clearScale("primary");
    clearScale("secondary");
    document.documentElement.style.removeProperty("--heroui-focus");
    return;
  }

  const palette = buildCustomBrandPalette(primaryHex, secondaryHex);
  applyScale("primary", palette.primary);
  applyScale("secondary", palette.secondary);
  document.documentElement.style.setProperty(
    "--heroui-focus",
    toHslTriplet(primaryHex ?? palette.primary.DEFAULT)
  );
}
