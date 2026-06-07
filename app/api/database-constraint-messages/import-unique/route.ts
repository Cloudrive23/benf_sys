import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { databaseConstraintMessagesService } from "@/services/database-constraint-messages.service";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const data = await databaseConstraintMessagesService.importUniqueConstraints();

    return successResponse(
      data,
      `تم استيراد قيود Unique بنجاح. جديد: ${data.created}، موجود مسبقًا: ${data.exists}`
    );
  } catch (error) {
    return handleApiError(error);
  }
}