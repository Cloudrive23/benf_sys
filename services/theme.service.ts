import { AppError } from "@/lib/api-error";
import { themeRepository } from "@/repositories/theme.repository";
import { auditService } from "@/services/audit.service";

export const themeService = {
  async getTheme() {
    return themeRepository.getSettings();
  },

  async updateTheme(input: any) {
    if (!input.id) {
      throw new AppError("معرف الإعدادات مطلوب", 400);
    }

    const item = await themeRepository.updateSettings(input.id, {
      organization_name: input.organization_name || "نظام إدارة المستفيدين",
      primary_color: input.primary_color || "#2563eb",
      secondary_color: input.secondary_color || "#1e293b",
      font_family: input.font_family || "Cairo",
      font_size: input.font_size || "medium",
      dark_mode: Boolean(input.dark_mode),
      sidebar_mode: input.sidebar_mode || "expanded",
      logo_url: input.logo_url || null,
      updated_at: new Date(),
    });

    await auditService.log({
      action: "UPDATE",
      entityName: "system_settings",
      entityId: item.id,
      newData: item,
      notes: "تم تعديل إعدادات المظهر",
    });

    return item;
  },
};