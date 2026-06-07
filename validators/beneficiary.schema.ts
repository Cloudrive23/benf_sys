import { z } from "zod";

const relatedPersonSchema = z.object({
  full_name: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  identity_number: z.string().optional().or(z.literal("")),
});

export const createBeneficiarySchema = z.object({
  beneficiary_code: z.string().optional().or(z.literal("")),
  file_number: z.string().optional().or(z.literal("")),
  external_reference: z.string().optional().or(z.literal("")),

  branch_id: z.string().uuid("الفرع مطلوب"),
  site_id: z.string().uuid("الموقع مطلوب"),
  center_id: z.string().optional().or(z.literal("")),
  
  status_id: z.string().optional().or(z.literal("")),
  
  father_id: z.string().optional().or(z.literal("")),
  mother_id: z.string().optional().or(z.literal("")),
  guardian_id: z.string().optional().or(z.literal("")),

  alternative_phone: z.string().optional().or(z.literal("")),

  
  social_notes: z.string().optional().or(z.literal("")),

  first_name: z.string().min(1, "الاسم الأول مطلوب"),
  father_name: z.string().min(1, "اسم الأب مطلوب"),
  grandfather_name: z.string().optional().or(z.literal("")),
  family_name: z.string().min(1, "اللقب مطلوب"),

  gender: z.enum(["male", "female"]),
  birth_date: z.string().optional().or(z.literal("")),
  identity_type: z.string().optional().or(z.literal("")),
  identity_number: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
address: z.string().optional().or(z.literal("")),

  beneficiary_type: z.string().optional(),
  current_status: z.string().optional(),
  is_active: z.boolean().optional(),

  father: relatedPersonSchema.optional(),
  mother: relatedPersonSchema.optional(),
  guardian: relatedPersonSchema.optional(),
  allow_duplicate: z.boolean().optional(),
});

export const updateBeneficiarySchema = createBeneficiarySchema.extend({
  id: z.string().uuid(),
  beneficiary_code: z.string().min(1),
  file_number: z.string().min(1),
});

export type CreateBeneficiaryInput = z.infer<typeof createBeneficiarySchema>;
export type UpdateBeneficiaryInput = z.infer<typeof updateBeneficiarySchema>;
