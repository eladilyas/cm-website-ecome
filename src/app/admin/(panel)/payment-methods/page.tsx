// Admin / Payment methods — super-admin only.
//
// Centralized config for the 3 storefront payment methods. CMI is
// locked off pending the real API wiring; the toggle reflects that
// state but won't enable. Wafasalaf and Wire transfer are fully
// admin-controlled.

import { requireSuperAdmin } from "@/server/auth-helpers";
import { PageHeader, SectionCard } from "@/components/admin/AdminPrimitives";
import { getPaymentSettings } from "@/server/payment-settings/service";
import { PaymentMethodsForm } from "./PaymentMethodsForm";

export const dynamic = "force-dynamic";

export default async function PaymentMethodsPage() {
  await requireSuperAdmin("/admin/payment-methods");
  const config = await getPaymentSettings();

  return (
    <div>
      <PageHeader
        eyebrow="Storefront"
        title="Payment methods"
        description="Enable or disable each method, and configure the customer-facing details that surface on the checkout and confirmation pages."
      />

      <SectionCard
        title="Methods"
        description="The storefront supports exactly three methods. Adding a fourth requires a code change."
      >
        <div className="p-5 md:p-6">
          <PaymentMethodsForm initial={config} />
        </div>
      </SectionCard>
    </div>
  );
}
