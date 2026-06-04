"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

type AuditChange = {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
};

type LookupItem = {
  id: string;
  name_ar: string;
};

const fieldLabels: Record<string, string> = {
  full_name_ar: "الاسم",
  full_name: "الاسم",
  gender: "الجنس",
  gender_id: "الجنس",
  birth_date: "تاريخ الميلاد",
  relationship_type: "صلة القرابة",
  relationship_lookup_id: "صلة القرابة",
  identity_number: "رقم الهوية",
  phone: "الهاتف",
  education_status: "الحالة التعليمية",
  education_status_id: "الحالة التعليمية",
  health_status: "الحالة الصحية",
  health_status_id: "الحالة الصحية",
  notes: "الملاحظات",
  is_dependent: "هل هو معال",
  is_active: "الحالة",
  address: "العنوان",
  marital_status_id: "الحالة الاجتماعية",
  occupation_id: "المهنة",
  nationality_id: "الجنسية",
  death_reason_id: "سبب الوفاة",
  is_alive: "على قيد الحياة",
  is_guardian: "هل هو معيل",
};

function parseAuditNotes(notes: any): AuditChange[] {
  if (!notes) return [];

  try {
    const parsed = typeof notes === "string" ? JSON.parse(notes) : notes;
    return Array.isArray(parsed?.changes) ? parsed.changes : [];
  } catch {
    return [];
  }
}

function normalizeValue(value: any) {
  if (value === undefined || value === "") return null;

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return value;
}

function isDateString(value: any) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value);
}

function isUuid(value: any) {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

function valuesAreEqual(oldValue: any, newValue: any) {
  const oldNormalized = normalizeValue(oldValue);
  const newNormalized = normalizeValue(newValue);

  if (oldNormalized === null && newNormalized === null) return true;

  if (isDateString(oldNormalized) && isDateString(newNormalized)) {
    return String(oldNormalized).slice(0, 10) === String(newNormalized).slice(0, 10);
  }

  return oldNormalized === newNormalized;
}

function buildChangesFromOldAndNew(oldData: any, newData: any): AuditChange[] {
  if (!oldData || !newData) return [];

  return Object.keys(fieldLabels)
    .filter((field) => {
      return Object.prototype.hasOwnProperty.call(oldData, field) ||
        Object.prototype.hasOwnProperty.call(newData, field);
    })
    .filter((field) => !valuesAreEqual(oldData?.[field], newData?.[field]))
    .map((field) => ({
      field,
      label: fieldLabels[field] || field,
      oldValue: normalizeValue(oldData?.[field]),
      newValue: normalizeValue(newData?.[field]),
    }));
}

function getChanges(log: any): AuditChange[] {
  const changesFromNotes = parseAuditNotes(log.notes);

  if (changesFromNotes.length > 0) {
    return changesFromNotes;
  }

  return buildChangesFromOldAndNew(log.old_data, log.new_data);
}

function formatValue(value: any, lookupMap: Record<string, string>) {
  if (value === null || value === undefined || value === "") return "-";

  if (isUuid(value)) {
    return lookupMap[value] || value;
  }

  if (typeof value === "boolean") {
    return value ? "نعم" : "لا";
  }

  if (typeof value === "string") {
    if (isDateString(value)) {
      return new Date(value).toLocaleDateString("ar-YE");
    }

    return value;
  }

  return String(value);
}

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [lookupMap, setLookupMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);

    const res = await fetch("/api/audit-logs", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setLogs(data.data || []);
    }

    setLoading(false);
  }

  async function loadLookups() {
    const types = [
      "genders",
      "gender",
      "health_statuses",
      "health_status",
      "education_levels",
      "education_statuses",
      "relationship_types",
      "marital_status",
      "death_reasons",
      "occupations",
      "nationalities",
    ];

    const results = await Promise.all(
      types.map(async (type) => {
        try {
          const res = await fetch(`/api/lookups?type=${type}`, {
            cache: "no-store",
          });

          const data = await res.json();

          if (data.success && Array.isArray(data.data)) {
            return data.data as LookupItem[];
          }

          return [];
        } catch {
          return [];
        }
      })
    );

    const map: Record<string, string> = {};

    results.flat().forEach((item) => {
      if (item.id) {
        map[item.id] = item.name_ar;
      }
    });

    setLookupMap(map);
  }

  useEffect(() => {
    loadData();
    loadLookups();
  }, []);

  const logsWithChanges = useMemo(() => {
    return logs.map((log) => ({
      ...log,
      changes: getChanges(log),
    }));
  }, [logs]);

  function toggleRow(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">سجل التغييرات</h1>

        <p className="text-sm opacity-70 mt-1">
          جميع العمليات المنفذة داخل النظام
        </p>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-right w-12"></th>
                <th className="p-3 text-right">التاريخ</th>
                <th className="p-3 text-right">العملية</th>
                <th className="p-3 text-right">الكيان</th>
                <th className="p-3 text-right">العنوان</th>
                <th className="p-3 text-right">الوصف</th>
                <th className="p-3 text-right">المستخدم</th>
              </tr>
            </thead>

            <tbody>
              {logsWithChanges.map((item) => {
                const isExpanded = expandedId === item.id;
                const hasChanges = item.changes.length > 0;

                return (
                  <Fragment key={item.id}>
                    <tr className="border-b">
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleRow(item.id)}
                          className="w-8 h-8 rounded-md border hover:bg-white/10 transition"
                          title="عرض التفاصيل"
                        >
                          {isExpanded ? "⌃" : "⌄"}
                        </button>
                      </td>

                      <td className="p-3">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleString("ar-YE")
                          : ""}
                      </td>

                      <td className="p-3">{item.action}</td>
                      <td className="p-3">{item.entity_type}</td>
                      <td className="p-3">{item.title_ar}</td>
                      <td className="p-3">{item.description_ar}</td>
                      <td className="p-3">{item.username || "-"}</td>
                    </tr>

                    {isExpanded && (
                      <tr className="border-b bg-white/5">
                        <td colSpan={7} className="p-4">
                          <div className="space-y-3">
                            <div className="font-bold">تفاصيل التغييرات</div>

                            {hasChanges ? (
                              <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full min-w-[700px] text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="p-3 text-right">الحقل</th>
                                      <th className="p-3 text-right">
                                        القيمة القديمة
                                      </th>
                                      <th className="p-3 text-right">
                                        القيمة الجديدة
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {item.changes.map(
                                      (change: AuditChange, index: number) => (
                                        <tr
                                          key={`${change.field}-${index}`}
                                          className="border-b last:border-b-0"
                                        >
                                          <td className="p-3 font-medium">
                                            {change.label || change.field}
                                          </td>

                                          <td className="p-3 opacity-80">
                                            {formatValue(
                                              change.oldValue,
                                              lookupMap
                                            )}
                                          </td>

                                          <td className="p-3">
                                            {formatValue(
                                              change.newValue,
                                              lookupMap
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="rounded-lg border p-4 opacity-70">
                                لا توجد تفاصيل قابلة للعرض لهذا السجل.
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}

              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center opacity-70">
                    لا توجد بيانات
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan={7} className="p-6 text-center opacity-70">
                    جاري تحميل البيانات...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}