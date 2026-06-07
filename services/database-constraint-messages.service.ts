import { AppError } from "@/lib/api-error";
import { databaseConstraintMessagesRepository } from "@/repositories/database-constraint-messages.repository";

import { prisma } from "@/app/lib/prisma";

const allowedConstraintTypes = ["unique"];

function cleanData(input: any) {
  return {
    table_name: String(input.table_name || "").trim(),
    field_name: String(input.field_name || "").trim(),
    constraint_type: input.constraint_type || "unique",
    message_ar: String(input.message_ar || "").trim(),
    is_active: input.is_active ?? true,
    updated_at: new Date(),
  };
}

export const databaseConstraintMessagesService = {
  async list() {
    return databaseConstraintMessagesRepository.findAll();
  },

  async create(input: any) {
    const data = cleanData(input);

    if (!data.table_name) {
      throw new AppError("اسم الجدول مطلوب", 400);
    }

    if (!data.field_name) {
      throw new AppError("اسم الحقل مطلوب", 400);
    }

    if (!allowedConstraintTypes.includes(data.constraint_type)) {
      throw new AppError("نوع القيد غير صحيح", 400);
    }

    if (!data.message_ar) {
      throw new AppError("الرسالة العربية مطلوبة", 400);
    }

    return databaseConstraintMessagesRepository.create({
      ...data,
      created_at: new Date(),
    });
  },

  async update(input: any) {
    if (!input.id) {
      throw new AppError("معرف الرسالة مطلوب", 400);
    }

    const oldRecord = await databaseConstraintMessagesRepository.findById(input.id);

    if (!oldRecord) {
      throw new AppError("رسالة القيد غير موجودة", 404);
    }

    const data = cleanData(input);

    if (!data.table_name) {
      throw new AppError("اسم الجدول مطلوب", 400);
    }

    if (!data.field_name) {
      throw new AppError("اسم الحقل مطلوب", 400);
    }

    if (!data.message_ar) {
      throw new AppError("الرسالة العربية مطلوبة", 400);
    }

    return databaseConstraintMessagesRepository.update(input.id, data);
  },

  async setActive(id: string, isActive: boolean) {
    if (!id) {
      throw new AppError("معرف الرسالة مطلوب", 400);
    }

    return databaseConstraintMessagesRepository.setActive(id, isActive);
  },

async discoverUniqueConstraints() {
  const rows = await prisma.$queryRaw<any[]>`
    select
      tc.table_name,
      kcu.column_name as field_name,
      tc.constraint_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name
      and tc.table_schema = kcu.table_schema
      and tc.table_name = kcu.table_name
    where tc.table_schema = 'public'
      and tc.constraint_type = 'UNIQUE'
    order by tc.table_name, tc.constraint_name, kcu.ordinal_position
  `;

  return rows.map((row) => ({
    table_name: row.table_name,
    field_name: row.field_name,
    constraint_name: row.constraint_name,
    constraint_type: "unique",
  }));
},

async importUniqueConstraints() {
  const constraints = await this.discoverUniqueConstraints();

  const results = [];

  for (const item of constraints) {
    const existing =
      await databaseConstraintMessagesRepository.findActiveMessage({
        tableName: item.table_name,
        fieldName: item.field_name,
        constraintType: "unique",
      });

    if (existing) {
      results.push({
        ...item,
        status: "exists",
      });

      continue;
    }

    const created = await databaseConstraintMessagesRepository.create({
      table_name: item.table_name,
      field_name: item.field_name,
      constraint_type: "unique",
      message_ar: `القيمة المدخلة في الحقل ${item.field_name} موجودة مسبقًا ولا يمكن تكرارها`,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    results.push({
      ...item,
      status: "created",
      id: created.id,
    });
  }

  return {
    total: constraints.length,
    created: results.filter((item) => item.status === "created").length,
    exists: results.filter((item) => item.status === "exists").length,
    items: results,
  };
},

};