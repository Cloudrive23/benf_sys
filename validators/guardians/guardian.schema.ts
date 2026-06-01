import { z } from "zod";

export const createGuardianSchema = z.object({
  branch_id: z.string().uuid("????? ?????"),

  full_name_ar: z.string().min(3, "??? ?????? ?????"),
  full_name_en: z.string().optional().or(z.literal("")),

  identity_number: z.string().optional().or(z.literal("")),
  birth_date: z.string().optional().or(z.literal("")),

  gender_id: z.string().optional().or(z.literal("")),
  relationship_type_id: z.string().optional().or(z.literal("")),
  marital_status_id: z.string().optional().or(z.literal("")),
  occupation_id: z.string().optional().or(z.literal("")),
  nationality_id: z.string().optional().or(z.literal("")),
  health_status_id: z.string().optional().or(z.literal("")),

  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),

  is_mother: z.boolean().optional(),
  mother_id: z.string().optional().or(z.literal("")),

  is_active: z.boolean().optional(),
});

export const updateGuardianSchema = createGuardianSchema.extend({
  id: z.string().uuid("???? ?????? ??? ????"),
});

export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
export type UpdateGuardianInput = z.infer<typeof updateGuardianSchema>;