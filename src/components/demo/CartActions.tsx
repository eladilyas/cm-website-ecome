"use client";

// Cart-companion sheets — discount, line discount, custom item.
//
// Three small sheets that live next to the cart. All share the
// reusable Sheet primitive from Phase 2A. Lifted out of ActiveOrder
// so the cart component stays focused on lines + totals + checkout.
//
// • OrderDiscountSheet — % / Fixed / Coupon tabs. The coupon list is
//   a small preset map keyed by the activity (lets a café show
//   "MORNING10" and a salon show "VIP15" without conflating them).
// • LineDiscountSheet — quick %-off picker for a single line, with
//   preset buttons (10 / 20 / 50) and a Custom slot.
// • CustomItemSheet — name + price entry that lands in the cart as
//   an `OrderExtra` (kind: "generic"). Open-price items are how
//   real tills handle one-off charges (custom catering plate, tip
//   adjustment, deposit on a layaway, etc.).

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useDemoStore } from "@/lib/demoStore";
import type { OrderDiscount } from "@/data/demo/types";
import { couponsFor } from "@/data/demo/coupons";
import { Sheet } from "./Sheet";

// ── OrderDiscountSheet ──────────────────────────────────────────────

type DiscountTab = "pct" | "fixed" | "coupon";

export function OrderDiscountSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const activity = useDemoStore((s) => s.activity);
  const current = useDemoStore((s) => s.order?.orderDiscount);
  const setOrderDiscount = useDemoStore((s) => s.setOrderDiscount);
  const t = useTranslations("demo.discount");

  const [tab, setTab] = useState<DiscountTab>("pct");
  const [pctValue, setPctValue] = useState<number>(10);
  const [fixedValue, setFixedValue] = useState<number>(20);
  const [label, setLabel] = useState<string>("");

  // Reset to current discount each time the sheet opens.
  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      if (current?.kind === "pct") {
        setTab("pct");
        setPctValue(current.amount);
        setLabel(current.label ?? "");
      } else if (current?.kind === "fixed") {
        setTab("fixed");
        setFixedValue(current.amount);
        setLabel(current.label ?? "");
      } else {
        setTab("pct");
        setPctValue(10);
        setFixedValue(20);
        setLabel("");
      }
    }
  }

  const apply = (d: OrderDiscount) => {
    setOrderDiscount(d);
    onClose();
  };

  const presetCoupons = couponsFor(activity);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setOrderDiscount(null);
              onClose();
            }}
            className="h-10 px-4 text-[13px] text-paper/70 hover:text-paper transition-colors"
          >
            {t("remove")}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-4 text-[13px] font-medium rounded-lg border border-white/[0.12] text-paper/85 hover:text-paper hover:bg-white/[0.04] transition-colors"
            >
              {t("cancel")}
            </button>
            {tab !== "coupon" && (
              <button
                type="button"
                onClick={() =>
                  apply({
                    kind: tab,
                    amount: tab === "pct" ? pctValue : fixedValue,
                    label: label.trim() || undefined,
                  })
                }
                disabled={tab === "pct" ? pctValue <= 0 : fixedValue <= 0}
                className="h-10 px-4 text-[13px] font-medium rounded-lg bg-[#E11D2A] text-white enabled:hover:bg-[#c8141f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t("apply")}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-5">
        {/* Tabs — loop variable renamed to `kind` so it doesn't shadow
            the `useTranslations` handle declared above. */}
        <div className="inline-flex p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
          {(["pct", "fixed", "coupon"] as DiscountTab[]).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setTab(kind)}
              className={
                "px-3 h-8 text-[12px] font-medium rounded transition-colors " +
                (tab === kind
                  ? "bg-white/[0.08] text-paper"
                  : "text-paper/55 hover:text-paper")
              }
            >
              {t(`tabs.${kind}`)}
            </button>
          ))}
        </div>

        {tab === "pct" && (
          <section>
            <p className="text-[11px] uppercase tracking-[0.14em] text-paper/45 mb-2">
              {t("pickPct")}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[5, 10, 15, 20, 30, 50].map((v) => (
                <PresetButton
                  key={v}
                  active={pctValue === v}
                  onClick={() => setPctValue(v)}
                >
                  {v}%
                </PresetButton>
              ))}
            </div>
            <NumericInput
              label={t("customPct")}
              value={pctValue}
              onChange={setPctValue}
              suffix="%"
              max={100}
            />
            <LabelInput value={label} onChange={setLabel} />
          </section>
        )}

        {tab === "fixed" && (
          <section>
            <p className="text-[11px] uppercase tracking-[0.14em] text-paper/45 mb-2">
              {t("pickAmount")}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {[5, 10, 20, 50, 100].map((v) => (
                <PresetButton
                  key={v}
                  active={fixedValue === v}
                  onClick={() => setFixedValue(v)}
                >
                  {v} MAD
                </PresetButton>
              ))}
            </div>
            <NumericInput
              label={t("customAmount")}
              value={fixedValue}
              onChange={setFixedValue}
              suffix="MAD"
            />
            <LabelInput value={label} onChange={setLabel} />
          </section>
        )}

        {tab === "coupon" && (
          <section>
            <p className="text-[11px] uppercase tracking-[0.14em] text-paper/45 mb-2">
              {t("availableCodes")}
            </p>
            <ul className="rounded-[10px] border border-white/[0.08] divide-y divide-white/[0.04] overflow-hidden">
              {presetCoupons.map((c) => (
                <li
                  key={c.code}
                  className="px-4 py-3 hover:bg-white/[0.03] cursor-pointer flex items-center justify-between gap-3"
                  onClick={() => apply(c.discount)}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-paper">
                      {c.code}
                    </p>
                    <p className="mt-0.5 text-[11px] text-paper/55">
                      {c.description}
                    </p>
                  </div>
                  <span className="text-[12px] font-medium tabular-nums text-paper/85">
                    {c.discount.kind === "pct"
                      ? `${c.discount.amount}%`
                      : `${c.discount.amount} MAD`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-paper/45 text-center">
              {t("couponDemoHint")}
            </p>
          </section>
        )}
      </div>
    </Sheet>
  );
}

// ── LineDiscountSheet ───────────────────────────────────────────────

export function LineDiscountSheet({
  open,
  onClose,
  lineId,
  productName,
  currentPct,
}: {
  open: boolean;
  onClose: () => void;
  lineId: string | null;
  productName: string;
  currentPct: number;
}) {
  const setLineDiscount = useDemoStore((s) => s.setLineDiscount);
  const [value, setValue] = useState<number>(currentPct);
  const t = useTranslations("demo.discount");

  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setValue(currentPct);
  }

  const apply = (pct: number) => {
    if (lineId == null) return;
    setLineDiscount(lineId, pct);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("lineTitle")}
      subtitle={productName}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => apply(0)}
            className="h-10 px-4 text-[13px] text-paper/70 hover:text-paper transition-colors"
          >
            {t("lineRemove")}
          </button>
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
              onClick={() => apply(value)}
              disabled={value < 0 || value > 100}
              className="h-10 px-4 text-[13px] font-medium rounded-lg bg-[#E11D2A] text-white enabled:hover:bg-[#c8141f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("lineApply", { pct: value })}
            </button>
          </div>
        </div>
      }
    >
      <div className="px-5 py-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {[10, 20, 30, 50].map((v) => (
            <PresetButton
              key={v}
              active={value === v}
              onClick={() => setValue(v)}
            >
              {v}%
            </PresetButton>
          ))}
        </div>
        <NumericInput
          label={t("customPct")}
          value={value}
          onChange={setValue}
          suffix="%"
          max={100}
        />
      </div>
    </Sheet>
  );
}

