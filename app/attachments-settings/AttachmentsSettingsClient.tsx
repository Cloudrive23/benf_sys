"use client";

import { useEffect, useMemo, useState } from "react";

type TabKey = "sections" | "settings" | "types";

type AttachmentSection = {
  id: string;
  section_code: string;
  section_name_ar: string;
  section_name_en?: string | null;
  entity_type?: string | null;
  storage_folder: string;
  path_template: string;
  default_allowed_extensions?: string | null;
  default_allowed_mime_types?: string | null;
  default_max_file_size_mb?: number | null;
  allow_multiple: boolean;
  sort_order: number;
  is_active: boolean;
  notes?: string | null;
};

type AttachmentSetting = {
  id: string;
  setting_key: string;
  setting_value?: string | null;
  setting_type: string;
  scope_type: string;
  scope_code?: string | null;
  description?: string | null;
  is_locked: boolean;
  is_active: boolean;
};

type AttachmentType = {
  id: string;
  code: string;
  name_ar: string;
  name_en?: string | null;
  category: string;
  entity_type?: string | null;
  section_id?: string | null;
  path_segment?: string | null;
  is_required?: boolean | null;
  allowed_extensions?: string | null;
  allowed_mime_types?: string | null;
  max_file_size_mb?: number | null;
  min_width?: number | null;
  max_width?: number | null;
  min_height?: number | null;
  max_height?: number | null;
  is_image_required: boolean;
  allow_multiple: boolean;
  naming_strategy: string;
  path_template?: string | null;
  sort_order: number;
  is_active?: boolean | null;
  notes?: string | null;
};

const emptySection = {
  id: "",
  section_code: "",
  section_name_ar: "",
  section_name_en: "",
  entity_type: "",
  storage_folder: "",
  path_template: "",
  default_allowed_extensions: "",
  default_allowed_mime_types: "",
  default_max_file_size_mb: "",
  allow_multiple: false,
  sort_order: "0",
  is_active: true,
  notes: "",
};

const emptySetting = {
  id: "",
  setting_key: "",
  setting_value: "",
  setting_type: "string",
  scope_type: "global",
  scope_code: "",
  description: "",
  is_locked: false,
  is_active: true,
};

const emptyType = {
  id: "",
  code: "",
  name_ar: "",
  name_en: "",
  category: "general",
  entity_type: "",
  section_id: "",
  path_segment: "",
  is_required: false,
  allowed_extensions: "",
  allowed_mime_types: "",
  max_file_size_mb: "",
  min_width: "",
  max_width: "",
  min_height: "",
  max_height: "",
  is_image_required: false,
  allow_multiple: false,
  naming_strategy: "file_number",
  path_template: "",
  sort_order: "0",
  is_active: true,
  notes: "",
};

function inputClass() {
  return "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
}

function labelClass() {
  return "mb-1 block text-sm font-medium text-slate-300";
}

function cardClass() {
  return "rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-sm";
}

function boolText(value: boolean | null | undefined) {
  return value ? "نعم" : "لا";
}

async function readJson(response: Response) {
  const json = await response.json().catch(() => null);

  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || "حدث خطأ غير متوقع");
  }

  return json;
}

