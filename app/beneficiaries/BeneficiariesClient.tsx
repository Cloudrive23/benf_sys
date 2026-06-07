"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";

import BeneficiaryBasicTab from "./components/BeneficiaryBasicTab";
import BeneficiaryFamilyTab from "./components/BeneficiaryFamilyTab";
import BeneficiarySocialTab from "./components/BeneficiarySocialTab";
import DynamicBeneficiaryFields from "./components/dynamic/DynamicBeneficiaryFields";
import BeneficiaryFamilyMembersTab from "./components/BeneficiaryFamilyMembersTab";

import FathersClient from "@/app/fathers/FathersClient";
import MothersClient from "@/app/mothers/MothersClient";
import GuardiansClient from "@/app/guardians/GuardiansClient";

import DynamicEntityTable from "@/app/components/dynamic/DynamicEntityTable";
import { saveEntityWithPolicies } from "@/app/lib/client/save-entity-with-policies";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import type { EntityPickerItem } from "@/app/components/entity-picker/EntityPicker";

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
  code?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
};

type Beneficiary = {
  id: string;
  beneficiary_code: string;
  file_number?: string | null;
  external_reference?: string | null;

  first_name?: string | null;
  father_name?: string | null;
  grandfather_name?: string | null;
  family_name?: string | null;
  full_name?: string | null;

  gender?: string | null;
  birth_date?: string | null;
  identity_type?: string | null;
  identity_number?: string | null;
  phone?: string | null;
  alternative_phone?: string | null;
  address?: string | null;

  beneficiary_type?: string | null;
  current_status?: string | null;
  status_id?: string | null;
  status?: LookupItem | null;

  branch_id?: string | null;
  site_id?: string | null;
  center_id?: string | null;

  father_id?: string | null;
  mother_id?: string | null;
  guardian_id?: string | null;

  social_notes?: string | null;
  is_active?: boolean | null;

  beneficiary_related_persons?: any[];
};

const emptyForm = {
  id: "",
  beneficiary_code: "",
  file_number: "",
  external_reference: "",

  first_name: "",
  father_name: "",
  grandfather_name: "",
  family_name: "",

  gender: "",
  birth_date: "",
  identity_type: "",
  identity_number: "",
  phone: "",
  alternative_phone: "",
  address: "",

  beneficiary_type: "orphan",
  current_status: "draft",
  status_id: "",

  is_active: true,

  branch_id: "",
  site_id: "",
  center_id: "",

  father_id: "",
  mother_id: "",
  guardian_id: "",

  father: { full_name: "", phone: "", identity_number: "" },
  mother: { full_name: "", phone: "", identity_number: "" },
  guardian: { full_name: "", phone: "", identity_number: "" },

  social_notes: "",
};

