"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";

type OrgUnit = {
  id: string;
  branch_name_ar?: string;
  site_name_ar?: string;
  center_name_ar?: string;
  branch_id?: string;
  site_id?: string;
};

type LookupItem = {
  id: string;
  name_ar?: string | null;
  name_en?: string | null;
  code?: string | null;
};

type Props = {
  form: any;
  setForm: (value: any) => void;
  branches: OrgUnit[];
  sites: OrgUnit[];
  centers: OrgUnit[];
  genders: LookupItem[];
  identityTypes: LookupItem[];
};

const selectClass = "w-full rounded-md border bg-transparent p-2";

function getGenderValue(item: LookupItem) {
  const code = String(item.code || "").trim().toLowerCase();
  const name = String(item.name_ar || "").trim();

  if (code === "male" || code === "female") return code;
  if (name === "ذكر") return "male";
  if (name === "انثى" || name === "أنثى") return "female";

  return code || item.name_ar || item.name_en || item.id;
}

function getIdentityTypeValue(item: LookupItem) {
  return item.code || item.name_ar || item.name_en || item.id;
}

export default function BeneficiaryBasicTab({
  form,
  setForm,
  branches,
  sites,
  centers,
  genders,
  identityTypes,
}: Props) {
  const filteredSites = sites.filter((site) => {
    if (!form.branch_id) return true;
    return !site.branch_id || site.branch_id === form.branch_id;
  });

  const filteredCenters = centers.filter((center) => {
    if (form.site_id && center.site_id) {
      return center.site_id === form.site_id;
    }

    if (form.branch_id && center.branch_id) {
      return center.branch_id === form.branch_id;
    }

    return true;
  });

  function updateField(field: string, value: any) {
    setForm({
      ...form,
      [field]: value,
    });
  }

  function updateBranch(branchId: string) {
    const nextSites = sites.filter((site) => {
      return !site.branch_id || site.branch_id === branchId;
    });

    const nextSiteId = nextSites[0]?.id || "";

    const nextCenters = centers.filter((center) => {
      if (nextSiteId && center.site_id) return center.site_id === nextSiteId;
      if (branchId && center.branch_id) return center.branch_id === branchId;
      return true;
    });

    setForm({
      ...form,
      branch_id: branchId,
      site_id: nextSiteId,
      center_id: nextCenters[0]?.id || "",
    });
  }

  function updateSite(siteId: string) {
    const selectedSite = sites.find((site) => site.id === siteId);

    const nextCenters = centers.filter((center) => {
      if (siteId && center.site_id) return center.site_id === siteId;
      if (selectedSite?.branch_id && center.branch_id) {
        return center.branch_id === selectedSite.branch_id;
      }
      return true;
    });

    setForm({
      ...form,
      site_id: siteId,
      branch_id: selectedSite?.branch_id || form.branch_id,
      center_id: nextCenters[0]?.id || "",
    });
  }

  return (
    <div className="space-y-6">
      <Section title="النطاق الإداري">
        <Field label="الفرع / المحافظة" required>
          <select
            required
            className={selectClass}
            value={form.branch_id || ""}
            onChange={(e) => updateBranch(e.target.value)}
          >
            <option value="">اختر الفرع / المحافظة</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branch_name_ar}
              </option>
            ))}
          </select>
        </Field>

        <Field label="الموقع" required>
          <select
            required
            className={selectClass}
            value={form.site_id || ""}
            onChange={(e) => updateSite(e.target.value)}
          >
            <option value="">اختر الموقع</option>
            {filteredSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.site_name_ar}
              </option>
            ))}
          </select>
        </Field>

        <Field label="المركز" required>
          <select
            required
            className={selectClass}
            value={form.center_id || ""}
            onChange={(e) => updateField("center_id", e.target.value)}
          >
            <option value="">اختر المركز</option>
            {filteredCenters.map((center) => (
              <option key={center.id} value={center.id}>
                {center.center_name_ar}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="أرقام وتعريفات المستفيد">
        <Field label="رقم المستفيد">
          <Input
            value={form.beneficiary_code || ""}
            onChange={(e) => updateField("beneficiary_code", e.target.value)}
          />
        </Field>

        <Field label="رقم الملف">
          <Input
            value={form.file_number || ""}
            onChange={(e) => updateField("file_number", e.target.value)}
          />
        </Field>

        <Field label="المرجع الخارجي">
          <Input
            value={form.external_reference || ""}
            onChange={(e) => updateField("external_reference", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="بيانات الاسم">
        <Field label="الاسم الأول" required>
          <Input
            required
            value={form.first_name || ""}
            onChange={(e) => updateField("first_name", e.target.value)}
          />
        </Field>

        <Field label="اسم الأب">
          <Input
            value={form.father_name || ""}
            onChange={(e) => updateField("father_name", e.target.value)}
          />
        </Field>

        <Field label="اسم الجد">
          <Input
            value={form.grandfather_name || ""}
            onChange={(e) => updateField("grandfather_name", e.target.value)}
          />
        </Field>

        <Field label="اللقب">
          <Input
            value={form.family_name || ""}
            onChange={(e) => updateField("family_name", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="البيانات الشخصية">
        <Field label="الجنس" required>
          <select
            required
            className={selectClass}
            value={form.gender || ""}
            onChange={(e) => updateField("gender", e.target.value)}
          >
            <option value="">اختر الجنس</option>
            {genders.map((item) => (
              <option key={item.id} value={getGenderValue(item)}>
                {item.name_ar || item.name_en || item.code}
              </option>
            ))}
          </select>
        </Field>

        <Field label="تاريخ الميلاد">
          <Input
            type="date"
            value={form.birth_date || ""}
            onChange={(e) => updateField("birth_date", e.target.value)}
          />
        </Field>

        <Field label="نوع الهوية">
          <select
            className={selectClass}
            value={form.identity_type || ""}
            onChange={(e) => updateField("identity_type", e.target.value)}
          >
            <option value="">اختر نوع الهوية</option>
            {identityTypes.map((item) => (
              <option key={item.id} value={getIdentityTypeValue(item)}>
                {item.name_ar || item.name_en || item.code}
              </option>
            ))}
          </select>
        </Field>

        <Field label="رقم الهوية">
          <Input
            value={form.identity_number || ""}
            onChange={(e) => updateField("identity_number", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="بيانات التواصل">
        <Field label="الهاتف">
          <Input
            value={form.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </Field>

        <Field label="الهاتف البديل">
          <Input
            value={form.alternative_phone || ""}
            onChange={(e) => updateField("alternative_phone", e.target.value)}
          />
        </Field>

        <div className="sm:col-span-2 xl:col-span-3">
          <Field label="العنوان">
            <textarea
              className="min-h-[90px] w-full rounded-md border bg-transparent p-2"
              value={form.address || ""}
              onChange={(e) => updateField("address", e.target.value)}
            />
          </Field>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border p-4">
      <h3 className="mb-4 border-b pb-3 text-base font-bold">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm">
        {label}
        {required && <span className="mr-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
