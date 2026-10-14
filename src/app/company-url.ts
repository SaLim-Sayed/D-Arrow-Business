import type { RouteObject } from "react-router-dom";

/**
 * Every signed-in URL starts with the company id: /d-arrow/people/team.
 *
 * The router is created with that first segment as its basename, so the app's
 * own links ("/people/team", navigate("/tasks")) need no changes and get the
 * prefix automatically. Public pages (login, invite links, shared reports) and
 * old unprefixed links live at the root; ProtectedRoute moves signed-in users
 * from there to their company's prefix.
 */

/** First path segments the app itself uses; anything else is a company id. */
let reservedSegments = new Set<string>();
let urlCompanySegment: string | null = null;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function firstSegment(path: string | undefined): string | null {
  const seg = path?.split("/").filter(Boolean)[0];
  if (!seg || seg.startsWith(":") || seg === "*") return null;
  return seg.toLowerCase();
}

function collectSegments(routes: RouteObject[], into: Set<string>) {
  for (const route of routes) {
    const seg = firstSegment(route.path);
    if (seg) into.add(seg);
    // The root route and pathless layout routes (e.g. the protected AppLayout)
    // pass their children's segments through to the top level.
    if ((!route.path || route.path === "/") && route.children) {
      collectSegments(route.children, into);
    }
  }
}

/** Reads the company segment from the current URL and returns the router basename. */
export function initCompanyUrl(routes: RouteObject[], pathname = window.location.pathname): string {
  reservedSegments = new Set();
  collectSegments(routes, reservedSegments);
  const seg = pathname.split("/").filter(Boolean)[0];
  if (!seg || reservedSegments.has(safeDecode(seg).toLowerCase())) {
    urlCompanySegment = null;
    return "/";
  }
  urlCompanySegment = seg;
  return `/${seg}`;
}

/** Company id carried by the current URL, or null on root (unprefixed) URLs. */
export function getUrlCompanyId(): string | null {
  return urlCompanySegment ? safeDecode(urlCompanySegment) : null;
}

/**
 * Where a signed-in user should be, or null if the URL already carries their
 * company. `location` is the router location (basename already stripped).
 */
export function companyRedirectTarget(
  companyId: string | undefined,
  location: { pathname: string; search: string; hash: string }
): string | null {
  const rest = `${location.pathname}${location.search}${location.hash}`;
  // A legacy company id that collides with an app path can't be used as a
  // prefix without looping, so those users keep root URLs.
  if (!companyId || reservedSegments.has(companyId.toLowerCase())) {
    return getUrlCompanyId() === null ? null : rest;
  }
  if (getUrlCompanyId() === companyId) return null;
  return `/${encodeURIComponent(companyId)}${rest}`;
}
