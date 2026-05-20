import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("token")?.value;

  const isLoginPage =
    req.nextUrl.pathname === "/login";

  if (!token && !isLoginPage) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  if (token && isLoginPage) {
    return NextResponse.redirect(
      new URL("/users", req.url)
    );
  }

  if (token) {
    const verified = verifyToken(token);

    if (!verified) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/users/:path*",
    "/dashboard/:path*",
    "/login",
  ],
};