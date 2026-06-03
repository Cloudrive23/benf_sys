"use client";

import { useEffect, useState } from "react";
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
      setActiveTab(result[0]?.id || "");
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

      if (type && !lookups[type]) {
        loadLookup(type);
      }

      return (
        <select
          className="w-full rounded-md border bg-transparent p-2"
          value={value}
          onChange={(e) => updateValue(field.id, e.target.value)}
        >
          <option value="">اختر {field.field_label_ar}</option>

          {items.map((item: any) => (
            <option key={item.id} value={item.id}>
              {item.name_ar}
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
          className="w-full rounded-md border bg-transparent p-2"
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

  const currentTab = tabs.find((t) => t.id === activeTab);

  return (
	<div className="space-y-5 max-w-full overflow-x-hidden">
      <div className="flex gap-2 border-b pb-3 overflow-x-auto max-w-full">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg ${
              activeTab === tab.id ? "bg-green-600 text-white" : ""
            }`}
          >
            {tab.tab_name_ar}
          </button>
        ))}
      </div>

      {!currentTab && (
        <div className="text-sm opacity-70">
          لا توجد تبويبات ديناميكية مفعلة.
        </div>
      )}

      {currentTab?.groups?.map((group: any) => (
        <div
		  key={group.id}
		  className="rounded-xl border p-3 sm:p-4 space-y-4 max-w-full overflow-hidden"
		>
          <h3 className="font-bold text-lg">{group.group_name_ar}</h3>

          {group.fields.length === 0 ? (
            <div className="text-sm opacity-60">
              لا توجد حقول داخل هذه المجموعة.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-full">
              {group.fields.map((field: any) => (
                <div key={field.id} className="min-w-0">
                  <label className="text-sm block mb-2">
                    {field.field_label_ar}
                    {field.is_required && (
                      <span className="text-red-500 mr-1">*</span>
                    )}
                  </label>

                  {renderField(field)}

                  {field.help_text_ar && (
                    <p className="text-xs opacity-60 mt-1">
                      {field.help_text_ar}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}