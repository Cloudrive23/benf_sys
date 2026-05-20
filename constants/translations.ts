export const translations = {
  ar: {
    appName: "نظام إدارة المستفيدين",
    secureDashboard: "لوحة إدارة آمنة",
    dashboard: "لوحة التحكم",
    liveStats: "إحصائيات مباشرة من قاعدة البيانات",
    beneficiaries: "المستفيدون",
    users: "المستخدمون",
    sponsors: "الداعمون",
    reports: "التقارير",
    logout: "تسجيل الخروج",
    language: "اللغة",
    arabic: "العربية",
    english: "English",
  },
  en: {
    appName: "Beneficiary Management System",
    secureDashboard: "Secure administrative dashboard",
    dashboard: "Dashboard",
    liveStats: "Live statistics from database",
    beneficiaries: "Beneficiaries",
    users: "Users",
    sponsors: "Sponsors",
    reports: "Reports",
    logout: "Logout",
    language: "Language",
    arabic: "العربية",
    english: "English",
  },
} as const;

export type Locale = keyof typeof translations;
