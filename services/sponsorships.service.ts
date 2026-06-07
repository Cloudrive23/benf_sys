import { AppError } from "@/lib/api-error";
import { sponsorshipsRepository } from "@/repositories/sponsorships.repository";

type Actor = {
  id?: string;
  role?: string;
};

const DEFAULT_CURRENCY = "YER";

function cleanText(value: any) {
  const text = String(value || "").trim();
  return text || null;
}

function cleanOptionalText(value: any) {
  if (value === undefined) return undefined;
  return cleanText(value);
}

function cleanRequiredText(value: any, message: string) {
  const text = cleanText(value);
  if (!text) throw new AppError(message, 400);
  return text;
}

function cleanDate(value: any) {
  const text = cleanText(value);
  if (!text) return null;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new AppError("صيغة التاريخ غير صحيحة", 400);
  }

  return date;
}

function cleanOptionalDate(value: any) {
  if (value === undefined || value === null || value === "") return null;
  return cleanDate(value);
}

function cleanAmount(value: any) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new AppError("المبلغ غير صحيح", 400);
  }

  if (numberValue < 0) {
    throw new AppError("المبلغ لا يمكن أن يكون أقل من صفر", 400);
  }

  return numberValue;
}

function normalizeCode(value: any) {
  return String(value || "").trim().toLowerCase();
}

function normalizeCurrency(value: any) {
  return String(value || "").trim().toUpperCase();
}

function normalizeStatus(value: any) {
  return normalizeCode(value) || "active";
}

function nextNumber(values: (string | null)[], prefix = "SPON-") {
  const max = values
    .map((value) => String(value || "").replace(prefix, ""))
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .reduce((a, b) => Math.max(a, b), 0);

  return `${prefix}${String(max + 1).padStart(5, "0")}`;
}

async function getNextSponsorshipCode() {
  const rows = await sponsorshipsRepository.findCodes();
  return nextNumber(rows.map((row: any) => row.sponsorship_code));
}

async function validateBeneficiary(beneficiaryId: string) {
  const beneficiary = await sponsorshipsRepository.findBeneficiaryById(beneficiaryId);

  if (!beneficiary) {
    throw new AppError("المستفيد غير موجود", 404);
  }

  if (beneficiary.is_active === false) {
    throw new AppError("لا يمكن إنشاء كفالة لمستفيد غير نشط", 400);
  }

  return beneficiary;
}

async function validateChildSponsor(sponsorId: string) {
  const sponsor = await sponsorshipsRepository.findSponsorById(sponsorId);

  if (!sponsor) {
    throw new AppError("الجهة الكافلة غير موجودة", 404);
  }

  if (sponsor.is_active === false) {
    throw new AppError("لا يمكن ربط الكفالة بجهة غير نشطة", 400);
  }

  if (!sponsor.parent_sponsor_id) {
    throw new AppError("يجب اختيار جهة فرعية، ولا يمكن ربط الكفالة بجهة رئيسية مباشرة", 400);
  }

  return sponsor;
}

async function validateLookup(lookupType: string, code: string, message: string) {
  const item = await sponsorshipsRepository.findActiveLookupByCode(lookupType, code);
  if (!item) throw new AppError(message, 400);
  return item;
}

function buildLinkData(data: any) {
  return {
    sponsor_beneficiary_code: cleanOptionalText(data.sponsor_beneficiary_code),
    sponsor_file_number: cleanOptionalText(data.sponsor_file_number),
    sponsor_reference: cleanOptionalText(data.sponsor_reference),
    registration_date: cleanOptionalDate(data.sponsor_link_registration_date),
    status: cleanOptionalText(data.sponsor_link_status) || "active",
    notes: cleanOptionalText(data.sponsor_link_notes),
  };
}

