import AppLayout from "@/app/components/AppLayout";
import CentersClient from "./CentersClient";

export const dynamic = "force-dynamic";

export default function CentersPage() {
  return (
    <AppLayout>
      <CentersClient />
    </AppLayout>
  );
}