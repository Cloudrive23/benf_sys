import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

export function successResponse<T>(
  data: T,
  message = "Success",
  status = 200,
  count?: number
) {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    count,
  };

  return NextResponse.json(response, { status });
}

export function errorResponse(
  message = "Server Error",
  status = 500,
  errors?: unknown
) {
  const response: ApiResponse = {
    success: false,
    message,
    errors,
  };

  return NextResponse.json(response, { status });
}
