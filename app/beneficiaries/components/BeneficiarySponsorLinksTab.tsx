"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type SponsorLink = {
  id: string;
  sponsor_id: string;
  sponsor_beneficiary_code?: string | null;
  sponsor_file_number?: string | null;
  sponsor_reference?: string | null;
  registration_date?: string | null;
  status?: string | null;
  notes?: string | null;
  sponsor_code?: string | null;
  sponsor_name?: string | null;
  sponsor_type?: string | null;
  parent_sponsor_id?: string | null;
  parent_sponsor_code?: string | null;
  parent_sponsor_name?: string | null;
  sponsorship_count?: number | null;
  last_sponsorship_status?: string | null;
  last_sponsorship_type?: string | null;
  last_sponsorship_amount?: string | null;
  last_sponsorship_currency?: string | null;
  last_sponsorship_start_date?: string | null;
  last_sponsorship_end_date?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return String(value).slice(0, 10);
}

function display(value?: string | number | null) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function statusLabel(value?: string | null) {
  if (!value) return "-";

  const map: Record<string, string> = {
    active: "نشط",
    inactive: "غير نشط",
    draft: "مسودة",
    paused: "موقوف مؤقتًا",
    stopped: "موقوف",
    ended: "منتهية",
    cancelled: "ملغاة",
    closed: "مغلقة",
  };

  return map[value] || value;
}

function sponsorshipTypeLabel(value?: string | null) {
  if (!value) return "-";

  const map: Record<string, string> = {
    living: "معيشية",
    education: "تعليمية",
    health: "صحية",
    food: "غذائية",
    cash: "نقدية",
    housing: "سكنية",
    orphan_sponsorship: "كفالة يتيم",
    family_sponsorship: "كفالة أسرة",
    medical_care: "رعاية علاجية",
    emergency: "دعم طارئ",
    other: "أخرى",
  };

  return map[value] || value;
}

function amountLabel(row: SponsorLink) {
  if (!row.last_sponsorship_amount) return "-";

  const number = Number(row.last_sponsorship_amount);
  const amount = Number.isFinite(number)
    ? number.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : row.last_sponsorship_amount;

  return `${amount} ${row.last_sponsorship_currency || ""}`.trim();
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border px-3 py-2" style={{ borderColor: "var(--app-border)" }}>
      <div className="text-xs mb-1" style={{ color: "var(--app-muted)" }}>
        {label}
      </div>
      <div className="font-semibold break-words">{value || "-"}</div>
    </div>
  );
}

