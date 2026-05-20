import AppLayout from "../components/AppLayout";
import BeneficiariesClient from "./BeneficiariesClient";

export const dynamic = "force-dynamic";

export default function BeneficiariesPage() {
  return (
    <AppLayout>
      <BeneficiariesClient />
    </AppLayout>
  );
}
