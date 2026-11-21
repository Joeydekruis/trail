import { cssPathForElement, xpathForElement } from "../../../../packages/core/src/preview/dom-anchor.js";

declare global {
  interface Window {
    trailPreview?: {
      submitPin: (payload: {
        comment: string;
        anchor: {
          selector: string;
          xpath: string;
          elementText: string;
          offsetX: number;
          offsetY: number;
          viewportWidth: number;
          viewportHeight: number;
          pageUrl: string;
        };
      }) => Promise<{ ok: true; pinNumber: number } | { ok: false; message: string }>;
    };
    __trailPinOverlay?: {
      setCommentMode: (enabled: boolean) => void;
    };
  }
}

type Draft = {
  pinNumber: number;
  x: number;
  y: number;
  elementLabel: string;
  anchor: {
    selector: string;
    xpath: string;
    elementText: string;
    offsetX: number;
    offsetY: number;
    viewportWidth: number;
    viewportHeight: number;
    pageUrl: string;
  };
};

const ACCENT = "#5eead4";

function elementLabel(el: Element): string {
  const aria = el.getAttribute("aria-label");
  if (aria) {
    return aria.slice(0, 80);
  }
  const text = el.textContent?.replace(/\s+/g, " ").trim() ?? "";
  if (text) {
    return text.slice(0, 80);
  }
  return el.tagName.toLowerCase();
}

function installOverlayRoot(): { shadow: ShadowRoot; layer: HTMLDivElement } {
  const hostId = "trail-pin-overlay-host";
  let host = document.getElementById(hostId);
  if (!host) {
    host = document.createElement("div");
    host.id = hostId;
    host.style.all = "initial";
    document.documentElement.appendChild(host);
  }
  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "closed" });
  shadow.innerHTML = "";
  const style = document.createElement("style");
  style.textContent = `
    .trail-layer { position: fixed; inset: 0; z-index: 2147483646; pointer-events: none; font-family: system-ui, sans-serif; }
    .trail-layer.active { pointer-events: auto; cursor: crosshair; }
    .trail-pin { position: absolute; width: 24px; height: 24px; margin: -12px 0 0 -12px; border-radius: 50%; background: ${ACCENT}; color: #04141a; font-size: 12px; font-weight: 600; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 3px rgba(0,0,0,0.35); pointer-events: none; }
    .trail-dialog { position: absolute; width: 320px; padding: 12px; border-radius: 10px; background: #15181d; border: 1px solid ${ACCENT}; color: #e8eaed; box-shadow: 0 12px 32px rgba(0,0,0,0.45); display: flex; flex-direction: column; gap: 8px; pointer-events: auto; }
    .trail-dialog textarea { width: 100%; box-sizing: border-box; min-height: 88px; padding: 8px 10px; border-radius: 8px; border: 1px solid #3a3f47; background: #0b0d10; color: #e8eaed; font: inherit; font-size: 13px; resize: vertical; }
    .trail-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .trail-btn { border: 1px solid #3a3f47; background: #1c2026; color: #e8eaed; border-radius: 8px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
    .trail-btn.primary { background: ${ACCENT}; color: #04141a; border-color: ${ACCENT}; }
  `;
  shadow.appendChild(style);
  const layer = document.createElement("div");
  layer.className = "trail-layer";
  shadow.appendChild(layer);
  return { shadow, layer };
}

export function installTrailPinOverlay(): void {
  if (window.__trailPinOverlay) {
    return;
  }

  let commentMode = false;
  let pinCounter = 0;
  let draft: Draft | null = null;
  const { layer } = installOverlayRoot();

  const render = (): void => {
    layer.replaceChildren();
    layer.className = commentMode ? "trail-layer active" : "trail-layer";
    for (const child of layer.querySelectorAll(".trail-pin")) {
      child.remove();
    }
    if (draft) {
      const pin = document.createElement("span");
      pin.className = "trail-pin";
      pin.style.left = `${draft.x}px`;
      pin.style.top = `${draft.y}px`;
      pin.textContent = String(draft.pinNumber);
      layer.appendChild(pin);

      const dialog = document.createElement("div");
      dialog.className = "trail-dialog";
      dialog.setAttribute("role", "dialog");
      const left = draft.x > window.innerWidth * 0.55 ? draft.x - 336 : draft.x + 16;
      dialog.style.left = `${Math.max(8, left)}px`;
      dialog.style.top = `${Math.max(8, draft.y - 12)}px`;

      const title = document.createElement("div");
      title.textContent = `New comment · pin ${draft.pinNumber}`;
      dialog.appendChild(title);

      const textarea = document.createElement("textarea");
      textarea.placeholder = "What should change?";
      dialog.appendChild(textarea);

      const actions = document.createElement("div");
      actions.className = "trail-dialog-actions";

      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "trail-btn";
      cancel.textContent = "Cancel";
      cancel.addEventListener("click", (e) => {
        e.stopPropagation();
        draft = null;
        render();
      });

      const send = document.createElement("button");
      send.type = "button";
      send.className = "trail-btn primary";
      send.textContent = "Send to chat";
      send.addEventListener("click", (e) => {
        e.stopPropagation();
        const text = textarea.value.trim();
        if (!text || !draft || !window.trailPreview) {
          return;
        }
        void window.trailPreview
          .submitPin({ comment: text, anchor: draft.anchor })
          .then((result) => {
            if (result.ok) {
              pinCounter = result.pinNumber;
              draft = null;
              commentMode = false;
              render();
            }
          });
      });

      actions.append(cancel, send);
      dialog.appendChild(actions);
      layer.appendChild(dialog);
      textarea.focus();
    }
  };

  layer.addEventListener(
    "click",
    (event) => {
      if (!commentMode || draft) {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('[role="dialog"]')) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const x = event.clientX;
      const y = event.clientY;
      const element = document.elementFromPoint(x, y);
      if (!element) {
        return;
      }
      const rect = element.getBoundingClientRect();
      const anchor = {
        selector: cssPathForElement(element),
        xpath: xpathForElement(element),
        elementText: elementLabel(element),
        offsetX: rect.width > 0 ? (x - rect.left) / rect.width : 0,
        offsetY: rect.height > 0 ? (y - rect.top) / rect.height : 0,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        pageUrl: window.location.href,
      };
      pinCounter += 1;
      draft = {
        pinNumber: pinCounter,
        x,
        y,
        elementLabel: anchor.elementText,
        anchor,
      };
      render();
    },
    true,
  );

  window.__trailPinOverlay = {
    setCommentMode(enabled: boolean) {
      commentMode = enabled;
      if (!enabled) {
        draft = null;
      }
      render();
    },
  };
}

installTrailPinOverlay();