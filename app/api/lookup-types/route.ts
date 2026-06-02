import { prisma } from "@/app/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
		const data = await prisma.lookup_types.findMany({
		  where: { is_active: true },
		  orderBy: [{ sort_order: "asc" }, { type_name_ar: "asc" }],
		});

    return successResponse(data, "تم تحميل أنواع القوائم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
/*import { prisma } from "@/app/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await (prisma as any).lookup_types.findMany({
		  where: { is_active: true },
		  orderBy: [{ sort_order: "asc" }, { type_name_ar: "asc" }],
		});

    return successResponse(data, "تم تحميل أنواع القوائم بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
 */