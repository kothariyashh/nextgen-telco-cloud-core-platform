import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const protectedPrefix = "/app";
const authRoutes = ["/login", "/signup", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  if (pathname.startsWith(protectedPrefix) && !user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user && authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/app/:path*", "/login", "/signup", "/forgot-password"],
};
