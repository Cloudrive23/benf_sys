import { errorResponse } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";

export function handleApiError(error: unknown) {
  console.error(error);

  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.errors);
  }

  return errorResponse("Unexpected server error", 500);
}
