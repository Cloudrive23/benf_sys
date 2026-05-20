import { prisma } from "./lib/prisma";
import AppLayout from "./components/AppLayout";
import { getDictionary } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Home() {
  const t = await getDictionary();

  const [usersCount, beneficiariesCount, sponsorsCount] =
    await Promise.all([
      prisma.users.count(),
      prisma.beneficiaries.count(),
      prisma.sponsors.count(),
    ]);

  return (
    <AppLayout>
      <div className="mb-10">
        <h2 className="text-4xl font-bold">{t.dashboard}</h2>
        <p className="text-gray-400 mt-2">
          {t.liveStats}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h3 className="text-gray-400 text-sm">{t.beneficiaries}</h3>
          <p className="text-3xl font-bold mt-2">{beneficiariesCount}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h3 className="text-gray-400 text-sm">{t.sponsors}</h3>
          <p className="text-3xl font-bold mt-2">{sponsorsCount}</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h3 className="text-gray-400 text-sm">{t.users}</h3>
          <p className="text-3xl font-bold mt-2">{usersCount}</p>
        </div>
      </div>
    </AppLayout>
  );
}
