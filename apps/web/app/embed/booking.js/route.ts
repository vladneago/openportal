import { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// /embed/booking.js?site=<siteId>
//
// Returns a JavaScript file that injects a floating booking button into the
// host page. When clicked, it opens an iframe modal pointing at /book/<siteId>.
//
// Salon owners embed it like:
//   <script src="https://openportal.app/embed/booking.js?site=abc-123" async></script>
//
// Optional <script> attributes:
//   data-color="#E91E63"        Button background color (default #6366F1)
//   data-position="bottom-right" or "bottom-left" (default bottom-right)
//   data-label="Programează"    Button label (default "Programează online")
// ─────────────────────────────────────────────

const WEB_BASE_URL = process.env.WEB_BASE_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const siteId = req.nextUrl.searchParams.get("site");

  if (!siteId) {
    return new Response("// ERROR: missing 'site' query parameter", {
      status: 400,
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    });
  }

  const js = generateWidgetJs(siteId);

  return new Response(js, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      // Cache for 5 minutes on the edge
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

function generateWidgetJs(siteId: string): string {
  // We use IIFE + DOMContentLoaded so multiple loads on the same page don't conflict.
  // The widget reads its own script-tag attributes for customization.
  return `/*!
 * OpenPortal Booking Widget
 * Site: ${siteId}
 * Docs: https://openportal.app/docs/embed
 */
(function () {
  if (window.__OPENPORTAL_BOOKING_WIDGET_LOADED__) return;
  window.__OPENPORTAL_BOOKING_WIDGET_LOADED__ = true;

  var SITE_ID = ${JSON.stringify(siteId)};
  var BASE_URL = ${JSON.stringify(WEB_BASE_URL)};

  // Find our own <script> tag so we can read data-* attributes
  function findScript() {
    var scripts = document.getElementsByTagName("script");
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || "";
      if (src.indexOf("/embed/booking.js") !== -1 && src.indexOf("site=" + SITE_ID) !== -1) {
        return scripts[i];
      }
    }
    return null;
  }
  var script = findScript();

  var color = (script && script.getAttribute("data-color")) || "#6366F1";
  var position = (script && script.getAttribute("data-position")) || "bottom-right";
  var label = (script && script.getAttribute("data-label")) || "Programează online";

  function init() {
    // Avoid double-mount when called twice
    if (document.getElementById("openportal-booking-fab")) return;

    // Inject styles
    var style = document.createElement("style");
    style.id = "openportal-booking-styles";
    style.textContent = [
      "#openportal-booking-fab {",
      "  position: fixed;",
      "  " + (position === "bottom-left" ? "left" : "right") + ": 24px;",
      "  bottom: 24px;",
      "  z-index: 2147483646;",
      "  background: " + color + ";",
      "  color: #fff;",
      "  padding: 14px 22px;",
      "  border: none;",
      "  border-radius: 999px;",
      "  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;",
      "  font-size: 15px;",
      "  font-weight: 600;",
      "  cursor: pointer;",
      "  box-shadow: 0 6px 20px rgba(0,0,0,0.18);",
      "  display: inline-flex;",
      "  align-items: center;",
      "  gap: 8px;",
      "  transition: transform 0.15s ease, box-shadow 0.15s ease;",
      "}",
      "#openportal-booking-fab:hover {",
      "  transform: translateY(-2px);",
      "  box-shadow: 0 8px 24px rgba(0,0,0,0.22);",
      "}",
      "#openportal-booking-overlay {",
      "  position: fixed;",
      "  inset: 0;",
      "  background: rgba(0,0,0,0.6);",
      "  z-index: 2147483647;",
      "  display: none;",
      "  align-items: center;",
      "  justify-content: center;",
      "  padding: 16px;",
      "  -webkit-backdrop-filter: blur(4px);",
      "  backdrop-filter: blur(4px);",
      "}",
      "#openportal-booking-overlay.open { display: flex; }",
      "#openportal-booking-frame {",
      "  width: 100%;",
      "  max-width: 760px;",
      "  height: calc(100vh - 32px);",
      "  max-height: 920px;",
      "  border: none;",
      "  border-radius: 16px;",
      "  background: #fff;",
      "  box-shadow: 0 20px 60px rgba(0,0,0,0.3);",
      "}",
      "#openportal-booking-close {",
      "  position: absolute;",
      "  top: 24px;",
      "  right: 24px;",
      "  width: 40px;",
      "  height: 40px;",
      "  border-radius: 50%;",
      "  background: #fff;",
      "  border: none;",
      "  color: #0F172A;",
      "  font-size: 20px;",
      "  cursor: pointer;",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  box-shadow: 0 4px 12px rgba(0,0,0,0.15);",
      "  z-index: 1;",
      "}",
      "@media (max-width: 640px) {",
      "  #openportal-booking-fab { padding: 12px 18px; font-size: 14px; bottom: 16px; }",
      "  #openportal-booking-fab > span.label { display: none; }",
      "  #openportal-booking-frame { height: calc(100vh - 16px); max-height: none; border-radius: 12px; }",
      "}",
    ].join("\\n");
    document.head.appendChild(style);

    // Floating action button
    var fab = document.createElement("button");
    fab.id = "openportal-booking-fab";
    fab.type = "button";
    fab.setAttribute("aria-label", label);
    fab.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<rect x="3" y="4" width="18" height="18" rx="2"/>' +
      '<path d="M16 2v4M8 2v4M3 10h18"/>' +
      '</svg>' +
      '<span class="label">' + escapeHtml(label) + '</span>';
    document.body.appendChild(fab);

    // Overlay + iframe (lazy-mounted on first click)
    var overlay;
    var frame;

    fab.addEventListener("click", function () {
      if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "openportal-booking-overlay";
        overlay.addEventListener("click", function (e) {
          if (e.target === overlay) close();
        });

        var closeBtn = document.createElement("button");
        closeBtn.id = "openportal-booking-close";
        closeBtn.type = "button";
        closeBtn.setAttribute("aria-label", "Închide");
        closeBtn.innerHTML = "&#x2715;";
        closeBtn.addEventListener("click", close);
        overlay.appendChild(closeBtn);

        frame = document.createElement("iframe");
        frame.id = "openportal-booking-frame";
        frame.src = BASE_URL + "/book/" + encodeURIComponent(SITE_ID);
        frame.setAttribute("title", "Rezervare online");
        frame.setAttribute("allow", "clipboard-write");
        overlay.appendChild(frame);

        document.body.appendChild(overlay);

        document.addEventListener("keydown", function (e) {
          if (e.key === "Escape" && overlay.classList.contains("open")) close();
        });
      }
      overlay.classList.add("open");
      document.documentElement.style.overflow = "hidden";
    });

    function close() {
      if (!overlay) return;
      overlay.classList.remove("open");
      document.documentElement.style.overflow = "";
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c];
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
`;
}
