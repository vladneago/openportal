import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// /embed/chat.js?id=<publicKey>
//
// Returns a JavaScript file that injects a floating chat bubble + a
// popover iframe (380×600 docked at bottom-right or bottom-left).
//
// Embed:
//   <script src="https://openportal.app/embed/chat.js?id=cw_xxx" async></script>
//
// Optional <script> attributes:
//   data-color="#E91E63"        Bubble background color (default: from widget config)
//   data-position="bottom-left" Position override (default: from widget config)
//
// The bubble itself is a simple HTML/CSS element. The chat conversation
// UI lives inside an iframe pointing at /embed/chat/<publicKey> so the
// chat code is sandboxed from the host page's CSS/JS.
// ─────────────────────────────────────────────

const WEB_BASE_URL = process.env.WEB_BASE_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const publicKey = req.nextUrl.searchParams.get("id");

  if (!publicKey) {
    return new Response("// ERROR: missing 'id' query parameter", {
      status: 400,
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    });
  }

  const js = generateChatWidgetJs(publicKey);

  return new Response(js, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function generateChatWidgetJs(publicKey: string): string {
  return `/*!
 * OpenPortal Chat Widget
 * Widget key: ${publicKey}
 * Docs: https://openportal.app/docs/embed
 */
(function () {
  if (window.__OPENPORTAL_CHAT_WIDGET_LOADED__) return;
  window.__OPENPORTAL_CHAT_WIDGET_LOADED__ = true;

  var PUBLIC_KEY = ${JSON.stringify(publicKey)};
  var BASE_URL = ${JSON.stringify(WEB_BASE_URL)};

  function findScript() {
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || "";
      if (src.indexOf("/embed/chat.js") !== -1 && src.indexOf("id=" + PUBLIC_KEY) !== -1) {
        return scripts[i];
      }
    }
    return null;
  }

  var script = findScript();
  var overrideColor = script && script.getAttribute("data-color");
  var overridePosition = script && script.getAttribute("data-position");

  function fetchConfig() {
    return fetch(BASE_URL.replace(/\\/$/, "") + "/api/v1/chat-widget/public/widget?key=" + encodeURIComponent(PUBLIC_KEY), {
      headers: { "Accept": "application/json" },
    }).then(function (r) {
      if (!r.ok) throw new Error("Widget config HTTP " + r.status);
      return r.json();
    }).then(function (json) {
      if (!json.success || !json.data) throw new Error("Widget not found or inactive");
      return json.data;
    });
  }

  function init(cfg) {
    if (document.getElementById("openportal-chat-root")) return;

    var color = overrideColor || cfg.primaryColor || "#6366F1";
    var position = overridePosition || cfg.position || "bottom-right";
    var posSide = position === "bottom-left" ? "left" : "right";
    var greeting = cfg.greetingMessage || "Salut! Cu ce te pot ajuta?";
    var agentName = cfg.agentName || cfg.name || "Asistent";

    // Inject styles
    var style = document.createElement("style");
    style.id = "openportal-chat-styles";
    style.textContent = [
      "#openportal-chat-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }",
      "#openportal-chat-bubble {",
      "  position: fixed;",
      "  " + posSide + ": 24px;",
      "  bottom: 24px;",
      "  z-index: 2147483646;",
      "  width: 60px;",
      "  height: 60px;",
      "  border-radius: 50%;",
      "  background: " + color + ";",
      "  color: #fff;",
      "  border: none;",
      "  cursor: pointer;",
      "  box-shadow: 0 6px 22px rgba(0,0,0,0.22);",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  transition: transform 0.18s ease, box-shadow 0.18s ease;",
      "}",
      "#openportal-chat-bubble:hover {",
      "  transform: translateY(-2px) scale(1.05);",
      "  box-shadow: 0 10px 28px rgba(0,0,0,0.28);",
      "}",
      "#openportal-chat-bubble svg { width: 28px; height: 28px; }",
      "#openportal-chat-greeting {",
      "  position: fixed;",
      "  " + posSide + ": 96px;",
      "  bottom: 32px;",
      "  z-index: 2147483645;",
      "  max-width: 280px;",
      "  background: #fff;",
      "  color: #0F172A;",
      "  padding: 12px 16px;",
      "  border-radius: 12px;",
      "  box-shadow: 0 6px 22px rgba(0,0,0,0.14);",
      "  font-size: 13px;",
      "  line-height: 1.45;",
      "  border: 1px solid rgba(15,23,42,0.06);",
      "  opacity: 0;",
      "  transform: translateY(8px);",
      "  transition: opacity 0.2s ease, transform 0.2s ease;",
      "  pointer-events: none;",
      "}",
      "#openportal-chat-greeting.show { opacity: 1; transform: translateY(0); pointer-events: auto; }",
      "#openportal-chat-greeting .close {",
      "  position: absolute;",
      "  top: 4px;",
      "  " + (posSide === 'left' ? 'right' : 'right') + ": 6px;",
      "  background: transparent;",
      "  border: none;",
      "  font-size: 14px;",
      "  cursor: pointer;",
      "  color: #94A3B8;",
      "  padding: 2px 6px;",
      "}",
      "#openportal-chat-window {",
      "  position: fixed;",
      "  " + posSide + ": 24px;",
      "  bottom: 100px;",
      "  z-index: 2147483647;",
      "  width: 380px;",
      "  height: 600px;",
      "  max-height: calc(100vh - 140px);",
      "  background: #fff;",
      "  border-radius: 16px;",
      "  box-shadow: 0 20px 60px rgba(0,0,0,0.3);",
      "  display: none;",
      "  flex-direction: column;",
      "  overflow: hidden;",
      "  border: 1px solid rgba(15,23,42,0.08);",
      "}",
      "#openportal-chat-window.open { display: flex; }",
      "#openportal-chat-iframe { width: 100%; height: 100%; border: none; }",
      "@media (max-width: 480px) {",
      "  #openportal-chat-window {",
      "    " + posSide + ": 0; left: 0; right: 0; bottom: 0;",
      "    width: 100%; height: 100%; max-height: 100%;",
      "    border-radius: 0;",
      "  }",
      "  #openportal-chat-bubble { bottom: 16px; " + posSide + ": 16px; }",
      "  #openportal-chat-greeting { display: none; }",
      "}",
    ].join("\\n");
    document.head.appendChild(style);

    var root = document.createElement("div");
    root.id = "openportal-chat-root";
    document.body.appendChild(root);

    // Greeting bubble (only on first load, dismissible)
    var greetingDismissedKey = "openportal_chat_greeting_dismissed_" + PUBLIC_KEY;
    var greetingDismissed = false;
    try { greetingDismissed = sessionStorage.getItem(greetingDismissedKey) === "1"; } catch (e) {}

    var greetingEl = document.createElement("div");
    greetingEl.id = "openportal-chat-greeting";
    greetingEl.innerHTML =
      '<button class="close" aria-label="Închide" type="button">&#x2715;</button>' +
      '<div>' + escapeHtml(greeting) + '</div>';
    root.appendChild(greetingEl);
    greetingEl.querySelector(".close").addEventListener("click", function (e) {
      e.stopPropagation();
      greetingEl.classList.remove("show");
      try { sessionStorage.setItem(greetingDismissedKey, "1"); } catch (err) {}
      greetingDismissed = true;
    });

    if (!greetingDismissed) {
      setTimeout(function () { greetingEl.classList.add("show"); }, 1200);
    }

    // Bubble
    var bubble = document.createElement("button");
    bubble.id = "openportal-chat-bubble";
    bubble.type = "button";
    bubble.setAttribute("aria-label", "Deschide chat");
    bubble.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M21 12c0 4.418-4.03 8-9 8-1.55 0-3.01-.35-4.27-.96L3 21l1.34-4.02C3.5 15.74 3 14.42 3 13c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>' +
      '</svg>';
    root.appendChild(bubble);

    // Window (lazy-loaded iframe on first open)
    var win = document.createElement("div");
    win.id = "openportal-chat-window";
    var iframe;
    root.appendChild(win);

    function open() {
      if (!iframe) {
        iframe = document.createElement("iframe");
        iframe.id = "openportal-chat-iframe";
        iframe.src = BASE_URL + "/embed/chat/" + encodeURIComponent(PUBLIC_KEY) + "?host=" + encodeURIComponent(location.origin);
        iframe.setAttribute("title", agentName);
        iframe.setAttribute("allow", "clipboard-write");
        win.appendChild(iframe);
      }
      win.classList.add("open");
      greetingEl.classList.remove("show");
    }
    function close() { win.classList.remove("open"); }

    bubble.addEventListener("click", function () {
      if (win.classList.contains("open")) close();
      else open();
    });
    greetingEl.addEventListener("click", function (e) {
      if (e.target && e.target.classList && e.target.classList.contains("close")) return;
      open();
    });

    // Listen for "close" postMessage from iframe (X button inside)
    window.addEventListener("message", function (e) {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.source !== "openportal-chat") return;
      if (e.data.type === "close") close();
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
    });
  }

  function start() {
    fetchConfig().then(init).catch(function (err) {
      // Silent fail — don't break the host site. Log for debug.
      console.warn("[OpenPortal chat] init failed:", err && err.message ? err.message : err);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
`;
}
