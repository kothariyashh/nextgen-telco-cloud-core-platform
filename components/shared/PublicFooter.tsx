import Link from "next/link";

const links = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
  { label: "Status", href: "/status" },
  { label: "Contact", href: "/contact" },
];

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white/85">
      <div className="container py-8">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-semibold text-slate-900">NGCMCP - Cloud-Native Mobile Core Platform</p>
            <p className="mt-1 text-sm text-slate-600">Built for telecom cloud and edge operations across 4G EPC and 5G SA domains.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-900">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <p className="mt-6 text-xs text-slate-500">© {new Date().getFullYear()} NGCMCP. All rights reserved.</p>
      </div>
    </footer>
  );
}
