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
    <footer className="mt-16 border-t border-slate-200 bg-white/80">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-slate-600">
        <p>© {new Date().getFullYear()} NGCMCP. Cloud-native mobile core platform.</p>
        <div className="flex flex-wrap gap-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
