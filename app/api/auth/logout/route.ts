import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/login`
  );

  response.cookies.set("token", "", {
    expires: new Date(0),
    path: "/",
  });

  return response;
}