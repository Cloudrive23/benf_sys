import { prisma } from "@/app/lib/prisma";

export const duplicateRulesRepository = {
  findActiveRulesByEntityKey(entityKey: string) {
    return prisma.duplicate_rules.findMany({
      where: {
        entity_key: entityKey,
        is_active: true,
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
      orderBy: {
        created_at: "asc",
      },
    });
  },

  findAll() {
    return prisma.duplicate_rules.findMany({
      include: {
        fields: {
          orderBy: {
            sort_order: "asc",
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.duplicate_rules.findUnique({
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

  createRule(data: any) {
    return prisma.duplicate_rules.create({
      data,
    });
  },

  updateRule(id: string, data: any) {
    return prisma.duplicate_rules.update({
      where: { id },
      data,
    });
  },

  disableRule(id: string) {
    return prisma.duplicate_rules.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  },

  createField(data: any) {
    return prisma.duplicate_rule_fields.create({
      data,
    });
  },

  updateField(id: string, data: any) {
    return prisma.duplicate_rule_fields.update({
      where: { id },
      data,
    });
  },

  disableField(id: string) {
    return prisma.duplicate_rule_fields.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  },
  
	setRuleActive(id: string, isActive: boolean) {
		  return prisma.duplicate_rules.update({
			where: { id },
			data: {
			  is_active: isActive,
			  updated_at: new Date(),
			},
		  });
		},

	setFieldActive(id: string, isActive: boolean) {
		  return prisma.duplicate_rule_fields.update({
			where: { id },
			data: {
			  is_active: isActive,
			  updated_at: new Date(),
			},
		  });
		},
};