export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-3xl border p-6 flex items-center justify-between shadow-lg"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
        borderColor: "var(--app-border)",
      }}
    >
      <div>
        <h1 className="text-4xl font-extrabold">{title}</h1>
        {description && (
          <p className="text-sm mt-2" style={{ color: "var(--app-muted)" }}>
            {description}
          </p>
        )}
      </div>

      {action}
    </div>
  );
}