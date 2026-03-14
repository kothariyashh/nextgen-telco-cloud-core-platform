import { PublicSectionPage } from "@/components/shared/PublicSectionPage";

export default function FeaturesPage() {
  return (
    <PublicSectionPage
      title="Platform Features"
      description="NGCMCP combines cloud-native core control, multi-tenancy, observability, and AI-assisted orchestration for telecom operators."
      bullets={[
        "5G SA core NF lifecycle management (AMF, SMF, UPF, PCF, UDM, AUSF, NRF, NSSF)",
        "4G EPC support (MME, SGW, PGW, HSS, PCRF)",
        "Network slicing and policy/QoS governance",
        "Live monitoring, alarms, logs, traces, and incident workflows",
        "Billing stack: online charging + CDR exports",
        "AI center: intent controls, anomaly insights, predictive optimization",
      ]}
    />
  );
}
