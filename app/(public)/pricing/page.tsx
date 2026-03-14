import { PublicSectionPage } from "@/components/shared/PublicSectionPage";

export default function PricingPage() {
  return (
    <PublicSectionPage
      title="Pricing"
      description="Simple operator-focused pricing tiers with subscriber-based growth paths."
      bullets={[
        "Starter: Up to 10K subscribers, 10 network functions, 5 slices",
        "Growth: Up to 100K subscribers, 50 network functions, 25 slices",
        "Enterprise: Unlimited scale with dedicated support",
        "Usage-based add-ons for advanced analytics and AI automation",
      ]}
      ctaLabel="Talk to Sales"
      ctaHref="/contact"
    />
  );
}
