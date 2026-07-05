/** Compact modern invoice layout — D-Arrow branding. */
export const INVOICE_LOGO = "/DR_LOGO__2_-2-01-removebg-preview.png";

/** Loaded via index.html — max weight 700; avoid 800 in print/PDF. */
export const INVOICE_FONT =
  '"IBM Plex Sans Arabic", Tahoma, "Segoe UI", Arial, sans-serif';

export const INVOICE_THEME = {
  primary: "#ff6b4a",
  secondary: "#d53a81",
  primaryDark: "#d53a81",
  accent: "#E65C65",
  headerBg: "#FFE8E3",
  border: "#ff6b4a",
  borderLight: "#FFCAB8",
  label: "#d53a81",
  text: "#111116",
  muted: "#5C6B7A",
  totalBg: "linear-gradient(90deg, #ff6b4a 0%, #d53a81 100%)",
  totalText: "#FFFFFF",
  placeholderBg: "#FFF5F3",
  gradientBar: "linear-gradient(90deg, #ff6b4a 0%, #d53a81 45%, #ff6b4a 100%)",
} as const;
