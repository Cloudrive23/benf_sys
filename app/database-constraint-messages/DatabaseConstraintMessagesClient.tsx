"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Power } from "lucide-react";
import { toast } from "sonner";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type ConstraintMessage = {
  id: string;
  table_name: string;
  field_name: string;
  constraint_type: string;
  message_ar: string;
  is_active?: boolean | null;
};

type DbTable = {
  table_name: string;
};

type DbField = {
  field_name: string;
  data_type: string;
  sort_order: number;
};

const emptyForm = {
  id: "",
  table_name: "",
  field_name: "",
  constraint_type: "unique",
  message_ar: "",
  is_active: true,
};

export default function DatabaseConstraintMessagesClient() {
  const [items, setItems] = useState<ConstraintMessage[]>([]);
  const [tables, setTables] = useState<DbTable[]>([]);
  const [fields, setFields] = useState<DbField[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    setLoading(true);

    const res = await fetch("/api/database-constraint-messages", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setItems(data.data || []);
    } else {
      toast.error(data.message || "تعذر تحميل رسائل القيود");
    }

    setLoading(false);
  }

  async function loadTables() {
    const res = await fetch("/api/audit-settings/tables", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setTables(data.data || []);
    }
  }

  async function loadFields(tableName: string) {
    if (!tableName) {
      setFields([]);
      return;
    }

    const res = await fetch(
      `/api/audit-settings/table-fields?table=${tableName}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (data.success) {
      setFields(data.data || []);
    } else {
      setFields([]);
    }
  }

  useEffect(() => {
    load();
    loadTables();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setFields([]);
    setOpen(true);
  }

  function openEdit(item: ConstraintMessage) {
    setForm({
      id: item.id,
      table_name: item.table_name || "",
      field_name: item.field_name || "",
      constraint_type: item.constraint_type || "unique",
      message_ar: item.message_ar || "",
      is_active: item.is_active ?? true,
    });

    loadFields(item.table_name);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const res = await fetch("/api/database-constraint-messages", {
      method: form.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم الحفظ بنجاح");
      setOpen(false);
      setForm(emptyForm);
      await load();
    } else {
      toast.error(data.message || "تعذر حفظ الرسالة");
    }

    setSaving(false);
  }

  async function toggleActive(item: ConstraintMessage) {
    const nextActive = !item.is_active;

    if (
      !confirm(
        nextActive
          ? "هل تريد تفعيل هذه الرسالة؟"
          : "هل تريد تعطيل هذه الرسالة؟"
      )
    ) {
      return;
    }

    const res = await fetch("/api/database-constraint-messages", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "set_active",
        id: item.id,
        is_active: nextActive,
      }),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم تحديث الحالة");
      await load();
    } else {
      toast.error(data.message || "تعذر تحديث الحالة");
    }
  }

  async function importUniqueConstraints() {
  if (!confirm("هل تريد استيراد قيود Unique من قاعدة البيانات؟")) {
    return;
  }

  setSaving(true);

  const res = await fetch("/api/database-constraint-messages/import-unique", {
    method: "POST",
  });

  const data = await res.json();

  if (data.success) {
    toast.success(data.message || "تم الاستيراد بنجاح");
    await load();
  } else {
    toast.error(data.message || "تعذر استيراد القيود");
  }

  setSaving(false);
}

  function handleTableChange(tableName: string) {
    setForm({
      ...form,
      table_name: tableName,
      field_name: "",
    });

    loadFields(tableName);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">رسائل قيود قاعدة البيانات</h1>
          <p className="text-sm mt-1 opacity-70">
            إدارة الرسائل الظاهرة عند أخطاء القيود مثل منع التكرار Unique
          </p>
        </div>

        <div className="flex items-center gap-2">
			  <Button
				type="button"
				variant="outline"
				onClick={importUniqueConstraints}
				disabled={saving}
			  >
				استيراد قيود Unique
			  </Button>

			  <Button
				onClick={openCreate}
				style={{
				  backgroundColor: "var(--app-primary)",
				  color: "white",
				}}
			  >
				<Plus className="w-4 h-4 ml-2" />
				إضافة رسالة
			  </Button>
			</div>
      </div>

      <div
        className="rounded-2xl border p-6"
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--app-border)" }}
              >
                <th className="p-3 text-right">الجدول</th>
                <th className="p-3 text-right">الحقل</th>
                <th className="p-3 text-right">نوع القيد</th>
                <th className="p-3 text-right">الرسالة</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-left">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center opacity-70">
                    جاري التحميل...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center opacity-70">
                    لا توجد رسائل
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    <td className="p-3 font-mono">{item.table_name}</td>
                    <td className="p-3 font-mono">{item.field_name}</td>
                    <td className="p-3">{item.constraint_type}</td>
                    <td className="p-3">{item.message_ar}</td>
                    <td className="p-3">
                      <Badge>{item.is_active ? "نشط" : "معطل"}</Badge>
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
                        variant={item.is_active ? "destructive" : "outline"}
                        onClick={() => toggleActive(item)}
                      >
                        <Power className="w-4 h-4 ml-1" />
                        {item.is_active ? "تعطيل" : "تفعيل"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BaseModal
        open={open}
        title={form.id ? "تعديل رسالة قيد" : "إضافة رسالة قيد"}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-sm">الجدول</label>
            <select
              required
              className="w-full rounded-md border bg-transparent p-2"
              value={form.table_name}
              onChange={(e) => handleTableChange(e.target.value)}
            >
              <option value="">اختر الجدول</option>
              {tables.map((table) => (
                <option key={table.table_name} value={table.table_name}>
                  {table.table_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm">الحقل</label>
            <select
              required
              className="w-full rounded-md border bg-transparent p-2"
              value={form.field_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  field_name: e.target.value,
                })
              }
            >
              <option value="">اختر الحقل</option>
              {fields.map((field) => (
                <option key={field.field_name} value={field.field_name}>
                  {field.field_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm">نوع القيد</label>
            <select
              required
              className="w-full rounded-md border bg-transparent p-2"
              value={form.constraint_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  constraint_type: e.target.value,
                })
              }
            >
              <option value="unique">منع التكرار Unique</option>
            </select>
          </div>

          <div>
            <label className="text-sm">الرسالة العربية</label>
            <textarea
              required
              className="w-full rounded-md border bg-transparent p-2 min-h-[100px]"
              value={form.message_ar}
              onChange={(e) =>
                setForm({
                  ...form,
                  message_ar: e.target.value,
                })
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_active: e.target.checked,
                })
              }
            />
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