import { PublicSectionPage } from "@/components/shared/PublicSectionPage";

export default function FeaturesPage() {
  return (
    <PublicSectionPage
      title="Platform Features"
      description="NGCMCP combines cloud-native core lifecycle management, multi-tenant governance, and live operations intelligence for telecom teams."
      bullets={[
        "5G SA core lifecycle controls: AMF, SMF, UPF, PCF, UDM, AUSF, NRF, NSSF",
        "4G EPC continuity: MME, SGW, PGW, HSS, PCRF for migration-safe operation",
        "Network slicing with policy-bound QoS and subscriber assignment",
        "Real-time observability: metrics, alarms, traces, and log intelligence",
        "Billing stack with OCS charging sessions + CDR exports",
        "AI assistant workflows for intent-based orchestration and anomaly response",
      ]}
      imageSrc="/visuals/telecom-architecture.svg"
      imageAlt="Telecom architecture view"
    />
  );
}
