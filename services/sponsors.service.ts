import { AppError } from "@/lib/api-error";
import { sponsorsRepository } from "@/repositories/sponsors.repository";

type Actor = {
  id?: string;
  role?: string;
};

function cleanText(value: any) {
  const text = String(value || "").trim();
  return text || null;
}

function cleanEmail(value: any) {
  const text = cleanText(value);
  if (!text) return null;

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  if (!valid) {
    throw new AppError("صيغة البريد الإلكتروني غير صحيحة", 400);
  }

  return text;
}

function normalizeSponsorType(value: any) {
  const text = cleanText(value);
  if (!text) return "other";
  return text;
}

function nextNumber(values: (string | null)[], prefix = "SP-") {
  const max = values
    .map((value) => String(value || "").replace(prefix, ""))
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))
    .reduce((a, b) => Math.max(a, b), 0);

  return `${prefix}${String(max + 1).padStart(5, "0")}`;
}

async function getNextSponsorCode(extraCodes: string[] = []) {
  const rows = await sponsorsRepository.findAll();
  return nextNumber([
    ...rows.map((row: any) => row.sponsor_code),
    ...extraCodes,
  ]);
}

function baseSponsorData(data: any, actor?: Actor) {
  return {
    sponsor_name: cleanText(data.sponsor_name),
    sponsor_type: normalizeSponsorType(data.sponsor_type),
    parent_sponsor_id: cleanText(data.parent_sponsor_id),
    phone: cleanText(data.phone),
    email: cleanEmail(data.email),
    address: cleanText(data.address),
    contact_person: cleanText(data.contact_person),
    notes: cleanText(data.notes),
    is_active: data.is_active ?? true,
    updated_by: actor?.id || null,
    updated_at: new Date(),
  };
}

async function preventCircularParent(id: string, parentId: string | null) {
  if (!parentId) return;

  if (id === parentId) {
    throw new AppError("لا يمكن جعل الجهة تابعة لنفسها", 400);
  }

  let currentParentId: string | null = parentId;
  const visited = new Set<string>();

  while (currentParentId) {
    if (visited.has(currentParentId)) break;
    visited.add(currentParentId);

    if (currentParentId === id) {
      throw new AppError("لا يمكن إنشاء علاقة دائرية بين الجهات", 400);
    }

    const parent = await sponsorsRepository.findById(currentParentId);
    currentParentId = (parent as any)?.parent_sponsor_id || null;
  }
}

async function collectDescendantIds(rootId: string) {
  const result: string[] = [];
  let frontier = [rootId];
  const visited = new Set<string>([rootId]);

  while (frontier.length > 0) {
    const children = await sponsorsRepository.findChildrenByParentIds(frontier);
    const nextFrontier: string[] = [];

    for (const child of children as any[]) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        result.push(child.id);
        nextFrontier.push(child.id);
      }
    }

    frontier = nextFrontier;
  }

  return result;
}

function shouldCreateDefaultChild(data: any, base: any) {
  if (base.parent_sponsor_id) return false;

  // الافتراضي: عند إضافة جهة رئيسية يتم إنشاء جهة فرعية بنفس الاسم.
  // يمكن تعطيله فقط إذا أرسل العميل create_default_child = false صراحةً.
  return data.create_default_child !== false;
}

export const sponsorsService = {
  async list() {
    return sponsorsRepository.findAll();
  },

  async listActive() {
    return sponsorsRepository.findActive();
  },

  async create(data: any, actor?: Actor) {
    const base = baseSponsorData(data, actor);

    if (!base.sponsor_name) {
      throw new AppError("اسم الجهة مطلوب", 400);
    }

    const sponsor_code = cleanText(data.sponsor_code) || (await getNextSponsorCode());
    const existing = await sponsorsRepository.findByCode(sponsor_code);

    if (existing) {
      throw new AppError("رقم الجهة موجود مسبقًا", 409);
    }

    if (base.parent_sponsor_id) {
      const parent = await sponsorsRepository.findById(base.parent_sponsor_id);
      if (!parent) {
        throw new AppError("الجهة الرئيسية غير موجودة", 404);
      }
    }

    const parentData = {
      sponsor_code,
      ...base,
      created_by: actor?.id || null,
    };

    if (!shouldCreateDefaultChild(data, base)) {
      return sponsorsRepository.create(parentData);
    }

    const childCode = await getNextSponsorCode([sponsor_code]);
    const childData = {
      sponsor_code: childCode,
      sponsor_name: base.sponsor_name,
      sponsor_type: base.sponsor_type,
      phone: base.phone,
      email: base.email,
      address: base.address,
      contact_person: base.contact_person,
      notes: base.notes,
      is_active: base.is_active,
      created_by: actor?.id || null,
      updated_by: actor?.id || null,
      updated_at: new Date(),
    };

    return sponsorsRepository.createParentWithDefaultChild(parentData, childData);
  },

  async update(data: any, actor?: Actor) {
    const id = cleanText(data.id);
    if (!id) {
      throw new AppError("معرف الجهة مطلوب", 400);
    }

    const existing = await sponsorsRepository.findById(id);
    if (!existing) {
      throw new AppError("الجهة غير موجودة", 404);
    }

    const base = baseSponsorData(data, actor);

    if (!base.sponsor_name) {
      throw new AppError("اسم الجهة مطلوب", 400);
    }

    await preventCircularParent(id, base.parent_sponsor_id);

    if (base.parent_sponsor_id) {
      const parent = await sponsorsRepository.findById(base.parent_sponsor_id);
      if (!parent) {
        throw new AppError("الجهة الرئيسية غير موجودة", 404);
      }
    }

    const updated = await sponsorsRepository.update(id, base);

    if (base.is_active === false) {
      const descendantIds = await collectDescendantIds(id);
      await sponsorsRepository.deactivateMany(descendantIds, actor?.id || null);
    }

    return updated;
  },

  async delete(id: string) {
    const cleanId = cleanText(id);
    if (!cleanId) {
      throw new AppError("معرف الجهة مطلوب", 400);
    }

    const existing = await sponsorsRepository.findById(cleanId);
    if (!existing) {
      throw new AppError("الجهة غير موجودة", 404);
    }

    const children = await sponsorsRepository.findChildren(cleanId);
    if (children.length > 0) {
      throw new AppError("لا يمكن حذف جهة لديها جهات فرعية", 400);
    }

    const sponsorships = await sponsorsRepository.findLinkedSponsorships(cleanId);
    if (sponsorships.length > 0) {
      throw new AppError("لا يمكن حذف جهة مرتبطة بكفالات", 400);
    }

    return sponsorsRepository.delete(cleanId);
  },
};
