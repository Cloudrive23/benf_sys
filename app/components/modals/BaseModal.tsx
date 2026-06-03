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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div
        className="w-[96vw] max-w-[96vw] lg:max-w-[1200px] h-[88vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          backgroundColor: "var(--app-surface)",
          borderColor: "var(--app-border)",
        }}
      >
        <div
          className="px-4 sm:px-7 py-3 sm:py-4 border-b flex items-center justify-between shrink-0"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "rgba(255,255,255,0.04)",
          }}
        >
          <h2 className="text-lg sm:text-2xl font-bold truncate">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-xl transition hover:bg-white/10 shrink-0"
          >
            ×
          </button>
        </div>

        <div className="p-3 sm:p-5 overflow-y-auto overflow-x-hidden flex-1 max-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
