"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LookupValuesClient() {
  const [types, setTypes] = useState<any[]>([]);
  const [values, setValues] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    id: "",
    lookup_type: "",
    code: "",
    name_ar: "",
    name_en: "",
    notes: "",
    sort_order: 0,
    is_active: true,
  });

  async function loadTypes() {
    const res = await fetch("/api/lookup-types", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      setTypes(data.data || []);

      if (!selectedType && data.data?.length) {
        setSelectedType(data.data[0].type_code);
      }
    }
  }

  async function loadValues(type: string) {
    if (!type) return;

    const res = await fetch(`/api/lookups?type=${type}`, {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setValues(data.data || []);
    }
  }

  useEffect(() => {
    loadTypes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      loadValues(selectedType);
    }
  }, [selectedType]);

  function resetForm() {
    setForm({
      id: "",
      lookup_type: selectedType,
      code: "تلقائي",
      name_ar: "",
      name_en: "",
      notes: "",
      sort_order: 0,
      is_active: true,
    });
  }

  async function save() {
    const res = await fetch("/api/lookups", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lookup_type: selectedType,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.message || "فشل الحفظ");
      return;
    }

    toast.success("تم الحفظ بنجاح");
    setOpen(false);
    resetForm();
    loadValues(selectedType);
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">قيم القوائم</h1>

        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          disabled={!selectedType}
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة قيمة
        </Button>
      </div>

      <div className="rounded-xl border p-4">
        <label className="text-sm block mb-2">نوع القائمة</label>

        <select
          className="w-full rounded-md border bg-transparent p-2"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          {types.map((type) => (
            <option key={type.id} value={type.type_code}>
              {type.type_name_ar} - {type.type_code}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-right">الكود</th>
              <th className="p-3 text-right">الاسم العربي</th>
              <th className="p-3 text-right">الترتيب</th>
              <th className="p-3 text-right">الحالة</th>
              <th className="p-3 text-right">الإجراءات</th>
            </tr>
          </thead>

          <tbody>
            {values.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.code}</td>
                <td className="p-3">{item.name_ar}</td>
                <td className="p-3">{item.sort_order}</td>
                <td className="p-3">
                  {item.is_active ? "نشط" : "موقف"}
                </td>
                <td className="p-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm({
                        id: item.id,
                        lookup_type: item.lookup_type,
                        code: item.code,
                        name_ar: item.name_ar,
                        name_en: item.name_en || "",
                        notes: item.notes || "",
                        sort_order: item.sort_order || 0,
                        is_active: item.is_active,
                      });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}

            {values.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center opacity-70">
                  لا توجد قيم لهذا النوع
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BaseModal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "تعديل قيمة" : "إضافة قيمة"}
      >
        <div className="space-y-4">

          <Input
			  readOnly
			  placeholder="يتم توليده تلقائيًا"
			  value={form.code || "تلقائي"}
			/>

          <Input
            placeholder="الاسم العربي"
            value={form.name_ar}
            onChange={(e) =>
              setForm({ ...form, name_ar: e.target.value })
            }
          />

          <Input
            placeholder="الاسم الإنجليزي"
            value={form.name_en}
            onChange={(e) =>
              setForm({ ...form, name_en: e.target.value })
            }
          />

          <Input
            placeholder="ملاحظات"
            value={form.notes}
            onChange={(e) =>
              setForm({ ...form, notes: e.target.value })
            }
          />

          <Input
            type="number"
            placeholder="الترتيب"
            value={form.sort_order}
            onChange={(e) =>
              setForm({ ...form, sort_order: Number(e.target.value) })
            }
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
            />
            نشط
          </label>

          <div className="flex justify-end">
            <Button onClick={save}>حفظ</Button>
          </div>

        </div>
      </BaseModal>
    </div>
  );
}