import { getCurrentUser } from "@/lib/auth";
import SidebarNav from "./SidebarNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-72 bg-gray-900 border-r border-gray-800 p-6">
        <div className="mb-10">
          <h1 className="text-2xl font-bold">BENF_SYS</h1>
          <p className="text-xs text-gray-500 mt-1">
            Beneficiary Management
          </p>
        </div>

        <SidebarNav />
      </aside>

      <section className="flex-1">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-950">
          <div>
            <div className="font-semibold">
              Beneficiary Management System
            </div>
            <div className="text-xs text-gray-500">
              Secure administrative dashboard
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              {user?.username || "Guest"}
            </div>

            <form action="/api/auth/logout" method="post">
              <button className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm">
                Logout
              </button>
            </form>
          </div>
        </header>

        <div className="p-10">{children}</div>
      </section>
    </main>
  );
}
