"use client";

// Customization sheet — variants, modifier groups, combo steps.
//
// One component handles all three customization shapes a product can
// carry. The wizard intentionally renders ALL sections at once
// (Square / Toast style) rather than walking step-by-step — most
// products only have 1-2 sections, and a paged wizard for "size +
// milk" would be friction. Combo products with many steps still fit
// on one scrollable sheet.
//
// Picker rules:
//   • Variants — exactly-1, required (no add-to-order until picked).
//     Defaults to the first variant.
//   • Modifier group "exactly-1" — radio, required.
//   • Modifier group "up-to-n" — checkboxes capped by group.max.
//   • Combo step "exactly-1" — radio, required.
//   • Combo step "up-to-n" — checkboxes capped by step.max.
//
// Live total in the footer updates as picks change. Confirm emits
// { variantId, modifiers, comboSelections } and the caller decides
// what to do (typically addLineWithSelections).

import { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  DemoProduct,
  Modifier,
  ModifierGroup,
} from "@/data/demo/types";
import { useDemoStore } from "@/lib/demoStore";
import { lineUnitPrice } from "@/lib/orderMath";
import { Sheet } from "./Sheet";

// ── Translation helpers ────────────────────────────────────────────
//
// Modifier groups, variants, combo steps, and their options live in
// `src/data/demo/activities.ts` with English `name` literals. We don't
// want to mirror those strings in the catalog (data drift risk), so
// instead the sheet looks them up by their stable `id` field. The
// helper falls back to the raw name when no key matches — that way a
// freshly-seeded option still renders (untranslated) instead of
// throwing.

const KNOWN_GROUP_IDS = new Set([
  "size",
  "milk",
  "extras",
  "syrup",
  "spice-level",
  "cheese-type",
  "toppings",
  "doneness",
  "style",
  "blend",
  "drink",
  "side",
]);

const KNOWN_OPTION_IDS = new Set([
  "size-s",
  "size-m",
  "size-l",
  "milk-none",
  "milk-whole",
  "milk-oat",
  "milk-almond",
  "shot",
  "vanilla",
  "hazelnut",
  "cocoa",
  "cheese-cheddar",
  "cheese-blue",
  "cheese-vegan",
  "cheese-slice",
  "jalapenos",
  "extra-pickles",
  "no-onions",
  "no-tomato",
  "no-sauce",
  "bacon",
  "egg",
  "fries",
  "onion-rings",
  "spice-mild",
  "spice-med",
  "spice-hot",
  "low",
  "med",
  "well",
  "high",
  "fade",
  "taper",
  "scissor",
  "skin-fade",
  "fringe",
  "layers",
  "bob",
  "blend",
  "wash",
  "hot-towel",
  "aftershave",
  "long-trim",
  "beard-trim",
  "mustache",
  "deep-cond",
  "scalp",
  "hair-mask",
  "color-app",
]);

function translateGroup(
  t: ReturnType<typeof useTranslations>,
  id: string,
  fallback: string,
): string {
  return KNOWN_GROUP_IDS.has(id) ? t(`groups.${id}`) : fallback;
}

function translateOption(
  t: ReturnType<typeof useTranslations>,
  id: string,
  fallback: string,
): string {
  return KNOWN_OPTION_IDS.has(id) ? t(`options.${id}`) : fallback;
}

export type CustomizeSheetProps = {
  open: boolean;
  product: DemoProduct | null;
  onClose: () => void;
};

