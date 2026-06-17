import AppLayout from "@/app/components/AppLayout";
import AttachmentsSettingsClient from "./AttachmentsSettingsClient";

export const dynamic = "force-dynamic";

export default function AttachmentsSettingsPage() {
  return (
    <AppLayout>
      <AttachmentsSettingsClient />
    </AppLayout>
  );
}