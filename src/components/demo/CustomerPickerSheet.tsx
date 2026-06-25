"use client";

// Customer picker — Phase 5B (premium redesign).
//
// Sheet-based customer search + select. Used from the ActiveOrder
// "Attach customer" pill. On selection:
//   • Attaches the customer to the active order via attachCustomer()
//   • Closes the sheet
//   • The order's customerId stamps onto the receipt at completePayment
//   • Loyalty points accumulate on the customer record per receipt
//
// New customer flow: a single inline form pinned to the sheet footer
// creates a new customer in the activity's roster + attaches it in
// one action. No separate dialog — keeps the flow at one screen.
//
// Design system:
//   • Segmented mode toggle (track with active pill) — single source
//     of mode chrome rather than two free-floating buttons.
//   • Search row with embedded magnifier icon + a live "N of M" count
//     so the operator always knows how many records remain visible.
//   • Customer rows: tier-tinted circular avatar, two-line type
//     hierarchy (name 14px / phone 11.5px), tier chip + loyalty
//     points stacked on the right. Hairline-only dividers — no
//     per-row card bg — for a registry feel.
//   • New-customer mode uses the Sheet's own footer slot for the CTA
//     row so the action is always anchored and never scrolls off.

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { ACTIVITIES } from "@/data/demo/activities";
import { useDemoStore } from "@/lib/demoStore";
import { Sheet } from "./Sheet";
import type { Customer, LoyaltyTier } from "@/data/demo/types";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Mode = "search" | "new";

