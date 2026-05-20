import { cookies } from "next/headers";
import { translations, type Locale } from "@/constants/translations";

export const defaultLocale: Locale = "ar";

export const locales: Locale[] = ["ar", "en"];

export function getDirection(locale: Locale) {
  return locale === "ar" ? "rtl" : "ltr";
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value as Locale | undefined;

  if (locale && locales.includes(locale)) {
    return locale;
  }

  return defaultLocale;
}

export async function getDictionary() {
  const locale = await getLocale();
  return translations[locale];
}
