export default function DataPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-3xl border p-6 space-y-5 shadow-xl"
      style={{
        backgroundColor: "var(--app-surface)",
        borderColor: "var(--app-border)",
      }}
    >
      {children}
    </div>
  );
}