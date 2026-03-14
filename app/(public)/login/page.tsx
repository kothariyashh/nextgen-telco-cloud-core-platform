import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="container py-12">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8">
        <h1 className="text-3xl font-semibold text-slate-900">Log In</h1>
        <p className="mt-2 text-sm text-slate-600">Access your NGCMCP control plane.</p>
        <div className="mt-6">
          <LoginForm title="Email and password" />
        </div>
      </div>
    </main>
  );
}
