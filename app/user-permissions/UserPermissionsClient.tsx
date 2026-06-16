"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, CheckCircle2, KeyRound, RotateCcw, Search, ShieldCheck, ShieldOff, UserCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UserRole = {
  id: string;
  role_code: string;
  role_name_ar: string;
};

type User = {
  id: string;
  username: string;
  full_name: string;
  email?: string | null;
  is_active?: boolean | null;
  is_super_admin?: boolean | null;
  roles?: UserRole[];
};

type Permission = {
  id: string;
  permission_code: string;
  permission_name_ar: string;
  permission_name_en?: string | null;
  action_code: string;
  description?: string | null;
  inherited?: boolean;
  inherited_roles?: UserRole[];
  override?: {
    id: string;
    effect: "allow" | "deny";
    reason?: string | null;
  } | null;
  is_allowed?: boolean;
  source?: "direct_allow" | "direct_deny" | "role" | "none";
};

type PermissionModule = {
  id: string;
  module_code: string;
  module_name_ar: string;
  module_name_en?: string | null;
  route_path?: string | null;
  sort_order?: number | null;
  permissions: Permission[];
};

type Summary = {
  total_permissions: number;
  allowed_permissions: number;
  denied_permissions: number;
  inherited_permissions: number;
  direct_allow: number;
  direct_deny: number;
};

