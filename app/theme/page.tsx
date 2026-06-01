import AppLayout from "@/app/components/AppLayout";
import ThemeClient from "./ThemeClient";

export const dynamic = "force-dynamic";

export default function ThemePage() {
  return (
    <AppLayout>
      <ThemeClient />
    </AppLayout>
  );
}