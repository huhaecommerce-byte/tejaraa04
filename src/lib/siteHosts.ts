import { createIsomorphicFn } from "@tanstack/react-start";

/** Hostname dedicated to the wholesale / supplier portal. */
export const SUPPLIER_HOST = "partners.tejaraa.com";

/** Absolute base URL used for supplier-portal canonical and OG links. */
export const SUPPLIER_ORIGIN = `https://${SUPPLIER_HOST}`;

/** Resolve the hostname of the current request (SSR) or page (browser). */
export const getCurrentHost = createIsomorphicFn()
  .server(async () => {
    const { getRequestHost } = await import("@tanstack/react-start/server");
    try {
      return getRequestHost({ xForwardedHost: true });
    } catch {
      return "";
    }
  })
  .client(async () => window.location.hostname);

export function isSupplierHost(host: string | undefined | null) {
  if (!host) return false;
  return host.split(":")[0]?.toLowerCase() === SUPPLIER_HOST;
}
