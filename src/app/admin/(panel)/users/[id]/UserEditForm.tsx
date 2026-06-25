"use client";

// Role editor + disable toggle.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { RoleSlug } from "@/server/rbac/catalog";
import { setUserDisabled, setUserRoles } from "./actions";

type RoleSummary = {
  slug: RoleSlug;
  name: string;
  description: string;
  permissionCount: number;
};

export function UserEditForm({
  userId,
  currentSlugs,
  allRoles,
  disabled,
}: {
  userId: string;
  currentSlugs: RoleSlug[];
  allRoles: RoleSummary[];
  disabled: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<RoleSlug>>(
    new Set(currentSlugs),
  );
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    kind: "error" | "ok";
    message: string;
  } | null>(null);

  const toggle = (slug: RoleSlug) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    setFeedback(null);
  };

  const save = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await setUserRoles(userId, Array.from(selected));
      if (res.ok) {
        setFeedback({ kind: "ok", message: "Roles updated." });
        router.refresh();
      } else {
        setFeedback({ kind: "error", message: res.error });
      }
    });
  };

  const toggleDisabled = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await setUserDisabled(userId, !disabled);
      if (res.ok) {
        setFeedback({
          kind: "ok",
          message: disabled ? "Account re-enabled." : "Account disabled.",
        });
        router.refresh();
      } else {
        setFeedback({ kind: "error", message: res.error });
      }
    });
  };

  const isDirty =
    Array.from(selected).sort().join(",") !== currentSlugs.sort().join(",");

  return (
    <div className="px-5 py-4">
      <ul className="space-y-2 mb-5">
        {allRoles.map((r) => {
          const on = selected.has(r.slug);
          return (
            <li key={r.slug}>
              <label
                className={
                  "flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors duration-200 " +
                  "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] " +
                  (on
                    ? "border-ink/30 bg-canvas"
                    : "border-hairline bg-paper hover:border-hairline-strong")
                }
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-hairline-strong text-ink focus:ring-ink/15"
                  checked={on}
                  onChange={() => toggle(r.slug)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <p className="text-[13.5px] font-medium text-ink">
                      {r.name}
                    </p>
                    <p className="text-[11px] text-ink-mute tabular-nums">
                      {r.permissionCount} permissions
                    </p>
                  </div>
                  <p className="text-[12px] text-ink-soft mt-0.5 leading-[1.5]">
                    {r.description}
                  </p>
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      {feedback && (
        <p
          className={
            "mb-4 rounded-lg border px-3 py-2 text-[12.5px] " +
            (feedback.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700")
          }
        >
          {feedback.message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={toggleDisabled}
          disabled={pending}
          className="text-[12.5px] font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {disabled ? "Re-enable account" : "Disable account"}
        </button>

        <div className="flex items-center gap-3">
          {isDirty && !pending && (
            <span className="text-[12px] text-ink-mute">Unsaved changes</span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || pending}
            className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-[13px] font-medium text-paper hover:bg-ink-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? "Saving…" : "Save roles"}
          </button>
        </div>
      </div>
    </div>
  );
}