function buildBaseData(data: any, actor?: Actor) {
  const startDate = cleanDate(data.start_date);
  const endDate = cleanDate(data.end_date);
  const amount = cleanAmount(data.amount);
  const currency = normalizeCurrency(data.currency) || DEFAULT_CURRENCY;
  const sponsorshipType = normalizeCode(data.sponsorship_type);
  const status = normalizeStatus(data.status);

  if (startDate && endDate && endDate < startDate) {
    throw new AppError("تاريخ النهاية لا يمكن أن يكون قبل تاريخ البداية", 400);
  }

  if (amount !== null && !currency) {
    throw new AppError("عملة الكفالة مطلوبة عند إدخال مبلغ", 400);
  }

  return {
    beneficiary_id: cleanRequiredText(data.beneficiary_id, "المستفيد مطلوب"),
    sponsor_id: cleanRequiredText(data.sponsor_id, "الجهة الفرعية مطلوبة"),
    sponsorship_type: cleanRequiredText(sponsorshipType, "نوع الكفالة مطلوب"),
    amount,
    currency,
    start_date: startDate,
    end_date: endDate,
    status,
    notes: cleanText(data.notes),
    updated_by: actor?.id || null,
    updated_at: new Date(),
  };
}

async function validateBaseReferences(base: any) {
  await validateBeneficiary(base.beneficiary_id);
  await validateChildSponsor(base.sponsor_id);
  await validateLookup("sponsorship_types", base.sponsorship_type, "نوع الكفالة غير موجود أو غير مفعل");
  await validateLookup("sponsorship_statuses", base.status, "حالة الكفالة غير موجودة أو غير مفعلة");
  await validateLookup("currencies", base.currency, "عملة الكفالة غير موجودة أو غير مفعلة");
}

export const sponsorshipsService = {
  async list() {
    return sponsorshipsRepository.findAll();
  },

  async searchBeneficiaries(query: string) {
    return sponsorshipsRepository.searchBeneficiaries(query, 25);
  },

  async searchParentSponsors(query: string) {
    return sponsorshipsRepository.searchParentSponsors(query, 100);
  },

  async searchChildSponsors(parentId: string, query: string) {
    const cleanParentId = cleanRequiredText(parentId, "الجهة الرئيسية مطلوبة");
    return sponsorshipsRepository.searchChildSponsors(cleanParentId, query, 100);
  },

  async getSponsorLink(beneficiaryId: string, sponsorId: string) {
    const cleanBeneficiaryId = cleanRequiredText(beneficiaryId, "المستفيد مطلوب");
    const cleanSponsorId = cleanRequiredText(sponsorId, "الجهة الفرعية مطلوبة");

    await validateBeneficiary(cleanBeneficiaryId);
    await validateChildSponsor(cleanSponsorId);

    return sponsorshipsRepository.findSponsorLink(cleanBeneficiaryId, cleanSponsorId);
  },

  async create(data: any, actor?: Actor) {
    const base = buildBaseData(data, actor);
    const linkData = buildLinkData(data);
    await validateBaseReferences(base);

    const sponsorship_code = cleanText(data.sponsorship_code) || (await getNextSponsorshipCode());
    const existing = await sponsorshipsRepository.findByCode(sponsorship_code);

    if (existing) {
      throw new AppError("رقم الكفالة موجود مسبقًا", 409);
    }

    return sponsorshipsRepository.create(
      {
        sponsorship_code,
        ...base,
        created_by: actor?.id || null,
      },
      linkData,
      {
        from_status: null,
        to_status: base.status,
        action_type: "create",
        action_notes: "إنشاء كفالة",
        action_by: actor?.id || null,
      },
    );
  },

  async update(data: any, actor?: Actor) {
    const id = cleanRequiredText(data.id, "معرف الكفالة مطلوب");
    const existing = await sponsorshipsRepository.findById(id);

    if (!existing) {
      throw new AppError("الكفالة غير موجودة", 404);
    }

    const base = buildBaseData(data, actor);
    const linkData = buildLinkData(data);
    await validateBaseReferences(base);

    const oldStatus = (existing as any).status || null;
    const statusChanged = oldStatus !== base.status;

    return sponsorshipsRepository.update(
      id,
      base,
      linkData,
      statusChanged
        ? {
            from_status: oldStatus,
            to_status: base.status,
            action_type: "status_change",
            action_notes: cleanText(data.status_change_notes) || "تغيير حالة الكفالة",
            action_by: actor?.id || null,
          }
        : undefined,
    );
  },

  async delete(id: string) {
    const cleanId = cleanRequiredText(id, "معرف الكفالة مطلوب");
    const existing = await sponsorshipsRepository.findById(cleanId);

    if (!existing) {
      throw new AppError("الكفالة غير موجودة", 404);
    }

    return sponsorshipsRepository.delete(cleanId);
  },
};
