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

type AuthPermission = {
  permission_code?: string;
  allowed?: boolean;
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

function amountLabel(row: SponsorLink) {
  if (!row.last_sponsorship_amount) return "-";

  const number = Number(row.last_sponsorship_amount);
  const amount = Number.isFinite(number)
    ? number.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : row.last_sponsorship_amount;

  return `${amount} ${row.last_sponsorship_currency || ""}`.trim();
}

function normalizePermissions(rawPermissions: Array<string | AuthPermission>) {
  return rawPermissions
    .filter((permission) => {
      if (typeof permission === "string") return true;
      return permission.allowed === true;
    })
    .map((permission) =>
      typeof permission === "string" ? permission : permission.permission_code || ""
    )
    .filter(Boolean);
}

export default function BeneficiarySponsorLinksTab({
  beneficiaryId,
}: {
  beneficiaryId?: string;
}) {
  const [items, setItems] = useState<SponsorLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  function can(permissionCode: string) {
    return permissions.includes(permissionCode);
  }

  const canViewSponsorLinks =
    can("beneficiaries.view") ||
    can("beneficiaries.sponsor_links.view") ||
    can("beneficiaries.sponsor_links.manage");

  const canManageSponsorLinks = can("beneficiaries.sponsor_links.manage");

  async function loadCurrentUserPermissions() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setPermissions(normalizePermissions(data.data?.permissions || []));
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
    if (!beneficiaryId || !canViewSponsorLinks) return;

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
        setItems([]);
        setError(data.message || "تعذر تحميل الجهات الداعمة");
      }
    } catch {
      setItems([]);
      setError("تعذر الاتصال بالخادم أثناء تحميل الجهات الداعمة");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCurrentUserPermissions();
  }, []);

  useEffect(() => {
    setItems([]);
    setError("");

    if (!permissionsLoaded || !beneficiaryId || !canViewSponsorLinks) return;

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beneficiaryId, permissionsLoaded, permissions.join("|")]);

  const totalSponsorships = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.sponsorship_count || 0),
        0
      ),
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
        style={{
          borderColor: "var(--app-border)",
          color: "var(--app-muted)",
        }}
      >
        يجب حفظ بيانات المستفيد أولًا قبل عرض الجهات الداعمة المرتبطة به.
      </div>
    );
  }

  if (!permissionsLoaded) {
    return (
      <div
        className="rounded-xl border p-5 text-sm"
        style={{
          borderColor: "var(--app-border)",
          color: "var(--app-muted)",
        }}
      >
        جاري التحقق من صلاحيات الجهات الداعمة...
      </div>
    );
  }

  if (!canViewSponsorLinks) {
    return (
      <div
        className="rounded-xl border p-5 text-sm"
        style={{
          borderColor: "var(--app-border)",
          color: "var(--app-muted)",
        }}
      >
        ليس لديك صلاحية عرض الجهات الداعمة المرتبطة بهذا المستفيد.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">
            الجهات الداعمة المرتبطة بالمستفيد
          </h3>
          <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
            تعرض هذه القائمة رقم المستفيد وملفه لدى كل جهة، مع عدد الكفالات
            المرتبطة بتلك العلاقة.
          </p>
        </div>

        <Button type="button" variant="outline" onClick={load} disabled={loading}>
          <RefreshCcw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </div>

      {!canManageSponsorLinks && (
        <div
          className="rounded-xl border p-4 text-sm"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-bg)",
            color: "var(--app-muted)",
          }}
        >
          لديك صلاحية عرض فقط لهذا التبويب. إدارة علاقة المستفيد بالجهات
          الداعمة تحتاج صلاحية: beneficiaries.sponsor_links.manage.
        </div>
      )}

      {canManageSponsorLinks && (
        <div
          className="rounded-xl border p-4 text-sm"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-bg)",
            color: "var(--app-muted)",
          }}
        >
          لديك صلاحية إدارة الجهات الداعمة للمستفيد. حاليًا يتم إنشاء أو تحديث
          علاقة المستفيد بالجهة من خلال شاشة الكفالات عند إنشاء الكفالة أو
          تعديل بياناتها.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--app-border)" }}
        >
          <div className="text-xs" style={{ color: "var(--app-muted)" }}>
            عدد الجهات
          </div>
          <div className="text-2xl font-bold mt-1">{items.length}</div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--app-border)" }}
        >
          <div className="text-xs" style={{ color: "var(--app-muted)" }}>
            إجمالي الكفالات
          </div>
          <div className="text-2xl font-bold mt-1">{totalSponsorships}</div>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "var(--app-border)" }}
        >
          <div className="text-xs" style={{ color: "var(--app-muted)" }}>
            العلاقات النشطة
          </div>
          <div className="text-2xl font-bold mt-1">{activeLinks}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div
        className="rounded-xl border overflow-hidden"
        style={{ borderColor: "var(--app-border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: "var(--app-border)" }}
              >
                <th className="p-3 text-right">الجهة الرئيسية</th>
                <th className="p-3 text-right">الجهة الفرعية</th>
                <th className="p-3 text-right">رقم المستفيد لدى الجهة</th>
                <th className="p-3 text-right">رقم الملف لدى الجهة</th>
                <th className="p-3 text-right">مرجع الجهة</th>
                <th className="p-3 text-right">تاريخ التسجيل</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">عدد الكفالات</th>
                <th className="p-3 text-right">آخر كفالة</th>
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
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-8 text-center"
                    style={{ color: "var(--app-muted)" }}
                  >
                    لا توجد جهات داعمة مرتبطة بهذا المستفيد حتى الآن. يتم إنشاء
                    العلاقة عند إضافة كفالة من شاشة الكفالات.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b align-top"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    <td className="p-3 whitespace-nowrap">
                      {display(item.parent_sponsor_name || item.sponsor_name)}
                      {item.parent_sponsor_code && (
                        <div
                          className="text-xs mt-1"
                          style={{ color: "var(--app-muted)" }}
                        >
                          {item.parent_sponsor_code}
                        </div>
                      )}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {display(item.sponsor_name)}
                      {item.sponsor_code && (
                        <div
                          className="text-xs mt-1"
                          style={{ color: "var(--app-muted)" }}
                        >
                          {item.sponsor_code}
                        </div>
                      )}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {display(item.sponsor_beneficiary_code)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {display(item.sponsor_file_number)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {display(item.sponsor_reference)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {formatDate(item.registration_date)}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <Badge
                        variant={
                          (item.status || "active") === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {statusLabel(item.status || "active")}
                      </Badge>
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      {Number(item.sponsorship_count || 0)}
                    </td>

                    <td className="p-3 whitespace-nowrap">
                      <div>{statusLabel(item.last_sponsorship_status)}</div>
                      <div
                        className="text-xs mt-1"
                        style={{ color: "var(--app-muted)" }}
                      >
                        {amountLabel(item)} /{" "}
                        {formatDate(item.last_sponsorship_start_date)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
