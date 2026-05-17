import type { CSSProperties } from "react";

export type Block = {
  id: string;
  type: string;
  data: Record<string, unknown>;
};

type SiteService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  currency: string;
  color: string;
  imageUrl: string | null;
};

type SiteReview = {
  id: string;
  rating: number | null;
  comment: string | null;
  customerName: string | null;
  serviceName: string | null;
  ownerReply: string | null;
  isFeatured: boolean;
  publishedAt: string | null;
};

type RenderContext = {
  siteId: string;
  subdomain: string;
  preview: boolean;
  services: SiteService[];
  reviews: SiteReview[];
  navigation: Array<{ slug: string; title: string; isHomePage: boolean }>;
  business: {
    name: string | null;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
    hours: Array<{ dayOfWeek: number; open: string; close: string; closed: boolean }>;
    socialLinks: Record<string, string>;
  };
};

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getCtaHref(href: string, ctx: RenderContext): string {
  const base = ctx.preview ? `/preview/${ctx.siteId}` : "";
  if (href === "/") return base + "/";
  if (href.startsWith("/")) return base + href;
  return href;
}

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────

function HeroBlock({ data, ctx }: { data: Block["data"]; ctx: RenderContext }) {
  const title = s(data.title);
  const subtitle = s(data.subtitle);
  const ctaPrimary = data.ctaPrimary as { text?: string; href?: string } | undefined;
  const ctaSecondary = data.ctaSecondary as { text?: string; href?: string } | undefined;
  const bg = s(data.backgroundImage);

  return (
    <section
      style={{
        position: "relative",
        padding: "80px 24px",
        minHeight: 480,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg
          ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.55)), url(${bg}) center/cover no-repeat`
          : "linear-gradient(135deg, var(--site-primary), var(--site-accent))",
        color: bg ? "#fff" : "var(--site-text-on-primary, #fff)",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {title && (
          <h1
            style={{
              fontFamily: "var(--site-font-heading)",
              fontSize: "clamp(2rem, 5vw, 3.75rem)",
              lineHeight: 1.1,
              fontWeight: 700,
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </h1>
        )}
        {subtitle && (
          <p
            style={{
              fontFamily: "var(--site-font-body)",
              fontSize: "clamp(1.05rem, 2vw, 1.35rem)",
              opacity: 0.95,
              marginBottom: 28,
              maxWidth: 640,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {subtitle}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {ctaPrimary?.text && (
            <a
              href={getCtaHref(ctaPrimary.href || "/", ctx)}
              style={{
                background: "var(--site-primary)",
                color: "#fff",
                padding: "14px 28px",
                borderRadius: "var(--site-radius-md)",
                fontFamily: "var(--site-font-body)",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                border: "2px solid transparent",
              }}
            >
              {ctaPrimary.text}
            </a>
          )}
          {ctaSecondary?.text && (
            <a
              href={getCtaHref(ctaSecondary.href || "/", ctx)}
              style={{
                background: "transparent",
                color: "inherit",
                padding: "14px 28px",
                borderRadius: "var(--site-radius-md)",
                fontFamily: "var(--site-font-body)",
                fontWeight: 600,
                fontSize: "1rem",
                textDecoration: "none",
                border: "2px solid currentColor",
              }}
            >
              {ctaSecondary.text}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// FEATURES GRID
// ─────────────────────────────────────────────

function FeaturesGridBlock({ data }: { data: Block["data"] }) {
  const title = s(data.title);
  const features = (data.features as Array<{ icon?: string; title?: string; text?: string }>) || [];

  return (
    <section style={{ padding: "80px 24px", background: "var(--site-surface)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {title && (
          <h2
            style={{
              fontFamily: "var(--site-font-heading)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 48,
              color: "var(--site-text)",
            }}
          >
            {title}
          </h2>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              style={{
                background: "var(--site-bg)",
                padding: 28,
                borderRadius: "var(--site-radius-lg)",
                textAlign: "center",
              }}
            >
              {f.icon && (
                <div
                  style={{
                    fontSize: "2.5rem",
                    marginBottom: 12,
                  }}
                >
                  {f.icon}
                </div>
              )}
              {f.title && (
                <h3
                  style={{
                    fontFamily: "var(--site-font-heading)",
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    color: "var(--site-text)",
                    marginBottom: 8,
                  }}
                >
                  {f.title}
                </h3>
              )}
              {f.text && (
                <p
                  style={{
                    fontFamily: "var(--site-font-body)",
                    fontSize: "0.95rem",
                    color: "var(--site-text-muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {f.text}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// SERVICES PREVIEW (uses tenant's actual services)
// ─────────────────────────────────────────────

function ServicesPreviewBlock({ data, ctx }: { data: Block["data"]; ctx: RenderContext }) {
  const title = s(data.title, "Servicii");
  const subtitle = s(data.subtitle);
  const ctaText = s(data.ctaText);
  const ctaHref = s(data.ctaHref, "/servicii");
  const services = ctx.services.slice(0, 6);

  return (
    <section style={{ padding: "80px 24px", background: "var(--site-bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2
            style={{
              fontFamily: "var(--site-font-heading)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              color: "var(--site-text)",
              marginBottom: 8,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              style={{
                fontFamily: "var(--site-font-body)",
                fontSize: "1.05rem",
                color: "var(--site-text-muted)",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {services.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--site-text-muted)",
              fontFamily: "var(--site-font-body)",
            }}
          >
            (Adaugă servicii în /booking/services pentru a apărea aici)
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {services.map((svc) => (
              <ServiceCard key={svc.id} svc={svc} ctx={ctx} />
            ))}
          </div>
        )}

        {ctaText && (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <a
              href={getCtaHref(ctaHref, ctx)}
              style={{
                background: "var(--site-primary)",
                color: "#fff",
                padding: "12px 24px",
                borderRadius: "var(--site-radius-md)",
                fontFamily: "var(--site-font-body)",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {ctaText}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function ServiceCard({ svc, ctx }: { svc: SiteService; ctx: RenderContext }) {
  return (
    <div
      style={{
        background: "var(--site-surface)",
        borderRadius: "var(--site-radius-lg)",
        overflow: "hidden",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          height: 6,
          background: svc.color || "var(--site-primary)",
        }}
      />
      <div style={{ padding: 24 }}>
        <h3
          style={{
            fontFamily: "var(--site-font-heading)",
            fontSize: "1.15rem",
            fontWeight: 600,
            color: "var(--site-text)",
            marginBottom: 6,
          }}
        >
          {svc.name}
        </h3>
        {svc.description && (
          <p
            style={{
              fontFamily: "var(--site-font-body)",
              fontSize: "0.9rem",
              color: "var(--site-text-muted)",
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            {svc.description}
          </p>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--site-font-body)",
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--site-text)",
              }}
            >
              {Number(svc.price).toFixed(2)} {svc.currency}
            </div>
            <div
              style={{
                fontFamily: "var(--site-font-body)",
                fontSize: "0.8rem",
                color: "var(--site-text-muted)",
              }}
            >
              {svc.durationMinutes} min
            </div>
          </div>
          <a
            href={getCtaHref(`/programari?service=${svc.id}`, ctx)}
            style={{
              background: "var(--site-primary)",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "var(--site-radius-md)",
              fontFamily: "var(--site-font-body)",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Programează
          </a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SERVICES LIST (full catalog page)
// ─────────────────────────────────────────────

function ServicesListBlock({ data, ctx }: { data: Block["data"]; ctx: RenderContext }) {
  const displayMode = s(data.displayMode, "grid");
  const services = ctx.services;

  return (
    <section style={{ padding: "60px 24px", background: "var(--site-bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {services.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              color: "var(--site-text-muted)",
              fontFamily: "var(--site-font-body)",
            }}
          >
            Nu sunt servicii definite încă.
          </p>
        ) : displayMode === "list" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {services.map((svc) => (
              <div
                key={svc.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: 20,
                  background: "var(--site-surface)",
                  borderRadius: "var(--site-radius-lg)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    width: 4,
                    alignSelf: "stretch",
                    background: svc.color || "var(--site-primary)",
                    borderRadius: 2,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontFamily: "var(--site-font-heading)",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      color: "var(--site-text)",
                      marginBottom: 4,
                    }}
                  >
                    {svc.name}
                  </h3>
                  {svc.description && (
                    <p
                      style={{
                        fontFamily: "var(--site-font-body)",
                        fontSize: "0.9rem",
                        color: "var(--site-text-muted)",
                      }}
                    >
                      {svc.description}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--site-font-body)",
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      color: "var(--site-text)",
                    }}
                  >
                    {Number(svc.price).toFixed(2)} {svc.currency}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--site-font-body)",
                      fontSize: "0.8rem",
                      color: "var(--site-text-muted)",
                    }}
                  >
                    {svc.durationMinutes} min
                  </div>
                </div>
                <a
                  href={getCtaHref(`/programari?service=${svc.id}`, ctx)}
                  style={{
                    background: "var(--site-primary)",
                    color: "#fff",
                    padding: "10px 20px",
                    borderRadius: "var(--site-radius-md)",
                    fontFamily: "var(--site-font-body)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    flexShrink: 0,
                  }}
                >
                  Programează
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {services.map((svc) => (
              <ServiceCard key={svc.id} svc={svc} ctx={ctx} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// TEXT IMAGE
// ─────────────────────────────────────────────

function TextImageBlock({ data }: { data: Block["data"] }) {
  const title = s(data.title);
  const text = s(data.text);
  const imageUrl = s(data.imageUrl);
  const imagePosition = s(data.imagePosition, "right");

  const direction: CSSProperties["flexDirection"] = imagePosition === "left" ? "row" : "row-reverse";

  return (
    <section style={{ padding: "80px 24px", background: "var(--site-surface)" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexDirection: direction,
          gap: 48,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {imageUrl && (
          <div style={{ flex: "1 1 320px", minWidth: 280 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt=""
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "var(--site-radius-lg)",
              }}
            />
          </div>
        )}
        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          {title && (
            <h2
              style={{
                fontFamily: "var(--site-font-heading)",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 700,
                color: "var(--site-text)",
                marginBottom: 16,
              }}
            >
              {title}
            </h2>
          )}
          {text && (
            <p
              style={{
                fontFamily: "var(--site-font-body)",
                fontSize: "1.05rem",
                color: "var(--site-text-muted)",
                lineHeight: 1.7,
              }}
            >
              {text}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────

function TestimonialsBlock({ data }: { data: Block["data"] }) {
  const title = s(data.title);
  const items = (data.items as Array<{ author?: string; text?: string; rating?: number }>) || [];

  return (
    <section style={{ padding: "80px 24px", background: "var(--site-bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {title && (
          <h2
            style={{
              fontFamily: "var(--site-font-heading)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 48,
              color: "var(--site-text)",
            }}
          >
            {title}
          </h2>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {items.map((t, i) => (
            <div
              key={i}
              style={{
                background: "var(--site-surface)",
                padding: 28,
                borderRadius: "var(--site-radius-lg)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              {t.rating && (
                <div style={{ fontSize: "1.1rem", marginBottom: 12, color: "#F59E0B" }}>
                  {"★".repeat(t.rating)}
                  <span style={{ color: "rgba(0,0,0,0.15)" }}>{"★".repeat(5 - t.rating)}</span>
                </div>
              )}
              {t.text && (
                <p
                  style={{
                    fontFamily: "var(--site-font-body)",
                    fontSize: "1rem",
                    color: "var(--site-text)",
                    lineHeight: 1.6,
                    marginBottom: 16,
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{t.text}&rdquo;
                </p>
              )}
              {t.author && (
                <div
                  style={{
                    fontFamily: "var(--site-font-body)",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--site-text-muted)",
                  }}
                >
                  — {t.author}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// REVIEWS LIST — pulls live published reviews from booking_reviews
// ─────────────────────────────────────────────

function ReviewsListBlock({ data, ctx }: { data: Block["data"]; ctx: RenderContext }) {
  const title = s(data.title, "Ce spun clienții noștri");
  const subtitle = s(data.subtitle);
  const limit = typeof data.limit === "number" ? data.limit : 6;
  const minRating = typeof data.minRating === "number" ? data.minRating : 0;
  const layout = s(data.layout, "grid"); // grid | carousel — grid only for MVP
  const fallback = (data.fallbackItems as Array<{ author?: string; text?: string; rating?: number }>) || [];

  const filtered = ctx.reviews.filter((r) => r.rating !== null && (r.rating || 0) >= minRating).slice(0, limit);
  const hasReal = filtered.length > 0;
  const items = hasReal
    ? filtered.map((r) => ({
        author: r.customerName || "Client",
        text: r.comment,
        rating: r.rating,
        serviceName: r.serviceName,
        ownerReply: r.ownerReply,
        isFeatured: r.isFeatured,
        publishedAt: r.publishedAt,
      }))
    : fallback.map((f) => ({
        author: f.author || "Client mulțumit",
        text: f.text || "",
        rating: f.rating || 5,
        serviceName: null,
        ownerReply: null,
        isFeatured: false,
        publishedAt: null,
      }));

  // Compute aggregate score (only from real reviews)
  const aggregate =
    hasReal && filtered.length > 0
      ? (filtered.reduce((sum, r) => sum + (r.rating || 0), 0) / filtered.length).toFixed(1)
      : null;

  if (items.length === 0) return null;

  return (
    <section style={{ padding: "80px 24px", background: "var(--site-bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          {title && (
            <h2
              style={{
                fontFamily: "var(--site-font-heading)",
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                fontWeight: 700,
                marginBottom: 12,
                color: "var(--site-text)",
              }}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              style={{
                fontFamily: "var(--site-font-body)",
                fontSize: "1.05rem",
                color: "var(--site-text-muted)",
                maxWidth: 640,
                margin: "0 auto",
                lineHeight: 1.55,
              }}
            >
              {subtitle}
            </p>
          )}
          {aggregate && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginTop: 16,
                padding: "6px 14px",
                background: "var(--site-surface)",
                borderRadius: 999,
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <span style={{ color: "#F59E0B", fontSize: "1.05rem", letterSpacing: 1 }}>★</span>
              <strong style={{ color: "var(--site-text)", fontSize: "0.95rem" }}>{aggregate}/5</strong>
              <span style={{ color: "var(--site-text-muted)", fontSize: "0.85rem" }}>
                · {filtered.length} {filtered.length === 1 ? "recenzie" : "recenzii"}
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              style={{
                background: "var(--site-surface)",
                padding: 26,
                borderRadius: "var(--site-radius-lg)",
                border: item.isFeatured
                  ? "2px solid var(--site-primary)"
                  : "1px solid rgba(0,0,0,0.06)",
                position: "relative",
              }}
            >
              {item.isFeatured && (
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--site-primary)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  ★ Recomandat
                </div>
              )}
              {item.rating && (
                <div style={{ fontSize: "1.05rem", marginBottom: 10, color: "#F59E0B", letterSpacing: 1 }}>
                  {"★".repeat(item.rating)}
                  <span style={{ color: "rgba(0,0,0,0.15)" }}>{"★".repeat(5 - item.rating)}</span>
                </div>
              )}
              {item.text && (
                <p
                  style={{
                    fontFamily: "var(--site-font-body)",
                    fontSize: "0.98rem",
                    color: "var(--site-text)",
                    lineHeight: 1.6,
                    marginBottom: 14,
                    fontStyle: item.text ? "italic" : "normal",
                  }}
                >
                  &ldquo;{item.text}&rdquo;
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--site-font-body)",
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: "var(--site-text-muted)",
                  }}
                >
                  — {item.author}
                </div>
                {item.serviceName && (
                  <div style={{ fontSize: "0.78rem", color: "var(--site-text-muted)", opacity: 0.7 }}>
                    {item.serviceName}
                  </div>
                )}
              </div>
              {item.ownerReply && (
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: "1px solid rgba(0,0,0,0.08)",
                    fontSize: "0.85rem",
                    color: "var(--site-text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 4,
                      color: "var(--site-primary)",
                    }}
                  >
                    Răspunsul nostru
                  </div>
                  {item.ownerReply}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// CTA BANNER
// ─────────────────────────────────────────────

function CtaBannerBlock({ data, ctx }: { data: Block["data"]; ctx: RenderContext }) {
  const title = s(data.title);
  const subtitle = s(data.subtitle);
  const ctaText = s(data.ctaText);
  const ctaHref = s(data.ctaHref, "/programari");

  return (
    <section
      style={{
        padding: "60px 24px",
        background: "linear-gradient(135deg, var(--site-primary), var(--site-accent))",
        color: "#fff",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {title && (
          <h2
            style={{
              fontFamily: "var(--site-font-heading)",
              fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            style={{
              fontFamily: "var(--site-font-body)",
              fontSize: "1.05rem",
              opacity: 0.95,
              marginBottom: 28,
            }}
          >
            {subtitle}
          </p>
        )}
        {ctaText && (
          <a
            href={getCtaHref(ctaHref, ctx)}
            style={{
              background: "#fff",
              color: "var(--site-primary)",
              padding: "14px 32px",
              borderRadius: "var(--site-radius-md)",
              fontFamily: "var(--site-font-body)",
              fontWeight: 700,
              fontSize: "1rem",
              textDecoration: "none",
            }}
          >
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// CONTACT INFO
// ─────────────────────────────────────────────

const DAY_NAMES = ["Duminică", "Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă"];

function ContactInfoBlock({ data, ctx }: { data: Block["data"]; ctx: RenderContext }) {
  const showHours = data.showHours !== false;
  const showSocial = data.showSocial !== false;
  const { business } = ctx;

  return (
    <section style={{ padding: "60px 24px", background: "var(--site-surface)" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 32,
        }}
      >
        <div>
          <h3
            style={{
              fontFamily: "var(--site-font-heading)",
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "var(--site-text)",
              marginBottom: 16,
            }}
          >
            Contact
          </h3>
          <div style={{ fontFamily: "var(--site-font-body)", color: "var(--site-text)", lineHeight: 1.8 }}>
            {business.name && <div style={{ fontWeight: 600 }}>{business.name}</div>}
            {business.address && <div style={{ color: "var(--site-text-muted)" }}>{business.address}</div>}
            {business.city && <div style={{ color: "var(--site-text-muted)" }}>{business.city}</div>}
            {business.phone && (
              <div style={{ marginTop: 8 }}>
                📞 <a href={`tel:${business.phone}`} style={{ color: "var(--site-primary)" }}>
                  {business.phone}
                </a>
              </div>
            )}
            {business.email && (
              <div>
                ✉️ <a href={`mailto:${business.email}`} style={{ color: "var(--site-primary)" }}>
                  {business.email}
                </a>
              </div>
            )}
          </div>
        </div>

        {showHours && business.hours.length > 0 && (
          <div>
            <h3
              style={{
                fontFamily: "var(--site-font-heading)",
                fontSize: "1.35rem",
                fontWeight: 700,
                color: "var(--site-text)",
                marginBottom: 16,
              }}
            >
              Program
            </h3>
            <div style={{ fontFamily: "var(--site-font-body)", color: "var(--site-text)" }}>
              {business.hours.map((h) => (
                <div
                  key={h.dayOfWeek}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "4px 0",
                  }}
                >
                  <span>{DAY_NAMES[h.dayOfWeek]}</span>
                  <span style={{ color: "var(--site-text-muted)" }}>
                    {h.closed ? "Închis" : `${h.open}–${h.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSocial && Object.keys(business.socialLinks).length > 0 && (
          <div>
            <h3
              style={{
                fontFamily: "var(--site-font-heading)",
                fontSize: "1.35rem",
                fontWeight: 700,
                color: "var(--site-text)",
                marginBottom: 16,
              }}
            >
              Urmărește-ne
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(business.socialLinks).map(([key, url]) => (
                <a
                  key={key}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--site-primary)",
                    fontFamily: "var(--site-font-body)",
                    textDecoration: "none",
                  }}
                >
                  {key}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// CONTACT FORM (front only — wire backend later)
// ─────────────────────────────────────────────

function ContactFormBlock({ data }: { data: Block["data"] }) {
  const fields = (data.fields as string[]) || ["name", "email", "message"];

  return (
    <section style={{ padding: "60px 24px", background: "var(--site-bg)" }}>
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: "var(--site-surface)",
          padding: 32,
          borderRadius: "var(--site-radius-lg)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--site-font-heading)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--site-text)",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Scrie-ne un mesaj
        </h3>
        <form style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {fields.includes("name") && (
            <input
              type="text"
              placeholder="Nume"
              required
              style={inputStyle}
            />
          )}
          {fields.includes("email") && (
            <input
              type="email"
              placeholder="Email"
              required
              style={inputStyle}
            />
          )}
          {fields.includes("phone") && (
            <input type="tel" placeholder="Telefon" style={inputStyle} />
          )}
          {fields.includes("message") && (
            <textarea placeholder="Mesaj" rows={5} required style={inputStyle as CSSProperties} />
          )}
          <button
            type="submit"
            style={{
              background: "var(--site-primary)",
              color: "#fff",
              padding: "14px",
              border: "none",
              borderRadius: "var(--site-radius-md)",
              fontFamily: "var(--site-font-body)",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            Trimite
          </button>
        </form>
      </div>
    </section>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  fontFamily: "var(--site-font-body)",
  fontSize: "0.95rem",
  border: "1px solid rgba(0,0,0,0.15)",
  borderRadius: "var(--site-radius-md)",
  background: "var(--site-bg)",
  color: "var(--site-text)",
};

// ─────────────────────────────────────────────
// BOOKING WIDGET (embedded link to public booking page)
// ─────────────────────────────────────────────

function BookingWidgetBlock({ ctx }: { ctx: RenderContext }) {
  const url = ctx.preview
    ? `/preview/${ctx.siteId}/programari`
    : `/book/${ctx.subdomain}`;

  return (
    <section style={{ padding: "60px 24px", background: "var(--site-bg)" }}>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          background: "var(--site-surface)",
          padding: 32,
          borderRadius: "var(--site-radius-lg)",
          border: "1px solid rgba(0,0,0,0.06)",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--site-font-heading)",
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--site-text)",
            marginBottom: 12,
          }}
        >
          Rezervare online
        </h3>
        <p
          style={{
            fontFamily: "var(--site-font-body)",
            fontSize: "1rem",
            color: "var(--site-text-muted)",
            marginBottom: 24,
          }}
        >
          Alege serviciul, ora și completează datele tale — confirmare instantă.
        </p>
        <a
          href={url}
          style={{
            display: "inline-block",
            background: "var(--site-primary)",
            color: "#fff",
            padding: "14px 32px",
            borderRadius: "var(--site-radius-md)",
            fontFamily: "var(--site-font-body)",
            fontWeight: 600,
            fontSize: "1rem",
            textDecoration: "none",
          }}
        >
          Deschide rezervarea →
        </a>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// TEAM
// ─────────────────────────────────────────────

function TeamBlock({ data }: { data: Block["data"] }) {
  const title = s(data.title);
  const members = (data.members as Array<{ name?: string; role?: string; avatarUrl?: string }>) || [];

  return (
    <section style={{ padding: "80px 24px", background: "var(--site-surface)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {title && (
          <h2
            style={{
              fontFamily: "var(--site-font-heading)",
              fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 48,
              color: "var(--site-text)",
            }}
          >
            {title}
          </h2>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 24,
          }}
        >
          {members.map((m, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  margin: "0 auto 16px",
                  background: m.avatarUrl
                    ? `url(${m.avatarUrl}) center/cover`
                    : "linear-gradient(135deg, var(--site-primary), var(--site-accent))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "2.5rem",
                  fontFamily: "var(--site-font-heading)",
                  fontWeight: 600,
                }}
              >
                {!m.avatarUrl && m.name?.[0]}
              </div>
              {m.name && (
                <h3
                  style={{
                    fontFamily: "var(--site-font-heading)",
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    color: "var(--site-text)",
                    marginBottom: 4,
                  }}
                >
                  {m.name}
                </h3>
              )}
              {m.role && (
                <p
                  style={{
                    fontFamily: "var(--site-font-body)",
                    fontSize: "0.9rem",
                    color: "var(--site-text-muted)",
                  }}
                >
                  {m.role}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// DISPATCHER
// ─────────────────────────────────────────────

export function BlockRenderer({ block, ctx }: { block: Block; ctx: RenderContext }) {
  switch (block.type) {
    case "hero":
      return <HeroBlock data={block.data} ctx={ctx} />;
    case "featuresGrid":
      return <FeaturesGridBlock data={block.data} />;
    case "servicesPreview":
      return <ServicesPreviewBlock data={block.data} ctx={ctx} />;
    case "servicesList":
      return <ServicesListBlock data={block.data} ctx={ctx} />;
    case "textImage":
      return <TextImageBlock data={block.data} />;
    case "testimonials":
      return <TestimonialsBlock data={block.data} />;
    case "reviewsList":
      return <ReviewsListBlock data={block.data} ctx={ctx} />;
    case "ctaBanner":
      return <CtaBannerBlock data={block.data} ctx={ctx} />;
    case "contactInfo":
      return <ContactInfoBlock data={block.data} ctx={ctx} />;
    case "contactForm":
      return <ContactFormBlock data={block.data} />;
    case "bookingWidget":
      return <BookingWidgetBlock ctx={ctx} />;
    case "team":
      return <TeamBlock data={block.data} />;
    default:
      return (
        <div
          style={{
            padding: 24,
            background: "rgba(0,0,0,0.05)",
            color: "rgba(0,0,0,0.5)",
            fontFamily: "monospace",
            fontSize: "0.85rem",
            textAlign: "center",
          }}
        >
          [Unknown block type: {block.type}]
        </div>
      );
  }
}

export type { RenderContext };
