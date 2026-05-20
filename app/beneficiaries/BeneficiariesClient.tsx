"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Beneficiary = {
  id: string;
  beneficiary_code: string;
  file_number?: string | null;
  full_name?: string | null;
  gender?: string | null;
  phone?: string | null;
  current_status?: string | null;
};

const emptyForm = {
  id: "",
  beneficiary_code: "",
  file_number: "",
  external_reference: "",
  first_name: "",
  father_name: "",
  grandfather_name: "",
  family_name: "",
  gender: "male",
  birth_date: "",
  identity_number: "",
  phone: "",
  address: "",
  beneficiary_type: "orphan",
  current_status: "draft",
  is_active: true,
};

export default function BeneficiariesClient() {
  const [items, setItems] = useState<Beneficiary[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/beneficiaries", { cache: "no-store" });
    const data = await res.json();

    if (data.success) setItems(data.data || []);
    else toast.error(data.message || "تعذر تحميل البيانات");
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((x) =>
      `${x.beneficiary_code} ${x.file_number || ""} ${x.full_name || ""} ${x.phone || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search]);

  function edit(item: any) {
    setForm({
      ...emptyForm,
      id: item.id,
      beneficiary_code: item.beneficiary_code || "",
      file_number: item.file_number || "",
      first_name: item.first_name || "",
      father_name: item.father_name || "",
      grandfather_name: item.grandfather_name || "",
      family_name: item.family_name || "",
      gender: item.gender || "male",
      phone: item.phone || "",
      address: item.address || "",
      current_status: item.current_status || "draft",
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/beneficiaries", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      toast.success("تم حفظ بيانات المستفيد بنجاح");
      setOpen(false);
      setForm(emptyForm);
      await load();
    } else {
      toast.error(data.message || "فشل الحفظ");
      console.log(data);
    }

    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("هل أنت متأكد من حذف المستفيد؟")) return;

    const res = await fetch(`/api/beneficiaries?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      toast.success("تم الحذف بنجاح");
      await load();
    } else {
      toast.error(data.message || "فشل الحذف");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستفيدين</h1>
          <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
            تسجيل ومتابعة بيانات المستفيدين
          </p>
        </div>

        <Button
          onClick={() => {
            setForm(emptyForm);
            setOpen(true);
          }}
          style={{ backgroundColor: "var(--app-primary)", color: "white" }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة مستفيد
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
            placeholder="بحث بالاسم، رقم المستفيد، رقم الملف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--app-border)" }}>
                <th className="p-3 text-right">رقم المستفيد</th>
                <th className="p-3 text-right">رقم الملف</th>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">الجنس</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-left">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center" style={{ color: "var(--app-muted)" }}>
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                filtered.map((item: any) => (
                  <tr key={item.id} className="border-b" style={{ borderColor: "var(--app-border)" }}>
                    <td className="p-3">{item.beneficiary_code}</td>
                    <td className="p-3">{item.file_number || "-"}</td>
                    <td className="p-3">{item.full_name || "-"}</td>
                    <td className="p-3">{item.gender === "female" ? "أنثى" : "ذكر"}</td>
                    <td className="p-3">{item.phone || "-"}</td>
                    <td className="p-3">
                      <Badge>{item.current_status || "draft"}</Badge>
                    </td>
                    <td className="p-3 text-left space-x-2 space-x-reverse">
                      <Button size="sm" variant="outline" onClick={() => edit(item)}>
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

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div
            className="w-full max-w-4xl rounded-2xl border p-6 space-y-5"
            style={{
              backgroundColor: "var(--app-surface)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {form.id ? "تعديل مستفيد" : "إضافة مستفيد"}
              </h2>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input required placeholder="رقم المستفيد" value={form.beneficiary_code} onChange={(e) => setForm({ ...form, beneficiary_code: e.target.value })} />
                <Input required placeholder="رقم الملف" value={form.file_number} onChange={(e) => setForm({ ...form, file_number: e.target.value })} />
                <Input placeholder="الرقم الخارجي" value={form.external_reference} onChange={(e) => setForm({ ...form, external_reference: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input required placeholder="الاسم الأول" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                <Input required placeholder="اسم الأب" value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} />
                <Input placeholder="اسم الجد" value={form.grandfather_name} onChange={(e) => setForm({ ...form, grandfather_name: e.target.value })} />
                <Input required placeholder="اللقب" value={form.family_name} onChange={(e) => setForm({ ...form, family_name: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select className="rounded-md border bg-transparent p-2" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
                <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                <Input placeholder="رقم الهوية" value={form.identity_number} onChange={(e) => setForm({ ...form, identity_number: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                <Input placeholder="العنوان" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
