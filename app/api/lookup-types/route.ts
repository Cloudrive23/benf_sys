import { prisma } from "@/app/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

import { requirePermission } from "@/lib/permissions";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await prisma.$queryRaw`
      SELECT
        id,
        type_code,
        type_name_ar,
        type_name_en,
        sort_order,
        is_active,
        created_at,
        updated_at
      FROM lookup_types
      WHERE is_active = true
      ORDER BY sort_order ASC, type_name_ar ASC
    `;

    return successResponse(data, "تم تحميل أنواع القوائم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("lookups.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();



    const data = await prisma.$queryRaw`
      INSERT INTO lookup_types (
        type_code,
        type_name_ar,
        type_name_en,
        sort_order,
        is_active
      )
      VALUES (
        ${body.type_code},
        ${body.type_name_ar},
        ${body.type_name_en || null},
        ${Number(body.sort_order || 0)},
        ${body.is_active ?? true}
      )
      RETURNING *
    `;

    return successResponse(Array.isArray(data) ? data[0] : data, "تمت إضافة نوع القائمة بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("lookups.manage");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await prisma.$queryRaw`
      UPDATE lookup_types
      SET
        type_code = ${body.type_code},
        type_name_ar = ${body.type_name_ar},
        type_name_en = ${body.type_name_en || null},
        sort_order = ${Number(body.sort_order || 0)},
        is_active = ${body.is_active ?? true},
        updated_at = NOW()
      WHERE id = ${body.id}::uuid
      RETURNING *
    `;

    return successResponse(Array.isArray(data) ? data[0] : data, "تم تعديل نوع القائمة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
