// app/api/attachments/entity/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

function ok(data: unknown, message = "تمت العملية بنجاح", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, message, details },
    { status }
  );
}

function emptyToNull(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

/**
 * GET /api/attachments/entity?entity_type=beneficiary&entity_id=...
 * جلب مرفقات أي كيان من الجدول العام entity_attachments
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const entity_type = searchParams.get("entity_type");
    const entity_id = searchParams.get("entity_id");
    const beneficiary_id = searchParams.get("beneficiary_id");
    const section_id = searchParams.get("section_id");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const where: any = {};

    if (entity_type) where.entity_type = entity_type;
    if (entity_id) where.entity_id = entity_id;
    if (beneficiary_id) where.beneficiary_id = beneficiary_id;
    if (section_id) where.section_id = section_id;

    if (!includeInactive) {
      where.is_active = true;
    }

    const rows = await prisma.entity_attachments.findMany({
      where,
      orderBy: [{ uploaded_at: "desc" }, { created_at: "desc" }],
      include: {
        attachment_types: true,
        attachment_sections: true,
      },
    });

    return ok(rows, "تم جلب المرفقات بنجاح");
  } catch (error: any) {
    console.error("GET /api/attachments/entity error:", error);
    return fail("حدث خطأ أثناء جلب المرفقات", 500, error?.message);
  }
}

/**
 * POST /api/attachments/entity
 * إضافة سجل مرفق بدون رفع ملف فعلي حاليًا
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const entity_type = String(body.entity_type ?? "").trim();
    const entity_id = String(body.entity_id ?? "").trim();
    const attachment_type_id = String(body.attachment_type_id ?? "").trim();

    if (!entity_type) return fail("نوع الكيان مطلوب", 400);
    if (!entity_id) return fail("معرف الكيان مطلوب", 400);
    if (!attachment_type_id) return fail("نوع المرفق مطلوب", 400);

    const attachmentType = await prisma.attachment_types.findUnique({
      where: { id: attachment_type_id },
    });

    if (!attachmentType) {
      return fail("نوع المرفق غير موجود", 404);
    }

    const file_extension = String(body.file_extension ?? "").trim();
    const stored_file_name = String(body.stored_file_name ?? "").trim();
    const file_path = String(body.file_path ?? "").trim();

    if (!file_extension) return fail("امتداد الملف مطلوب", 400);
    if (!stored_file_name) return fail("اسم الملف المخزن مطلوب", 400);
    if (!file_path) return fail("مسار الملف مطلوب", 400);

    const created = await prisma.entity_attachments.create({
      data: {
        entity_type,
        entity_id,

        section_id: emptyToNull(body.section_id) as string | null,
        attachment_type_id,

        beneficiary_id: emptyToNull(body.beneficiary_id) as string | null,
        periodic_report_id: emptyToNull(body.periodic_report_id) as string | null,
        sponsorship_id: emptyToNull(body.sponsorship_id) as string | null,

        branch_id: emptyToNull(body.branch_id) as string | null,
        site_id: emptyToNull(body.site_id) as string | null,
        center_id: emptyToNull(body.center_id) as string | null,

        file_number: emptyToNull(body.file_number) as string | null,

        report_year:
          body.report_year === undefined ||
          body.report_year === null ||
          body.report_year === ""
            ? null
            : Number(body.report_year),

        report_type: emptyToNull(body.report_type) as string | null,

        original_file_name: emptyToNull(body.original_file_name) as string | null,
        stored_file_name,
        file_extension,
        mime_type: emptyToNull(body.mime_type) as string | null,

        file_size:
          body.file_size === undefined ||
          body.file_size === null ||
          body.file_size === ""
            ? null
            : BigInt(body.file_size),

        storage_driver: String(body.storage_driver ?? "local"),
        file_path,
        relative_path: emptyToNull(body.relative_path) as string | null,
        public_url: emptyToNull(body.public_url) as string | null,

        version_no:
          body.version_no === undefined ||
          body.version_no === null ||
          body.version_no === ""
            ? 1
            : Number(body.version_no),

        is_current: Boolean(body.is_current ?? true),
        status: String(body.status ?? "active"),
        is_active: Boolean(body.is_active ?? true),

        uploaded_by: emptyToNull(body.uploaded_by) as string | null,
        notes: emptyToNull(body.notes) as string | null,
      },
    });

    return ok(created, "تمت إضافة سجل المرفق بنجاح", 201);
  } catch (error: any) {
    console.error("POST /api/attachments/entity error:", error);
    return fail("حدث خطأ أثناء إضافة سجل المرفق", 500, error?.message);
  }
}

/**
 * DELETE /api/attachments/entity?id=...
 * تعطيل المرفق بدل الحذف الفعلي
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return fail("معرف المرفق مطلوب", 400);
    }

    const oldRow = await prisma.entity_attachments.findUnique({
      where: { id },
    });

    if (!oldRow) {
      return fail("المرفق غير موجود", 404);
    }

    const disabled = await prisma.entity_attachments.update({
      where: { id },
      data: {
        is_active: false,
        status: "disabled",
        updated_at: new Date(),
      },
    });

    return ok(disabled, "تم تعطيل المرفق بنجاح");
  } catch (error: any) {
    console.error("DELETE /api/attachments/entity error:", error);
    return fail("حدث خطأ أثناء تعطيل المرفق", 500, error?.message);
  }
}