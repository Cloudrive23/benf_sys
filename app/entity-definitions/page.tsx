import AppLayout from "@/app/components/AppLayout";
import EntityDefinitionsClient from "./EntityDefinitionsClient";

export const dynamic = "force-dynamic";

export default function EntityDefinitionsPage() {
  return (
    <AppLayout>
      <EntityDefinitionsClient />
    </AppLayout>
  );
}