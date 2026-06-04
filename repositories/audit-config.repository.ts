import { prisma } from "@/app/lib/prisma";

export const auditConfigRepository = {
  async findByEntityKey(entityKey: string) {
    const entity = await prisma.audit_entities.findFirst({
      where: {
        entity_key: entityKey,
        is_active: true,
      },
      include: {
        fields: {
          where: {
            is_active: true,
            is_tracked: true,
          },
          orderBy: {
            sort_order: "asc",
          },
        },
      },
    });

    if (!entity) return null;

    return {
      entityName: entity.entity_name,
      entityType: entity.entity_type,
      label: entity.label_ar,
      displayNameField: entity.display_name_field || undefined,
      fields: Object.fromEntries(
        entity.fields.map((field) => [
          field.field_name,
          field.field_label_ar,
        ])
      ),
      fieldConfigs: entity.fields.map((field) => ({
        fieldName: field.field_name,
        fieldLabelAr: field.field_label_ar,
        isLookup: Boolean(field.is_lookup),
        lookupType: field.lookup_type,
      })),
    };
  },
};