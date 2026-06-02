import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";

import { lookupsService } from "@/services/lookups/lookups.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type") || "";

    const data = await lookupsService.list(type);

    return successResponse(
      data,
      "تم تحميل البيانات بنجاح",
      200,
      data.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

	const last = await prisma.lookups.findMany({
		  where: {
			lookup_type: body.lookup_type,
		  },
		  select: {
			code: true,
		  },
		});

		const nextCode =
		  Math.max(
			0,
			...last
			  .map((x) => Number(x.code))
			  .filter((n) => Number.isFinite(n))
		  ) + 1;

		body.code = String(nextCode);

    const item = await lookupsService.create(body);

    return successResponse(item, "تمت الإضافة بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const item = await lookupsService.update(body);

    return successResponse(item, "تم التعديل بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id") || "";

    await lookupsService.delete(id);

    return successResponse(null, "تم الحذف بنجاح");
  } catch (error) {
    return handleApiError(error);
  }
}