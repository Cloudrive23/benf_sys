"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import BeneficiaryBasicTab from "./components/BeneficiaryBasicTab";
import BeneficiaryFamilyTab from "./components/BeneficiaryFamilyTab";
import BeneficiarySocialTab from "./components/BeneficiarySocialTab";
import DynamicBeneficiaryFields from "./components/dynamic/DynamicBeneficiaryFields";
import BeneficiaryFamilyMembersTab from "./components/BeneficiaryFamilyMembersTab";
import BeneficiarySponsorLinksTab from "./components/BeneficiarySponsorLinksTab";

import FathersClient from "@/app/fathers/FathersClient";
import MothersClient from "@/app/mothers/MothersClient";
import GuardiansClient from "@/app/guardians/GuardiansClient";

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

type LookupItem = {
  id: string;
  code?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
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
  current_status: "",
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

function lookupLabel(items: LookupItem[], value?: string | null) {
  if (!value) return "";

  const found = items.find(
    (item) =>
      item.id === value ||
      item.code === value ||
      item.name_ar === value ||
      item.name_en === value
  );

  return found?.name_ar || found?.name_en || "";
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
  const [activeTab, setActiveTab] = useState("basic");

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

  const [dynamicValues, setDynamicValues] = useState<any>({});
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  function can(permissionCode: string) {
    return permissions.includes(permissionCode);
  }

  async function loadCurrentUserPermissions() {
    try {
      setPermissionsLoaded(false);

      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        const rawPermissions = data.data?.permissions || [];

        const normalizedPermissions = rawPermissions
          .map((permission: any) =>
            typeof permission === "string"
              ? permission
              : permission?.permission_code || permission?.code || ""
          )
          .filter(Boolean);

        setPermissions(normalizedPermissions);
      } else {
        setPermissions([]);
      }
    } catch {
      setPermissions([]);
    } finally {
      setPermissionsLoaded(true);
    }
  }

  async function load() {
    const res = await fetch("/api/beneficiaries", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      setItems(data.data || []);
    } else {
      toast.error(data.message || "تعذر تحميل بيانات المستفيدين");
    }
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

  async function loadOrgUnits() {
    const res = await fetch("/api/lookups/org-units", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      const loadedBranches = data.data.branches || [];
      const loadedSites = data.data.sites || [];
      const loadedCenters = data.data.centers || [];

      setBranches(loadedBranches);
      setSites(loadedSites);
      setCenters(loadedCenters);

      setForm((old) => ({
        ...old,
        branch_id: old.branch_id || loadedBranches[0]?.id || "",
        site_id: old.site_id || loadedSites[0]?.id || "",
        center_id: old.center_id || loadedCenters[0]?.id || "",
      }));
    }
  }

  async function loadNextNumbers() {
    const res = await fetch("/api/beneficiaries/next-numbers", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setForm((old) => ({
        ...old,
        beneficiary_code: data.data.beneficiary_code,
        file_number: data.data.file_number,
        external_reference: data.data.beneficiary_code,
      }));
    }
  }

  async function loadFathers() {
    const res = await fetch("/api/fathers", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      setFathers(
        data.data.map((x: any) => ({
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
        data.data.map((x: any) => ({
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
        data.data.map((x: any) => ({
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
    loadCurrentUserPermissions();
    load();
    loadOrgUnits();
    loadFathers();
    loadMothers();
    loadGuardians();
    loadLookup("beneficiary_statuses", setBeneficiaryStatuses);
    loadLookup("genders", setGenders);
    loadLookup("identity_types", setIdentityTypes);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((x) =>
      `
      ${x.beneficiary_code || ""}
      ${x.file_number || ""}
      ${x.full_name || ""}
      ${x.phone || ""}
      ${x.identity_number || ""}
      `
        .toLowerCase()
        .includes(search.toLowerCase())
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

  async function openCreate() {
    if (!permissionsLoaded) {
      toast.error("جاري تحميل الصلاحيات، حاول مرة أخرى");
      return;
    }

    if (!can("beneficiaries.create")) {
      toast.error("ليس لديك صلاحية إضافة مستفيد");
      return;
    }

    setForm({
      ...emptyForm,
      branch_id: branches[0]?.id || "",
      site_id: sites[0]?.id || "",
      center_id: centers[0]?.id || "",
    });

    setDynamicValues({});
    setActiveTab("basic");
    setOpen(true);

    await loadNextNumbers();
  }

  function edit(item: Beneficiary) {
    if (!permissionsLoaded) {
      toast.error("جاري تحميل الصلاحيات، حاول مرة أخرى");
      return;
    }

    if (!can("beneficiaries.update")) {
      toast.error("ليس لديك صلاحية تعديل المستفيدين");
      return;
    }

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

      gender: item.gender || "",
      birth_date: item.birth_date ? String(item.birth_date).slice(0, 10) : "",
      identity_type: item.identity_type || "",
      identity_number: item.identity_number || "",
      phone: item.phone || "",
      alternative_phone: item.alternative_phone || "",
      address: item.address || "",

      beneficiary_type: item.beneficiary_type || "orphan",
      current_status: item.current_status || "",
      status_id: item.status_id || "",

      branch_id: item.branch_id || branches[0]?.id || "",
      site_id: item.site_id || sites[0]?.id || "",
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

  function getStatusLabel(row: Beneficiary) {
    const byId = lookupLabel(beneficiaryStatuses, row.status_id);
    if (byId) return byId;

    const byLegacy = lookupLabel(beneficiaryStatuses, row.current_status);
    if (byLegacy) return byLegacy;

    return legacyStatusLabel(row.current_status) || "مسودة";
  }

  function getGenderLabel(row: Beneficiary) {
    const byLookup = lookupLabel(genders, row.gender);
    if (byLookup) return byLookup;

    return legacyGenderLabel(row.gender) || "-";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();

    const requiredPermission = form.id
      ? "beneficiaries.update"
      : "beneficiaries.create";

    if (!permissionsLoaded) {
      toast.error("جاري تحميل الصلاحيات، حاول مرة أخرى");
      return;
    }

    if (!can(requiredPermission)) {
      toast.error("ليس لديك صلاحية تنفيذ هذه العملية");
      return;
    }
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

    try {
      const res = await fetch("/api/beneficiaries", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        const beneficiaryId = data.data?.id || form.id;

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

        toast.success("تم حفظ بيانات المستفيد بنجاح");
        setOpen(false);
        setForm(emptyForm);
        setDynamicValues({});
        await load();
      } else {
        toast.error(data.message || "فشل الحفظ");
        console.log(data);
      }
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!permissionsLoaded) {
      toast.error("جاري تحميل الصلاحيات، حاول مرة أخرى");
      return;
    }

    if (!can("beneficiaries.delete")) {
      toast.error("ليس لديك صلاحية حذف المستفيدين");
      return;
    }

    if (!confirm("هل أنت متأكد من حذف المستفيد؟")) return;

    const res = await fetch(`/api/beneficiaries?id=${id}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      toast.success("تم الحذف بنجاح");
      await load();
    } else {
      toast.error(data.message || "فشل الحذف");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستفيدين</h1>
          <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
            تسجيل ومتابعة بيانات المستفيدين
          </p>
        </div>

        {permissionsLoaded && can("beneficiaries.create") && (
          <Button
            onClick={openCreate}
            style={{ backgroundColor: "var(--app-primary)", color: "white" }}
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة مستفيد
          </Button>
        )}
      </div>

      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >
        <div className="relative max-w-lg">
          <Search className="absolute right-3 top-3 w-4 h-4 opacity-60" />
          <Input
            className="pr-10"
            placeholder="بحث بالاسم، رقم المستفيد، رقم الملف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm border-collapse">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--app-border)" }}
              >
                <th className="p-3 text-right whitespace-nowrap">رقم المستفيد</th>
                <th className="p-3 text-right whitespace-nowrap">رقم الملف</th>
                <th className="p-3 text-right whitespace-nowrap">الاسم</th>
                <th className="p-3 text-right whitespace-nowrap">الجنس</th>
                <th className="p-3 text-right whitespace-nowrap">الهاتف</th>
                <th className="p-3 text-right whitespace-nowrap">الحالة</th>
                <th className="p-3 text-left whitespace-nowrap">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center"
                    style={{ color: "var(--app-muted)" }}
                  >
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                filtered.map((item: Beneficiary) => (
                  <tr
                    key={item.id}
                    className="border-b"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    <td className="p-3 whitespace-nowrap">
                      {item.beneficiary_code}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {item.file_number || "-"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {item.full_name || "-"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {getGenderLabel(item)}
                    </td>
                    <td className="p-3 whitespace-nowrap">{item.phone || "-"}</td>
                    <td className="p-3 whitespace-nowrap">
                      <Badge>{getStatusLabel(item)}</Badge>
                    </td>
                    <td className="p-3 text-left space-x-2 space-x-reverse whitespace-nowrap">
                      {permissionsLoaded && can("beneficiaries.update") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => edit(item)}
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}

                      {permissionsLoaded && can("beneficiaries.delete") && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => remove(item.id)}
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}

                      {permissionsLoaded &&
                        !can("beneficiaries.update") &&
                        !can("beneficiaries.delete") && (
                          <span style={{ color: "var(--app-muted)" }}>-</span>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div
            className="w-full max-w-5xl h-[92vh] mx-auto rounded-2xl border flex flex-col overflow-hidden"
            style={{
              backgroundColor: "var(--app-surface)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <h2 className="text-xl font-bold">
                {form.id ? "تعديل مستفيد" : "إضافة مستفيد"}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={save} className="flex flex-col flex-1 min-h-0">
              <div className="flex flex-wrap gap-2 border-b px-6 py-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("basic")}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === "basic" ? "bg-green-600 text-white" : ""
                  }`}
                >
                  البيانات الأساسية
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("family")}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === "family" ? "bg-green-600 text-white" : ""
                  }`}
                >
                  الأسرة
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("social")}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === "social" ? "bg-green-600 text-white" : ""
                  }`}
                >
                  الاجتماعية
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("dynamic")}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === "dynamic" ? "bg-green-600 text-white" : ""
                  }`}
                >
                  البيانات الإضافية
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("familyMembers")}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === "familyMembers"
                      ? "bg-green-600 text-white"
                      : ""
                  }`}
                >
                  بيانات الأشقاء
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("sponsorLinks")}
                  className={`px-4 py-2 rounded-lg ${
                    activeTab === "sponsorLinks"
                      ? "bg-green-600 text-white"
                      : ""
                  }`}
                >
                  الجهات الداعمة
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
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
                  <div className="rounded-xl border p-4">
                    <DynamicBeneficiaryFields
                      values={dynamicValues}
                      setValues={setDynamicValues}
                    />
                  </div>
                )}

                {activeTab === "familyMembers" && (
                  <BeneficiaryFamilyMembersTab beneficiaryId={form.id} />
                )}

                {activeTab === "sponsorLinks" && (
                  <BeneficiarySponsorLinksTab beneficiaryId={form.id} />
                )}
              </div>

              <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="min-w-24"
                >
                  إلغاء
                </Button>

                {((form.id && can("beneficiaries.update")) ||
                  (!form.id && can("beneficiaries.create"))) && (
                  <Button
                    type="submit"
                    disabled={saving || !permissionsLoaded}
                    className="min-w-24"
                    style={{
                      backgroundColor: "var(--app-primary)",
                      color: "white",
                    }}
                  >
                    {saving ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {inlineCreateType && (
        <div className="fixed inset-0 z-[60] bg-black/70 overflow-y-auto p-6">
          <div
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: "var(--app-bg)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
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

            {inlineCreateType === "father" && <FathersClient />}
            {inlineCreateType === "mother" && <MothersClient />}
            {inlineCreateType === "guardian" && <GuardiansClient />}
          </div>
        </div>
      )}
    </div>
  );
}
