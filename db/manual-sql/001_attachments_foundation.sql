-- =========================================================
-- Attachments Foundation
-- أساس نظام المرفقات العام
-- SAFE SCRIPT:
-- - No DROP
-- - No destructive ALTER
-- - Only CREATE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
-- =========================================================

-- ---------------------------------------------------------
-- 1) Attachment Sections
-- أقسام المرفقات الكبرى مثل pic_const و pic_rep
-- ---------------------------------------------------------
create table if not exists public.attachment_sections (
  id uuid primary key default gen_random_uuid(),

  section_code varchar(100) not null unique,
  section_name_ar varchar(255) not null,
  section_name_en varchar(255),

  -- مثال: beneficiary, periodic_report, any
  entity_type varchar(100),

  -- اسم المجلد الفعلي مثل pic_const أو pic_rep
  storage_folder varchar(255) not null,

  -- قالب المسار الديناميكي
  path_template text not null,

  -- إعدادات افتراضية على مستوى القسم
  default_allowed_extensions text,
  default_allowed_mime_types text,
  default_max_file_size_mb integer,
  default_min_width integer,
  default_max_width integer,
  default_min_height integer,
  default_max_height integer,

  allow_multiple boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,

  notes text,
  created_at timestamp(6) without time zone default now(),
  updated_at timestamp(6) without time zone default now()
);

comment on table public.attachment_sections is 'أقسام المرفقات العامة مثل pic_const و pic_rep';
comment on column public.attachment_sections.section_code is 'كود القسم البرمجي مثل beneficiary_static أو sponsored_reports';
comment on column public.attachment_sections.storage_folder is 'اسم مجلد التخزين الفعلي مثل pic_const أو pic_rep';
comment on column public.attachment_sections.path_template is 'قالب المسار الديناميكي للمرفقات';


-- ---------------------------------------------------------
-- 2) Attachment Settings
-- إعدادات عامة للمرفقات
-- ---------------------------------------------------------
create table if not exists public.attachment_settings (
  id uuid primary key default gen_random_uuid(),

  setting_key varchar(150) not null unique,
  setting_value text,
  setting_type varchar(50) not null default 'string',

  -- global / section / entity / type
  scope_type varchar(50) not null default 'global',
  scope_code varchar(150),

  description text,
  is_locked boolean not null default false,
  is_active boolean not null default true,

  created_at timestamp(6) without time zone default now(),
  updated_at timestamp(6) without time zone default now()
);

comment on table public.attachment_settings is 'الإعدادات العامة والديناميكية لنظام المرفقات';


-- ---------------------------------------------------------
-- 3) Extend existing attachment_types safely
-- توسيع جدول أنواع المرفقات الحالي بدون حذف أو تغيير جذري
-- ---------------------------------------------------------
alter table public.attachment_types
  add column if not exists entity_type varchar(100),
  add column if not exists section_id uuid,
  add column if not exists path_segment varchar(255),
  add column if not exists allowed_mime_types text,
  add column if not exists min_width integer,
  add column if not exists max_width integer,
  add column if not exists min_height integer,
  add column if not exists max_height integer,
  add column if not exists is_image_required boolean not null default false,
  add column if not exists allow_multiple boolean not null default false,
  add column if not exists naming_strategy varchar(100) not null default 'file_number',
  add column if not exists path_template text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'attachment_types_section_id_fkey'
  ) then
    alter table public.attachment_types
      add constraint attachment_types_section_id_fkey
      foreign key (section_id)
      references public.attachment_sections(id)
      on delete set null;
  end if;
end $$;

comment on column public.attachment_types.entity_type is 'نوع الكيان المرتبط بهذا النوع مثل beneficiary أو periodic_report أو any';
comment on column public.attachment_types.section_id is 'القسم الذي يتبعه نوع المرفق';
comment on column public.attachment_types.path_segment is 'اسم مجلد نوع المرفق داخل المسار';
comment on column public.attachment_types.naming_strategy is 'طريقة تسمية الملف مثل file_number أو file_number_sequence أو timestamp';


