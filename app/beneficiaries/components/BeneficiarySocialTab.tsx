"use client";

type LookupItem = {
  id: string;
  name_ar?: string | null;
  name_en?: string | null;
  code?: string | null;
};

export default function BeneficiarySocialTab({
  form,
  setForm,
  statuses,
}: {
  form: any;
  setForm: (value: any) => void;
  statuses: LookupItem[];
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border p-4">
        <h3 className="mb-4 border-b pb-3 text-base font-bold">
          الحالة والمتابعة الاجتماعية
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="min-w-0">
            <label className="mb-2 block text-sm">حالة المستفيد</label>
            <select
              className="w-full rounded-md border bg-transparent p-2"
              value={form.status_id || ""}
              onChange={(e) =>
                setForm({ ...form, status_id: e.target.value })
              }
            >
              <option value="">اختر الحالة</option>
              {statuses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name_ar || item.name_en || item.code}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 xl:col-span-3">
            <label className="mb-2 block text-sm">ملاحظات اجتماعية</label>
            <textarea
              className="min-h-[120px] w-full rounded-md border bg-transparent p-2"
              value={form.social_notes || ""}
              onChange={(e) =>
                setForm({ ...form, social_notes: e.target.value })
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
}
