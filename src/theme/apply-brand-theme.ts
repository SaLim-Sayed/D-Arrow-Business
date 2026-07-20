import { buildCustomBrandPalette, hexToHsl, type ColorScale } from "./brand-colors";
import { STORAGE_KEYS } from "@/lib/constants";

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

function scaleToVars(prefix: string, scale: ColorScale, out: Record<string, string>) {
  for (const step of SCALE_STEPS) {
    out[cssVarName(prefix, step)] = toHslTriplet(scale[step]);
  }
}

function applyVars(vars: Record<string, string>) {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}

function clearVars(varNames: string[]) {
  const root = document.documentElement;
  for (const name of varNames) root.style.removeProperty(name);
}

function persistVars(vars: Record<string, string> | null) {
  try {
    if (vars) {
      localStorage.setItem(STORAGE_KEYS.BRAND_THEME_VARS, JSON.stringify(vars));
    } else {
      localStorage.removeItem(STORAGE_KEYS.BRAND_THEME_VARS);
    }
  } catch {
    // localStorage can throw in private-browsing/storage-restricted contexts —
    // theme still applies for this session, just won't survive a refresh.
  }
}

/**
 * Overrides HeroUI's compiled --heroui-primary/-secondary CSS variables with a
 * company's custom brand colors, regenerating the full 50–900 scale so shade
 * variants (bg-primary-100, text-primary-700, etc.) stay consistent with the
 * override rather than falling back to the compiled default hue.
 *
 * Also caches the computed CSS variables to localStorage so index.html's
 * inline script can replay them synchronously on the next page load/refresh,
 * before the Firestore company-profile fetch has a chance to resolve —
 * without that, every refresh would flash the default palette first.
 *
 * Pass undefined for either color to fall back to the app's default brand
 * palette (compiled into tailwind.config.js via src/theme/brand-colors.ts).
 */
export function applyCompanyBrandTheme(primaryHex?: string, secondaryHex?: string) {
  if (!primaryHex && !secondaryHex) {
    clearVars([
      ...SCALE_STEPS.map((s) => cssVarName("primary", s)),
      ...SCALE_STEPS.map((s) => cssVarName("secondary", s)),
      "--heroui-focus",
    ]);
    persistVars(null);
    return;
  }

  const palette = buildCustomBrandPalette(primaryHex, secondaryHex);
  const vars: Record<string, string> = {};
  scaleToVars("primary", palette.primary, vars);
  scaleToVars("secondary", palette.secondary, vars);
  vars["--heroui-focus"] = toHslTriplet(primaryHex ?? palette.primary.DEFAULT);

  applyVars(vars);
  persistVars(vars);
}
