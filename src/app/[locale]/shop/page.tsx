// Shop catalog page.
//
// Apple Store / Stripe hardware aesthetic — not an ecommerce checkout. Hero
// is editorial typography on canvas; products are organized in a generous
// grid below. Cards show a starting price ("From X MAD HT"); the cart +
// checkout produce the formal total.
//
// SERVER COMPONENT. Products + categories are fetched server-side via
// the catalog readers (cached + tagged 'catalog'). The search-param
// filter is read from the route props (not useSearchParams). Reveal /
// CategoryStrip / ProductCard remain client islands.

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { ProductCard } from "@/components/shop/ProductCard";
import { CategoryStrip } from "@/components/shop/CategoryStrip";
import {
  listPublicCategories,
  listPublicProducts,
  getActiveCategoryLabels,
} from "@/server/catalog/service";
import type {
  CatalogCategory,
  CatalogProduct,
} from "@/server/catalog/types";

type SearchParams = { category?: string | string[] };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const categoryRaw = params.category;
  const category =
    typeof categoryRaw === "string" ? categoryRaw : categoryRaw?.[0] ?? null;

  const [allProducts, categories, categoryLabels, t, tCat] = await Promise.all([
    listPublicProducts(),
    listPublicCategories(),
    getActiveCategoryLabels(),
    getTranslations("shop"),
    getTranslations("shop.categories"),
  ]);

  const labelFor = (slug: string): string => {
    const k = tCat(slug);
    if (k && k !== `shop.categories.${slug}`) return k;
    return categoryLabels[slug] ?? slug;
  };

  // Resolve the active category — if the filter is a PARENT category,
  // include products from all of its children too. Lets the user click
  // "POS Périphériques" and see Écran + Scanner + Imprimante + … all
  // together instead of zero products.
  const products: CatalogProduct[] = !category
    ? [...allProducts]
    : (() => {
        const childSlugs = categories
          .filter((c) => c.parentSlug === category)
          .map((c) => c.slug);
        const allowed = new Set<string>([category, ...childSlugs]);
        return allProducts.filter((p) => allowed.has(p.category));
      })();

  return (
    <>
      {/* ── Hero (canvas) — Apple-Store-style "headline + sidebar" lockup.
            Left: oversized "Store" wordmark anchors the page. Right: a
            compact value statement + two service links that promote
            human contact over silent browsing. Mobile collapses to a
            single column with the sidebar sitting under the wordmark. ── */}
      <section data-scheme="light" className="relative overflow-hidden bg-canvas">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 pt-10 md:pt-14 pb-6 md:pb-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-10 items-end">
            <div>
              <Reveal>
                <p className="text-[10.5px] font-medium uppercase tracking-[0.20em] text-ink-mute mb-2.5">
                  {t("eyebrow")}
                </p>
              </Reveal>
              <Reveal delay={0.04}>
                <h1
                  className="text-[clamp(2rem,4.4vw,3.5rem)] font-semibold tracking-[-0.022em] leading-[0.96] text-ink"
                >
                  {t("title")}
                </h1>
              </Reveal>
            </div>
            <Reveal delay={0.08}>
              <div className="text-[13px] md:text-[14px] leading-[1.5] md:text-right max-w-[22rem] md:justify-self-end">
                <p className="text-ink font-medium">
                  {t("sidebarHeadline")}
                </p>
                <div className="mt-2.5 space-y-1.5">
                  <p>
                    <Link
                      href="/start-free-trial"
                      className="inline-flex items-center gap-1 text-[#E11D2A] hover:opacity-80 transition-opacity"
                    >
                      {t("talkSpecialist")}
                      <Arrow />
                    </Link>
                  </p>
                  <p>
                    <Link
                      href="/demo"
                      className="inline-flex items-center gap-1 text-[#E11D2A] hover:opacity-80 transition-opacity"
                    >
                      {t("seePlatform")}
                      <Arrow />
                    </Link>
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <div className="mt-7 md:mt-10">
              <CategoryStrip />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Product grid ────────────────────────────────────────────
          When NO category filter is active, products are rendered
          GROUPED under their category header (POS Terminal → its
          products, POS Portable → its products, …) so the storefront
          stops looking like a random product wall. When a specific
          category IS filtered, render a flat grid scoped to that
          category. Sub-categories (Périphériques children) follow
          their parent's grouping when the parent is the active filter. */}
      <section data-scheme="light" className="bg-paper">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-10 md:py-14">
          {category ? (
            <FlatCategoryView
              title={labelFor(category) || t("fallbackTitle")}
              products={products}
              emptyBody={t("emptyCategoryBody")}
              countLabel={(n: number) =>
                t("filterCount", { count: n })
              }
            />
          ) : (
            <GroupedCategoryView
              allProducts={allProducts}
              categories={categories}
              labelFor={labelFor}
              countLabel={(n: number) =>
                t("filterCount", { count: n })
              }
            />
          )}
        </div>
      </section>

      {/* ── Store difference (Apple-style benefits row) ────────────────── */}
      <section data-scheme="light" className="bg-canvas">
        <SectionDivider scheme="light" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28">
          <Reveal>
            <h2
              className="text-[clamp(1.75rem,3.6vw,2.5rem)] font-semibold tracking-[-0.022em] leading-[1.05] text-ink max-w-[26ch]"
              style={{ textWrap: "balance" }}
            >
              {t("benefitsTitleA")}{" "}
              <span className="text-ink-mute font-normal">{t("benefitsTitleB")}</span>
            </h2>
          </Reveal>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <BenefitCard
              icon={<TrucksIcon />}
              accent="text-emerald-600"
              title={
                <>
                  <span className="text-emerald-600">{t("benefitDeliveryStrong")}</span>{" "}
                  {t("benefitDeliveryBody")}
                </>
              }
              delay={0.06}
            />
            <BenefitCard
              icon={<SetupIcon />}
              accent="text-[#E11D2A]"
              title={
                <>
                  <span className="text-[#E11D2A]">{t("benefitSetupStrong")}</span>{" "}
                  {t("benefitSetupBody")}
                </>
              }
              delay={0.1}
            />
            <BenefitCard
              icon={<CreditIcon />}
              accent="text-amber-600"
              title={
                <>
                  <span className="text-amber-600">{t("benefitMonthlyStrong")}</span>{" "}
                  {t("benefitMonthlyBody")}
                </>
              }
              delay={0.14}
            />
            <BenefitCard
              icon={<ShieldIcon />}
              accent="text-blue-600"
              title={
                <>
                  <span className="text-blue-600">{t("benefitWarrantyStrong")}</span>{" "}
                  {t("benefitWarrantyBody")}
                </>
              }
              delay={0.18}
            />
          </div>
        </div>
      </section>

      {/* ── Footer pre-CTA strip ──────────────────────────────────────── */}
      <section data-scheme="dark" className="bg-night text-paper">
        <SectionDivider scheme="dark" />
        <div className="mx-auto max-w-[1280px] px-6 lg:px-10 py-20 md:py-28 text-center">
          <Reveal>
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.022em] leading-[1.05]">
              {t("ctaTitle")}
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <p className="mt-5 text-[16px] md:text-[18px] text-paper/75 max-w-[32rem] mx-auto">
              {t("ctaBody")}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
              <Button href="/start-free-trial" variant="invert" size="md">
                {t("ctaStartTrial")}
              </Button>
              <Button href="/demo" variant="outline" size="md">
                {t("ctaTryDemo")}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

