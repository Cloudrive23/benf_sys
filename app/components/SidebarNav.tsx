"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/constants/translations";

const navItems = [
  { href: "/", label: { ar: "لوحة التحكم", en: "Dashboard" } },
  { href: "/beneficiaries", label: { ar: "المستفيدون", en: "Beneficiaries" } },
  { href: "/users", label: { ar: "المستخدمون", en: "Users" } },
  { href: "/sponsors", label: { ar: "الداعمون", en: "Sponsors" } },
  { href: "/reports", label: { ar: "التقارير", en: "Reports" } },
];

export default function SidebarNav({
  locale,
}: {
  locale: Locale;
}) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-lg px-4 py-3 transition ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
            }`}
          >
            {item.label[locale]}
          </Link>
        );
      })}
    </nav>
  );
}
