import AppLayout from "@/app/components/AppLayout";
import MothersClient from "./MothersClient";

export const dynamic = "force-dynamic";

export default function MothersPage() {
  return (
    <AppLayout>
      <MothersClient />
    </AppLayout>
  );
}