"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BeneficiaryFamilyMembersTab({
  beneficiaryId,
}: {
  beneficiaryId: string;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [genders, setGenders] = useState<any[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [healthStatuses, setHealthStatuses] = useState<any[]>([]);
  const [educationStatuses, setEducationStatuses] = useState<any[]>([]);

  const emptyForm = {
    id: "",
    beneficiary_id: beneficiaryId,
    full_name_ar: "",
    gender: "",
    birth_date: "",
    relationship_type: "",
    identity_number: "",
    phone: "",
    education_status: "",
    health_status: "",
    notes: "",
    is_dependent: true,
    is_active: true,
  };

  const [form, setForm] = useState<any>(emptyForm);

  
  async function loadLookups() {
		  const [g, r, h, e] = await Promise.all([
			fetch("/api/lookups?type=genders").then((x) => x.json()),
			fetch("/api/lookups?type=relationship_types").then((x) => x.json()),
			fetch("/api/lookups?type=health_statuses").then((x) => x.json()),
			fetch("/api/lookups?type=education_statuses").then((x) => x.json()),
		  ]);

		  if (g.success) setGenders(g.data || []);
		  if (r.success) setRelationships(r.data || []);
		  if (h.success) setHealthStatuses(h.data || []);
		  if (e.success) setEducationStatuses(e.data || []);
		}

  async function loadData() {
    if (!beneficiaryId) return;

    const res = await fetch(
      `/api/family-members?beneficiary_id=${beneficiaryId}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (data.success) {
      setItems(data.data || []);
    }
  }

  useEffect(() => {
	  loadData();
	  loadLookups();
	}, [beneficiaryId]);

  async function save() {
    if (!beneficiaryId) {
      toast.error("يجب حفظ المستفيد أولًا قبل إضافة أفراد الأسرة");
      return;
    }

    const res = await fetch("/api/family-members", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        beneficiary_id: beneficiaryId,
      }),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.message || "فشل الحفظ");
      return;
    }

    toast.success("تم الحفظ بنجاح");
    setOpen(false);
    setForm(emptyForm);
    loadData();
  }

  return (
    <div className="space-y-4">
      {!beneficiaryId && (
        <div className="rounded-xl border p-4 text-sm opacity-75">
          يجب حفظ المستفيد أولًا قبل إضافة أفراد الأسرة.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">أفراد الأسرة</h3>

        <Button
          type="button"
          disabled={!beneficiaryId}
          onClick={() => {
            setForm({
              ...emptyForm,
              beneficiary_id: beneficiaryId,
            });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة فرد
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden max-w-full">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">صلة القرابة</th>
                <th className="p-3 text-right">الجنس</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">{item.full_name_ar}</td>
                  <td className="p-3">{item.relationship_type}</td>
				  <td className="p-3">
				  {
					genders.find((g) => g.id === item.gender)?.name_ar
					  || item.gender
				  }
				  </td>
                  <td className="p-3">{item.phone}</td>
                  <td className="p-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setForm({
                          ...item,
                          birth_date: item.birth_date
                            ? String(item.birth_date).slice(0, 10)
                            : "",
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}

              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center opacity-70">
                    لا توجد بيانات أفراد أسرة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BaseModal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? "تعديل فرد أسرة" : "إضافة فرد أسرة"}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm block mb-2">الاسم الكامل</label>
            <Input
              value={form.full_name_ar}
              onChange={(e) =>
                setForm({ ...form, full_name_ar: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm block mb-2">صلة القرابة</label>
            <select
				  className="w-full rounded-md border bg-transparent p-2"
				  value={form.relationship_lookup_id || ""}
				  onChange={(e) => {
					const selected = relationships.find((x) => x.id === e.target.value);
					setForm({
					  ...form,
					  relationship_lookup_id: e.target.value,
					  relationship_type: selected?.name_ar || "",
					});
				  }}
				>
				  <option value="">اختر صلة القرابة</option>
				  {relationships.map((item) => (
					<option key={item.id} value={item.id}>
					  {item.name_ar}
					</option>
				  ))}
				</select>
          </div>

          <div>
            <label className="text-sm block mb-2">الجنس</label>
            <select
				  className="w-full rounded-md border bg-transparent p-2"
				  value={form.gender || ""}
				  onChange={(e) => setForm({ ...form, gender: e.target.value })}
				>
				  <option value="">اختر الجنس</option>
				  {genders.map((item) => (
					<option key={item.id} value={item.id}>
					  {item.name_ar}
					</option>
				  ))}
			</select>
          </div>

          <div>
            <label className="text-sm block mb-2">تاريخ الميلاد</label>
            <Input
              type="date"
              value={form.birth_date || ""}
              onChange={(e) =>
                setForm({ ...form, birth_date: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm block mb-2">رقم الهوية</label>
            <Input
              value={form.identity_number || ""}
              onChange={(e) =>
                setForm({ ...form, identity_number: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm block mb-2">الهاتف</label>
            <Input
              value={form.phone || ""}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />
          </div>

          <div>
            <label className="text-sm block mb-2">الحالة التعليمية</label>
            <select
				  className="w-full rounded-md border bg-transparent p-2"
				  value={form.education_status || ""}
				  onChange={(e) => setForm({ ...form, education_status: e.target.value })}
				>
				  <option value="">اختر الحالة التعليمية</option>
				  {educationStatuses.map((item) => (
					<option key={item.id} value={item.id}>
					  {item.name_ar}
					</option>
				  ))}
				</select>
          </div>

          <div>
            <label className="text-sm block mb-2">الحالة الصحية</label>
            <select
				  className="w-full rounded-md border bg-transparent p-2"
				  value={form.health_status || ""}
				  onChange={(e) => setForm({ ...form, health_status: e.target.value })}
				>
				  <option value="">اختر الحالة الصحية</option>
				  {healthStatuses.map((item) => (
					<option key={item.id} value={item.id}>
					  {item.name_ar}
					</option>
				  ))}
				</select>
          </div>

          <div className="sm:col-span-2">
            <label className="text-sm block mb-2">ملاحظات</label>
            <Input
              value={form.notes || ""}
              onChange={(e) =>
                setForm({ ...form, notes: e.target.value })
              }
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_dependent}
              onChange={(e) =>
                setForm({ ...form, is_dependent: e.target.checked })
              }
            />
            معال / ضمن الأسرة
          </label>
        </div>

        <div className="flex justify-end mt-6">
          <Button type="button" onClick={save}>
            حفظ
          </Button>
        </div>
      </BaseModal>
    </div>
  );
}