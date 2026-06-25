// CatalogHydrator — server component that runs the catalog reads and
// passes them into the client provider. Mounted ONCE at the root via
// SiteChrome.
//
// Cheap thanks to `unstable_cache` tags in
// src/server/catalog/service.ts — the underlying queries don't re-run
// on every navigation, only when an admin mutation revalidates the
// catalog tag.
//
// Failure mode: this component runs above EVERY page (root layout).
// If Postgres is unreachable (Neon serverless cold-start, network
// blip, planned maintenance) we MUST NOT crash the whole site.
// Failing the catalog read drops us to an empty provider — pages
// that don't depend on catalog data (legal, auth, account chrome)
// continue to render normally; pages that do (shop, product, home
// rail) degrade gracefully to empty states. The visitor sees the
// site instead of a 500.

import {
  listPublicCategories,
  listPublicProducts,
} from "@/server/catalog/service";
import { CatalogProvider } from "./CatalogProvider";

export async function CatalogHydrator({
  children,
}: {
  children: React.ReactNode;
}) {
  const [products, categories] = await Promise.all([
    listPublicProducts().catch((err) => {
      // Neon cold-start, network drop, etc. Log and degrade.
      // Cloudwatch/Vercel logs will surface this; the visitor sees
      // the site without product listings rather than a 500.
      console.warn(
        "[CatalogHydrator] listPublicProducts failed — rendering empty catalog",
        err instanceof Error ? err.message : err,
      );
      return [];
    }),
    listPublicCategories().catch((err) => {
      console.warn(
        "[CatalogHydrator] listPublicCategories failed — rendering empty category list",
        err instanceof Error ? err.message : err,
      );
      return [];
    }),
  ]);
  return (
    <CatalogProvider products={products} categories={categories}>
      {children}
    </CatalogProvider>
  );
}
