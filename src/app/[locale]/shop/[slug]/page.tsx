// Product detail page (server component for SEO + fast initial render).
//
// Cinematic Apple-style layout:
//   1. Hero — large product image + headline + tagline + dual CTA
//   2. Features — 3-column block under the hero
//   3. Specs — full spec table with hairline rows
//   4. You may also like — 3 sibling products in the same category
//   5. Closing CTA — trial signup

import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { BrandCheck } from "@/components/ui/BrandCheck";
import { ProductCard } from "@/components/shop/ProductCard";
import { RailProductCard } from "@/components/shop/RailProductCard";
import { CartButton } from "@/components/shop/CartButton";
import { AvailabilityBadge } from "@/components/shop/AvailabilityBadge";
import { WafasalafBadge } from "@/components/shop/WafasalafBadge";
import {
  getActiveCategoryLabels,
  getPublicProductBySlug,
  listPublicProducts,
} from "@/server/catalog/service";
import { formatPrice } from "@/lib/formatPrice";

type Props = { params: Promise<{ slug: string }> };

// Statically render every product page at build time (read from DB).
export async function generateStaticParams() {
  const products = await listPublicProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.name}${product.subline ? " " + product.subline : ""} — ${product.tagline}`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name}${product.subline ? " " + product.subline : ""}`,
      description: product.tagline,
      images: [{ url: product.heroImage }],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const [product, allProducts, CATEGORY_LABEL, h] = await Promise.all([
    getPublicProductBySlug(slug),
    listPublicProducts(),
    getActiveCategoryLabels(),
    headers(),
  ]);
  if (!product) notFound();

  // Per-request nonce set by middleware. Every inline <script> we
  // emit must carry it or the browser will refuse to execute it
  // under the nonce-based CSP.
  const nonce = h.get("x-nonce") ?? undefined;

  // ── Cross-sell + related ────────────────────────────────────────
  //
  // Two distinct shelves, both designed to keep visitors browsing:
  //
  //   1. Complementary — products explicitly tagged on the catalog
  //      as good pairings (e.g. Swan POS ↔ Swift handheld). Drives
  //      basket size on purchase intent.
  //
  //   2. More in {category} — siblings in the same category. Drives
  //      consideration when the buyer isn't sure this exact unit is
  //      right. Expanded from 3 → up to 6 so there's always more to
  //      browse without bouncing to /shop.
  //
  // Both lists exclude the current product and de-dupe so the
  // complementary slugs don't show up again in the category row.
  const complementarySet = new Set(product.complementaryWith ?? []);
  const complementary = allProducts.filter(
    (p) => complementarySet.has(p.slug) && p.slug !== product.slug,
  );
  const related = allProducts
    .filter(
      (p) =>
        p.category === product.category &&
        p.slug !== product.slug &&
        !complementarySet.has(p.slug),
    )
    .slice(0, 6);

  // Schema.org Product JSON-LD — lets Google render rich snippets
  // (price, availability) on SERPs and powers shopping-tab listings.
  // We emit price as a plain Offer (HT, MAD) — search engines accept
  // a single price without minimum/maximum ranges when the catalog
  // ships one base price per product.
  const isInStock = (product.availability?.status ?? "in-stock") === "in-stock";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.name}${product.subline ? ` ${product.subline}` : ""}`,
    description: product.shortDescription,
    image: [`https://caissemanager.com${product.heroImage}`],
    sku: product.slug,
    category: product.category,
    brand: {
      "@type": "Brand",
      name: "Caisse Manager",
    },
    offers: {
      "@type": "Offer",
      url: `https://caissemanager.com/shop/${product.slug}`,
      priceCurrency: "MAD",
      price: product.priceFrom.toFixed(2),
      availability: isInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        // JSON.stringify on an object literal is safe — no user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── HERO — large image, headline, tagline, CTAs ───────────────── */}
      <section
        data-scheme="light"
        className="relative overflow-hidden bg-canvas"
      >
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-12 md:pt-20 pb-24 md:pb-32">
          <Reveal>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.14em] text-ink-mute hover:text-ink transition-colors"
            >
              ← Store
            </Link>
          </Reveal>

          <div className="mt-6 md:mt-10 grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-12 md:gap-16 items-center">
            {/* IMAGE */}
            <div className="relative -mx-6 md:mx-0 order-1 md:order-2">
              <Reveal delay={0.06}>
                <div className="relative w-full max-w-[640px] mx-auto aspect-[4/3]">
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -inset-x-[8%] -inset-y-[8%] -z-10"
                    style={{
                      background:
                        "radial-gradient(60% 50% at 50% 50%, rgba(80,130,200,0.10) 0%, rgba(80,130,200,0) 70%)",
                    }}
                  />
                  <Image
                    src={product.heroImage}
                    alt={product.alt}
                    fill
                    sizes="(min-width: 1280px) 640px, (min-width: 768px) 55vw, 100vw"
                    priority
                    className="object-contain"
                    style={{
                      filter:
                        "drop-shadow(0 32px 60px rgba(40,80,140,0.16)) drop-shadow(0 6px 14px rgba(0,0,0,0.10))",
                    }}
                  />
                </div>
              </Reveal>
            </div>

            {/* TEXT */}
            <div className="order-2 md:order-1">
              <Reveal delay={0.05}>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-4">
                  {CATEGORY_LABEL[product.category]}
                </p>
              </Reveal>
              <Reveal delay={0.1}>
                <h1
                  className="text-[clamp(1.875rem,4.2vw,3.25rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[18ch]"
                  style={{ textWrap: "balance" }}
                >
                  {product.name}
                  {product.subline && (
                    <span className="ml-3 text-[0.55em] font-normal text-ink-mute tracking-normal align-baseline">
                      {product.subline}
                    </span>
                  )}
                </h1>
              </Reveal>
              <Reveal delay={0.14}>
                <p className="mt-5 text-[19px] md:text-[22px] leading-[1.4] tracking-[-0.005em] text-ink-soft max-w-[26rem]">
                  {product.tagline}
                </p>
              </Reveal>
              <Reveal delay={0.16}>
                <div className="mt-6 flex items-baseline gap-3 flex-wrap">
                  <div className="inline-flex items-baseline gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-mute">
                      Starting at
                    </span>
                    <span className="text-[22px] md:text-[24px] font-semibold tabular-nums tracking-[-0.01em] text-ink">
                      {formatPrice(product.priceFrom)}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.12em] text-ink-mute font-medium">
                      HT
                    </span>
                  </div>
                  <AvailabilityBadge availability={product.availability} size="md" />
                </div>
              </Reveal>
              <Reveal delay={0.17}>
                {/* Financing affordance — prominent on the detail
                    page so a buyer can size the monthly commitment
                    before they ever leave the product. */}
                <WafasalafBadge
                  amount={product.priceFrom}
                  variant="card"
                  className="mt-4 max-w-[28rem]"
                />
              </Reveal>
              <Reveal delay={0.18}>
                <p className="mt-5 text-[15px] md:text-[17px] leading-[1.55] text-ink-soft max-w-[30rem]">
                  {product.shortDescription}
                </p>
              </Reveal>
              <Reveal delay={0.22}>
                <div className="mt-8 flex items-center gap-3 flex-wrap">
                  <CartButton slug={product.slug} size="md" />
                  <Button href="/start-free-trial" variant="outline" size="md">
                    Talk to a specialist
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES — 3-column block under hero ──────────────────────── */}
      <section data-scheme="light" className="bg-paper">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-3">
              Features
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[22ch]">
              What makes it work.
            </h2>
          </Reveal>

          <ul className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {product.features.map((f, i) => (
              <Reveal key={i} delay={Math.min(0.06 + i * 0.03, 0.3)}>
                <li className="flex items-start gap-3">
                  <BrandCheck variant="chip" size={11} className="mt-0.5 shrink-0" />
                  <span className="text-[15px] md:text-[16px] leading-[1.5] text-ink-soft">
                    {f}
                  </span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* ── SPECS — full table on canvas ──────────────────────────────── */}
      <section data-scheme="light" className="bg-canvas">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
          <Reveal>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-3">
              Specifications
            </p>
          </Reveal>
          <Reveal delay={0.04}>
            <h2 className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[22ch]">
              The fine print.
            </h2>
          </Reveal>

          <Reveal delay={0.08}>
            <dl className="mt-10 max-w-[800px] divide-y divide-hairline border-y border-hairline">
              {product.specs.map((s) => (
                <div
                  key={s.label}
                  className="grid grid-cols-[140px_1fr] md:grid-cols-[200px_1fr] gap-6 py-4"
                >
                  <dt className="text-[12px] md:text-[13px] uppercase tracking-[0.12em] text-ink-mute">
                    {s.label}
                  </dt>
                  <dd className="text-[14px] md:text-[15px] text-ink leading-[1.5]">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.14}>
            <p className="mt-8 text-[12px] text-ink-mute">
              Available configurations may vary by region. Contact our
              specialists for an exact build sheet matched to your operation.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── COMPLEMENTARY — "Frequently paired with" ────────────────────
          Horizontal rail of cross-category pairings. Surfaces the
          accessories / handhelds / printers that buyers typically
          add to this product. Drives basket size on the same intent. */}
      {complementary.length > 0 && (
        <section data-scheme="light" className="bg-paper">
          <SectionDivider scheme="light" />
          <div className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-20 md:pt-24 pb-10 md:pb-12">
            <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
              <div>
                <Reveal>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-3">
                    Pair it with
                  </p>
                </Reveal>
                <Reveal delay={0.04}>
                  <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink">
                    Frequently paired with the {product.name}.
                  </h2>
                </Reveal>
              </div>
              <Reveal delay={0.08}>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink transition-colors"
                >
                  Browse all hardware →
                </Link>
              </Reveal>
            </div>
            <Reveal delay={0.1}>
              <div
                className="flex gap-4 overflow-x-auto scrollbar-hide -mx-6 lg:-mx-10 px-6 lg:px-10 pb-3"
                style={{ scrollSnapType: "x mandatory" }}
              >
                {complementary.map((p) => (
                  <div
                    key={p.slug}
                    className="shrink-0 w-[280px] md:w-[300px]"
                  >
                    <RailProductCard product={p} />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── YOU MAY ALSO LIKE — more in the same category ──────────────
          Grid of same-category siblings (up to 6). Designed to keep
          consideration cycling within the category — when a buyer
          isn't sure this exact unit is right, the next 6 are one
          tap away without bouncing back to /shop. */}
      {related.length > 0 && (
        <section data-scheme="light" className="bg-paper">
          {/* Only render the top divider when the complementary
              section above didn't already paint one. Avoids a
              double hairline between two stacked light sections. */}
          {complementary.length === 0 && <SectionDivider scheme="light" />}
          <div className="mx-auto max-w-[1280px] px-6 lg:px-10 pb-20 md:pb-28 pt-10 md:pt-12">
            <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
              <div>
                <Reveal>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute mb-3">
                    More in {CATEGORY_LABEL[product.category]}
                  </p>
                </Reveal>
                <Reveal delay={0.04}>
                  <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink">
                    You may also like.
                  </h2>
                </Reveal>
              </div>
              <Reveal delay={0.08}>
                <Link
                  href={`/shop?category=${product.category}`}
                  className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-ink transition-colors"
                >
                  See all {CATEGORY_LABEL[product.category]} →
                </Link>
              </Reveal>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {related.map((p, i) => (
                <Reveal key={p.slug} delay={0.06 + i * 0.04}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CLOSING CTA ───────────────────────────────────────────────── */}
      <section data-scheme="dark" className="bg-night text-paper">
        <SectionDivider scheme="dark" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-24 md:py-32 text-center">
          <Reveal>
            <h2 className="text-[clamp(2rem,4.4vw,3rem)] font-semibold tracking-[-0.022em] leading-[1.05]">
              See it on your counter.
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-5 text-[17px] md:text-[19px] text-paper/75 max-w-[34rem] mx-auto">
              Spin up a free trial today — we&rsquo;ll size the right setup with you.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <Button href="/start-free-trial" variant="invert" size="md">
                Start Free Trial
              </Button>
              <Button href="/demo" variant="outline" size="md">
                Try the demo
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

