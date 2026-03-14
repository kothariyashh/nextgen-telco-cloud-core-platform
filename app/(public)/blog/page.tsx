import { PublicSectionPage } from "@/components/shared/PublicSectionPage";

export default function BlogPage() {
  return (
    <PublicSectionPage
      title="Platform Updates"
      description="Release notes, rollout guides, and performance learnings from cloud-native telecom deployments."
      bullets={[
        "Version updates for APIs and control plane modules",
        "Architecture notes for edge and multi-region deployments",
        "Operational playbooks for alarm, policy, and session management",
        "AI/automation progress and roadmap announcements",
      ]}
      imageSrc="/visuals/module-console.svg"
      imageAlt="Platform updates visual"
    />
  );
}
