import AppLayout from "@/app/components/AppLayout";
import { requirePermission } from "@/lib/permissions";
import BeneficiaryFieldsClient from "./BeneficiaryFieldsClient";

export const dynamic = "force-dynamic";

function AccessDeniedMessage() {
  return (
    <div
      className="rounded-2xl border p-8 text-center space-y-3"
      style={{
        backgroundColor: "var(--app-surface)",
        borderColor: "var(--app-border)",
      }}
    >
      <h1 className="text-2xl font-bold">غير مصرح</h1>
      <p style={{ color: "var(--app-muted)" }}>
        ليس لديك صلاحية الوصول إلى هذه الشاشة
      </p>
    </div>
  );
}

export default async function BeneficiaryFieldsPage() {
  const permission = await requirePermission("entity_definitions.manage");

  if (!permission.ok) {
    return (
      <AppLayout>
        <AccessDeniedMessage />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <BeneficiaryFieldsClient />
    </AppLayout>
  );
}
