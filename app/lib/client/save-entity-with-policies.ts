import { toast } from "sonner";

type SaveEntityWithPoliciesInput = {
  url: string;
  method: "POST" | "PUT" | "DELETE";
  data?: Record<string, any>;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (responseData: any) => void | Promise<void>;
};

function getErrorDetails(data: any) {
  return data?.details || data?.error || data?.data || data?.errors || null;
}

function buildDuplicateConfirmMessage(data: any, details: any) {
  const matches = details?.matches || [];

  const matchText =
    matches.length > 0
      ? matches
          .map((item: any, index: number) => {
            const name = item?.record?.displayName || "سجل مشابه";
            const rule = item?.ruleNameAr || "قاعدة تشابه";
            return `${index + 1}. ${name} - ${rule}`;
          })
          .join("\n")
      : "";

  return `${
    data.message || "يوجد سجل مشابه، يرجى التأكد قبل الحفظ."
  }\n\n${matchText}\n\nهل تريد المتابعة والحفظ؟`;
}

function isDuplicateWarning(details: any) {
  return (
    details?.requiresConfirmation === true ||
    details?.actionMode === "warn" ||
    details?.canSave === true
  );
}

export async function saveEntityWithPolicies({
  url,
  method,
  data,
  successMessage = "تم الحفظ بنجاح",
  errorMessage = "تعذر حفظ البيانات",
  onSuccess,
}: SaveEntityWithPoliciesInput) {
  async function submit(allowDuplicateWarning = false) {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body:
        method === "DELETE"
          ? undefined
          : JSON.stringify({
              ...(data || {}),
              allowDuplicateWarning,
            }),
    });

    const responseData = await res.json();

    if (responseData.success) {
      toast.success(responseData.message || successMessage);

      if (onSuccess) {
        await onSuccess(responseData);
      }

      return {
        success: true,
        data: responseData,
      };
    }

    const details = getErrorDetails(responseData);

    if (isDuplicateWarning(details) && !allowDuplicateWarning) {
      const confirmed = window.confirm(
        buildDuplicateConfirmMessage(responseData, details)
      );

      if (confirmed) {
        return submit(true);
      }

      return {
        success: false,
        cancelled: true,
        data: responseData,
      };
    }

    toast.error(responseData.message || errorMessage);

    return {
      success: false,
      data: responseData,
    };
  }

  return submit(false);
}