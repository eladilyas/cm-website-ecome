"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useDemoStore } from "@/lib/demoStore";
import type { ActivityKey } from "@/data/demo/types";

// Pre-primes the demo simulator with a specific activity, then routes
// to the workspace. Mounted on each industry page to convert visitors
// from the marketing surface straight into a hands-on POS preview
// without an interim activity-picker step.

type Props = {
  activity: ActivityKey;
  label: string;
  description?: string;
};

export function TrySimulatorCTA({ activity, label, description }: Props) {
  const router = useRouter();
  const select = useDemoStore((s) => s.selectActivity);
  return (
    <div className="rounded-2xl border border-hairline bg-paper p-6 md:p-7 flex flex-col md:flex-row md:items-center gap-5 md:gap-6">
      <div className="flex-1">
        <p className="text-[15px] md:text-[16px] font-medium text-ink leading-snug">
          {label}
        </p>
        {description && (
          <p className="mt-1.5 text-[13.5px] text-ink-soft leading-[1.5] max-w-[40rem]">
            {description}
          </p>
        )}
      </div>
      <Button
        variant="primary"
        size="md"
        onClick={() => {
          select(activity);
          router.push("/demo/order");
        }}
      >
        {label}
      </Button>
    </div>
  );
}
