import { prisma } from "@/app/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

export const dynamic = "force-dynamic";

const excludedFields = [
  "id",
  "created_at",
  "updated_at",
  "deleted_at",
  "created_by",
  "updated_by",
  "is_deleted",
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");

    if (!table) {
      return successResponse([], "اسم الجدول مطلوب", 400);
    }

    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      return successResponse([], "اسم الجدول غير صحيح", 400);
    }

    const columns = await prisma.$queryRawUnsafe<any[]>(`
      select
        column_name,
        data_type,
        ordinal_position
      from information_schema.columns
      where table_schema = 'public'
        and table_name = '${table}'
      order by ordinal_position asc
    `);

    const data = columns
      .filter((item) => !excludedFields.includes(item.column_name))
      .map((item) => ({
        field_name: item.column_name,
        data_type: item.data_type,
        sort_order: item.ordinal_position,
      }));

    return successResponse(data, "تم جلب حقول الجدول بنجاح", 200, data.length);
  } catch (error) {
    return handleApiError(error);
  }
}