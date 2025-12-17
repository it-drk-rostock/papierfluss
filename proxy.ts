import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@lib/auth";
import { createRouteMatcher } from "@utils/create-route-matcher";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/admin(.*)"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if protected route using pathname directly
  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
