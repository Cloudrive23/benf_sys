const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const connectionString =
  "postgresql://benf_user:benf_password_123@localhost:5432/benf_sys_local";

const modules = [
  ["beneficiaries", "المستفيدون", "Beneficiaries", "screen", "/beneficiaries", 10],
  ["fathers", "الآباء", "Fathers", "screen", "/fathers", 20],
  ["mothers", "الأمهات", "Mothers", "screen", "/mothers", 30],
  ["guardians", "المعيلون", "Guardians", "screen", "/guardians", 40],
  ["sponsors", "الجهات الداعمة", "Sponsors", "screen", "/sponsors", 50],
  ["sponsorships", "الكفالات", "Sponsorships", "screen", "/sponsorships", 60],
  ["users", "المستخدمون", "Users", "screen", "/users", 70],
  ["roles", "الأدوار", "Roles", "screen", "/roles", 80],
  ["user_permissions", "صلاحيات المستخدمين", "User Permissions", "screen", "/user-permissions", 90],
  ["org.branches", "الفروع / المحافظات", "Branches", "screen", "/org/branches", 110],
  ["org.sites", "المواقع", "Sites", "screen", "/org/sites", 120],
  ["org.centers", "المراكز", "Centers", "screen", "/org/centers", 130],
  ["audit_logs", "سجل التغييرات", "Audit Logs", "screen", "/audit-logs", 140],
  ["audit_settings", "إعدادات سجل التغييرات", "Audit Settings", "screen", "/audit-settings", 150],
  ["entity_definitions", "تعريفات الكيانات والحقول", "Entity Definitions", "screen", "/entity-definitions", 160],
  ["duplicate_rules", "قواعد التكرار", "Duplicate Rules", "screen", "/duplicate-rules", 170],
  ["lookups", "القوائم المرجعية", "Lookups", "screen", "/lookups", 180],
  ["theme", "الثيم", "Theme", "screen", "/theme", 190],
  ["database_constraint_messages", "رسائل قيود قاعدة البيانات", "Database Constraint Messages", "screen", "/database-constraint-messages", 200],
];

