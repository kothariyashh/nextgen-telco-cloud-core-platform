import { PublicSectionPage } from "@/components/shared/PublicSectionPage";

export default function AcceptInvitePage() {
  return (
    <PublicSectionPage
      title="Accept Tenant Invite"
      description="Join your operator workspace using the invite token shared by your tenant admin."
      bullets={[
        "Validate invite token and role assignment",
        "Set password and optional MFA",
        "Access tenant-scoped control plane modules",
      ]}
      imageSrc="/visuals/telecom-hero.svg"
      imageAlt="Tenant invitation visual"
    />
  );
}
