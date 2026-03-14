import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Log In"
      description="Access your NGCMCP control plane and continue live operations."
      sideTitle="Secure Access Layer"
      sidePoints={[
        "Tenant-isolated session management",
        "Role-based controls for engineering and billing",
        "MFA and SSO-ready authentication flow",
      ]}
    >
      <LoginForm title="Email and password" />
    </AuthShell>
  );
}
