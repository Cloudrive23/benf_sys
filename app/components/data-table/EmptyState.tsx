export default function EmptyState({
  text = "لا توجد بيانات",
}: {
  text?: string;
}) {
  return (
    <div
      className="p-10 text-center rounded-xl border"
      style={{
        borderColor: "var(--app-border)",
        color: "var(--app-muted)",
      }}
    >
      {text}
    </div>
  );
}