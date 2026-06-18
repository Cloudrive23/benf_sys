"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/constants/translations";

type NavLabel = {
  ar: string;
  en: string;
};

type PermissionItem =
  | string
  | {
      permission_code?: string;
      allowed?: boolean;
    };

type NavItem = {
  href: string;
  label: NavLabel;
  /**
   * إذا لم تُحدد صلاحية، يظهر الرابط دائمًا.
   * إذا حُددت صلاحية واحدة أو أكثر، يظهر الرابط عند امتلاك أي واحدة منها.
   */
  permissions?: string[];
};

type NavGroup = {
  title: NavLabel;
  collapsible?: boolean;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: { ar: "الرئيسية", en: "Main" },
    items: [{ href: "/", label: { ar: "لوحة التحكم", en: "Dashboard" } }],
  },
  {
    title: { ar: "إدارة المستفيدين", en: "Beneficiaries" },
    collapsible: true,
    items: [
      {
        href: "/beneficiaries",
        label: { ar: "المستفيدون", en: "Beneficiaries" },
        permissions: ["beneficiaries.view"],
      },
      {
        href: "/fathers",
        label: { ar: "الآباء", en: "Fathers" },
        permissions: ["fathers.view"],
      },
      {
        href: "/mothers",
        label: { ar: "الأمهات", en: "Mothers" },
        permissions: ["mothers.view"],
      },
      {
        href: "/guardians",
        label: { ar: "المعيلون", en: "Guardians" },
        permissions: ["guardians.view"],
      },
      {
        href: "/sponsors",
        label: { ar: "الجهات الكافلة / المانحة", en: "Sponsors" },
        permissions: ["sponsors.view"],
      },
      {
        href: "/sponsorships",
        label: { ar: "الكفالات", en: "Sponsorships" },
        permissions: ["sponsorships.view"],
      },
    ],
  },
  {
    title: { ar: "التهيئة والإعدادات", en: "Setup & Settings" },
    collapsible: true,
    items: [
      {
        href: "/org/branches",
        label: { ar: "الفروع", en: "Branches" },
        permissions: ["org.branches.view"],
      },
      {
        href: "/org/sites",
        label: { ar: "المواقع", en: "Sites" },
        permissions: ["org.sites.view"],
      },
      {
        href: "/org/centers",
        label: { ar: "المراكز", en: "Centers" },
        permissions: ["org.centers.view"],
      },
      {
        href: "/users",
        label: { ar: "المستخدمون", en: "Users" },
        permissions: ["users.view"],
      },
      {
        href: "/roles",
        label: { ar: "الأدوار والصلاحيات", en: "Roles & Permissions" },
        permissions: ["roles.view"],
      },
      {
        href: "/user-permissions",
        label: { ar: "صلاحيات المستخدمين المباشرة", en: "User Permissions" },
        permissions: ["users.manage_permissions"],
      },
      {
        href: "/audit-logs",
        label: { ar: "سجل التغييرات", en: "Audit Logs" },
        permissions: ["audit_logs.view"],
      },
      {
        href: "/audit-settings",
        label: { ar: "إعدادات سجل التغييرات", en: "Audit Settings" },
        permissions: ["audit_settings.manage"],
      },	  
	  {
		  href: "/attachments-settings",
		  label: { ar: "إعدادات المرفقات", en: "Attachments Settings" },
		  permissions: ["attachments.manage"],
	  },
      {
        href: "/duplicate-rules",
        label: { ar: "سياسات التكرار", en: "Duplicate Rules" },
        permissions: ["duplicate_rules.manage"],
      },
      {
        href: "/database-constraint-messages",
        label: {
          ar: "رسائل قيود قاعدة البيانات",
          en: "Database Constraint Messages",
        },
        permissions: ["database_constraint_messages.manage"],
      },
      {
        href: "/entity-definitions",
        label: { ar: "تعريفات الكيانات", en: "Entity Definitions" },
        permissions: ["entity_definitions.manage"],
      },
      /*
      { href: "/lookups/governorates", label: { ar: "المحافظات", en: "Governorates" } },
      { href: "/lookups/marital_status", label: { ar: "الحالات الاجتماعية", en: "Marital Status" } },
      { href: "/lookups/death_reasons", label: { ar: "أسباب الوفاة", en: "Death Reasons" } },
      { href: "/lookups/relationship_types", label: { ar: "أنواع القرابة", en: "Relationship Types" } },
      { href: "/lookups/genders", label: { ar: "الجنس", en: "Genders" } },
      { href: "/lookups/occupations", label: { ar: "المهن", en: "Occupations" } },
      { href: "/lookups/nationalities", label: { ar: "الجنسيات", en: "Nationalities" } },
      { href: "/lookups/education_levels", label: { ar: "المستويات التعليمية", en: "Education Levels" } },
      { href: "/lookups/health_statuses", label: { ar: "الحالات الصحية", en: "Health Statuses" } },
      { href: "/lookups/beneficiary_statuses", label: { ar: "حالات المستفيد", en: "Beneficiary Statuses" } },
      */
    ],
  },
  {
    title: { ar: "القوائم والديناميكية", en: "Dynamic Setup" },
    collapsible: true,
    items: [
      {
        href: "/lookups/types",
        label: { ar: "أنواع القوائم", en: "Lookup Types" },
        permissions: ["lookups.manage"],
      },
      {
        href: "/lookups/values",
        label: { ar: "قيم القوائم", en: "Lookup Values" },
        permissions: ["lookups.manage"],
      },
      {
        href: "/beneficiary-fields/tabs",
        label: { ar: "تبويبات المستفيد", en: "Beneficiary Tabs" },
        permissions: ["entity_definitions.manage"],
      },
      {
        href: "/beneficiary-fields/groups",
        label: { ar: "مجموعات البيانات", en: "Field Groups" },
        permissions: ["entity_definitions.manage"],
      },
      {
        href: "/beneficiary-fields/fields",
        label: { ar: "الحقول الديناميكية", en: "Dynamic Fields" },
        permissions: ["entity_definitions.manage"],
      },
    ],
  },
  {
    title: { ar: "المظهر والواجهة", en: "Appearance" },
    collapsible: true,
    items: [
      {
        href: "/theme",
        label: { ar: "إعدادات المظهر", en: "Theme Settings" },
        permissions: ["theme.manage"],
      },
    ],
  },
  {
    title: { ar: "التقارير والمتابعة", en: "Reports" },
    items: [
      {
        href: "/reports",
        label: { ar: "التقارير", en: "Reports" },
      },
    ],
  },
];

