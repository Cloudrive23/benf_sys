import { NextResponse } from "next/server";

import { usersService } from "@/services/users.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await usersService.listUsers();

    return successResponse(
      users,
      "Users loaded successfully",
      200,
      users.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const user = await usersService.createUser(body);

    return successResponse(
      user,
      "User created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const user = await usersService.updateUser(body);

    return successResponse(
      user,
      "User updated successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    await usersService.deleteUser(id || "");

    return successResponse(
      null,
      "User deleted successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}