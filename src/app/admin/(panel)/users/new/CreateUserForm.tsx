"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { RoleSlug } from "@/server/rbac/catalog";
import { createUser } from "./actions";

export function CreateUserForm({
  allRoles,
}: {
  allRoles: { slug: RoleSlug; name: string; description: string }[];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleSlugs, setRoleSlugs] = useState<Set<RoleSlug>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleRole = (slug: RoleSlug) => {
    setRoleSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        roleSlugs: Array.from(roleSlugs),
      });
      if (res.ok) {
        router.push(`/admin/users/${res.userId}`);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form onSubmit={submit} className="px-5 py-5">
      <div className="space-y-4 max-w-[520px]">
        <FieldRow label="Full name">
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name"
            required
            className={inputCls}
            autoComplete="name"
          />
        </FieldRow>
        <FieldRow label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
            className={inputCls}
            autoComplete="off"
          />
        </FieldRow>
        <FieldRow
          label="Temporary password"
          hint="Share this with the user; they'll change it on first sign-in (later)."
        >
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            className={inputCls + " font-mono"}
            autoComplete="off"
          />
        </FieldRow>
      </div>

      <div className="mt-7">
        <p className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium mb-2">
          Roles
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-[760px]">
          {allRoles.map((r) => {
            const on = roleSlugs.has(r.slug);
            return (
              <li key={r.slug}>
                <label
                  className={
                    "flex items-start gap-3 rounded-lg border px-3.5 py-3 cursor-pointer transition-colors duration-200 " +
                    "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] " +
                    (on
                      ? "border-ink/30 bg-canvas"
                      : "border-hairline bg-paper hover:border-hairline-strong")
                  }
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggleRole(r.slug)}
                    className="mt-0.5 h-4 w-4 rounded border-hairline-strong text-ink focus:ring-ink/15"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-ink">{r.name}</p>
                    <p className="text-[11.5px] text-ink-soft leading-[1.45]">
                      {r.description}
                    </p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
        <p className="text-[11.5px] text-ink-mute mt-2">
          Customer role is auto-attached by Better-Auth and isn&rsquo;t shown
          here. Leave all boxes unchecked to create a plain customer account.
        </p>
      </div>

      {error && (
        <div className="mt-5 max-w-[520px] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
          {error}
        </div>
      )}

      <div className="mt-7 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/users")}
          className="text-[13px] text-ink-mute hover:text-ink transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-full bg-ink px-5 text-[13px] font-medium text-paper hover:bg-ink-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? "Creating…" : "Create user"}
        </button>
      </div>
    </form>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-mute font-medium">
          {label}
        </span>
        {hint && (
          <span className="text-[11px] text-ink-mute italic max-w-[60%] truncate">
            {hint}
          </span>
        )}
      </div>
      {children}
    </label>
  );
}

const inputCls =
  "w-full h-11 px-3.5 rounded-lg bg-paper border border-hairline hover:border-hairline-strong focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.04] text-[13.5px] text-ink placeholder:text-ink-mute/70 transition-[border-color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] focus:outline-none";
