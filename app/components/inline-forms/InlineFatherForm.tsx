"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function InlineFatherForm({
  branchId,
  onCreated,
  onCancel,
}: any) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    branch_id: branchId,
    full_name_ar: "",
    identity_number: "",
    phone: "",
    is_active: true,
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/fathers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      toast.success("تمت إضافة الأب");
      onCreated(data.data);
    } else {
      toast.error(data.message || "فشل إضافة الأب");
    }

    setSaving(false);
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <Input
        required
        placeholder="اسم الأب"
        value={form.full_name_ar}
        onChange={(e) => setForm({ ...form, full_name_ar: e.target.value })}
      />

      <Input
        placeholder="رقم الهوية"
        value={form.identity_number}
        onChange={(e) => setForm({ ...form, identity_number: e.target.value })}
      />

      <Input
        placeholder="الهاتف"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>

        <Button type="submit" disabled={saving}>
          {saving ? "جاري الحفظ..." : "حفظ"}
        </Button>
      </div>
    </form>
  );
}