function normalizePermissions(items: PermissionItem[] | undefined | null) {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => {
      if (typeof item === "string") return true;
      return item.allowed === true;
    })
    .map((item) => {
      if (typeof item === "string") return item;
      return item.permission_code || "";
    })
    .filter(Boolean);
}

export default function SidebarNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUserPermissions() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();

        if (cancelled) return;

        if (data.success) {
          setPermissions(normalizePermissions(data.data?.permissions));
          setIsSuperAdmin(Boolean(data.data?.user?.is_super_admin));
        } else {
          setPermissions([]);
          setIsSuperAdmin(false);
        }
      } catch {
        if (!cancelled) {
          setPermissions([]);
          setIsSuperAdmin(false);
        }
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    loadCurrentUserPermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  const permissionSet = useMemo(() => new Set(permissions), [permissions]);

  function canAny(requiredPermissions?: string[]) {
    if (!requiredPermissions || requiredPermissions.length === 0) return true;
    if (isSuperAdmin) return true;
    return requiredPermissions.some((permission) => permissionSet.has(permission));
  }

  function toggleGroup(key: string) {
    setOpenGroups((old) => ({
      ...old,
      [key]: !old[key],
    }));
  }

  const visibleGroups = useMemo(() => {
    // لا نعرض الروابط المقيدة قبل تحميل الصلاحيات حتى لا تظهر لحظة ثم تختفي.
    // الروابط العامة فقط تظهر مباشرة.
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          loaded ? canAny(item.permissions) : !item.permissions
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [loaded, permissionSet, isSuperAdmin]);

  return (
    <nav className="space-y-3">
      {visibleGroups.map((group) => {
        const key = group.title.en;
        const isOpen = openGroups[key] || false;

        const hasActiveChild = group.items.some((item) =>
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        );

        if (group.collapsible) {
          return (
            <div key={key} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleGroup(key)}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all"
                style={{
                  backgroundColor: hasActiveChild
                    ? "var(--app-primary)"
                    : "transparent",
                  color: "var(--app-text)",
                }}
              >
                <span>{group.title[locale]}</span>

                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="space-y-1 pr-4">
                  {group.items.map((item) => {
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-xl px-4 py-2 text-sm transition-all"
                        style={{
                          backgroundColor: isActive
                            ? "var(--app-primary)"
                            : "transparent",
                          color: "var(--app-text)",
                        }}
                      >
                        {item.label[locale]}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <div key={key} className="space-y-1">
            <div
              className="px-4 text-xs font-semibold"
              style={{ color: "var(--app-muted)" }}
            >
              {group.title[locale]}
            </div>

            {group.items.map((item) => {
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-4 py-3 transition-all"
                  style={{
                    backgroundColor: isActive
                      ? "var(--app-primary)"
                      : "transparent",
                    color: "var(--app-text)",
                  }}
                >
                  {item.label[locale]}
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
