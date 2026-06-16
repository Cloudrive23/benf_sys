import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { getCurrentUserRecord, type CurrentUser } from "@/lib/auth";

type PermissionSource = "role" | "direct_allow" | "direct_deny" | "super_admin";

type RolePermissionRow = {
  permission_id: string;
  permission_code: string;
  permission_name_ar: string | null;
  permission_name_en: string | null;
  action_code: string | null;
  module_code: string | null;
  module_name_ar: string | null;
  source_role_code: string | null;
  source_role_name_ar: string | null;
};

type OverridePermissionRow = {
  permission_id: string;
  permission_code: string;
  permission_name_ar: string | null;
  permission_name_en: string | null;
  action_code: string | null;
  module_code: string | null;
  module_name_ar: string | null;
  effect: "allow" | "deny";
  reason: string | null;
};

type PermissionCatalogRow = {
  permission_id: string;
  permission_code: string;
  permission_name_ar: string | null;
  permission_name_en: string | null;
  action_code: string | null;
  module_code: string | null;
  module_name_ar: string | null;
};

export type EffectivePermission = {
  permission_id: string;
  permission_code: string;
  permission_name_ar: string | null;
  permission_name_en: string | null;
  action_code: string | null;
  module_code: string | null;
  module_name_ar: string | null;
  allowed: boolean;
  source: PermissionSource;
  source_role_code?: string | null;
  source_role_name_ar?: string | null;
  reason?: string | null;
};

export async function isSuperAdminUser(userId?: string | null): Promise<boolean> {
  if (!userId) return false;

  const rows = await prisma.$queryRaw<{ is_super_admin: boolean }[]>`
    select coalesce(is_super_admin, false) as is_super_admin
    from users
    where id = ${userId}::uuid
    limit 1
  `;

  return rows[0]?.is_super_admin === true;
}

export async function markSuperAdmins<T extends Record<string, any>>(
  users: T[],
  idField = "id"
): Promise<T[]> {
  if (!Array.isArray(users) || users.length === 0) return users;

  const ids = users
    .map((user) => String(user?.[idField] || "").trim())
    .filter(Boolean);

  if (ids.length === 0) return users;

  const rows = await prisma.$queryRaw<{ id: string; is_super_admin: boolean }[]>`
    select id, coalesce(is_super_admin, false) as is_super_admin
    from users
    where id = any(${ids}::uuid[])
  `;

  const map = new Map(rows.map((row) => [row.id, row.is_super_admin]));

  return users.map((user) => ({
    ...user,
    is_super_admin: map.get(String(user?.[idField])) === true,
  }));
}

