import { prisma } from "@/app/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [branches, sites, centers] = await Promise.all([
      prisma.branches.findMany({ orderBy: { branch_name_ar: "asc" } }),
      prisma.sites.findMany({ orderBy: { site_name_ar: "asc" } }),
      prisma.centers.findMany({ orderBy: { center_name_ar: "asc" } }),
    ]);

    return successResponse(
      { branches, sites, centers },
      "تم تحميل البيانات المرجعية بنجاح"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
