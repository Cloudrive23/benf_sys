"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { Check, KeyRound, Plus, Save, Search, Shield, Trash2, UserPlus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Permission = {
  id: string;
  permission_code: string;
  permission_name_ar: string;
  permission_name_en?: string | null;
  action_code: string;
  description?: string | null;
};

type Module = {
  id: string;
  module_code: string;
  module_name_ar: string;
  module_name_en?: string | null;
  route_path?: string | null;
  sort_order?: number | null;
  permissions: Permission[];
};

type User = {
  id: string;
  username: string;
  full_name: string;
  email?: string | null;
  is_active?: boolean | null;
};

type RolePermission = {
  permission_id: string;
  permissions?: Permission & {
    system_modules?: Module | null;
  };
};

type RoleUser = {
  user_id: string;
  users?: User;
};

type Role = {
  id: string;
  role_code: string;
  role_name_ar: string;
  role_name_en?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  role_permissions?: RolePermission[];
  user_roles?: RoleUser[];
  _count?: {
    role_permissions?: number;
    user_roles?: number;
  };
};

const emptyForm = {
  id: "",
  role_code: "",
  role_name_ar: "",
  role_name_en: "",
  description: "",
  is_active: true,
};

function fieldClass() {
  return "w-full rounded-md border bg-transparent p-2 text-[var(--app-text)]";
}

function extractData(payload: any) {
  if (payload?.success) return payload.data;
  return payload;
}

function normalizeRoleCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-.]/g, "");
}

function getRolePermissionIds(role?: Role | null) {
  return new Set((role?.role_permissions || []).map((item) => item.permission_id));
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    view: "عرض",
    create: "إضافة",
    update: "تعديل",
    delete: "حذف",
    export: "تصدير",
    print: "طباعة",
    manage: "إدارة",
    approve: "اعتماد",
    cancel: "إلغاء",
    manage_permissions: "إدارة الصلاحيات",
    manage_users: "إدارة المستخدمين",
    manage_roles: "إدارة الأدوار",
    update_dynamic: "تعديل ديناميكي",
    manage_family: "إدارة الأسرة",
    view_sponsor_links: "جهات المستفيد",
  };

  return labels[action] || action;
}

