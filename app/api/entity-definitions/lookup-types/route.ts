import { prisma } from "@/app/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = new Set<string>();

    const lookupRows = await prisma.$queryRaw<any[]>`
      select distinct lookup_type
      from lookups
      where lookup_type is not null
        and trim(lookup_type) <> ''
      order by lookup_type asc
    `;

    for (const row of lookupRows) {
      if (row.lookup_type) {
        result.add(String(row.lookup_type));
      }
    }

    const lookupTypesTable = await prisma.$queryRaw<any[]>`
      select to_regclass('public.lookup_types')::text as table_name
    `;

    if (lookupTypesTable?.[0]?.table_name) {
      const columns = await prisma.$queryRaw<any[]>`
        select column_name
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'lookup_types'
      `;

      const columnNames = columns.map((x) => x.column_name);

      let keyColumn = "";

      if (columnNames.includes("type_key")) {
        keyColumn = "type_key";
      } else if (columnNames.includes("lookup_type")) {
        keyColumn = "lookup_type";
      } else if (columnNames.includes("code")) {
        keyColumn = "code";
      }

      if (keyColumn) {
        const hasIsActive = columnNames.includes("is_active");

        const typeRows = await prisma.$queryRawUnsafe<any[]>(`
          select ${keyColumn} as lookup_type
          from lookup_types
          where ${keyColumn} is not null
            and trim(${keyColumn}) <> ''
            ${hasIsActive ? "and is_active = true" : ""}
          order by ${keyColumn} asc
        `);

        for (const row of typeRows) {
          if (row.lookup_type) {
            result.add(String(row.lookup_type));
          }
        }
      }
    }

    return successResponse(
      Array.from(result).sort(),
      "تم تحميل أنواع القوائم بنجاح"
    );
  } catch (error) {
    return handleApiError(error);
  }
}