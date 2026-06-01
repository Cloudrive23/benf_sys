import { z } from "zod";

export const createLookupSchema = z.object({
  lookup_type: z.string().min(2),
  code: z.string().optional().or(z.literal("")),
  name_ar: z.string().min(2, "الاسم العربي مطلوب"),
  name_en: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  sort_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

export const updateLookupSchema = createLookupSchema.extend({
  id: z.string().uuid(),
});

export type CreateLookupInput = z.infer<typeof createLookupSchema>;
export type UpdateLookupInput = z.infer<typeof updateLookupSchema>;