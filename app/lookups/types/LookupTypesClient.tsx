"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LookupTypesClient() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    id: "",
    type_code: "",
    type_name_ar: "",
    type_name_en: "",
    sort_order: 0,
    is_active: true,
  });

  async function loadData() {
    const res = await fetch("/api/lookup-types", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      setItems(data.data || []);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm({
      id: "",
      type_code: "",
      type_name_ar: "",
      type_name_en: "",
      sort_order: 0,
      is_active: true,
    });
  }

  async function save() {
    const res = await fetch("/api/lookup-types", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.message || "فشل الحفظ");
      return;
    }

    toast.success("تم الحفظ بنجاح");
    setOpen(false);
    resetForm();
    loadData();
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">أنواع القوائم</h1>

        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة نوع قائمة
        </Button>
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
            {items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.type_code}</td>
                <td className="p-3">{item.type_name_ar}</td>
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
                        type_code: item.type_code,
                        type_name_ar: item.type_name_ar,
                        type_name_en: item.type_name_en || "",
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
          </tbody>
        </table>
      </div>

      <BaseModal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "تعديل نوع قائمة" : "إضافة نوع قائمة"}
      >
        <div className="space-y-4">

          <Input
			  placeholder="الكود مثل: health_statuses"
			  value={form.type_code}
			  onChange={(e) =>
				setForm({ ...form, type_code: e.target.value })
			  }
			/>

          <Input
            placeholder="الاسم العربي"
            value={form.type_name_ar}
            onChange={(e) =>
              setForm({ ...form, type_name_ar: e.target.value })
            }
          />

          <Input
            placeholder="الاسم الإنجليزي"
            value={form.type_name_en}
            onChange={(e) =>
              setForm({ ...form, type_name_en: e.target.value })
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