export function CustomizeSheet({
  open,
  product,
  onClose,
}: CustomizeSheetProps) {
  const addLineWithSelections = useDemoStore((s) => s.addLineWithSelections);
  const t = useTranslations("demo.customize");

  // Reset selection state whenever the sheet opens for a different
  // product (or reopens). React 19's "store previous prop in state"
  // pattern — see RefundSheet for the same idiom.
  const [lastKey, setLastKey] = useState<string>("");
  const currentKey = open && product ? product.id : "";

  // Selections
  const [variantId, setVariantId] = useState<string | undefined>(undefined);
  const [modSel, setModSel] = useState<Record<string, Set<string>>>({});
  const [comboSel, setComboSel] = useState<Record<string, Set<string>>>({});

  if (currentKey !== lastKey) {
    setLastKey(currentKey);
    if (open && product) {
      setVariantId(product.variants?.[0]?.id);
      const ms: Record<string, Set<string>> = {};
      for (const g of product.modifierGroups ?? []) {
        ms[g.id] =
          g.rule === "exactly-1" && g.modifiers[0]
            ? new Set([g.modifiers[0].id])
            : new Set();
      }
      setModSel(ms);
      const cs: Record<string, Set<string>> = {};
      for (const step of product.comboSteps ?? []) {
        cs[step.id] =
          step.rule === "exactly-1" && step.options[0]
            ? new Set([step.options[0].id])
            : new Set();
      }
      setComboSel(cs);
    }
  }

  if (!product) return null;

  // Build the OrderLine-shape needed by lineUnitPrice. Doing this
  // inline avoids piping a "preview" version of the math through the
  // store.
  const previewModifiers: Modifier[] = (product.modifierGroups ?? [])
    .flatMap((g) =>
      Array.from(modSel[g.id] ?? []).map((id) =>
        g.modifiers.find((m) => m.id === id),
      ),
    )
    .filter((m): m is Modifier => Boolean(m));
  const previewCombo: Record<string, string[]> = Object.fromEntries(
    Object.entries(comboSel).map(([k, v]) => [k, Array.from(v)]),
  );
  const previewPrice = lineUnitPrice(product, {
    id: "preview",
    productId: product.id,
    qty: 1,
    variantId,
    modifiers: previewModifiers.length ? previewModifiers : undefined,
    comboSelections: product.comboSteps ? previewCombo : undefined,
  });

  // Validation — modifier groups with rule "exactly-1" must have a
  // pick; same for combo step "exactly-1". The wizard defaults to
  // the first option so these are usually satisfied, but the
  // cashier might clear them.
  const missingModGroup = (product.modifierGroups ?? []).find(
    (g) => g.rule === "exactly-1" && (modSel[g.id]?.size ?? 0) === 0,
  );
  const missingComboStep = (product.comboSteps ?? []).find(
    (s) => s.rule === "exactly-1" && (comboSel[s.id]?.size ?? 0) === 0,
  );
  const variantMissing =
    product.variants != null && product.variants.length > 0 && !variantId;
  const canConfirm = !missingModGroup && !missingComboStep && !variantMissing;

  const confirm = () => {
    if (!canConfirm) return;
    addLineWithSelections(product.id, {
      variantId,
      modifiers: previewModifiers.length ? previewModifiers : undefined,
      comboSelections: product.comboSteps ? previewCombo : undefined,
    });
    onClose();
  };

  const toggleMod = (groupId: string, modId: string, rule: ModifierGroup["rule"], max?: number) => {
    setModSel((prev) => {
      const next = { ...prev };
      const set = new Set(next[groupId] ?? []);
      if (rule === "exactly-1") {
        if (set.has(modId)) return prev; // can't unset the required pick by tapping it
        next[groupId] = new Set([modId]);
        return next;
      }
      if (set.has(modId)) set.delete(modId);
      else if (max == null || set.size < max) set.add(modId);
      next[groupId] = set;
      return next;
    });
  };

  const toggleCombo = (
    stepId: string,
    optId: string,
    rule: "exactly-1" | "up-to-n",
    max?: number,
  ) => {
    setComboSel((prev) => {
      const next = { ...prev };
      const set = new Set(next[stepId] ?? []);
      if (rule === "exactly-1") {
        if (set.has(optId)) return prev;
        next[stepId] = new Set([optId]);
        return next;
      }
      if (set.has(optId)) set.delete(optId);
      else if (max == null || set.size < max) set.add(optId);
      next[stepId] = set;
      return next;
    });
  };

  // Resolve the missing-group label once so the JSX stays clean. We
  // translate by the group's stable id when known, otherwise fall back
  // to the raw seed name. lowercase-first follows the original
  // "Pick milk" copy register (downcase noun mid-sentence).
  const missingGroupLabel = missingModGroup
    ? translateGroup(t, missingModGroup.id, missingModGroup.name).toLowerCase()
    : "";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`${t("title")} · ${product.name}`}
      subtitle={t("baseLabel", { amount: product.price.toFixed(2) })}
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] text-paper/55 tabular-nums">
            {canConfirm ? (
              <>
                {t("total")} ·{" "}
                <span className="text-paper font-medium">
                  {previewPrice.toFixed(2)} MAD
                </span>
              </>
            ) : (
              <span className="text-amber-300/85">
                {variantMissing
                  ? t("pickVariant")
                  : missingModGroup
                    ? t("pickGroup", { group: missingGroupLabel })
                    : missingComboStep
                      ? translateGroup(t, missingComboStep.id, missingComboStep.name)
                      : t("incomplete")}
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-[13px] font-medium rounded-lg border border-white/[0.12] text-paper/85 hover:text-paper hover:bg-white/[0.04] transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={!canConfirm}
              className="h-10 px-4 text-[13px] font-medium rounded-lg bg-[#E11D2A] text-white enabled:hover:bg-[#c8141f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("addToOrder")}
            </button>
          </div>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-5">
        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <PickerSection title={t("groups.size")} rule="exactly-1">
            {product.variants.map((v) => (
              <PickerRow
                key={v.id}
                kind="radio"
                checked={variantId === v.id}
                onChange={() => setVariantId(v.id)}
                label={translateOption(t, v.id, v.name)}
                priceDelta={v.priceDelta}
              />
            ))}
          </PickerSection>
        )}

        {/* Combo steps */}
        {product.comboSteps?.map((step) => (
          <PickerSection
            key={step.id}
            title={translateGroup(t, step.id, step.name)}
            rule={step.rule}
            max={step.max}
          >
            {step.options.map((opt) => {
              const set = comboSel[step.id] ?? new Set<string>();
              const checked = set.has(opt.id);
              const max = step.rule === "up-to-n" ? step.max : undefined;
              return (
                <PickerRow
                  key={opt.id}
                  kind={step.rule === "exactly-1" ? "radio" : "check"}
                  checked={checked}
                  onChange={() =>
                    toggleCombo(step.id, opt.id, step.rule, max)
                  }
                  disabled={
                    !checked &&
                    step.rule === "up-to-n" &&
                    max != null &&
                    set.size >= max
                  }
                  label={translateOption(t, opt.id, opt.name)}
                  priceDelta={opt.priceDelta}
                />
              );
            })}
          </PickerSection>
        ))}

        {/* Modifier groups */}
        {product.modifierGroups?.map((g) => (
          <PickerSection
            key={g.id}
            title={translateGroup(t, g.id, g.name)}
            rule={g.rule}
            max={g.max}
          >
            {g.modifiers.map((m) => {
              const set = modSel[g.id] ?? new Set<string>();
              const checked = set.has(m.id);
              const max = g.rule === "up-to-n" ? g.max : undefined;
              return (
                <PickerRow
                  key={m.id}
                  kind={g.rule === "exactly-1" ? "radio" : "check"}
                  checked={checked}
                  onChange={() => toggleMod(g.id, m.id, g.rule, max)}
                  disabled={
                    !checked &&
                    g.rule === "up-to-n" &&
                    max != null &&
                    set.size >= max
                  }
                  label={translateOption(t, m.id, m.name)}
                  priceDelta={m.priceDelta}
                />
              );
            })}
          </PickerSection>
        ))}
      </div>
    </Sheet>
  );
}

