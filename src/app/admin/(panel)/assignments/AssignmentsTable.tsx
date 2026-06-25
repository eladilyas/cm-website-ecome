"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SectionCard } from "@/components/admin/AdminPrimitives";
import { assignLead, distributeLeads, unassignLead } from "./actions";

type Assignment = {
  id: string;
  customerEmail: string;
  assignedToUserId: string;
  assignedToLabel: string;
  notes: string | null;
  updatedAt: string;
};

type Presales = { id: string; label: string; email: string };

export function AssignmentsTable({
  assignments,
  presales,
}: {
  assignments: Assignment[];
  presales: Presales[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  // ── Add a single assignment ────────────────────────────────────────
  const [newEmail, setNewEmail] = useState("");
  const [newAssignee, setNewAssignee] = useState(presales[0]?.id ?? "");
  const submitOne = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!newEmail || !newAssignee) return;
    startTransition(async () => {
      const res = await assignLead({
        customerEmail: newEmail,
        assignedToUserId: newAssignee,
      });
      if (res.ok) {
        setNewEmail("");
        setFeedback("Assigned.");
        router.refresh();
      } else {
        setFeedback(res.error);
      }
    });
  };

  // ── Bulk distribute ────────────────────────────────────────────────
  const [bulkText, setBulkText] = useState("");
  const submitBulk = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const emails = bulkText
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => s.includes("@"));
    if (emails.length === 0) {
      setFeedback("Paste one or more emails separated by spaces or commas.");
      return;
    }
    startTransition(async () => {
      const res = await distributeLeads(emails);
      if ("error" in res) {
        setFeedback(res.error);
        return;
      }
      setFeedback(
        `Distributed ${res.created} · skipped ${res.skipped} (already assigned).`,
      );
      setBulkText("");
      router.refresh();
    });
  };

  const unassign = (email: string) => {
    setFeedback(null);
    startTransition(async () => {
      await unassignLead(email);
      router.refresh();
    });
  };

  const reassign = (email: string, toUserId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await assignLead({
        customerEmail: email,
        assignedToUserId: toUserId,
      });
      if (!res.ok) setFeedback(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      {/* Single assign + bulk distribute, side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          title="Assign one customer"
          description="Use a customer's email (the one they checkout / sign up with)."
        >
          <form onSubmit={submitOne} className="p-5 space-y-3">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="customer@company.com"
              required
              className={inputCls}
            />
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className={selectCls}
            >
              {presales.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={pending}
              className="w-full h-11 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-ink-soft disabled:opacity-50 transition-colors"
            >
              {pending ? "Assigning…" : "Assign"}
            </button>
          </form>
        </SectionCard>

        <SectionCard
          title="Distribute many"
          description="Paste a list of customer emails — distributed evenly across pre-sales reps. Existing assignments are preserved."
        >
          <form onSubmit={submitBulk} className="p-5 space-y-3">
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={5}
              placeholder="alpha@acme.ma, beta@example.com, …"
              className={inputCls + " py-3 min-h-[110px] resize-y"}
            />
            <button
              type="submit"
              disabled={pending || presales.length === 0}
              className="w-full h-11 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-ink-soft disabled:opacity-50 transition-colors"
            >
              {pending ? "Distributing…" : "Distribute"}
            </button>
          </form>
        </SectionCard>
      </div>

      {feedback && (
        <div className="rounded-lg border border-hairline bg-paper px-4 py-3 text-[12.5px] text-ink-soft">
          {feedback}
        </div>
      )}

      {/* Assignments table */}
      <SectionCard title={`Customers (${assignments.length})`}>
        {assignments.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-[13px] text-ink-soft">
              No customers assigned yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="admin-thead text-ink-mute text-[11px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Customer</th>
                  <th className="text-left font-medium px-5 py-3">Owner</th>
                  <th className="text-left font-medium px-5 py-3">Updated</th>
                  <th className="text-right font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3.5 text-ink">{a.customerEmail}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={a.assignedToUserId}
                        onChange={(e) =>
                          reassign(a.customerEmail, e.target.value)
                        }
                        className="rounded-md border border-hairline bg-paper px-2 py-1 text-[12.5px]"
                      >
                        {presales.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-ink-soft tabular-nums">
                      {new Date(a.updatedAt).toLocaleString("en-CA")}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => unassign(a.customerEmail)}
                        disabled={pending}
                        className="text-[12.5px] text-red-600 hover:text-red-700 disabled:opacity-50"
                      >
                        Unassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

const inputCls =
  "w-full h-11 px-3.5 rounded-lg bg-paper border border-hairline hover:border-hairline-strong focus:border-ink/40 focus:ring-4 focus:ring-ink/[0.04] text-[13.5px] text-ink placeholder:text-ink-mute/70 transition-[border-color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] focus:outline-none";

const selectCls = inputCls + " appearance-none cursor-pointer";
