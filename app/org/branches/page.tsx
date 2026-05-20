import AppLayout from "@/app/components/AppLayout";
import BranchesClient from "./BranchesClient";

export const dynamic = "force-dynamic";

export default function BranchesPage() {
  return (
    <AppLayout>
      <BranchesClient />
    </AppLayout>
  );
}
