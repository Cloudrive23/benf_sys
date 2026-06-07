
"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

export default function DynamicBeneficiaryFields({ values, setValues }: any) {
  const [tabs, setTabs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [lookups, setLookups] = useState<Record<string, any[]>>({});

  async function loadForm() {
    const res = await fetch("/api/beneficiary-dynamic-form", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      const result = data.data || [];
      setTabs(result);

      setActiveTab((current) => {
        if (current && result.some((tab: any) => tab.id === current)) {
          return current;
        }

        return result[0]?.id || "";
      });
    }
  }

  async function loadLookup(type: string) {
    if (!type || lookups[type]) return;

    const res = await fetch(`/api/lookups?type=${type}`, {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setLookups((old) => ({
        ...old,
        [type]: data.data || [],
      }));
    }
  }

  useEffect(() => {
    loadForm();
  }, []);

  const currentTab = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [tabs, activeTab]);

  const visibleGroups = useMemo(() => {
    return (currentTab?.groups || []).filter(
      (group: any) => Array.isArray(group.fields) && group.fields.length > 0
    );
  }, [currentTab]);

  useEffect(() => {
    const lookupTypes = new Set<string>();

    visibleGroups.forEach((group: any) => {
      group.fields?.forEach((field: any) => {
        if (field.field_type === "lookup" && field.lookup_type) {
          lookupTypes.add(field.lookup_type);
        }
      });
    });

    lookupTypes.forEach((type) => loadLookup(type));
  }, [visibleGroups]);

  function updateValue(fieldId: string, value: any) {
    setValues({
      ...values,
      [fieldId]: value,
    });
  }

  function renderField(field: any) {
    const value = values[field.id] || "";

    if (field.field_type === "lookup") {
      const type = field.lookup_type;
      const items = lookups[type] || [];

      return (
        <select
          className="w-full rounded-md border bg-transparent p-2"
          value={value}
          onChange={(e) => updateValue(field.id, e.target.value)}
        >
          <option value="">اختر {field.field_label_ar}</option>

          {items.map((item: any) => (
            <option key={item.id} value={item.id}>
              {item.name_ar || item.name_en || item.code}
            </option>
          ))}
        </select>
      );
    }

    if (field.field_type === "number") {
      return (
        <Input
          type="number"
          placeholder={field.placeholder_ar || field.field_label_ar}
          value={value}
          onChange={(e) => updateValue(field.id, e.target.value)}
        />
      );
    }

    if (field.field_type === "date") {
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => updateValue(field.id, e.target.value)}
        />
      );
    }

    if (field.field_type === "boolean") {
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => updateValue(field.id, e.target.checked)}
          />
          نعم
        </label>
      );
    }

    if (field.field_type === "textarea") {
      return (
        <textarea
          className="min-h-[90px] w-full rounded-md border bg-transparent p-2"
          placeholder={field.placeholder_ar || field.field_label_ar}
          value={value}
          onChange={(e) => updateValue(field.id, e.target.value)}
        />
      );
    }

    return (
      <Input
        placeholder={field.placeholder_ar || field.field_label_ar}
        value={value}
        onChange={(e) => updateValue(field.id, e.target.value)}
      />
    );
  }

  if (tabs.length === 0) {
    return (
      <div className="rounded-xl border p-6 text-center text-sm opacity-70">
        لا توجد تبويبات بيانات إضافية مفعلة للمستفيد حاليًا.
      </div>
    );
  }

  return (
    <div className="space-y-5 overflow-x-hidden">
      <div className="flex gap-2 overflow-x-auto border-b pb-3">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-lg px-4 py-2 ${
              activeTab === tab.id ? "bg-green-600 text-white" : ""
            }`}
          >
            {tab.tab_name_ar}
          </button>
        ))}
      </div>

      {!currentTab && (
        <div className="rounded-xl border p-6 text-center text-sm opacity-70">
          لا يوجد تبويب محدد.
        </div>
      )}

      {currentTab && visibleGroups.length === 0 && (
        <div className="rounded-xl border p-6 text-center text-sm opacity-70">
          لا توجد حقول مفعلة داخل تبويب {currentTab.tab_name_ar} حاليًا.
        </div>
      )}

      {visibleGroups.map((group: any) => (
        <div key={group.id} className="rounded-xl border p-4">
          <h3 className="mb-4 border-b pb-3 text-lg font-bold">
            {group.group_name_ar}
          </h3>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {group.fields.map((field: any) => (
              <div key={field.id} className="min-w-0">
                <label className="mb-2 block text-sm">
                  {field.field_label_ar}
                  {field.is_required && (
                    <span className="mr-1 text-red-500">*</span>
                  )}
                </label>

                {renderField(field)}

                {field.help_text_ar && (
                  <p className="mt-1 text-xs opacity-60">{field.help_text_ar}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
