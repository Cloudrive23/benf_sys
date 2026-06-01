"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Plus, Pencil, Trash2 } from "lucide-react";

import BaseModal from "@/app/components/modals/BaseModal";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const titles: Record<string, string> = {
  governorates: "المحافظات",
  districts: "المديريات",
  marital_status: "الحالات الاجتماعية",
  death_reasons: "أسباب الوفاة",
  housing_types: "أنواع السكن",
  disability_types: "أنواع الإعاقات",
  relationship_types: "أنواع القرابة",
  genders: "الجنس",
  occupations: "المهن",
  nationalities: "الجنسيات",
  education_levels: "المستويات التعليمية",
  health_statuses: "الحالات الصحية",
};

export default function LookupClient({
  type,
}: {
  type: string;
}) {
  const [items, setItems] = useState<any[]>([]);

  const [open, setOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id: "",
    code: "",
    name_ar: "",
    name_en: "",
    notes: "",
    sort_order: 0,
    is_active: true,
  });

  async function load() {
    const res = await fetch(`/api/lookups?type=${type}`, {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setItems(data.data || []);
    }
  }

  useEffect(() => {
    load();
  }, [type]);

  function openCreate() {
    setForm({
      id: "",
      code: "",
      name_ar: "",
      name_en: "",
      notes: "",
      sort_order: 0,
      is_active: true,
    });

    setOpen(true);
  }

  function openEdit(item: any) {
    setForm({
      id: item.id,
      code: item.code || "",
      name_ar: item.name_ar || "",
      name_en: item.name_en || "",
      notes: item.notes || "",
      sort_order: item.sort_order || 0,
      is_active: item.is_active ?? true,
    });

    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const res = await fetch("/api/lookups", {
      method: form.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        lookup_type: type,
      }),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message);

      setOpen(false);

      await load();
    } else {
      toast.error(data.message);
    }

    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("هل أنت متأكد؟")) return;

    const res = await fetch(`/api/lookups?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message);

      await load();
    } else {
      toast.error(data.message);
    }
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            {titles[type] || type}
          </h1>
        </div>

        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 ml-2" />
          إضافة
        </Button>

      </div>

      <div className="rounded-2xl border overflow-hidden">

        <table className="w-full text-sm">

          <thead className="border-b">

            <tr>
              <th className="p-3 text-right">الكود</th>
              <th className="p-3 text-right">الاسم</th>
              <th className="p-3 text-right">الترتيب</th>
              <th className="p-3 text-left">الإجراءات</th>
            </tr>

          </thead>

          <tbody>

            {items.map((item) => (
              <tr key={item.id} className="border-b">

                <td className="p-3">
                  {item.code || "-"}
                </td>

                <td className="p-3">
                  {item.name_ar}
                </td>

                <td className="p-3">
                  {item.sort_order}
                </td>

                <td className="p-3 text-left space-x-2 space-x-reverse">

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(item)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      <BaseModal
        open={open}
        title="إدارة البيانات"
        onClose={() => setOpen(false)}
      >

        <form onSubmit={save} className="space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-sm">
                الكود
              </label>

              <Input
				  readOnly
				  value={form.code}
				  placeholder="يتم توليده تلقائيًا عند الحفظ"
			  />
            </div>

            <div>
              <label className="text-sm">
                الاسم العربي
              </label>

              <Input
                required
                value={form.name_ar}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name_ar: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm">
                الاسم الإنجليزي
              </label>

              <Input
                value={form.name_en}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name_en: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="text-sm">
                الترتيب
              </label>

              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sort_order: Number(e.target.value),
                  })
                }
              />
            </div>

          </div>

          <div className="flex justify-end gap-3 pt-4">

            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              إلغاء
            </Button>

            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? "جاري الحفظ..." : "حفظ"}
            </Button>

          </div>

        </form>

      </BaseModal>

    </div>
  );
}