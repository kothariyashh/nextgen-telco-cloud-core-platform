import { PasswordReset } from "@/components/auth/PasswordReset";

export default function ForgotPasswordPage() {
  return (
    <main className="container py-12">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Reset Password</h1>
        <p className="mt-2 text-sm text-slate-600">Request a password reset email.</p>
        <div className="mt-6">
          <PasswordReset title="Forgot Password" />
        </div>
      </div>
    </main>
  );
}
