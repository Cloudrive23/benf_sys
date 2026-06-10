import { AppError } from "@/lib/api-error";
import { userPermissionsRepository } from "@/repositories/user-permissions.repository";

function cleanText(value: any) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeJsonArray(value: any) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    return JSON.parse(String(value));
  } catch {
    return [];
  }
}

function groupModules(rows: any[]) {
  const map = new Map<string, any>();

  for (const row of rows) {
    if (!map.has(row.module_id)) {
      map.set(row.module_id, {
        id: row.module_id,
        module_code: row.module_code,
        module_name_ar: row.module_name_ar,
        module_name_en: row.module_name_en,
        route_path: row.route_path,
        sort_order: row.sort_order,
        permissions: [],
      });
    }

    map.get(row.module_id).permissions.push({
      id: row.permission_id,
      permission_code: row.permission_code,
      permission_name_ar: row.permission_name_ar,
      permission_name_en: row.permission_name_en,
      action_code: row.action_code,
      description: row.description,
    });
  }

  return Array.from(map.values());
}

function buildMatrix(modules: any[], inheritedRows: any[], overrideRows: any[]) {
  const inheritedMap = new Map<string, any[]>();
  const overrideMap = new Map<string, any>();

  for (const item of inheritedRows) {
    const list = inheritedMap.get(item.permission_id) || [];
    list.push({
      id: item.role_id,
      role_code: item.role_code,
      role_name_ar: item.role_name_ar,
    });
    inheritedMap.set(item.permission_id, list);
  }

  for (const item of overrideRows) {
    overrideMap.set(item.permission_id, {
      id: item.id,
      effect: item.effect,
      reason: item.reason,
      created_at: item.created_at,
      updated_at: item.updated_at,
    });
  }

  let allowedCount = 0;
  let inheritedCount = 0;
  let directAllowCount = 0;
  let directDenyCount = 0;
  let deniedCount = 0;

  const matrix = modules.map((module) => ({
    ...module,
    permissions: module.permissions.map((permission: any) => {
      const inherited_roles = inheritedMap.get(permission.id) || [];
      const override = overrideMap.get(permission.id) || null;

      const inherited = inherited_roles.length > 0;
      const is_direct_allow = override?.effect === "allow";
      const is_direct_deny = override?.effect === "deny";
      const is_allowed = is_direct_deny ? false : is_direct_allow ? true : inherited;

      if (is_allowed) allowedCount += 1;
      if (inherited) inheritedCount += 1;
      if (is_direct_allow) directAllowCount += 1;
      if (is_direct_deny) directDenyCount += 1;
      if (!is_allowed) deniedCount += 1;

      return {
        ...permission,
        inherited,
        inherited_roles,
        override,
        is_allowed,
        source: is_direct_deny
          ? "direct_deny"
          : is_direct_allow
            ? "direct_allow"
            : inherited
              ? "role"
              : "none",
      };
    }),
  }));

  return {
    modules: matrix,
    summary: {
      total_permissions: modules.reduce((sum, module) => sum + module.permissions.length, 0),
      allowed_permissions: allowedCount,
      denied_permissions: deniedCount,
      inherited_permissions: inheritedCount,
      direct_allow: directAllowCount,
      direct_deny: directDenyCount,
    },
  };
}

export const userPermissionsService = {
  async loadPageData(userId?: string | null) {
    const [usersRaw, moduleRows] = await Promise.all([
      userPermissionsRepository.listActiveUsers(),
      userPermissionsRepository.listModulesWithPermissions(),
    ]);

    const users = usersRaw.map((user) => ({
      ...user,
      roles: normalizeJsonArray(user.roles),
    }));

    const modules = groupModules(moduleRows);
    const selectedUserId = cleanText(userId) || users[0]?.id || null;

    if (!selectedUserId) {
      return {
        users,
        selected_user: null,
        modules,
        permission_modules: modules,
        overrides: [],
        summary: {
          total_permissions: modules.reduce((sum, module) => sum + module.permissions.length, 0),
          allowed_permissions: 0,
          denied_permissions: 0,
          inherited_permissions: 0,
          direct_allow: 0,
          direct_deny: 0,
        },
      };
    }

    const [userRows, inheritedRows, overrides] = await Promise.all([
      userPermissionsRepository.findUser(selectedUserId),
      userPermissionsRepository.listInheritedPermissions(selectedUserId),
      userPermissionsRepository.listOverrides(selectedUserId),
    ]);

    if (!userRows.length) {
      throw new AppError("المستخدم غير موجود", 404);
    }

    const selectedUser = {
      ...userRows[0],
      roles: normalizeJsonArray(userRows[0].roles),
    };

    const matrix = buildMatrix(modules, inheritedRows, overrides);

    return {
      users,
      selected_user: selectedUser,
      modules,
      permission_modules: matrix.modules,
      overrides,
      summary: matrix.summary,
    };
  },

  async setOverride(data: any) {
    const userId = cleanText(data.user_id);
    const permissionId = cleanText(data.permission_id);
    const effect = cleanText(data.effect);
    const reason = cleanText(data.reason);
    const createdBy = cleanText(data.created_by);

    if (!userId || !permissionId) {
      throw new AppError("معرف المستخدم ومعرف الصلاحية مطلوبان", 400);
    }

    if (effect !== "allow" && effect !== "deny") {
      throw new AppError("نوع الاستثناء غير صحيح", 400);
    }

    const userRows = await userPermissionsRepository.findUser(userId);
    if (!userRows.length || userRows[0].is_active === false) {
      throw new AppError("المستخدم غير موجود أو غير مفعل", 404);
    }

    const permissionExists = await userPermissionsRepository.permissionExists(permissionId);
    if (!permissionExists) {
      throw new AppError("الصلاحية غير موجودة أو غير مفعلة", 404);
    }

    await userPermissionsRepository.upsertOverride({
      userId,
      permissionId,
      effect,
      reason,
      createdBy,
    });

    return this.loadPageData(userId);
  },

  async deleteOverride(userIdValue: any, permissionIdValue: any) {
    const userId = cleanText(userIdValue);
    const permissionId = cleanText(permissionIdValue);

    if (!userId || !permissionId) {
      throw new AppError("معرف المستخدم ومعرف الصلاحية مطلوبان", 400);
    }

    await userPermissionsRepository.deleteOverride(userId, permissionId);
    return this.loadPageData(userId);
  },
};
