"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/constants/translations";

type NavItem = {
  href: string;
  label: { ar: string; en: string };
  /**
   * إذا كانت الصلاحية غير محددة فالرابط يبقى عامًا.
   * إذا كانت الصلاحية محددة فلا يظهر الرابط إلا إذا كانت الصلاحية allowed=true.
   */
  permission?: string;
};

type NavGroup = {
  title: { ar: string; en: string };
  collapsible?: boolean;
  items: NavItem[];
};

type AuthMePermission =
  | string
  | {
      permission_code?: string | null;
      allowed?: boolean | null;
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
        permission: "beneficiaries.view",
      },
      {
        href: "/fathers",
        label: { ar: "الآباء", en: "Fathers" },
        permission: "fathers.view",
      },
      {
        href: "/mothers",
        label: { ar: "الأمهات", en: "Mothers" },
        permission: "mothers.view",
      },
      {
        href: "/guardians",
        label: { ar: "المعيلون", en: "Guardians" },
        permission: "guardians.view",
      },
      {
        href: "/sponsors",
        label: { ar: "الجهات الكافلة / المانحة", en: "Sponsors" },
        permission: "sponsors.view",
      },
      {
        href: "/sponsorships",
        label: { ar: "الكفالات", en: "Sponsorships" },
        permission: "sponsorships.view",
      },
    ],
  },
  {
    title: { ar: "التهيئة والإعدادات", en: "Setup & Settings" },
    collapsible: true,
    items: [
      /**
       * روابط الوحدات التنظيمية تُترك بدون صلاحية حاليًا لأن صلاحياتها التفصيلية
       * لم تُنشأ بعد ضمن جدول permissions، ولأنها مستخدمة كبيانات مرجعية في النظام.
       */
      { href: "/org/branches", label: { ar: "الفروع", en: "Branches" } },
      { href: "/org/sites", label: { ar: "المواقع", en: "Sites" } },
      { href: "/org/centers", label: { ar: "المراكز", en: "Centers" } },

      {
        href: "/users",
        label: { ar: "المستخدمون", en: "Users" },
        permission: "users.view",
      },
      {
        href: "/roles",
        label: { ar: "الأدوار والصلاحيات", en: "Roles & Permissions" },
        permission: "roles.view",
      },
      {
        href: "/user-permissions",
        label: {
          ar: "صلاحيات المستخدمين المباشرة",
          en: "User Permissions",
        },
        permission: "users.manage_permissions",
      },
      {
        href: "/audit-settings",
        label: {
          ar: "إعدادات سجل التغييرات",
          en: "Audit Settings",
        },
        permission: "audit_settings.manage",
      },
      {
        href: "/duplicate-rules",
        label: {
          ar: "سياسات التكرار",
          en: "Duplicate Rules",
        },
        permission: "duplicate_rules.manage",
      },
      {
        href: "/database-constraint-messages",
        label: {
          ar: "رسائل قيود قاعدة البيانات",
          en: "Database Constraint Messages",
        },
        permission: "database_constraint_messages.manage",
      },
      {
        href: "/entity-definitions",
        label: {
          ar: "تعريفات الكيانات",
          en: "Entity Definitions",
        },
        permission: "entity_definitions.manage",
      },
    ],
  },
  {
    title: { ar: "القوائم والديناميكية", en: "Dynamic Setup" },
    collapsible: true,
    items: [
      {
        href: "/lookups/types",
        label: { ar: "أنواع القوائم", en: "Lookup Types" },
        permission: "lookups.manage",
      },
      {
        href: "/lookups/values",
        label: { ar: "قيم القوائم", en: "Lookup Values" },
        permission: "lookups.manage",
      },
      /**
       * هذه الصفحات مرتبطة بإعدادات الحقول الديناميكية للمستفيدين.
       * لا توجد لها صلاحيات مستقلة حتى الآن، لذلك نربطها مؤقتًا بصلاحية
       * entity_definitions.manage باعتبارها جزءًا من الإعدادات الديناميكية.
       */
      {
        href: "/beneficiary-fields/tabs",
        label: { ar: "تبويبات المستفيد", en: "Beneficiary Tabs" },
        permission: "entity_definitions.manage",
      },
      {
        href: "/beneficiary-fields/groups",
        label: { ar: "مجموعات البيانات", en: "Field Groups" },
        permission: "entity_definitions.manage",
      },
      {
        href: "/beneficiary-fields/fields",
        label: { ar: "الحقول الديناميكية", en: "Dynamic Fields" },
        permission: "entity_definitions.manage",
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
        permission: "theme.manage",
      },
    ],
  },
  {
    title: { ar: "التقارير والمتابعة", en: "Reports" },
    items: [
      /**
       * صفحة التقارير لم تكتمل صلاحياتها بعد، لذلك تُترك ظاهرة كما كانت.
       * عند بناء وحدة التقارير نربطها بصلاحيات reports.*.
       */
      { href: "/reports", label: { ar: "التقارير", en: "Reports" } },
      {
        href: "/audit-logs",
        label: { ar: "سجل التغييرات", en: "Audit Logs" },
        permission: "audit_logs.view",
      },
    ],
  },
];

function normalizePermissions(rawPermissions: AuthMePermission[]) {
  const allowed = new Set<string>();

  for (const permission of rawPermissions || []) {
    if (typeof permission === "string") {
      allowed.add(permission);
      continue;
    }

    if (
      permission &&
      permission.permission_code &&
      permission.allowed === true
    ) {
      allowed.add(permission.permission_code);
    }
  }

  return allowed;
}

export default function SidebarNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPermissions() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();

        if (!cancelled && data?.success) {
          setPermissions(normalizePermissions(data.data?.permissions || []));
        }

        if (!cancelled && !data?.success) {
          setPermissions(new Set());
        }
      } catch {
        if (!cancelled) {
          setPermissions(new Set());
        }
      } finally {
        if (!cancelled) {
          setPermissionsLoaded(true);
        }
      }
    }

    loadPermissions();

    return () => {
      cancelled = true;
    };
  }, []);

  function can(permissionCode?: string) {
    if (!permissionCode) return true;
    return permissions.has(permissionCode);
  }

  const visibleGroups = useMemo(() => {
    /**
     * قبل اكتمال تحميل الصلاحيات نعرض فقط الروابط العامة حتى لا تظهر روابط
     * محمية ثم تختفي بشكل مربك للمستخدم.
     */
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!item.permission) return true;
          if (!permissionsLoaded) return false;
          return can(item.permission);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [permissions, permissionsLoaded]);

  function toggleGroup(key: string) {
    setOpenGroups((old) => ({
      ...old,
      [key]: !old[key],
    }));
  }

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
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

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
