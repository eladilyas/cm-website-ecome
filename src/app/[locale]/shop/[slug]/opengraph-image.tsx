// Dynamic Open Graph image for /shop/[slug].
//
// Next 16's ImageResponse + a `.tsx` file at the route's segment is
// all that's needed — Next routes social-card requests here and
// caches the rendered PNG. One file, every product, no manual
// asset workflow.
//
// Renders a clean editorial card: brand mark + eyebrow + product
// name + tagline + price. No external fonts (the system stack is
// fine for OG and avoids the fetch round-trip).

import { ImageResponse } from "next/og";

import { getPublicProductBySlug } from "@/server/catalog/service";

export const runtime = "nodejs";

// Standard social-share dimensions (LinkedIn, Twitter, Facebook all
// accept 1200×630; OG validators recommend it).
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);

  if (!product) {
    // Fallback card for unknown slugs — same chrome, generic copy.
    // Prevents broken images on stale shares after a product is
    // disabled or renamed.
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fbfbfd",
            color: "#1d1d1f",
            fontSize: 48,
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          Caisse Manager · Hardware
        </div>
      ),
      size,
    );
  }

  // Format starting price the same way the marketing pages do.
  const formattedPrice = new Intl.NumberFormat("fr-FR", {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(product.priceFrom);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fbfbfd",
          color: "#1d1d1f",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          position: "relative",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
        }}
      >
        {/* Brand mark — small wordmark top-left. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "-0.005em",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#E11D2A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            ✓
          </div>
          <span>Caisse Manager</span>
        </div>

        {/* Body — eyebrow + name + tagline. mt: auto pushes them
            against the price line. */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              fontSize: 18,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              color: "#6e6e73",
              fontWeight: 600,
            }}
          >
            Hardware · {product.category.replace(/-/g, " ")}
          </div>
          <div
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: "-0.022em",
              lineHeight: 1.05,
              maxWidth: 920,
            }}
          >
            {product.name}
            {product.subline ? (
              <span style={{ color: "#6e6e73", fontWeight: 500 }}>
                {" "}
                {product.subline}
              </span>
            ) : null}
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#424245",
              lineHeight: 1.35,
              maxWidth: 880,
            }}
          >
            {product.tagline}
          </div>
        </div>

        {/* Price footer */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            alignItems: "baseline",
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: 16,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "#6e6e73",
              fontWeight: 600,
            }}
          >
            From
          </span>
          <span
            style={{
              fontSize: 44,
              fontWeight: 700,
              letterSpacing: "-0.012em",
            }}
          >
            {formattedPrice} MAD
          </span>
          <span style={{ fontSize: 18, color: "#6e6e73" }}>HT</span>
        </div>

        {/* Subtle hairline accent bottom-left */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: 80,
            height: 4,
            background: "#E11D2A",
          }}
        />
      </div>
    ),
    size,
  );
}
