export default function LoadingSpinner({
  text = "جاري التحميل...",
}: {
  text?: string;
}) {
  return (
    <div className="flex items-center justify-center p-10">
      <div className="space-y-3 text-center">
        <div className="w-10 h-10 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin mx-auto" />
        <div className="text-sm opacity-70">
          {text}
        </div>
      </div>
    </div>
  );
}