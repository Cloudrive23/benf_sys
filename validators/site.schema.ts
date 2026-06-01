import { z } from "zod";

export const createSiteSchema = z.object({
  branch_id: z.string().uuid("الفرع مطلوب"),
  site_code: z.string().optional().or(z.literal("")),
  site_name_ar: z.string().min(2, "اسم الموقع مطلوب"),
  site_name_en: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const updateSiteSchema = createSiteSchema.extend({
  id: z.string().uuid("معرف الموقع غير صحيح"),
  site_code: z.string().min(1, "رقم الموقع مطلوب"),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;