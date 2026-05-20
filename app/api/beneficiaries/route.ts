import { successResponse }
from "@/lib/api-response";

import { handleApiError }
from "@/lib/handle-api-error";

import { beneficiariesService }
from "@/services/beneficiaries.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const beneficiaries =
      await beneficiariesService.listBeneficiaries();

    return successResponse(
      beneficiaries,
      "Beneficiaries loaded successfully",
      200,
      beneficiaries.length
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const beneficiary =
      await beneficiariesService.createBeneficiary(
        body
      );

    return successResponse(
      beneficiary,
      "Beneficiary created successfully",
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request
) {
  try {
    const body = await request.json();

    const beneficiary =
      await beneficiariesService.updateBeneficiary(
        body
      );

    return successResponse(
      beneficiary,
      "Beneficiary updated successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get("id");

    await beneficiariesService.deleteBeneficiary(
      id || ""
    );

    return successResponse(
      null,
      "Beneficiary deleted successfully"
    );
  } catch (error) {
    return handleApiError(error);
  }
}
