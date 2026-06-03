"use client";

import { Input } from "@/components/ui/input";

export default function BeneficiaryBasicTab({
  form,
  setForm,
}: any) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">

      <div>
        <label className="text-sm block mb-2">رقم المستفيد</label>
        <Input readOnly value={form.beneficiary_code} />
      </div>

      <div>
        <label className="text-sm block mb-2">رقم الملف</label>
        <Input
          value={form.file_number}
          onChange={(e) =>
            setForm({ ...form, file_number: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-sm block mb-2">المرجع الخارجي</label>
        <Input
          value={form.external_reference}
          onChange={(e) =>
            setForm({ ...form, external_reference: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-sm block mb-2">الاسم الأول</label>
        <Input
          value={form.first_name}
          onChange={(e) =>
            setForm({ ...form, first_name: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-sm block mb-2">اسم الأب</label>
        <Input
          value={form.father_name}
          onChange={(e) =>
            setForm({ ...form, father_name: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-sm block mb-2">اسم الجد</label>
        <Input
          value={form.grandfather_name}
          onChange={(e) =>
            setForm({ ...form, grandfather_name: e.target.value })
          }
        />
      </div>

      <div>
        <label className="text-sm block mb-2">اللقب</label>
        <Input
          value={form.family_name}
          onChange={(e) =>
            setForm({ ...form, family_name: e.target.value })
          }
        />
      </div>

    </div>
  );
}