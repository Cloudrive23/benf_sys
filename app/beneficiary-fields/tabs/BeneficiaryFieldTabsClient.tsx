"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BaseModal from "@/app/components/modals/BaseModal";

export default function BeneficiaryFieldTabsClient() {
  const [tabs, setTabs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    id: "",
    tab_code: "",
    tab_name_ar: "",
    tab_name_en: "",
    sort_order: 0,
    is_active: true,
  });

  async function loadData() {
    const res = await fetch("/api/beneficiary-field-tabs");
    const data = await res.json();

    if (data.success) {
      setTabs(data.data || []);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm({
      id: "",
      tab_code: "",
      tab_name_ar: "",
      tab_name_en: "",
      sort_order: 0,
      is_active: true,
    });
  }

  async function save() {
    const isEdit = !!form.id;

    const res = await fetch("/api/beneficiary-field-tabs", {
      method: isEdit ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          تبويبات بيانات المستفيد
        </h1>

        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة تبويب
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
	   <div className="overflow-x-auto">
		<table className="w-full min-w-[800px]">
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
            {tabs.map((tab) => (
              <tr key={tab.id} className="border-b">
                <td className="p-3">{tab.tab_code}</td>
                <td className="p-3">{tab.tab_name_ar}</td>
                <td className="p-3">{tab.sort_order}</td>
                <td className="p-3">
                  {tab.is_active ? "نشط" : "موقف"}
                </td>

                <td className="p-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm({
                        id: tab.id,
                        tab_code: tab.tab_code,
                        tab_name_ar: tab.tab_name_ar,
                        tab_name_en: tab.tab_name_en || "",
                        sort_order: tab.sort_order || 0,
                        is_active: tab.is_active,
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
	</div>

      <BaseModal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "تعديل تبويب" : "إضافة تبويب"}
      >
        <div className="space-y-4">

          <Input
            placeholder="الكود (social)"
            value={form.tab_code}
            onChange={(e) =>
              setForm({
                ...form,
                tab_code: e.target.value,
              })
            }
          />

          <Input
            placeholder="الاسم العربي"
            value={form.tab_name_ar}
            onChange={(e) =>
              setForm({
                ...form,
                tab_name_ar: e.target.value,
              })
            }
          />

          <Input
            placeholder="الاسم الإنجليزي"
            value={form.tab_name_en}
            onChange={(e) =>
              setForm({
                ...form,
                tab_name_en: e.target.value,
              })
            }
          />

          <Input
            type="number"
            placeholder="الترتيب"
            value={form.sort_order}
            onChange={(e) =>
              setForm({
                ...form,
                sort_order: Number(e.target.value),
              })
            }
          />

          <div className="flex justify-end">
            <Button onClick={save}>
              حفظ
            </Button>
          </div>

        </div>
      </BaseModal>

    </div>
  );
}