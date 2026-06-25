// Financing strip on the account overview — server component reading
// from Postgres. Renders nothing when the customer has no requests.
// Locale-aware via getTranslations.

import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getServerSession } from "@/server/auth-helpers";
import { listMyFinancing } from "@/server/financing/service";
import {
  FIN_STATUS_LABEL,
  FIN_STATUS_TONE,
  StatusBadge,
} from "@/components/account/StatusBadge";

export async function AccountFinancingStrip() {
  const session = await getServerSession();
  if (!session?.user) return null;
  const requests = await listMyFinancing(session.user.id);
  if (requests.length === 0) return null;

  const t = await getTranslations("account.financingStrip");

  return (
    <section className="rounded-2xl bg-paper border border-hairline overflow-hidden">
      <header className="flex items-center justify-between px-5 py-4 border-b border-hairline">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-mute">
            {t("eyebrow")}
          </p>
          <h2 className="mt-0.5 text-[16px] font-semibold tracking-[-0.005em] text-ink">
            {t("title")}
          </h2>
        </div>
        <Link
          href="/account/financing"
          className="text-[12px] font-medium text-ink-soft hover:text-ink"
        >
          {t("viewAll")}
        </Link>
      </header>
      <ul>
        {requests.slice(0, 3).map((r, i) => (
          <li
            key={r.id}
            className={
              "px-5 py-3.5 hover:bg-canvas transition-colors " +
              (i > 0 ? "border-t border-hairline" : "")
            }
          >
            <Link
              href={`/account/financing/${r.ref}`}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-[13.5px] font-medium tabular-nums text-ink">
                  {r.ref}
                </p>
                <p className="text-[11.5px] text-ink-mute mt-0.5">
                  {t("itemPlan", {
                    items: r.items.length,
                    months: r.financing.months,
                  })}
                </p>
              </div>
              <StatusBadge
                tone={FIN_STATUS_TONE[r.status]}
                label={FIN_STATUS_LABEL[r.status]}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
