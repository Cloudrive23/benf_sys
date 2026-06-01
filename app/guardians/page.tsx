import AppLayout from "@/app/components/AppLayout";
import GuardiansClient from "./GuardiansClient";

export const dynamic = "force-dynamic";

export default function GuardiansPage() {
  return (
    <AppLayout>
      <GuardiansClient />
    </AppLayout>
  );
}