-- ---------------------------------------------------------
-- 4) General Entity Attachments
-- جدول عام لكل مرفقات الكيانات
-- ---------------------------------------------------------
create table if not exists public.entity_attachments (
  id uuid primary key default gen_random_uuid(),

  -- الربط العام لأي كيان
  entity_type varchar(100) not null,
  entity_id uuid not null,

  section_id uuid,
  attachment_type_id uuid not null,

  -- ربط اختياري مباشر لتسهيل البحث والتقارير
  beneficiary_id uuid,
  periodic_report_id uuid,
  sponsorship_id uuid,

  branch_id uuid,
  site_id uuid,
  center_id uuid,

  file_number varchar(50),

  -- خاص بالتقارير
  report_year integer,
  report_type varchar(50),

  -- بيانات الملف
  original_file_name varchar(500),
  stored_file_name varchar(500) not null,
  file_extension varchar(20) not null,
  mime_type varchar(150),
  file_size bigint,

  -- التخزين والمسارات
  storage_driver varchar(50) not null default 'local',
  file_path text not null,
  relative_path text,
  public_url text,

  -- الإصدارات والحالة
  version_no integer not null default 1,
  is_current boolean not null default true,
  status varchar(50) not null default 'active',
  is_active boolean not null default true,

  uploaded_by uuid,
  uploaded_at timestamp(6) without time zone default now(),

  notes text,
  created_at timestamp(6) without time zone default now(),
  updated_at timestamp(6) without time zone default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'entity_attachments_section_id_fkey'
  ) then
    alter table public.entity_attachments
      add constraint entity_attachments_section_id_fkey
      foreign key (section_id)
      references public.attachment_sections(id)
      on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'entity_attachments_attachment_type_id_fkey'
  ) then
    alter table public.entity_attachments
      add constraint entity_attachments_attachment_type_id_fkey
      foreign key (attachment_type_id)
      references public.attachment_types(id)
      on delete restrict;
  end if;
end $$;

comment on table public.entity_attachments is 'جدول عام لمرفقات أي كيان داخل النظام';
comment on column public.entity_attachments.entity_type is 'نوع الكيان مثل beneficiary, father, mother, guardian, sponsor, sponsorship, periodic_report';
comment on column public.entity_attachments.entity_id is 'معرف الكيان المرتبط بالمرفق';
comment on column public.entity_attachments.file_path is 'المسار الكامل أو المعتمد للملف';
comment on column public.entity_attachments.relative_path is 'المسار النسبي من جذر المرفقات';


-- ---------------------------------------------------------
-- 5) Indexes
-- ---------------------------------------------------------
create index if not exists idx_attachment_sections_code
  on public.attachment_sections(section_code);

create index if not exists idx_attachment_sections_entity_type
  on public.attachment_sections(entity_type);

create index if not exists idx_attachment_settings_key
  on public.attachment_settings(setting_key);

create index if not exists idx_attachment_types_entity_type
  on public.attachment_types(entity_type);

create index if not exists idx_attachment_types_section_id
  on public.attachment_types(section_id);

create index if not exists idx_attachment_types_sort_order
  on public.attachment_types(sort_order);

create index if not exists idx_entity_attachments_entity
  on public.entity_attachments(entity_type, entity_id);

create index if not exists idx_entity_attachments_type
  on public.entity_attachments(attachment_type_id);

create index if not exists idx_entity_attachments_section
  on public.entity_attachments(section_id);

create index if not exists idx_entity_attachments_beneficiary
  on public.entity_attachments(beneficiary_id);

create index if not exists idx_entity_attachments_file_number
  on public.entity_attachments(file_number);

create index if not exists idx_entity_attachments_report
  on public.entity_attachments(report_year, report_type);

create index if not exists idx_entity_attachments_current
  on public.entity_attachments(is_current, is_active);

create index if not exists idx_entity_attachments_uploaded_at
  on public.entity_attachments(uploaded_at);


