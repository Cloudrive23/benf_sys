import { z } from "zod";

export const createCenterSchema = z.object({
  branch_id: z.string().uuid("الفرع مطلوب"),
  site_id: z.string().uuid("الموقع مطلوب"),
  center_code: z.string().optional().or(z.literal("")),
  center_name_ar: z.string().min(2, "اسم المركز مطلوب"),
  center_name_en: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const updateCenterSchema = createCenterSchema.extend({
  id: z.string().uuid("معرف المركز غير صحيح"),
  center_code: z.string().min(1, "رقم المركز مطلوب"),
});

export type CreateCenterInput = z.infer<typeof createCenterSchema>;
export type UpdateCenterInput = z.infer<typeof updateCenterSchema>;