import { errorResponse } from "@/lib/api-response";
import { AppError } from "@/lib/api-error";
import { databaseConstraintMessagesRepository } from "@/repositories/database-constraint-messages.repository";

function isPrismaUniqueError(error: any) {
  return error?.code === "P2002";
}

function getModelName(error: any) {
  return String(error?.meta?.modelName || "").trim();
}

function normalizeModelToTableName(modelName: string) {
  return modelName;
}

function getUniqueFields(error: any): string[] {
  const target = error?.meta?.target;

  if (Array.isArray(target)) {
    return target.map((item) => String(item));
  }

  if (typeof target === "string") {
    return [target];
  }

  const message = String(error?.message || "");
  const causeMessage = String(error?.meta?.driverAdapterError?.message || "");

  const combined = `${message} ${causeMessage}`;

  const knownFields = [
    "identity_number",
    "email",
    "phone",
    "username",
    "father_code",
    "mother_code",
    "beneficiary_code",
  ];

  return knownFields.filter((field) => combined.includes(field));
}

async function getUniqueErrorMessage(error: any) {
  const modelName = getModelName(error);
  const tableName = normalizeModelToTableName(modelName);
  const fields = getUniqueFields(error);

  for (const fieldName of fields) {
    if (!tableName || !fieldName) continue;

    const customMessage =
      await databaseConstraintMessagesRepository.findActiveMessage({
        tableName,
        fieldName,
        constraintType: "unique",
      });

    if (customMessage?.message_ar) {
      return customMessage.message_ar;
    }
  }

  if (fields.includes("identity_number")) {
    return "رقم الهوية موجود مسبقًا ولا يمكن تكراره";
  }

  if (fields.includes("email")) {
    return "البريد الإلكتروني موجود مسبقًا ولا يمكن تكراره";
  }

  if (fields.includes("phone")) {
    return "رقم الهاتف موجود مسبقًا ولا يمكن تكراره";
  }

  if (fields.includes("username")) {
    return "اسم المستخدم موجود مسبقًا ولا يمكن تكراره";
  }

  return "توجد قيمة مكررة في حقل لا يسمح بالتكرار";
}

function getPrismaErrorDetails(error: any) {
  return {
    code: error?.code,
    modelName: error?.meta?.modelName,
    target: error?.meta?.target,
  };
}

export async function handleApiError(error: unknown) {
  console.error(error);

  if (error instanceof AppError) {
    return errorResponse(error.message, error.statusCode, error.errors);
  }

  const anyError = error as any;

  if (isPrismaUniqueError(anyError)) {
    return errorResponse(
      await getUniqueErrorMessage(anyError),
      409,
      getPrismaErrorDetails(anyError)
    );
  }

  return errorResponse("حدث خطأ غير متوقع في الخادم", 500);
}