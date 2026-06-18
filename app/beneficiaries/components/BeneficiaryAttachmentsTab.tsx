"use client";

import { useEffect, useMemo, useState } from "react";

type AttachmentSection = {
  id: string;
  section_code: string;
  section_name_ar: string;
  storage_folder: string;
  entity_type?: string | null;
  is_active: boolean;
};

type AttachmentType = {
  id: string;
  code: string;
  name_ar: string;
  category: string;
  entity_type?: string | null;
  section_id?: string | null;
  path_segment?: string | null;
  is_required?: boolean | null;
  allowed_extensions?: string | null;
  max_file_size_mb?: number | null;
  allow_multiple?: boolean | null;
  is_image_required?: boolean | null;
  is_active?: boolean | null;
};

type EntityAttachment = {
  id: string;
  entity_type: string;
  entity_id: string;
  section_id?: string | null;
  attachment_type_id: string;
  file_number?: string | null;
  original_file_name?: string | null;
  stored_file_name: string;
  file_extension: string;
  mime_type?: string | null;
  file_size?: string | number | null;
  file_path: string;
  relative_path?: string | null;
  status: string;
  is_active: boolean;
  uploaded_at?: string | null;
  notes?: string | null;
  attachment_types?: AttachmentType | null;
  attachment_sections?: AttachmentSection | null;
};

type Props = {
  beneficiaryId: string;
  fileNumber?: string | null;
  branchId?: string | null;
  siteId?: string | null;
  centerId?: string | null;
};

const emptyForm = {
  attachment_type_id: "",
  section_id: "",
  original_file_name: "",
  stored_file_name: "",
  file_extension: "",
  mime_type: "",
  file_size: "",
  file_path: "",
  relative_path: "",
  notes: "",
};

function formatFileSize(size: string | number | null | undefined) {
  if (size === null || size === undefined || size === "") return "-";

  const n = Number(size);
  if (!Number.isFinite(n)) return "-";

  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;

  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("ar");
  } catch {
    return "-";
  }
}

function inputClass() {
  return "w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
}

function labelClass() {
  return "mb-1 block text-sm font-medium text-slate-300";
}

function cardClass() {
  return "rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-sm";
}

async function readJson(response: Response) {
  const json = await response.json().catch(() => null);

  if (!response.ok || json?.success === false) {
    throw new Error(json?.message || "حدث خطأ غير متوقع");
  }

  return json;
}

