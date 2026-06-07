"use client";

import { useEffect, useMemo, useState } from "react";

type EntityField = {
  id: string;
  field_name: string;
  field_label_ar: string;

  input_type?: string | null;
  is_visible_in_table?: boolean | null;
  is_active?: boolean | null;
  sort_order?: number | null;

  is_lookup?: boolean | null;
  lookup_type?: string | null;

  reference_type?: string | null;
  reference_table?: string | null;
  reference_key_field?: string | null;
  reference_label_field?: string | null;
};

type DynamicEntityTableProps = {
  entityKey: string;
  rows: any[];
  loading?: boolean;
  actions?: (row: any) => React.ReactNode;

  renderValue?: (row: any, field: EntityField) => React.ReactNode | undefined;

  emptyMessage?: string;
};

function defaultFormatValue(value: any, field: EntityField) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (field.input_type === "checkbox") {
    return value ? "نعم" : "لا";
  }

  if (field.input_type === "date") {
    return String(value).slice(0, 10);
  }

  if (typeof value === "boolean") {
    return value ? "نعم" : "لا";
  }

  return String(value);
}

export default function DynamicEntityTable({
  entityKey,
  rows,
  loading = false,
  actions,
  renderValue,
  emptyMessage = "لا توجد بيانات",
}: DynamicEntityTableProps) {
  const [fields, setFields] = useState<EntityField[]>([]);
  const [referenceData, setReferenceData] = useState<
    Record<string, Record<string, string>>
  >({});

  const [loadingFields, setLoadingFields] = useState(true);

  async function loadEntityDefinition() {
    setLoadingFields(true);

    try {
      const res = await fetch(`/api/entity-definitions?entityKey=${entityKey}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        const visibleFields = (data.data?.fields || [])
          .filter((field: EntityField) => {
            return field.is_active === true && field.is_visible_in_table === true;
          })
          .sort(
            (a: EntityField, b: EntityField) =>
              Number(a.sort_order || 0) - Number(b.sort_order || 0)
          );

        setFields(visibleFields);
      } else {
        setFields([]);
      }
    } catch {
      setFields([]);
    } finally {
      setLoadingFields(false);
    }
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
    setFields([]);
    setReferenceData({});
    loadEntityDefinition();
    loadReferenceData();
  }, [entityKey]);

  const isLoading = useMemo(() => {
    return loading || loadingFields;
  }, [loading, loadingFields]);

  function getCellValue(row: any, field: EntityField) {
    const customValue = renderValue?.(row, field);

    if (customValue !== undefined) {
      return customValue;
    }

    const rawValue = row[field.field_name];

    if (rawValue === null || rawValue === undefined || rawValue === "") {
      return "-";
    }

    const fieldReferenceData = referenceData[field.field_name];

    if (fieldReferenceData) {
      const mappedValue = fieldReferenceData[String(rawValue)];

      if (mappedValue !== undefined && mappedValue !== null && mappedValue !== "") {
        return mappedValue;
      }
    }

    return defaultFormatValue(rawValue, field);
  }

  const colSpan = fields.length + (actions ? 1 : 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max text-sm border-collapse">
        <thead>
          <tr
            className="border-b"
            style={{
              borderColor: "var(--app-border)",
            }}
          >
            {fields.map((field) => (
              <th key={field.id} className="p-3 text-right whitespace-nowrap">
                {field.field_label_ar}
              </th>
            ))}

            {actions && (
              <th className="p-3 text-left whitespace-nowrap">الإجراءات</th>
            )}
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <tr>
              <td
                colSpan={colSpan || 1}
                className="p-8 text-center"
                style={{
                  color: "var(--app-muted)",
                }}
              >
                جاري التحميل...
              </td>
            </tr>
          ) : fields.length === 0 ? (
            <tr>
              <td
                colSpan={colSpan || 1}
                className="p-8 text-center"
                style={{
                  color: "var(--app-muted)",
                }}
              >
                لا توجد حقول مفعلة للعرض في الجدول
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={colSpan || 1}
                className="p-8 text-center"
                style={{
                  color: "var(--app-muted)",
                }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id || index}
                className="border-b"
                style={{
                  borderColor: "var(--app-border)",
                }}
              >
                {fields.map((field) => (
                  <td key={field.id} className="p-3 align-top whitespace-nowrap">
                    {getCellValue(row, field)}
                  </td>
                ))}

                {actions && (
                  <td className="p-3 text-left space-x-2 space-x-reverse align-top">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}