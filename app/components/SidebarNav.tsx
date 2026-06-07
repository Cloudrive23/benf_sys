"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/constants/translations";

const navGroups = [
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
		  },
		  {
			href: "/fathers",
			label: { ar: "الآباء", en: "Fathers" },
		  },
		  {
			href: "/mothers",
			label: { ar: "الأمهات", en: "Mothers" },
		  },
		  {
			href: "/guardians",
			label: { ar: "المعيلون", en: "Guardians" },
		  },
		],
  },
  {
    title: { ar: "الكفالات والجهات", en: "Sponsorships" },
    collapsible: true,
    items: [
      { href: "/sponsors", label: { ar: "الجهات الكافلة / المانحة", en: "Sponsors" } },
    ],
  },
  {
    title: { ar: "التهيئة والإعدادات", en: "Setup & Settings" },
    collapsible: true,
    items: [
      { href: "/org/branches", label: { ar: "الفروع", en: "Branches" } },
      { href: "/org/sites", label: { ar: "المواقع", en: "Sites" } },
      { href: "/org/centers", label: { ar: "المراكز", en: "Centers" } },
      { href: "/users", label: { ar: "المستخدمون", en: "Users" } },
	  {href: "/audit-settings",label: {ar: "إعدادات سجل التغييرات",en: "Audit Settings",},},
	  {href: "/duplicate-rules",label: {ar: "سياسات التكرار",en: "Duplicate Rules",},},
	  {href: "/database-constraint-messages",label: {ar: "رسائل قيود قاعدة البيانات",en: "Database Constraint Messages",},},
	  {href: "/entity-definitions",label: {ar: "تعريفات الكيانات",en: "Entity Definitions",},},
	  /*{href: "/lookups/governorates",label: {ar: "المحافظات",en: "Governorates",},},
	  {href: "/lookups/marital_status",label: {ar: "الحالات الاجتماعية",en: "Marital Status",},},
	  {href: "/lookups/death_reasons",label: {ar: "أسباب الوفاة",en: "Death Reasons",},},
	  {href: "/lookups/relationship_types",label: {ar: "أنواع القرابة",en: "Relationship Types",},},
	  {href: "/lookups/genders",label: { ar: "الجنس", en: "Genders" },},
	  {href: "/lookups/occupations",label: { ar: "المهن", en: "Occupations" },},
	  {href: "/lookups/nationalities",label: { ar: "الجنسيات", en: "Nationalities" },},
	  {href: "/lookups/education_levels",label: { ar: "المستويات التعليمية", en: "Education Levels" },},
	  {href: "/lookups/health_statuses",label: { ar: "الحالات الصحية", en: "Health Statuses" },},
	  {href: "/lookups/beneficiary_statuses",label: { ar: "حالات المستفيد", en: "Beneficiary Statuses" },},
	  */
    ],
  },
  
	  {
		title: { ar: "القوائم والديناميكية", en: "Dynamic Setup" },
		  collapsible: true,
		  items: [
			{ href: "/lookups/types", label: { ar: "أنواع القوائم", en: "Lookup Types" } },
			{ href: "/lookups/values", label: { ar: "قيم القوائم", en: "Lookup Values" } },
			{ href: "/beneficiary-fields/tabs", label: { ar: "تبويبات المستفيد", en: "Beneficiary Tabs" } },
			{ href: "/beneficiary-fields/groups", label: { ar: "مجموعات البيانات", en: "Field Groups" } },
			{ href: "/beneficiary-fields/fields", label: { ar: "الحقول الديناميكية", en: "Dynamic Fields" } },
		  ],
		},
  {
	title: { ar: " المظهر والواجهة ", en: "Appearance" },
    collapsible: true,
    items: [
      { href: "/theme", label: { ar: "اعدادات المظهر", en: "theme settings" } },  
	  ],
  },
	  
  {
    title: { ar: "التقارير والمتابعة", en: "Reports" },
    items: [{ href: "/reports", label: { ar: "التقارير", en: "Reports" } }],
  },
];

export default function SidebarNav({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(key: string) {
    setOpenGroups((old) => ({
      ...old,
      [key]: !old[key],
    }));
  }

  return (
    <nav className="space-y-3">
      {navGroups.map((group) => {
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
                  backgroundColor: hasActiveChild ? "var(--app-primary)" : "transparent",
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