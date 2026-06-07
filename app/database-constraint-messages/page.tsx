import AppLayout from "@/app/components/AppLayout";
import DatabaseConstraintMessagesClient from "./DatabaseConstraintMessagesClient";

export const dynamic = "force-dynamic";

export default function DatabaseConstraintMessagesPage() {
  return (
    <AppLayout>
      <DatabaseConstraintMessagesClient />
    </AppLayout>
  );
}