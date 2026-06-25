import { FeatureVisualBlock } from "@/components/sections/FeatureVisualBlock";
import { ProductImageFrame } from "@/components/visual/ProductImageFrame";
import { SectionDivider } from "@/components/ui/SectionDivider";

// 2-up grid on fog: customer ordering app + driver delivery app.
// Both mockups are phone-portrait; equal-height tile envelope keeps the
// pairing balanced. Hairline between tiles on desktop anchors them as
// distinct surfaces.

export function MobileBandSection() {
  return (
    <div className="bg-fog">
      <SectionDivider scheme="light" />
      <div className="grid grid-cols-1 md:grid-cols-2 items-stretch md:divide-x md:divide-hairline">
      <FeatureVisualBlock
        tone="fog"
        layout="center"
        size="split"
        eyebrow="Online Ordering App"
        title={
          <>
            Your menu,
            <br />
            in their pocket.
          </>
        }
        subtitle="A branded customer app for browsing, ordering, and paying — without ever leaving your kitchen."
        ctaPrimary={{ label: "Online Ordering App", href: "/products/online-ordering-app" }}
        visual={
          <div className="w-full max-w-[240px]">
            <ProductImageFrame
              src="/mockups/mobile-ordering.png"
              alt="Caisse Manager Online Ordering App showing menu categories on a phone."
              width={1261}
              height={2564}
              tone="fog"
              crop="none"
              sizes="(min-width: 1280px) 240px, 60vw"
            />
          </div>
        }
      />
      <FeatureVisualBlock
        tone="fog"
        layout="center"
        size="split"
        eyebrow="Delivery App"
        title={
          <>
            Get there.
            <br />
            Track it. Done.
          </>
        }
        subtitle="Dispatch, route, and confirm — drivers see one screen, you see every order from kitchen to doorstep."
        ctaPrimary={{ label: "Delivery App", href: "/products/delivery-app" }}
        visual={
          <div className="w-full max-w-[240px]">
            <ProductImageFrame
              src="/mockups/mobile-delivery.png"
              alt="Caisse Manager Delivery App showing a navigation map with route to a destination 5 minutes away."
              width={1261}
              height={2564}
              tone="fog"
              crop="none"
              sizes="(min-width: 1280px) 240px, 60vw"
            />
          </div>
        }
      />
      </div>
    </div>
  );
}
