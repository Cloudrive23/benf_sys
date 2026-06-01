import AppLayout from "@/app/components/AppLayout";
import BeneficiaryFieldTabsClient from "./BeneficiaryFieldTabsClient";

export const dynamic = "force-dynamic";

export default function BeneficiaryFieldTabsPage() {
  return (
    <AppLayout>
      <BeneficiaryFieldTabsClient />
    </AppLayout>
  );
}