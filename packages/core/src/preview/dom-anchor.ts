/** Builds a stable CSS selector for pin anchoring (short, prefers #id). */
export function cssPathForElement(element: Element): string {
  if (element.id) {
    const id = element.id.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
    return `#${id}`;
  }
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.documentElement) {
    let part = current.tagName.toLowerCase();
    if (current.classList.length > 0) {
      const classes = [...current.classList]
        .filter((c) => !c.startsWith("trail-pin"))
        .slice(0, 2)
        .join(".");
      if (classes) {
        part += `.${classes}`;
      }
    }
    const parent: Element | null = current.parentElement;
    if (parent) {
      const currentEl = current;
      const siblings = [...parent.children].filter((c) => c.tagName === currentEl.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(currentEl) + 1;
        part += `:nth-of-type(${index})`;
      }
    }
    parts.unshift(part);
    current = parent;
    if (parts.length >= 6) {
      break;
    }
  }
  return parts.join(" > ");
}

/** Minimal XPath for pin anchoring. */
export function xpathForElement(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index += 1;
      }
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(`${current.tagName.toLowerCase()}[${index}]`);
    current = current.parentElement;
    if (parts.length >= 8) {
      break;
    }
  }
  return `/${parts.join("/")}`;
}