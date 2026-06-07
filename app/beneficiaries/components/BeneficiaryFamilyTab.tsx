"use client";

import EntityPicker, {
  type EntityPickerItem,
} from "@/app/components/entity-picker/EntityPicker";

export default function BeneficiaryFamilyTab({
  form,
  setForm,
  fathers,
  mothers,
  guardians,
  onCreateFather,
  onCreateMother,
  onCreateGuardian,
}: {
  form: any;
  setForm: any;
  fathers: EntityPickerItem[];
  mothers: EntityPickerItem[];
  guardians: EntityPickerItem[];
  onCreateFather?: () => void;
  onCreateMother?: () => void;
  onCreateGuardian?: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <h3 className="mb-4 border-b pb-3 text-base font-bold">
          ربط المستفيد بأفراد الأسرة الرئيسيين
        </h3>

        <div className="space-y-5">
          <EntityPicker
            label="الأب"
            items={fathers}
            selectedId={form.father_id}
            onSelect={(item) =>
              setForm({
                ...form,
                father_id: item.id,
              })
            }
            onCreate={onCreateFather || (() => {})}
            createLabel="إضافة أب"
          />

          <EntityPicker
            label="الأم"
            items={mothers}
            selectedId={form.mother_id}
            onSelect={(item) =>
              setForm({
                ...form,
                mother_id: item.id,
              })
            }
            onCreate={onCreateMother || (() => {})}
            createLabel="إضافة أم"
          />

          <EntityPicker
            label="المعيل"
            items={guardians}
            selectedId={form.guardian_id}
            onSelect={(item) =>
              setForm({
                ...form,
                guardian_id: item.id,
              })
            }
            onCreate={onCreateGuardian || (() => {})}
            createLabel="إضافة معيل"
          />
        </div>
      </div>

      <div className="rounded-xl border p-4 text-sm opacity-75">
        يمكن إضافة الأب أو الأم أو المعيل من نفس الشاشة، وبعد الإغلاق سيتم تحديث
        القوائم تلقائيًا.
      </div>
    </div>
  );
}