export function CustomerPickerSheet({ open, onClose }: Props) {
  const activity = useDemoStore((s) => s.activity);
  const allCustomers = useDemoStore((s) => s.customers);
  const order = useDemoStore((s) => s.order);
  const attachCustomer = useDemoStore((s) => s.attachCustomer);
  const detachCustomer = useDemoStore((s) => s.detachCustomer);
  const createAndAttachCustomer = useDemoStore(
    (s) => s.createAndAttachCustomer,
  );

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("search");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const t = useTranslations("demo.customerPicker");

  const roster = useMemo<Customer[]>(
    () => (activity ? allCustomers[activity] ?? [] : []),
    [activity, allCustomers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [...roster]
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 40);
    }
    return roster
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q),
      )
      .slice(0, 40);
  }, [roster, query]);

  if (!activity) return null;

  const attached = order?.customerId
    ? roster.find((c) => c.id === order.customerId)
    : undefined;

  const totalCount = roster.length;
  const visibleCount = filtered.length;

  const handleCreate = () => {
    if (!newName.trim()) return;
    createAndAttachCustomer({
      name: newName,
      phone: newPhone,
      email: newEmail,
    });
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setMode("search");
    onClose();
  };

  const resetNewForm = () => {
    setNewName("");
    setNewPhone("");
    setNewEmail("");
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t("title")}
      subtitle={
        attached
          ? t("currentlyAttached", { name: attached.name })
          : t("inRoster", { count: totalCount })
      }
      scheme="dark"
      headerExtra={
        attached ? (
          <button
            type="button"
            onClick={() => {
              detachCustomer();
              onClose();
            }}
            className="h-7 px-3 rounded-full text-[11.5px] font-medium text-paper/65 hover:text-paper hover:bg-white/[0.06] transition-colors"
          >
            {t("detach")}
          </button>
        ) : null
      }
      footer={
        mode === "new" ? (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                resetNewForm();
                setMode("search");
              }}
              className="h-9 px-4 rounded-full text-[12.5px] font-medium text-paper/65 hover:text-paper hover:bg-white/[0.06] transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="h-9 px-4 rounded-full bg-paper text-ink text-[12.5px] font-semibold hover:bg-paper/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
            >
              {t("createAndAttach")}
            </button>
          </div>
        ) : undefined
      }
    >
      {/* Inner padding container — the Sheet's body is bare so the
          picker controls its own gutter consistently across both modes. */}
      <div className="px-5 pt-4 pb-5">
        {/* Segmented mode control */}
        <ModeToggle mode={mode} onChange={setMode} />

        {mode === "search" ? (
          <div className="mt-4">
            {/* Search row */}
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-paper/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                autoFocus
                className="w-full h-11 rounded-[10px] bg-white/[0.05] border border-white/10 pl-10 pr-3.5 text-[13.5px] text-paper placeholder:text-paper/40 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-colors"
              />
            </div>

            {/* Count strip */}
            <div className="mt-3 mb-2 flex items-baseline justify-between gap-2">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-paper/45">
                {query.trim() ? t("matches") : t("allCustomers")}
              </p>
              <p className="text-[10.5px] tabular-nums text-paper/50">
                {t("ofTotal", { visible: visibleCount, total: totalCount })}
              </p>
            </div>

            {/* List */}
            <ul className="max-h-[360px] overflow-y-auto -mx-1 px-1 divide-y divide-white/[0.06]">
              {filtered.length === 0 ? (
                <EmptyState onSwitchToNew={() => setMode("new")} />
              ) : (
                filtered.map((c) => {
                  const isAttached = c.id === order?.customerId;
                  return (
                    <li key={c.id}>
                      <CustomerRow
                        customer={c}
                        attached={isAttached}
                        onPick={() => {
                          attachCustomer(c.id);
                          onClose();
                        }}
                      />
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : (
          <div className="mt-4">
            <Field label={t("name")} required>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t("fullNamePlaceholder")}
                autoFocus
                className={inputClass}
              />
            </Field>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={t("phone")}>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder={t("phonePlaceholder")}
                  className={inputClass}
                />
              </Field>
              <Field label={t("email")}>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  className={inputClass}
                />
              </Field>
            </div>
            <p className="mt-3 text-[11px] text-paper/45 leading-snug">
              {t("rosterHint", { activity: ACTIVITIES[activity].name })}
            </p>
          </div>
        )}
      </div>
    </Sheet>
  );
}

// ── Mode toggle (segmented control) ─────────────────────────────────

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const t = useTranslations("demo.customerPicker");
  return (
    <div
      role="tablist"
      className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-white/[0.05] border border-white/10"
    >
      <ModeSegment
        active={mode === "search"}
        onClick={() => onChange("search")}
        label={t("findCustomer")}
      />
      <ModeSegment
        active={mode === "new"}
        onClick={() => onChange("new")}
        label={t("newCustomer")}
      />
    </div>
  );
}

function ModeSegment({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "h-7 px-3 text-[11.5px] font-medium rounded-full transition-colors " +
        (active
          ? "bg-paper text-ink shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          : "text-paper/65 hover:text-paper")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      {label}
    </button>
  );
}

// ── Single customer row ─────────────────────────────────────────────

function CustomerRow({
  customer,
  attached,
  onPick,
}: {
  customer: Customer;
  attached: boolean;
  onPick: () => void;
}) {
  const t = useTranslations("demo.customerPicker");
  const tier = customer.tier;
  return (
    <button
      type="button"
      onClick={onPick}
      className={
        "group w-full text-left px-2 py-2.5 flex items-center gap-3 rounded-md transition-colors " +
        (attached
          ? "bg-white/[0.06]"
          : "hover:bg-white/[0.04]")
      }
      style={{ transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)" }}
    >
      <TierAvatar tier={tier} name={customer.name} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="text-[13.5px] font-medium text-paper truncate leading-tight">
            {customer.name}
          </p>
          {attached && (
            <span className="shrink-0 text-[9.5px] uppercase tracking-[0.14em] font-semibold text-emerald-300">
              {t("attached")}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11.5px] text-paper/50 truncate leading-tight tabular-nums">
          {customer.phone ?? customer.email ?? t("walkIn")}
        </p>
      </div>
      {/* Tier chip + loyalty-points suffix removed — the points /
          tier feature is not part of the shipped product. The
          underlying customer record still carries `loyaltyPoints`
          for future use, but the UI no longer surfaces it. */}
    </button>
  );
}

// ── Tier-tinted avatar ──────────────────────────────────────────────

function TierAvatar({ tier, name }: { tier: LoyaltyTier; name: string }) {
  const tone = {
    platinum: "bg-paper/15 text-paper ring-1 ring-paper/25",
    gold: "bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/30",
    silver: "bg-white/[0.07] text-paper/85 ring-1 ring-white/15",
    bronze: "bg-amber-900/25 text-amber-200/85 ring-1 ring-amber-700/30",
  }[tier];
  return (
    <span
      aria-hidden
      className={
        "inline-flex items-center justify-center shrink-0 h-9 w-9 rounded-full text-[11.5px] font-semibold tracking-wide " +
        tone
      }
    >
      {initialsOf(name)}
    </span>
  );
}

// TierBadge removed — surfaced the loyalty-tier name in plain text
// which no longer fits the live product surface.

// ── Empty state ─────────────────────────────────────────────────────

function EmptyState({ onSwitchToNew }: { onSwitchToNew: () => void }) {
  const t = useTranslations("demo.customerPicker");
  return (
    <li className="py-10 flex flex-col items-center text-center gap-3">
      <span
        aria-hidden
        className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/[0.05] text-paper/40"
      >
        <SearchIcon size={16} />
      </span>
      <div>
        <p className="text-[13px] text-paper/85 font-medium">
          {t("noMatchTitle")}
        </p>
        <p className="mt-0.5 text-[11.5px] text-paper/45 max-w-[22rem]">
          {t("noMatchBody")}
        </p>
      </div>
      <button
        type="button"
        onClick={onSwitchToNew}
        className="mt-1 h-8 px-3.5 rounded-full bg-white/[0.08] border border-white/15 text-paper text-[11.5px] font-medium hover:bg-white/[0.12] transition-colors"
      >
        {t("createNew")}
      </button>
    </li>
  );
}

// ── Form helpers ────────────────────────────────────────────────────

const inputClass =
  "w-full h-11 rounded-[10px] bg-white/[0.05] border border-white/10 px-3.5 text-[13.5px] text-paper placeholder:text-paper/40 focus:outline-none focus:border-white/30 focus:bg-white/[0.08] transition-colors";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block mb-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-paper/55">
        {label}
        {required && (
          <span aria-hidden className="ml-1 text-amber-300/85">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function SearchIcon({
  className = "",
  size = 14,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className={className}
    >
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M11 11l3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0] ?? "??").slice(0, 2).toUpperCase();
}
