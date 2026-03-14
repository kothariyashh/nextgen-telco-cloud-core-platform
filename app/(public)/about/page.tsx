import { PublicSectionPage } from "@/components/shared/PublicSectionPage";

export default function AboutPage() {
  return (
    <PublicSectionPage
      title="About NGCMCP"
      description="NGCMCP is built for Tier-2 and Tier-3 CSPs modernizing mobile core operations with cloud-native architectures."
      bullets={[
        "Microservices-native control plane",
        "Operator-first workflows for NOC and engineering teams",
        "Multi-cloud and edge readiness",
        "Security-first and compliance-aligned design",
      ]}
    />
  );
}
