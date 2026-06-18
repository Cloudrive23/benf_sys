-- =========================================================
-- Attachments Permissions
-- صلاحيات نظام المرفقات
-- SAFE SCRIPT
-- =========================================================

insert into permissions (
  permission_code,
  permission_name_ar,
  permission_name_en,
  module_id,
  action_code,
  is_active,
  created_at,
  updated_at
)
values
(
  'attachments.view',
  'عرض المرفقات',
  'View Attachments',
  (select id from system_modules where module_code = 'settings' limit 1),
  'view',
  true,
  now(),
  now()
),
(
  'attachments.upload',
  'رفع المرفقات',
  'Upload Attachments',
  (select id from system_modules where module_code = 'settings' limit 1),
  'upload',
  true,
  now(),
  now()
),
(
  'attachments.delete',
  'حذف المرفقات',
  'Delete Attachments',
  (select id from system_modules where module_code = 'settings' limit 1),
  'delete',
  true,
  now(),
  now()
),
(
  'attachments.manage',
  'إدارة إعدادات المرفقات',
  'Manage Attachments Settings',
  (select id from system_modules where module_code = 'settings' limit 1),
  'manage',
  true,
  now(),
  now()
)
on conflict (permission_code) do update
set
  permission_name_ar = excluded.permission_name_ar,
  permission_name_en = excluded.permission_name_en,
  module_id = excluded.module_id,
  action_code = excluded.action_code,
  is_active = true,
  updated_at = now();