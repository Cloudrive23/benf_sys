"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import BaseModal from "@/app/components/modals/BaseModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type DuplicateRuleField = {
  id: string;
  rule_id: string;
  field_name: string;
  field_label_ar: string;
  match_type: string;
  is_required?: boolean | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

type DuplicateRule = {
  id: string;
  entity_key: string;
  entity_name: string;
  label_ar: string;
  rule_name_ar: string;
  action_mode: string;
  scope_level: string;
  scope_field?: string | null;
  display_name_field?: string | null;
  message_ar?: string | null;
  is_active?: boolean | null;
  fields: DuplicateRuleField[];
};

type AuditEntity = {
  id: string;
  entity_key: string;
  entity_name: string;
  entity_type: string;
  label_ar: string;
  display_name_field?: string | null;
};

type DbField = {
  field_name: string;
  data_type: string;
  sort_order: number;
};

const actionModes = [
  { value: "warn", label: "تنبيه فقط" },
  { value: "block", label: "منع الحفظ" },
];

const scopeLevels = [
  { value: "system", label: "النظام كامل" },
  { value: "branch", label: "نفس الفرع" },
  { value: "site", label: "نفس الموقع" },
  { value: "center", label: "نفس المركز" },
  { value: "custom", label: "حقل مخصص" },
];

const matchTypes = [
  { value: "exact", label: "مطابقة مباشرة" },
  { value: "normalized", label: "مطابقة نصية محسّنة" },
  { value: "phone", label: "رقم هاتف" },
  { value: "date", label: "تاريخ" },
  { value: "identity", label: "رقم هوية" },
];

const emptyRuleForm = {
  id: "",
  entity_key: "",
  entity_name: "",
  label_ar: "",
  rule_name_ar: "",
  action_mode: "warn",
  scope_level: "system",
  scope_field: "",
  display_name_field: "",
  message_ar: "",
  is_active: true,
};

const emptyFieldForm = {
  id: "",
  rule_id: "",
  field_name: "",
  field_label_ar: "",
  match_type: "exact",
  is_required: true,
  sort_order: 0,
  is_active: true,
};

export default function DuplicateRulesClient() {
  const [rules, setRules] = useState<DuplicateRule[]>([]);
  const [entities, setEntities] = useState<AuditEntity[]>([]);
  const [tableFields, setTableFields] = useState<DbField[]>([]);

  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);

  const [ruleForm, setRuleForm] = useState(emptyRuleForm);
  const [fieldForm, setFieldForm] = useState(emptyFieldForm);

  async function loadRules() {
    setLoading(true);

    const res = await fetch("/api/duplicate-rules", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      const list = data.data || [];
      setRules(list);

      if (!selectedRuleId && list.length > 0) {
        setSelectedRuleId(list[0].id);
      }
    } else {
      toast.error(data.message || "تعذر تحميل سياسات التكرار");
    }

    setLoading(false);
  }

  async function loadEntities() {
    const res = await fetch("/api/audit-settings", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setEntities(data.data || []);
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

  useEffect(() => {
    loadRules();
    loadEntities();
  }, []);

  const selectedRule = useMemo(() => {
    return rules.find((item) => item.id === selectedRuleId) || null;
  }, [rules, selectedRuleId]);

  function handleEntityChange(entityKey: string) {
    const entity = entities.find((item) => item.entity_key === entityKey);

    if (!entity) return;

    setRuleForm({
      ...ruleForm,
      entity_key: entity.entity_key,
      entity_name: entity.entity_name,
      label_ar: entity.label_ar,
      display_name_field: entity.display_name_field || "",
    });

    loadTableFields(entity.entity_name);
  }

  function openCreateRule() {
    setRuleForm(emptyRuleForm);
    setTableFields([]);
    setRuleModalOpen(true);
  }

  function openEditRule(rule: DuplicateRule) {
    setRuleForm({
      id: rule.id,
      entity_key: rule.entity_key || "",
      entity_name: rule.entity_name || "",
      label_ar: rule.label_ar || "",
      rule_name_ar: rule.rule_name_ar || "",
      action_mode: rule.action_mode || "warn",
      scope_level: rule.scope_level || "system",
      scope_field: rule.scope_field || "",
      display_name_field: rule.display_name_field || "",
      message_ar: rule.message_ar || "",
      is_active: rule.is_active ?? true,
    });

    loadTableFields(rule.entity_name);
    setRuleModalOpen(true);
  }

  async function saveRule(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const res = await fetch("/api/duplicate-rules", {
      method: ruleForm.id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ruleForm),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم الحفظ بنجاح");
      setRuleModalOpen(false);
      setRuleForm(emptyRuleForm);
      await loadRules();
    } else {
      toast.error(data.message || "تعذر حفظ السياسة");
    }

    setSaving(false);
  }

  async function toggleRuleActive(rule: DuplicateRule) {
		  const nextActive = !rule.is_active;

		  if (
			!confirm(
			  nextActive
				? "هل تريد تفعيل هذه السياسة؟"
				: "هل تريد تعطيل هذه السياسة؟"
			)
		  ) {
			return;
		  }

		  const res = await fetch("/api/duplicate-rules", {
			method: "PUT",
			headers: {
			  "Content-Type": "application/json",
			},
			body: JSON.stringify({
			  action: "set_active",
			  id: rule.id,
			  is_active: nextActive,
			}),
		  });

		  const data = await res.json();

		  if (data.success) {
			toast.success(data.message || "تم تحديث حالة السياسة");
			await loadRules();
		  } else {
			toast.error(data.message || "تعذر تحديث حالة السياسة");
		  }
		}

  function openCreateField() {
    if (!selectedRule) {
      toast.error("اختر سياسة أولًا");
      return;
    }

    setFieldForm({
      ...emptyFieldForm,
      rule_id: selectedRule.id,
      sort_order: (selectedRule.fields?.length || 0) + 1,
    });

    loadTableFields(selectedRule.entity_name);
    setFieldModalOpen(true);
  }

  function openEditField(field: DuplicateRuleField) {
    setFieldForm({
      id: field.id,
      rule_id: field.rule_id,
      field_name: field.field_name || "",
      field_label_ar: field.field_label_ar || "",
      match_type: field.match_type || "exact",
      is_required: field.is_required ?? true,
      sort_order: field.sort_order || 0,
      is_active: field.is_active ?? true,
    });

    if (selectedRule) {
      loadTableFields(selectedRule.entity_name);
    }

    setFieldModalOpen(true);
  }

  async function saveField(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const res = await fetch("/api/duplicate-rules/fields", {
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
      await loadRules();
    } else {
      toast.error(data.message || "تعذر حفظ الحقل");
    }

    setSaving(false);
  }

  async function toggleFieldActive(field: DuplicateRuleField) {
		  const nextActive = !field.is_active;

		  if (
			!confirm(
			  nextActive
				? "هل تريد تفعيل هذا الحقل؟"
				: "هل تريد تعطيل هذا الحقل؟"
			)
		  ) {
			return;
		  }

		  const res = await fetch("/api/duplicate-rules/fields", {
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
			await loadRules();
		  } else {
			toast.error(data.message || "تعذر تحديث حالة الحقل");
		  }
		}

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">سياسات التحقق من التكرار</h1>
          <p className="text-sm mt-1 opacity-70">
            إدارة قواعد التنبيه أو المنع عند وجود سجلات مشابهة
          </p>
        </div>

        <Button
          onClick={openCreateRule}
          style={{
            backgroundColor: "var(--app-primary)",
            color: "white",
          }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة سياسة
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
            <ShieldAlert className="w-4 h-4" />
            السياسات
          </div>

          {loading && (
            <div className="text-sm opacity-70">جاري التحميل...</div>
          )}

          {!loading && rules.length === 0 && (
            <div className="text-sm opacity-70">لا توجد سياسات</div>
          )}

          <div className="space-y-2">
            {rules.map((rule) => (
              <button
                key={rule.id}
                type="button"
                onClick={() => setSelectedRuleId(rule.id)}
                className={`w-full text-right rounded-xl border p-3 transition ${
                  selectedRuleId === rule.id ? "bg-white/10" : ""
                }`}
                style={{ borderColor: "var(--app-border)" }}
              >
                <div className="font-bold">{rule.rule_name_ar}</div>
                <div className="text-xs opacity-70 mt-1">
                  {rule.label_ar} / {rule.entity_key}
                </div>
                <div className="mt-2 flex gap-2">
                  <Badge>{rule.action_mode === "block" ? "منع" : "تنبيه"}</Badge>
                  <Badge>{rule.is_active ? "نشط" : "معطل"}</Badge>
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
          {selectedRule ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedRule.rule_name_ar}
                  </h2>
                  <p className="text-sm opacity-70 mt-1">
                    {selectedRule.label_ar} / {selectedRule.entity_name}
                  </p>
                  <p className="text-xs opacity-60 mt-1">
                    النطاق: {selectedRule.scope_level} | الإجراء:{" "}
                    {selectedRule.action_mode}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openEditRule(selectedRule)}
                  >
                    <Pencil className="w-4 h-4 ml-2" />
                    تعديل السياسة
                  </Button>

                  <Button
					  variant={selectedRule.is_active ? "destructive" : "outline"}
					  onClick={() => toggleRuleActive(selectedRule)}
					>
					  <Trash2 className="w-4 h-4 ml-2" />
					  {selectedRule.is_active ? "تعطيل" : "تفعيل"}
					</Button>
                </div>
              </div>

              <div
                className="rounded-xl border p-4 text-sm"
                style={{ borderColor: "var(--app-border)" }}
              >
                <div className="font-bold mb-1">رسالة التنبيه / المنع</div>
                <div className="opacity-80">
                  {selectedRule.message_ar || "-"}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="font-bold">حقول المطابقة</h3>

                <Button onClick={openCreateField}>
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة حقل
                </Button>
              </div>

              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-right">الترتيب</th>
                      <th className="p-3 text-right">اسم الحقل</th>
                      <th className="p-3 text-right">الاسم العربي</th>
                      <th className="p-3 text-right">نوع المطابقة</th>
                      <th className="p-3 text-right">إجباري؟</th>
                      <th className="p-3 text-right">الحالة</th>
                      <th className="p-3 text-left">الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedRule.fields.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center opacity-70">
                          لا توجد حقول
                        </td>
                      </tr>
                    ) : (
                      selectedRule.fields.map((field) => (
                        <tr key={field.id} className="border-b">
                          <td className="p-3">{field.sort_order}</td>
                          <td className="p-3 font-mono">
                            {field.field_name}
                          </td>
                          <td className="p-3">{field.field_label_ar}</td>
                          <td className="p-3">{field.match_type}</td>
                          <td className="p-3">
                            {field.is_required ? "نعم" : "لا"}
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
            <div className="p-8 text-center opacity-70">
              اختر سياسة من القائمة
            </div>
          )}
        </div>
      </div>

      <BaseModal
        open={ruleModalOpen}
        title={ruleForm.id ? "تعديل سياسة" : "إضافة سياسة"}
        onClose={() => setRuleModalOpen(false)}
      >
        <form onSubmit={saveRule} className="space-y-4">
          <Field label="الكيان">
            <select
              required
              className="w-full rounded-md border bg-transparent p-2"
              value={ruleForm.entity_key}
              onChange={(e) => handleEntityChange(e.target.value)}
              disabled={Boolean(ruleForm.id)}
            >
              <option value="">اختر الكيان</option>
              {entities.map((entity) => (
                <option key={entity.entity_key} value={entity.entity_key}>
                  {entity.label_ar} - {entity.entity_key}
                </option>
              ))}
            </select>
          </Field>

          <Field label="اسم السياسة">
            <Input
              required
              value={ruleForm.rule_name_ar}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  rule_name_ar: e.target.value,
                })
              }
            />
          </Field>

          <Field label="الإجراء">
            <select
              className="w-full rounded-md border bg-transparent p-2"
              value={ruleForm.action_mode}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  action_mode: e.target.value,
                })
              }
            >
              {actionModes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="النطاق">
            <select
              className="w-full rounded-md border bg-transparent p-2"
              value={ruleForm.scope_level}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  scope_level: e.target.value,
                })
              }
            >
              {scopeLevels.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          {ruleForm.scope_level === "custom" && (
            <Field label="حقل النطاق المخصص">
              <select
                className="w-full rounded-md border bg-transparent p-2"
                value={ruleForm.scope_field}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    scope_field: e.target.value,
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
          )}

          <Field label="حقل اسم العرض">
            <select
              className="w-full rounded-md border bg-transparent p-2"
              value={ruleForm.display_name_field}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
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

          <Field label="رسالة التنبيه / المنع">
            <textarea
              className="w-full rounded-md border bg-transparent p-2 min-h-[90px]"
              value={ruleForm.message_ar}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  message_ar: e.target.value,
                })
              }
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ruleForm.is_active}
              onChange={(e) =>
                setRuleForm({
                  ...ruleForm,
                  is_active: e.target.checked,
                })
              }
            />
            نشط
          </label>

          <Actions saving={saving} onCancel={() => setRuleModalOpen(false)} />
        </form>
      </BaseModal>

      <BaseModal
        open={fieldModalOpen}
        title={fieldForm.id ? "تعديل حقل مطابقة" : "إضافة حقل مطابقة"}
        onClose={() => setFieldModalOpen(false)}
      >
        <form onSubmit={saveField} className="space-y-4">
          <Field label="اسم الحقل">
            <select
              required
              className="w-full rounded-md border bg-transparent p-2"
              value={fieldForm.field_name}
              onChange={(e) => {
                const field = tableFields.find(
                  (item) => item.field_name === e.target.value
                );

                setFieldForm({
                  ...fieldForm,
                  field_name: e.target.value,
                  field_label_ar:
                    fieldForm.field_label_ar || e.target.value,
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

          <Field label="اسم الحقل بالعربي">
            <Input
              required
              value={fieldForm.field_label_ar}
              onChange={(e) =>
                setFieldForm({
                  ...fieldForm,
                  field_label_ar: e.target.value,
                })
              }
            />
          </Field>

          <Field label="نوع المطابقة">
            <select
              className="w-full rounded-md border bg-transparent p-2"
              value={fieldForm.match_type}
              onChange={(e) =>
                setFieldForm({
                  ...fieldForm,
                  match_type: e.target.value,
                })
              }
            >
              {matchTypes.map((item) => (
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

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fieldForm.is_required}
              onChange={(e) =>
                setFieldForm({
                  ...fieldForm,
                  is_required: e.target.checked,
                })
              }
            />
            هذا الحقل إجباري للمطابقة
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