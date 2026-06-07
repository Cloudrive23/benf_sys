"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Power, Download } from "lucide-react";
import { toast } from "sonner";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type EntityField = {
  id: string;
  entity_id: string;
  field_name: string;
  field_label_ar: string;
  field_label_en?: string | null;
  data_type?: string | null;
  input_type?: string | null;
  is_required?: boolean | null;
  is_visible_in_table?: boolean | null;
  is_visible_in_form?: boolean | null;
  is_readonly?: boolean | null;
  is_lookup?: boolean | null;
  lookup_type?: string | null;

  reference_type?: string | null;
  reference_table?: string | null;
  reference_key_field?: string | null;
  reference_label_field?: string | null;

  sort_order?: number | null;
  is_active?: boolean | null;
};

type EntityDefinition = {
  id: string;
  entity_key: string;
  table_name: string;
  label_ar: string;
  label_en?: string | null;
  route_path?: string | null;
  api_path?: string | null;
  display_name_field?: string | null;
  code_field?: string | null;
  icon_name?: string | null;
  is_system?: boolean | null;
  is_active?: boolean | null;
  allow_create?: boolean | null;
  allow_update?: boolean | null;
  allow_delete?: boolean | null;
  allow_import?: boolean | null;
  allow_export?: boolean | null;
  fields: EntityField[];
};

type DbTable = {
  table_name: string;
};

type DbField = {
  field_name: string;
  data_type: string;
  sort_order: number;
};

type LookupType = {
  type: string;
};

const emptyEntityForm = {
  id: "",
  entity_key: "",
  table_name: "",
  label_ar: "",
  label_en: "",
  route_path: "",
  api_path: "",
  display_name_field: "",
  code_field: "",
  icon_name: "",
  is_system: false,
  is_active: true,
  allow_create: true,
  allow_update: true,
  allow_delete: true,
  allow_import: false,
  allow_export: true,
};

const emptyFieldForm = {
  id: "",
  entity_id: "",
  field_name: "",
  field_label_ar: "",
  field_label_en: "",
  data_type: "",
  input_type: "text",
  is_required: false,
  is_visible_in_table: true,
  is_visible_in_form: true,
  is_readonly: false,
  is_lookup: false,
  lookup_type: "",

  reference_type: "none",
  reference_table: "",
  reference_key_field: "id",
  reference_label_field: "",

  sort_order: 0,
  is_active: true,
};

const inputTypes = [
  { value: "text", label: "نص" },
  { value: "textarea", label: "نص طويل" },
  { value: "number", label: "رقم" },
  { value: "date", label: "تاريخ" },
  { value: "checkbox", label: "اختيار نعم/لا" },
  { value: "select", label: "قائمة اختيار" },
  { value: "tel", label: "هاتف" },
  { value: "email", label: "بريد إلكتروني" },
];

const referenceTypes = [
  { value: "none", label: "بدون مرجع" },
  { value: "lookup", label: "Lookup" },
  { value: "table", label: "جدول آخر" },
];