// ── CustomItemSheet ─────────────────────────────────────────────────

export function CustomItemSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const addExtra = useDemoStore((s) => s.addExtra);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const t = useTranslations("demo.discount");

  const [lastOpen, setLastOpen] = useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setName("");
      setPrice(0);
    }
  }

  const canAdd = name.trim().length > 0 && price > 0;

  const submit = () => {
    if (!canAdd) return;
    addExtra({ kind: "generic", label: name.trim(), amount: price });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("customItemTitle")}
      subtitle={t("customItemSubtitle")}
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 text-[13px] font-medium rounded-lg border border-white/[0.12] text-paper/85 hover:text-paper hover:bg-white/[0.04] transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canAdd}
            className="h-10 px-4 text-[13px] font-medium rounded-lg bg-[#E11D2A] text-white enabled:hover:bg-[#c8141f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {price > 0
              ? t("addItemAmount", { amount: price.toFixed(2) })
              : t("addItem")}
          </button>
        </div>
      }
    >
      <div className="px-5 py-4 space-y-4">
        <div>
          <label
            htmlFor="custom-name"
            className="text-[11px] uppercase tracking-[0.14em] text-paper/45 mb-1.5 block"
          >
            {t("itemName")}
          </label>
          <input
            id="custom-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("itemNamePlaceholder")}
            className="w-full h-11 px-3 rounded-lg bg-white/[0.04] border border-white/[0.10] text-[13px] text-paper placeholder:text-paper/35 focus:outline-none focus:border-white/[0.25]"
            autoFocus
          />
        </div>
        <NumericInput
          label={t("priceField")}
          value={price}
          onChange={setPrice}
          suffix="MAD"
          allowDecimal
        />
      </div>
    </Sheet>
  );
}

// ── Sub-pieces ──────────────────────────────────────────────────────

function PresetButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "h-9 px-3 text-[12px] font-medium rounded-lg border transition-colors tabular-nums " +
        (active
          ? "border-[#E11D2A]/45 bg-[#E11D2A]/[0.10] text-paper"
          : "border-white/[0.10] bg-white/[0.04] text-paper/80 hover:bg-white/[0.08] hover:text-paper")
      }
    >
      {children}
    </button>
  );
}

function NumericInput({
  label,
  value,
  onChange,
  suffix,
  max,
  allowDecimal,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  max?: number;
  allowDecimal?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-[0.14em] text-paper/45 mb-1.5 block">
        {label}
      </label>
      <div className="flex items-center gap-2 h-11 rounded-lg bg-white/[0.04] border border-white/[0.10] focus-within:border-white/[0.25] transition-colors px-3">
        <input
          type="number"
          inputMode={allowDecimal ? "decimal" : "numeric"}
          value={value || ""}
          min={0}
          max={max}
          step={allowDecimal ? 0.5 : 1}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            const next = Number.isFinite(n) ? n : 0;
            onChange(max != null ? Math.min(next, max) : next);
          }}
          className="flex-1 bg-transparent text-[14px] text-paper tabular-nums focus:outline-none"
        />
        {suffix && (
          <span className="text-[11px] uppercase tracking-[0.12em] text-paper/45">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function LabelInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const t = useTranslations("demo.discount");
  return (
    <div className="mt-4">
      <label
        htmlFor="discount-label"
        className="text-[11px] uppercase tracking-[0.14em] text-paper/45 mb-1.5 block"
      >
        {t("labelField")}
      </label>
      <input
        id="discount-label"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("labelPlaceholder")}
        className="w-full h-11 px-3 rounded-lg bg-white/[0.04] border border-white/[0.10] text-[13px] text-paper placeholder:text-paper/35 focus:outline-none focus:border-white/[0.25]"
      />
    </div>
  );
}