// ── Sub-pieces ──────────────────────────────────────────────────────

function PickerSection({
  title,
  rule,
  max,
  children,
}: {
  title: string;
  rule: "exactly-1" | "up-to-n";
  max?: number;
  children: React.ReactNode;
}) {
  const t = useTranslations("demo.customize");
  return (
    <section>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-[12px] font-semibold text-paper tracking-[-0.005em]">
          {title}
        </p>
        <p className="text-[10px] uppercase tracking-[0.14em] text-paper/45">
          {rule === "exactly-1"
            ? t("required")
            : max != null
              ? t("pickUpTo", { max })
              : t("pickUpToAny")}
        </p>
      </div>
      <ul className="rounded-[10px] border border-white/[0.08] divide-y divide-white/[0.04] overflow-hidden">
        {children}
      </ul>
    </section>
  );
}

function PickerRow({
  kind,
  checked,
  onChange,
  label,
  priceDelta,
  disabled,
}: {
  kind: "radio" | "check";
  checked: boolean;
  onChange: () => void;
  label: string;
  priceDelta?: number;
  disabled?: boolean;
}) {
  return (
    <li
      className={
        "px-4 py-2.5 flex items-center gap-3 transition-colors " +
        (disabled
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-white/[0.03] cursor-pointer")
      }
      onClick={() => !disabled && onChange()}
    >
      <input
        type={kind === "radio" ? "radio" : "checkbox"}
        checked={checked}
        readOnly
        disabled={disabled}
        aria-label={label}
        className={
          "h-4 w-4 " +
          (kind === "radio"
            ? "rounded-full accent-[#E11D2A]"
            : "rounded accent-[#E11D2A]")
        }
      />
      <span className="flex-1 text-[13px] text-paper">{label}</span>
      {priceDelta != null && priceDelta !== 0 && (
        <span className="text-[12px] tabular-nums text-paper/55">
          +{priceDelta.toFixed(2)}
        </span>
      )}
    </li>
  );
}
