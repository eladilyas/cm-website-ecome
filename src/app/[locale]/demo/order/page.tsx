// Interactive POS workspace. All logic lives in POSWorkspace; this page
// is just the route handler.

import { POSWorkspace } from "@/components/demo/POSWorkspace";

export default function DemoOrderPage() {
  return <POSWorkspace />;
}
