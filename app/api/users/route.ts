import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      username: true,
      full_name: true,
      email: true,
      is_active: true,
      created_at: true,
    },
    take: 10,
  });

  return NextResponse.json({
    success: true,
    count: users.length,
    data: users,
  });
}