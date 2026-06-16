import { NextResponse } from "next/server";

import { prisma } from "@/app/lib/prisma";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/handle-api-error";
import { getCurrentUserRecord } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUserRecord();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "غير مصرح، يرجى تسجيل الدخول" },
        { status: 401 }
      );
    }

    const tabs = await prisma.beneficiary_field_tabs.findMany({
      where: {
        is_active: true,
      },

      include: {
        groups: {
          where: {
            is_active: true,
          },

          include: {
            fields: {
              where: {
                is_active: true,
              },

              orderBy: {
                sort_order: "asc",
              },
            },
          },

          orderBy: {
            sort_order: "asc",
          },
        },
      },

      orderBy: {
        sort_order: "asc",
      },
    });

    return successResponse(tabs);
  } catch (error) {
    return handleApiError(error);
  }
}