const permissions = [
  ["beneficiaries.view", "عرض المستفيدين", "View beneficiaries", "beneficiaries", "view"],
  ["beneficiaries.create", "إضافة مستفيد", "Create beneficiary", "beneficiaries", "create"],
  ["beneficiaries.update", "تعديل مستفيد", "Update beneficiary", "beneficiaries", "update"],
  ["beneficiaries.delete", "حذف مستفيد", "Delete beneficiary", "beneficiaries", "delete"],
  ["beneficiaries.family.manage", "إدارة بيانات أسرة المستفيد", "Manage beneficiary family", "beneficiaries", "manage"],
  ["beneficiaries.dynamic.update", "تعديل الحقول الديناميكية للمستفيد", "Update beneficiary dynamic fields", "beneficiaries", "update"],
  ["beneficiaries.sponsor_links.manage", "إدارة روابط كفالات المستفيد", "Manage beneficiary sponsor links", "beneficiaries", "manage"],

  ["fathers.view", "عرض الآباء", "View fathers", "fathers", "view"],
  ["fathers.create", "إضافة أب", "Create father", "fathers", "create"],
  ["fathers.update", "تعديل أب", "Update father", "fathers", "update"],
  ["fathers.delete", "حذف أب", "Delete father", "fathers", "delete"],

  ["mothers.view", "عرض الأمهات", "View mothers", "mothers", "view"],
  ["mothers.create", "إضافة أم", "Create mother", "mothers", "create"],
  ["mothers.update", "تعديل أم", "Update mother", "mothers", "update"],
  ["mothers.delete", "حذف أم", "Delete mother", "mothers", "delete"],

  ["guardians.view", "عرض المعيلين", "View guardians", "guardians", "view"],
  ["guardians.create", "إضافة معيل", "Create guardian", "guardians", "create"],
  ["guardians.update", "تعديل معيل", "Update guardian", "guardians", "update"],
  ["guardians.delete", "حذف معيل", "Delete guardian", "guardians", "delete"],

  ["sponsors.view", "عرض الجهات الداعمة", "View sponsors", "sponsors", "view"],
  ["sponsors.create", "إضافة جهة داعمة", "Create sponsor", "sponsors", "create"],
  ["sponsors.update", "تعديل جهة داعمة", "Update sponsor", "sponsors", "update"],
  ["sponsors.delete", "حذف جهة داعمة", "Delete sponsor", "sponsors", "delete"],

  ["sponsorships.view", "عرض الكفالات", "View sponsorships", "sponsorships", "view"],
  ["sponsorships.create", "إضافة كفالة", "Create sponsorship", "sponsorships", "create"],
  ["sponsorships.update", "تعديل كفالة", "Update sponsorship", "sponsorships", "update"],
  ["sponsorships.delete", "حذف كفالة", "Delete sponsorship", "sponsorships", "delete"],
  ["sponsorships.approve", "اعتماد كفالة", "Approve sponsorship", "sponsorships", "approve"],
  ["sponsorships.cancel", "إلغاء كفالة", "Cancel sponsorship", "sponsorships", "cancel"],

  ["users.view", "عرض المستخدمين", "View users", "users", "view"],
  ["users.create", "إضافة مستخدم", "Create user", "users", "create"],
  ["users.update", "تعديل مستخدم", "Update user", "users", "update"],
  ["users.delete", "حذف مستخدم", "Delete user", "users", "delete"],

  ["roles.view", "عرض الأدوار", "View roles", "roles", "view"],
  ["roles.create", "إضافة دور", "Create role", "roles", "create"],
  ["roles.update", "تعديل دور", "Update role", "roles", "update"],
  ["roles.delete", "حذف دور", "Delete role", "roles", "delete"],

  ["org.branches.view", "عرض الفروع / المحافظات", "View branches", "org.branches", "view"],
  ["org.branches.create", "إضافة فرع / محافظة", "Create branch", "org.branches", "create"],
  ["org.branches.update", "تعديل فرع / محافظة", "Update branch", "org.branches", "update"],
  ["org.branches.delete", "حذف فرع / محافظة", "Delete branch", "org.branches", "delete"],

  ["org.sites.view", "عرض المواقع", "View sites", "org.sites", "view"],
  ["org.sites.create", "إضافة موقع", "Create site", "org.sites", "create"],
  ["org.sites.update", "تعديل موقع", "Update site", "org.sites", "update"],
  ["org.sites.delete", "حذف موقع", "Delete site", "org.sites", "delete"],

  ["org.centers.view", "عرض المراكز", "View centers", "org.centers", "view"],
  ["org.centers.create", "إضافة مركز", "Create center", "org.centers", "create"],
  ["org.centers.update", "تعديل مركز", "Update center", "org.centers", "update"],
  ["org.centers.delete", "حذف مركز", "Delete center", "org.centers", "delete"],

  ["audit_logs.view", "عرض سجل التغييرات", "View audit logs", "audit_logs", "view"],
  ["audit_settings.manage", "إدارة إعدادات سجل التغييرات", "Manage audit settings", "audit_settings", "manage"],
  ["entity_definitions.manage", "إدارة تعريفات الكيانات والحقول", "Manage entity definitions", "entity_definitions", "manage"],
  ["duplicate_rules.manage", "إدارة قواعد التكرار", "Manage duplicate rules", "duplicate_rules", "manage"],
  ["lookups.manage", "إدارة القوائم المرجعية", "Manage lookups", "lookups", "manage"],
  ["theme.manage", "إدارة الثيم", "Manage theme", "theme", "manage"],
  ["database_constraint_messages.manage", "إدارة رسائل قيود قاعدة البيانات", "Manage database constraint messages", "database_constraint_messages", "manage"],
];

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Connected to local PostgreSQL.");

  await client.query(`
    alter table users
    add column if not exists is_super_admin boolean not null default false;
  `);

  await client.query("begin");

  try {
    for (const [code, ar, en, type, route, sort] of modules) {
      await client.query(
        `
        insert into system_modules (
          module_code,
          module_name_ar,
          module_name_en,
          module_type,
          route_path,
          sort_order,
          is_active,
          created_at,
          updated_at
        )
        values ($1, $2, $3, $4, $5, $6, true, now(), now())
        on conflict (module_code) do update
        set
          module_name_ar = excluded.module_name_ar,
          module_name_en = excluded.module_name_en,
          module_type = excluded.module_type,
          route_path = excluded.route_path,
          sort_order = excluded.sort_order,
          is_active = true,
          updated_at = now()
        `,
        [code, ar, en, type, route, sort]
      );
    }

    await client.query(
      `
      insert into roles (
        role_code,
        role_name_ar,
        role_name_en,
        description,
        is_active,
        created_at,
        updated_at
      )
      values (
        'system_admin',
        'مدير النظام',
        'System Admin',
        'الدور الإداري الأساسي للنظام المحلي',
        true,
        now(),
        now()
      )
      on conflict (role_code) do update
      set
        role_name_ar = excluded.role_name_ar,
        role_name_en = excluded.role_name_en,
        description = excluded.description,
        is_active = true,
        updated_at = now()
      `
    );

    for (const [code, ar, en, moduleCode, action] of permissions) {
  await client.query(
    `
    insert into permissions (
      permission_code,
      permission_name_ar,
      permission_name_en,
      module_id,
      action_code,
      description,
      is_active,
      created_at,
      updated_at
    )
    select
      $1::varchar,
      $2::varchar,
      $3::varchar,
      sm.id,
      $5::varchar,
      $6::text,
      true,
      now(),
      now()
    from system_modules sm
    where sm.module_code = $4::varchar
    on conflict (permission_code) do update
    set
      permission_name_ar = excluded.permission_name_ar,
      permission_name_en = excluded.permission_name_en,
      module_id = excluded.module_id,
      action_code = excluded.action_code,
      description = excluded.description,
      is_active = true,
      updated_at = now()
    `,
    [code, ar, en, moduleCode, action, ar]
  );
}
    await client.query(
      `
      insert into role_permissions (
        role_id,
        permission_id,
        created_at
      )
      select
        r.id,
        p.id,
        now()
      from roles r
      cross join permissions p
      where r.role_code = 'system_admin'
      on conflict (role_id, permission_id) do nothing
      `
    );

    const passwordHash = await bcrypt.hash("admin123", 10);

    await client.query(
      `
      insert into users (
        username,
        full_name,
        email,
        phone,
        password_hash,
        is_active,
        is_super_admin,
        created_at,
        updated_at
      )
      values (
        'admin',
        'مدير النظام',
        'admin@example.com',
        null,
        $1,
        true,
        true,
        now(),
        now()
      )
      on conflict (username) do update
      set
        full_name = excluded.full_name,
        email = excluded.email,
        password_hash = excluded.password_hash,
        is_active = true,
        is_super_admin = true,
        updated_at = now()
      `,
      [passwordHash]
    );

    await client.query(
      `
      insert into user_roles (
        user_id,
        role_id,
        created_at
      )
      select
        u.id,
        r.id,
        now()
      from users u
      join roles r on r.role_code = 'system_admin'
      where u.username = 'admin'
      on conflict (user_id, role_id) do nothing
      `
    );

    await client.query("commit");

    console.log("Local foundation seed completed successfully.");
    console.log("Local login:");
    console.log("username: admin");
    console.log("password: admin123");
  } catch (error) {
    await client.query("rollback");
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main();