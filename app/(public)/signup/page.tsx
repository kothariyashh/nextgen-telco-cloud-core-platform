import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create Account"
      description="Set up your tenant and launch network control workflows in minutes."
      sideTitle="Launch Your Tenant"
      sidePoints={[
        "Provision tenant workspace",
        "Enable network, policy, and billing modules",
        "Invite engineers and assign roles",
      ]}
    >
      <SignupForm title="Create your workspace" />
    </AuthShell>
  );
}
