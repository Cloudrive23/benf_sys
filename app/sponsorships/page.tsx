import SidebarNav from "../components/SidebarNav";
import SponsorshipsClient from "./SponsorshipsClient";

export const dynamic = "force-dynamic";

export default function SponsorshipsPage() {
  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <aside
        className="hidden lg:block w-72 shrink-0 border-l p-4 overflow-y-auto"
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >
        <div className="mb-6 px-4">
          <div className="text-lg font-bold">نظام المستفيدين</div>
          <div className="text-xs mt-1" style={{ color: "var(--app-muted)" }}>
            إدارة البيانات والخدمات
          </div>
        </div>

        <SidebarNav locale="ar" />
      </aside>

      <main className="flex-1 min-w-0 p-4 lg:p-6 overflow-x-hidden">
        <SponsorshipsClient />
      </main>
    </div>
  );
}
