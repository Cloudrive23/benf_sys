"use client";

import { useEffect } from "react";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    async function loadTheme() {
      const res = await fetch("/api/theme", { cache: "no-store" });
      const data = await res.json();

      if (!data.success) return;

      const theme = data.data;

      const root = document.documentElement;

      root.style.setProperty("--app-primary", theme.primary_color || "#2563eb");
      root.style.setProperty("--app-secondary", theme.secondary_color || "#1e293b");
      root.style.setProperty("--app-font-family", theme.font_family || "Cairo");

      if (theme.font_size === "small") {
        root.style.setProperty("--app-base-font-size", "14px");
        root.style.setProperty("--app-title-size", "28px");
      } else if (theme.font_size === "large") {
        root.style.setProperty("--app-base-font-size", "18px");
        root.style.setProperty("--app-title-size", "42px");
      } else {
        root.style.setProperty("--app-base-font-size", "16px");
        root.style.setProperty("--app-title-size", "36px");
      }

      if (theme.dark_mode) {
        root.style.setProperty("--app-bg", "#020617");
        root.style.setProperty("--app-surface", "#0f172a");
        root.style.setProperty("--app-surface-soft", "#111827");
        root.style.setProperty("--app-text", "#f8fafc");
        root.style.setProperty("--app-muted", "#94a3b8");
        root.style.setProperty("--app-border", "rgba(255,255,255,0.12)");
      } else {
        root.style.setProperty("--app-bg", "#f8fafc");
        root.style.setProperty("--app-surface", "#ffffff");
        root.style.setProperty("--app-surface-soft", "#f1f5f9");
        root.style.setProperty("--app-text", "#0f172a");
        root.style.setProperty("--app-muted", "#64748b");
        root.style.setProperty("--app-border", "rgba(15,23,42,0.12)");
      }

      document.body.style.fontFamily = theme.font_family || "Cairo";
      document.body.style.fontSize = "var(--app-base-font-size)";
      document.body.style.backgroundColor = "var(--app-bg)";
      document.body.style.color = "var(--app-text)";
    }

    loadTheme();
  }, []);

  return <>{children}</>;
}