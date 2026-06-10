import { prisma } from "@/app/lib/prisma";

export const userPermissionsRepository = {
  listActiveUsers() {
    return prisma.$queryRaw<any[]>`
      select
        u.id,
        u.username,
        u.full_name,
        u.email,
        u.is_active,
        coalesce(
          json_agg(
            distinct jsonb_build_object(
              'id', r.id,
              'role_code', r.role_code,
              'role_name_ar', r.role_name_ar
            )
          ) filter (where r.id is not null),
          '[]'
        ) as roles
      from users u
      left join user_roles ur on ur.user_id = u.id
      left join roles r on r.id = ur.role_id and r.is_active = true
      where u.is_active = true
      group by u.id, u.username, u.full_name, u.email, u.is_active
      order by u.full_name asc, u.username asc
    `;
  },

  listModulesWithPermissions() {
    return prisma.$queryRaw<any[]>`
      select
        m.id as module_id,
        m.module_code,
        m.module_name_ar,
        m.module_name_en,
        m.route_path,
        m.sort_order,
        p.id as permission_id,
        p.permission_code,
        p.permission_name_ar,
        p.permission_name_en,
        p.action_code,
        p.description
      from system_modules m
      join permissions p on p.module_id = m.id
      where m.is_active = true
        and p.is_active = true
      order by m.sort_order asc, m.module_code asc, p.permission_code asc
    `;
  },

  findUser(userId: string) {
    return prisma.$queryRaw<any[]>`
      select
        u.id,
        u.username,
        u.full_name,
        u.email,
        u.is_active,
        coalesce(
          json_agg(
            distinct jsonb_build_object(
              'id', r.id,
              'role_code', r.role_code,
              'role_name_ar', r.role_name_ar
            )
          ) filter (where r.id is not null),
          '[]'
        ) as roles
      from users u
      left join user_roles ur on ur.user_id = u.id
      left join roles r on r.id = ur.role_id and r.is_active = true
      where u.id = ${userId}::uuid
      group by u.id, u.username, u.full_name, u.email, u.is_active
      limit 1
    `;
  },

  listInheritedPermissions(userId: string) {
    return prisma.$queryRaw<any[]>`
      select
        p.id as permission_id,
        p.permission_code,
        p.permission_name_ar,
        p.action_code,
        m.module_code,
        m.module_name_ar,
        r.id as role_id,
        r.role_code,
        r.role_name_ar
      from user_roles ur
      join roles r on r.id = ur.role_id and r.is_active = true
      join role_permissions rp on rp.role_id = r.id
      join permissions p on p.id = rp.permission_id and p.is_active = true
      left join system_modules m on m.id = p.module_id
      where ur.user_id = ${userId}::uuid
      order by m.sort_order asc, p.permission_code asc, r.role_name_ar asc
    `;
  },

  listOverrides(userId: string) {
    return prisma.$queryRaw<any[]>`
      select
        upo.id,
        upo.user_id,
        upo.permission_id,
        upo.effect,
        upo.reason,
        upo.created_by,
        upo.created_at,
        upo.updated_at,
        p.permission_code,
        p.permission_name_ar,
        p.action_code,
        m.module_code,
        m.module_name_ar
      from user_permission_overrides upo
      join permissions p on p.id = upo.permission_id
      left join system_modules m on m.id = p.module_id
      where upo.user_id = ${userId}::uuid
      order by m.sort_order asc, p.permission_code asc
    `;
  },

  async upsertOverride(data: {
    userId: string;
    permissionId: string;
    effect: "allow" | "deny";
    reason: string | null;
    createdBy?: string | null;
  }) {
    await prisma.$executeRaw`
      insert into user_permission_overrides (
        user_id,
        permission_id,
        effect,
        reason,
        created_by,
        created_at,
        updated_at
      )
      values (
        ${data.userId}::uuid,
        ${data.permissionId}::uuid,
        ${data.effect},
        ${data.reason},
        ${data.createdBy || null}::uuid,
        now(),
        now()
      )
      on conflict (user_id, permission_id) do update
      set
        effect = excluded.effect,
        reason = excluded.reason,
        updated_at = now()
    `;

    return this.listOverrides(data.userId);
  },

  async deleteOverride(userId: string, permissionId: string) {
    await prisma.$executeRaw`
      delete from user_permission_overrides
      where user_id = ${userId}::uuid
        and permission_id = ${permissionId}::uuid
    `;

    return this.listOverrides(userId);
  },

  async permissionExists(permissionId: string) {
    const rows = await prisma.$queryRaw<any[]>`
      select id
      from permissions
      where id = ${permissionId}::uuid
        and is_active = true
      limit 1
    `;

    return rows.length > 0;
  },
};
