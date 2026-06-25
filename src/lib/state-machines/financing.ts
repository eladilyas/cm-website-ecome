// Financing state machine — pure transition validator.
//
// Diagram (ARCHITECTURE.md v2 §10):
//
//   Draft
//      ↓
//   Submitted
//      ↓     ↑ (loops when customer uploads more docs)
//   Documents Required
//      ↓
//   Under Review
//      ├──► Approved ──► Active ──► Paid-off (terminal)
//      └──► Rejected (terminal)
//
//   Cancelled ← reachable from any non-terminal state.

import type { FinancingStatus } from "@/services/contracts";

const FORWARD: Record<FinancingStatus, FinancingStatus[]> = {
  draft: ["submitted", "cancelled"],
  submitted: ["documents-required", "under-review", "cancelled"],
  "documents-required": ["submitted", "cancelled"],
  "under-review": ["approved", "rejected", "documents-required", "cancelled"],
  approved: ["active", "cancelled"],
  rejected: [], // terminal
  active: ["paid-off", "cancelled"],
  "paid-off": [], // terminal
  cancelled: [], // terminal
};

export function canTransitionFinancing(
  current: FinancingStatus,
  next: FinancingStatus,
): boolean {
  return FORWARD[current]?.includes(next) ?? false;
}

export function nextFinancingStatuses(
  current: FinancingStatus,
): FinancingStatus[] {
  return [...(FORWARD[current] ?? [])];
}

export function isTerminalFinancingStatus(status: FinancingStatus): boolean {
  return FORWARD[status]?.length === 0;
}