export async function getSuperAdminUserIds(): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    select id
    from users
    where coalesce(is_super_admin, false) = true
  `;

  return new Set(rows.map((row) => row.id));
}

async function getAllPermissionsForSuperAdmin(): Promise<EffectivePermission[]> {
  const rows = await prisma.$queryRaw<PermissionCatalogRow[]>`
    select
      p.id as permission_id,
      p.permission_code,
      p.permission_name_ar,
      p.permission_name_en,
      p.action_code,
      m.module_code,
      m.module_name_ar
    from permissions p
    left join system_modules m on m.id = p.module_id
    where p.is_active = true
    order by m.sort_order asc nulls last, m.module_code asc nulls last, p.permission_code asc
  `;

  return rows.map((permission) => ({
    permission_id: permission.permission_id,
    permission_code: permission.permission_code,
    permission_name_ar: permission.permission_name_ar,
    permission_name_en: permission.permission_name_en,
    action_code: permission.action_code,
    module_code: permission.module_code,
    module_name_ar: permission.module_name_ar,
    allowed: true,
    source: "super_admin",
    source_role_code: "super_admin",
    source_role_name_ar: "مدير النظام المبرمج",
    reason: "صلاحية تلقائية لمدير النظام المبرمج ولا يمكن سحبها من النظام",
  }));
}

export async function getUserEffectivePermissions(
  userId: string
): Promise<EffectivePermission[]> {
  if (await isSuperAdminUser(userId)) {
    return getAllPermissionsForSuperAdmin();
  }

  const rolePermissions = await prisma.$queryRaw<RolePermissionRow[]>`
    select distinct
      p.id as permission_id,
      p.permission_code,
      p.permission_name_ar,
      p.permission_name_en,
      p.action_code,
      m.module_code,
      m.module_name_ar,
      r.role_code as source_role_code,
      r.role_name_ar as source_role_name_ar
    from user_roles ur
    join roles r on r.id = ur.role_id and r.is_active = true
    join role_permissions rp on rp.role_id = r.id
    join permissions p on p.id = rp.permission_id and p.is_active = true
    left join system_modules m on m.id = p.module_id
    where ur.user_id = ${userId}::uuid
    order by m.module_code, p.permission_code
  `;

  const overrides = await prisma.$queryRaw<OverridePermissionRow[]>`
    select
      p.id as permission_id,
      p.permission_code,
      p.permission_name_ar,
      p.permission_name_en,
      p.action_code,
      m.module_code,
      m.module_name_ar,
      upo.effect,
      upo.reason
    from user_permission_overrides upo
    join permissions p on p.id = upo.permission_id and p.is_active = true
    left join system_modules m on m.id = p.module_id
    where upo.user_id = ${userId}::uuid
    order by m.module_code, p.permission_code
  `;

  const map = new Map<string, EffectivePermission>();

  for (const permission of rolePermissions) {
    if (!map.has(permission.permission_code)) {
      map.set(permission.permission_code, {
        permission_id: permission.permission_id,
        permission_code: permission.permission_code,
        permission_name_ar: permission.permission_name_ar,
        permission_name_en: permission.permission_name_en,
        action_code: permission.action_code,
        module_code: permission.module_code,
        module_name_ar: permission.module_name_ar,
        allowed: true,
        source: "role",
        source_role_code: permission.source_role_code,
        source_role_name_ar: permission.source_role_name_ar,
      });
    }
  }

  for (const permission of overrides) {
    map.set(permission.permission_code, {
      permission_id: permission.permission_id,
      permission_code: permission.permission_code,
      permission_name_ar: permission.permission_name_ar,
      permission_name_en: permission.permission_name_en,
      action_code: permission.action_code,
      module_code: permission.module_code,
      module_name_ar: permission.module_name_ar,
      allowed: permission.effect === "allow",
      source: permission.effect === "allow" ? "direct_allow" : "direct_deny",
      reason: permission.reason,
    });
  }

  return Array.from(map.values()).sort((a, b) =>
    a.permission_code.localeCompare(b.permission_code)
  );
}

export async function hasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  if (await isSuperAdminUser(userId)) {
    return true;
  }

  const directOverrides = await prisma.$queryRaw<{ effect: "allow" | "deny" }[]>`
    select upo.effect
    from user_permission_overrides upo
    join permissions p on p.id = upo.permission_id and p.is_active = true
    where upo.user_id = ${userId}::uuid
      and p.permission_code = ${permissionCode}
    limit 1
  `;

  if (directOverrides[0]?.effect === "deny") {
    return false;
  }

  if (directOverrides[0]?.effect === "allow") {
    return true;
  }

  const rolePermissions = await prisma.$queryRaw<{ exists: boolean }[]>`
    select exists (
      select 1
      from user_roles ur
      join roles r on r.id = ur.role_id and r.is_active = true
      join role_permissions rp on rp.role_id = r.id
      join permissions p on p.id = rp.permission_id and p.is_active = true
      where ur.user_id = ${userId}::uuid
        and p.permission_code = ${permissionCode}
    ) as exists
  `;

  return Boolean(rolePermissions[0]?.exists);
}

export async function getCurrentUserPermissions(): Promise<EffectivePermission[]> {
  const user = await getCurrentUserRecord();

  if (!user) {
    return [];
  }

  return getUserEffectivePermissions(user.id);
}

export async function requirePermission(permissionCode: string): Promise<{
  ok: boolean;
  user: CurrentUser | null;
  response?: NextResponse;
}> {
  const user = await getCurrentUserRecord();

  if (!user) {
    return {
      ok: false,
      user: null,
      response: NextResponse.json(
        { success: false, message: "غير مصرح بالدخول" },
        { status: 401 }
      ),
    };
  }

  if (user.is_super_admin) {
    return {
      ok: true,
      user,
    };
  }

  const allowed = await hasPermission(user.id, permissionCode);

  if (!allowed) {
    return {
      ok: false,
      user,
      response: NextResponse.json(
        { success: false, message: "ليست لديك الصلاحية المطلوبة" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    user,
  };
}