export default function AttachmentsSettingsClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("sections");

  const [sections, setSections] = useState<AttachmentSection[]>([]);
  const [settings, setSettings] = useState<AttachmentSetting[]>([]);
  const [types, setTypes] = useState<AttachmentType[]>([]);

  const [sectionForm, setSectionForm] = useState<any>(emptySection);
  const [settingForm, setSettingForm] = useState<any>(emptySetting);
  const [typeForm, setTypeForm] = useState<any>(emptyType);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sectionsById = useMemo(() => {
    const map = new Map<string, AttachmentSection>();
    sections.forEach((s) => map.set(s.id, s));
    return map;
  }, [sections]);

  async function loadAll() {
    setLoading(true);
    setMessage("");

    try {
      const [sectionsRes, settingsRes, typesRes] = await Promise.all([
        fetch("/api/attachments/sections?includeInactive=true"),
        fetch("/api/attachments/settings?includeInactive=true"),
        fetch("/api/attachments/types?includeInactive=true"),
      ]);

      const sectionsJson = await readJson(sectionsRes);
      const settingsJson = await readJson(settingsRes);
      const typesJson = await readJson(typesRes);

      setSections(sectionsJson.data || []);
      setSettings(settingsJson.data || []);
      setTypes(typesJson.data || []);
    } catch (error: any) {
      setMessage(error?.message || "حدث خطأ أثناء تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function saveSection() {
    setLoading(true);
    setMessage("");

    try {
      const isEdit = Boolean(sectionForm.id);

      const res = await fetch("/api/attachments/sections", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sectionForm),
      });

      const json = await readJson(res);
      setMessage(json.message || "تم الحفظ");
      setSectionForm(emptySection);
      await loadAll();
    } catch (error: any) {
      setMessage(error?.message || "تعذر حفظ قسم المرفقات");
    } finally {
      setLoading(false);
    }
  }

  async function saveSetting() {
    setLoading(true);
    setMessage("");

    try {
      const isEdit = Boolean(settingForm.id);

      const res = await fetch("/api/attachments/settings", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingForm),
      });

      const json = await readJson(res);
      setMessage(json.message || "تم الحفظ");
      setSettingForm(emptySetting);
      await loadAll();
    } catch (error: any) {
      setMessage(error?.message || "تعذر حفظ إعداد المرفقات");
    } finally {
      setLoading(false);
    }
  }

  async function saveType() {
    setLoading(true);
    setMessage("");

    try {
      const isEdit = Boolean(typeForm.id);

      const res = await fetch("/api/attachments/types", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(typeForm),
      });

      const json = await readJson(res);
      setMessage(json.message || "تم الحفظ");
      setTypeForm(emptyType);
      await loadAll();
    } catch (error: any) {
      setMessage(error?.message || "تعذر حفظ نوع المرفق");
    } finally {
      setLoading(false);
    }
  }

  async function disableItem(apiPath: string, id: string) {
    if (!confirm("هل تريد تعطيل هذا السجل؟")) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${apiPath}?id=${id}`, {
        method: "DELETE",
      });

      const json = await readJson(res);
      setMessage(json.message || "تم التعطيل");
      await loadAll();
    } catch (error: any) {
      setMessage(error?.message || "تعذر تعطيل السجل");
    } finally {
      setLoading(false);
    }
  }

  function editSection(row: AttachmentSection) {
    setActiveTab("sections");
    setSectionForm({
      ...row,
      section_name_en: row.section_name_en || "",
      entity_type: row.entity_type || "",
      default_allowed_extensions: row.default_allowed_extensions || "",
      default_allowed_mime_types: row.default_allowed_mime_types || "",
      default_max_file_size_mb: row.default_max_file_size_mb ?? "",
      notes: row.notes || "",
      sort_order: String(row.sort_order ?? 0),
    });
  }

  function editSetting(row: AttachmentSetting) {
    setActiveTab("settings");
    setSettingForm({
      ...row,
      setting_value: row.setting_value || "",
      scope_code: row.scope_code || "",
      description: row.description || "",
    });
  }

  function editType(row: AttachmentType) {
    setActiveTab("types");
    setTypeForm({
      ...row,
      name_en: row.name_en || "",
      entity_type: row.entity_type || "",
      section_id: row.section_id || "",
      path_segment: row.path_segment || "",
      allowed_extensions: row.allowed_extensions || "",
      allowed_mime_types: row.allowed_mime_types || "",
      max_file_size_mb: row.max_file_size_mb ?? "",
      min_width: row.min_width ?? "",
      max_width: row.max_width ?? "",
      min_height: row.min_height ?? "",
      max_height: row.max_height ?? "",
      path_template: row.path_template || "",
      sort_order: String(row.sort_order ?? 0),
      is_required: Boolean(row.is_required),
      is_active: Boolean(row.is_active ?? true),
      notes: row.notes || "",
    });
  }

  return (
     <div dir="rtl" className="space-y-6 text-slate-100">
	  <div className="mx-auto max-w-7xl space-y-6">
		<div className="space-y-2">
		  <h1 className="text-4xl font-bold text-white">إدارة إعدادات المرفقات</h1>
		  <p className="text-sm text-slate-400">
			إدارة أقسام المرفقات، الإعدادات العامة، وأنواع المرفقات بشكل ديناميكي.
		  </p>
		</div>

        {message && (
          <div className="rounded-xl border border-blue-700 bg-blue-950/40 px-4 py-3 text-sm text-blue-200">
            {message}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "sections"}
            onClick={() => setActiveTab("sections")}
          >
            أقسام المرفقات
          </TabButton>

          <TabButton
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          >
            إعدادات المرفقات
          </TabButton>

          <TabButton
            active={activeTab === "types"}
            onClick={() => setActiveTab("types")}
          >
            أنواع المرفقات
          </TabButton>

          <button
            onClick={loadAll}
            disabled={loading}
			className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            تحديث البيانات
          </button>
        </div>

        {activeTab === "sections" && (
          <SectionsTab
            rows={sections}
            form={sectionForm}
            setForm={setSectionForm}
            save={saveSection}
            edit={editSection}
            disable={(id) => disableItem("/api/attachments/sections", id)}
            loading={loading}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            rows={settings}
            form={settingForm}
            setForm={setSettingForm}
            save={saveSetting}
            edit={editSetting}
            disable={(id) => disableItem("/api/attachments/settings", id)}
            loading={loading}
          />
        )}

        {activeTab === "types" && (
          <TypesTab
            rows={types}
            sectionsById={sectionsById}
            sections={sections}
            form={typeForm}
            setForm={setTypeForm}
            save={saveType}
            edit={editType}
            disable={(id) => disableItem("/api/attachments/types", id)}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
		  active
			? "rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700"
			: "rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
		}
    >
      {children}
    </button>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass()}>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass()}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: any;
  onChange: (value: any) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className={labelClass()}>{label}</span>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={inputClass()}
      />
    </label>
  );
}

function CheckInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200">
      <span>{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-2 focus:ring-blue-500/30"
      />
    </label>
  );
}

function SectionsTab({
  rows,
  form,
  setForm,
  save,
  edit,
  disable,
  loading,
}: {
  rows: AttachmentSection[];
  form: any;
  setForm: (value: any) => void;
  save: () => void;
  edit: (row: AttachmentSection) => void;
  disable: (id: string) => void;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section className={cardClass()}>
        <h2 className="mb-4 text-lg font-bold">
          {form.id ? "تعديل قسم مرفقات" : "إضافة قسم مرفقات"}
        </h2>

        <div className="space-y-3">
          <TextInput
            label="كود القسم"
            value={form.section_code}
            onChange={(v) => setForm({ ...form, section_code: v })}
            placeholder="beneficiary_static"
          />

          <TextInput
            label="اسم القسم بالعربية"
            value={form.section_name_ar}
            onChange={(v) => setForm({ ...form, section_name_ar: v })}
          />

          <TextInput
            label="اسم القسم بالإنجليزية"
            value={form.section_name_en}
            onChange={(v) => setForm({ ...form, section_name_en: v })}
          />

          <TextInput
            label="نوع الكيان"
            value={form.entity_type}
            onChange={(v) => setForm({ ...form, entity_type: v })}
            placeholder="beneficiary / periodic_report / any"
          />

          <TextInput
            label="مجلد التخزين"
            value={form.storage_folder}
            onChange={(v) => setForm({ ...form, storage_folder: v })}
            placeholder="pic_const"
          />

          <TextArea
            label="قالب المسار"
            value={form.path_template}
            onChange={(v) => setForm({ ...form, path_template: v })}
          />

          <TextInput
            label="الامتدادات الافتراضية"
            value={form.default_allowed_extensions}
            onChange={(v) =>
              setForm({ ...form, default_allowed_extensions: v })
            }
            placeholder="jpg,jpeg,png,pdf"
          />

          <TextInput
            label="الحجم الأقصى الافتراضي MB"
            type="number"
            value={form.default_max_file_size_mb}
            onChange={(v) =>
              setForm({ ...form, default_max_file_size_mb: v })
            }
          />

          <TextInput
            label="الترتيب"
            type="number"
            value={form.sort_order}
            onChange={(v) => setForm({ ...form, sort_order: v })}
          />

          <div className="grid grid-cols-2 gap-2">
            <CheckInput
              label="يسمح بالتعدد"
              checked={Boolean(form.allow_multiple)}
              onChange={(v) => setForm({ ...form, allow_multiple: v })}
            />

            <CheckInput
              label="نشط"
              checked={Boolean(form.is_active)}
              onChange={(v) => setForm({ ...form, is_active: v })}
            />
          </div>

          <TextArea
            label="ملاحظات"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
          />

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={loading}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              حفظ
            </button>

            <button
              onClick={() => setForm(emptySection)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
            >
              جديد
            </button>
          </div>
        </div>
      </section>

      <section className={`${cardClass()} xl:col-span-2`}>
        <h2 className="mb-4 text-lg font-bold">قائمة أقسام المرفقات</h2>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-right text-slate-200">
                <th className="p-2">الكود</th>
                <th className="p-2">الاسم</th>
                <th className="p-2">المجلد</th>
                <th className="p-2">الكيان</th>
                <th className="p-2">نشط</th>
                <th className="p-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-700 text-slate-200">
                  <td className="p-2 font-mono text-xs">{row.section_code}</td>
                  <td className="p-2">{row.section_name_ar}</td>
                  <td className="p-2 font-mono text-xs">
                    {row.storage_folder}
                  </td>
                  <td className="p-2">{row.entity_type || "-"}</td>
                  <td className="p-2">{boolText(row.is_active)}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => edit(row)}
                        className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => disable(row.id)}
                        className="rounded bg-red-100 px-2 py-1 text-xs text-red-800"
                      >
                        تعطيل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-slate-500" colSpan={6}>
                    لا توجد بيانات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SettingsTab({
  rows,
  form,
  setForm,
  save,
  edit,
  disable,
  loading,
}: {
  rows: AttachmentSetting[];
  form: any;
  setForm: (value: any) => void;
  save: () => void;
  edit: (row: AttachmentSetting) => void;
  disable: (id: string) => void;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section className={cardClass()}>
        <h2 className="mb-4 text-lg font-bold">
          {form.id ? "تعديل إعداد" : "إضافة إعداد"}
        </h2>

        <div className="space-y-3">
          <TextInput
            label="مفتاح الإعداد"
            value={form.setting_key}
            onChange={(v) => setForm({ ...form, setting_key: v })}
            placeholder="attachments_root_path"
          />

          <TextInput
            label="قيمة الإعداد"
            value={form.setting_value}
            onChange={(v) => setForm({ ...form, setting_value: v })}
          />

          <label className="block">
            <span className={labelClass()}>نوع الإعداد</span>
            <select
              value={form.setting_type}
              onChange={(e) =>
                setForm({ ...form, setting_type: e.target.value })
              }
              className={inputClass()}
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
              <option value="json">json</option>
              <option value="path">path</option>
            </select>
          </label>

          <label className="block">
            <span className={labelClass()}>النطاق</span>
            <select
              value={form.scope_type}
              onChange={(e) =>
                setForm({ ...form, scope_type: e.target.value })
              }
              className={inputClass()}
            >
              <option value="global">global</option>
              <option value="section">section</option>
              <option value="entity">entity</option>
              <option value="type">type</option>
            </select>
          </label>

          <TextInput
            label="كود النطاق"
            value={form.scope_code}
            onChange={(v) => setForm({ ...form, scope_code: v })}
          />

          <TextArea
            label="الوصف"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
          />

          <div className="grid grid-cols-2 gap-2">
            <CheckInput
              label="مقفل"
              checked={Boolean(form.is_locked)}
              onChange={(v) => setForm({ ...form, is_locked: v })}
            />

            <CheckInput
              label="نشط"
              checked={Boolean(form.is_active)}
              onChange={(v) => setForm({ ...form, is_active: v })}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={loading}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              حفظ
            </button>

            <button
              onClick={() => setForm(emptySetting)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
            >
              جديد
            </button>
          </div>
        </div>
      </section>

      <section className={`${cardClass()} xl:col-span-2`}>
        <h2 className="mb-4 text-lg font-bold">قائمة الإعدادات</h2>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-right text-slate-200">
                <th className="p-2">المفتاح</th>
                <th className="p-2">القيمة</th>
                <th className="p-2">النوع</th>
                <th className="p-2">النطاق</th>
                <th className="p-2">مقفل</th>
                <th className="p-2">نشط</th>
                <th className="p-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-700 text-slate-200">
                  <td className="p-2 font-mono text-xs">{row.setting_key}</td>
                  <td className="max-w-[220px] truncate p-2">
                    {row.setting_value || "-"}
                  </td>
                  <td className="p-2">{row.setting_type}</td>
                  <td className="p-2">{row.scope_type}</td>
                  <td className="p-2">{boolText(row.is_locked)}</td>
                  <td className="p-2">{boolText(row.is_active)}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => edit(row)}
                        className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => disable(row.id)}
                        className="rounded bg-red-100 px-2 py-1 text-xs text-red-800"
                      >
                        تعطيل
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-slate-500" colSpan={7}>
                    لا توجد بيانات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TypesTab({
  rows,
  sectionsById,
  sections,
  form,
  setForm,
  save,
  edit,
  disable,
  loading,
}: {
  rows: AttachmentType[];
  sectionsById: Map<string, AttachmentSection>;
  sections: AttachmentSection[];
  form: any;
  setForm: (value: any) => void;
  save: () => void;
  edit: (row: AttachmentType) => void;
  disable: (id: string) => void;
  loading: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section className={cardClass()}>
        <h2 className="mb-4 text-lg font-bold">
          {form.id ? "تعديل نوع مرفق" : "إضافة نوع مرفق"}
        </h2>

        <div className="space-y-3">
          <TextInput
            label="كود النوع"
            value={form.code}
            onChange={(v) => setForm({ ...form, code: v })}
            placeholder="personal_photo"
          />

          <TextInput
            label="الاسم بالعربية"
            value={form.name_ar}
            onChange={(v) => setForm({ ...form, name_ar: v })}
          />

          <TextInput
            label="الاسم بالإنجليزية"
            value={form.name_en}
            onChange={(v) => setForm({ ...form, name_en: v })}
          />

          <TextInput
            label="التصنيف"
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
            placeholder="beneficiary / report"
          />

          <TextInput
            label="نوع الكيان"
            value={form.entity_type}
            onChange={(v) => setForm({ ...form, entity_type: v })}
            placeholder="beneficiary"
          />

          <label className="block">
            <span className={labelClass()}>القسم</span>
            <select
              value={form.section_id}
              onChange={(e) => setForm({ ...form, section_id: e.target.value })}
              className={inputClass()}
            >
              <option value="">بدون قسم</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.section_name_ar} - {section.storage_folder}
                </option>
              ))}
            </select>
          </label>

          <TextInput
            label="مجلد النوع داخل المسار"
            value={form.path_segment}
            onChange={(v) => setForm({ ...form, path_segment: v })}
            placeholder="pics / school / health"
          />

          <TextInput
            label="الامتدادات المسموحة"
            value={form.allowed_extensions}
            onChange={(v) => setForm({ ...form, allowed_extensions: v })}
            placeholder="jpg,jpeg,png,pdf"
          />

          <TextInput
            label="الحجم الأقصى MB"
            type="number"
            value={form.max_file_size_mb}
            onChange={(v) => setForm({ ...form, max_file_size_mb: v })}
          />

          <div className="grid grid-cols-2 gap-2">
            <TextInput
              label="أقل عرض"
              type="number"
              value={form.min_width}
              onChange={(v) => setForm({ ...form, min_width: v })}
            />

            <TextInput
              label="أقصى عرض"
              type="number"
              value={form.max_width}
              onChange={(v) => setForm({ ...form, max_width: v })}
            />

            <TextInput
              label="أقل ارتفاع"
              type="number"
              value={form.min_height}
              onChange={(v) => setForm({ ...form, min_height: v })}
            />

            <TextInput
              label="أقصى ارتفاع"
              type="number"
              value={form.max_height}
              onChange={(v) => setForm({ ...form, max_height: v })}
            />
          </div>

          <label className="block">
            <span className={labelClass()}>طريقة التسمية</span>
            <select
              value={form.naming_strategy}
              onChange={(e) =>
                setForm({ ...form, naming_strategy: e.target.value })
              }
              className={inputClass()}
            >
              <option value="file_number">file_number</option>
              <option value="file_number_sequence">file_number_sequence</option>
              <option value="file_number_timestamp">
                file_number_timestamp
              </option>
              <option value="original_name">original_name</option>
              <option value="uuid">uuid</option>
            </select>
          </label>

          <TextArea
            label="قالب مسار خاص لهذا النوع"
            value={form.path_template}
            onChange={(v) => setForm({ ...form, path_template: v })}
          />

          <TextInput
            label="الترتيب"
            type="number"
            value={form.sort_order}
            onChange={(v) => setForm({ ...form, sort_order: v })}
          />

          <div className="grid grid-cols-2 gap-2">
            <CheckInput
              label="إلزامي"
              checked={Boolean(form.is_required)}
              onChange={(v) => setForm({ ...form, is_required: v })}
            />

            <CheckInput
              label="صورة فقط"
              checked={Boolean(form.is_image_required)}
              onChange={(v) => setForm({ ...form, is_image_required: v })}
            />

            <CheckInput
              label="يسمح بالتعدد"
              checked={Boolean(form.allow_multiple)}
              onChange={(v) => setForm({ ...form, allow_multiple: v })}
            />

            <CheckInput
              label="نشط"
              checked={Boolean(form.is_active)}
              onChange={(v) => setForm({ ...form, is_active: v })}
            />
          </div>

          <TextArea
            label="ملاحظات"
            value={form.notes}
            onChange={(v) => setForm({ ...form, notes: v })}
          />

          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={loading}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              حفظ
            </button>

            <button
              onClick={() => setForm(emptyType)}
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
            >
              جديد
            </button>
          </div>
        </div>
      </section>

      <section className={`${cardClass()} xl:col-span-2`}>
        <h2 className="mb-4 text-lg font-bold">قائمة أنواع المرفقات</h2>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-right text-slate-200">
                <th className="p-2">الكود</th>
                <th className="p-2">الاسم</th>
                <th className="p-2">القسم</th>
                <th className="p-2">الامتدادات</th>
                <th className="p-2">الحجم</th>
                <th className="p-2">تعدد</th>
                <th className="p-2">نشط</th>
                <th className="p-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const section = row.section_id
                  ? sectionsById.get(row.section_id)
                  : null;

                return (
                  <tr key={row.id} className="border-b border-slate-700 text-slate-200">
                    <td className="p-2 font-mono text-xs">{row.code}</td>
                    <td className="p-2">{row.name_ar}</td>
                    <td className="p-2">
                      {section?.storage_folder || "-"}
                    </td>
                    <td className="p-2">{row.allowed_extensions || "-"}</td>
                    <td className="p-2">
                      {row.max_file_size_mb
                        ? `${row.max_file_size_mb} MB`
                        : "-"}
                    </td>
                    <td className="p-2">{boolText(row.allow_multiple)}</td>
                    <td className="p-2">{boolText(row.is_active)}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => edit(row)}
                          className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => disable(row.id)}
                          className="rounded bg-red-100 px-2 py-1 text-xs text-red-800"
                        >
                          تعطيل
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td className="p-4 text-center text-slate-500" colSpan={8}>
                    لا توجد بيانات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}