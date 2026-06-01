"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import AppCard from "@/app/components/shared/AppCard";
import AppSection from "@/app/components/shared/AppSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const defaultForm = {
  id: "",
  organization_name: "نظام إدارة المستفيدين",
  primary_color: "#2563eb",
  secondary_color: "#1e293b",
  font_family: "Cairo",
  font_size: "medium",
  dark_mode: true,
  sidebar_mode: "expanded",
  logo_url: "",
};

export default function ThemeClient() {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/theme", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      setForm({
        id: data.data.id,
        organization_name:
          data.data.organization_name || defaultForm.organization_name,
        primary_color: data.data.primary_color || defaultForm.primary_color,
        secondary_color:
          data.data.secondary_color || defaultForm.secondary_color,
        font_family: data.data.font_family || defaultForm.font_family,
        font_size: data.data.font_size || defaultForm.font_size,
        dark_mode: data.data.dark_mode ?? true,
        sidebar_mode: data.data.sidebar_mode || defaultForm.sidebar_mode,
        logo_url: data.data.logo_url || "",
      });

      applyTheme(data.data);
    } else {
      toast.error(data.message || "تعذر تحميل إعدادات المظهر");
    }
  }

  function applyTheme(values: any) {
    document.documentElement.style.setProperty(
      "--app-primary",
      values.primary_color || defaultForm.primary_color
    );

    document.documentElement.style.setProperty(
      "--app-secondary",
      values.secondary_color || defaultForm.secondary_color
    );

    document.documentElement.style.setProperty(
      "--app-font-family",
      values.font_family || defaultForm.font_family
    );

    document.documentElement.style.fontFamily =
      values.font_family || defaultForm.font_family;
  }

  useEffect(() => {
    load();
  }, []);

  function updateField(key: string, value: any) {
    const updated = {
      ...form,
      [key]: value,
    };

    setForm(updated);
    applyTheme(updated);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);

    const res = await fetch("/api/theme", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم حفظ الإعدادات");
      applyTheme(data.data);
    } else {
      toast.error(data.message || "تعذر حفظ الإعدادات");
    }

    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">إعدادات المظهر</h1>
        <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
          التحكم في ألوان النظام والخطوط وشكل الواجهة من مكان واحد
        </p>
      </div>

      <form onSubmit={save} className="space-y-6">
        <AppCard>
          <AppSection title="هوية النظام">
            <div>
              <label className="text-sm">اسم النظام / المؤسسة</label>
              <Input
                value={form.organization_name}
                onChange={(e) =>
                  updateField("organization_name", e.target.value)
                }
              />
            </div>

            <div>
              <label className="text-sm">رابط الشعار</label>
              <Input
                value={form.logo_url}
                onChange={(e) => updateField("logo_url", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </AppSection>
        </AppCard>

        <AppCard>
          <AppSection title="الألوان">
            <div>
              <label className="text-sm">اللون الرئيسي</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) =>
                    updateField("primary_color", e.target.value)
                  }
                  className="w-20"
                />
                <Input
                  value={form.primary_color}
                  onChange={(e) =>
                    updateField("primary_color", e.target.value)
                  }
                />
              </div>
            </div>

            <div>
              <label className="text-sm">اللون الثانوي</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={form.secondary_color}
                  onChange={(e) =>
                    updateField("secondary_color", e.target.value)
                  }
                  className="w-20"
                />
                <Input
                  value={form.secondary_color}
                  onChange={(e) =>
                    updateField("secondary_color", e.target.value)
                  }
                />
              </div>
            </div>
          </AppSection>
        </AppCard>

        <AppCard>
          <AppSection title="الخطوط والعرض">
            <div>
              <label className="text-sm">نوع الخط</label>
              <select
                className="w-full rounded-md border bg-transparent p-2"
                value={form.font_family}
                onChange={(e) => updateField("font_family", e.target.value)}
              >
                <option value="Cairo">Cairo</option>
                <option value="Tajawal">Tajawal</option>
                <option value="Arial">Arial</option>
                <option value="Tahoma">Tahoma</option>
              </select>
            </div>

            <div>
              <label className="text-sm">حجم الخط</label>
              <select
                className="w-full rounded-md border bg-transparent p-2"
                value={form.font_size}
                onChange={(e) => updateField("font_size", e.target.value)}
              >
                <option value="small">صغير</option>
                <option value="medium">متوسط</option>
                <option value="large">كبير</option>
              </select>
            </div>

            <div>
              <label className="text-sm">الوضع</label>
              <select
                className="w-full rounded-md border bg-transparent p-2"
                value={form.dark_mode ? "dark" : "light"}
                onChange={(e) =>
                  updateField("dark_mode", e.target.value === "dark")
                }
              >
                <option value="dark">داكن</option>
                <option value="light">فاتح</option>
              </select>
            </div>

            <div>
              <label className="text-sm">القائمة الجانبية</label>
              <select
                className="w-full rounded-md border bg-transparent p-2"
                value={form.sidebar_mode}
                onChange={(e) => updateField("sidebar_mode", e.target.value)}
              >
                <option value="expanded">موسعة</option>
                <option value="compact">مصغرة</option>
              </select>
            </div>
          </AppSection>
        </AppCard>

        <AppCard>
          <AppSection title="معاينة مباشرة">
            <div
              className="rounded-2xl p-6 space-y-3"
              style={{
                backgroundColor: "var(--app-primary)",
                color: "white",
              }}
            >
              <h3 className="text-xl font-bold">
                {form.organization_name}
              </h3>
              <p className="opacity-90">
                هذا مثال مباشر لتأثير اللون الرئيسي على النظام.
              </p>
              <Button type="button">زر تجريبي</Button>
            </div>

            <div
              className="rounded-2xl p-6 space-y-3"
              style={{
                backgroundColor: "var(--app-secondary)",
                color: "white",
              }}
            >
              <h3 className="text-xl font-bold">القائمة والبطاقات</h3>
              <p className="opacity-90">
                هذا مثال مباشر لتأثير اللون الثانوي.
              </p>
            </div>
          </AppSection>
        </AppCard>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ إعدادات المظهر"}
          </Button>
        </div>
      </form>
    </div>
  );
}