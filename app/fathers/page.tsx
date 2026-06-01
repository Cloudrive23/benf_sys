import AppLayout from "@/app/components/AppLayout";
import FathersClient from "./FathersClient";

export const dynamic = "force-dynamic";

export default function FathersPage() {
  return (
    <AppLayout>
      <FathersClient />
    </AppLayout>
  );
}