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
}) {
  return (
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
        onCreate={onCreateFather}
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
        onCreate={onCreateMother}
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
        onCreate={onCreateGuardian}
        createLabel="إضافة معيل"
      />
    </div>
  );
}