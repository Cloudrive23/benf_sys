import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await prisma.beneficiary_custom_fields.findMany({
      include: {
        group: {
          include: {
            tab: true,
          },
        },
      },
      orderBy: [
        { sort_order: "asc" }
      ],
    });

    return successResponse(data, "تم تحميل الحقول");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { id, group, ...clean } = body;

    const data = await prisma.beneficiary_custom_fields.create({
      data: {
        group_id: clean.group_id,
        field_code: clean.field_code,
        field_label_ar: clean.field_label_ar,
        field_label_en: clean.field_label_en || null,
        field_type: String(clean.field_type || "text").toLowerCase(),
        lookup_type: clean.lookup_type || null,
		lookup_type_id: clean.lookup_type_id || null,
        placeholder_ar: clean.placeholder_ar || null,
        placeholder_en: clean.placeholder_en || null,
        help_text_ar: clean.help_text_ar || null,
        help_text_en: clean.help_text_en || null,
        is_required: clean.is_required ?? false,
        sort_order: Number(clean.sort_order || 0),
        is_active: clean.is_active ?? true,default_value: clean.default_value || null,
		is_readonly: clean.is_readonly ?? false,
		min_value: clean.min_value ? Number(clean.min_value) : null,
		max_value: clean.max_value ? Number(clean.max_value) : null,
		min_length: clean.min_length ? Number(clean.min_length) : null,
		max_length: clean.max_length ? Number(clean.max_length) : null,
		validation_pattern: clean.validation_pattern || null,
		
      },
    });

    return successResponse(data, "تمت إضافة الحقل");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const { id, group, ...clean } = body;

    const data = await prisma.beneficiary_custom_fields.update({
      where: { id },
      data: {
        group_id: clean.group_id,
        field_code: clean.field_code,
        field_label_ar: clean.field_label_ar,
        field_label_en: clean.field_label_en || null,
        field_type: String(clean.field_type || "text").toLowerCase(),
        lookup_type: clean.lookup_type || null,
		lookup_type_id: clean.lookup_type_id || null,
        placeholder_ar: clean.placeholder_ar || null,
        placeholder_en: clean.placeholder_en || null,
        help_text_ar: clean.help_text_ar || null,
        help_text_en: clean.help_text_en || null,
        is_required: clean.is_required ?? false,
        sort_order: Number(clean.sort_order || 0),
        is_active: clean.is_active ?? true,
        updated_at: new Date(),
		default_value: clean.default_value || null,
		is_readonly: clean.is_readonly ?? false,
		min_value: clean.min_value ? Number(clean.min_value) : null,
		max_value: clean.max_value ? Number(clean.max_value) : null,
		min_length: clean.min_length ? Number(clean.min_length) : null,
		max_length: clean.max_length ? Number(clean.max_length) : null,
		validation_pattern: clean.validation_pattern || null,
      },
    });

    return successResponse(data, "تم تعديل الحقل");
  } catch (error) {
    return handleApiError(error);
  }
}