export default function BeneficiarySponsorLinksTab({ beneficiaryId }: { beneficiaryId?: string }) {
  const [items, setItems] = useState<SponsorLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!beneficiaryId) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/beneficiary-sponsor-links?beneficiary_id=${beneficiaryId}`,
        { cache: "no-store" }
      );
      const data = await res.json();

      if (data.success) {
        setItems(data.data || []);
      } else {
        setError(data.message || "تعذر تحميل الجهات الداعمة");
      }
    } catch {
      setError("تعذر الاتصال بالخادم أثناء تحميل الجهات الداعمة");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setItems([]);
    setError("");
    load();
  }, [beneficiaryId]);

  const totalSponsorships = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.sponsorship_count || 0), 0),
    [items]
  );

  const activeLinks = useMemo(
    () => items.filter((x) => (x.status || "active") === "active").length,
    [items]
  );

  if (!beneficiaryId) {
    return (
      <div
        className="rounded-xl border p-5 text-sm"
        style={{ borderColor: "var(--app-border)", color: "var(--app-muted)" }}
      >
        يجب حفظ بيانات المستفيد أولًا قبل عرض الجهات الداعمة المرتبطة به.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">الجهات الداعمة المرتبطة بالمستفيد</h3>
          <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
            تعرض هذه القائمة بيانات المستفيد لدى كل جهة، وعدد الكفالات المرتبطة بكل علاقة.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={load} disabled={loading}>
          <RefreshCcw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--app-border)" }}>
          <div className="text-xs" style={{ color: "var(--app-muted)" }}>عدد الجهات</div>
          <div className="text-2xl font-bold mt-1">{items.length}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--app-border)" }}>
          <div className="text-xs" style={{ color: "var(--app-muted)" }}>إجمالي الكفالات</div>
          <div className="text-2xl font-bold mt-1">{totalSponsorships}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--app-border)" }}>
          <div className="text-xs" style={{ color: "var(--app-muted)" }}>العلاقات النشطة</div>
          <div className="text-2xl font-bold mt-1">{activeLinks}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: "var(--app-border)", color: "var(--app-muted)" }}>
          جاري التحميل...
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border p-8 text-center" style={{ borderColor: "var(--app-border)", color: "var(--app-muted)" }}>
          لا توجد جهات داعمة مرتبطة بهذا المستفيد حتى الآن. يتم إنشاء العلاقة عند إضافة كفالة من شاشة الكفالات.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const hasLastSponsorship = Number(item.sponsorship_count || 0) > 0;
            const parentName = item.parent_sponsor_name || item.sponsor_name || "-";
            const childName = item.sponsor_name || "-";

            return (
              <div
                key={item.id}
                className="rounded-xl border p-4 space-y-4"
                style={{ borderColor: "var(--app-border)" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-sm" style={{ color: "var(--app-muted)" }}>
                      الجهة الرئيسية
                    </div>
                    <div className="text-lg font-bold">{parentName}</div>
                    {item.parent_sponsor_code && (
                      <div className="text-xs" style={{ color: "var(--app-muted)" }}>
                        {item.parent_sponsor_code}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-right">
                    <div className="text-sm" style={{ color: "var(--app-muted)" }}>
                      الجهة الفرعية
                    </div>
                    <div className="font-bold">{childName}</div>
                    {item.sponsor_code && (
                      <div className="text-xs" style={{ color: "var(--app-muted)" }}>
                        {item.sponsor_code}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={(item.status || "active") === "active" ? "default" : "secondary"}>
                      علاقة: {statusLabel(item.status || "active")}
                    </Badge>
                    <Badge variant="secondary">
                      عدد الكفالات: {Number(item.sponsorship_count || 0)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <InfoItem label="رقم المستفيد لدى الجهة" value={display(item.sponsor_beneficiary_code)} />
                  <InfoItem label="رقم الملف لدى الجهة" value={display(item.sponsor_file_number)} />
                  <InfoItem label="مرجع الجهة" value={display(item.sponsor_reference)} />
                  <InfoItem label="تاريخ التسجيل لدى الجهة" value={formatDate(item.registration_date)} />
                  <InfoItem label="ملاحظات العلاقة" value={display(item.notes)} />
                  <InfoItem label="آخر حالة كفالة" value={statusLabel(item.last_sponsorship_status)} />
                </div>

                <div
                  className="rounded-lg border p-3"
                  style={{ borderColor: "var(--app-border)", backgroundColor: "rgba(255,255,255,0.02)" }}
                >
                  <div className="text-xs mb-2" style={{ color: "var(--app-muted)" }}>
                    آخر كفالة مسجلة لهذه العلاقة
                  </div>

                  {hasLastSponsorship ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span style={{ color: "var(--app-muted)" }}>النوع: </span>
                        <span className="font-semibold">{sponsorshipTypeLabel(item.last_sponsorship_type)}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--app-muted)" }}>الحالة: </span>
                        <span className="font-semibold">{statusLabel(item.last_sponsorship_status)}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--app-muted)" }}>المبلغ: </span>
                        <span className="font-semibold" dir="ltr">{amountLabel(item)}</span>
                      </div>
                      <div>
                        <span style={{ color: "var(--app-muted)" }}>الفترة: </span>
                        <span className="font-semibold">
                          {formatDate(item.last_sponsorship_start_date)}
                          {item.last_sponsorship_end_date ? ` إلى ${formatDate(item.last_sponsorship_end_date)}` : ""}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm" style={{ color: "var(--app-muted)" }}>
                      لا توجد كفالات مسجلة على هذه العلاقة حتى الآن.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
