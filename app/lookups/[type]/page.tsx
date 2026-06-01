import AppLayout from "@/app/components/AppLayout";
import LookupClient from "../LookupClient";

export default async function LookupPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  return (
    <AppLayout>
      <LookupClient type={type} />
    </AppLayout>
  );
}