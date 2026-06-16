import { prisma } from "@/app/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

import { requirePermission } from "@/lib/permissions";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const permission = await requirePermission("audit_settings.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const columns = await prisma.$queryRaw<any[]>`
      select column_name
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'lookups'
      order by ordinal_position asc
    `;

    const columnNames = columns.map((item) => item.column_name);

    const typeColumn =
      columnNames.find((name) => name === "lookup_type") ||
      columnNames.find((name) => name === "type") ||
      columnNames.find((name) => name === "category") ||
      columnNames.find((name) => name === "lookup_category");

    if (!typeColumn) {
      return successResponse(
        {
          available_columns: columnNames,
        },
        "لم يتم العثور على عمود نوع القائمة المرجعية داخل جدول lookups",
        200
      );
    }

    const rows = await prisma.$queryRawUnsafe<any[]>(`
      select distinct ${typeColumn} as type
      from lookups
      where ${typeColumn} is not null
      order by ${typeColumn} asc
    `);

    const data = rows
      .map((item) => item.type)
      .filter(Boolean)
      .map((type) => ({
        type,
      }));

    return successResponse(
      data,
      "تم جلب أنواع القوائم المرجعية بنجاح",
      200,
      data.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}
