import AppLayout from "@/app/components/AppLayout";
import SitesClient from "./SitesClient";

export const dynamic = "force-dynamic";

export default function SitesPage() {
  return (
    <AppLayout>
      <SitesClient />
    </AppLayout>
  );
}