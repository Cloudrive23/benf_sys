"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { Check, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LookupItem = {
  id: string;
  code?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
};

type BeneficiaryOption = {
  id: string;
  beneficiary_code?: string | null;
  file_number?: string | null;
  full_name?: string | null;
  identity_number?: string | null;
  phone?: string | null;
  is_active?: boolean | null;
};

type SponsorOption = {
  id: string;
  sponsor_code?: string | null;
  sponsor_name?: string | null;
  sponsor_type?: string | null;
  parent_sponsor_id?: string | null;
  is_active?: boolean | null;
  sponsors?: {
    id: string;
    sponsor_code?: string | null;
    sponsor_name?: string | null;
  } | null;
};

type BeneficiarySponsorLink = {
  id: string;
  beneficiary_id: string;
  sponsor_id: string;
  sponsor_beneficiary_code?: string | null;
  sponsor_file_number?: string | null;
  sponsor_reference?: string | null;
  registration_date?: string | null;
  status?: string | null;
  notes?: string | null;
};

type Sponsorship = {
  id: string;
  sponsorship_code: string;
  beneficiary_id: string;
  sponsor_id: string;
  sponsorship_type: string;
  amount?: any;
  currency?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  notes?: string | null;
  beneficiaries?: BeneficiaryOption | null;
  sponsors?: SponsorOption | null;
  beneficiary_sponsor_link_id?: string | null;
  beneficiary_sponsor_links?: BeneficiarySponsorLink | null;
};

const DEFAULT_CURRENCY = "YER";

const emptyForm = {
  id: "",
  sponsorship_code: "",
  beneficiary_id: "",
  sponsor_id: "",
  sponsorship_type: "",
  amount: "",
  currency: "",
  start_date: "",
  end_date: "",
  status: "active",
  beneficiary_sponsor_link_id: "",
  sponsor_beneficiary_code: "",
  sponsor_file_number: "",
  sponsor_reference: "",
  sponsor_link_registration_date: "",
  sponsor_link_notes: "",
  notes: "",
};

function fieldClass() {
  return "w-full rounded-md border bg-transparent p-2";
}

function panelClass(selected = false) {
  return `w-full rounded-lg border p-3 text-right transition ${selected ? "ring-2 ring-green-600" : "hover:border-green-600"}`;
}

function asDateInput(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function optionLabel(item: LookupItem, fallback?: string | null) {
  return item.name_ar || item.name_en || item.code || fallback || "-";
}

function formatAmount(value: any, currency?: string | null) {
  if (value === null || value === undefined || value === "") return "-";

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return `${String(value)} ${currency || ""}`.trim();
  }

  return `${numberValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ${currency || ""}`.trim();
}

function normalizeCurrencyCode(value?: string | null) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function getBeneficiaryLabel(item: BeneficiaryOption) {
  return [
    item.beneficiary_code ? `رقم: ${item.beneficiary_code}` : "",
    item.file_number ? `ملف: ${item.file_number}` : "",
    item.full_name || "",
    item.identity_number ? `هوية: ${item.identity_number}` : "",
    item.phone ? `هاتف: ${item.phone}` : "",
  ]
    .filter(Boolean)
    .join(" - ");
}

