import { prisma } from "@/app/lib/prisma";

export const databaseConstraintMessagesRepository = {
  findActiveMessage(input: {
    tableName: string;
    fieldName: string;
    constraintType: string;
  }) {
    return prisma.database_constraint_messages.findFirst({
      where: {
        table_name: input.tableName,
        field_name: input.fieldName,
        constraint_type: input.constraintType,
        is_active: true,
      },
    });
  },

  findAll() {
    return prisma.database_constraint_messages.findMany({
      orderBy: {
        created_at: "desc",
      },
    });
  },

  findById(id: string) {
    return prisma.database_constraint_messages.findUnique({
      where: { id },
    });
  },

  create(data: any) {
    return prisma.database_constraint_messages.create({
      data,
    });
  },

  update(id: string, data: any) {
    return prisma.database_constraint_messages.update({
      where: { id },
      data,
    });
  },

  setActive(id: string, isActive: boolean) {
    return prisma.database_constraint_messages.update({
      where: { id },
      data: {
        is_active: isActive,
        updated_at: new Date(),
      },
    });
  },
};