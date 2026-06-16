import AppLayout from "@/app/components/AppLayout";
import AuditSettingsClient from "./AuditSettingsClient";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";


function AccessDenied({ message = "ليس لديك صلاحية الوصول إلى هذه الشاشة" }: { message?: string }) {
  return (
    <div
      className="rounded-2xl border p-8 text-center space-y-3"
      style={{
        backgroundColor: "var(--app-surface)",
        borderColor: "var(--app-border)",
        color: "var(--app-text)",
      }}
    >
      <h1 className="text-2xl font-bold">غير مصرح</h1>
      <p style={{ color: "var(--app-muted)" }}>{message}</p>
    </div>
  );
}

export default async function AuditSettingsPage() {
  const permission = await requirePermission("audit_settings.manage");

  if (!permission.ok) {
    return (
      <AppLayout>
        <AccessDenied />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AuditSettingsClient />
    </AppLayout>
  );
}
