"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { SectionCard } from "@/components/admin/AdminPrimitives";
import { assignOrder, distributeOrders, unassignOrder } from "./actions";

type Assignment = {
  id: string;
  orderRef: string;
  assignedToUserId: string;
  assignedToLabel: string;
  notes: string | null;
  updatedAt: string;
};

type Dispatcher = { id: string; label: string; email: string };

export function OrderAssignmentsTable({
  assignments,
  dispatchers,
}: {
  assignments: Assignment[];
  dispatchers: Dispatcher[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  // ── Single assign ────────────────────────────────────────────────
  const [newRef, setNewRef] = useState("");
  const [newAssignee, setNewAssignee] = useState(dispatchers[0]?.id ?? "");
  const submitOne = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!newRef || !newAssignee) return;
    startTransition(async () => {
      const res = await assignOrder({
        orderRef: newRef,
        assignedToUserId: newAssignee,
      });
      if (res.ok) {
        setNewRef("");
        setFeedback("Assigned.");
        router.refresh();
      } else {
        setFeedback(res.error);
      }
    });
  };

  // ── Bulk distribute ──────────────────────────────────────────────
  const [bulkText, setBulkText] = useState("");
  const submitBulk = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const refs = bulkText
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (refs.length === 0) {
      setFeedback("Paste one or more order refs separated by spaces or commas.");
      return;
    }
    startTransition(async () => {
      const res = await distributeOrders(refs);
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

  const reassign = (ref: string, toUserId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await assignOrder({
        orderRef: ref,
        assignedToUserId: toUserId,
      });
      if (!res.ok) setFeedback(res.error);
      else router.refresh();
    });
  };

  const unassign = (ref: string) => {
    setFeedback(null);
    startTransition(async () => {
      await unassignOrder(ref);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard
          title="Assign one order"
          description="Paste the order reference (e.g. ORD-2026-A4B7) and pick a dispatcher."
        >
          <form onSubmit={submitOne} className="p-5 space-y-3">
            <input
              type="text"
              value={newRef}
              onChange={(e) => setNewRef(e.target.value)}
              placeholder="ORD-2026-A4B7"
              required
              className={inputCls + " tabular-nums"}
            />
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className={selectCls}
            >
              {dispatchers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
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
          description="Paste a list of order refs — distributed evenly across active dispatchers. Existing assignments are preserved."
        >
          <form onSubmit={submitBulk} className="p-5 space-y-3">
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={5}
              placeholder="ORD-2026-A4B7, ORD-2026-B8C2, …"
              className={inputCls + " py-3 min-h-[110px] resize-y tabular-nums"}
            />
            <button
              type="submit"
              disabled={pending || dispatchers.length === 0}
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

      <SectionCard title={`Orders (${assignments.length})`}>
        {assignments.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-[13px] text-ink-soft">
              No orders assigned yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="admin-thead text-ink-mute text-[11px] uppercase tracking-[0.12em]">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Order ref</th>
                  <th className="text-left font-medium px-5 py-3">Dispatcher</th>
                  <th className="text-left font-medium px-5 py-3">Updated</th>
                  <th className="text-right font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3.5 text-ink tabular-nums">
                      {a.orderRef.toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        value={a.assignedToUserId}
                        onChange={(e) => reassign(a.orderRef, e.target.value)}
                        className="rounded-md border border-hairline bg-paper px-2 py-1 text-[12.5px]"
                      >
                        {dispatchers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
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
                        onClick={() => unassign(a.orderRef)}
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
