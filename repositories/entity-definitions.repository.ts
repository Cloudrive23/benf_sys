import { prisma } from "@/app/lib/prisma";

export const entityDefinitionsRepository = {
  findAll() {
    return prisma.entity_definitions.findMany({
      include: {
        fields: {
          orderBy: {
            sort_order: "asc",
          },
        },
      },
      orderBy: {
        label_ar: "asc",
      },
    });
  },

  findByKey(entityKey: string) {
    return prisma.entity_definitions.findUnique({
      where: {
        entity_key: entityKey,
      },
      include: {
        fields: {
          where: {
            is_active: true,
          },
          orderBy: {
            sort_order: "asc",
          },
        },
      },
    });
  },

  findById(id: string) {
    return prisma.entity_definitions.findUnique({
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

  create(data: any) {
    return prisma.entity_definitions.create({
      data,
    });
  },

  update(id: string, data: any) {
    return prisma.entity_definitions.update({
      where: { id },
      data,
    });
  },

  createField(data: any) {
    return prisma.entity_field_definitions.create({
      data,
    });
  },

  updateField(id: string, data: any) {
    return prisma.entity_field_definitions.update({
      where: { id },
      data,
    });
  },

  setEntityActive(id: string, isActive: boolean) {
    return prisma.entity_definitions.update({
      where: { id },
      data: {
        is_active: isActive,
        updated_at: new Date(),
      },
    });
  },

  setFieldActive(id: string, isActive: boolean) {
    return prisma.entity_field_definitions.update({
      where: { id },
      data: {
        is_active: isActive,
        updated_at: new Date(),
      },
    });
  },
};