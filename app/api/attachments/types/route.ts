// app/api/attachments/types/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

/**
 * تحويل النص الفارغ إلى null
 */
function emptyToNull(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
}

/**
 * تحويل القيمة الرقمية الاختيارية
 */
function optionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * استجابة نجاح موحدة
 */
function ok(data: unknown, message = "تمت العملية بنجاح", status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
}

/**
 * استجابة خطأ موحدة
 */
function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      details,
    },
    { status }
  );
}

/**
 * تجهيز بيانات نوع المرفق
 */
function mapAttachmentTypePayload(body: any) {
  return {
    code: String(body.code ?? "").trim(),
    name_ar: String(body.name_ar ?? "").trim(),
    name_en: emptyToNull(body.name_en) as string | null,

    category: String(body.category ?? "general").trim(),

    entity_type: emptyToNull(body.entity_type) as string | null,
    section_id: emptyToNull(body.section_id) as string | null,

    path_segment: emptyToNull(body.path_segment) as string | null,

    is_required: Boolean(body.is_required ?? false),

    allowed_extensions: emptyToNull(body.allowed_extensions) as string | null,
    allowed_mime_types: emptyToNull(body.allowed_mime_types) as string | null,

    max_file_size_mb: optionalNumber(body.max_file_size_mb),

    min_width: optionalNumber(body.min_width),
    max_width: optionalNumber(body.max_width),
    min_height: optionalNumber(body.min_height),
    max_height: optionalNumber(body.max_height),

    is_image_required: Boolean(body.is_image_required ?? false),
    allow_multiple: Boolean(body.allow_multiple ?? false),

    naming_strategy: String(body.naming_strategy ?? "file_number").trim(),

    path_template: emptyToNull(body.path_template) as string | null,

    sort_order:
      body.sort_order === undefined ||
      body.sort_order === null ||
      body.sort_order === ""
        ? 0
        : Number(body.sort_order),

    is_active: Boolean(body.is_active ?? true),

    notes: emptyToNull(body.notes) as string | null,
  };
}

/**
 * التحقق من بيانات نوع المرفق
 */
function validateAttachmentTypePayload(
  data: ReturnType<typeof mapAttachmentTypePayload>
) {
  if (!data.code) {
    return "كود نوع المرفق مطلوب";
  }

  if (!/^[a-zA-Z0-9_]+$/.test(data.code)) {
    return "كود نوع المرفق يجب أن يحتوي على حروف إنجليزية أو أرقام أو شرطة سفلية فقط";
  }

  if (!data.name_ar) {
    return "اسم نوع المرفق بالعربية مطلوب";
  }

  if (!data.category) {
    return "تصنيف نوع المرفق مطلوب";
  }

  if (data.path_segment && !/^[a-zA-Z0-9_.-]+$/.test(data.path_segment)) {
    return "مجلد نوع المرفق يجب أن يحتوي على حروف إنجليزية أو أرقام أو شرطة أو نقطة أو شرطة سفلية فقط";
  }

  const numberFields = [
    ["max_file_size_mb", data.max_file_size_mb],
    ["min_width", data.min_width],
    ["max_width", data.max_width],
    ["min_height", data.min_height],
    ["max_height", data.max_height],
    ["sort_order", data.sort_order],
  ] as const;

  for (const [fieldName, value] of numberFields) {
    if (value !== null && !Number.isFinite(value)) {
      return `القيمة الرقمية غير صحيحة في الحقل ${fieldName}`;
    }
  }

  if (data.max_file_size_mb !== null && data.max_file_size_mb <= 0) {
    return "الحجم الأقصى يجب أن يكون أكبر من صفر";
  }

  if (
    data.min_width !== null &&
    data.max_width !== null &&
    data.min_width > data.max_width
  ) {
    return "الحد الأدنى للعرض لا يمكن أن يكون أكبر من الحد الأقصى";
  }

  if (
    data.min_height !== null &&
    data.max_height !== null &&
    data.min_height > data.max_height
  ) {
    return "الحد الأدنى للارتفاع لا يمكن أن يكون أكبر من الحد الأقصى";
  }

  const allowedNamingStrategies = [
    "file_number",
    "file_number_sequence",
    "file_number_timestamp",
    "original_name",
    "uuid",
  ];

  if (!allowedNamingStrategies.includes(data.naming_strategy)) {
    return "طريقة تسمية الملف غير صحيحة";
  }

  return null;
}

