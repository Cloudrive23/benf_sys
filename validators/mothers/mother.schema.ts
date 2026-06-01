import { z } from "zod";

export const createMotherSchema = z.object({
  branch_id: z.string().uuid("الفرع مطلوب"),

  full_name_ar: z.string().min(3, "اسم الأم مطلوب"),
  full_name_en: z.string().optional().or(z.literal("")),

  identity_number: z.string().optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),
  death_date: z.string().optional().or(z.literal("")),

  death_reason_id: z.string().optional().or(z.literal("")),
  marital_status_id: z.string().optional().or(z.literal("")),
  gender_id: z.string().optional().or(z.literal("")),
  occupation_id: z.string().optional().or(z.literal("")),
  nationality_id: z.string().optional().or(z.literal("")),
  health_status_id: z.string().optional().or(z.literal("")),

  is_guardian: z.boolean().optional(),
  is_alive: z.boolean().optional(),

  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const updateMotherSchema = createMotherSchema.extend({
  id: z.string().uuid("معرف الأم غير صحيح"),
});

export type CreateMotherInput = z.infer<typeof createMotherSchema>;
export type UpdateMotherInput = z.infer<typeof updateMotherSchema>;