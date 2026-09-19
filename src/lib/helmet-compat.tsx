/**
 * Minimal react-helmet-async replacement backed by direct document.head
 * mutation. Applied on the client after hydration.
 */
import * as React from "react";

type AnyProps = Record<string, unknown>;

const MANAGED_ATTR = "data-helmet-compat";

function applyChild(node: React.ReactElement): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const type = node.type as string;
  const props = node.props as AnyProps;

  if (type === "title") {
    document.title = React.Children.toArray(props["children"] as React.ReactNode).join("");
    return null;
  }

  const el = document.createElement(type);
  for (const [key, value] of Object.entries(props)) {
    if (key === "children") continue;
    if (value === undefined || value === null || value === false) continue;
    el.setAttribute(key === "className" ? "class" : key, String(value));
  }
  if (props["children"] !== undefined && (type === "script" || type === "style")) {
    el.textContent = React.Children.toArray(props["children"] as React.ReactNode).join("");
  }
  el.setAttribute(MANAGED_ATTR, "true");

  // Replace an existing tag with the same identity instead of duplicating it.
  const identity =
    el.getAttribute("name")
      ? `${type}[name="${el.getAttribute("name")}"]`
      : el.getAttribute("property")
        ? `${type}[property="${el.getAttribute("property")}"]`
        : type === "link" && el.getAttribute("rel") === "canonical"
          ? 'link[rel="canonical"]'
          : null;

  if (identity) {
    // Only remove tags this module created. React (router head) owns other head
    // nodes; deleting those makes React crash later with "removeChild of null".
    document.head.querySelectorAll(`${identity}[${MANAGED_ATTR}]`).forEach((existing) => existing.remove());
  }

  document.head.appendChild(el);
  return el;
}

export function Helmet({ children }: { children?: React.ReactNode }) {
  React.useEffect(() => {
    const created: HTMLElement[] = [];
    const previousTitle = typeof document !== "undefined" ? document.title : "";

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) return;
      const el = applyChild(child);
      if (el) created.push(el);
    });

    return () => {
      created.forEach((el) => el.remove());
      if (typeof document !== "undefined") document.title = previousTitle;
    };
  });

  return null;
}

export function HelmetProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
