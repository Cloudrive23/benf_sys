import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to load users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.username || !body.full_name || !body.password) {
      return NextResponse.json(
        { success: false, message: "Username, full name and password are required" },
        { status: 400 }
      );
    }

    const password_hash = await bcrypt.hash(body.password, 10);

    const user = await prisma.users.create({
      data: {
        username: body.username,
        full_name: body.full_name,
        email: body.email || null,
        phone: body.phone || null,
        password_hash,
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

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.id || !body.username || !body.full_name) {
      return NextResponse.json(
        { success: false, message: "User ID, username and full name are required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      username: body.username,
      full_name: body.full_name,
      email: body.email || null,
      phone: body.phone || null,
      is_active: Boolean(body.is_active),
    };

    if (body.password) {
      updateData.password_hash = await bcrypt.hash(body.password, 10);
    }

    const user = await prisma.users.update({
      where: { id: body.id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update user" },
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
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await prisma.users.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
