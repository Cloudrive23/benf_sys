"use client";

export default function LanguageSwitcher({
  locale,
}: {
  locale: "ar" | "en";
}) {
  function changeLanguage(value: "ar" | "en") {
    document.cookie = `locale=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
    window.location.href = window.location.pathname;
  }

  return (
    <select
      value={locale}
      onChange={(e) => changeLanguage(e.target.value as "ar" | "en")}
      className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm"
    >
      <option value="ar">العربية</option>
      <option value="en">English</option>
    </select>
  );
}
