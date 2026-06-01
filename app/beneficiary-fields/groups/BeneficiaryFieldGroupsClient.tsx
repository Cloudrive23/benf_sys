"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BeneficiaryFieldGroupsClient() {
  const [groups, setGroups] = useState<any[]>([]);
  const [tabs, setTabs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    id: "",
    tab_id: "",
    group_code: "",
    group_name_ar: "",
    group_name_en: "",
    sort_order: 0,
    is_active: true,
  });

  async function loadData() {
    const [g, t] = await Promise.all([
      fetch("/api/beneficiary-field-groups").then(r => r.json()),
      fetch("/api/beneficiary-field-tabs").then(r => r.json()),
    ]);

    if (g.success) setGroups(g.data || []);
    if (t.success) setTabs(t.data || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm({
      id: "",
      tab_id: "",
      group_code: "",
      group_name_ar: "",
      group_name_en: "",
      sort_order: 0,
      is_active: true,
    });
  }

  async function save() {
    const res = await fetch("/api/beneficiary-field-groups", {
      method: form.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.message);
      return;
    }

    toast.success("تم الحفظ");
    setOpen(false);
    loadData();
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">
          مجموعات بيانات المستفيد
        </h1>

        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة مجموعة
        </Button>
      </div>

      <table className="w-full border">
        <thead>
          <tr>
            <th>التبويب</th>
            <th>الكود</th>
            <th>الاسم</th>
            <th>الترتيب</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {groups.map((g) => (
            <tr key={g.id}>
              <td>{g.tab?.tab_name_ar}</td>
              <td>{g.group_code}</td>
              <td>{g.group_name_ar}</td>
              <td>{g.sort_order}</td>

              <td>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setForm({
                      id: g.id,
                      tab_id: g.tab_id || "",
                      group_code: g.group_code,
                      group_name_ar: g.group_name_ar,
                      group_name_en: g.group_name_en || "",
                      sort_order: g.sort_order,
                      is_active: g.is_active,
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

      <BaseModal
        open={open}
        onClose={() => setOpen(false)}
        title="المجموعة"
      >
        <div className="space-y-4">

          <select
            className="w-full border rounded-md p-2"
            value={form.tab_id}
            onChange={(e) =>
              setForm({
                ...form,
                tab_id: e.target.value,
              })
            }
          >
            <option value="">
              اختر التبويب
            </option>

            {tabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tab_name_ar}
              </option>
            ))}
          </select>

          <Input
            placeholder="group code"
            value={form.group_code}
            onChange={(e) =>
              setForm({
                ...form,
                group_code: e.target.value,
              })
            }
          />

          <Input
            placeholder="الاسم العربي"
            value={form.group_name_ar}
            onChange={(e) =>
              setForm({
                ...form,
                group_name_ar: e.target.value,
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

          <Button onClick={save}>
            حفظ
          </Button>

        </div>
      </BaseModal>

    </div>
  );
}