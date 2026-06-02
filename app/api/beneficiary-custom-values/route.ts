import { prisma } from "@/app/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

export const dynamic = "force-dynamic";

function buildValueData(field: any, value: any) {
  const base: any = {
    value_text: null,
    value_number: null,
    value_date: null,
    value_boolean: null,
    lookup_id: null,
  };

  if (value === undefined || value === null || value === "") {
    return base;
  }

  if (field.field_type === "number") {
    base.value_number = Number(value);
    return base;
  }

  if (field.field_type === "date") {
    base.value_date = new Date(value);
    return base;
  }

  if (field.field_type === "boolean") {
    base.value_boolean = Boolean(value);
    return base;
  }

  if (field.field_type === "lookup") {
    base.lookup_id = value;
    return base;
  }

  base.value_text = String(value);
  return base;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const beneficiaryId = searchParams.get("beneficiary_id");

    if (!beneficiaryId) {
      return successResponse({}, "لا توجد قيم");
    }

    const rows = await prisma.beneficiary_custom_values.findMany({
      where: {
        beneficiary_id: beneficiaryId,
      },
      include: {
        field: true,
      },
    });

    const values: Record<string, any> = {};

    for (const row of rows) {
      const type = row.field.field_type;

      if (type === "number") values[row.field_id] = row.value_number;
      else if (type === "date") values[row.field_id] = row.value_date;
      else if (type === "boolean") values[row.field_id] = row.value_boolean;
      else if (type === "lookup") values[row.field_id] = row.lookup_id;
      else values[row.field_id] = row.value_text;
    }

    return successResponse(values, "تم تحميل القيم الديناميكية");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const beneficiaryId = body.beneficiary_id;
    const values = body.values || {};

    if (!beneficiaryId) {
      throw new Error("beneficiary_id مطلوب");
    }

    const fields = await prisma.beneficiary_custom_fields.findMany({
      where: {
        id: {
          in: Object.keys(values),
        },
      },
    });

    for (const field of fields) {
      const valueData = buildValueData(field, values[field.id]);

      await prisma.beneficiary_custom_values.upsert({
        where: {
          beneficiary_id_field_id: {
            beneficiary_id: beneficiaryId,
            field_id: field.id,
          },
        },
        update: {
          ...valueData,
          updated_at: new Date(),
        },
        create: {
          beneficiary_id: beneficiaryId,
          field_id: field.id,
          ...valueData,
        },
      });
    }

    return successResponse(null, "تم حفظ القيم الديناميكية بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}