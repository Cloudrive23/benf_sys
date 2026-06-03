"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BeneficiaryFieldsClient() {
  const [fields, setFields] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const [lookupTypes, setLookupTypes] = useState<any[]>([]);
	  
	const [form, setForm] = useState({
	  id: "",
	  group_id: "",
	  field_code: "",
	  field_label_ar: "",
	  field_label_en: "",
	  field_type: "text",
	  lookup_type: "",
	  lookup_type_id: "",
	  placeholder_ar: "",
	  placeholder_en: "",
	  help_text_ar: "",
	  help_text_en: "",
	  is_required: false,
	  sort_order: 0,
	  is_active: true,
	  default_value: "",
		is_readonly: false,
		min_value: "",
		max_value: "",
		min_length: "",
		max_length: "",
		validation_pattern: "",
	});

  async function loadData() {
    const [f, g, l] = await Promise.all([
		  fetch("/api/beneficiary-custom-fields").then((r) => r.json()),
		  fetch("/api/beneficiary-field-groups").then((r) => r.json()),
		  fetch("/api/lookup-types").then((r) => r.json()),
		]);

		if (f.success) setFields(f.data || []);
		if (g.success) setGroups(g.data || []);
		if (l.success) setLookupTypes(l.data || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setForm({
      id: "",
      group_id: "",
      field_code: "",
      field_label_ar: "",
      field_label_en: "",
      field_type: "text",
      lookup_type: "",
	  lookup_type_id: "",
      placeholder_ar: "",
      placeholder_en: "",
      help_text_ar: "",
      help_text_en: "",
      is_required: false,
      sort_order: 0,
      is_active: true,
	  default_value: "",
		is_readonly: false,
		min_value: "",
		max_value: "",
		min_length: "",
		max_length: "",
		validation_pattern: "",
    });
  }

  async function save() {
    const res = await fetch("/api/beneficiary-custom-fields", {
      method: form.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.message || "فشل الحفظ");
      return;
    }

    toast.success("تم الحفظ بنجاح");
    setOpen(false);
    loadData();
  }

  return (
    <div className="space-y-6">

      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">
          الحقول الديناميكية
        </h1>

        <Button
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة حقل
        </Button>
      </div>

      <div className="rounded-xl border overflow-hidden">
	   <div className="overflow-x-auto">
		<table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-right">التبويب</th>
              <th className="p-3 text-right">المجموعة</th>
              <th className="p-3 text-right">الكود</th>
              <th className="p-3 text-right">العنوان</th>
              <th className="p-3 text-right">النوع</th>
              <th className="p-3 text-right"></th>
            </tr>
          </thead>

          <tbody>
            {fields.map((f) => (
              <tr key={f.id} className="border-b">
                <td className="p-3">
                  {f.group?.tab?.tab_name_ar}
                </td>

                <td className="p-3">
                  {f.group?.group_name_ar}
                </td>

                <td className="p-3">
                  {f.field_code}
                </td>

                <td className="p-3">
                  {f.field_label_ar}
                </td>

                <td className="p-3">
                  {f.field_type}
                </td>

                <td className="p-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setForm({
                        id: f.id,
                        group_id: f.group_id,
                        field_code: f.field_code,
                        field_label_ar: f.field_label_ar,
                        field_label_en: f.field_label_en || "",
                        field_type: f.field_type,
                        lookup_type: f.lookup_type || "",
                        placeholder_ar: f.placeholder_ar || "",
                        placeholder_en: f.placeholder_en || "",
                        help_text_ar: f.help_text_ar || "",
                        help_text_en: f.help_text_en || "",
                        is_required: f.is_required,
                        sort_order: f.sort_order,
                        is_active: f.is_active,
						default_value: f.default_value || "",
						is_readonly: f.is_readonly || false,
						min_value: f.min_value || "",
						max_value: f.max_value || "",
						min_length: f.min_length || "",
						max_length: f.max_length || "",
						validation_pattern: f.validation_pattern || "",
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
	  </div>
	</div>

      <BaseModal
        open={open}
        onClose={() => setOpen(false)}
        title="الحقل"
      >
        <div className="space-y-4">

          <select
            className="w-full border rounded-md p-2"
            value={form.group_id}
            onChange={(e) =>
              setForm({
                ...form,
                group_id: e.target.value,
              })
            }
          >
            <option value="">اختر المجموعة</option>

            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.group_name_ar}
              </option>
            ))}
          </select>

          <Input
            placeholder="field code"
            value={form.field_code}
            onChange={(e) =>
              setForm({
                ...form,
                field_code: e.target.value,
              })
            }
          />

          <Input
            placeholder="العنوان العربي"
            value={form.field_label_ar}
            onChange={(e) =>
              setForm({
                ...form,
                field_label_ar: e.target.value,
              })
            }
          />

          <select
            className="w-full border rounded-md p-2"
            value={form.field_type}
            onChange={(e) =>
              setForm({
                ...form,
                field_type: e.target.value,
              })
            }
          >
            <option value="text">Text</option>
            <option value="textarea">Textarea</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="boolean">Boolean</option>
            <option value="lookup">Lookup</option>
			<option value="email">Email</option>
			<option value="phone">Phone</option>
			<option value="url">URL</option>
          </select>

          {form.field_type === "lookup" && (
			  <select
				className="w-full border rounded-md p-2"
				value={form.lookup_type_id}
				onChange={(e) => {
				  const selected = lookupTypes.find((x) => x.id === e.target.value);

				  setForm({
					...form,
					lookup_type_id: e.target.value,
					lookup_type: selected?.type_code || "",
				  });
				}}
			  >
				<option value="">اختر نوع القائمة</option>

				{lookupTypes.map((item) => (
				  <option key={item.id} value={item.id}>
					{item.type_name_ar} - {item.type_code}
				  </option>
				))}
			  </select>
			)}

          <Input
            placeholder="Placeholder عربي"
            value={form.placeholder_ar}
            onChange={(e) =>
              setForm({
                ...form,
                placeholder_ar: e.target.value,
              })
            }
          />

          <Input
            placeholder="مساعدة المستخدم"
            value={form.help_text_ar}
            onChange={(e) =>
              setForm({
                ...form,
                help_text_ar: e.target.value,
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

          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={form.is_required}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_required: e.target.checked,
                })
              }
            />
            حقل إجباري
          </label>
		  
		  <Input
			  placeholder="القيمة الافتراضية"
			  value={form.default_value}
			  onChange={(e) =>
				setForm({ ...form, default_value: e.target.value })
			  }
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
			  <Input
				type="number"
				placeholder="أقل قيمة"
				value={form.min_value}
				onChange={(e) =>
				  setForm({ ...form, min_value: e.target.value })
				}
			  />

			  <Input
				type="number"
				placeholder="أعلى قيمة"
				value={form.max_value}
				onChange={(e) =>
				  setForm({ ...form, max_value: e.target.value })
				}
			  />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
			  <Input
				type="number"
				placeholder="أقل عدد أحرف"
				value={form.min_length}
				onChange={(e) =>
				  setForm({ ...form, min_length: e.target.value })
				}
			  />

			  <Input
				type="number"
				placeholder="أعلى عدد أحرف"
				value={form.max_length}
				onChange={(e) =>
				  setForm({ ...form, max_length: e.target.value })
				}
			  />
			</div>

			<Input
			  placeholder="نمط التحقق Regex اختياري"
			  value={form.validation_pattern}
			  onChange={(e) =>
				setForm({ ...form, validation_pattern: e.target.value })
			  }
			/>

			<label className="flex gap-2 items-center">
			  <input
				type="checkbox"
				checked={form.is_readonly}
				onChange={(e) =>
				  setForm({ ...form, is_readonly: e.target.checked })
				}
			  />
			  للقراءة فقط
			</label>
          <Button onClick={save}>
            حفظ
          </Button>

        </div>
      </BaseModal>

    </div>
  );
}