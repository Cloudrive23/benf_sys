"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import BaseModal from "@/app/components/modals/BaseModal";
import AppSection from "@/app/components/shared/AppSection";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import PageHeader from "@/app/components/shared/PageHeader";
import DataPanel from "@/app/components/shared/DataPanel";

type Branch = {
  id: string;
  branch_name_ar: string;
};

type Lookup = {
  id: string;
  name_ar: string;
};

type Guardian = {
  id: string;
  guardian_code: string;
  branch_id: string;
  full_name_ar: string;
  full_name_en?: string | null;
  identity_number?: string | null;
  birth_date?: string | null;
  gender_id?: string | null;
  relationship_type_id?: string | null;
  marital_status_id?: string | null;
  occupation_id?: string | null;
  nationality_id?: string | null;
  health_status_id?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
};

const emptyForm = {
  id: "",
  guardian_code: "",
  branch_id: "",
  full_name_ar: "",
  full_name_en: "",
  identity_number: "",
  birth_date: "",
  gender_id: "",
  relationship_type_id: "",
  marital_status_id: "",
  occupation_id: "",
  nationality_id: "",
  health_status_id: "",
  phone: "",
  address: "",
  notes: "",
  is_active: true,
};

export default function GuardiansClient() {
  const [items, setItems] = useState<Guardian[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [genders, setGenders] = useState<Lookup[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<Lookup[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<Lookup[]>([]);
  const [occupations, setOccupations] = useState<Lookup[]>([]);
  const [nationalities, setNationalities] = useState<Lookup[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<Lookup[]>([]);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/guardians", { cache: "no-store" });
    const data = await res.json();

    if (data.success) setItems(data.data || []);
    else toast.error(data.message || "تعذر تحميل بيانات المعيلين");
  }

  async function loadBranches() {
    const res = await fetch("/api/org/branches", { cache: "no-store" });
    const data = await res.json();

    if (data.success) setBranches(data.data || []);
  }

  async function loadLookup(type: string, setter: (items: Lookup[]) => void) {
    const res = await fetch(`/api/lookups?type=${type}`, { cache: "no-store" });
    const data = await res.json();

    if (data.success) setter(data.data || []);
  }

  async function loadNextCode() {
    const res = await fetch("/api/guardians/next-code", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      setForm((old) => ({
        ...old,
        guardian_code: data.data.guardian_code,
      }));
    }
  }

  useEffect(() => {
    load();
    loadBranches();
    loadLookup("genders", setGenders);
    loadLookup("relationship_types", setRelationshipTypes);
    loadLookup("marital_status", setMaritalStatuses);
    loadLookup("occupations", setOccupations);
    loadLookup("nationalities", setNationalities);
    loadLookup("health_statuses", setHealthStatuses);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) =>
      `${item.guardian_code} ${item.full_name_ar} ${item.identity_number || ""} ${item.phone || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search]);

  function getLookupName(list: Lookup[], id?: string | null) {
    if (!id) return "-";
    return list.find((x) => x.id === id)?.name_ar || "-";
  }

  function getBranchName(id: string) {
    return branches.find((b) => b.id === id)?.branch_name_ar || "-";
  }

  async function openCreate() {
    if (branches.length === 0) {
      toast.error("يجب إضافة فرع أولًا");
      return;
    }

    setForm({
      ...emptyForm,
      branch_id: branches[0]?.id || "",
    });

    setOpen(true);
    await loadNextCode();
  }

  function openEdit(item: Guardian) {
    setForm({
      id: item.id,
      guardian_code: item.guardian_code,
      branch_id: item.branch_id,
      full_name_ar: item.full_name_ar || "",
      full_name_en: item.full_name_en || "",
      identity_number: item.identity_number || "",
      birth_date: item.birth_date ? item.birth_date.slice(0, 10) : "",
      gender_id: item.gender_id || "",
      relationship_type_id: item.relationship_type_id || "",
      marital_status_id: item.marital_status_id || "",
      occupation_id: item.occupation_id || "",
      nationality_id: item.nationality_id || "",
      health_status_id: item.health_status_id || "",
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

    setSaving(true);

    const res = await fetch("/api/guardians", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم الحفظ بنجاح");
      setOpen(false);
      setForm(emptyForm);
      await load();
    } else {
      toast.error(data.message || "تعذر حفظ البيانات");
    }

    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("هل أنت متأكد من حذف سجل المعيل؟")) return;

    const res = await fetch(`/api/guardians?id=${id}`, { method: "DELETE" });
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
      <PageHeader
		  title="إدارة المعيلين"
		  description="إدارة بيانات المعيلين وربطهم بالفروع والقيم المرجعية"
		  action={
			<Button
			  onClick={openCreate}
			  style={{
				backgroundColor: "var(--app-primary)",
				color: "white",
			  }}
			>
			  <Plus className="w-4 h-4 ml-2" />
			  إضافة معيل
			</Button>
		  }
		/>

      <DataPanel>
        <div className="relative max-w-xl">
          <Search className="absolute right-3 top-3 w-4 h-4 opacity-60" />
          <Input
            className="pr-10"
            placeholder="بحث بالاسم، الرقم، الهوية، الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--app-border)" }}>
                <th className="p-3 text-right">رقم المعيل</th>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">الفرع</th>
                <th className="p-3 text-right">الهوية</th>
                <th className="p-3 text-right">نوع القرابة</th>
                <th className="p-3 text-right">المهنة</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-left">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center" style={{ color: "var(--app-muted)" }}>
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-white/5 transition"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    <td className="p-3 font-semibold">{item.guardian_code}</td>
                    <td className="p-3">{item.full_name_ar}</td>
                    <td className="p-3">{getBranchName(item.branch_id)}</td>
                    <td className="p-3">{item.identity_number || "-"}</td>
                    <td className="p-3">{getLookupName(relationshipTypes, item.relationship_type_id)}</td>
                    <td className="p-3">{getLookupName(occupations, item.occupation_id)}</td>
                    <td className="p-3">
                      <Badge>{item.is_active ? "نشط" : "غير نشط"}</Badge>
                    </td>
                    <td className="p-3 text-left space-x-2 space-x-reverse">
                      <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button size="sm" variant="destructive" onClick={() => remove(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DataPanel>

      <BaseModal
        open={open}
        title={form.id ? "تعديل بيانات المعيل" : "إضافة معيل"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-6">
          <AppSection title="البيانات الأساسية">
            <Field label="رقم المعيل">
              <Input readOnly value={form.guardian_code} />
            </Field>

            <Field label="الفرع">
              <select
                required
                className="w-full rounded-xl border bg-transparent p-3"
                value={form.branch_id}
                onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
              >
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name_ar}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="الاسم العربي">
              <Input
                required
                value={form.full_name_ar}
                onChange={(e) => setForm({ ...form, full_name_ar: e.target.value })}
              />
            </Field>

            <Field label="الاسم الإنجليزي">
              <Input
                value={form.full_name_en}
                onChange={(e) => setForm({ ...form, full_name_en: e.target.value })}
              />
            </Field>

            <Field label="تاريخ الميلاد">
              <Input
                type="date"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
              />
            </Field>

            <Field label="الجنس">
              <Select
                value={form.gender_id}
                onChange={(value) => setForm({ ...form, gender_id: value })}
                placeholder="اختر الجنس"
                items={genders}
              />
            </Field>
          </AppSection>

          <AppSection title="بيانات الهوية">
            <Field label="رقم الهوية">
              <Input
                value={form.identity_number}
                onChange={(e) => setForm({ ...form, identity_number: e.target.value })}
              />
            </Field>

            <Field label="الجنسية">
              <Select
                value={form.nationality_id}
                onChange={(value) => setForm({ ...form, nationality_id: value })}
                placeholder="اختر الجنسية"
                items={nationalities}
              />
            </Field>
          </AppSection>

          <AppSection title="البيانات الاجتماعية">
            <Field label="نوع القرابة">
              <Select
                value={form.relationship_type_id}
                onChange={(value) => setForm({ ...form, relationship_type_id: value })}
                placeholder="اختر نوع القرابة"
                items={relationshipTypes}
              />
            </Field>

            <Field label="الحالة الاجتماعية">
              <Select
                value={form.marital_status_id}
                onChange={(value) => setForm({ ...form, marital_status_id: value })}
                placeholder="اختر الحالة الاجتماعية"
                items={maritalStatuses}
              />
            </Field>

            <Field label="المهنة">
              <Select
                value={form.occupation_id}
                onChange={(value) => setForm({ ...form, occupation_id: value })}
                placeholder="اختر المهنة"
                items={occupations}
              />
            </Field>

            <Field label="الحالة الصحية">
              <Select
                value={form.health_status_id}
                onChange={(value) => setForm({ ...form, health_status_id: value })}
                placeholder="اختر الحالة الصحية"
                items={healthStatuses}
              />
            </Field>
          </AppSection>

          <AppSection title="التواصل والملاحظات">
            <Field label="الهاتف">
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>

            <Field label="العنوان">
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="ملاحظات">
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
            </div>
          </AppSection>

          <div
            className="rounded-2xl border p-4 flex items-center justify-between"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "rgba(255,255,255,0.03)",
            }}
          >
            <div>
              <div className="font-bold">حالة السجل</div>
              <div className="text-sm" style={{ color: "var(--app-muted)" }}>
                يمكن تعطيل المعيل دون حذفه من النظام.
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              نشط
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold" style={{ color: "var(--app-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  items: Lookup[];
}) {
  return (
    <select
      className="w-full rounded-xl border bg-transparent p-3"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.name_ar}
        </option>
      ))}
    </select>
  );
}