export default function RolesClient() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [permissionIds, setPermissionIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) || null,
    [roles, selectedRoleId]
  );

  const filteredRoles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return roles;

    return roles.filter((role) =>
      `${role.role_code} ${role.role_name_ar} ${role.role_name_en || ""} ${role.description || ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [roles, search]);

  const roleUsers = useMemo(() => selectedRole?.user_roles || [], [selectedRole]);

  const availableUsers = useMemo(() => {
    const assigned = new Set(roleUsers.map((item) => item.user_id));
    return users.filter((user) => !assigned.has(user.id));
  }, [users, roleUsers]);

  const totalPermissions = useMemo(
    () => modules.reduce((sum, module) => sum + (module.permissions?.length || 0), 0),
    [modules]
  );

  async function load(selectRoleId?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/roles", { cache: "no-store" });
      const payload = await res.json();

      if (!res.ok || payload.success === false) {
        toast.error(payload.message || "تعذر تحميل الأدوار والصلاحيات");
        return;
      }

      const data = extractData(payload) || {};
      const loadedRoles: Role[] = data.roles || [];

      setRoles(loadedRoles);
      setModules(data.modules || []);
      setUsers(data.users || []);

      const nextSelectedId =
        selectRoleId ||
        selectedRoleId ||
        loadedRoles.find((role) => role.role_code === "system_admin")?.id ||
        loadedRoles[0]?.id ||
        "";

      const nextRole = loadedRoles.find((role) => role.id === nextSelectedId) || null;

      if (nextRole) {
        selectRole(nextRole, false);
      } else {
        clearForm();
      }
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearForm() {
    setSelectedRoleId("");
    setForm(emptyForm);
    setPermissionIds(new Set());
    setSelectedUserId("");
  }

  function selectRole(role: Role, scroll = true) {
    setSelectedRoleId(role.id);
    setForm({
      id: role.id,
      role_code: role.role_code || "",
      role_name_ar: role.role_name_ar || "",
      role_name_en: role.role_name_en || "",
      description: role.description || "",
      is_active: role.is_active !== false,
    });
    setPermissionIds(getRolePermissionIds(role));
    setSelectedUserId("");

    if (scroll) {
      setTimeout(() => {
        document.getElementById("role-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  async function saveRole(event: FormEvent) {
    event.preventDefault();
    setSavingRole(true);

    try {
      const method = form.id ? "PUT" : "POST";
      const body = {
        ...form,
        role_code: normalizeRoleCode(form.role_code),
      };

      const res = await fetch("/api/roles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();

      if (!res.ok || payload.success === false) {
        toast.error(payload.message || "تعذر حفظ الدور");
        return;
      }

      toast.success(payload.message || "تم حفظ الدور بنجاح");
      const savedRole = extractData(payload);
      await load(savedRole?.id || form.id);
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setSavingRole(false);
    }
  }

  async function disableRole(role: Role) {
    if (role.role_code === "system_admin") {
      toast.error("لا يمكن تعطيل دور مدير النظام");
      return;
    }

    if (!confirm(`هل تريد تعطيل الدور: ${role.role_name_ar}؟`)) return;

    try {
      const res = await fetch(`/api/roles?id=${role.id}`, { method: "DELETE" });
      const payload = await res.json();

      if (!res.ok || payload.success === false) {
        toast.error(payload.message || "تعذر تعطيل الدور");
        return;
      }

      toast.success(payload.message || "تم تعطيل الدور بنجاح");
      await load(selectedRoleId === role.id ? undefined : selectedRoleId);
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    }
  }

  function togglePermission(permissionId: string) {
    setPermissionIds((old) => {
      const next = new Set(old);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  }

  function selectModulePermissions(module: Module, checked: boolean) {
    setPermissionIds((old) => {
      const next = new Set(old);
      for (const permission of module.permissions || []) {
        if (checked) next.add(permission.id);
        else next.delete(permission.id);
      }
      return next;
    });
  }

  async function savePermissions() {
    if (!selectedRole) {
      toast.error("اختر دورًا أولًا");
      return;
    }

    setSavingPermissions(true);
    try {
      const res = await fetch("/api/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_permissions",
          role_id: selectedRole.id,
          permission_ids: Array.from(permissionIds),
        }),
      });
      const payload = await res.json();

      if (!res.ok || payload.success === false) {
        toast.error(payload.message || "تعذر تحديث الصلاحيات");
        return;
      }

      toast.success(payload.message || "تم تحديث الصلاحيات بنجاح");
      await load(selectedRole.id);
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setSavingPermissions(false);
    }
  }

  async function addUserToRole() {
    if (!selectedRole) {
      toast.error("اختر دورًا أولًا");
      return;
    }

    if (!selectedUserId) {
      toast.error("اختر المستخدم");
      return;
    }

    setSavingUser(true);
    try {
      const res = await fetch("/api/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_user",
          role_id: selectedRole.id,
          user_id: selectedUserId,
        }),
      });
      const payload = await res.json();

      if (!res.ok || payload.success === false) {
        toast.error(payload.message || "تعذر إضافة المستخدم إلى الدور");
        return;
      }

      toast.success(payload.message || "تمت إضافة المستخدم إلى الدور");
      await load(selectedRole.id);
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setSavingUser(false);
    }
  }

  async function removeUserFromRole(userId: string) {
    if (!selectedRole) return;

    if (!confirm("هل تريد إزالة هذا المستخدم من الدور؟")) return;

    setSavingUser(true);
    try {
      const res = await fetch("/api/roles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_user",
          role_id: selectedRole.id,
          user_id: userId,
        }),
      });
      const payload = await res.json();

      if (!res.ok || payload.success === false) {
        toast.error(payload.message || "تعذر إزالة المستخدم من الدور");
        return;
      }

      toast.success(payload.message || "تمت إزالة المستخدم من الدور");
      await load(selectedRole.id);
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setSavingUser(false);
    }
  }

  return (
    <div className="space-y-6 text-[var(--app-text)]" dir="rtl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            الأدوار والصلاحيات
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة المجموعات، صلاحيات كل مجموعة، والمستخدمين داخل كل مجموعة.
          </p>
        </div>

        <Button type="button" onClick={clearForm}>
          <Plus className="h-4 w-4 ml-2" />
          دور جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-xl border bg-[var(--app-surface)] p-4 space-y-4 xl:col-span-1">
          <div className="relative">
            <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              className="pr-9 bg-transparent text-[var(--app-text)] placeholder:text-[var(--app-muted)]"
              placeholder="بحث في الأدوار..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-[720px] overflow-auto pr-1">
            {loading ? (
              <div className="text-sm text-gray-500 p-4">جاري التحميل...</div>
            ) : filteredRoles.length === 0 ? (
              <div className="text-sm text-gray-500 p-4">لا توجد أدوار</div>
            ) : (
              filteredRoles.map((role) => {
                const active = selectedRoleId === role.id;

                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => selectRole(role)}
                    className={`w-full rounded-xl border p-4 text-right transition ${
                      active ? "border-blue-500 bg-blue-500/10" : "hover:bg-black/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">{role.role_name_ar}</div>
                        <div className="text-xs text-gray-500 ltr:text-left" dir="ltr">
                          {role.role_code}
                        </div>
                      </div>

                      <Badge variant={role.is_active === false ? "destructive" : "secondary"}>
                        {role.is_active === false ? "معطل" : "مفعل"}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-black/5 px-2 py-1">
                        {role._count?.role_permissions || role.role_permissions?.length || 0} صلاحية
                      </span>
                      <span className="rounded-full bg-black/5 px-2 py-1">
                        {role._count?.user_roles || role.user_roles?.length || 0} مستخدم
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div id="role-editor" className="space-y-6 xl:col-span-2">
          <form onSubmit={saveRole} className="rounded-xl border bg-[var(--app-surface)] p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">بيانات الدور</h2>
              {selectedRole && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => disableRole(selectedRole)}
                  disabled={selectedRole.role_code === "system_admin"}
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  تعطيل الدور
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-1">
                <span className="text-sm font-medium">كود الدور بالإنجليزية</span>
                <Input
                  dir="ltr"
                  value={form.role_code}
                  onChange={(event) =>
                    setForm((old) => ({ ...old, role_code: normalizeRoleCode(event.target.value) }))
                  }
                  placeholder="data_entry"
                  required
                  disabled={form.role_code === "system_admin"}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">اسم الدور بالعربي</span>
                <Input
                  value={form.role_name_ar}
                  onChange={(event) => setForm((old) => ({ ...old, role_name_ar: event.target.value }))}
                  placeholder="مدخل بيانات"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">اسم الدور بالإنجليزية</span>
                <Input
                  dir="ltr"
                  value={form.role_name_en}
                  onChange={(event) => setForm((old) => ({ ...old, role_name_en: event.target.value }))}
                  placeholder="Data Entry"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium">الحالة</span>
                <select
                  className={fieldClass()}
                  value={form.is_active ? "true" : "false"}
                  onChange={(event) =>
                    setForm((old) => ({ ...old, is_active: event.target.value === "true" }))
                  }
                  disabled={form.role_code === "system_admin"}
                >
                  <option value="true">مفعل</option>
                  <option value="false">معطل</option>
                </select>
              </label>
            </div>

            <label className="space-y-1 block">
              <span className="text-sm font-medium">الوصف</span>
              <textarea
                className="min-h-20 w-full rounded-md border bg-transparent p-2 text-[var(--app-text)] placeholder:text-[var(--app-muted)]"
                value={form.description}
                onChange={(event) => setForm((old) => ({ ...old, description: event.target.value }))}
                placeholder="وصف مختصر لمهام هذا الدور"
              />
            </label>

            <div className="flex justify-end">
              <Button type="submit" disabled={savingRole}>
                <Save className="h-4 w-4 ml-2" />
                {savingRole ? "جاري الحفظ..." : "حفظ بيانات الدور"}
              </Button>
            </div>
          </form>

          <div className="rounded-xl border bg-[var(--app-surface)] p-4 space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <KeyRound className="h-5 w-5" />
                  صلاحيات الدور
                </h2>
                <p className="text-sm text-gray-500">
                  المحدد: {permissionIds.size} من {totalPermissions} صلاحية
                </p>
              </div>

              <Button type="button" onClick={savePermissions} disabled={!selectedRole || savingPermissions}>
                <Check className="h-4 w-4 ml-2" />
                {savingPermissions ? "جاري الحفظ..." : "حفظ الصلاحيات"}
              </Button>
            </div>

            {!selectedRole ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-gray-500">
                اختر دورًا أو أنشئ دورًا جديدًا أولًا.
              </div>
            ) : (
              <div className="space-y-4 max-h-[720px] overflow-auto pr-1">
                {modules.map((module) => {
                  const modulePermissionIds = (module.permissions || []).map((permission) => permission.id);
                  const selectedCount = modulePermissionIds.filter((id) => permissionIds.has(id)).length;
                  const allSelected = modulePermissionIds.length > 0 && selectedCount === modulePermissionIds.length;

                  if (module.permissions.length === 0) return null;

                  return (
                    <div key={module.id} className="rounded-xl border p-4 space-y-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-semibold">{module.module_name_ar}</div>
                          <div className="text-xs text-gray-500" dir="ltr">
                            {module.module_code} — {module.route_path || ""}
                          </div>
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={(event) => selectModulePermissions(module, event.target.checked)}
                          />
                          تحديد كل صلاحيات الوحدة ({selectedCount}/{modulePermissionIds.length})
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {module.permissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-black/5"
                          >
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={permissionIds.has(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                            />
                            <span className="space-y-1">
                              <span className="block font-medium text-sm">{permission.permission_name_ar}</span>
                              <span className="block text-xs text-gray-500" dir="ltr">
                                {permission.permission_code}
                              </span>
                              <Badge variant="outline">{actionLabel(permission.action_code)}</Badge>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-[var(--app-surface)] p-4 space-y-4">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5" />
                مستخدمو الدور
              </h2>
              <p className="text-sm text-gray-500">
                إضافة أو إزالة المستخدمين داخل المجموعة/الدور المحدد.
              </p>
            </div>

            {!selectedRole ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-gray-500">
                اختر دورًا أولًا لإدارة مستخدميه.
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-3">
                  <select
                    className={fieldClass()}
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                  >
                    <option value="">اختر مستخدمًا لإضافته</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} — {user.username}
                      </option>
                    ))}
                  </select>

                  <Button type="button" onClick={addUserToRole} disabled={savingUser || !selectedUserId}>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إضافة للدور
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roleUsers.length === 0 ? (
                    <div className="text-sm text-gray-500">لا يوجد مستخدمون في هذا الدور.</div>
                  ) : (
                    roleUsers.map((item) => {
                      const user = item.users;
                      if (!user) return null;

                      return (
                        <div key={item.user_id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-xs text-gray-500" dir="ltr">
                              {user.username} {user.email ? `— ${user.email}` : ""}
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeUserFromRole(item.user_id)}
                            disabled={savingUser}
                          >
                            إزالة
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