const tabs = [
  { key: "basic", label: "البيانات الأساسية" },
  { key: "family", label: "الأسرة" },
  { key: "social", label: "الاجتماعية" },
  { key: "dynamic", label: "البيانات الإضافية" },
  { key: "familyMembers", label: "بيانات الأشقاء" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

function lookupLabel(items: LookupItem[], value?: string | null) {
  if (!value) return "";

  const found = items.find(
    (item) =>
      item.id === value ||
      item.code === value ||
      item.name_ar === value ||
      item.name_en === value
  );

  return found?.name_ar || found?.name_en || found?.code || "";
}

function legacyStatusLabel(value?: string | null) {
  if (value === "draft") return "مسودة";
  if (value === "active") return "نشط";
  if (value === "stopped") return "موقوف";
  if (value === "closed") return "مغلق";
  return value || "";
}

function legacyGenderLabel(value?: string | null) {
  if (value === "male") return "ذكر";
  if (value === "female") return "أنثى";
  return value || "";
}

export default function BeneficiariesClient() {
  const [items, setItems] = useState<Beneficiary[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("basic");

  const [inlineCreateType, setInlineCreateType] = useState<
    "" | "father" | "mother" | "guardian"
  >("");

  const [branches, setBranches] = useState<OrgUnit[]>([]);
  const [sites, setSites] = useState<OrgUnit[]>([]);
  const [centers, setCenters] = useState<OrgUnit[]>([]);

  const [fathers, setFathers] = useState<EntityPickerItem[]>([]);
  const [mothers, setMothers] = useState<EntityPickerItem[]>([]);
  const [guardians, setGuardians] = useState<EntityPickerItem[]>([]);

  const [beneficiaryStatuses, setBeneficiaryStatuses] = useState<LookupItem[]>(
    []
  );
  const [genders, setGenders] = useState<LookupItem[]>([]);
  const [identityTypes, setIdentityTypes] = useState<LookupItem[]>([]);

  const [dynamicValues, setDynamicValues] = useState<Record<string, any>>({});

  async function load() {
    const res = await fetch("/api/beneficiaries", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      setItems(data.data || []);
    } else {
      toast.error(data.message || "تعذر تحميل بيانات المستفيدين");
    }
  }

  async function loadOrgUnits() {
    const res = await fetch("/api/lookups/org-units", { cache: "no-store" });
    const data = await res.json();

    if (!data.success) return;

    const loadedBranches = data.data?.branches || [];
    const loadedSites = data.data?.sites || [];
    const loadedCenters = data.data?.centers || [];

    setBranches(loadedBranches);
    setSites(loadedSites);
    setCenters(loadedCenters);
  }

  async function loadLookup(type: string, setter: (items: LookupItem[]) => void) {
    const res = await fetch(`/api/lookups?type=${type}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (data.success) {
      setter(data.data || []);
    }
  }

  async function loadAllLookups() {
    await Promise.all([
      loadOrgUnits(),
      loadLookup("beneficiary_statuses", setBeneficiaryStatuses),
      loadLookup("genders", setGenders),
      loadLookup("identity_types", setIdentityTypes),
    ]);
  }

  async function loadNextNumbers() {
    try {
      const res = await fetch("/api/beneficiaries/next-numbers", {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success) {
        setForm((old) => ({
          ...old,
          beneficiary_code: data.data?.beneficiary_code || old.beneficiary_code,
          file_number: data.data?.file_number || old.file_number,
          external_reference:
            data.data?.external_reference ||
            data.data?.beneficiary_code ||
            old.external_reference,
        }));
      }
    } catch {
      // لا نوقف فتح النموذج إذا لم يكن مسار الترقيم التلقائي موجودًا.
    }
  }

  async function loadFathers() {
    const res = await fetch("/api/fathers", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      setFathers(
        (data.data || []).map((x: any) => ({
          id: x.id,
          code: x.father_code,
          name: x.full_name_ar,
        }))
      );
    }
  }

  async function loadMothers() {
    const res = await fetch("/api/mothers", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      setMothers(
        (data.data || []).map((x: any) => ({
          id: x.id,
          code: x.mother_code,
          name: x.full_name_ar,
        }))
      );
    }
  }

  async function loadGuardians() {
    const res = await fetch("/api/guardians", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      setGuardians(
        (data.data || []).map((x: any) => ({
          id: x.id,
          code: x.guardian_code,
          name: x.full_name_ar,
        }))
      );
    }
  }

  async function refreshRelatedLists() {
    await Promise.all([loadFathers(), loadMothers(), loadGuardians()]);
  }

  useEffect(() => {
    load();
    loadAllLookups();
    refreshRelatedLists();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return items;

    return items.filter((x) =>
      `
      ${x.beneficiary_code || ""}
      ${x.file_number || ""}
      ${x.full_name || ""}
      ${x.phone || ""}
      ${x.identity_number || ""}
      ${x.external_reference || ""}
      `
        .toLowerCase()
        .includes(q)
    );
  }, [items, search]);

  function getRelated(item: any, type: string) {
    return item.beneficiary_related_persons?.find(
      (x: any) => x.relation_type === type
    )?.related_persons;
  }

  async function loadDynamicValues(beneficiaryId: string) {
    const res = await fetch(
      `/api/beneficiary-custom-values?beneficiary_id=${beneficiaryId}`,
      { cache: "no-store" }
    );

    const data = await res.json();

    if (data.success) {
      setDynamicValues(data.data || {});
    } else {
      setDynamicValues({});
    }
  }

  function getDefaultOrgSelection() {
    const branchId = branches[0]?.id || "";
    const siteId =
      sites.find((site) => !branchId || !site.branch_id || site.branch_id === branchId)
        ?.id || "";
    const centerId =
      centers.find((center) => {
        if (siteId && center.site_id) return center.site_id === siteId;
        if (branchId && center.branch_id) return center.branch_id === branchId;
        return true;
      })?.id || "";

    return { branchId, siteId, centerId };
  }

  async function openCreate() {
    const defaults = getDefaultOrgSelection();

    setForm({
      ...emptyForm,
      branch_id: defaults.branchId,
      site_id: defaults.siteId,
      center_id: defaults.centerId,
      status_id: beneficiaryStatuses[0]?.id || "",
      gender: "male",
    });

    setDynamicValues({});
    setActiveTab("basic");
    setOpen(true);

    await loadNextNumbers();
  }

  function edit(item: Beneficiary) {
    const father = getRelated(item, "father");
    const mother = getRelated(item, "mother");
    const guardian = getRelated(item, "guardian");

    setForm({
      ...emptyForm,

      id: item.id,
      beneficiary_code: item.beneficiary_code || "",
      file_number: item.file_number || "",
      external_reference: item.external_reference || "",

      first_name: item.first_name || "",
      father_name: item.father_name || "",
      grandfather_name: item.grandfather_name || "",
      family_name: item.family_name || "",

      gender: item.gender || "male",
      birth_date: item.birth_date ? String(item.birth_date).slice(0, 10) : "",
      identity_type: item.identity_type || "",
      identity_number: item.identity_number || "",
      phone: item.phone || "",
      alternative_phone: item.alternative_phone || "",
      address: item.address || "",

      beneficiary_type: item.beneficiary_type || "orphan",
      current_status: item.current_status || "draft",
      status_id: item.status_id || "",

      branch_id: item.branch_id || "",
      site_id: item.site_id || "",
      center_id: item.center_id || "",

      father_id: item.father_id || "",
      mother_id: item.mother_id || "",
      guardian_id: item.guardian_id || "",

      father: {
        full_name: father?.full_name || "",
        identity_number: father?.identity_number || "",
        phone: father?.phone || "",
      },
      mother: {
        full_name: mother?.full_name || "",
        identity_number: mother?.identity_number || "",
        phone: mother?.phone || "",
      },
      guardian: {
        full_name: guardian?.full_name || "",
        identity_number: guardian?.identity_number || "",
        phone: guardian?.phone || "",
      },

      social_notes: item.social_notes || "",
      is_active: item.is_active ?? true,
    });

    setActiveTab("basic");
    setOpen(true);
    loadDynamicValues(item.id);
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.branch_id) {
      toast.error("يجب اختيار الفرع / المحافظة");
      return;
    }

    if (!form.site_id) {
      toast.error("يجب اختيار الموقع");
      return;
    }

    if (!form.center_id) {
      toast.error("يجب اختيار المركز");
      return;
    }

    if (!form.first_name) {
      toast.error("يجب إدخال اسم المستفيد");
      return;
    }

    setSaving(true);

    await saveEntityWithPolicies({
      url: "/api/beneficiaries",
      method: form.id ? "PUT" : "POST",
      data: {
        ...form,
        current_status: legacyStatusValue(form.current_status),
      },
      successMessage: "تم حفظ بيانات المستفيد بنجاح",
      errorMessage: "تعذر حفظ بيانات المستفيد",
      onSuccess: async (savedData: any) => {
        const beneficiaryId = savedData?.id || savedData?.data?.id || form.id;

        if (beneficiaryId) {
          await fetch("/api/beneficiary-custom-values", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              beneficiary_id: beneficiaryId,
              values: dynamicValues,
            }),
          });
        }

        setOpen(false);
        setForm(emptyForm);
        setDynamicValues({});
        await load();
      },
    });

    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("هل أنت متأكد من حذف المستفيد؟")) return;

    const res = await fetch(`/api/beneficiaries?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      toast.success(data.message || "تم الحذف بنجاح");
      await load();
    } else {
      toast.error(data.message || "تعذر الحذف");
    }
  }

  function legacyStatusValue(value: any) {
    const text = String(value || "").trim();
    const allowed = ["draft", "active", "stopped", "closed"];

    return allowed.includes(text) ? text : "draft";
  }

  function getStatusLabel(row: Beneficiary) {
    if (row.status?.name_ar) return row.status.name_ar;

    if (row.status_id) {
      const found = beneficiaryStatuses.find((x) => x.id === row.status_id);
      if (found) return found.name_ar || found.name_en || found.code || "";
    }

    return legacyStatusLabel(row.current_status) || "مسودة";
  }

  function getIdentityTypeLabel(row: Beneficiary) {
    return lookupLabel(identityTypes, row.identity_type) || row.identity_type || "-";
  }

  function getGenderLabel(row: Beneficiary) {
    return lookupLabel(genders, row.gender) || legacyGenderLabel(row.gender) || "-";
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستفيدين</h1>

          <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
            تسجيل ومتابعة بيانات المستفيدين
          </p>
        </div>

        <Button
          type="button"
          onClick={openCreate}
          style={{
            backgroundColor: "var(--app-primary)",
            color: "white",
          }}
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة مستفيد
        </Button>
      </div>

      <div
        className="rounded-2xl border p-4 sm:p-6 space-y-4"
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >
        <div className="relative max-w-xl">
          <Search className="absolute right-3 top-3 w-4 h-4 opacity-60" />

          <Input
            className="pr-10"
            placeholder="بحث بالاسم، رقم المستفيد، رقم الملف، الهوية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <DynamicEntityTable
          entityKey="beneficiary"
          rows={filtered}
          loading={false}
          emptyMessage="لا توجد بيانات"
          renderValue={(row, field) => {
            if (field.field_name === "gender") {
              return getGenderLabel(row);
            }

            if (field.field_name === "identity_type") {
              return getIdentityTypeLabel(row);
            }

            if (
              field.field_name === "current_status" ||
              field.field_name === "status_id"
            ) {
              return <Badge>{getStatusLabel(row)}</Badge>;
            }

            if (field.field_name === "is_active") {
              return <Badge>{row.is_active ? "نشط" : "غير نشط"}</Badge>;
            }

            return undefined;
          }}
          actions={(item) => (
            <>
              <Button size="sm" variant="outline" onClick={() => edit(item)}>
                <Pencil className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="destructive"
                onClick={() => remove(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 p-2 sm:p-4">
          <div
            className="mx-auto flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border"
            style={{
              backgroundColor: "var(--app-surface)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-6">
              <h2 className="text-xl font-bold">
                {form.id ? "تعديل مستفيد" : "إضافة مستفيد"}
              </h2>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-white/10"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={save} className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b px-4 py-3 sm:px-6">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {tabs.map((tab) => (
                    <button
                      type="button"
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition ${
                        activeTab === tab.key
                          ? "bg-green-600 text-white"
                          : "hover:bg-white/10"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">
                {activeTab === "basic" && (
                  <BeneficiaryBasicTab
                    form={form}
                    setForm={setForm}
                    branches={branches}
                    sites={sites}
                    centers={centers}
                    genders={genders}
                    identityTypes={identityTypes}
                  />
                )}

                {activeTab === "family" && (
                  <BeneficiaryFamilyTab
                    form={form}
                    setForm={setForm}
                    fathers={fathers}
                    mothers={mothers}
                    guardians={guardians}
                    onCreateFather={() => setInlineCreateType("father")}
                    onCreateMother={() => setInlineCreateType("mother")}
                    onCreateGuardian={() => setInlineCreateType("guardian")}
                  />
                )}

                {activeTab === "social" && (
                  <BeneficiarySocialTab
                    form={form}
                    setForm={setForm}
                    statuses={beneficiaryStatuses}
                  />
                )}

                {activeTab === "dynamic" && (
                  <DynamicBeneficiaryFields
                    values={dynamicValues}
                    setValues={setDynamicValues}
                  />
                )}

                {activeTab === "familyMembers" && (
                  <BeneficiaryFamilyMembersTab beneficiaryId={form.id} />
                )}
              </div>

              <div className="flex shrink-0 justify-end gap-3 border-t px-4 py-3 sm:px-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="min-w-24"
                >
                  إلغاء
                </Button>

                <Button
                  type="submit"
                  disabled={saving}
                  className="min-w-24"
                  style={{
                    backgroundColor: "var(--app-primary)",
                    color: "white",
                  }}
                >
                  {saving ? "جاري الحفظ..." : "حفظ"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {inlineCreateType && (
        <div className="fixed inset-0 z-[60] bg-black/70 p-2 sm:p-4">
          <div
            className="mx-auto flex h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border"
            style={{
              backgroundColor: "var(--app-bg)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 sm:px-6">
              <h2 className="text-xl font-bold">
                {inlineCreateType === "father"
                  ? "إضافة أب"
                  : inlineCreateType === "mother"
                  ? "إضافة أم"
                  : "إضافة معيل"}
              </h2>

              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  await refreshRelatedLists();
                  setInlineCreateType("");
                }}
              >
                إغلاق
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
              {inlineCreateType === "father" && <FathersClient />}
              {inlineCreateType === "mother" && <MothersClient />}
              {inlineCreateType === "guardian" && <GuardiansClient />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
