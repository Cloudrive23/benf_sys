import { prisma } from "@/app/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

import { requirePermission } from "@/lib/permissions";
export const dynamic = "force-dynamic";

const excludedTables = [
  "_prisma_migrations",
];

export async function GET() {
  try {
    const permission = await requirePermission("audit_settings.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const tables = await prisma.$queryRaw<any[]>`
      select
        table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_type = 'BASE TABLE'
      order by table_name asc
    `;

    const data = tables
      .map((item) => item.table_name)
      .filter((tableName) => !excludedTables.includes(tableName))
      .map((tableName) => ({
        table_name: tableName,
      }));

    return successResponse(data, "تم جلب الجداول المتاحة بنجاح", 200, data.length);
  } catch (error) {
    return handleApiError(error);
  }
}
