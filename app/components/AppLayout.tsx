import Link from "next/link";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex">
      <aside className="w-72 bg-gray-900 border-r border-gray-800 p-6">
        <h1 className="text-2xl font-bold mb-10">BENF_SYS</h1>

        <nav className="space-y-3">
          <Link href="/" className="block hover:bg-gray-800 rounded-lg px-4 py-3">
            Dashboard
          </Link>

          <Link href="/beneficiaries" className="block hover:bg-gray-800 rounded-lg px-4 py-3">
            Beneficiaries
          </Link>

          <Link href="/users" className="block hover:bg-gray-800 rounded-lg px-4 py-3">
            Users
          </Link>

          <Link href="/sponsors" className="block hover:bg-gray-800 rounded-lg px-4 py-3">
            Sponsors
          </Link>

          <Link href="/reports" className="block hover:bg-gray-800 rounded-lg px-4 py-3">
            Reports
          </Link>
        </nav>
      </aside>

      <section className="flex-1">
        <header className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-950">
          <div className="font-semibold">Beneficiary Management System</div>
          <div className="text-sm text-gray-400">Admin</div>
        </header>

        <div className="p-10">{children}</div>
      </section>
    </main>
  );
}