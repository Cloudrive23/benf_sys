import { prisma } from "@/app/lib/prisma";

export const rolesRepository = {
  findAll() {
    return prisma.roles.findMany({
      include: {
        role_permissions: {
          include: {
            permissions: {
              include: {
                system_modules: true,
              },
            },
          },
          orderBy: {
            created_at: "asc",
          },
        },
        user_roles: {
          include: {
            users: {
              select: {
                id: true,
                username: true,
                full_name: true,
                email: true,
                is_active: true,
              },
            },
          },
          orderBy: {
            created_at: "asc",
          },
        },
        _count: {
          select: {
            role_permissions: true,
            user_roles: true,
          },
        },
      },
      orderBy: [
        { role_code: "asc" },
        { role_name_ar: "asc" },
      ],
    });
  },

  findById(id: string) {
    return prisma.roles.findUnique({
      where: { id },
      include: {
        role_permissions: true,
        user_roles: true,
      },
    });
  },

  findByCode(role_code: string) {
    return prisma.roles.findUnique({
      where: { role_code },
    });
  },

  create(data: any) {
    return prisma.roles.create({ data });
  },

  update(id: string, data: any) {
    return prisma.roles.update({
      where: { id },
      data,
    });
  },

  softDelete(id: string) {
    return prisma.roles.update({
      where: { id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  },

  async replaceRolePermissions(roleId: string, permissionIds: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.role_permissions.deleteMany({
        where: { role_id: roleId },
      });

      if (permissionIds.length > 0) {
        await tx.role_permissions.createMany({
          data: permissionIds.map((permissionId) => ({
            role_id: roleId,
            permission_id: permissionId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.roles.findUnique({
        where: { id: roleId },
        include: {
          role_permissions: true,
          user_roles: true,
        },
      });
    });
  },

  addUserToRole(roleId: string, userId: string) {
    return prisma.user_roles.upsert({
      where: {
        user_id_role_id: {
          user_id: userId,
          role_id: roleId,
        },
      },
      update: {},
      create: {
        user_id: userId,
        role_id: roleId,
      },
    });
  },

  removeUserFromRole(roleId: string, userId: string) {
    return prisma.user_roles.delete({
      where: {
        user_id_role_id: {
          user_id: userId,
          role_id: roleId,
        },
      },
    });
  },

  listModulesWithPermissions() {
    return prisma.system_modules.findMany({
      where: { is_active: true },
      include: {
        permissions: {
          where: { is_active: true },
          orderBy: [
            { action_code: "asc" },
            { permission_code: "asc" },
          ],
        },
      },
      orderBy: [
        { sort_order: "asc" },
        { module_code: "asc" },
      ],
    });
  },

  listActiveUsers() {
    return prisma.users.findMany({
      where: { is_active: true },
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        is_active: true,
      },
      orderBy: [
        { full_name: "asc" },
        { username: "asc" },
      ],
    });
  },

  listPermissionsByIds(permissionIds: string[]) {
    return prisma.permissions.findMany({
      where: {
        id: { in: permissionIds },
        is_active: true,
      },
      select: { id: true },
    });
  },

  findUserById(userId: string) {
    return prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, username: true, full_name: true, is_active: true },
    });
  },
};
