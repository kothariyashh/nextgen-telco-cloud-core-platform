import { PublicSectionPage } from "@/components/shared/PublicSectionPage";

export default function BlogPage() {
  return (
    <PublicSectionPage
      title="Platform Updates"
      description="Follow releases, product notes, and operator success stories."
      bullets={[
        "Release notes and API updates",
        "Reference deployment guides",
        "Performance benchmark reports",
        "Telecom cloud-native best practices",
      ]}
    />
  );
}
