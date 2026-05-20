import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export function proxy(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  const isLoginPage = path === "/login";

  const protectedPaths = [
    "/",
    "/users",
    "/api/users",
  ];

  const isProtected = protectedPaths.some((protectedPath) =>
    path === protectedPath || path.startsWith(`${protectedPath}/`)
  );

  if (!token && isProtected && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(new URL("/users", req.url));
  }

  if (token) {
    const verified = verifyToken(token);

    if (!verified) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/users/:path*",
    "/api/users/:path*",
    "/login",
  ],
};