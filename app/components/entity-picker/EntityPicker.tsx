"use client";

import { Search, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type EntityPickerItem = {
  id: string;
  code: string;
  name: string;
  subtitle?: string;
  is_active?: boolean | null;
};

export default function EntityPicker({
  label,
  placeholder = "بحث...",
  items,
  selectedId,
  onSelect,
  onCreate,
  createLabel = "إضافة",
}: {
  label: string;
  placeholder?: string;
  items: EntityPickerItem[];
  selectedId: string;
  onSelect: (item: EntityPickerItem) => void;
  onCreate: () => void;
  createLabel?: string;
}) {
  const [query, setQuery] = useState("");

  const selected = items.find((item) => item.id === selectedId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return items.slice(0, 8);

    return items
      .filter((item) =>
        `${item.code} ${item.name} ${item.subtitle || ""}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 8);
  }, [items, query]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold" style={{ color: "var(--app-muted)" }}>
        {label}
      </label>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-4 relative">
          <Search className="absolute right-3 top-3 w-4 h-4 opacity-60" />
          <Input
            className="pr-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
          />
        </div>

        <div className="md:col-span-3">
          <Input readOnly value={selected?.code || ""} placeholder="الرقم" />
        </div>

        <div className="md:col-span-4">
          <Input readOnly value={selected?.name || ""} placeholder="الاسم" />
        </div>

        <div className="md:col-span-1">
          <Button
            type="button"
            onClick={onCreate}
            className="w-full"
            style={{
              backgroundColor: "var(--app-primary)",
              color: "white",
            }}
            title={createLabel}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {query && (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-surface)",
          }}
        >
          {filtered.length === 0 ? (
            <div className="p-4 flex items-center justify-between gap-3">
              <span style={{ color: "var(--app-muted)" }}>
                لا توجد نتائج مطابقة
              </span>

              <Button type="button" size="sm" onClick={onCreate}>
                {createLabel}
              </Button>
            </div>
          ) : (
            filtered.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  setQuery("");
                }}
                className="w-full p-3 text-right border-b hover:bg-white/5 transition"
                style={{ borderColor: "var(--app-border)" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold">
                      {item.name}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs" style={{ color: "var(--app-muted)" }}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>

                  <span
                    className="text-xs rounded-full px-3 py-1"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.08)",
                      color: "var(--app-muted)",
                    }}
                  >
                    {item.code}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}