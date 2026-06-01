import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { sitesService } from "@/services/sites.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sites = await sitesService.listSites();
    return successResponse(sites, "تم تحميل المواقع بنجاح", 200, sites.length);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const site = await sitesService.createSite(body);
    return successResponse(site, "تم إنشاء الموقع بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const site = await sitesService.updateSite(body);
    return successResponse(site, "تم تعديل الموقع بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await sitesService.deleteSite(id || "");

    return successResponse(null, "تم حذف الموقع بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}