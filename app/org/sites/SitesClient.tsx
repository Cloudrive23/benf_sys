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
};

type Site = {
  id: string;
  branch_id: string;
  site_code: string;
  site_name_ar: string;
  site_name_en?: string | null;
  address?: string | null;
  is_active?: boolean | null;

  branches?: {
    branch_name_ar?: string;
    branch_code?: string;
  };
};

type PermissionItem = string | {
  permission_code?: string;
  allowed?: boolean;
};

const emptyForm = {
  id: "",
  branch_id: "",
  site_code: "",
  site_name_ar: "",
  site_name_en: "",
  address: "",
  is_active: true,
};

export default function SitesClient() {
  const [items, setItems] = useState<Site[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
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
    const res = await fetch("/api/org/sites", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setAccessDenied(false);
      setItems(data.data || []);
    } else if (res.status === 401 || res.status === 403) {
      setAccessDenied(true);
      setItems([]);
    } else {
      toast.error(data.message || "تعذر تحميل المواقع");
    }
  }

  async function loadBranches() {
    const res = await fetch("/api/org/branches", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setBranches(data.data || []);
    }
  }

  async function loadNextCode() {
    const res = await fetch("/api/org/sites/next-code", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setForm((old) => ({
        ...old,
        site_code: data.data.site_code,
      }));
    } else {
      toast.error(data.message || "تعذر جلب رقم الموقع التالي");
    }
  }

  useEffect(() => {
    loadCurrentUserPermissions();
    load();
    loadBranches();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) =>
      `
      ${item.site_code}
      ${item.site_name_ar}
      ${item.site_name_en || ""}
      ${item.branches?.branch_name_ar || ""}
      `
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search]);

  async function openCreate() {
    if (!can("org.sites.create")) {
      toast.error("ليس لديك صلاحية إضافة موقع");
      return;
    }

    if (branches.length === 0) {
      toast.error("يجب إضافة فرع أولًا قبل إضافة أي موقع");
      return;
    }

    setForm({
      ...emptyForm,
      branch_id: branches[0]?.id || "",
    });

    setOpen(true);

    await loadNextCode();
  }

  function openEdit(item: Site) {
    if (!can("org.sites.update")) {
      toast.error("ليس لديك صلاحية تعديل المواقع");
      return;
    }

    setForm({
      id: item.id,
      branch_id: item.branch_id,
      site_code: item.site_code,
      site_name_ar: item.site_name_ar || "",
      site_name_en: item.site_name_en || "",
      address: item.address || "",
      is_active: Boolean(item.is_active),
    });

    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    const requiredPermission = form.id
      ? "org.sites.update"
      : "org.sites.create";

    if (!can(requiredPermission)) {
      toast.error("ليس لديك صلاحية تنفيذ هذه العملية");
      return;
    }

    if (!form.branch_id) {
      toast.error("يجب اختيار الفرع المرتبط بالموقع");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/org/sites", {
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
        toast.error(data.message || "تعذر حفظ الموقع");
        console.log(data);
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!can("org.sites.delete")) {
      toast.error("ليس لديك صلاحية حذف المواقع");
      return;
    }

    if (!confirm("هل أنت متأكد من حذف الموقع؟")) return;

    const res = await fetch(`/api/org/sites?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم الحذف بنجاح");
      await load();
    } else {
      toast.error(data.message || "تعذر حذف الموقع");
    }
  }

  if (permissionsLoaded && accessDenied) {
    return (
      <div className="rounded-2xl border p-8 text-center space-y-3" style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)" }}>
        <h1 className="text-2xl font-bold">غير مصرح</h1>
        <p style={{ color: "var(--app-muted)" }}>ليس لديك صلاحية الوصول إلى شاشة المواقع.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            إدارة المواقع
          </h1>

          <p
            className="text-sm mt-1"
            style={{ color: "var(--app-muted)" }}
          >
            إضافة وإدارة مواقع الفروع
          </p>
        </div>

        {can("org.sites.create") && (
          <Button
            onClick={openCreate}
            style={{
              backgroundColor: "var(--app-primary)",
              color: "white",
            }}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة موقع
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
            placeholder="بحث برقم الموقع أو الاسم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm border-collapse">

            <thead>
              <tr
                className="border-b"
                style={{
                  borderColor: "var(--app-border)",
                }}
              >
                <th className="p-3 text-right">رقم الموقع</th>
                <th className="p-3 text-right">اسم الموقع</th>
                <th className="p-3 text-right">الفرع</th>
                <th className="p-3 text-right">العنوان</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-left">الإجراءات</th>
              </tr>
            </thead>

            <tbody>

              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center"
                    style={{
                      color: "var(--app-muted)",
                    }}
                  >
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b"
                    style={{
                      borderColor: "var(--app-border)",
                    }}
                  >
                    <td className="p-3">
                      {item.site_code}
                    </td>

                    <td className="p-3">
                      {item.site_name_ar}
                    </td>

                    <td className="p-3">
                      {item.branches?.branch_name_ar}
                    </td>

                    <td className="p-3">
                      {item.address || "-"}
                    </td>

                    <td className="p-3">
                      <Badge>
                        {item.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </td>

                    <td className="p-3 text-left space-x-2 space-x-reverse">
                      {can("org.sites.update") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}

                      {can("org.sites.delete") && (
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
                {form.id ? "تعديل موقع" : "إضافة موقع"}
              </h2>

              <button onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={save} className="space-y-4">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="text-sm">
                    الفرع
                  </label>

                  <select
                    required
                    disabled={Boolean(form.id)}
                    className="w-full rounded-md border bg-transparent p-2"
                    value={form.branch_id}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        branch_id: e.target.value,
                      })
                    }
                  >
                    {branches.map((branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.branch_name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm">
                    رقم الموقع
                  </label>

                  <Input
                    readOnly
                    value={form.site_code}
                  />
                </div>

                <div>
                  <label className="text-sm">
                    اسم الموقع بالعربية
                  </label>

                  <Input
                    required
                    value={form.site_name_ar}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        site_name_ar: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="text-sm">
                    الاسم بالإنجليزية
                  </label>

                  <Input
                    value={form.site_name_en}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        site_name_en: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm">
                    العنوان
                  </label>

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

                موقع نشط
              </label>

              <div className="flex justify-end gap-3 pt-4">

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  إلغاء
                </Button>

                {((form.id && can("org.sites.update")) ||
                  (!form.id && can("org.sites.create"))) && (
                  <Button
                    type="submit"
                    disabled={saving}
                  >
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
