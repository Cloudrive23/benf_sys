type FieldLabels = Record<string, string>;

type BuildAuditDiffInput = {
  oldData: any;
  newData: any;
  fields: FieldLabels;
};

export type AuditFieldChange = {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
};

function normalizeDate(value: any) {
  if (!value) return null;

  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return value;
  }
}

function normalizeValue(value: any) {
  if (value === undefined || value === "") return null;

  if (value instanceof Date) {
    return normalizeDate(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }

  return value;
}

function valuesAreEqual(oldValue: any, newValue: any) {
  const oldNormalized = normalizeValue(oldValue);
  const newNormalized = normalizeValue(newValue);

  if (oldNormalized === null && newNormalized === null) return true;

  return oldNormalized === newNormalized;
}

export function buildAuditDiff(input: BuildAuditDiffInput) {
  const changes: AuditFieldChange[] = [];

  for (const field of Object.keys(input.fields)) {
    const oldValue = input.oldData?.[field];
    const newValue = input.newData?.[field];

    if (!valuesAreEqual(oldValue, newValue)) {
      changes.push({
        field,
        label: input.fields[field],
        oldValue: normalizeValue(oldValue),
        newValue: normalizeValue(newValue),
      });
    }
  }

  return {
    hasChanges: changes.length > 0,
    changes,
    changedFields: changes.map((item) => item.field),
    changedLabels: changes.map((item) => item.label),
    changedText: changes.map((item) => item.label).join("، "),
  };
}