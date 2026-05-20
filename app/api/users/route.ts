import { NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        phone: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server Error", error },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const user = await prisma.users.create({
      data: {
        username: String(formData.get("username")),
        full_name: String(formData.get("full_name")),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        password_hash: String(formData.get("password") || "TEMP_PASSWORD"),
        is_active: true,
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        phone: true,
        is_active: true,
        created_at: true,
      },
    });

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/users`);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Create User Failed" },
      { status: 500 }
    );
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      );
    }

    await prisma.users.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Delete failed" },
      { status: 500 }
    );
  }
}