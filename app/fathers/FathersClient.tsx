"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { saveEntityWithPolicies } from "@/app/lib/client/save-entity-with-policies";
import DynamicEntityTable from "@/app/components/dynamic/DynamicEntityTable";
import DynamicEntityForm from "@/app/components/dynamic/DynamicEntityForm";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Father = {
  id: string;
  father_code: string;
  branch_id: string;
  full_name_ar: string;
  full_name_en?: string | null;
  identity_number?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  death_reason_id?: string | null;
  phone?: string | null;
  address?: string | null;
  occupation?: string | null;
  occupation_id?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
};

const emptyForm = {
  id: "",
  father_code: "",
  branch_id: "",
  full_name_ar: "",
  full_name_en: "",
  identity_number: "",
  birth_date: "",
  death_date: "",
  death_reason_id: "",
  phone: "",
  address: "",
  occupation: "",
  occupation_id: "",
  notes: "",
  is_active: true,
};

export default function FathersClient() {
  const [items, setItems] = useState<Father[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  function normalizePermissions(rawPermissions: any): string[] {
    if (!Array.isArray(rawPermissions)) return [];

    return rawPermissions
      .filter((permission) => {
        if (typeof permission === "string") return true;
        return permission?.allowed === true;
      })
      .map((permission) =>
        typeof permission === "string" ? permission : permission?.permission_code
      )
      .filter(Boolean);
  }

  function can(permissionCode: string) {
    return permissions.includes(permissionCode);
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
    const res = await fetch("/api/fathers", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setItems(data.data || []);
    } else {
      toast.error(data.message || "تعذر تحميل بيانات الآباء");
    }
  }

  async function loadNextCode() {
    const res = await fetch("/api/fathers/next-code", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setForm((old) => ({
        ...old,
        father_code: data.data.father_code,
      }));
    }
  }

  useEffect(() => {
    loadCurrentUserPermissions();
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) =>
      `
      ${item.father_code || ""}
      ${item.full_name_ar || ""}
      ${item.identity_number || ""}
      ${item.phone || ""}
      `
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search]);

  async function openCreate() {
    if (!can("fathers.create")) {
      toast.error("ليس لديك صلاحية إضافة الأب");
      return;
    }

    setForm(emptyForm);
    setOpen(true);
    await loadNextCode();
  }

  function openEdit(item: Father) {
    if (!can("fathers.update")) {
      toast.error("ليس لديك صلاحية تعديل بيانات الأب");
      return;
    }

    setForm({
      id: item.id,
      father_code: item.father_code || "",
      branch_id: item.branch_id || "",
      full_name_ar: item.full_name_ar || "",
      full_name_en: item.full_name_en || "",
      identity_number: item.identity_number || "",
      birth_date: item.birth_date ? String(item.birth_date).slice(0, 10) : "",
      death_date: item.death_date ? String(item.death_date).slice(0, 10) : "",
      death_reason_id: item.death_reason_id || "",
      phone: item.phone || "",
      address: item.address || "",
      occupation: item.occupation || "",
      occupation_id: item.occupation_id || "",
      notes: item.notes || "",
      is_active: item.is_active ?? true,
    });

    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    const requiredPermission = form.id ? "fathers.update" : "fathers.create";

    if (!can(requiredPermission)) {
      toast.error("ليس لديك صلاحية تنفيذ هذه العملية");
      return;
    }

    if (!form.branch_id) {
      toast.error("يجب اختيار الفرع");
      return;
    }

    if (!form.full_name_ar) {
      toast.error("يجب إدخال الاسم العربي");
      return;
    }

    setSaving(true);

    await saveEntityWithPolicies({
      url: "/api/fathers",
      method: form.id ? "PUT" : "POST",
      data: form,
      successMessage: "تم الحفظ بنجاح",
      errorMessage: "تعذر حفظ بيانات الأب",
      onSuccess: async () => {
        setOpen(false);
        setForm(emptyForm);
        await load();
      },
    });

    setSaving(false);
  }

  async function remove(id: string) {
    if (!can("fathers.delete")) {
      toast.error("ليس لديك صلاحية حذف الأب");
      return;
    }

    if (!confirm("هل أنت متأكد من حذف سجل الأب؟")) return;

    const res = await fetch(`/api/fathers?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم الحذف بنجاح");
      await load();
    } else {
      toast.error(data.message || "تعذر الحذف");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الآباء</h1>

          <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
            إدارة بيانات الآباء وربطهم بالفروع
          </p>
        </div>

        {permissionsLoaded && can("fathers.create") && (
          <Button
            onClick={openCreate}
            style={{
              backgroundColor: "var(--app-primary)",
              color: "white",
            }}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة أب
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
            placeholder="بحث بالاسم، الرقم، الهوية، الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <DynamicEntityTable
          entityKey="father"
          rows={filtered}
          loading={false}
          emptyMessage="لا توجد بيانات"
          renderValue={(row, field) => {
            if (field.field_name === "is_active") {
              return <Badge>{row.is_active ? "نشط" : "غير نشط"}</Badge>;
            }

            return undefined;
          }}
          actions={(item) => (
            <>
              {permissionsLoaded && can("fathers.update") && (
                <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                  <Pencil className="w-4 h-4" />
                </Button>
              )}

              {permissionsLoaded && can("fathers.delete") && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => remove(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        />
      </div>

      <BaseModal
        open={open}
        title={form.id ? "تعديل بيانات الأب" : "إضافة أب"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          <DynamicEntityForm
            entityKey="father"
            value={form}
            onChange={(nextValue) => setForm(nextValue as typeof emptyForm)}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>

            {((form.id && can("fathers.update")) ||
              (!form.id && can("fathers.create"))) && (
              <Button type="submit" disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ"}
              </Button>
            )}
          </div>
        </form>
      </BaseModal>
    </div>
  );
}