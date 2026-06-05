import { prisma } from "@/app/lib/prisma";
import { duplicateRulesRepository } from "@/repositories/duplicate-rules.repository";

type DuplicateCheckInput = {
  entityKey: string;
  data: Record<string, any>;
  excludeId?: string;
};

type DuplicateMatch = {
  ruleId: string;
  ruleNameAr: string;
  actionMode: string;
  message: string;
  record: any;
};

function normalizeText(value: any) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function normalizePhone(value: any) {
  return String(value || "")
    .replace(/\D/g, "")
    .trim();
}

function normalizeIdentity(value: any) {
  return String(value || "")
    .replace(/\s+/g, "")
    .trim();
}

function normalizeDate(value: any) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString().slice(0, 10);
}

function normalizeValue(value: any, matchType: string) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (matchType === "normalized") return normalizeText(value);
  if (matchType === "phone") return normalizePhone(value);
  if (matchType === "identity") return normalizeIdentity(value);
  if (matchType === "date") return normalizeDate(value);

  return value;
}

function getScopeWhere(rule: any, data: Record<string, any>) {
  if (rule.scope_level === "system") return {};

  if (rule.scope_level === "branch") {
    return data.branch_id ? { branch_id: data.branch_id } : {};
  }

  if (rule.scope_level === "site") {
    return data.site_id ? { site_id: data.site_id } : {};
  }

  if (rule.scope_level === "center") {
    return data.center_id ? { center_id: data.center_id } : {};
  }

  if (rule.scope_level === "custom" && rule.scope_field) {
    const value = data[rule.scope_field];

    return value ? { [rule.scope_field]: value } : {};
  }

  return {};
}

function buildRecordDisplay(record: any, displayNameField?: string | null) {
  if (!record) return "";

  if (displayNameField && record[displayNameField]) {
    return record[displayNameField];
  }

  return (
    record.full_name_ar ||
    record.full_name ||
    record.name_ar ||
    record.title_ar ||
    record.id ||
    ""
  );
}

export const duplicateCheckService = {
  async check(input: DuplicateCheckInput) {
    const rules = await duplicateRulesRepository.findActiveRulesByEntityKey(
      input.entityKey
    );

    const matches: DuplicateMatch[] = [];

    for (const rule of rules) {
      const where: Record<string, any> = {
        ...getScopeWhere(rule, input.data),
      };

      if (input.excludeId) {
        where.id = {
          not: input.excludeId,
        };
      }

      let canCheckRule = true;

      for (const field of rule.fields) {
        const rawValue = input.data[field.field_name];
        const normalizedValue = normalizeValue(rawValue, field.match_type);

        if (!normalizedValue && field.is_required) {
          canCheckRule = false;
          break;
        }

        if (!normalizedValue && !field.is_required) {
          continue;
        }

        if (field.match_type === "date") {
          where[field.field_name] = new Date(normalizedValue);
        } else if (
          field.match_type === "normalized" ||
          field.match_type === "phone" ||
          field.match_type === "identity"
        ) {
          where[field.field_name] = rawValue;
        } else {
          where[field.field_name] = rawValue;
        }
      }

      if (!canCheckRule) continue;

      const tableName = rule.entity_name;

      if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
        continue;
      }

      const records = await (prisma as any)[tableName]?.findMany?.({
        where,
        take: 5,
      });

      if (!records || records.length === 0) {
        continue;
      }

      for (const record of records) {
        matches.push({
          ruleId: rule.id,
          ruleNameAr: rule.rule_name_ar,
          actionMode: rule.action_mode,
          message:
            rule.message_ar ||
            `يوجد سجل مشابه حسب قاعدة: ${rule.rule_name_ar}`,
          record: {
            id: record.id,
            displayName: buildRecordDisplay(
              record,
              rule.display_name_field
            ),
            data: record,
          },
        });
      }
    }

    const hasBlock = matches.some((item) => item.actionMode === "block");
    const hasWarn = matches.some((item) => item.actionMode === "warn");

    return {
      hasMatches: matches.length > 0,
      actionMode: hasBlock ? "block" : hasWarn ? "warn" : "none",
      canSave: !hasBlock,
      matches,
    };
  },
};