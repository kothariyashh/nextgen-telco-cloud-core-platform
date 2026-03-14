import Link from "next/link";

type Props = {
  title: string;
  description: string;
  bullets: string[];
  ctaHref?: string;
  ctaLabel?: string;
};

export function PublicSectionPage({ title, description, bullets, ctaHref = "/signup", ctaLabel = "Start Free Trial" }: Props) {
  return (
    <main className="container py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10">
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-3 max-w-3xl text-slate-700">{description}</p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {bullets.map((item) => (
            <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {item}
            </div>
          ))}
        </div>
        <Link href={ctaHref} className="mt-7 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          {ctaLabel}
        </Link>
      </div>
    </main>
  );
}
