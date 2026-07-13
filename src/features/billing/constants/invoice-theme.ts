import { BRAND_PRIMARY_HEX, BRAND_SECONDARY_HEX } from "@/theme/brand-colors";

/** Compact modern invoice layout — D-Arrow branding. */
export const INVOICE_LOGO = "/DR_LOGO__2_-2-01-removebg-preview.png";

/** Loaded via index.html — max weight 700; avoid 800 in print/PDF. */
export const INVOICE_FONT =
  '"IBM Plex Sans Arabic", Tahoma, "Segoe UI", Arial, sans-serif';

export const INVOICE_THEME = {
  primary: BRAND_PRIMARY_HEX,
  secondary: BRAND_SECONDARY_HEX,
  primaryDark: BRAND_SECONDARY_HEX,
  accent: "#E65C65",
  headerBg: "#FFE8E3",
  border: BRAND_PRIMARY_HEX,
  borderLight: "#FFCAB8",
  label: BRAND_SECONDARY_HEX,
  text: "#111116",
  muted: "#5C6B7A",
  totalBg: `linear-gradient(90deg, ${BRAND_PRIMARY_HEX} 0%, ${BRAND_SECONDARY_HEX} 100%)`,
  totalText: "#FFFFFF",
  placeholderBg: "#FFF5F3",
  gradientBar: `linear-gradient(90deg, ${BRAND_PRIMARY_HEX} 0%, ${BRAND_SECONDARY_HEX} 45%, ${BRAND_PRIMARY_HEX} 100%)`,
} as const;
