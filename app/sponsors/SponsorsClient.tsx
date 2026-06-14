"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronLeft,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LookupItem = {
  id: string;
  code?: string | null;
  name_ar?: string | null;
  name_en?: string | null;
};

type Sponsor = {
  id: string;
  sponsor_code: string;
  sponsor_name: string;
  sponsor_type: string;
  parent_sponsor_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  contact_person?: string | null;
  notes?: string | null;
  is_active?: boolean | null;
  sponsors?: {
    id: string;
    sponsor_code: string;
    sponsor_name: string;
  } | null;
  _count?: {
    other_sponsors?: number;
    sponsorships?: number;
  };
};

const emptyForm = {
  id: "",
  sponsor_code: "",
  sponsor_name: "",
  sponsor_type: "",
  parent_sponsor_id: "",
  phone: "",
  email: "",
  address: "",
  contact_person: "",
  notes: "",
  is_active: true,
};

function fieldClass() {
  return "w-full rounded-md border bg-transparent p-2";
}

function sponsorMatchesSearch(item: Sponsor, term: string) {
  return `
    ${item.sponsor_code || ""}
    ${item.sponsor_name || ""}
    ${item.sponsor_type || ""}
    ${item.phone || ""}
    ${item.email || ""}
    ${item.contact_person || ""}
    ${item.sponsors?.sponsor_name || ""}
  `
    .toLowerCase()
    .includes(term);
}

