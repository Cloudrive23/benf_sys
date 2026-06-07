"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type EntityField = {
  id: string;
  field_name: string;
  field_label_ar: string;
  input_type?: string | null;
  is_required?: boolean | null;
  is_visible_in_form?: boolean | null;
  is_readonly?: boolean | null;
  is_active?: boolean | null;
  sort_order?: number | null;
  reference_type?: string | null;
  lookup_type?: string | null;
  reference_table?: string | null;
  reference_key_field?: string | null;
  reference_label_field?: string | null;
};

type DynamicEntityFormProps = {
  entityKey: string;
  value: Record<string, any>;
  onChange: (nextValue: Record<string, any>) => void;
  hiddenFields?: string[];
  readonlyFields?: string[];
};

function normalizeDateValue(value: any) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export default function DynamicEntityForm({
  entityKey,
  value,
  onChange,
  hiddenFields = [],
  readonlyFields = [],
}: DynamicEntityFormProps) {
  const [fields, setFields] = useState<EntityField[]>([]);
  const [referenceData, setReferenceData] = useState<
    Record<string, Record<string, string>>
  >({});
  const [loading, setLoading] = useState(true);

  async function loadEntityDefinition() {
    setLoading(true);

    try {
      const res = await fetch(`/api/entity-definitions?entityKey=${entityKey}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        const formFields = (data.data?.fields || [])
          .filter((field: EntityField) => {
            if (hiddenFields.includes(field.field_name)) return false;

            return (
              field.is_active === true &&
              field.is_visible_in_form === true
            );
          })
          .sort(
            (a: EntityField, b: EntityField) =>
              Number(a.sort_order || 0) - Number(b.sort_order || 0)
          );

        setFields(formFields);
      } else {
        setFields([]);
      }
    } catch {
      setFields([]);
    }

    setLoading(false);
  }

  async function loadReferenceData() {
    try {
      const res = await fetch(
        `/api/entity-definitions/reference-data?entityKey=${entityKey}`,
        { cache: "no-store" }
      );

      const data = await res.json();

      if (data.success) {
        setReferenceData(data.data || {});
      } else {
        setReferenceData({});
      }
    } catch {
      setReferenceData({});
    }
  }

  useEffect(() => {
    loadEntityDefinition();
    loadReferenceData();
  }, [entityKey]);

  function setFieldValue(fieldName: string, fieldValue: any) {
    onChange({
      ...value,
      [fieldName]: fieldValue,
    });
  }

  function isFieldReadonly(field: EntityField) {
    return field.is_readonly === true || readonlyFields.includes(field.field_name);
  }

  const hasFields = useMemo(() => fields.length > 0, [fields]);

  if (loading) {
    return (
      <div className="p-4 text-sm opacity-70">
        جاري تحميل حقول النموذج...
      </div>
    );
  }

  if (!hasFields) {
    return (
      <div className="p-4 text-sm opacity-70">
        لا توجد حقول مفعلة للعرض في النموذج
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((field) => {
        const fieldValue = value[field.field_name] ?? "";
        const readonly = isFieldReadonly(field);
        const options = referenceData[field.field_name] || {};

        if (
          field.input_type === "select" ||
          field.reference_type === "lookup" ||
          field.reference_type === "table"
        ) {
          return (
            <FieldWrapper key={field.id} field={field}>
              <select
                className="w-full rounded-md border bg-transparent p-2"
                value={fieldValue || ""}
                disabled={readonly}
                required={field.is_required === true}
                onChange={(e) => setFieldValue(field.field_name, e.target.value)}
              >
                <option value="">اختر</option>
                {Object.entries(options).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </FieldWrapper>
          );
        }

        if (field.input_type === "textarea") {
          return (
            <FieldWrapper key={field.id} field={field} fullWidth>
              <textarea
                className="w-full rounded-md border bg-transparent p-2 min-h-[90px]"
                value={fieldValue || ""}
                readOnly={readonly}
                required={field.is_required === true}
                onChange={(e) => setFieldValue(field.field_name, e.target.value)}
              />
            </FieldWrapper>
          );
        }

        if (field.input_type === "checkbox") {
          return (
            <FieldWrapper key={field.id} field={field}>
              <label className="flex items-center gap-2 rounded-md border p-2">
                <input
                  type="checkbox"
                  checked={Boolean(fieldValue)}
                  disabled={readonly}
                  onChange={(e) =>
                    setFieldValue(field.field_name, e.target.checked)
                  }
                />
                <span>{fieldValue ? "نعم" : "لا"}</span>
              </label>
            </FieldWrapper>
          );
        }

        if (field.input_type === "date") {
          return (
            <FieldWrapper key={field.id} field={field}>
              <Input
                type="date"
                value={normalizeDateValue(fieldValue)}
                readOnly={readonly}
                required={field.is_required === true}
                onChange={(e) => setFieldValue(field.field_name, e.target.value)}
              />
            </FieldWrapper>
          );
        }

        return (
          <FieldWrapper key={field.id} field={field}>
            <Input
              type={field.input_type || "text"}
              value={fieldValue || ""}
              readOnly={readonly}
              required={field.is_required === true}
              onChange={(e) => setFieldValue(field.field_name, e.target.value)}
            />
          </FieldWrapper>
        );
      })}
    </div>
  );
}

function FieldWrapper({
  field,
  children,
  fullWidth = false,
}: {
  field: EntityField;
  children: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div className={`space-y-1 ${fullWidth ? "md:col-span-2" : ""}`}>
      <label className="text-sm font-medium">
        {field.field_label_ar}
        {field.is_required && <span className="text-red-500 mr-1">*</span>}
      </label>
      {children}
    </div>
  );
}