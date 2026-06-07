"use client";

import { Input } from "@/components/ui/input";

export default function BeneficiarySocialTab({
  form,
  setForm,
  statuses,
}: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      <div>
        <label className="text-sm block mb-2">حالة المستفيد</label>
        <select
          className="w-full rounded-md border bg-transparent p-2"
          value={form.status_id || ""}
          onChange={(e) =>
            setForm({ ...form, status_id: e.target.value })
          }
        >
          <option value="">اختر الحالة</option>
          {statuses.map((item: any) => (
            <option key={item.id} value={item.id}>
              {item.name_ar}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2 xl:col-span-3">
        <label className="text-sm block mb-2">ملاحظات اجتماعية</label>
        <textarea
          className="w-full rounded-md border bg-transparent p-2 min-h-[100px]"
          value={form.social_notes || ""}
          onChange={(e) =>
            setForm({ ...form, social_notes: e.target.value })
          }
        />
      </div>
    </div>
  );
}