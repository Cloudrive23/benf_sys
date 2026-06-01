export default function AppSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-3xl border p-5 space-y-5"
      style={{
        backgroundColor: "rgba(255,255,255,0.025)",
        borderColor: "var(--app-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-1.5 h-8 rounded-full"
          style={{ backgroundColor: "var(--app-primary)" }}
        />
        <h3 className="text-xl font-bold">{title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {children}
      </div>
    </section>
  );
}