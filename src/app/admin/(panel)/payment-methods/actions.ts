"use server";

// Payment-methods admin server actions. Super-admin only.

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireSuperAdmin } from "@/server/auth-helpers";
import {
  type PaymentMethodConfig,
  getPaymentSettings,
  updatePaymentSettings,
} from "@/server/payment-settings/service";
import { recordAuditEvent } from "@/server/audit/log";

const PaymentMethodsInput = z.object({
  cmi: z.object({
    enabled: z.boolean(),
    label: z.string().min(1).max(80),
    note: z.string().max(240),
  }),
  wafasalaf: z.object({
    enabled: z.boolean(),
    label: z.string().min(1).max(80),
    description: z.string().max(240),
  }),
  wireTransfer: z.object({
    enabled: z.boolean(),
    label: z.string().min(1).max(80),
    bankName: z.string().max(120),
    accountHolder: z.string().max(120),
    rib: z.string().max(80),
    iban: z.string().max(80),
    swift: z.string().max(20),
    referenceHint: z.string().max(400),
  }),
});

export async function savePaymentMethods(
  input: PaymentMethodConfig,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { userId } = await requireSuperAdmin("/admin/payment-methods");
  const parsed = PaymentMethodsInput.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  try {
    const previous = await getPaymentSettings();
    await updatePaymentSettings(parsed.data, userId);
    revalidatePath("/admin/payment-methods");
    revalidatePath("/checkout");
    await recordAuditEvent({
      action: "settings.payment_methods.update",
      actorUserId: userId,
      resourceType: "setting",
      resourceId: "payment_methods",
      before: {
        cmiEnabled: previous.cmi.enabled,
        wafasalafEnabled: previous.wafasalaf.enabled,
        wireTransferEnabled: previous.wireTransfer.enabled,
      },
      after: {
        cmiEnabled: parsed.data.cmi.enabled,
        wafasalafEnabled: parsed.data.wafasalaf.enabled,
        wireTransferEnabled: parsed.data.wireTransfer.enabled,
      },
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to save.",
    };
  }
}
