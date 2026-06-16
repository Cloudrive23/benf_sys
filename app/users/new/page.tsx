import AppLayout from "@/app/components/AppLayout";
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
      <h1 className="text-2xl font-bold">ليس لديك صلاحية إضافة مستخدم</h1>
      <p className="text-sm" style={{ color: "var(--app-muted)" }}>
        يلزم توفر الصلاحية users.create للوصول إلى هذه الشاشة.
      </p>
    </div>
  );
}

export default async function NewUserPage() {
  const permission = await requirePermission("users.create");

  if (!permission.ok) {
    return (
      <AppLayout>
        <AccessDenied />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold">إضافة مستخدم</h1>
          <p className="text-sm mt-1" style={{ color: "var(--app-muted)" }}>
            إنشاء حساب مستخدم جديد للنظام.
          </p>
        </div>

        <form
          action="/api/users"
          method="post"
          className="max-w-xl rounded-2xl border p-8 space-y-5"
          style={{
            backgroundColor: "var(--app-surface)",
            borderColor: "var(--app-border)",
          }}
        >
          <input name="username" placeholder="اسم المستخدم" className="w-full p-3 rounded bg-transparent border" required />
          <input name="full_name" placeholder="الاسم الكامل" className="w-full p-3 rounded bg-transparent border" required />
          <input name="email" placeholder="البريد الإلكتروني" className="w-full p-3 rounded bg-transparent border" />
          <input name="phone" placeholder="الهاتف" className="w-full p-3 rounded bg-transparent border" />
          <input name="password" placeholder="كلمة المرور" type="password" className="w-full p-3 rounded bg-transparent border" />

          <button className="px-5 py-3 rounded-xl" style={{ backgroundColor: "var(--app-primary)", color: "white" }}>
            حفظ المستخدم
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
