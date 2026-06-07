"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

import { saveEntityWithPolicies } from "@/app/lib/client/save-entity-with-policies";
import DynamicEntityTable from "@/app/components/dynamic/DynamicEntityTable";

import BeneficiaryBasicTab from "./components/BeneficiaryBasicTab";
import BeneficiaryFamilyTab from "./components/BeneficiaryFamilyTab";
import BeneficiarySocialTab from "./components/BeneficiarySocialTab";
import DynamicBeneficiaryFields from "./components/dynamic/DynamicBeneficiaryFields";
import BeneficiaryFamilyMembersTab from "./components/BeneficiaryFamilyMembersTab";

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

const emptyForm = {
  id: "",
  beneficiary_code: "",
  file_number: "",
  external_reference: "",

  first_name: "",
  father_name: "",
  grandfather_name: "",
  family_name: "",

  gender: "male",
  birth_date: "",
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

  const [beneficiaryStatuses, setBeneficiaryStatuses] = useState<any[]>([]);
  const [dynamicValues, setDynamicValues] = useState<any>({});

  async function load() {
    const res = await fetch("/api/beneficiaries", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setItems(data.data || []);
    } else {
      toast.error(data.message || "تعذر تحميل بيانات المستفيدين");
    }
  }

  async function loadBeneficiaryStatuses() {
    const res = await fetch("/api/lookups?type=beneficiary_statuses", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setBeneficiaryStatuses(data.data || []);
    }
  }

  async function loadLookups() {
    const res = await fetch("/api/lookups/org-units", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setBranches(data.data.branches || []);
      setSites(data.data.sites || []);
      setCenters(data.data.centers || []);

      setForm((old) => ({
        ...old,
        branch_id: old.branch_id || data.data.branches?.[0]?.id || "",
        site_id: old.site_id || data.data.sites?.[0]?.id || "",
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
    const res = await fetch("/api/fathers", {
      cache: "no-store",
    });

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
    const res = await fetch("/api/mothers", {
      cache: "no-store",
    });

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
    const res = await fetch("/api/guardians", {
      cache: "no-store",
    });

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
    load();
    loadLookups();
    loadFathers();
    loadMothers();
    loadGuardians();
    loadBeneficiaryStatuses();
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
    setForm({
      ...emptyForm,
      branch_id: branches[0]?.id || "",
      site_id: sites[0]?.id || "",
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
      identity_number: item.identity_number || "",
      phone: item.phone || "",
      alternative_phone: item.alternative_phone || "",
      address: item.address || "",

      beneficiary_type: item.beneficiary_type || "orphan",
      current_status: item.current_status || "draft",
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

  async function save(e: React.FormEvent) {
    e.preventDefault();

    if (!form.branch_id) {
      toast.error("يجب اختيار الفرع");
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
      data: form,
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

  function getStatusLabel(row: any) {
    if (row.status?.name_ar) return row.status.name_ar;

    if (row.status_id) {
      const found = beneficiaryStatuses.find((x) => x.id === row.status_id);
      if (found) return found.name_ar;
    }

    if (row.current_status === "draft") return "مسودة";
    if (row.current_status === "active") return "نشط";
    if (row.current_status === "stopped") return "موقوف";
    if (row.current_status === "closed") return "مغلق";

    return row.current_status || "مسودة";
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

        <Button
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
              if (row.gender === "female") return "أنثى";
              if (row.gender === "male") return "ذكر";
              return row.gender || "-";
            }

            if (field.field_name === "current_status") {
              return <Badge>{getStatusLabel(row)}</Badge>;
            }

            if (field.field_name === "status_id") {
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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div
            className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border p-6 space-y-5"
            style={{
              backgroundColor: "var(--app-surface)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="flex items-center justify-between">
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

            <form onSubmit={save} className="space-y-4">
              <div className="flex flex-wrap gap-2 border-b pb-3">
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
              </div>

              <div className="min-h-[300px]">
                {activeTab === "basic" && (
                  <BeneficiaryBasicTab form={form} setForm={setForm} />
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

              <div className="flex justify-end gap-3 pt-4 border-t">
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