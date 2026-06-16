import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { requirePermission } from "@/lib/permissions";
import { sponsorshipsService } from "@/services/sponsorships.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const permission = await requirePermission("sponsorships.view");

    if (!permission.ok) {
      return permission.response!;
    }

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

    if (action === "sponsor-link") {
      const beneficiaryId = searchParams.get("beneficiaryId") || "";
      const sponsorId = searchParams.get("sponsorId") || "";
      const data = await sponsorshipsService.getSponsorLink(beneficiaryId, sponsorId);
      return successResponse(data, data ? "تم تحميل ارتباط المستفيد بالجهة" : "لا يوجد ارتباط سابق");
    }

    const data = await sponsorshipsService.list();
    return successResponse(data, "تم تحميل الكفالات بنجاح", 200, data.length);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const permission = await requirePermission("sponsorships.create");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await sponsorshipsService.create(body, {
      id: permission.user?.id,
      role: "user",
    });

    return successResponse(data, "تمت إضافة الكفالة بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const permission = await requirePermission("sponsorships.update");

    if (!permission.ok) {
      return permission.response!;
    }

    const body = await request.json();

    const data = await sponsorshipsService.update(body, {
      id: permission.user?.id,
      role: "user",
    });

    return successResponse(data, "تم تعديل الكفالة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const permission = await requirePermission("sponsorships.delete");

    if (!permission.ok) {
      return permission.response!;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    await sponsorshipsService.delete(id);

    return successResponse(null, "تم حذف الكفالة بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}
