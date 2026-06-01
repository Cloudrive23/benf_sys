import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { fathersService } from "@/services/fathers/fathers.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fathersService.listFathers();

    return successResponse(data, "?? ????? ?????? ?????? ?????", 200, data.length);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const father = await fathersService.createFather(body);

    return successResponse(father, "??? ????? ???? ?????", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const father = await fathersService.updateFather(body);

    return successResponse(father, "?? ????? ?????? ???? ?????");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id") || "";

    await fathersService.deleteFather(id);

    return successResponse(null, "?? ??? ???? ?????");
  } catch (error) {
    return handleApiError(error);
  }
}