import { PublicSectionPage } from "@/components/shared/PublicSectionPage";

export default function PricingPage() {
  return (
    <PublicSectionPage
      title="Pricing"
      description="Operator-focused tiers with predictable capacity planning and expansion-ready controls."
      bullets={[
        "Starter: 10K subscribers, 10 network functions, 5 slices",
        "Growth: 100K subscribers, 50 network functions, 25 slices",
        "Enterprise: Unlimited scale, dedicated support, custom success plan",
        "Usage add-ons for AI, advanced compliance workflows, and premium observability retention",
      ]}
      ctaLabel="Talk to Sales"
      ctaHref="/contact"
      imageSrc="/visuals/module-console.svg"
      imageAlt="Billing and pricing console"
    />
  );
}