-- ---------------------------------------------------------
-- 6) Seed default sections
-- الأقسام الأساسية
-- ---------------------------------------------------------
insert into public.attachment_sections (
  section_code,
  section_name_ar,
  section_name_en,
  entity_type,
  storage_folder,
  path_template,
  default_allowed_extensions,
  default_allowed_mime_types,
  default_max_file_size_mb,
  allow_multiple,
  sort_order,
  is_active,
  notes
)
values
(
  'beneficiary_static',
  'استمارات ومرفقات المستفيد الثابتة',
  'Beneficiary Static Attachments',
  'beneficiary',
  'pic_const',
  '{root}/pic_const/{branch_code}/{site_code}/{attachment_type}/{file_number}.{ext}',
  'jpg,jpeg,png,pdf',
  'image/jpeg,image/png,application/pdf',
  5,
  false,
  10,
  true,
  'يمثل المرفقات الثابتة للمستفيد مثل الصورة، شهادة الميلاد، شهادة الوفاة، الاستمارات'
),
(
  'sponsored_reports',
  'مرفقات تقارير المكفولين',
  'Sponsored Reports Attachments',
  'periodic_report',
  'pic_rep',
  '{root}/pic_rep/{year}/{report_type}/{branch_code}/{site_code}/{attachment_type}/{file_number}.{ext}',
  'jpg,jpeg,png,pdf,doc,docx',
  'image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  10,
  true,
  20,
  true,
  'يمثل مرفقات تقارير المكفولين حسب السنة ونوع التقرير والفرع والموقع ونوع الوثيقة'
)
on conflict (section_code) do update
set
  section_name_ar = excluded.section_name_ar,
  section_name_en = excluded.section_name_en,
  entity_type = excluded.entity_type,
  storage_folder = excluded.storage_folder,
  path_template = excluded.path_template,
  default_allowed_extensions = excluded.default_allowed_extensions,
  default_allowed_mime_types = excluded.default_allowed_mime_types,
  default_max_file_size_mb = excluded.default_max_file_size_mb,
  allow_multiple = excluded.allow_multiple,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  notes = excluded.notes,
  updated_at = now();


-- ---------------------------------------------------------
-- 7) Seed default settings
-- الإعدادات العامة
-- ---------------------------------------------------------
insert into public.attachment_settings (
  setting_key,
  setting_value,
  setting_type,
  scope_type,
  description,
  is_locked,
  is_active
)
values
(
  'attachments_root_path',
  'uploads',
  'string',
  'global',
  'المسار الجذري الافتراضي للمرفقات. يمكن تغييره لاحقًا من الإعدادات.',
  false,
  true
),
(
  'storage_driver',
  'local',
  'string',
  'global',
  'نوع التخزين الحالي: local. يمكن لاحقًا دعم s3 أو supabase_storage أو azure_blob.',
  true,
  true
),
(
  'default_max_file_size_mb',
  '5',
  'number',
  'global',
  'الحجم الافتراضي الأقصى للمرفق بالميجابايت.',
  false,
  true
),
(
  'default_allowed_extensions',
  'jpg,jpeg,png,pdf',
  'string',
  'global',
  'الامتدادات الافتراضية المسموحة.',
  false,
  true
)
on conflict (setting_key) do update
set
  setting_value = excluded.setting_value,
  setting_type = excluded.setting_type,
  scope_type = excluded.scope_type,
  description = excluded.description,
  is_locked = excluded.is_locked,
  is_active = excluded.is_active,
  updated_at = now();


-- ---------------------------------------------------------
-- 8) Link existing attachment_types to sections when possible
-- ربط أنواع المرفقات الحالية بالأقسام حسب category
-- ---------------------------------------------------------
update public.attachment_types at
set
  section_id = s.id,
  entity_type = coalesce(at.entity_type, 'beneficiary'),
  path_segment = coalesce(at.path_segment, at.code),
  updated_at = now()
from public.attachment_sections s
where s.section_code = 'beneficiary_static'
  and at.section_id is null
  and lower(at.category) in ('beneficiary', 'beneficiary_static', 'static', 'pic_const');

update public.attachment_types at
set
  section_id = s.id,
  entity_type = coalesce(at.entity_type, 'periodic_report'),
  path_segment = coalesce(at.path_segment, at.code),
  allow_multiple = true,
  updated_at = now()
from public.attachment_sections s
where s.section_code = 'sponsored_reports'
  and at.section_id is null
  and lower(at.category) in ('periodic_report', 'report', 'reports', 'pic_rep');

-- نهاية السكربت