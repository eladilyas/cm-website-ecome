// ContentService — CMS-managed editable surfaces.
//
// Phase strategy:
//   • Phase 2-3 — implementation reads from `src/data/` TypeScript files
//     (no CMS, no DB). The contract exists so consumers can migrate
//     forward without refactor.
//   • Phase 4+ — implementation switches to Postgres-backed
//     ContentNode + ContentRevision tables with a lightweight admin
//     editor. UI doesn't change because consumers import the contract.
//
// What lives here vs. lives in `data/`:
//   • EDITABLE-BY-MARKETING surfaces (pricing copy, industries taglines,
//     home hero variants, FAQ entries, SEO meta blocks per page) →
//     ContentService.
//   • DEVELOPER-MANAGED surfaces (route structure, product catalog
//     schema, simulator behaviour) → stay in code or in their owning
//     services. Not migrated through CMS.

import type { LocaleCode } from "./notifications";

// ── Identifiers ────────────────────────────────────────────────────────

/** Surface key — addressable identifier for a content node. Dotted path.
 *  Examples: "pricing.hero.title", "industries.cafes.tagline",
 *  "home.heroes.spring-2026.headline". */
export type SurfaceKey = string;

/** Content type — drives the editor and the rendering shape. */
export type ContentType =
  | "text"
  | "rich-text"
  | "image"
  | "json"
  | "url"
  | "color";

// ── Nodes + revisions ──────────────────────────────────────────────────

export type ContentNode = Readonly<{
  surfaceKey: SurfaceKey;
  type: ContentType;
  value: unknown; // shape determined by `type`
  locale: LocaleCode;
  revision: number;
  publishedAt?: string;
  draftAt?: string;
  updatedBy?: string; // admin user id
  updatedAt: string;
}>;

export type ContentRevision = Readonly<{
  id: string;
  surfaceKey: SurfaceKey;
  locale: LocaleCode;
  revision: number;
  value: unknown;
  createdAt: string;
  createdBy: string;
  /** Optional summary of the change. */
  changeNote?: string;
}>;

// ── Service ────────────────────────────────────────────────────────────

export interface ContentService {
  // Read (public + admin) ───────────────────────────────────────────────
  /** Get a single node, preferring the requested locale; falls back to
   *  the default locale if no translation exists. Returns the published
   *  revision unless `preview` is true. */
  get(
    surfaceKey: SurfaceKey,
    locale: LocaleCode,
    preview?: boolean,
  ): Promise<ContentNode | null>;

  /** Bulk-fetch — typical page render asks for ~10-30 nodes in one call. */
  getMany(
    surfaceKeys: SurfaceKey[],
    locale: LocaleCode,
    preview?: boolean,
  ): Promise<Map<SurfaceKey, ContentNode>>;

  /** Tree-style read for an editor — all nodes under a prefix. */
  listByPrefix(prefix: string, locale: LocaleCode): Promise<ContentNode[]>;

  // Write (admin) ───────────────────────────────────────────────────────
  /** Save a draft. Doesn't go live until publish(). */
  saveDraft(
    surfaceKey: SurfaceKey,
    locale: LocaleCode,
    value: unknown,
    editor: string,
    changeNote?: string,
  ): Promise<ContentNode>;

  publish(surfaceKey: SurfaceKey, locale: LocaleCode, editor: string): Promise<ContentNode>;
  rollback(surfaceKey: SurfaceKey, locale: LocaleCode, toRevision: number, editor: string): Promise<ContentNode>;

  // Revisions (history) ─────────────────────────────────────────────────
  listRevisions(surfaceKey: SurfaceKey, locale: LocaleCode, limit?: number): Promise<ContentRevision[]>;
}
