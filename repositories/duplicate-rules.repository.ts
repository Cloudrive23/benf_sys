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
};