export default function BeneficiaryAttachmentsTab({
  beneficiaryId,
  fileNumber,
  branchId,
  siteId,
  centerId,
}: Props) {
  const [sections, setSections] = useState<AttachmentSection[]>([]);
  const [types, setTypes] = useState<AttachmentType[]>([]);
  const [attachments, setAttachments] = useState<EntityAttachment[]>([]);

  const [activeSection, setActiveSection] = useState<string>("");
  const [form, setForm] = useState<any>(emptyForm);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sectionsById = useMemo(() => {
    const map = new Map<string, AttachmentSection>();
    sections.forEach((section) => map.set(section.id, section));
    return map;
  }, [sections]);

  const typesBySection = useMemo(() => {
    return types.filter((type) => {
      if (!activeSection) return true;
      return type.section_id === activeSection;
    });
  }, [types, activeSection]);

  const attachmentsByType = useMemo(() => {
    const map = new Map<string, EntityAttachment[]>();

    attachments.forEach((item) => {
      const list = map.get(item.attachment_type_id) || [];
      list.push(item);
      map.set(item.attachment_type_id, list);
    });

    return map;
  }, [attachments]);

  async function loadData() {
    if (!beneficiaryId) return;

    setLoading(true);
    setMessage("");

    try {
      const [sectionsRes, typesRes, attachmentsRes] = await Promise.all([
        fetch("/api/attachments/sections?entity_type=beneficiary"),
        fetch("/api/attachments/types?entity_type=beneficiary"),
        fetch(
          `/api/attachments/entity?entity_type=beneficiary&entity_id=${beneficiaryId}`
        ),
      ]);

      const sectionsJson = await readJson(sectionsRes);
      const typesJson = await readJson(typesRes);
      const attachmentsJson = await readJson(attachmentsRes);

      const loadedSections = sectionsJson.data || [];

      setSections(loadedSections);
      setTypes(typesJson.data || []);
      setAttachments(attachmentsJson.data || []);

      setActiveSection((current) => current || loadedSections[0]?.id || "");
    } catch (error: any) {
      setMessage(error?.message || "حدث خطأ أثناء تحميل المرفقات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beneficiaryId]);

  function selectType(type: AttachmentType) {
    const section = type.section_id ? sectionsById.get(type.section_id) : null;

    setForm({
      ...emptyForm,
      attachment_type_id: type.id,
      section_id: type.section_id || "",
      file_extension: "",
      stored_file_name: fileNumber ? `${fileNumber}` : "",
      file_path: "",
      relative_path: "",
      notes: "",
    });

    if (section) {
      setActiveSection(section.id);
    }
  }

  async function saveAttachmentRecord() {
    if (!beneficiaryId) {
      setMessage("يجب حفظ بيانات المستفيد أولًا");
      return;
    }

    if (!form.attachment_type_id) {
      setMessage("اختر نوع المرفق أولًا");
      return;
    }

    if (!form.stored_file_name) {
      setMessage("اسم الملف المخزن مطلوب");
      return;
    }

    if (!form.file_extension) {
      setMessage("امتداد الملف مطلوب");
      return;
    }

    if (!form.file_path) {
      setMessage("مسار الملف مطلوب");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/attachments/entity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_type: "beneficiary",
          entity_id: beneficiaryId,

          beneficiary_id: beneficiaryId,
          branch_id: branchId || null,
          site_id: siteId || null,
          center_id: centerId || null,

          file_number: fileNumber || null,

          section_id: form.section_id || null,
          attachment_type_id: form.attachment_type_id,

          original_file_name: form.original_file_name || null,
          stored_file_name: form.stored_file_name,
          file_extension: form.file_extension,
          mime_type: form.mime_type || null,
          file_size: form.file_size || null,

          storage_driver: "local",
          file_path: form.file_path,
          relative_path: form.relative_path || null,

          notes: form.notes || null,
        }),
      });

      const json = await readJson(res);

      setMessage(json.message || "تم حفظ سجل المرفق");
      setForm(emptyForm);
      await loadData();
    } catch (error: any) {
      setMessage(error?.message || "تعذر حفظ سجل المرفق");
    } finally {
      setLoading(false);
    }
  }

  async function disableAttachment(id: string) {
    if (!confirm("هل تريد تعطيل هذا المرفق؟")) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/attachments/entity?id=${id}`, {
        method: "DELETE",
      });

      const json = await readJson(res);

      setMessage(json.message || "تم تعطيل المرفق");
      await loadData();
    } catch (error: any) {
      setMessage(error?.message || "تعذر تعطيل المرفق");
    } finally {
      setLoading(false);
    }
  }

  if (!beneficiaryId) {
    return (
      <div className="rounded-2xl border border-amber-700 bg-amber-950/30 p-4 text-sm text-amber-200">
        يجب حفظ بيانات المستفيد أولًا قبل إدارة المرفقات.
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-5 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-white">مرفقات المستفيد</h3>
          <p className="mt-1 text-sm text-slate-400">
            عرض وإدارة مرفقات المستفيد باستخدام نظام المرفقات العام.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
        >
          تحديث
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-blue-700 bg-blue-950/40 px-4 py-3 text-sm text-blue-200">
          {message}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={
              activeSection === section.id
                ? "rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-green-700"
                : "rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            }
          >
            {section.section_name_ar}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <section className={`${cardClass()} xl:col-span-2`}>
          <h4 className="mb-4 text-lg font-bold text-white">أنواع المرفقات</h4>

          <div className="overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-slate-800 text-right text-slate-200">
                  <th className="p-2">نوع المرفق</th>
                  <th className="p-2">القسم</th>
                  <th className="p-2">إلزامي</th>
                  <th className="p-2">الامتدادات</th>
                  <th className="p-2">الحجم</th>
                  <th className="p-2">المرفقات الحالية</th>
                  <th className="p-2">إجراء</th>
                </tr>
              </thead>

              <tbody>
                {typesBySection.map((type) => {
                  const currentAttachments =
                    attachmentsByType.get(type.id) || [];
                  const section = type.section_id
                    ? sectionsById.get(type.section_id)
                    : null;

                  return (
                    <tr
                      key={type.id}
                      className="border-b border-slate-700 text-slate-200"
                    >
                      <td className="p-2">
                        <div className="font-semibold">{type.name_ar}</div>
                        <div className="font-mono text-xs text-slate-500">
                          {type.code}
                        </div>
                      </td>

                      <td className="p-2">
                        {section?.storage_folder || "-"}
                      </td>

                      <td className="p-2">
                        {type.is_required ? "نعم" : "لا"}
                      </td>

                      <td className="p-2">
                        {type.allowed_extensions || "-"}
                      </td>

                      <td className="p-2">
                        {type.max_file_size_mb
                          ? `${type.max_file_size_mb} MB`
                          : "-"}
                      </td>

                      <td className="p-2">
                        {currentAttachments.length > 0 ? (
                          <span className="rounded-lg bg-green-950 px-2 py-1 text-xs text-green-300">
                            {currentAttachments.length} مرفق
                          </span>
                        ) : (
                          <span className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-400">
                            لا يوجد
                          </span>
                        )}
                      </td>

                      <td className="p-2">
                        <button
                          onClick={() => selectType(type)}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                        >
                          إضافة سجل
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {typesBySection.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-4 text-center text-slate-400"
                    >
                      لا توجد أنواع مرفقات مفعلة لهذا القسم.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={cardClass()}>
          <h4 className="mb-4 text-lg font-bold text-white">
            إضافة سجل مرفق
          </h4>

          <div className="space-y-3">
            <label className="block">
              <span className={labelClass()}>نوع المرفق</span>
              <select
                value={form.attachment_type_id}
                onChange={(e) => {
                  const selected = types.find(
                    (type) => type.id === e.target.value
                  );

                  if (selected) {
                    selectType(selected);
                  } else {
                    setForm({
                      ...form,
                      attachment_type_id: "",
                      section_id: "",
                    });
                  }
                }}
                className={inputClass()}
              >
                <option value="">اختر نوع المرفق</option>
                {typesBySection.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name_ar}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={labelClass()}>اسم الملف الأصلي</span>
              <input
                value={form.original_file_name}
                onChange={(e) =>
                  setForm({ ...form, original_file_name: e.target.value })
                }
                className={inputClass()}
                placeholder="example.pdf"
              />
            </label>

            <label className="block">
              <span className={labelClass()}>اسم الملف المخزن</span>
              <input
                value={form.stored_file_name}
                onChange={(e) =>
                  setForm({ ...form, stored_file_name: e.target.value })
                }
                className={inputClass()}
                placeholder={fileNumber || "10025"}
              />
            </label>

            <label className="block">
              <span className={labelClass()}>امتداد الملف</span>
              <input
                value={form.file_extension}
                onChange={(e) =>
                  setForm({ ...form, file_extension: e.target.value })
                }
                className={inputClass()}
                placeholder="jpg / pdf"
              />
            </label>

            <label className="block">
              <span className={labelClass()}>نوع MIME</span>
              <input
                value={form.mime_type}
                onChange={(e) =>
                  setForm({ ...form, mime_type: e.target.value })
                }
                className={inputClass()}
                placeholder="image/jpeg"
              />
            </label>

            <label className="block">
              <span className={labelClass()}>حجم الملف بالبايت</span>
              <input
                type="number"
                value={form.file_size}
                onChange={(e) =>
                  setForm({ ...form, file_size: e.target.value })
                }
                className={inputClass()}
                placeholder="102400"
              />
            </label>

            <label className="block">
              <span className={labelClass()}>مسار الملف</span>
              <textarea
                value={form.file_path}
                onChange={(e) =>
                  setForm({ ...form, file_path: e.target.value })
                }
                rows={3}
                className={inputClass()}
                placeholder="uploads/pic_const/BR01/SITE01/pics/1.jpg"
              />
            </label>

            <label className="block">
              <span className={labelClass()}>ملاحظات</span>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className={inputClass()}
              />
            </label>

            <div className="flex gap-2">
              <button
                onClick={saveAttachmentRecord}
                disabled={loading}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                حفظ السجل
              </button>

              <button
                onClick={() => setForm(emptyForm)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                جديد
              </button>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs leading-6 text-slate-400">
              هذه المرحلة تضيف سجل المرفق فقط، ولا ترفع الملف فعليًا بعد.
              الرفع الفعلي سيتم في المرحلة التالية.
            </div>
          </div>
        </section>
      </div>

      <section className={cardClass()}>
        <h4 className="mb-4 text-lg font-bold text-white">
          المرفقات المسجلة
        </h4>

        <div className="overflow-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="bg-slate-800 text-right text-slate-200">
                <th className="p-2">نوع المرفق</th>
                <th className="p-2">اسم الملف</th>
                <th className="p-2">الامتداد</th>
                <th className="p-2">الحجم</th>
                <th className="p-2">المسار</th>
                <th className="p-2">تاريخ الرفع</th>
                <th className="p-2">الحالة</th>
                <th className="p-2">إجراء</th>
              </tr>
            </thead>

            <tbody>
              {attachments.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-slate-700 text-slate-200"
                >
                  <td className="p-2">
                    {item.attachment_types?.name_ar || "-"}
                  </td>
                  <td className="p-2">
                    {item.original_file_name || item.stored_file_name}
                  </td>
                  <td className="p-2">{item.file_extension}</td>
                  <td className="p-2">{formatFileSize(item.file_size)}</td>
                  <td className="max-w-[320px] truncate p-2 font-mono text-xs text-slate-400">
                    {item.relative_path || item.file_path}
                  </td>
                  <td className="p-2">{formatDate(item.uploaded_at)}</td>
                  <td className="p-2">{item.status || "-"}</td>
                  <td className="p-2">
                    <button
                      onClick={() => disableAttachment(item.id)}
                      className="rounded bg-red-950 px-2 py-1 text-xs text-red-300 hover:bg-red-900"
                    >
                      تعطيل
                    </button>
                  </td>
                </tr>
              ))}

              {attachments.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-slate-400">
                    لا توجد مرفقات مسجلة لهذا المستفيد.
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