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
        <label className="text-sm block mb-2">الهاتف</label>
        <Input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm block mb-2">هاتف بديل</label>
        <Input
          value={form.alternative_phone || ""}
          onChange={(e) =>
            setForm({ ...form, alternative_phone: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-sm block mb-2">حالة المستفيد</label>
        <select
          className="w-full rounded-md border bg-transparent p-2"
          value={form.status_id}
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

      <div className="md:col-span-3">
        <label className="text-sm block mb-2">العنوان</label>
        <Input
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </div>

      <div className="md:col-span-3">
        <label className="text-sm block mb-2">ملاحظات اجتماعية</label>
        <Input
          value={form.social_notes || ""}
          onChange={(e) =>
            setForm({ ...form, social_notes: e.target.value })
          }
        />
      </div>

    </div>
  );
}