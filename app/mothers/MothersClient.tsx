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

type Mother = {
  id: string;
  mother_code: string;
  branch_id: string;
  full_name_ar: string;
  full_name_en?: string | null;
  identity_number?: string | null;
  birth_date?: string | null;
  death_date?: string | null;
  death_reason_id?: string | null;
  marital_status_id?: string | null;
  gender_id?: string | null;
  occupation_id?: string | null;
  nationality_id?: string | null;
  health_status_id?: string | null;
  is_guardian?: boolean | null;
  is_alive?: boolean | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
};

const emptyForm = {
  id: "",
  mother_code: "",
  branch_id: "",
  full_name_ar: "",
  full_name_en: "",
  identity_number: "",
  birth_date: "",
  death_date: "",
  death_reason_id: "",
  marital_status_id: "",
  gender_id: "",
  occupation_id: "",
  nationality_id: "",
  health_status_id: "",
  is_guardian: false,
  is_alive: true,
  phone: "",
  address: "",
  notes: "",
  is_active: true,
};

export default function MothersClient() {
  const [items, setItems] = useState<Mother[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/mothers", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setItems(data.data || []);
    } else {
      toast.error(data.message || "تعذر تحميل بيانات الأمهات");
    }
  }

  async function loadNextCode() {
    const res = await fetch("/api/mothers/next-code", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setForm((old) => ({
        ...old,
        mother_code: data.data.mother_code,
      }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) =>
      `
      ${item.mother_code || ""}
      ${item.full_name_ar || ""}
      ${item.identity_number || ""}
      ${item.phone || ""}
      `
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search]);

  async function openCreate() {
    setForm(emptyForm);
    setOpen(true);
    await loadNextCode();
  }

  function openEdit(item: Mother) {
    setForm({
      id: item.id,
      mother_code: item.mother_code || "",
      branch_id: item.branch_id || "",
      full_name_ar: item.full_name_ar || "",
      full_name_en: item.full_name_en || "",
      identity_number: item.identity_number || "",
      birth_date: item.birth_date ? String(item.birth_date).slice(0, 10) : "",
      death_date: item.death_date ? String(item.death_date).slice(0, 10) : "",
      death_reason_id: item.death_reason_id || "",
      marital_status_id: item.marital_status_id || "",
      gender_id: item.gender_id || "",
      occupation_id: item.occupation_id || "",
      nationality_id: item.nationality_id || "",
      health_status_id: item.health_status_id || "",
      is_guardian: item.is_guardian ?? false,
      is_alive: item.is_alive ?? true,
      phone: item.phone || "",
      address: item.address || "",
      notes: item.notes || "",
      is_active: item.is_active ?? true,
    });

    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

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
      url: "/api/mothers",
      method: form.id ? "PUT" : "POST",
      data: form,
      successMessage: "تم الحفظ بنجاح",
      errorMessage: "تعذر حفظ بيانات الأم",
      onSuccess: async () => {
        setOpen(false);
        setForm(emptyForm);
        await load();
      },
    });

    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("هل أنت متأكد من حذف سجل الأم؟")) return;

    const res = await fetch(`/api/mothers?id=${id}`, {
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
          <h1 className="text-3xl font-bold">إدارة الأمهات</h1>

          <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
            إدارة بيانات الأمهات وربطها بالفروع والقوائم المرجعية
          </p>
        </div>

        <Button
          onClick={openCreate}
          style={{
            backgroundColor: "var(--app-primary)",
            color: "white",
          }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة أم
        </Button>
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
          entityKey="mother"
          rows={filtered}
          loading={false}
          emptyMessage="لا توجد بيانات"
          renderValue={(row, field) => {
            if (field.field_name === "is_active") {
              return <Badge>{row.is_active ? "نشط" : "غير نشط"}</Badge>;
            }

            if (field.field_name === "is_alive") {
              return <Badge>{row.is_alive ? "على قيد الحياة" : "متوفية"}</Badge>;
            }

            if (field.field_name === "is_guardian") {
              return row.is_guardian ? "نعم" : "لا";
            }

            return undefined;
          }}
          actions={(item) => (
            <>
              <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                <Pencil className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => remove(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        />
      </div>

      <BaseModal
        open={open}
        title={form.id ? "تعديل بيانات الأم" : "إضافة أم"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          <DynamicEntityForm
            entityKey="mother"
            value={form}
            onChange={(nextValue) => setForm(nextValue as typeof emptyForm)}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>

            <Button type="submit" disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        </form>
      </BaseModal>
    </div>
  );
}