import { prisma } from "@/app/lib/prisma";

export const auditSettingsRepository = {
  findAll() {
    return prisma.audit_entities.findMany({
      orderBy: {
        created_at: "desc",
      },
      include: {
        fields: {
          orderBy: {
            sort_order: "asc",
          },
        },
      },
    });
  },

  findEntityById(id: string) {
    return prisma.audit_entities.findUnique({
      where: { id },
      include: {
        fields: {
          orderBy: {
            sort_order: "asc",
          },
        },
      },
    });
  },

  findEntityByKey(entityKey: string) {
    return prisma.audit_entities.findUnique({
      where: {
        entity_key: entityKey,
      },
    });
  },

  createEntity(data: any) {
    return prisma.audit_entities.create({
      data,
    });
  },

  updateEntity(id: string, data: any) {
    return prisma.audit_entities.update({
      where: { id },
      data,
    });
  },

  disableEntity(id: string) {
    return prisma.audit_entities.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  },

  createField(data: any) {
    return prisma.audit_entity_fields.create({
      data,
    });
  },

  updateField(id: string, data: any) {
    return prisma.audit_entity_fields.update({
      where: { id },
      data,
    });
  },

  disableField(id: string) {
    return prisma.audit_entity_fields.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  },

  deleteField(id: string) {
    return prisma.audit_entity_fields.delete({
      where: { id },
    });
  },

	findFieldByEntityAndName(entityId: string, fieldName: string) {
			return prisma.audit_entity_fields.findFirst({
			  where: {
				entity_id: entityId,
				field_name: fieldName,
			  },
			});
		  },

		  async createManyFields(fields: any[]) {
			if (fields.length === 0) return { count: 0 };

			return prisma.audit_entity_fields.createMany({
			  data: fields,
			  skipDuplicates: true,
			});
		  },
};