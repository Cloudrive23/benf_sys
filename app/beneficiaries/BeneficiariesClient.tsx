"use client";

import BeneficiaryBasicTab from "./components/BeneficiaryBasicTab";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import BeneficiaryFamilyTab from "./components/BeneficiaryFamilyTab";
import EntityPicker, {
  type EntityPickerItem,
} from "@/app/components/entity-picker/EntityPicker";


type OrgUnit = { id: string; branch_name_ar?: string; site_name_ar?: string; center_name_ar?: string; branch_id?: string; site_id?: string };

type Beneficiary = {
  id: string;
  beneficiary_code: string;
  file_number?: string | null;
  full_name?: string | null;
  gender?: string | null;
  phone?: string | null;
  current_status?: string | null;
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
  address: "",
  beneficiary_type: "orphan",
  current_status: "draft",
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
};

export default function BeneficiariesClient() {
  const [items, setItems] = useState<Beneficiary[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [branches, setBranches] = useState<OrgUnit[]>([]);
  const [sites, setSites] = useState<OrgUnit[]>([]);
  const [centers, setCenters] = useState<OrgUnit[]>([]);
  const [fathers, setFathers] = useState<EntityPickerItem[]>([]);
  const [mothers, setMothers] = useState<EntityPickerItem[]>([]);
  const [guardians, setGuardians] = useState<EntityPickerItem[]>([]);

  async function load() {
			const res = await fetch("/api/beneficiaries", { cache: "no-store" });
			const data = await res.json();

			if (data.success) setItems(data.data || []);
			else toast.error(data.message || "تعذر تحميل البيانات");
		  }

  async function loadLookups() {
			const res = await fetch("/api/lookups/org-units", { cache: "no-store" });
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
			const res = await fetch("/api/beneficiaries/next-numbers", { cache: "no-store" });
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
		  const res = await fetch("/api/fathers");
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
		  const res = await fetch("/api/mothers");
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
			  const res = await fetch("/api/guardians");
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
  
  
  useEffect(() => {
				  load();
				  loadLookups();

				  loadFathers();
				  loadMothers();
				  loadGuardians();
				}, []);

  const filtered = useMemo(() => {
    return items.filter((x) =>
      `${x.beneficiary_code} ${x.file_number || ""} ${x.full_name || ""} ${x.phone || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [items, search]);

  function getRelated(item: any, type: string) {
    return item.beneficiary_related_persons?.find(
      (x: any) => x.relation_type === type
    )?.related_persons;
  }

  function edit(item: any) {
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
      birth_date: item.birth_date ? item.birth_date.slice(0, 10) : "",
      identity_number: item.identity_number || "",
      phone: item.phone || "",
      address: item.address || "",
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
      current_status: item.current_status || "draft",
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/beneficiaries", {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (data.success) {
      toast.success("تم حفظ بيانات المستفيد بنجاح");
      setOpen(false);
      setForm(emptyForm);
      await load();
    } else {
      toast.error(data.message || "فشل الحفظ");
      console.log(data);
    }

    setSaving(false);
  }

  async function remove(id: string) {
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

        <Button
          onClick={async () => {
            setForm({
              ...emptyForm,
              branch_id: branches[0]?.id || "",
              site_id: sites[0]?.id || "",
            });
            setOpen(true);
            await loadNextNumbers();
          }}
          style={{ backgroundColor: "var(--app-primary)", color: "white" }}
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
            placeholder="بحث بالاسم، رقم المستفيد، رقم الملف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--app-border)" }}>
                <th className="p-3 text-right">رقم المستفيد</th>
                <th className="p-3 text-right">رقم الملف</th>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">الجنس</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-left">الإجراءات</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center" style={{ color: "var(--app-muted)" }}>
                    لا توجد بيانات
                  </td>
                </tr>
              ) : (
                filtered.map((item: any) => (
                  <tr key={item.id} className="border-b" style={{ borderColor: "var(--app-border)" }}>
                    <td className="p-3">{item.beneficiary_code}</td>
                    <td className="p-3">{item.file_number || "-"}</td>
                    <td className="p-3">{item.full_name || "-"}</td>
                    <td className="p-3">{item.gender === "female" ? "أنثى" : "ذكر"}</td>
                    <td className="p-3">{item.phone || "-"}</td>
                    <td className="p-3">
                      <Badge>{item.current_status || "draft"}</Badge>
                    </td>
                    <td className="p-3 text-left space-x-2 space-x-reverse">
                      <Button size="sm" variant="outline" onClick={() => edit(item)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div
            className="w-full max-w-4xl rounded-2xl border p-6 space-y-5"
            style={{
              backgroundColor: "var(--app-surface)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {form.id ? "تعديل مستفيد" : "إضافة مستفيد"}
              </h2>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>

            <form onSubmit={save} className="space-y-4">
			<div className="flex gap-2 border-b pb-3">
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
			</div>
			
            {activeTab === "basic" && (
				  <BeneficiaryBasicTab
					form={form}
					setForm={setForm}
				  />
				)}

			{activeTab === "family" && (
				  <BeneficiaryFamilyTab
					form={form}
					setForm={setForm}
					fathers={fathers}
					mothers={mothers}
					guardians={guardians}
				  />
				)}

              
              <div className="flex justify-end gap-3 pt-4">
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
    </div>
  );
}
