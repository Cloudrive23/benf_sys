import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getCurrentUser } from "@/lib/auth";
import { sponsorshipsService } from "@/services/sponsorships.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "";
    const q = searchParams.get("q") || "";

    if (action === "beneficiary-search") {
      const data = await sponsorshipsService.searchBeneficiaries(q);
      return successResponse(data, "تم تحميل نتائج البحث عن المستفيدين", 200, data.length);
    }

    if (action === "parent-sponsors") {
      const data = await sponsorshipsService.searchParentSponsors(q);
      return successResponse(data, "تم تحميل الجهات الرئيسية", 200, data.length);
    }

    if (action === "child-sponsors") {
      const parentId = searchParams.get("parentId") || "";
      const data = await sponsorshipsService.searchChildSponsors(parentId, q);
      return successResponse(data, "تم تحميل الجهات الفرعية", 200, data.length);
    }

    const data = await sponsorshipsService.list();
    return successResponse(data, "تم تحميل الكفالات بنجاح", 200, data.length);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await getCurrentUser();

    const data = await sponsorshipsService.create(body, {
      id: user?.id,
      role: user?.role,
    });

    return successResponse(data, "تمت إضافة الكفالة بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const user = await getCurrentUser();

    const data = await sponsorshipsService.update(body, {
      id: user?.id,
      role: user?.role,
    });

    return successResponse(data, "تم تعديل الكفالة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await sponsorshipsService.delete(id);

    return successResponse(null, "تم حذف الكفالة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