export default function EntityDefinitionsClient() {
  const [entities, setEntities] = useState<EntityDefinition[]>([]);
  const [tables, setTables] = useState<DbTable[]>([]);
  const [tableFields, setTableFields] = useState<DbField[]>([]);
  const [referenceTableFields, setReferenceTableFields] = useState<DbField[]>([]);
  const [lookupTypes, setLookupTypes] = useState<LookupType[]>([]);

  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);

  const [entityForm, setEntityForm] = useState(emptyEntityForm);
  const [fieldForm, setFieldForm] = useState(emptyFieldForm);

  async function loadEntities() {
    setLoading(true);

    const res = await fetch("/api/entity-definitions", {
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
      toast.error(data.message || "تعذر تحميل تعريفات الكيانات");
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

  async function loadReferenceTableFields(tableName: string) {
    if (!tableName) {
      setReferenceTableFields([]);
      return;
    }

    const res = await fetch(
      `/api/audit-settings/table-fields?table=${tableName}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (data.success) {
      setReferenceTableFields(data.data || []);
    } else {
      setReferenceTableFields([]);
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
    loadEntities();
    loadTables();
    loadLookupTypes();
  }, []);

  const selectedEntity = useMemo(() => {
    return entities.find((item) => item.id === selectedEntityId) || null;
  }, [entities, selectedEntityId]);

  function handleTableChange(tableName: string) {
    setEntityForm({
      ...entityForm,
      table_name: tableName,
      entity_key: entityForm.entity_key || tableName.replace(/s$/, ""),
      route_path: entityForm.route_path || `/${tableName}`,
      api_path: entityForm.api_path || `/api/${tableName}`,
    });

    loadTableFields(tableName);
  }

  function handleReferenceTypeChange(referenceType: string) {
    setFieldForm({
      ...fieldForm,
      reference_type: referenceType,
      is_lookup: referenceType === "lookup",
      lookup_type: referenceType === "lookup" ? fieldForm.lookup_type : "",
      reference_table: referenceType === "table" ? fieldForm.reference_table : "",
      reference_key_field: referenceType === "table" ? fieldForm.reference_key_field || "id" : "id",
      reference_label_field: referenceType === "table" ? fieldForm.reference_label_field : "",
    });

    if (referenceType !== "table") {
      setReferenceTableFields([]);
    }
  }

  function handleReferenceTableChange(tableName: string) {
    setFieldForm({
      ...fieldForm,
      reference_table: tableName,
      reference_key_field: "id",
      reference_label_field: "",
    });

    loadReferenceTableFields(tableName);
  }

  function openCreateEntity() {
    setEntityForm(emptyEntityForm);
    setTableFields([]);
    setEntityModalOpen(true);
  }

  function openEditEntity(entity: EntityDefinition) {
    setEntityForm({
      id: entity.id,
      entity_key: entity.entity_key || "",
      table_name: entity.table_name || "",
      label_ar: entity.label_ar || "",
      label_en: entity.label_en || "",
      route_path: entity.route_path || "",
      api_path: entity.api_path || "",
      display_name_field: entity.display_name_field || "",
      code_field: entity.code_field || "",
      icon_name: entity.icon_name || "",
      is_system: entity.is_system ?? false,
      is_active: entity.is_active ?? true,
      allow_create: entity.allow_create ?? true,
      allow_update: entity.allow_update ?? true,
      allow_delete: entity.allow_delete ?? true,
      allow_import: entity.allow_import ?? false,
      allow_export: entity.allow_export ?? true,
    });

    loadTableFields(entity.table_name);
    setEntityModalOpen(true);
  }

  async function saveEntity(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const res = await fetch("/api/entity-definitions", {
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
      await loadEntities();
    } else {
      toast.error(data.message || "تعذر حفظ تعريف الكيان");
    }

    setSaving(false);
  }

  async function toggleEntityActive(entity: EntityDefinition) {
    const nextActive = !entity.is_active;

    if (!confirm(nextActive ? "هل تريد تفعيل هذا الكيان؟" : "هل تريد تعطيل هذا الكيان؟")) {
      return;
    }

    const res = await fetch("/api/entity-definitions", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "set_active",
        id: entity.id,
        is_active: nextActive,
      }),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم تحديث الحالة");
      await loadEntities();
    } else {
      toast.error(data.message || "تعذر تحديث الحالة");
    }
  }

  async function importFields(entity: EntityDefinition) {
    if (!confirm(`هل تريد استيراد حقول ${entity.label_ar} من قاعدة البيانات؟`)) {
      return;
    }

    setSaving(true);

    const res = await fetch("/api/entity-definitions/import-fields", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entity_id: entity.id,
      }),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم استيراد الحقول");
      await loadEntities();
    } else {
      toast.error(data.message || "تعذر استيراد الحقول");
    }

    setSaving(false);
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

    setReferenceTableFields([]);
    loadTableFields(selectedEntity.table_name);
    setFieldModalOpen(true);
  }

  function openEditField(field: EntityField) {
    setFieldForm({
      id: field.id,
      entity_id: field.entity_id,
      field_name: field.field_name || "",
      field_label_ar: field.field_label_ar || "",
      field_label_en: field.field_label_en || "",
      data_type: field.data_type || "",
      input_type: field.input_type || "text",
      is_required: field.is_required ?? false,
      is_visible_in_table: field.is_visible_in_table ?? true,
      is_visible_in_form: field.is_visible_in_form ?? true,
      is_readonly: field.is_readonly ?? false,
      is_lookup: field.is_lookup ?? false,
      lookup_type: field.lookup_type || "",

      reference_type: field.reference_type || "none",
      reference_table: field.reference_table || "",
      reference_key_field: field.reference_key_field || "id",
      reference_label_field: field.reference_label_field || "",

      sort_order: field.sort_order || 0,
      is_active: field.is_active ?? true,
    });

    if (selectedEntity) {
      loadTableFields(selectedEntity.table_name);
    }

    if (field.reference_type === "table" && field.reference_table) {
      loadReferenceTableFields(field.reference_table);
    } else {
      setReferenceTableFields([]);
    }

    setFieldModalOpen(true);
  }

  async function saveField(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const res = await fetch("/api/entity-definitions/fields", {
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
      setReferenceTableFields([]);
      await loadEntities();
    } else {
      toast.error(data.message || "تعذر حفظ تعريف الحقل");
    }

    setSaving(false);
  }

  async function toggleFieldActive(field: EntityField) {
    const nextActive = !field.is_active;

    if (!confirm(nextActive ? "هل تريد تفعيل هذا الحقل؟" : "هل تريد تعطيل هذا الحقل؟")) {
      return;
    }

    const res = await fetch("/api/entity-definitions/fields", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "set_active",
        id: field.id,
        is_active: nextActive,
      }),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم تحديث حالة الحقل");
      await loadEntities();
    } else {
      toast.error(data.message || "تعذر تحديث حالة الحقل");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">تعريفات الكيانات</h1>
          <p className="text-sm mt-1 opacity-70">
            النواة المركزية لإدارة الشاشات والحقول والسياسات مستقبلًا
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
          <div className="font-bold">الكيانات</div>

          {loading && <div className="text-sm opacity-70">جاري التحميل...</div>}

          <div className="space-y-2">
            {entities.map((entity) => (
              <button
                key={entity.id}
                type="button"
                onClick={() => setSelectedEntityId(entity.id)}
                className={`w-full text-right rounded-xl border p-3 transition ${
                  selectedEntityId === entity.id ? "bg-white/10" : ""
                }`}
                style={{ borderColor: "var(--app-border)" }}
              >
                <div className="font-bold">{entity.label_ar}</div>
                <div className="text-xs opacity-70 mt-1">
                  {entity.entity_key} / {entity.table_name}
                </div>
                <div className="mt-2 flex gap-2">
                  <Badge>{entity.is_active ? "نشط" : "معطل"}</Badge>
                  {entity.is_system && <Badge>نظامي</Badge>}
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
                  <h2 className="text-2xl font-bold">{selectedEntity.label_ar}</h2>
                  <p className="text-sm opacity-70 mt-1">
                    {selectedEntity.entity_key} / {selectedEntity.table_name}
                  </p>
                  <p className="text-xs opacity-60 mt-1">
                    المسار: {selectedEntity.route_path || "-"} | API:{" "}
                    {selectedEntity.api_path || "-"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => openEditEntity(selectedEntity)}>
                    <Pencil className="w-4 h-4 ml-2" />
                    تعديل
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => importFields(selectedEntity)}
                    disabled={saving}
                  >
                    <Download className="w-4 h-4 ml-2" />
                    استيراد الحقول
                  </Button>

                  <Button
                    variant={selectedEntity.is_active ? "destructive" : "outline"}
                    onClick={() => toggleEntityActive(selectedEntity)}
                  >
                    <Power className="w-4 h-4 ml-2" />
                    {selectedEntity.is_active ? "تعطيل" : "تفعيل"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <Info label="إنشاء" value={selectedEntity.allow_create ? "مسموح" : "ممنوع"} />
                <Info label="تعديل" value={selectedEntity.allow_update ? "مسموح" : "ممنوع"} />
                <Info label="حذف" value={selectedEntity.allow_delete ? "مسموح" : "ممنوع"} />
                <Info label="استيراد" value={selectedEntity.allow_import ? "مسموح" : "ممنوع"} />
                <Info label="تصدير" value={selectedEntity.allow_export ? "مسموح" : "ممنوع"} />
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-bold">الحقول</h3>

                <Button onClick={openCreateField}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة حقل
                </Button>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[1300px] text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-right">الترتيب</th>
                      <th className="p-3 text-right">الحقل</th>
                      <th className="p-3 text-right">العربي</th>
                      <th className="p-3 text-right">نوع الإدخال</th>
                      <th className="p-3 text-right">جدول</th>
                      <th className="p-3 text-right">نموذج</th>
                      <th className="p-3 text-right">مطلوب</th>
                      <th className="p-3 text-right">المرجع</th>
                      <th className="p-3 text-right">Lookup</th>
                      <th className="p-3 text-right">جدول المرجع</th>
                      <th className="p-3 text-right">حقل العرض</th>
                      <th className="p-3 text-right">الحالة</th>
                      <th className="p-3 text-left">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedEntity.fields.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="p-8 text-center opacity-70">
                          لا توجد حقول
                        </td>
                      </tr>
                    ) : (
                      selectedEntity.fields.map((field) => (
                        <tr key={field.id} className="border-b">
                          <td className="p-3">{field.sort_order}</td>
                          <td className="p-3 font-mono">{field.field_name}</td>
                          <td className="p-3">{field.field_label_ar}</td>
                          <td className="p-3">{field.input_type}</td>
                          <td className="p-3">{field.is_visible_in_table ? "نعم" : "لا"}</td>
                          <td className="p-3">{field.is_visible_in_form ? "نعم" : "لا"}</td>
                          <td className="p-3">{field.is_required ? "نعم" : "لا"}</td>
                          <td className="p-3">{field.reference_type || "none"}</td>
                          <td className="p-3">{field.lookup_type || "-"}</td>
                          <td className="p-3">{field.reference_table || "-"}</td>
                          <td className="p-3">{field.reference_label_field || "-"}</td>
                          <td className="p-3">
                            <Badge>{field.is_active ? "نشط" : "معطل"}</Badge>
                          </td>
                          <td className="p-3 text-left space-x-2 space-x-reverse">
                            <Button size="sm" variant="outline" onClick={() => openEditField(field)}>
                              <Pencil className="w-4 h-4" />
                            </Button>

                            <Button
                              size="sm"
                              variant={field.is_active ? "destructive" : "outline"}
                              onClick={() => toggleFieldActive(field)}
                            >
                              {field.is_active ? "تعطيل" : "تفعيل"}
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
            <div className="p-8 text-center opacity-70">اختر كيانًا من القائمة</div>
          )}
        </div>
      </div>

      <BaseModal
        open={entityModalOpen}
        title={entityForm.id ? "تعديل كيان" : "إضافة كيان"}
        onClose={() => setEntityModalOpen(false)}
      >
        <form onSubmit={saveEntity} className="space-y-4">
          <Field label="الجدول">
            <select
              required
              className="w-full rounded-md border bg-transparent p-2"
              value={entityForm.table_name}
              onChange={(e) => handleTableChange(e.target.value)}
              disabled={Boolean(entityForm.id)}
            >
              <option value="">اختر الجدول</option>
              {tables.map((table) => (
                <option key={table.table_name} value={table.table_name}>
                  {table.table_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="مفتاح الكيان">
            <Input
              required
              value={entityForm.entity_key}
              onChange={(e) =>
                setEntityForm({ ...entityForm, entity_key: e.target.value })
              }
            />
          </Field>

          <Field label="الاسم العربي">
            <Input
              required
              value={entityForm.label_ar}
              onChange={(e) =>
                setEntityForm({ ...entityForm, label_ar: e.target.value })
              }
            />
          </Field>

          <Field label="الاسم الإنجليزي">
            <Input
              value={entityForm.label_en}
              onChange={(e) =>
                setEntityForm({ ...entityForm, label_en: e.target.value })
              }
            />
          </Field>

          <Field label="مسار الصفحة">
            <Input
              value={entityForm.route_path}
              onChange={(e) =>
                setEntityForm({ ...entityForm, route_path: e.target.value })
              }
            />
          </Field>

          <Field label="مسار API">
            <Input
              value={entityForm.api_path}
              onChange={(e) =>
                setEntityForm({ ...entityForm, api_path: e.target.value })
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
            >
              <option value="">اختر الحقل</option>
              {tableFields.map((field) => (
                <option key={field.field_name} value={field.field_name}>
                  {field.field_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="حقل الكود">
            <select
              className="w-full rounded-md border bg-transparent p-2"
              value={entityForm.code_field}
              onChange={(e) =>
                setEntityForm({ ...entityForm, code_field: e.target.value })
              }
            >
              <option value="">اختر الحقل</option>
              {tableFields.map((field) => (
                <option key={field.field_name} value={field.field_name}>
                  {field.field_name}
                </option>
              ))}
            </select>
          </Field>

          <CheckGroup
            values={entityForm}
            onChange={(next) => setEntityForm({ ...entityForm, ...next })}
          />

          <Actions saving={saving} onCancel={() => setEntityModalOpen(false)} />
        </form>
      </BaseModal>

      <BaseModal
        open={fieldModalOpen}
        title={fieldForm.id ? "تعديل حقل" : "إضافة حقل"}
        onClose={() => setFieldModalOpen(false)}
      >
        <form onSubmit={saveField} className="space-y-4">
          <Field label="اسم الحقل">
            <select
              required
              className="w-full rounded-md border bg-transparent p-2"
              value={fieldForm.field_name}
              onChange={(e) => {
                const selected = tableFields.find(
                  (item) => item.field_name === e.target.value
                );

                setFieldForm({
                  ...fieldForm,
                  field_name: e.target.value,
                  data_type: selected?.data_type || fieldForm.data_type,
                  sort_order: selected?.sort_order || fieldForm.sort_order,
                  field_label_ar: fieldForm.field_label_ar || e.target.value,
                });
              }}
            >
              <option value="">اختر الحقل</option>
              {tableFields.map((field) => (
                <option key={field.field_name} value={field.field_name}>
                  {field.field_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="الاسم العربي">
            <Input
              required
              value={fieldForm.field_label_ar}
              onChange={(e) =>
                setFieldForm({ ...fieldForm, field_label_ar: e.target.value })
              }
            />
          </Field>

          <Field label="الاسم الإنجليزي">
            <Input
              value={fieldForm.field_label_en}
              onChange={(e) =>
                setFieldForm({ ...fieldForm, field_label_en: e.target.value })
              }
            />
          </Field>

          <Field label="نوع الإدخال">
            <select
              className="w-full rounded-md border bg-transparent p-2"
              value={fieldForm.input_type}
              onChange={(e) =>
                setFieldForm({ ...fieldForm, input_type: e.target.value })
              }
            >
              {inputTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
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

          <div className="rounded-xl border p-4 space-y-4">
            <div className="font-bold">إعدادات المرجع للعرض الديناميكي</div>

            <Field label="نوع المرجع">
              <select
                className="w-full rounded-md border bg-transparent p-2"
                value={fieldForm.reference_type}
                onChange={(e) => handleReferenceTypeChange(e.target.value)}
              >
                {referenceTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </Field>

            {fieldForm.reference_type === "lookup" && (
              <Field label="نوع Lookup">
                <select
                  className="w-full rounded-md border bg-transparent p-2"
                  value={fieldForm.lookup_type}
                  onChange={(e) =>
                    setFieldForm({
                      ...fieldForm,
                      lookup_type: e.target.value,
                      is_lookup: true,
                    })
                  }
                >
                  <option value="">اختر نوع Lookup</option>
                  {lookupTypes.map((item) => (
                    <option key={item.type} value={item.type}>
                      {item.type}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {fieldForm.reference_type === "table" && (
              <>
                <Field label="جدول المرجع">
                  <select
                    className="w-full rounded-md border bg-transparent p-2"
                    value={fieldForm.reference_table}
                    onChange={(e) => handleReferenceTableChange(e.target.value)}
                  >
                    <option value="">اختر الجدول</option>
                    {tables.map((table) => (
                      <option key={table.table_name} value={table.table_name}>
                        {table.table_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="حقل المفتاح في جدول المرجع">
                  <select
                    className="w-full rounded-md border bg-transparent p-2"
                    value={fieldForm.reference_key_field}
                    onChange={(e) =>
                      setFieldForm({
                        ...fieldForm,
                        reference_key_field: e.target.value,
                      })
                    }
                  >
                    <option value="">اختر الحقل</option>
                    {referenceTableFields.map((field) => (
                      <option key={field.field_name} value={field.field_name}>
                        {field.field_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="حقل الاسم المعروض من جدول المرجع">
                  <select
                    className="w-full rounded-md border bg-transparent p-2"
                    value={fieldForm.reference_label_field}
                    onChange={(e) =>
                      setFieldForm({
                        ...fieldForm,
                        reference_label_field: e.target.value,
                      })
                    }
                  >
                    <option value="">اختر الحقل</option>
                    {referenceTableFields.map((field) => (
                      <option key={field.field_name} value={field.field_name}>
                        {field.field_name}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Check
              label="مطلوب"
              checked={fieldForm.is_required}
              onChange={(value) => setFieldForm({ ...fieldForm, is_required: value })}
            />
            <Check
              label="يظهر في الجدول"
              checked={fieldForm.is_visible_in_table}
              onChange={(value) =>
                setFieldForm({ ...fieldForm, is_visible_in_table: value })
              }
            />
            <Check
              label="يظهر في النموذج"
              checked={fieldForm.is_visible_in_form}
              onChange={(value) =>
                setFieldForm({ ...fieldForm, is_visible_in_form: value })
              }
            />
            <Check
              label="للقراءة فقط"
              checked={fieldForm.is_readonly}
              onChange={(value) => setFieldForm({ ...fieldForm, is_readonly: value })}
            />
            <Check
              label="نشط"
              checked={fieldForm.is_active}
              onChange={(value) => setFieldForm({ ...fieldForm, is_active: value })}
            />
          </div>

          <Actions saving={saving} onCancel={() => setFieldModalOpen(false)} />
        </form>
      </BaseModal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs opacity-60">{label}</div>
      <div className="font-bold mt-1">{value}</div>
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

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

function CheckGroup({
  values,
  onChange,
}: {
  values: any;
  onChange: (next: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      <Check
        label="كيان نظامي"
        checked={values.is_system}
        onChange={(value) => onChange({ is_system: value })}
      />
      <Check
        label="نشط"
        checked={values.is_active}
        onChange={(value) => onChange({ is_active: value })}
      />
      <Check
        label="السماح بالإضافة"
        checked={values.allow_create}
        onChange={(value) => onChange({ allow_create: value })}
      />
      <Check
        label="السماح بالتعديل"
        checked={values.allow_update}
        onChange={(value) => onChange({ allow_update: value })}
      />
      <Check
        label="السماح بالحذف"
        checked={values.allow_delete}
        onChange={(value) => onChange({ allow_delete: value })}
      />
      <Check
        label="السماح بالاستيراد"
        checked={values.allow_import}
        onChange={(value) => onChange({ allow_import: value })}
      />
      <Check
        label="السماح بالتصدير"
        checked={values.allow_export}
        onChange={(value) => onChange({ allow_export: value })}
      />
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