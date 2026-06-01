import { z } from "zod";

export const createFatherSchema = z.object({
  branch_id: z.string().uuid("الفرع مطلوب"),

  full_name_ar: z.string().min(3, "اسم الأب مطلوب"),
  full_name_en: z.string().optional().or(z.literal("")),

  identity_number: z.string().optional().or(z.literal("")),

  birth_date: z.string().optional().or(z.literal("")),
  death_date: z.string().optional().or(z.literal("")),

  death_reason_id: z.string().optional().or(z.literal("")),

  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  occupation: z.string().optional().or(z.literal("")),
  occupation_id: z.string().optional().or(z.literal("")),
  
  notes: z.string().optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const updateFatherSchema = createFatherSchema.extend({
  id: z.string().uuid("معرف الأب غير صحيح"),
});

export type CreateFatherInput = z.infer<typeof createFatherSchema>;
export type UpdateFatherInput = z.infer<typeof updateFatherSchema>;