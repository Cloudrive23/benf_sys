import { prisma } from "@/app/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

export const dynamic = "force-dynamic";

function safeName(value: string) {
  return /^[a-zA-Z0-9_]+$/.test(value);
}

function normalizeId(value: any) {
  if (value === null || value === undefined) return "";
  return String(value);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entityKey = searchParams.get("entityKey") || "";

    const entity = await prisma.entity_definitions.findUnique({
      where: {
        entity_key: entityKey,
      },
      include: {
        fields: {
          where: {
            is_active: true,
            is_visible_in_table: true,
          },
          orderBy: {
            sort_order: "asc",
          },
        },
      },
    });

    if (!entity) {
      return successResponse({}, "تعريف الكيان غير موجود", 200);
    }

    const result: Record<string, Record<string, string>> = {};

    for (const field of entity.fields as any[]) {
      /**
       * النوع الأول:
       * reference_type = lookup
       *
       * مثال:
       * occupation_id => occupations
       * death_reason_id => death_reasons
       */
      if (field.reference_type === "lookup" && field.lookup_type) {
        const rows = await prisma.lookups.findMany({
          where: {
            lookup_type: field.lookup_type,
            is_active: true,
          },
          select: {
            id: true,
            name_ar: true,
          },
          orderBy: {
            name_ar: "asc",
          },
        });

        result[field.field_name] = Object.fromEntries(
          rows.map((row) => [normalizeId(row.id), row.name_ar || "-"])
        );

        continue;
      }

      /**
       * النوع الثاني:
       * reference_type = table
       *
       * مثال:
       * branch_id:
       * reference_table = branches
       * reference_key_field = id
       * reference_label_field = branch_name_ar
       */
      if (
        field.reference_type === "table" &&
        field.reference_table &&
        field.reference_key_field &&
        field.reference_label_field
      ) {
        if (
          !safeName(field.reference_table) ||
          !safeName(field.reference_key_field) ||
          !safeName(field.reference_label_field)
        ) {
          continue;
        }

        const rows = await prisma.$queryRawUnsafe<any[]>(`
          select
            ${field.reference_key_field}::text as id,
            ${field.reference_label_field}::text as label
          from ${field.reference_table}
          order by ${field.reference_label_field} asc
        `);

        result[field.field_name] = Object.fromEntries(
          rows.map((row) => [normalizeId(row.id), row.label || "-"])
        );

        continue;
      }
    }

    return successResponse(result, "تم تحميل بيانات الحقول المرتبطة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}