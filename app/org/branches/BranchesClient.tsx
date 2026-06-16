"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Branch = {
  id: string;
  branch_code: string;
  branch_name_ar: string;
  branch_name_en: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  is_active: boolean | null;
};

type PermissionItem = string | {
  permission_code?: string;
  allowed?: boolean;
};

const emptyForm = {
  id: "",
  branch_code: "",
  branch_name_ar: "",
  branch_name_en: "",
  city: "",
  address: "",
  phone: "",
  is_active: true,
};

export default function BranchesClient() {
  const [items, setItems] = useState<Branch[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  function can(permissionCode: string) {
    return permissions.includes(permissionCode);
  }

  function normalizePermissions(rawPermissions: PermissionItem[]) {
    return rawPermissions
      .filter((permission) => {
        if (typeof permission === "string") return true;
        return permission.allowed === true;
      })
      .map((permission) =>
        typeof permission === "string" ? permission : permission.permission_code || ""
      )
      .filter(Boolean);
  }

  async function loadCurrentUserPermissions() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setPermissions(normalizePermissions(data.data?.permissions || []));
      } else {
        setPermissions([]);
      }
    } catch {
      setPermissions([]);
    } finally {
      setPermissionsLoaded(true);
    }
  }

  async function load() {
    const res = await fetch("/api/org/branches", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      setAccessDenied(false);
      setItems(data.data || []);
    } else if (res.status === 401 || res.status === 403) {
      setAccessDenied(true);
      setItems([]);
    } else {
      toast.error(data.message || "تعذر تحميل الفروع");
    }
  }

  async function loadNextCode() {
    const res = await fetch("/api/org/branches/next-code", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setForm((old) => ({
        ...old,
        branch_code: data.data.branch_code,
      }));
    } else {
      toast.error(data.message || "تعذر جلب رقم الفرع التالي");
    }
  }

  useEffect(() => {
    loadCurrentUserPermissions();
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) =>
      `${item.branch_code} ${item.branch_name_ar} ${item.branch_name_en || ""} ${item.city || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search]);

  async function openCreate() {
    if (!can("org.branches.create")) {
      toast.error("ليس لديك صلاحية إضافة فرع");
      return;
    }

    setForm(emptyForm);
    setOpen(true);
    await loadNextCode();
  }

  function openEdit(item: Branch) {
    if (!can("org.branches.update")) {
      toast.error("ليس لديك صلاحية تعديل الفروع");
      return;
    }

    setForm({
      id: item.id,
      branch_code: item.branch_code,
      branch_name_ar: item.branch_name_ar || "",
      branch_name_en: item.branch_name_en || "",
      city: item.city || "",
      address: item.address || "",
      phone: item.phone || "",
      is_active: Boolean(item.is_active),
    });

    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    const requiredPermission = form.id
      ? "org.branches.update"
      : "org.branches.create";

    if (!can(requiredPermission)) {
      toast.error("ليس لديك صلاحية تنفيذ هذه العملية");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/org/branches", {
        method: form.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "تم الحفظ بنجاح");
        setOpen(false);
        setForm(emptyForm);
        await load();
      } else {
        toast.error(data.message || "تعذر حفظ الفرع");
        console.log(data);
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!can("org.branches.delete")) {
      toast.error("ليس لديك صلاحية حذف الفروع");
      return;
    }

    if (!confirm("هل أنت متأكد من حذف الفرع؟")) return;

    const res = await fetch(`/api/org/branches?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم الحذف بنجاح");
      await load();
    } else {
      toast.error(data.message || "تعذر حذف الفرع");
    }
  }

  if (permissionsLoaded && accessDenied) {
    return (
      <div className="rounded-2xl border p-8 text-center space-y-3" style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)" }}>
        <h1 className="text-2xl font-bold">غير مصرح</h1>
        <p style={{ color: "var(--app-muted)" }}>ليس لديك صلاحية الوصول إلى شاشة الفروع.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">إدارة الفروع</h1>
          <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
            إضافة وتعديل الفروع الأساسية للنظام
          </p>
        </div>

        {can("org.branches.create") && (
          <Button
            onClick={openCreate}
            style={{
              backgroundColor: "var(--app-primary)",
              color: "white",
            }}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة فرع
          </Button>
        )}
      </div>

      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >
        <div className="relative max-w-lg">
          <Search className="absolute right-3 top-3 w-4 h-4 opacity-60" />
          <Input
            className="pr-10"
            placeholder="بحث برقم الفرع أو الاسم أو المدينة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--app-border)" }}
              >
                <th className="p-3 text-right">رقم الفرع</th>
                <th className="p-3 text-right">اسم الفرع</th>
                <th className="p-3 text-right">الاسم بالإنجليزية</th>
                <th className="p-3 text-right">المدينة</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-left">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center"
                    style={{ color: "var(--app-muted)" }}
                  >
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    <td className="p-3">{item.branch_code}</td>
                    <td className="p-3">{item.branch_name_ar}</td>
                    <td className="p-3">{item.branch_name_en || "-"}</td>
                    <td className="p-3">{item.city || "-"}</td>
                    <td className="p-3">{item.phone || "-"}</td>
                    <td className="p-3">
                      <Badge>{item.is_active ? "نشط" : "غير نشط"}</Badge>
                    </td>
                    <td className="p-3 text-left space-x-2 space-x-reverse">
                      {can("org.branches.update") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}

                      {can("org.branches.delete") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => remove(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div
            className="w-full max-w-3xl rounded-2xl border p-6 space-y-5"
            style={{
              backgroundColor: "var(--app-surface)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {form.id ? "تعديل فرع" : "إضافة فرع"}
              </h2>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm">رقم الفرع</label>
                  <Input readOnly value={form.branch_code} />
                </div>

                <div>
                  <label className="text-sm">اسم الفرع بالعربية</label>
                  <Input
                    required
                    value={form.branch_name_ar}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branch_name_ar: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">اسم الفرع بالإنجليزية</label>
                  <Input
                    value={form.branch_name_en}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branch_name_en: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">المدينة</label>
                  <Input
                    value={form.city}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        city: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">الهاتف</label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">العنوان</label>
                  <Input
                    value={form.address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      is_active: e.target.checked,
                    })
                  }
                />
                فرع نشط
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  إلغاء
                </Button>

                {((form.id && can("org.branches.update")) ||
                  (!form.id && can("org.branches.create"))) && (
                  <Button type="submit" disabled={saving}>
                    {saving ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
