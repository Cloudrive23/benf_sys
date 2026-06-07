import AppLayout from "@/app/components/AppLayout";
import DuplicateRulesClient from "./DuplicateRulesClient";

export const dynamic = "force-dynamic";

export default function DuplicateRulesPage() {
  return (
    <AppLayout>
      <DuplicateRulesClient />
    </AppLayout>
  );
}