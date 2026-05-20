import { getCurrentUser } from "@/lib/auth";
import { getLocale, getDirection } from "@/lib/i18n";
import { brand } from "@/constants/brand";
import SidebarNav from "./SidebarNav";
import LanguageSwitcher from "./LanguageSwitcher";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const locale = await getLocale();
  const dir = getDirection(locale);

  return (
    <main
      dir={dir}
      className={`min-h-screen ${brand.colors.page} ${brand.colors.text} flex`}
    >
      <aside className={`w-72 ${brand.colors.sidebar} border-r ${brand.colors.border} p-6`}>
        <div className="mb-10">
          <h1 className="text-2xl font-bold">{brand.logoText}</h1>
          <p className={`text-xs ${brand.colors.mutedText} mt-1`}>
            {brand.name[locale]}
          </p>
        </div>

        <SidebarNav locale={locale} />
      </aside>

      <section className="flex-1">
        <header className={`h-16 border-b ${brand.colors.border} flex items-center justify-between px-8 ${brand.colors.page}`}>
          <div>
            <div className="font-semibold">
              {brand.name[locale]}
            </div>
            <div className={`text-xs ${brand.colors.mutedText}`}>
              {brand.subtitle[locale]}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher locale={locale} />

            <div className={`text-sm ${brand.colors.mutedText}`}>
              {user?.username || "Guest"}
            </div>

            <form action="/api/auth/logout" method="post">
              <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm">
                {locale === "ar" ? "تسجيل الخروج" : "Logout"}
              </button>
            </form>
          </div>
        </header>

        <div className="p-10">{children}</div>
      </section>
    </main>
  );
}
