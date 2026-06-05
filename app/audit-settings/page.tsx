import AppLayout from "@/app/components/AppLayout";
import AuditSettingsClient from "./AuditSettingsClient";

export const dynamic = "force-dynamic";

export default function AuditSettingsPage() {
  return (
    <AppLayout>
      <AuditSettingsClient />
    </AppLayout>
  );
}