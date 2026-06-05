"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Settings, Trash2 } from "lucide-react";
import { toast } from "sonner";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type AuditField = {
  id: string;
  entity_id: string;
  field_name: string;
  field_label_ar: string;
  is_tracked?: boolean | null;
  is_lookup?: boolean | null;
  lookup_type?: string | null;
  sort_order?: number | null;
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

type LookupType = {type: string;};

type AuditEntity = {
  id: string;
  entity_key: string;
  entity_name: string;
  entity_type: string;
  label_ar: string;
  display_name_field?: string | null;
  is_active?: boolean | null;
  fields: AuditField[];
};

const emptyEntityForm = {
  id: "",
  entity_key: "",
  entity_name: "",
  entity_type: "",
  label_ar: "",
  display_name_field: "",
  is_active: true,
};

const emptyFieldForm = {
  id: "",
  entity_id: "",
  field_name: "",
  field_label_ar: "",
  is_tracked: true,
  is_lookup: false,
  lookup_type: "",
  sort_order: 0,
  is_active: true,
};

export default function AuditSettingsClient() {
  const [entities, setEntities] = useState<AuditEntity[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [tableFields, setTableFields] = useState<DbField[]>([]);
  const [tables, setTables] = useState<DbTable[]>([]);

  const [lookupTypes, setLookupTypes] = useState<LookupType[]>([]);
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);

  const [entityForm, setEntityForm] = useState(emptyEntityForm);
  const [fieldForm, setFieldForm] = useState(emptyFieldForm);

  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);

    const res = await fetch("/api/audit-settings", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      const list = data.data || [];
      setEntities(list);

      if (!selectedEntityId && list.length > 0) {
        setSelectedEntityId(list[0].id);
      }
    } else {
      toast.error(data.message || "تعذر تحميل إعدادات سجل التغييرات");
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

	async function loadLookupTypes() {
		  const res = await fetch("/api/audit-settings/lookup-types", {
			cache: "no-store",
		  });

		  const data = await res.json();

		  if (data.success) {
			setLookupTypes(data.data || []);
		  }
		}	
  useEffect(() => {
	  loadData();
	  loadTables();
	  loadLookupTypes();
	}, []);

	async function loadTableFields(tableName: string) {
		  if (!tableName) {
			setTableFields([]);
			return;
		  }

		  const res = await fetch(
			`/api/audit-settings/table-fields?table=${tableName}`,
			{ cache: "no-store" }
		  );

		  const data = await res.json();

		  if (data.success) {
			setTableFields(data.data || []);
		  } else {
			setTableFields([]);
		  }
		}
	function singularizeTableName(tableName: string) {
			  if (tableName === "beneficiary_family_members") return "family_member";
			  if (tableName.endsWith("ies")) return tableName.slice(0, -3) + "y";
			  if (tableName.endsWith("s")) return tableName.slice(0, -1);
			  return tableName;
			}

			function guessArabicEntityLabel(tableName: string) {
			  const labels: Record<string, string> = {
				beneficiaries: "المستفيد",
				fathers: "الأب",
				mothers: "الأم",
				guardians: "المعيل",
				beneficiary_family_members: "فرد أسرة",
				branches: "الفرع",
				sites: "الموقع",
				centers: "المركز",
				lookups: "قائمة مرجعية",
				sponsors: "الكافل",
				sponsorships: "الكفالة",
			  };

			  return labels[tableName] || tableName;
			}

			function guessDisplayNameField(tableName: string) {
			  const fields: Record<string, string> = {
				beneficiaries: "full_name",
				fathers: "full_name_ar",
				mothers: "full_name_ar",
				guardians: "full_name_ar",
				beneficiary_family_members: "full_name_ar",
				branches: "branch_name_ar",
				sites: "site_name_ar",
				centers: "center_name_ar",
				lookups: "name_ar",
				sponsors: "sponsor_name",
			  };

			  return fields[tableName] || "";
			}

			function handleEntityTableChange(tableName: string) {
				  const entityKey = singularizeTableName(tableName);
				  const isEditMode = Boolean(entityForm.id);

				  setEntityForm({
					...entityForm,
					entity_name: tableName,

					entity_key: isEditMode ? entityForm.entity_key : entityKey,
					entity_type: isEditMode ? entityForm.entity_type : entityKey,
					label_ar: isEditMode
					  ? entityForm.label_ar
					  : guessArabicEntityLabel(tableName),
					display_name_field: isEditMode
					  ? entityForm.display_name_field
					  : guessDisplayNameField(tableName),
				  });

				  loadTableFields(tableName);
				}
  const selectedEntity = useMemo(() => {
    return entities.find((item) => item.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

  function openCreateEntity() {
	  setEntityForm(emptyEntityForm);
	  setTableFields([]);
	  setEntityModalOpen(true);
	}

  function openEditEntity(entity: AuditEntity) {
    setEntityForm({
      id: entity.id,
      entity_key: entity.entity_key || "",
      entity_name: entity.entity_name || "",
      entity_type: entity.entity_type || "",
      label_ar: entity.label_ar || "",
      display_name_field: entity.display_name_field || "",
      is_active: entity.is_active ?? true,
    });

	loadTableFields(entity.entity_name);
    setEntityModalOpen(true);
  }

  async function saveEntity(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const res = await fetch("/api/audit-settings", {
      method: entityForm.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entityForm),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم الحفظ بنجاح");
      setEntityModalOpen(false);
      setEntityForm(emptyEntityForm);
      await loadData();
    } else {
      toast.error(data.message || "تعذر حفظ الكيان");
    }

    setSaving(false);
  }

  async function disableEntity(id: string) {
    if (!confirm("هل أنت متأكد من تعطيل هذا الكيان؟")) return;

    const res = await fetch(`/api/audit-settings?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم تعطيل الكيان");
      await loadData();
    } else {
      toast.error(data.message || "تعذر تعطيل الكيان");
    }
  }

  function openCreateField() {
    if (!selectedEntity) {
      toast.error("اختر كيانًا أولًا");
      return;
    }

    setFieldForm({
      ...emptyFieldForm,
      entity_id: selectedEntity.id,
      sort_order: (selectedEntity.fields?.length || 0) + 1,
    });

    setFieldModalOpen(true);
  }

  function openEditField(field: AuditField) {
    setFieldForm({
      id: field.id,
      entity_id: field.entity_id,
      field_name: field.field_name || "",
      field_label_ar: field.field_label_ar || "",
      is_tracked: field.is_tracked ?? true,
      is_lookup: field.is_lookup ?? false,
      lookup_type: field.lookup_type || "",
      sort_order: field.sort_order || 0,
      is_active: field.is_active ?? true,
    });

    setFieldModalOpen(true);
  }

  async function saveField(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const res = await fetch("/api/audit-settings/fields", {
      method: fieldForm.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fieldForm),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم الحفظ بنجاح");
      setFieldModalOpen(false);
      setFieldForm(emptyFieldForm);
      await loadData();
    } else {
      toast.error(data.message || "تعذر حفظ الحقل");
    }

    setSaving(false);
  }

    async function importFields() {
			if (!selectedEntity) {
			  toast.error("اختر كيانًا أولًا");
			  return;
			}

			if (
			  !confirm(
				`هل تريد استيراد الحقول تلقائيًا من جدول ${selectedEntity.entity_name}؟`
			  )
			) {
			  return;
			}

			setSaving(true);

			const res = await fetch("/api/audit-settings/import-fields", {
			  method: "POST",
			  headers: {
				"Content-Type": "application/json",
			  },
			  body: JSON.stringify({
				entity_id: selectedEntity.id,
			  }),
			});

			const data = await res.json();

			if (data.success) {
			  toast.success(data.message || "تم استيراد الحقول بنجاح");
			  await loadData();
			} else {
			  toast.error(data.message || "تعذر استيراد الحقول");
			}

			setSaving(false);
		  }
  async function disableField(id: string) {
    if (!confirm("هل أنت متأكد من تعطيل هذا الحقل؟")) return;

    const res = await fetch(`/api/audit-settings/fields?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم تعطيل الحقل");
      await loadData();
    } else {
      toast.error(data.message || "تعذر تعطيل الحقل");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">إعدادات سجل التغييرات</h1>
          <p className="text-sm mt-1 opacity-70">
            إدارة الكيانات والحقول التي يتم تتبع تغييراتها داخل النظام
          </p>
        </div>

        <Button
          onClick={openCreateEntity}
          style={{
            backgroundColor: "var(--app-primary)",
            color: "white",
          }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة كيان
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div
          className="rounded-2xl border p-4 space-y-3"
          style={{
            backgroundColor: "var(--app-surface)",
            borderColor: "var(--app-border)",
          }}
        >
          <div className="font-bold flex items-center gap-2">
            <Settings className="w-4 h-4" />
            الكيانات
          </div>

          {loading && (
            <div className="text-sm opacity-70">جاري التحميل...</div>
          )}

          {!loading && entities.length === 0 && (
            <div className="text-sm opacity-70">لا توجد كيانات</div>
          )}

          <div className="space-y-2">
            {entities.map((entity) => (
              <button
                key={entity.id}
                type="button"
                onClick={() => setSelectedEntityId(entity.id)}
                className={`w-full text-right rounded-xl border p-3 transition ${
                  selectedEntityId === entity.id ? "bg-white/10" : ""
                }`}
                style={{
                  borderColor: "var(--app-border)",
                }}
              >
                <div className="font-bold">{entity.label_ar}</div>
                <div className="text-xs opacity-70 mt-1">
                  {entity.entity_key}
                </div>
                <div className="mt-2">
                  <Badge>{entity.is_active ? "نشط" : "معطل"}</Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div
          className="lg:col-span-3 rounded-2xl border p-5 space-y-5"
          style={{
            backgroundColor: "var(--app-surface)",
            borderColor: "var(--app-border)",
          }}
        >
          {selectedEntity ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedEntity.label_ar}
                  </h2>
                  <p className="text-sm opacity-70 mt-1">
                    {selectedEntity.entity_name} / {selectedEntity.entity_type}
                  </p>
                  <p className="text-xs opacity-60 mt-1">
                    حقل اسم العرض:{" "}
                    {selectedEntity.display_name_field || "-"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openEditEntity(selectedEntity)}
                  >
                    <Pencil className="w-4 h-4 ml-2" />
                    تعديل الكيان
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => disableEntity(selectedEntity.id)}
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    تعطيل
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-bold">الحقول المتتبعة</h3>

                <div className="flex items-center gap-2">
				  <Button variant="outline" onClick={importFields} disabled={saving}>
					استيراد الحقول
				  </Button>

				  <Button onClick={openCreateField}>
					<Plus className="w-4 h-4 ml-2" />
					إضافة حقل
				  </Button>
				</div>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-right">الترتيب</th>
                      <th className="p-3 text-right">اسم الحقل</th>
                      <th className="p-3 text-right">الاسم العربي</th>
                      <th className="p-3 text-right">متتبع؟</th>
                      <th className="p-3 text-right">Lookup؟</th>
                      <th className="p-3 text-right">نوع Lookup</th>
                      <th className="p-3 text-right">الحالة</th>
                      <th className="p-3 text-left">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedEntity.fields.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="p-6 text-center opacity-70"
                        >
                          لا توجد حقول
                        </td>
                      </tr>
                    ) : (
                      selectedEntity.fields.map((field) => (
                        <tr key={field.id} className="border-b">
                          <td className="p-3">{field.sort_order}</td>
                          <td className="p-3 font-mono">
                            {field.field_name}
                          </td>
                          <td className="p-3">{field.field_label_ar}</td>
                          <td className="p-3">
                            {field.is_tracked ? "نعم" : "لا"}
                          </td>
                          <td className="p-3">
                            {field.is_lookup ? "نعم" : "لا"}
                          </td>
                          <td className="p-3">
                            {field.lookup_type || "-"}
                          </td>
                          <td className="p-3">
                            <Badge>
                              {field.is_active ? "نشط" : "معطل"}
                            </Badge>
                          </td>
                          <td className="p-3 text-left space-x-2 space-x-reverse">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditField(field)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => disableField(field.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="p-8 text-center opacity-70">
              اختر كيانًا من القائمة
            </div>
          )}
        </div>
      </div>

      <BaseModal
        open={entityModalOpen}
        title={entityForm.id ? "تعديل كيان" : "إضافة كيان"}
        onClose={() => setEntityModalOpen(false)}
      >
        <form onSubmit={saveEntity} className="space-y-4">
          <Field label="مفتاح الكيان">
            <Input
			  required
			  readOnly={Boolean(entityForm.id)}
			  placeholder="مثال: family_member"
			  value={entityForm.entity_key}
              onChange={(e) =>
                setEntityForm({
                  ...entityForm,
                  entity_key: e.target.value,
                })
              }
            />
          </Field>

          <Field label="اسم الجدول">
			  <select
				required
				className="w-full rounded-md border bg-transparent p-2"
				value={entityForm.entity_name}
				onChange={(e) => handleEntityTableChange(e.target.value)}
			  >
				<option value="">اختر الجدول</option>
				{tables
					  .filter((table) => {
						if (entityForm.id) return true;

						return !entities.some(
						  (entity) => entity.entity_name === table.table_name
						);
					  })
					  .map((table) => (
						<option key={table.table_name} value={table.table_name}>
						  {table.table_name}
						</option>
					  ))}
			  </select>
			</Field>

          <Field label="نوع الكيان">
            <Input
              required
              placeholder="مثال: family_member"
              value={entityForm.entity_type}
              onChange={(e) =>
                setEntityForm({
                  ...entityForm,
                  entity_type: e.target.value,
                })
              }
            />
          </Field>

          <Field label="الاسم العربي">
            <Input
              required
              placeholder="مثال: فرد أسرة"
              value={entityForm.label_ar}
              onChange={(e) =>
                setEntityForm({
                  ...entityForm,
                  label_ar: e.target.value,
                })
              }
            />
          </Field>

          <Field label="حقل اسم العرض">
			  <select
				className="w-full rounded-md border bg-transparent p-2"
				value={entityForm.display_name_field}
				onChange={(e) =>
				  setEntityForm({
					...entityForm,
					display_name_field: e.target.value,
				  })
				}
				disabled={!entityForm.entity_name}
			  >
				<option value="">اختر حقل اسم العرض</option>

				{tableFields.map((field) => (
				  <option key={field.field_name} value={field.field_name}>
					{field.field_name}
				  </option>
				))}
			  </select>
			</Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={entityForm.is_active}
              onChange={(e) =>
                setEntityForm({
                  ...entityForm,
                  is_active: e.target.checked,
                })
              }
            />
            نشط
          </label>

          <Actions saving={saving} onCancel={() => setEntityModalOpen(false)} />
        </form>
      </BaseModal>

      <BaseModal
        open={fieldModalOpen}
        title={fieldForm.id ? "تعديل حقل" : "إضافة حقل"}
        onClose={() => setFieldModalOpen(false)}
      >
        <form onSubmit={saveField} className="space-y-4">
          <Field label="اسم الحقل التقني">
            <Input
              required
              placeholder="مثال: phone"
              value={fieldForm.field_name}
              onChange={(e) =>
                setFieldForm({
                  ...fieldForm,
                  field_name: e.target.value,
                })
              }
            />
          </Field>

          <Field label="اسم الحقل بالعربي">
            <Input
              required
              placeholder="مثال: الهاتف"
              value={fieldForm.field_label_ar}
              onChange={(e) =>
                setFieldForm({
                  ...fieldForm,
                  field_label_ar: e.target.value,
                })
              }
            />
          </Field>

          <Field label="نوع Lookup">
			  <select
				className="w-full rounded-md border bg-transparent p-2"
				value={fieldForm.lookup_type}
				disabled={!fieldForm.is_lookup}
				onChange={(e) =>
				  setFieldForm({
					...fieldForm,
					lookup_type: e.target.value,
				  })
				}
			  >
				<option value="">اختر نوع القائمة المرجعية</option>

				{lookupTypes.map((item) => (
				  <option key={item.type} value={item.type}>
					{item.type}
				  </option>
				))}
			  </select>
			</Field>

          <Field label="الترتيب">
            <Input
              type="number"
              value={fieldForm.sort_order}
              onChange={(e) =>
                setFieldForm({
                  ...fieldForm,
                  sort_order: Number(e.target.value || 0),
                })
              }
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
			  <input
				type="checkbox"
				checked={fieldForm.is_tracked}
				onChange={(e) =>
				  setFieldForm({
					...fieldForm,
					is_tracked: e.target.checked,
				  })
				}
			  />
			  يتم تتبعه في السجل
			</label>

          <label className="flex items-center gap-2 text-sm">
			  <input
				type="checkbox"
				checked={fieldForm.is_lookup}
				onChange={(e) =>
				  setFieldForm({
					...fieldForm,
					is_lookup: e.target.checked,
					lookup_type: e.target.checked ? fieldForm.lookup_type : "",
				  })
				}
			  />
			  هذا الحقل مرتبط بـ Lookup
			</label>

          <label className="flex items-center gap-2 text-sm">
			  <input
				type="checkbox"
				checked={fieldForm.is_active}
				onChange={(e) =>
				  setFieldForm({
					...fieldForm,
					is_active: e.target.checked,
				  })
				}
			  />
			  نشط
			</label>

          <Actions saving={saving} onCancel={() => setFieldModalOpen(false)} />
        </form>
      </BaseModal>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm">{label}</label>
      {children}
    </div>
  );
}

function Actions({
  saving,
  onCancel,
}: {
  saving: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        إلغاء
      </Button>

      <Button type="submit" disabled={saving}>
        {saving ? "جاري الحفظ..." : "حفظ"}
      </Button>
    </div>
  );
}