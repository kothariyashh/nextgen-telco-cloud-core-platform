import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NGCMCP Control Plane",
  description: "Cloud-Native Mobile Core Platform for modern CSP operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
