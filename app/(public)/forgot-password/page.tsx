import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordReset } from "@/components/auth/PasswordReset";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset Password"
      description="Recover account access to continue secure operations."
      sideTitle="Identity Recovery"
      sidePoints={[
        "Password reset with secure email token",
        "Session revalidation and token refresh",
        "Post-reset MFA setup support",
      ]}
    >
      <PasswordReset title="Request reset link" />
    </AuthShell>
  );
}
