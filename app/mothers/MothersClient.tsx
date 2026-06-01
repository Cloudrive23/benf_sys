"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Branch = { id: string; branch_name_ar: string };
type Lookup = { id: string; name_ar: string };

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
  const [branches, setBranches] = useState<Branch[]>([]);

  const [deathReasons, setDeathReasons] = useState<Lookup[]>([]);
  const [maritalStatuses, setMaritalStatuses] = useState<Lookup[]>([]);
  const [genders, setGenders] = useState<Lookup[]>([]);
  const [occupations, setOccupations] = useState<Lookup[]>([]);
  const [nationalities, setNationalities] = useState<Lookup[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<Lookup[]>([]);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/mothers", { cache: "no-store" });
    const data = await res.json();

    if (data.success) setItems(data.data || []);
    else toast.error(data.message || "تعذر تحميل بيانات الأمهات");
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
    const res = await fetch("/api/mothers/next-code", { cache: "no-store" });
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
    loadBranches();
    loadLookup("death_reasons", setDeathReasons);
    loadLookup("marital_status", setMaritalStatuses);
    loadLookup("genders", setGenders);
    loadLookup("occupations", setOccupations);
    loadLookup("nationalities", setNationalities);
    loadLookup("health_statuses", setHealthStatuses);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) =>
      `${item.mother_code} ${item.full_name_ar} ${item.identity_number || ""} ${item.phone || ""}`
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

  function openEdit(item: Mother) {
    setForm({
      id: item.id,
      mother_code: item.mother_code,
      branch_id: item.branch_id,
      full_name_ar: item.full_name_ar || "",
      full_name_en: item.full_name_en || "",
      identity_number: item.identity_number || "",
      birth_date: item.birth_date ? item.birth_date.slice(0, 10) : "",
      death_date: item.death_date ? item.death_date.slice(0, 10) : "",
      death_reason_id: item.death_reason_id || "",
      marital_status_id: item.marital_status_id || "",
      gender_id: item.gender_id || "",
      occupation_id: item.occupation_id || "",
      nationality_id: item.nationality_id || "",
      health_status_id: item.health_status_id || "",
      is_guardian: Boolean(item.is_guardian),
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

    setSaving(true);

    const res = await fetch("/api/mothers", {
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
    if (!confirm("هل أنت متأكد من حذف سجل الأم؟")) return;

    const res = await fetch(`/api/mothers?id=${id}`, { method: "DELETE" });
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
            إدارة بيانات الأمهات وربطهن بالفروع
          </p>
        </div>

        <Button onClick={openCreate} style={{ backgroundColor: "var(--app-primary)", color: "white" }}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة أم
        </Button>
      </div>

      <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)" }}>
        <div className="relative max-w-lg">
          <Search className="absolute right-3 top-3 w-4 h-4 opacity-60" />
          <Input className="pr-10" placeholder="بحث بالاسم، الرقم، الهوية، الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--app-border)" }}>
                <th className="p-3 text-right">رقم الأم</th>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">الفرع</th>
                <th className="p-3 text-right">الهوية</th>
                <th className="p-3 text-right">الحالة الاجتماعية</th>
                <th className="p-3 text-right">معيل؟</th>
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
                  <tr key={item.id} className="border-b" style={{ borderColor: "var(--app-border)" }}>
                    <td className="p-3">{item.mother_code}</td>
                    <td className="p-3">{item.full_name_ar}</td>
                    <td className="p-3">{getBranchName(item.branch_id)}</td>
                    <td className="p-3">{item.identity_number || "-"}</td>
                    <td className="p-3">{getLookupName(maritalStatuses, item.marital_status_id)}</td>
                    <td className="p-3">{item.is_guardian ? "نعم" : "لا"}</td>
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
      </div>

      <BaseModal open={open} title={form.id ? "تعديل بيانات الأم" : "إضافة أم"} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="رقم الأم">
              <Input readOnly value={form.mother_code} />
            </Field>

            <Field label="الفرع">
              <select required className="w-full rounded-md border bg-transparent p-2" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name_ar}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="الاسم العربي">
              <Input required value={form.full_name_ar} onChange={(e) => setForm({ ...form, full_name_ar: e.target.value })} />
            </Field>

            <Field label="الاسم الإنجليزي">
              <Input value={form.full_name_en} onChange={(e) => setForm({ ...form, full_name_en: e.target.value })} />
            </Field>

            <Field label="رقم الهوية">
              <Input value={form.identity_number} onChange={(e) => setForm({ ...form, identity_number: e.target.value })} />
            </Field>

            <Field label="تاريخ الميلاد">
              <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </Field>

            <Field label="على قيد الحياة">
              <select className="w-full rounded-md border bg-transparent p-2" value={form.is_alive ? "yes" : "no"} onChange={(e) => setForm({ ...form, is_alive: e.target.value === "yes" })}>
                <option value="yes">نعم</option>
                <option value="no">لا</option>
              </select>
            </Field>

            {!form.is_alive && (
              <>
                <Field label="تاريخ الوفاة">
                  <Input type="date" value={form.death_date} onChange={(e) => setForm({ ...form, death_date: e.target.value })} />
                </Field>

                <Field label="سبب الوفاة">
                  <select className="w-full rounded-md border bg-transparent p-2" value={form.death_reason_id} onChange={(e) => setForm({ ...form, death_reason_id: e.target.value })}>
                    <option value="">اختر سبب الوفاة</option>
                    {deathReasons.map((item) => (
                      <option key={item.id} value={item.id}>{item.name_ar}</option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            <Field label="الحالة الاجتماعية">
              <select className="w-full rounded-md border bg-transparent p-2" value={form.marital_status_id} onChange={(e) => setForm({ ...form, marital_status_id: e.target.value })}>
                <option value="">اختر الحالة الاجتماعية</option>
                {maritalStatuses.map((item) => (
                  <option key={item.id} value={item.id}>{item.name_ar}</option>
                ))}
              </select>
            </Field>

            <Field label="الجنس">
              <select className="w-full rounded-md border bg-transparent p-2" value={form.gender_id} onChange={(e) => setForm({ ...form, gender_id: e.target.value })}>
                <option value="">اختر الجنس</option>
                {genders.map((item) => (
                  <option key={item.id} value={item.id}>{item.name_ar}</option>
                ))}
              </select>
            </Field>

            <Field label="المهنة">
              <select className="w-full rounded-md border bg-transparent p-2" value={form.occupation_id} onChange={(e) => setForm({ ...form, occupation_id: e.target.value })}>
                <option value="">اختر المهنة</option>
                {occupations.map((item) => (
                  <option key={item.id} value={item.id}>{item.name_ar}</option>
                ))}
              </select>
            </Field>

            <Field label="الجنسية">
              <select className="w-full rounded-md border bg-transparent p-2" value={form.nationality_id} onChange={(e) => setForm({ ...form, nationality_id: e.target.value })}>
                <option value="">اختر الجنسية</option>
                {nationalities.map((item) => (
                  <option key={item.id} value={item.id}>{item.name_ar}</option>
                ))}
              </select>
            </Field>

            <Field label="الحالة الصحية">
              <select className="w-full rounded-md border bg-transparent p-2" value={form.health_status_id} onChange={(e) => setForm({ ...form, health_status_id: e.target.value })}>
                <option value="">اختر الحالة الصحية</option>
                {healthStatuses.map((item) => (
                  <option key={item.id} value={item.id}>{item.name_ar}</option>
                ))}
              </select>
            </Field>

            <Field label="الهاتف">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>

            <Field label="هل الأم هي المعيل؟">
              <select className="w-full rounded-md border bg-transparent p-2" value={form.is_guardian ? "yes" : "no"} onChange={(e) => setForm({ ...form, is_guardian: e.target.value === "yes" })}>
                <option value="no">لا</option>
                <option value="yes">نعم</option>
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="العنوان">
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="ملاحظات">
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Field>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            نشط
          </label>

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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm">{label}</label>
      {children}
    </div>
  );
}