import { PublicSectionPage } from "@/components/shared/PublicSectionPage";

export default function AboutPage() {
  return (
    <PublicSectionPage
      title="About NGCMCP"
      description="We build software-defined mobile core infrastructure for CSP teams moving from hardware appliances to elastic cloud-native operation."
      bullets={[
        "Product vision focused on Tier-2 and Tier-3 operator modernization",
        "Domain expertise across packet core, orchestration, and monetization",
        "Security and compliance by design with tenant-level isolation",
        "Open integration model for marketplace and partner workloads",
      ]}
      imageSrc="/visuals/telecom-hero.svg"
      imageAlt="NGCMCP product vision visual"
    />
  );
}
