import AppLayout from "../components/AppLayout";
import UsersClient from "./UsersClient";
import { requirePermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function AccessDenied() {
  return (
    <div
      className="rounded-2xl border p-8 text-center space-y-3"
      style={{
        backgroundColor: "var(--app-surface)",
        borderColor: "var(--app-border)",
      }}
    >
      <h1 className="text-2xl font-bold">ليس لديك صلاحية عرض المستخدمين</h1>
      <p className="text-sm" style={{ color: "var(--app-muted)" }}>
        يلزم توفر الصلاحية users.view للوصول إلى هذه الشاشة.
      </p>
    </div>
  );
}

export default async function UsersPage() {
  const permission = await requirePermission("users.view");

  return <AppLayout>{permission.ok ? <UsersClient /> : <AccessDenied />}</AppLayout>;
}
