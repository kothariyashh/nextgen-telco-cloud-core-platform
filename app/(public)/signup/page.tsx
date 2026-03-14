import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <main className="container py-12">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Create Account</h1>
        <p className="mt-2 text-sm text-slate-600">Set up tenant access and launch your control plane.</p>
        <div className="mt-6">
          <SignupForm title="Sign up" />
        </div>
      </div>
    </main>
  );
}
