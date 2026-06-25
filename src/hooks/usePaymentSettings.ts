"use client";

// Tiny fetcher hook for the live payment-method config.
//
// Starts with DEFAULT_PAYMENT_CONFIG (synchronous, no network) so
// first paint of /checkout is instant. Replaces with the live config
// from /api/payment-settings as soon as the JSON arrives. The shape
// is identical either way, so the UI doesn't need a loading state.

import { useEffect, useState } from "react";

import {
  DEFAULT_PAYMENT_CONFIG,
  type PaymentMethodConfig,
} from "@/server/payment-settings/service";

export function usePaymentSettings(): PaymentMethodConfig {
  const [config, setConfig] = useState<PaymentMethodConfig>(
    DEFAULT_PAYMENT_CONFIG,
  );

  useEffect(() => {
    let alive = true;
    fetch("/api/payment-settings", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data) setConfig(data as PaymentMethodConfig);
      })
      .catch(() => {
        // Network blip — keep defaults; checkout stays usable.
      });
    return () => {
      alive = false;
    };
  }, []);

  return config;
}
