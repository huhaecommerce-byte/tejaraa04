/**
 * Compatibility layer that maps the react-router-dom API surface used across
 * the app onto TanStack Router. Keeps imported page/component code unchanged.
 */
import * as React from "react";
import {
  Outlet as TSOutlet,
  useRouter,
  useLocation as useTSLocation,
  useParams as useTSParams,
} from "@tanstack/react-router";

export const Outlet = TSOutlet;

export type To = string | { pathname?: string; search?: string; hash?: string };

function toHref(to: To, currentPathname: string): string {
  let href = typeof to === "string" ? to : `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;
  if (!href) href = currentPathname;
  if (href.startsWith("http")) return href;
  if (!href.startsWith("/") && !href.startsWith("?") && !href.startsWith("#")) {
    const base = currentPathname.endsWith("/") ? currentPathname.slice(0, -1) : currentPathname;
    href = `${base}/${href}`;
  }
  if (href.startsWith("?") || href.startsWith("#")) {
    href = `${currentPathname}${href}`;
  }
  return href;
}

function parseHref(href: string) {
  const [pathAndSearch, hash] = href.split("#");
  const [pathname, searchStr] = (pathAndSearch ?? "").split("?");
  const search: Record<string, string> = {};
  if (searchStr) {
    new URLSearchParams(searchStr).forEach((value, key) => {
      search[key] = value;
    });
  }
  return { pathname: pathname || "/", search, hash: hash ?? undefined };
}

export interface NavigateOptions {
  replace?: boolean;
  state?: unknown;
  preventScrollReset?: boolean;
}

export function useNavigate() {
  const router = useRouter();
  const { pathname } = useTSLocation();

  return React.useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") window.history.go(to);
        return;
      }
      const href = toHref(to, pathname);
      if (href.startsWith("http")) {
        if (typeof window !== "undefined") window.location.href = href;
        return;
      }
      const parsed = parseHref(href);
      void router.navigate({
        to: parsed.pathname,
        search: parsed.search,
        hash: parsed.hash,
        replace: options?.replace ?? false,
        state: (options?.state ?? undefined) as never,
      });
    },
    [router, pathname],
  );
}

export function useLocation() {
  const loc = useTSLocation();
  return React.useMemo(
    () => ({
      pathname: loc.pathname,
      search: loc.searchStr ? (loc.searchStr.startsWith("?") ? loc.searchStr : `?${loc.searchStr}`) : "",
      hash: loc.hash ? (loc.hash.startsWith("#") ? loc.hash : `#${loc.hash}`) : "",
      state: (loc.state ?? {}) as unknown as Record<string, unknown>,
      key: loc.href,
    }),
    [loc.pathname, loc.searchStr, loc.hash, loc.state, loc.href],
  );
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return useTSParams({ strict: false } as never) as T;
}

type SearchParamsInit = URLSearchParams | Record<string, string> | string;

export function useSearchParams(): [URLSearchParams, (next: SearchParamsInit | ((prev: URLSearchParams) => SearchParamsInit), options?: NavigateOptions) => void] {
  const loc = useTSLocation();
  const navigate = useNavigate();

  const searchParams = React.useMemo(
    () => new URLSearchParams(loc.searchStr ?? ""),
    [loc.searchStr],
  );

  const setSearchParams = React.useCallback(
    (
      next: SearchParamsInit | ((prev: URLSearchParams) => SearchParamsInit),
      options?: NavigateOptions,
    ) => {
      const resolved = typeof next === "function" ? next(new URLSearchParams(loc.searchStr ?? "")) : next;
      const params = new URLSearchParams(resolved as never);
      const qs = params.toString();
      navigate(`${loc.pathname}${qs ? `?${qs}` : ""}`, options);
    },
    [navigate, loc.pathname, loc.searchStr],
  );

  return [searchParams, setSearchParams];
}

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  to: To;
  replace?: boolean;
  state?: unknown;
  preventScrollReset?: boolean;
  reloadDocument?: boolean;
  end?: boolean;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, replace, state, preventScrollReset, reloadDocument, end, onClick, onMouseEnter, onFocus, onTouchStart, children, ...rest },
  ref,
) {
  const { pathname } = useTSLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const href = toHref(to, pathname);

  const preload = React.useCallback(() => {
    if (reloadDocument || href.startsWith("http")) return;
    const parsed = parseHref(href);
    try {
      void router.preloadRoute({ to: parsed.pathname, search: parsed.search }).catch(() => {});
    } catch {
      /* route not preloadable — ignore */
    }
  }, [router, href, reloadDocument]);

  return (
    <a
      {...rest}
      ref={ref}
      href={href}
      onMouseEnter={(e) => { onMouseEnter?.(e); preload(); }}
      onFocus={(e) => { onFocus?.(e); preload(); }}
      onTouchStart={(e) => { onTouchStart?.(e); preload(); }}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          reloadDocument ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (rest.target && rest.target !== "_self") ||
          href.startsWith("http")
        ) {
          return;
        }
        event.preventDefault();
        navigate(href, { replace, state });
      }}
    >
      {children}
    </a>
  );
});

type ClassNameFn = (props: { isActive: boolean; isPending: boolean }) => string | undefined;

export interface NavLinkProps extends Omit<LinkProps, "className" | "children" | "style"> {
  className?: string | ClassNameFn;
  style?: React.CSSProperties | ((props: { isActive: boolean; isPending: boolean }) => React.CSSProperties);
  children?: React.ReactNode | ((props: { isActive: boolean; isPending: boolean }) => React.ReactNode);
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(function NavLink(
  { className, style, children, end, to, ...rest },
  ref,
) {
  const { pathname } = useTSLocation();
  const href = toHref(to, pathname);
  const target = parseHref(href).pathname.replace(/\/$/, "") || "/";
  const current = pathname.replace(/\/$/, "") || "/";
  const isActive = end ? current === target : current === target || current.startsWith(`${target}/`);
  const state = { isActive, isPending: false };

  return (
    <Link
      {...rest}
      ref={ref}
      to={to}
      className={typeof className === "function" ? className(state) : className}
      style={typeof style === "function" ? style(state) : style}
      aria-current={isActive ? "page" : undefined}
    >
      {typeof children === "function" ? children(state) : children}
    </Link>
  );
});

export function Navigate({ to, replace = true, state }: { to: To; replace?: boolean; state?: unknown }) {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate(to, { replace, state });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function useHref(to: To) {
  const { pathname } = useTSLocation();
  return toHref(to, pathname);
}
