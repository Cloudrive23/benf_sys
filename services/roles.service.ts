import { AppError } from "@/lib/api-error";
import { rolesRepository } from "@/repositories/roles.repository";

function cleanText(value: any) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeRoleCode(value: any) {
  const text = cleanText(value);
  if (!text) return null;

  return text
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-.]/g, "");
}

function uniqueIds(values: any[]) {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => cleanText(value))
        .filter(Boolean) as string[]
    )
  );
}

function roleData(data: any) {
  const role_code = normalizeRoleCode(data.role_code);
  const role_name_ar = cleanText(data.role_name_ar);

  if (!role_code) {
    throw new AppError("كود الدور مطلوب ويجب أن يكون بالإنجليزية", 400);
  }

  if (!role_name_ar) {
    throw new AppError("اسم الدور بالعربي مطلوب", 400);
  }

  return {
    role_code,
    role_name_ar,
    role_name_en: cleanText(data.role_name_en),
    description: cleanText(data.description),
    is_active: data.is_active ?? true,
    updated_at: new Date(),
  };
}

async function ensureRole(id: string) {
  const role = await rolesRepository.findById(id);
  if (!role) {
    throw new AppError("الدور غير موجود", 404);
  }

  return role;
}

export const rolesService = {
  async loadPageData() {
    const [roles, modules, users] = await Promise.all([
      rolesRepository.findAll(),
      rolesRepository.listModulesWithPermissions(),
      rolesRepository.listActiveUsers(),
    ]);

    return { roles, modules, users };
  },

  async create(data: any) {
    const payload = roleData(data);
    const existing = await rolesRepository.findByCode(payload.role_code);

    if (existing) {
      throw new AppError("كود الدور موجود مسبقًا", 409);
    }

    return rolesRepository.create({
      ...payload,
      created_at: new Date(),
    });
  },

  async update(data: any) {
    const id = cleanText(data.id);
    if (!id) {
      throw new AppError("معرف الدور مطلوب", 400);
    }

    await ensureRole(id);
    const payload = roleData(data);

    const sameCode = await rolesRepository.findByCode(payload.role_code);
    if (sameCode && sameCode.id !== id) {
      throw new AppError("كود الدور مستخدم في دور آخر", 409);
    }

    return rolesRepository.update(id, payload);
  },

  async delete(id: string) {
    const cleanId = cleanText(id);
    if (!cleanId) {
      throw new AppError("معرف الدور مطلوب", 400);
    }

    const role = await ensureRole(cleanId);

    if (role.role_code === "system_admin") {
      throw new AppError("لا يمكن تعطيل دور مدير النظام", 400);
    }

    return rolesRepository.softDelete(cleanId);
  },

  async setPermissions(data: any) {
    const roleId = cleanText(data.role_id);
    if (!roleId) {
      throw new AppError("معرف الدور مطلوب", 400);
    }

    await ensureRole(roleId);

    const permissionIds = uniqueIds(Array.isArray(data.permission_ids) ? data.permission_ids : []);
    const existingPermissions = await rolesRepository.listPermissionsByIds(permissionIds);

    if (existingPermissions.length !== permissionIds.length) {
      throw new AppError("توجد صلاحيات غير صحيحة أو غير مفعلة", 400);
    }

    return rolesRepository.replaceRolePermissions(roleId, permissionIds);
  },

  async addUser(data: any) {
    const roleId = cleanText(data.role_id);
    const userId = cleanText(data.user_id);

    if (!roleId || !userId) {
      throw new AppError("معرف الدور ومعرف المستخدم مطلوبان", 400);
    }

    await ensureRole(roleId);

    const user = await rolesRepository.findUserById(userId);
    if (!user || user.is_active === false) {
      throw new AppError("المستخدم غير موجود أو غير مفعل", 404);
    }

    return rolesRepository.addUserToRole(roleId, userId);
  },

  async removeUser(data: any) {
    const roleId = cleanText(data.role_id);
    const userId = cleanText(data.user_id);

    if (!roleId || !userId) {
      throw new AppError("معرف الدور ومعرف المستخدم مطلوبان", 400);
    }

    const role = await ensureRole(roleId);

    if (role.role_code === "system_admin") {
      const currentUsers = role.user_roles || [];
      if (currentUsers.length <= 1) {
        throw new AppError("لا يمكن إزالة آخر مستخدم من دور مدير النظام", 400);
      }
    }

    return rolesRepository.removeUserFromRole(roleId, userId);
  },
};
