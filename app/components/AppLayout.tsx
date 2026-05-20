import { getCurrentUser } from "@/lib/auth";
import { getLocale, getDirection } from "@/lib/i18n";
import { brand } from "@/constants/brand";
import SidebarNav from "./SidebarNav";
import LanguageSwitcher from "./LanguageSwitcher";
import { Toaster } from "sonner";

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
      className="min-h-screen flex"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <aside
        className="w-72 border-r p-6"
        style={{
          backgroundColor: "var(--app-sidebar)",
          borderColor: "var(--app-border)",
        }}
      >
        <div className="mb-10">
          <h1 className="text-2xl font-bold">{brand.logoText}</h1>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--app-muted)" }}
          >
            {brand.name[locale]}
          </p>
        </div>

        <SidebarNav locale={locale} />
      </aside>

      <section className="flex-1">
        <header
          className="h-16 border-b flex items-center justify-between px-8"
          style={{
            backgroundColor: "var(--app-bg)",
            borderColor: "var(--app-border)",
          }}
        >
          <div>
            <div className="font-semibold">
              {brand.name[locale]}
            </div>
            <div
              className="text-xs"
              style={{ color: "var(--app-muted)" }}
            >
              {brand.subtitle[locale]}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher locale={locale} />

            <div
              className="text-sm"
              style={{ color: "var(--app-muted)" }}
            >
              {user?.username || "Guest"}
            </div>

            <form action="/api/auth/logout" method="post">
              <button
                className="px-4 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--app-danger)",
                  color: "white",
                }}
              >
                {locale === "ar" ? "تسجيل الخروج" : "Logout"}
              </button>
            </form>
          </div>
        </header>

        <div className="p-10">{children}</div>
      </section>
    <Toaster richColors position="top-center" />
    </main>
  );
}
