import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  description: string;
  bullets: string[];
  ctaHref?: string;
  ctaLabel?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export function PublicSectionPage({
  title,
  description,
  bullets,
  ctaHref = "/signup",
  ctaLabel = "Start Free Trial",
  imageSrc = "/visuals/module-console.svg",
  imageAlt = "Platform module visual",
}: Props) {
  return (
    <main className="container py-12">
      <section className="mesh-bg overflow-hidden rounded-[24px] border border-sky-100 p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="fade-in-up">
            <p className="inline-flex rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">
              Product Overview
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 md:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-slate-700">{description}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {bullets.map((item, index) => (
                <div key={item} className={`surface-card p-3 text-sm text-slate-700 fade-in-up delay-${(index % 4) + 1}`}>
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={ctaHref} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                {ctaLabel}
              </Link>
              <Link href="/contact" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800">
                Talk to Solution Architect
              </Link>
            </div>
          </div>

          <div className="fade-in-up delay-2">
            <div className="image-frame float-y-slow">
              <Image src={imageSrc} alt={imageAlt} width={860} height={560} className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
