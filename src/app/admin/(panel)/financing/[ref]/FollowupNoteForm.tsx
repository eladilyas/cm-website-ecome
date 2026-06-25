"use client";

// Pre-sales follow-up note composer.
//
// Renders inside the financing follow-up section. Posts to the
// server action which appends an OrderFollowupNote row, then the
// page re-renders the notes list via revalidatePath.
//
// Tiny by design — kind picker (call / email / documents / other)
// + multi-line body + a single Send button. Empty bodies are
// rejected server-side; the local form mirrors the rule so users
// see immediate feedback.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { addFinancingFollowupNote } from "./actions";

const KINDS = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "documents", label: "Documents" },
  { value: "note", label: "Note" },
] as const;

export function FollowupNoteForm({ requestRef }: { requestRef: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("note");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = body.trim();
    if (trimmed.length === 0) {
      setError("Note can't be empty.");
      return;
    }
    startTransition(async () => {
      const res = await addFinancingFollowupNote(requestRef, trimmed, kind);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => setKind(k.value)}
            className={
              "h-7 px-3 inline-flex items-center text-[11.5px] font-medium rounded-full border transition-colors " +
              (kind === k.value
                ? "bg-ink text-paper border-ink"
                : "bg-paper text-ink-soft border-hairline hover:border-hairline-strong hover:text-ink")
            }
          >
            {k.label}
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What happened? Who did you speak to? Next step?"
        rows={3}
        maxLength={4000}
        className="w-full px-3 py-2.5 rounded-lg bg-paper border border-hairline hover:border-hairline-strong focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.04] text-[13px] text-ink placeholder:text-ink-mute/70 transition-[border-color,box-shadow] duration-200 focus:outline-none resize-none"
      />

      <div className="flex items-center justify-between gap-3">
        {error ? (
          <span className="text-[11.5px] text-red-600 font-medium">{error}</span>
        ) : (
          <span className="text-[11px] text-ink-mute">
            {body.length}/4000
          </span>
        )}
        <button
          type="submit"
          disabled={pending || body.trim().length === 0}
          className="inline-flex h-9 items-center px-3.5 rounded-full bg-ink text-paper text-[12.5px] font-medium hover:bg-ink-soft disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? "Saving…" : "Add note"}
        </button>
      </div>
    </form>
  );
}
