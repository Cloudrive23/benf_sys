import AppLayout from "../components/AppLayout";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default function UsersPage() {
  return (
    <AppLayout>
      <UsersClient />
    </AppLayout>
  );
}