/**
 * GET /api/attachments/types
 * عرض أنواع المرفقات
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const includeInactive = searchParams.get("includeInactive") === "true";
    const entityType = searchParams.get("entity_type");
    const category = searchParams.get("category");
    const sectionId = searchParams.get("section_id");

    const where: any = {};

    if (!includeInactive) {
      where.is_active = true;
    }

    if (entityType) {
      where.OR = [{ entity_type: entityType }, { entity_type: "any" }];
    }

    if (category) {
      where.category = category;
    }

    if (sectionId) {
      where.section_id = sectionId;
    }

    const rows = await prisma.attachment_types.findMany({
      where,
      orderBy: [{ sort_order: "asc" }, { name_ar: "asc" }],
    });

    return ok(rows, "تم جلب أنواع المرفقات بنجاح");
  } catch (error: any) {
    console.error("GET /api/attachments/types error:", error);
    return fail("حدث خطأ أثناء جلب أنواع المرفقات", 500, error?.message);
  }
}

/**
 * POST /api/attachments/types
 * إضافة نوع مرفق جديد
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = mapAttachmentTypePayload(body);

    const validationError = validateAttachmentTypePayload(data);
    if (validationError) {
      return fail(validationError, 400);
    }

    const exists = await prisma.attachment_types.findUnique({
      where: {
        code: data.code,
      },
    });

    if (exists) {
      return fail("كود نوع المرفق موجود مسبقًا", 409);
    }

    if (data.section_id) {
      const section = await prisma.attachment_sections.findUnique({
        where: { id: data.section_id },
      });

      if (!section) {
        return fail("قسم المرفقات المحدد غير موجود", 404);
      }
    }

    const created = await prisma.attachment_types.create({
      data: {
        ...data,
        path_segment: data.path_segment || data.code,
      },
    });

    return ok(created, "تمت إضافة نوع المرفق بنجاح", 201);
  } catch (error: any) {
    console.error("POST /api/attachments/types error:", error);
    return fail("حدث خطأ أثناء إضافة نوع المرفق", 500, error?.message);
  }
}

/**
 * PUT /api/attachments/types
 * تعديل نوع مرفق
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.id) {
      return fail("معرف نوع المرفق مطلوب للتعديل", 400);
    }

    const id = String(body.id);

    const oldRow = await prisma.attachment_types.findUnique({
      where: { id },
    });

    if (!oldRow) {
      return fail("نوع المرفق غير موجود", 404);
    }

    const data = mapAttachmentTypePayload(body);

    const validationError = validateAttachmentTypePayload(data);
    if (validationError) {
      return fail(validationError, 400);
    }

    const codeExists = await prisma.attachment_types.findFirst({
      where: {
        code: data.code,
        NOT: {
          id,
        },
      },
    });

    if (codeExists) {
      return fail("كود نوع المرفق مستخدم في سجل آخر", 409);
    }

    if (data.section_id) {
      const section = await prisma.attachment_sections.findUnique({
        where: { id: data.section_id },
      });

      if (!section) {
        return fail("قسم المرفقات المحدد غير موجود", 404);
      }
    }

    const updated = await prisma.attachment_types.update({
      where: { id },
      data: {
        ...data,
        path_segment: data.path_segment || data.code,
        updated_at: new Date(),
      },
    });

    return ok(updated, "تم تعديل نوع المرفق بنجاح");
  } catch (error: any) {
    console.error("PUT /api/attachments/types error:", error);
    return fail("حدث خطأ أثناء تعديل نوع المرفق", 500, error?.message);
  }
}

/**
 * DELETE /api/attachments/types?id=...
 * تعطيل نوع مرفق بدل الحذف الفعلي
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return fail("معرف نوع المرفق مطلوب للحذف", 400);
    }

    const oldRow = await prisma.attachment_types.findUnique({
      where: { id },
    });

    if (!oldRow) {
      return fail("نوع المرفق غير موجود", 404);
    }

    const usedByGeneralAttachments = await prisma.entity_attachments.count({
      where: {
        attachment_type_id: id,
      },
    });

    const usedByBeneficiaryAttachments =
      await prisma.beneficiary_attachments.count({
        where: {
          attachment_type_id: id,
        },
      });

    const usedByPeriodicReportAttachments =
      await prisma.periodic_report_attachments.count({
        where: {
          attachment_type_id: id,
        },
      });

    const totalUsed =
      usedByGeneralAttachments +
      usedByBeneficiaryAttachments +
      usedByPeriodicReportAttachments;

    const disabled = await prisma.attachment_types.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    if (totalUsed > 0) {
      return ok(
        disabled,
        "تم تعطيل نوع المرفق لأنه مرتبط بمرفقات ولا يمكن حذفه نهائيًا"
      );
    }

    return ok(disabled, "تم تعطيل نوع المرفق بنجاح");
  } catch (error: any) {
    console.error("DELETE /api/attachments/types error:", error);
    return fail("حدث خطأ أثناء تعطيل نوع المرفق", 500, error?.message);
  }
}