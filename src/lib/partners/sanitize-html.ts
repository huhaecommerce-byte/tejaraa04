const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "P", "BR", "DIV", "SPAN", "H3", "H4", "UL", "OL", "LI", "A"]);

/**
 * Reduce editor HTML to a safe allow-list of formatting tags.
 * Runs in the browser (DOMParser); on the server the input is returned
 * with tags stripped so nothing unsafe can ever be rendered.
 */
export function sanitizeRichText(html: string): string {
  if (!html) return "";
  if (typeof window === "undefined" || typeof window.DOMParser === "undefined") {
    return html.replace(/<[^>]*>/g, "");
  }

  const doc = new window.DOMParser().parseFromString(`<body>${html}</body>`, "text/html");

  const walk = (node: Element) => {
    Array.from(node.children).forEach((child) => {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        const text = doc.createTextNode(child.textContent ?? "");
        child.replaceWith(text);
        return;
      }
      Array.from(child.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const isSafeHref =
          child.tagName === "A" && name === "href" && /^(https?:|mailto:)/i.test(attr.value.trim());
        if (!isSafeHref) child.removeAttribute(attr.name);
      });
      if (child.tagName === "A") {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }
      walk(child);
    });
  };

  walk(doc.body);
  return doc.body.innerHTML;
}