export default function SponsorsClient() {
  const [items, setItems] = useState<Sponsor[]>([]);
  const [sponsorTypes, setSponsorTypes] = useState<LookupItem[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  function can(permissionCode: string) {
    return permissions.includes(permissionCode);
  }

  async function loadCurrentUserPermissions() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      const rawPermissions = data?.data?.permissions || [];

      if (data.success && Array.isArray(rawPermissions)) {
        const allowedPermissions = rawPermissions
          .filter((item: any) => {
            if (typeof item === "string") return true;
            return item?.allowed === true;
          })
          .map((item: any) =>
            typeof item === "string" ? item : item.permission_code
          )
          .filter(Boolean);

        setPermissions(allowedPermissions);
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
    setLoading(true);
    setLoadError("");

    try {
      const res = await fetch("/api/sponsors", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setItems(data.data || []);
        return;
      }

      const message =
        data.message ||
        (res.status === 403
          ? "ليس لديك صلاحية عرض الجهات الكافلة / المانحة"
          : "تعذر تحميل الجهات الكافلة");

      setItems([]);

      if (res.status === 401 || res.status === 403) {
        setLoadError(message);
      } else {
        toast.error(message);
      }
    } catch {
      const message = "تعذر الاتصال بالخادم";
      setItems([]);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSponsorTypes() {
    try {
      const res = await fetch("/api/lookups?type=sponsor_types", {
        cache: "no-store",
      });
      const data = await res.json();

      if (data.success) {
        setSponsorTypes(data.data || []);
      }
    } catch {
      setSponsorTypes([]);
    }
  }

  useEffect(() => {
    loadCurrentUserPermissions();
    load();
    loadSponsorTypes();
  }, []);

  const parentSponsors = useMemo(() => {
    return items
      .filter((item) => !item.parent_sponsor_id)
      .sort((a, b) => (a.sponsor_name || "").localeCompare(b.sponsor_name || "", "ar"));
  }, [items]);

  const childrenByParent = useMemo(() => {
    const map: Record<string, Sponsor[]> = {};

    for (const item of items) {
      if (!item.parent_sponsor_id) continue;
      if (!map[item.parent_sponsor_id]) map[item.parent_sponsor_id] = [];
      map[item.parent_sponsor_id].push(item);
    }

    for (const parentId of Object.keys(map)) {
      map[parentId].sort((a, b) =>
        (a.sponsor_name || "").localeCompare(b.sponsor_name || "", "ar")
      );
    }

    return map;
  }, [items]);

  const visibleParents = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return parentSponsors;

    return parentSponsors.filter((parent) => {
      const children = childrenByParent[parent.id] || [];
      return (
        sponsorMatchesSearch(parent, term) ||
        children.some((child) => sponsorMatchesSearch(child, term))
      );
    });
  }, [parentSponsors, childrenByParent, search]);

  const orphanChildren = useMemo(() => {
    const term = search.trim().toLowerCase();
    const parentIds = new Set(parentSponsors.map((item) => item.id));

    return items.filter((item) => {
      if (!item.parent_sponsor_id) return false;
      if (parentIds.has(item.parent_sponsor_id)) return false;
      if (!term) return true;
      return sponsorMatchesSearch(item, term);
    });
  }, [items, parentSponsors, search]);

  const activeParentsCount = useMemo(
    () => parentSponsors.filter((item) => item.is_active !== false).length,
    [parentSponsors]
  );

  const childSponsorsCount = useMemo(
    () => items.filter((item) => !!item.parent_sponsor_id).length,
    [items]
  );

  const parentOptions = useMemo(() => {
    return parentSponsors.filter((item) => item.id !== form.id && item.is_active !== false);
  }, [parentSponsors, form.id]);

  function getSponsorTypeName(code?: string | null) {
    if (!code) return "-";
    return sponsorTypes.find((item) => item.code === code || item.id === code)?.name_ar || code;
  }

  function toggleParent(parentId: string) {
    setExpandedParents((current) => ({
      ...current,
      [parentId]: !current[parentId],
    }));
  }

  function expandAll() {
    const next: Record<string, boolean> = {};
    for (const parent of parentSponsors) next[parent.id] = true;
    setExpandedParents(next);
  }

  function collapseAll() {
    setExpandedParents({});
  }

  function openCreate() {
    if (!can("sponsors.create")) {
      toast.error("ليس لديك صلاحية إضافة جهة داعمة");
      return;
    }

    setForm({
      ...emptyForm,
      sponsor_type: sponsorTypes[0]?.code || "individual",
    });
    setOpen(true);
  }

  function openCreateChild(parent: Sponsor) {
    if (!can("sponsors.create")) {
      toast.error("ليس لديك صلاحية إضافة جهة فرعية");
      return;
    }

    setForm({
      ...emptyForm,
      sponsor_name: "",
      sponsor_type: parent.sponsor_type || sponsorTypes[0]?.code || "individual",
      parent_sponsor_id: parent.id,
      phone: parent.phone || "",
      email: parent.email || "",
      address: parent.address || "",
      contact_person: parent.contact_person || "",
      is_active: parent.is_active !== false,
    });
    setExpandedParents((current) => ({ ...current, [parent.id]: true }));
    setOpen(true);
  }

  function openEdit(item: Sponsor) {
    if (!can("sponsors.update")) {
      toast.error("ليس لديك صلاحية تعديل الجهات الداعمة");
      return;
    }

    setForm({
      id: item.id,
      sponsor_code: item.sponsor_code || "",
      sponsor_name: item.sponsor_name || "",
      sponsor_type: item.sponsor_type || "",
      parent_sponsor_id: item.parent_sponsor_id || "",
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
      contact_person: item.contact_person || "",
      notes: item.notes || "",
      is_active: item.is_active ?? true,
    });
    setOpen(true);
  }

  async function save(e: FormEvent) {
    e.preventDefault();

    const requiredPermission = form.id ? "sponsors.update" : "sponsors.create";

    if (!can(requiredPermission)) {
      toast.error("ليس لديك صلاحية تنفيذ هذه العملية");
      return;
    }

    if (!form.sponsor_name.trim()) {
      toast.error("اسم الجهة مطلوب");
      return;
    }

    if (!form.sponsor_type) {
      toast.error("نوع الجهة مطلوب");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/sponsors", {
        method: form.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "تم الحفظ بنجاح");
        const parentId = form.parent_sponsor_id;
        setOpen(false);
        setForm(emptyForm);
        await load();

        if (parentId) {
          setExpandedParents((current) => ({ ...current, [parentId]: true }));
        }
      } else {
        toast.error(data.message || "تعذر الحفظ");
      }
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: Sponsor) {
    if (!can("sponsors.delete")) {
      toast.error("ليس لديك صلاحية حذف الجهات الداعمة");
      return;
    }

    if (!confirm(`هل تريد حذف الجهة: ${item.sponsor_name}؟`)) return;

    try {
      const res = await fetch(`/api/sponsors?id=${item.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.message || "تم الحذف بنجاح");
        await load();
      } else {
        toast.error(data.message || "تعذر الحذف");
      }
    } catch {
      toast.error("تعذر الاتصال بالخادم");
    }
  }

  function renderStatusBadge(item: Sponsor) {
    return (
      <Badge variant={item.is_active === false ? "outline" : "default"}>
        {item.is_active === false ? "غير نشط" : "نشط"}
      </Badge>
    );
  }

  function renderChildRow(child: Sponsor) {
    return (
      <tr key={child.id} className="border-b" style={{ borderColor: "var(--app-border)" }}>
        <td className="p-3 whitespace-nowrap pr-12 text-sm">{child.sponsor_code}</td>
        <td className="p-3 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="text-lg opacity-50">└</span>
            <span className="font-medium">{child.sponsor_name}</span>
          </div>
        </td>
        <td className="p-3 whitespace-nowrap">{getSponsorTypeName(child.sponsor_type)}</td>
        <td className="p-3 whitespace-nowrap">
          <Badge variant="outline">جهة فرعية</Badge>
        </td>
        <td className="p-3 whitespace-nowrap">{child.phone || "-"}</td>
        <td className="p-3 whitespace-nowrap">{child.contact_person || "-"}</td>
        <td className="p-3 whitespace-nowrap">كفالات: {child._count?.sponsorships || 0}</td>
        <td className="p-3 whitespace-nowrap">{renderStatusBadge(child)}</td>
        <td className="p-3 text-left whitespace-nowrap space-x-2 space-x-reverse">
          {permissionsLoaded && can("sponsors.update") && (
            <Button size="sm" variant="outline" onClick={() => openEdit(child)} title="تعديل">
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          {permissionsLoaded && can("sponsors.delete") && (
            <Button size="sm" variant="destructive" onClick={() => remove(child)} title="حذف">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </td>
      </tr>
    );
  }

  function renderParentRow(parent: Sponsor) {
    const children = childrenByParent[parent.id] || [];
    const term = search.trim().toLowerCase();
    const expanded = term ? true : !!expandedParents[parent.id];
    const visibleChildren = term
      ? children.filter((child) => sponsorMatchesSearch(child, term) || sponsorMatchesSearch(parent, term))
      : children;

    return (
      <tbody key={parent.id}>
        <tr className="border-b" style={{ borderColor: "var(--app-border)" }}>
          <td className="p-3 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleParent(parent.id)}
                className="w-8 h-8 rounded-md border flex items-center justify-center"
                style={{ borderColor: "var(--app-border)" }}
                title={expanded ? "إخفاء الجهات الفرعية" : "عرض الجهات الفرعية"}
              >
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <span>{parent.sponsor_code}</span>
            </div>
          </td>
          <td className="p-3 font-bold whitespace-nowrap">{parent.sponsor_name}</td>
          <td className="p-3 whitespace-nowrap">{getSponsorTypeName(parent.sponsor_type)}</td>
          <td className="p-3 whitespace-nowrap">
            <Badge>جهة رئيسية</Badge>
          </td>
          <td className="p-3 whitespace-nowrap">{parent.phone || "-"}</td>
          <td className="p-3 whitespace-nowrap">{parent.contact_person || "-"}</td>
          <td className="p-3 whitespace-nowrap">
            فروع: {children.length} / كفالات مباشرة: {parent._count?.sponsorships || 0}
          </td>
          <td className="p-3 whitespace-nowrap">{renderStatusBadge(parent)}</td>
          <td className="p-3 text-left whitespace-nowrap space-x-2 space-x-reverse">
            {permissionsLoaded && can("sponsors.create") && (
              <Button size="sm" variant="outline" onClick={() => openCreateChild(parent)}>
                <Plus className="w-4 h-4 ml-1" />
                فرعية
              </Button>
            )}
            {permissionsLoaded && can("sponsors.update") && (
              <Button size="sm" variant="outline" onClick={() => openEdit(parent)} title="تعديل">
                <Pencil className="w-4 h-4" />
              </Button>
            )}
            {permissionsLoaded && can("sponsors.delete") && (
              <Button size="sm" variant="destructive" onClick={() => remove(parent)} title="حذف">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </td>
        </tr>

        {expanded && visibleChildren.length > 0 && visibleChildren.map(renderChildRow)}

        {expanded && children.length === 0 && (
          <tr className="border-b" style={{ borderColor: "var(--app-border)" }}>
            <td colSpan={9} className="p-4 pr-16 text-sm" style={{ color: "var(--app-muted)" }}>
              لا توجد جهات فرعية تحت هذه الجهة. يمكنك استخدام زر "فرعية" لإضافة جهة تابعة.
            </td>
          </tr>
        )}
      </tbody>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">الجهات الكافلة / المانحة</h1>
          <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
            إدارة الجهات الرئيسية والفرعية. الربط التشغيلي بالكفالات يكون لاحقًا على الجهات الفرعية.
          </p>
        </div>

        {permissionsLoaded && can("sponsors.create") && (
          <Button onClick={openCreate} style={{ backgroundColor: "var(--app-primary)", color: "white" }}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة جهة رئيسية
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)" }}>
          <div className="text-sm" style={{ color: "var(--app-muted)" }}>إجمالي الجهات</div>
          <div className="text-2xl font-bold mt-1">{items.length}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)" }}>
          <div className="text-sm" style={{ color: "var(--app-muted)" }}>جهات رئيسية نشطة</div>
          <div className="text-2xl font-bold mt-1">{activeParentsCount}</div>
        </div>
        <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)" }}>
          <div className="text-sm" style={{ color: "var(--app-muted)" }}>جهات فرعية</div>
          <div className="text-2xl font-bold mt-1">{childSponsorsCount}</div>
        </div>
      </div>

      <div
        className="rounded-2xl border p-6 space-y-4"
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative w-full lg:max-w-xl">
            <Search className="absolute right-3 top-3 w-4 h-4 opacity-60" />
            <Input
              className="pr-10"
              placeholder="بحث بالاسم، الرقم، الهاتف، البريد، المسؤول..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={expandAll}>
              فتح الكل
            </Button>
            <Button type="button" variant="outline" onClick={collapseAll}>
              إغلاق الكل
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm border-collapse">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--app-border)" }}>
                <th className="p-3 text-right">رقم الجهة</th>
                <th className="p-3 text-right">اسم الجهة</th>
                <th className="p-3 text-right">نوع الجهة</th>
                <th className="p-3 text-right">التصنيف</th>
                <th className="p-3 text-right">الهاتف</th>
                <th className="p-3 text-right">الشخص المسؤول</th>
                <th className="p-3 text-right">الارتباطات</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-left">الإجراءات</th>
              </tr>
            </thead>

            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={9} className="p-8 text-center" style={{ color: "var(--app-muted)" }}>
                    جاري التحميل...
                  </td>
                </tr>
              </tbody>
            ) : loadError ? (
              <tbody>
                <tr>
                  <td colSpan={9} className="p-8 text-center">
                    <div className="mx-auto max-w-xl rounded-xl border p-4" style={{ borderColor: "var(--app-border)", color: "var(--app-muted)" }}>
                      {loadError}
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : visibleParents.length === 0 && orphanChildren.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={9} className="p-8 text-center" style={{ color: "var(--app-muted)" }}>
                    لا توجد جهات مطابقة
                  </td>
                </tr>
              </tbody>
            ) : (
              <>
                {visibleParents.map(renderParentRow)}

                {orphanChildren.length > 0 && (
                  <tbody>
                    <tr className="border-b" style={{ borderColor: "var(--app-border)" }}>
                      <td colSpan={9} className="p-3 font-bold" style={{ color: "var(--app-muted)" }}>
                        جهات فرعية بدون جهة رئيسية ظاهرة
                      </td>
                    </tr>
                    {orphanChildren.map(renderChildRow)}
                  </tbody>
                )}
              </>
            )}
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div
            className="w-full max-w-4xl h-[92vh] mx-auto rounded-2xl border flex flex-col overflow-hidden"
            style={{
              backgroundColor: "var(--app-surface)",
              borderColor: "var(--app-border)",
            }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
              <div>
                <h2 className="text-xl font-bold">
                  {form.id ? "تعديل جهة كافلة" : form.parent_sponsor_id ? "إضافة جهة فرعية" : "إضافة جهة رئيسية"}
                </h2>
                <p className="text-xs mt-1" style={{ color: "var(--app-muted)" }}>
                  الجهة الرئيسية تستخدم للتجميع، والجهة الفرعية هي التي سيتم ربطها بالكفالات لاحقًا.
                </p>
              </div>

              <button type="button" onClick={() => setOpen(false)} className="text-2xl">
                ×
              </button>
            </div>

            <form onSubmit={save} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
                <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--app-border)" }}>
                  <h3 className="font-bold">البيانات الأساسية</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm">رقم الجهة</label>
                      <Input readOnly value={form.sponsor_code || "يتم توليده تلقائيًا عند الحفظ"} />
                    </div>

                    <div>
                      <label className="text-sm">اسم الجهة *</label>
                      <Input
                        required
                        value={form.sponsor_name}
                        onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm">نوع الجهة *</label>
                      <select
                        required
                        className={fieldClass()}
                        value={form.sponsor_type}
                        onChange={(e) => setForm({ ...form, sponsor_type: e.target.value })}
                      >
                        <option value="">اختر نوع الجهة</option>
                        {sponsorTypes.map((item) => (
                          <option key={item.id} value={item.code || item.id}>
                            {item.name_ar || item.code}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm">الجهة الرئيسية</label>
                      <select
                        className={fieldClass()}
                        value={form.parent_sponsor_id}
                        onChange={(e) => setForm({ ...form, parent_sponsor_id: e.target.value })}
                      >
                        <option value="">جهة رئيسية بدون أب</option>
                        {parentOptions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.sponsor_name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs mt-1" style={{ color: "var(--app-muted)" }}>
                        اتركها فارغة لإضافة جهة رئيسية. اختر جهة رئيسية لإضافة جهة فرعية تحتها.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--app-border)" }}>
                  <h3 className="font-bold">بيانات التواصل</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm">الهاتف</label>
                      <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    </div>

                    <div>
                      <label className="text-sm">البريد الإلكتروني</label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>

                    <div>
                      <label className="text-sm">الشخص المسؤول</label>
                      <Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
                    </div>

                    <div>
                      <label className="text-sm">العنوان</label>
                      <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border p-4 space-y-4" style={{ borderColor: "var(--app-border)" }}>
                  <h3 className="font-bold">ملاحظات وحالة</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm">ملاحظات</label>
                      <textarea
                        className="w-full rounded-md border bg-transparent p-2 min-h-24"
                        value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                      />
                      نشط
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t shrink-0">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  إلغاء
                </Button>

                {((form.id && can("sponsors.update")) || (!form.id && can("sponsors.create"))) && (
                  <Button
                    type="submit"
                    disabled={saving}
                    style={{ backgroundColor: "var(--app-primary)", color: "white" }}
                  >
                    {saving ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
