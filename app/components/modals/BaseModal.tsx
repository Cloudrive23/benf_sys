"use client";

export default function BaseModal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-6xl max-h-[90vh] rounded-3xl border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >
        <div
          className="px-7 py-4 border-b flex items-center justify-between"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        >
          <h2 className="text-2xl font-bold">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full text-xl transition hover:bg-white/10"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-76px)]">
          {children}
        </div>
      </div>
    </div>
  );
}