// ── Caisse Manager difference — supporting components ──────────────────
// Compact Apple-style benefit card: icon in a colored chip, then a short
// promise statement. The `accent` prop drives the icon-chip background tint
// (e.g. "text-emerald-600") — the colored span inside `title` is what
// pulls visual emphasis to the value claim.

function BenefitCard({
  icon,
  accent,
  title,
  delay = 0,
}: {
  icon: React.ReactNode;
  accent: string;
  title: React.ReactNode;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="h-full rounded-2xl border border-hairline bg-paper p-5 md:p-6 flex flex-col">
        <span
          aria-hidden
          className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-canvas ${accent}`}
        >
          {icon}
        </span>
        <p className="mt-5 text-[14px] md:text-[15px] leading-[1.45] text-ink">
          {title}
        </p>
      </div>
    </Reveal>
  );
}

// ── Icons — 20px line set, stroke 1.6, rounded caps. Color via parent. ──

function TrucksIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 17V7h10v10M13 11h4l3 3v3h-7M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SetupIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 7a3 3 0 1 1-3-3l1.5 1.5L11 7l1.5 1.5L11 10l3 .5 3-3 3 3-1 1L19 14l-7 7-3-3 1-1-1.5-1.5L7 17l-3-3 7-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18M7 15h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 12 2.5 2.5L15.5 10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="translate-y-px"
    >
      <path
        d="M4 8l4-4M4.5 4H8v3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Shop list views ────────────────────────────────────────────────

/** Flat grid for a single-category filter view (or a sub-category). */
function FlatCategoryView({
  title,
  products,
  emptyBody,
  countLabel,
}: {
  title: string;
  products: readonly CatalogProduct[];
  emptyBody: string;
  countLabel: (n: number) => string;
}) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4 flex-wrap mb-7">
        <Reveal>
          <h2 className="text-[clamp(1.375rem,2.4vw,1.875rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink">
            {title}
          </h2>
        </Reveal>
        <p className="text-[11.5px] text-ink-mute tabular-nums shrink-0">
          {countLabel(products.length)}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[14px] text-ink-soft max-w-[36rem] mx-auto leading-[1.55]">
            {emptyBody}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 auto-rows-fr">
          {products.map((p, i) => (
            <Reveal
              key={p.slug}
              delay={Math.min(0.05 + i * 0.03, 0.25)}
              className="h-full"
            >
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}

/** No filter — group products under their category header so the shop
 *  reads as a curated directory instead of a flat product wall.
 *  Iterates the categories in their stored displayOrder; for the
 *  parent "POS Périphériques" we also gather every child's products
 *  into one block (the header still says Périphériques, products are
 *  scoped to the whole branch). */
function GroupedCategoryView({
  allProducts,
  categories,
  labelFor,
  countLabel,
}: {
  allProducts: readonly CatalogProduct[];
  categories: readonly CatalogCategory[];
  labelFor: (slug: string) => string;
  countLabel: (n: number) => string;
}) {
  const tops = categories
    .filter((c) => !c.parentSlug && c.isActive)
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const productsByTop: Record<string, CatalogProduct[]> = {};
  for (const top of tops) {
    const childSlugs = categories
      .filter((c) => c.parentSlug === top.slug)
      .map((c) => c.slug);
    const allowed = new Set<string>([top.slug, ...childSlugs]);
    productsByTop[top.slug] = allProducts.filter((p) => allowed.has(p.category));
  }

  return (
    <div className="space-y-14 md:space-y-20">
      {tops.map((top, idx) => {
        const list = productsByTop[top.slug] ?? [];
        if (list.length === 0) return null;
        return (
          <section key={top.slug} aria-labelledby={`grp-${top.slug}`}>
            <div className="flex items-baseline justify-between gap-4 flex-wrap mb-6">
              <Reveal>
                <h2
                  id={`grp-${top.slug}`}
                  className="text-[clamp(1.375rem,2.4vw,1.875rem)] font-semibold tracking-[-0.018em] leading-[1.1] text-ink"
                >
                  {labelFor(top.slug)}
                </h2>
              </Reveal>
              <p className="text-[11.5px] text-ink-mute tabular-nums shrink-0">
                {countLabel(list.length)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 auto-rows-fr">
              {list.map((p, i) => (
                <Reveal
                  key={p.slug}
                  delay={Math.min(0.04 + i * 0.03, 0.22)}
                  className="h-full"
                >
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>

            {idx < tops.length - 1 && (
              <div className="mt-12 md:mt-16 h-px bg-hairline" aria-hidden />
            )}
          </section>
        );
      })}
    </div>
  );
}
