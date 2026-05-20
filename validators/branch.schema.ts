import { z } from "zod";

export const createBranchSchema = z.object({
  branch_code: z.string().optional().or(z.literal("")),
  branch_name_ar: z.string().min(2, "اسم الفرع مطلوب"),
  branch_name_en: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

export const updateBranchSchema = createBranchSchema.extend({
  id: z.string().uuid("معرف الفرع غير صحيح"),
  branch_code: z.string().min(1, "رقم الفرع مطلوب"),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;