function extractData(payload: any) {
  if (payload?.success) return payload.data;
  return payload;
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

function statusLabel(permission: Permission) {
  if (permission.source === "super_admin") return "مدير مبرمج";
  if (permission.source === "direct_deny") return "ممنوعة مباشرة";
  if (permission.source === "direct_allow") return "ممنوحة مباشرة";
  if (permission.source === "role") return "موروثة من الدور";
  return "غير ممنوحة";
}

function statusClass(permission: Permission) {
  if (permission.source === "super_admin") return "border-purple-300 bg-purple-50 text-purple-700";
  if (permission.source === "direct_deny") return "border-red-300 bg-red-50 text-red-700";
  if (permission.source === "direct_allow") return "border-green-300 bg-green-50 text-green-700";
  if (permission.source === "role") return "border-blue-300 bg-blue-50 text-blue-700";
  return "border-gray-300 bg-gray-50 text-gray-600";
}

export default function UserPermissionsClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissionModules, setPermissionModules] = useState<PermissionModule[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [permissionSearch, setPermissionSearch] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  function can(permissionCode: string) {
    return permissions.includes(permissionCode);
  }

  async function loadCurrentUserPermissions() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const payload = await res.json();

      if (!res.ok || payload.success === false) {
        setPermissions([]);
        return;
      }

      const effectivePermissions = payload.data?.permissions || [];
      setPermissions(
        effectivePermissions
          .filter((permission: any) => permission.allowed === true)
          .map((permission: any) => permission.permission_code)
      );
    } catch {
      setPermissions([]);
    } finally {
      setPermissionsLoaded(true);
    }
  }

  const filteredUsers = useMemo(() => {
    const term = userSearch.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      `${user.username} ${user.full_name} ${user.is_super_admin ? "مدير مبرمج super admin" : ""} ${user.email || ""} ${(user.roles || [])
        .map((role) => `${role.role_code} ${role.role_name_ar}`)
        .join(" ")}`
        .toLowerCase()
        .includes(term)
    );
  }, [users, userSearch]);

  const filteredModules = useMemo(() => {
    const term = permissionSearch.trim().toLowerCase();
    if (!term) return permissionModules;

    return permissionModules
      .map((module) => ({
        ...module,
        permissions: module.permissions.filter((permission) =>
          `${module.module_code} ${module.module_name_ar} ${permission.permission_code} ${permission.permission_name_ar} ${permission.description || ""}`
            .toLowerCase()
            .includes(term)
        ),
      }))
      .filter((module) => module.permissions.length > 0);
  }, [permissionModules, permissionSearch]);

  async function load(userId?: string) {
    setLoading(true);
    try {
      const query = userId ? `?user_id=${encodeURIComponent(userId)}` : "";
      const res = await fetch(`/api/user-permissions${query}`, { cache: "no-store" });
      const payload = await res.json();

      if (!res.ok || payload.success === false) {
        toast.error(payload.message || "تعذر تحميل صلاحيات المستخدم");
        return;
      }

      const data = extractData(payload) || {};
      setUsers(data.users || []);
      setSelectedUser(data.selected_user || null);
      setPermissionModules(data.permission_modules || []);
      setSummary(data.summary || null);
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentUserPermissions();
    load();
  }, []);

  async function setOverride(permissionId: string, effect: "allow" | "deny") {
    if (!can("users.manage_permissions")) {
      toast.error("ليس لديك صلاحية إدارة صلاحيات المستخدم المباشرة");
      return;
    }

    if (!selectedUser) return;

    if (selectedUser.is_super_admin) {
      toast.error("لا يمكن إضافة أو تعديل صلاحيات مدير النظام المبرمج");
      return;
    }

    const key = `${permissionId}-${effect}`;
    setSavingKey(key);

    try {
      const res = await fetch("/api/user-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.id,
          permission_id: permissionId,
          effect,
          reason: reason.trim() || null,
        }),
      });
      const payload = await res.json();

      if (!res.ok || payload.success === false) {
        toast.error(payload.message || "تعذر حفظ الاستثناء");
        return;
      }

      toast.success(payload.message || "تم حفظ الاستثناء بنجاح");
      const data = extractData(payload) || {};
      setSelectedUser(data.selected_user || selectedUser);
      setPermissionModules(data.permission_modules || []);
      setSummary(data.summary || null);
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setSavingKey("");
    }
  }

  async function deleteOverride(permissionId: string) {
    if (!can("users.manage_permissions")) {
      toast.error("ليس لديك صلاحية إدارة صلاحيات المستخدم المباشرة");
      return;
    }

    if (!selectedUser) return;

    if (selectedUser.is_super_admin) {
      toast.error("لا يمكن حذف استثناءات أو صلاحيات مدير النظام المبرمج");
      return;
    }

    const key = `${permissionId}-delete`;
    setSavingKey(key);

    try {
      const params = new URLSearchParams({
        user_id: selectedUser.id,
        permission_id: permissionId,
      });

      const res = await fetch(`/api/user-permissions?${params.toString()}`, {
        method: "DELETE",
      });
      const payload = await res.json();

      if (!res.ok || payload.success === false) {
        toast.error(payload.message || "تعذر حذف الاستثناء");
        return;
      }

      toast.success(payload.message || "تم حذف الاستثناء");
      const data = extractData(payload) || {};
      setSelectedUser(data.selected_user || selectedUser);
      setPermissionModules(data.permission_modules || []);
      setSummary(data.summary || null);
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setSavingKey("");
    }
  }

  if (permissionsLoaded && !can("users.manage_permissions")) {
    return (
      <div dir="rtl" className="space-y-6">
        <section
          className="rounded-2xl border p-8 text-center space-y-3"
          style={{
            backgroundColor: "var(--app-surface)",
            borderColor: "var(--app-border)",
          }}
        >
          <h1 className="text-2xl font-bold">ليس لديك صلاحية إدارة صلاحيات المستخدمين</h1>
          <p className="text-sm" style={{ color: "var(--app-muted)" }}>
            يلزم توفر الصلاحية users.manage_permissions للوصول إلى هذه الشاشة.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6">
      <header
        className="rounded-2xl border p-5"
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UserCog className="h-8 w-8" />
              صلاحيات المستخدم المباشرة
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--app-muted)" }}>
              منح أو منع صلاحيات خاصة لمستخدم محدد مع عرض الصلاحيات الموروثة من الأدوار.
            </p>
            {!can("users.manage_permissions") && (
              <p className="text-xs text-amber-600 mt-1">لديك صلاحية عرض فقط، ولا يمكنك تعديل الاستثناءات.</p>
            )}
          </div>

          <Button onClick={() => selectedUser && load(selectedUser.id)} disabled={loading}>
            تحديث البيانات
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <aside
          className="xl:col-span-1 rounded-2xl border p-4 space-y-4"
          style={{
            backgroundColor: "var(--app-surface)",
            borderColor: "var(--app-border)",
          }}
        >
          <div className="font-bold flex items-center gap-2">
            <Search className="h-4 w-4" />
            اختيار المستخدم
          </div>

          <Input
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder="بحث في المستخدمين..."
            className="bg-transparent text-[var(--app-text)]"
          />

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filteredUsers.map((user) => {
              const active = selectedUser?.id === user.id;

              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => load(user.id)}
                  className="w-full rounded-xl border p-3 text-right transition-all"
                  style={{
                    backgroundColor: active ? "var(--app-primary)" : "transparent",
                    color: active ? "#fff" : "var(--app-text)",
                    borderColor: active ? "var(--app-primary)" : "var(--app-border)",
                  }}
                >
                  <div className="font-bold">{user.full_name}</div>
                  <div className="text-xs opacity-80">{user.username}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(user.roles || []).length ? (
                      (user.roles || []).map((role) => (
                        <span key={role.id} className="rounded-full bg-black/10 px-2 py-0.5 text-[11px]">
                          {role.role_name_ar}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px]">بدون دور</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="xl:col-span-3 space-y-6">
          {selectedUser ? (
            <>
              <section
                className="rounded-2xl border p-5"
                style={{
                  backgroundColor: "var(--app-surface)",
                  borderColor: "var(--app-border)",
                }}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedUser.full_name}{selectedUser.is_super_admin ? " — مدير مبرمج" : ""}</h2>
                    <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
                      {selectedUser.username} {selectedUser.email ? `— ${selectedUser.email}` : ""}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(selectedUser.roles || []).length ? (
                        (selectedUser.roles || []).map((role) => (
                          <Badge key={role.id} variant="secondary">
                            {role.role_name_ar}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">لا يوجد دور</Badge>
                      )}
                    </div>
                    {selectedUser.is_super_admin && (
                      <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        هذا المستخدم هو مدير النظام المبرمج. صلاحياته كاملة وتلقائية ولا يمكن منحها أو منعها أو حذفها من داخل النظام.
                      </div>
                    )}
                  </div>

                  {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center min-w-[360px]">
                      <div className="rounded-xl border p-3" style={{ borderColor: "var(--app-border)" }}>
                        <div className="text-lg font-bold">{summary.total_permissions}</div>
                        <div className="text-xs" style={{ color: "var(--app-muted)" }}>كل الصلاحيات</div>
                      </div>
                      <div className="rounded-xl border p-3" style={{ borderColor: "var(--app-border)" }}>
                        <div className="text-lg font-bold text-green-600">{summary.allowed_permissions}</div>
                        <div className="text-xs" style={{ color: "var(--app-muted)" }}>مسموح</div>
                      </div>
                      <div className="rounded-xl border p-3" style={{ borderColor: "var(--app-border)" }}>
                        <div className="text-lg font-bold text-blue-600">{summary.inherited_permissions}</div>
                        <div className="text-xs" style={{ color: "var(--app-muted)" }}>من الدور</div>
                      </div>
                      <div className="rounded-xl border p-3" style={{ borderColor: "var(--app-border)" }}>
                        <div className="text-lg font-bold text-green-700">{summary.direct_allow}</div>
                        <div className="text-xs" style={{ color: "var(--app-muted)" }}>منح مباشر</div>
                      </div>
                      <div className="rounded-xl border p-3" style={{ borderColor: "var(--app-border)" }}>
                        <div className="text-lg font-bold text-red-600">{summary.direct_deny}</div>
                        <div className="text-xs" style={{ color: "var(--app-muted)" }}>منع مباشر</div>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section
                className="rounded-2xl border p-5 space-y-3"
                style={{
                  backgroundColor: "var(--app-surface)",
                  borderColor: "var(--app-border)",
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Input
                    value={permissionSearch}
                    onChange={(event) => setPermissionSearch(event.target.value)}
                    placeholder="بحث في الصلاحيات أو الوحدات..."
                    className="bg-transparent text-[var(--app-text)]"
                  />
                  <Input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="سبب المنح/المنع المباشر، اختياري"
                    className="bg-transparent text-[var(--app-text)]"
                  />
                </div>

                <div className="text-xs" style={{ color: "var(--app-muted)" }}>
                  القاعدة: المنع المباشر يتغلب على صلاحيات الأدوار، ثم المنح المباشر، ثم الصلاحيات الموروثة من الأدوار.
                </div>
              </section>

              <div className="space-y-4">
                {filteredModules.map((module) => (
                  <section
                    key={module.id}
                    className="rounded-2xl border overflow-hidden"
                    style={{
                      backgroundColor: "var(--app-surface)",
                      borderColor: "var(--app-border)",
                    }}
                  >
                    <div
                      className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b p-4"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      <div>
                        <div className="font-bold text-lg">{module.module_name_ar}</div>
                        <div className="text-xs" style={{ color: "var(--app-muted)" }}>
                          {module.module_code} {module.route_path ? `— ${module.route_path}` : ""}
                        </div>
                      </div>
                      <Badge variant="secondary">{module.permissions.length} صلاحية</Badge>
                    </div>

                    <div className="divide-y" style={{ borderColor: "var(--app-border)" }}>
                      {module.permissions.map((permission) => (
                        <div key={permission.id} className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold">{permission.permission_name_ar}</span>
                              <span className="text-xs rounded-full px-2 py-1 border" style={{ borderColor: "var(--app-border)" }}>
                                {actionLabel(permission.action_code)}
                              </span>
                              <span className={`text-xs rounded-full border px-2 py-1 ${statusClass(permission)}`}>
                                {statusLabel(permission)}
                              </span>
                            </div>

                            <div className="text-xs" style={{ color: "var(--app-muted)" }}>
                              {permission.permission_code}
                            </div>

                            {permission.description && (
                              <div className="text-sm" style={{ color: "var(--app-muted)" }}>
                                {permission.description}
                              </div>
                            )}

                            {!!permission.inherited_roles?.length && (
                              <div className="flex flex-wrap gap-1">
                                <span className="text-xs mt-1" style={{ color: "var(--app-muted)" }}>
                                  موروثة من:
                                </span>
                                {permission.inherited_roles.map((role) => (
                                  <Badge key={role.id} variant="outline">
                                    {role.role_name_ar}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {permission.override?.reason && (
                              <div className="rounded-lg border p-2 text-xs" style={{ borderColor: "var(--app-border)" }}>
                                سبب الاستثناء: {permission.override.reason}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 justify-start lg:justify-end">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setOverride(permission.id, "allow")}
                              disabled={savingKey === `${permission.id}-allow` || !can("users.manage_permissions") || selectedUser?.is_super_admin === true}
                              className="gap-1"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              منح مباشر
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => setOverride(permission.id, "deny")}
                              disabled={savingKey === `${permission.id}-deny` || !can("users.manage_permissions") || selectedUser?.is_super_admin === true}
                              className="gap-1"
                            >
                              <Ban className="h-4 w-4" />
                              منع مباشر
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => deleteOverride(permission.id)}
                              disabled={!permission.override || savingKey === `${permission.id}-delete` || !can("users.manage_permissions") || selectedUser?.is_super_admin === true}
                              className="gap-1"
                            >
                              <RotateCcw className="h-4 w-4" />
                              إلغاء الاستثناء
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <section
              className="rounded-2xl border p-8 text-center"
              style={{
                backgroundColor: "var(--app-surface)",
                borderColor: "var(--app-border)",
              }}
            >
              {loading ? "جار التحميل..." : "لا يوجد مستخدمون مفعلون"}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