function getSponsorLabel(item: SponsorOption) {
  const parentName = item.sponsors?.sponsor_name;
  return [
    parentName ? `${parentName} /` : "",
    item.sponsor_name,
    item.sponsor_code ? `(${item.sponsor_code})` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function SponsorshipsClient() {
  const [items, setItems] = useState<Sponsorship[]>([]);
  const [beneficiaryOptions, setBeneficiaryOptions] = useState<
    BeneficiaryOption[]
  >([]);
  const [selectedBeneficiary, setSelectedBeneficiary] =
    useState<BeneficiaryOption | null>(null);
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const [beneficiaryTouched, setBeneficiaryTouched] = useState(false);

  const [parentSponsors, setParentSponsors] = useState<SponsorOption[]>([]);
  const [parentSponsorSearch, setParentSponsorSearch] = useState("");
  const [selectedParentSponsorId, setSelectedParentSponsorId] = useState("");
  const [selectedParentSponsor, setSelectedParentSponsor] =
    useState<SponsorOption | null>(null);
  const [childSponsors, setChildSponsors] = useState<SponsorOption[]>([]);
  const [childSponsorSearch, setChildSponsorSearch] = useState("");
  const [selectedChildSponsor, setSelectedChildSponsor] =
    useState<SponsorOption | null>(null);
  const [loadingChildSponsors, setLoadingChildSponsors] = useState(false);

  const [sponsorshipTypes, setSponsorshipTypes] = useState<LookupItem[]>([]);
  const [statuses, setStatuses] = useState<LookupItem[]>([]);
  const [currencies, setCurrencies] = useState<LookupItem[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const [sponsorLink, setSponsorLink] = useState<BeneficiarySponsorLink | null>(null);
  const [loadingSponsorLink, setLoadingSponsorLink] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/sponsorships", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setItems(data.data || []);
      } else {
        toast.error(data.message || "تعذر تحميل الكفالات");
      }
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  }

  async function loadLookup(
    type: string,
    setter: (items: LookupItem[]) => void,
  ) {
    try {
      const res = await fetch(`/api/lookups?type=${type}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setter(data.success ? data.data || [] : []);
    } catch {
      setter([]);
    }
  }

  async function searchBeneficiaries(q: string) {
    const term = q.trim();
    if (term.length < 1) {
      setBeneficiaryOptions([]);
      return;
    }

    setLoadingBeneficiaries(true);
    try {
      const res = await fetch(
        `/api/sponsorships?action=beneficiary-search&q=${encodeURIComponent(term)}`,
        {
          cache: "no-store",
        },
      );
      const data = await res.json();
      setBeneficiaryOptions(data.success ? data.data || [] : []);
    } catch {
      setBeneficiaryOptions([]);
    } finally {
      setLoadingBeneficiaries(false);
    }
  }

  async function loadParentSponsors(q = "") {
    try {
      const res = await fetch(
        `/api/sponsorships?action=parent-sponsors&q=${encodeURIComponent(q)}`,
        {
          cache: "no-store",
        },
      );
      const data = await res.json();
      setParentSponsors(data.success ? data.data || [] : []);
    } catch {
      setParentSponsors([]);
    }
  }

  async function loadChildSponsors(parentId: string, q = "") {
    if (!parentId) {
      setChildSponsors([]);
      return;
    }

    setLoadingChildSponsors(true);
    try {
      const res = await fetch(
        `/api/sponsorships?action=child-sponsors&parentId=${encodeURIComponent(parentId)}&q=${encodeURIComponent(q)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      setChildSponsors(data.success ? data.data || [] : []);
    } catch {
      setChildSponsors([]);
    } finally {
      setLoadingChildSponsors(false);
    }
  }


  async function loadSponsorLink(beneficiaryId: string, sponsorId: string) {
    if (!beneficiaryId || !sponsorId) {
      setSponsorLink(null);
      updateField("beneficiary_sponsor_link_id", "");
      return;
    }

    setLoadingSponsorLink(true);
    try {
      const res = await fetch(
        `/api/sponsorships?action=sponsor-link&beneficiaryId=${encodeURIComponent(beneficiaryId)}&sponsorId=${encodeURIComponent(sponsorId)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      const link = data.success ? data.data || null : null;
      setSponsorLink(link);

      if (link) {
        setForm((old) => ({
          ...old,
          beneficiary_sponsor_link_id: link.id || "",
          sponsor_beneficiary_code: link.sponsor_beneficiary_code || "",
          sponsor_file_number: link.sponsor_file_number || "",
          sponsor_reference: link.sponsor_reference || "",
          sponsor_link_registration_date: asDateInput(link.registration_date),
          sponsor_link_notes: link.notes || "",
        }));
      } else {
        setForm((old) => ({
          ...old,
          beneficiary_sponsor_link_id: "",
          sponsor_beneficiary_code: "",
          sponsor_file_number: "",
          sponsor_reference: "",
          sponsor_link_registration_date: "",
          sponsor_link_notes: "",
        }));
      }
    } catch {
      setSponsorLink(null);
    } finally {
      setLoadingSponsorLink(false);
    }
  }

  useEffect(() => {
    load();
    loadParentSponsors();
    loadLookup("sponsorship_types", setSponsorshipTypes);
    loadLookup("sponsorship_statuses", setStatuses);
    loadLookup("currencies", setCurrencies);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      searchBeneficiaries(beneficiarySearch);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [beneficiarySearch, open]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      loadParentSponsors(parentSponsorSearch);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [parentSponsorSearch, open]);

  useEffect(() => {
    if (!open || !selectedParentSponsorId) return;
    const timer = window.setTimeout(() => {
      loadChildSponsors(selectedParentSponsorId, childSponsorSearch);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [childSponsorSearch, selectedParentSponsorId, open]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      const text = `
        ${item.sponsorship_code || ""}
        ${item.beneficiaries?.beneficiary_code || ""}
        ${item.beneficiaries?.file_number || ""}
        ${item.beneficiaries?.full_name || ""}
        ${item.sponsors?.sponsor_name || ""}
        ${item.sponsors?.sponsors?.sponsor_name || ""}
        ${item.sponsorship_type || ""}
        ${item.status || ""}
        ${item.amount || ""}
        ${item.currency || ""}
        ${item.notes || ""}
      `.toLowerCase();

      return text.includes(term);
    });
  }, [items, search]);

  const activeCount = useMemo(
    () => items.filter((item) => (item.status || "active") === "active").length,
    [items],
  );

  const totalsByCurrency = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const item of items) {
      const amount = Number(item.amount || 0);
      if (!Number.isFinite(amount) || amount === 0) continue;

      const currency = normalizeCurrencyCode(item.currency) || DEFAULT_CURRENCY;
      totals[currency] = (totals[currency] || 0) + amount;
    }

    return Object.entries(totals).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  function getDefaultCurrency() {
    const yer = currencies.find(
      (item) => normalizeCurrencyCode(item.code) === DEFAULT_CURRENCY,
    );
    return (
      normalizeCurrencyCode(yer?.code) ||
      normalizeCurrencyCode(currencies[0]?.code) ||
      DEFAULT_CURRENCY
    );
  }

  function getLookupName(items: LookupItem[], code?: string | null) {
    if (!code) return "-";
    const normalized = normalizeCurrencyCode(code);
    const item = items.find(
      (x) =>
        x.code === code ||
        x.id === code ||
        normalizeCurrencyCode(x.code) === normalized,
    );
    return item ? optionLabel(item, code) : code;
  }

  function resetSearchControls() {
    setBeneficiaryOptions([]);
    setSelectedBeneficiary(null);
    setBeneficiarySearch("");
    setBeneficiaryTouched(false);
    setParentSponsorSearch("");
    setSelectedParentSponsorId("");
    setSelectedParentSponsor(null);
    setChildSponsorSearch("");
    setSelectedChildSponsor(null);
    setChildSponsors([]);
    setNotice(null);
    setSponsorLink(null);
    setLoadingSponsorLink(false);
  }

  function openCreate() {
    resetSearchControls();
    setForm({
      ...emptyForm,
      sponsorship_type: sponsorshipTypes[0]?.code || "",
      status:
        statuses.find((x) => x.code === "active")?.code ||
        statuses[0]?.code ||
        "active",
      currency: getDefaultCurrency(),
    });
    setOpen(true);
  }

  function openEdit(item: Sponsorship) {
    resetSearchControls();

    const beneficiary = item.beneficiaries || null;
    const childSponsor = item.sponsors || null;
    const parent = childSponsor?.sponsors || null;
    const parentId = childSponsor?.parent_sponsor_id || parent?.id || "";

    if (beneficiary) {
      setSelectedBeneficiary(beneficiary);
      setBeneficiaryOptions([beneficiary]);
      setBeneficiarySearch(getBeneficiaryLabel(beneficiary));
    }

    if (parentId) {
      setSelectedParentSponsorId(parentId);
      if (parent) setSelectedParentSponsor(parent as SponsorOption);
      loadChildSponsors(parentId, "");
    }

    if (childSponsor) {
      setSelectedChildSponsor(childSponsor);
      setChildSponsors([childSponsor]);
      setChildSponsorSearch(childSponsor.sponsor_name || "");
    }

    const link = item.beneficiary_sponsor_links || null;
    setSponsorLink(link);

    setForm({
      id: item.id,
      sponsorship_code: item.sponsorship_code || "",
      beneficiary_id: item.beneficiary_id || "",
      sponsor_id: item.sponsor_id || "",
      sponsorship_type: item.sponsorship_type || "",
      amount:
        item.amount === null || item.amount === undefined
          ? ""
          : String(item.amount),
      currency: normalizeCurrencyCode(item.currency) || getDefaultCurrency(),
      start_date: asDateInput(item.start_date),
      end_date: asDateInput(item.end_date),
      status: item.status || "active",
      beneficiary_sponsor_link_id: link?.id || "",
      sponsor_beneficiary_code: link?.sponsor_beneficiary_code || "",
      sponsor_file_number: link?.sponsor_file_number || "",
      sponsor_reference: link?.sponsor_reference || "",
      sponsor_link_registration_date: asDateInput(link?.registration_date),
      sponsor_link_notes: link?.notes || "",
      notes: item.notes || "",
    });
    setOpen(true);
  }

  function updateField(name: string, value: any) {
    setForm((old) => ({ ...old, [name]: value }));
  }

  function chooseBeneficiary(item: BeneficiaryOption) {
    setSelectedBeneficiary(item);
    setBeneficiaryTouched(true);
    setBeneficiarySearch(getBeneficiaryLabel(item));
    setBeneficiaryOptions([item]);
    updateField("beneficiary_id", item.id);
    if (form.sponsor_id) loadSponsorLink(item.id, form.sponsor_id);
  }

  function clearBeneficiary() {
    setSelectedBeneficiary(null);
    setBeneficiarySearch("");
    setBeneficiaryOptions([]);
    updateField("beneficiary_id", "");
    setSponsorLink(null);
    updateField("beneficiary_sponsor_link_id", "");
  }

  function chooseParentSponsor(item: SponsorOption) {
    setSelectedParentSponsorId(item.id);
    setSelectedParentSponsor(item);
    setParentSponsorSearch(item.sponsor_name || "");
    setSelectedChildSponsor(null);
    setChildSponsorSearch("");
    setChildSponsors([]);
    updateField("sponsor_id", "");
    loadChildSponsors(item.id, "");
  }

  function clearParentSponsor() {
    setSelectedParentSponsorId("");
    setSelectedParentSponsor(null);
    setParentSponsorSearch("");
    setSelectedChildSponsor(null);
    setChildSponsorSearch("");
    setChildSponsors([]);
    updateField("sponsor_id", "");
  }

  function chooseChildSponsor(item: SponsorOption) {
    setSelectedChildSponsor(item);
    setChildSponsorSearch(item.sponsor_name || "");
    updateField("sponsor_id", item.id);
    if (form.beneficiary_id) loadSponsorLink(form.beneficiary_id, item.id);
  }

  function clearChildSponsor() {
    setSelectedChildSponsor(null);
    setChildSponsorSearch("");
    updateField("sponsor_id", "");
    setSponsorLink(null);
    updateField("beneficiary_sponsor_link_id", "");
    if (selectedParentSponsorId) loadChildSponsors(selectedParentSponsorId, "");
  }

  function upsertLocalItem(item: Sponsorship) {
    setItems((old) => {
      const exists = old.some((x) => x.id === item.id);
      if (exists) return old.map((x) => (x.id === item.id ? item : x));
      return [item, ...old];
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setNotice(null);

    if (!form.beneficiary_id) {
      setNotice({ type: "error", text: "اختر المستفيد من نتائج البحث أولًا." });
      toast.error("اختر المستفيد");
      return;
    }

    if (!selectedParentSponsorId) {
      setNotice({ type: "error", text: "اختر الجهة الرئيسية أولًا." });
      toast.error("اختر الجهة الرئيسية أولًا");
      return;
    }

    if (!form.sponsor_id) {
      setNotice({
        type: "error",
        text: "اختر الجهة الفرعية التابعة للجهة الرئيسية.",
      });
      toast.error("اختر الجهة الفرعية");
      return;
    }

    if (!form.sponsorship_type) {
      setNotice({ type: "error", text: "اختر نوع الكفالة." });
      toast.error("اختر نوع الكفالة");
      return;
    }

    if (form.amount !== "" && !form.currency) {
      setNotice({ type: "error", text: "اختر عملة الكفالة عند إدخال مبلغ." });
      toast.error("اختر عملة الكفالة عند إدخال مبلغ");
      return;
    }

    setSaving(true);
    setNotice({
      type: "info",
      text: form.id ? "جاري تعديل الكفالة..." : "جاري إضافة الكفالة...",
    });
    const savingToast = toast.loading(
      form.id ? "جاري تعديل الكفالة..." : "جاري إضافة الكفالة...",
    );

    try {
      const method = form.id ? "PUT" : "POST";
      const payload = {
        ...form,
        currency: normalizeCurrencyCode(form.currency) || getDefaultCurrency(),
      };

      const res = await fetch("/api/sponsorships", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "تعذر حفظ الكفالة");
      }

      if (data.data) upsertLocalItem(data.data);
      const successMessage = data.message || "تم حفظ الكفالة بنجاح";
      setNotice({ type: "success", text: successMessage });
      toast.success(successMessage, { id: savingToast });

      window.setTimeout(() => {
        setOpen(false);
        setForm(emptyForm);
        resetSearchControls();
      }, 500);
    } catch (error: any) {
      const message = error?.message || "تعذر حفظ الكفالة";
      setNotice({ type: "error", text: message });
      toast.error(message, { id: savingToast });
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Sponsorship) {
    const ok = confirm(`هل تريد حذف الكفالة ${item.sponsorship_code}؟`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/sponsorships?id=${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "تعذر حذف الكفالة");
      }

      toast.success(data.message || "تم حذف الكفالة بنجاح");
      setItems((old) => old.filter((x) => x.id !== item.id));
    } catch (error: any) {
      toast.error(error?.message || "تعذر حذف الكفالة");
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">الكفالات</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--app-muted)" }}>
            ربط المستفيدين بالجهات الفرعية وأنواع الكفالات وحالاتها، مع دعم تعدد
            العملات.
          </p>
        </div>

        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة كفالة
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: "var(--app-surface)",
            borderColor: "var(--app-border)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--app-muted)" }}>
            إجمالي الكفالات
          </div>
          <div className="mt-2 text-2xl font-bold">{items.length}</div>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: "var(--app-surface)",
            borderColor: "var(--app-border)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--app-muted)" }}>
            الكفالات النشطة
          </div>
          <div className="mt-2 text-2xl font-bold">{activeCount}</div>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{
            backgroundColor: "var(--app-surface)",
            borderColor: "var(--app-border)",
          }}
        >
          <div className="text-sm" style={{ color: "var(--app-muted)" }}>
            إجمالي الالتزامات حسب العملة
          </div>
          <div className="mt-2 space-y-1">
            {totalsByCurrency.length === 0 ? (
              <div className="text-2xl font-bold">0</div>
            ) : (
              totalsByCurrency.map(([currency, total]) => (
                <div
                  key={currency}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>{currency}</span>
                  <span className="font-bold">
                    {formatAmount(total, currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div
        className="rounded-xl border"
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >
        <div
          className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4 border-b"
          style={{ borderColor: "var(--app-border)" }}
        >
          <div className="relative w-full lg:max-w-md">
            <Search
              className="absolute right-3 top-2.5 h-4 w-4"
              style={{ color: "var(--app-muted)" }}
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث برقم الكفالة، المستفيد، الجهة، العملة، الحالة..."
              className="pr-9"
            />
          </div>

          <div className="text-sm" style={{ color: "var(--app-muted)" }}>
            المعروض: {filtered.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--app-border)" }}
              >
                <th className="p-3 text-right">رقم الكفالة</th>
                <th className="p-3 text-right">المستفيد</th>
                <th className="p-3 text-right">الجهة الرئيسية</th>
                <th className="p-3 text-right">الجهة الفرعية</th>
                <th className="p-3 text-right">نوع الكفالة</th>
                <th className="p-3 text-right">مبلغ الالتزام</th>
                <th className="p-3 text-right">الفترة</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-8 text-center"
                    style={{ color: "var(--app-muted)" }}
                  >
                    جاري التحميل...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-8 text-center"
                    style={{ color: "var(--app-muted)" }}
                  >
                    لا توجد كفالات
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    <td className="p-3 font-medium whitespace-nowrap">
                      {item.sponsorship_code}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium">
                        {item.beneficiaries?.full_name || "-"}
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: "var(--app-muted)" }}
                      >
                        {item.beneficiaries?.beneficiary_code || ""}
                        {item.beneficiaries?.file_number
                          ? ` - ملف: ${item.beneficiaries.file_number}`
                          : ""}
                        {item.beneficiary_sponsor_links?.sponsor_beneficiary_code
                          ? ` - رقم الجهة: ${item.beneficiary_sponsor_links.sponsor_beneficiary_code}`
                          : ""}
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {item.sponsors?.sponsors?.sponsor_name || "-"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {item.sponsors?.sponsor_name || "-"}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {getLookupName(sponsorshipTypes, item.sponsorship_type)}
                    </td>
                    <td className="p-3 whitespace-nowrap font-medium">
                      {formatAmount(item.amount, item.currency)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {asDateInput(item.start_date) || "-"}
                      {item.end_date
                        ? ` إلى ${asDateInput(item.end_date)}`
                        : ""}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <Badge
                        variant={
                          (item.status || "active") === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {getLookupName(statuses, item.status || "active")}
                      </Badge>
                    </td>
                    <td className="p-3 text-left whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => remove(item)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
            className="w-full max-w-6xl h-[92vh] mx-auto rounded-2xl border flex flex-col overflow-hidden"
            style={{
              backgroundColor: "var(--app-surface)",
              borderColor: "var(--app-border)",
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b shrink-0"
              style={{ borderColor: "var(--app-border)" }}
            >
              <div>
                <h2 className="text-xl font-bold">
                  {form.id ? "تعديل كفالة" : "إضافة كفالة"}
                </h2>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--app-muted)" }}
                >
                  ابحث ثم اختر بالضغط على النتيجة. لا يوجد اختيار من قائمة
                  فارغة، ولا تحميل لكل المستفيدين.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-2xl"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={save}
              className="flex flex-col flex-1 min-h-0"
              noValidate
            >
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
                {notice && (
                  <div
                    className="rounded-lg border p-3 text-sm"
                    style={{
                      borderColor:
                        notice.type === "error"
                          ? "#ef4444"
                          : notice.type === "success"
                            ? "#22c55e"
                            : "var(--app-border)",
                      color:
                        notice.type === "error"
                          ? "#fecaca"
                          : notice.type === "success"
                            ? "#bbf7d0"
                            : "var(--app-text)",
                    }}
                  >
                    {notice.text}
                  </div>
                )}

                <div
                  className="rounded-xl border p-4 space-y-4"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <h3 className="font-semibold">بيانات الربط</h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2 lg:col-span-2">
                      <label className="space-y-1 block">
                        <span className="text-sm">بحث عن المستفيد *</span>
                        <Input
                          value={beneficiarySearch}
                          onChange={(e) => {
                            const value = e.target.value;
                            setBeneficiarySearch(value);
                            setBeneficiaryTouched(true);
                            if (
                              selectedBeneficiary &&
                              value !== getBeneficiaryLabel(selectedBeneficiary)
                            ) {
                              setSelectedBeneficiary(null);
                              updateField("beneficiary_id", "");
                            }
                          }}
                          placeholder="اكتب الاسم أو رقم المستفيد أو رقم الملف أو رقم الهوية أو الهاتف"
                        />
                      </label>

                      <div
                        className="rounded-lg border p-2 min-h-16"
                        style={{ borderColor: "var(--app-border)" }}
                      >
                        {selectedBeneficiary ? (
                          <div
                            className="flex items-center justify-between gap-3 rounded-md border p-3"
                            style={{ borderColor: "var(--app-border)" }}
                          >
                            <div>
                              <div className="font-medium">
                                {selectedBeneficiary.full_name || "-"}
                              </div>
                              <div
                                className="text-xs mt-1"
                                style={{ color: "var(--app-muted)" }}
                              >
                                {getBeneficiaryLabel(selectedBeneficiary)}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearBeneficiary}
                            >
                              تغيير
                            </Button>
                          </div>
                        ) : loadingBeneficiaries ? (
                          <div
                            className="p-3 text-sm"
                            style={{ color: "var(--app-muted)" }}
                          >
                            جاري البحث...
                          </div>
                        ) : beneficiaryOptions.length > 0 ? (
                          <div className="max-h-56 overflow-y-auto space-y-2">
                            {beneficiaryOptions.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className={panelClass(false)}
                                style={{ borderColor: "var(--app-border)" }}
                                onClick={() => chooseBeneficiary(item)}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="font-medium">
                                      {item.full_name || "-"}
                                    </div>
                                    <div
                                      className="text-xs mt-1"
                                      style={{ color: "var(--app-muted)" }}
                                    >
                                      {getBeneficiaryLabel(item)}
                                    </div>
                                  </div>
                                  <Check className="h-4 w-4" />
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : beneficiaryTouched && beneficiarySearch.trim() ? (
                          <div
                            className="p-3 text-sm"
                            style={{ color: "var(--app-muted)" }}
                          >
                            لا توجد نتائج مطابقة.
                          </div>
                        ) : (
                          <div
                            className="p-3 text-sm"
                            style={{ color: "var(--app-muted)" }}
                          >
                            اكتب للبحث ثم اضغط على المستفيد المطلوب.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="space-y-1 block">
                        <span className="text-sm">بحث الجهة الرئيسية *</span>
                        <Input
                          value={parentSponsorSearch}
                          onChange={(e) => {
                            const value = e.target.value;
                            setParentSponsorSearch(value);
                            if (
                              selectedParentSponsor &&
                              value !== selectedParentSponsor.sponsor_name
                            ) {
                              clearParentSponsor();
                              setParentSponsorSearch(value);
                            }
                          }}
                          placeholder="ابحث باسم الجهة الرئيسية أو رقمها"
                        />
                      </label>

                      <div
                        className="rounded-lg border p-2 min-h-16"
                        style={{ borderColor: "var(--app-border)" }}
                      >
                        {selectedParentSponsor ? (
                          <div
                            className="flex items-center justify-between gap-3 rounded-md border p-3"
                            style={{ borderColor: "var(--app-border)" }}
                          >
                            <div>
                              <div className="font-medium">
                                {selectedParentSponsor.sponsor_name}
                              </div>
                              <div
                                className="text-xs mt-1"
                                style={{ color: "var(--app-muted)" }}
                              >
                                {selectedParentSponsor.sponsor_code || ""}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearParentSponsor}
                            >
                              تغيير
                            </Button>
                          </div>
                        ) : parentSponsors.length > 0 ? (
                          <div className="max-h-56 overflow-y-auto space-y-2">
                            {parentSponsors.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className={panelClass(false)}
                                style={{ borderColor: "var(--app-border)" }}
                                onClick={() => chooseParentSponsor(item)}
                              >
                                <div className="font-medium">
                                  {item.sponsor_name || "-"}
                                </div>
                                <div
                                  className="text-xs mt-1"
                                  style={{ color: "var(--app-muted)" }}
                                >
                                  {item.sponsor_code || ""}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div
                            className="p-3 text-sm"
                            style={{ color: "var(--app-muted)" }}
                          >
                            لا توجد جهات رئيسية.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="space-y-1 block">
                        <span className="text-sm">بحث الجهة الفرعية *</span>
                        <Input
                          value={childSponsorSearch}
                          onChange={(e) => {
                            const value = e.target.value;
                            setChildSponsorSearch(value);
                            if (
                              selectedChildSponsor &&
                              value !== selectedChildSponsor.sponsor_name
                            ) {
                              setSelectedChildSponsor(null);
                              updateField("sponsor_id", "");
                            }
                          }}
                          placeholder="ابحث داخل أبناء الجهة الرئيسية المحددة"
                          disabled={!selectedParentSponsorId}
                        />
                      </label>

                      <div
                        className="rounded-lg border p-2 min-h-16"
                        style={{ borderColor: "var(--app-border)" }}
                      >
                        {!selectedParentSponsorId ? (
                          <div
                            className="p-3 text-sm"
                            style={{ color: "var(--app-muted)" }}
                          >
                            اختر الجهة الرئيسية أولًا.
                          </div>
                        ) : selectedChildSponsor ? (
                          <div
                            className="flex items-center justify-between gap-3 rounded-md border p-3"
                            style={{ borderColor: "var(--app-border)" }}
                          >
                            <div>
                              <div className="font-medium">
                                {selectedChildSponsor.sponsor_name}
                              </div>
                              <div
                                className="text-xs mt-1"
                                style={{ color: "var(--app-muted)" }}
                              >
                                {getSponsorLabel(selectedChildSponsor)}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={clearChildSponsor}
                            >
                              تغيير
                            </Button>
                          </div>
                        ) : loadingChildSponsors ? (
                          <div
                            className="p-3 text-sm"
                            style={{ color: "var(--app-muted)" }}
                          >
                            جاري تحميل الجهات الفرعية...
                          </div>
                        ) : childSponsors.length > 0 ? (
                          <div className="max-h-56 overflow-y-auto space-y-2">
                            {childSponsors.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className={panelClass(false)}
                                style={{ borderColor: "var(--app-border)" }}
                                onClick={() => chooseChildSponsor(item)}
                              >
                                <div className="font-medium">
                                  {item.sponsor_name || "-"}
                                </div>
                                <div
                                  className="text-xs mt-1"
                                  style={{ color: "var(--app-muted)" }}
                                >
                                  {getSponsorLabel(item)}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div
                            className="p-3 text-sm"
                            style={{ color: "var(--app-muted)" }}
                          >
                            لا توجد جهات فرعية لهذه الجهة.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl border p-4 space-y-4"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-semibold">بيانات المستفيد لدى الجهة</h3>
                      <p
                        className="text-xs mt-1"
                        style={{ color: "var(--app-muted)" }}
                      >
                        هذه البيانات تخص علاقة المستفيد بالجهة الفرعية، وتُحفظ مرة واحدة ثم تُستخدم مع أي كفالات لاحقة لنفس المستفيد ونفس الجهة.
                      </p>
                    </div>

                    {loadingSponsorLink ? (
                      <Badge variant="secondary">جاري التحقق...</Badge>
                    ) : sponsorLink ? (
                      <Badge>ارتباط موجود</Badge>
                    ) : form.beneficiary_id && form.sponsor_id ? (
                      <Badge variant="secondary">ارتباط جديد</Badge>
                    ) : (
                      <Badge variant="secondary">اختر المستفيد والجهة</Badge>
                    )}
                  </div>

                  {form.beneficiary_id && form.sponsor_id ? (
                    <>
                      {sponsorLink && (
                        <div
                          className="rounded-lg border p-3 text-sm"
                          style={{
                            borderColor: "var(--app-border)",
                            backgroundColor: "rgba(34, 197, 94, 0.08)",
                          }}
                        >
                          تم العثور على بيانات ارتباط سابقة لهذا المستفيد مع هذه الجهة. يمكنك تعديلها هنا عند الحاجة، وسيتم حفظ التعديل مع الكفالة.
                        </div>
                      )}

                      {!sponsorLink && !loadingSponsorLink && (
                        <div
                          className="rounded-lg border p-3 text-sm"
                          style={{
                            borderColor: "var(--app-border)",
                            color: "var(--app-muted)",
                          }}
                        >
                          لا يوجد ارتباط سابق لهذا المستفيد مع الجهة المحددة. أدخل بياناته لدى الجهة إن وجدت، وسيتم إنشاء الارتباط تلقائيًا عند حفظ الكفالة.
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="space-y-1">
                          <span className="text-sm">رقم المستفيد لدى الجهة</span>
                          <Input
                            value={form.sponsor_beneficiary_code}
                            onChange={(e) =>
                              updateField(
                                "sponsor_beneficiary_code",
                                e.target.value,
                              )
                            }
                            placeholder="مثال: A-1055"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm">رقم الملف لدى الجهة</span>
                          <Input
                            value={form.sponsor_file_number}
                            onChange={(e) =>
                              updateField("sponsor_file_number", e.target.value)
                            }
                            placeholder="مثال: 2026/55"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm">مرجع الجهة</span>
                          <Input
                            value={form.sponsor_reference}
                            onChange={(e) =>
                              updateField("sponsor_reference", e.target.value)
                            }
                            placeholder="كشف / عقد / مرجع داخلي"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm">تاريخ التسجيل لدى الجهة</span>
                          <Input
                            type="date"
                            value={form.sponsor_link_registration_date}
                            onChange={(e) =>
                              updateField(
                                "sponsor_link_registration_date",
                                e.target.value,
                              )
                            }
                          />
                        </label>

                        <label className="space-y-1 md:col-span-2">
                          <span className="text-sm">ملاحظات علاقة المستفيد بالجهة</span>
                          <Input
                            value={form.sponsor_link_notes}
                            onChange={(e) =>
                              updateField("sponsor_link_notes", e.target.value)
                            }
                            placeholder="أي ملاحظات خاصة بتسجيل المستفيد لدى هذه الجهة"
                          />
                        </label>
                      </div>
                    </>
                  ) : (
                    <div
                      className="rounded-lg border p-3 text-sm"
                      style={{
                        borderColor: "var(--app-border)",
                        color: "var(--app-muted)",
                      }}
                    >
                      ستظهر هذه الحقول بعد اختيار المستفيد والجهة الفرعية.
                    </div>
                  )}
                </div>

                <div
                  className="rounded-xl border p-4 space-y-4"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <h3 className="font-semibold">تفاصيل الكفالة</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="space-y-1">
                      <span className="text-sm">رقم الكفالة</span>
                      <Input
                        value={form.sponsorship_code}
                        onChange={(e) =>
                          updateField("sponsorship_code", e.target.value)
                        }
                        placeholder="يُولّد تلقائيًا عند تركه فارغًا"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-sm">نوع الكفالة *</span>
                      <select
                        className={fieldClass()}
                        value={form.sponsorship_type}
                        onChange={(e) =>
                          updateField("sponsorship_type", e.target.value)
                        }
                      >
                        <option value="">اختر نوع الكفالة</option>
                        {sponsorshipTypes.map((item) => (
                          <option key={item.id} value={item.code || item.id}>
                            {optionLabel(item)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-sm">الحالة</span>
                      <select
                        className={fieldClass()}
                        value={form.status}
                        onChange={(e) => updateField("status", e.target.value)}
                      >
                        {statuses.map((item) => (
                          <option key={item.id} value={item.code || item.id}>
                            {optionLabel(item)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-1">
                      <span className="text-sm">مبلغ الكفالة</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => updateField("amount", e.target.value)}
                        placeholder="مثال: 50 أو 20000"
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-sm">عملة الكفالة</span>
                      <select
                        className={fieldClass()}
                        value={form.currency}
                        onChange={(e) =>
                          updateField(
                            "currency",
                            normalizeCurrencyCode(e.target.value),
                          )
                        }
                      >
                        <option value="">اختر العملة</option>
                        {currencies.map((item) => {
                          const code =
                            normalizeCurrencyCode(item.code) || item.id;
                          return (
                            <option key={item.id} value={code}>
                              {code} - {optionLabel(item)}
                            </option>
                          );
                        })}
                      </select>
                    </label>

                    <div
                      className="rounded-lg border p-3 text-xs leading-6"
                      style={{
                        borderColor: "var(--app-border)",
                        color: "var(--app-muted)",
                      }}
                    >
                      لا يتم تحويل المبلغ هنا إلى عملة محلية. التحويل وسعر الصرف
                      سيكونان في دفعات الكفالة.
                    </div>

                    <label className="space-y-1">
                      <span className="text-sm">تاريخ البداية</span>
                      <Input
                        type="date"
                        value={form.start_date}
                        onChange={(e) =>
                          updateField("start_date", e.target.value)
                        }
                      />
                    </label>

                    <label className="space-y-1">
                      <span className="text-sm">تاريخ النهاية</span>
                      <Input
                        type="date"
                        value={form.end_date}
                        onChange={(e) =>
                          updateField("end_date", e.target.value)
                        }
                      />
                    </label>
                  </div>

                  <label className="space-y-1 block">
                    <span className="text-sm">ملاحظات</span>
                    <textarea
                      className="w-full min-h-28 rounded-md border bg-transparent p-2"
                      value={form.notes}
                      onChange={(e) => updateField("notes", e.target.value)}
                    />
                  </label>
                </div>
              </div>

              <div
                className="flex justify-end gap-3 px-6 py-4 border-t shrink-0"
                style={{ borderColor: "var(--app-border)" }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={saving}>
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
