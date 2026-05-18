-- ============================================================
-- 001_core_schema.sql
-- نظام إدارة المستفيدين والكفالات - الجداول الأساسية
-- PostgreSQL
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_code VARCHAR(20) UNIQUE NOT NULL,
    branch_name_ar VARCHAR(255) NOT NULL,
    branch_name_en VARCHAR(255),
    city VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE branches IS 'جدول الفروع الرئيسية التي يتبع لها المستفيدون والمواقع والمراكز';
COMMENT ON COLUMN branches.id IS 'المعرف الداخلي الفريد للفرع بصيغة UUID';
COMMENT ON COLUMN branches.branch_code IS 'كود الفرع المستخدم في النظام وفي مسارات المرفقات مثل BR01';
COMMENT ON COLUMN branches.branch_name_ar IS 'اسم الفرع باللغة العربية';
COMMENT ON COLUMN branches.branch_name_en IS 'اسم الفرع باللغة الإنجليزية إن وجد';
COMMENT ON COLUMN branches.city IS 'المدينة التي يقع فيها الفرع';
COMMENT ON COLUMN branches.address IS 'عنوان الفرع التفصيلي';
COMMENT ON COLUMN branches.phone IS 'رقم هاتف الفرع';
COMMENT ON COLUMN branches.is_active IS 'حالة تفعيل الفرع';
COMMENT ON COLUMN branches.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN branches.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    site_code VARCHAR(20) NOT NULL,
    site_name_ar VARCHAR(255) NOT NULL,
    site_name_en VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_sites_branch_code UNIQUE (branch_id, site_code)
);
COMMENT ON TABLE sites IS 'جدول المواقع التابعة للفروع، حيث يحتوي كل فرع على موقع واحد أو أكثر';
COMMENT ON COLUMN sites.id IS 'المعرف الداخلي الفريد للموقع بصيغة UUID';
COMMENT ON COLUMN sites.branch_id IS 'معرف الفرع الذي يتبع له الموقع';
COMMENT ON COLUMN sites.site_code IS 'كود الموقع المستخدم في النظام وفي مسارات المرفقات مثل SITE03';
COMMENT ON COLUMN sites.site_name_ar IS 'اسم الموقع باللغة العربية';
COMMENT ON COLUMN sites.site_name_en IS 'اسم الموقع باللغة الإنجليزية إن وجد';
COMMENT ON COLUMN sites.address IS 'عنوان الموقع التفصيلي';
COMMENT ON COLUMN sites.is_active IS 'حالة تفعيل الموقع';
COMMENT ON COLUMN sites.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN sites.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    site_id UUID NOT NULL REFERENCES sites(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    center_code VARCHAR(20),
    center_name_ar VARCHAR(255) NOT NULL,
    center_name_en VARCHAR(255),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_centers_site_code UNIQUE (site_id, center_code)
);
COMMENT ON TABLE centers IS 'جدول المراكز التابعة للمواقع، ويرتبط المستفيد بمركز محدد عند الحاجة';
COMMENT ON COLUMN centers.id IS 'المعرف الداخلي الفريد للمركز بصيغة UUID';
COMMENT ON COLUMN centers.branch_id IS 'معرف الفرع التابع له المركز';
COMMENT ON COLUMN centers.site_id IS 'معرف الموقع التابع له المركز';
COMMENT ON COLUMN centers.center_code IS 'كود المركز داخل الموقع';
COMMENT ON COLUMN centers.center_name_ar IS 'اسم المركز باللغة العربية';
COMMENT ON COLUMN centers.center_name_en IS 'اسم المركز باللغة الإنجليزية إن وجد';
COMMENT ON COLUMN centers.address IS 'عنوان المركز التفصيلي';
COMMENT ON COLUMN centers.is_active IS 'حالة تفعيل المركز';
COMMENT ON COLUMN centers.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN centers.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_code VARCHAR(50) UNIQUE NOT NULL,
    file_number VARCHAR(50) UNIQUE NOT NULL,
    external_reference VARCHAR(255),
    beneficiary_type VARCHAR(50) NOT NULL,
    branch_id UUID NOT NULL REFERENCES branches(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    site_id UUID NOT NULL REFERENCES sites(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    center_id UUID REFERENCES centers(id) ON UPDATE CASCADE ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    father_name VARCHAR(100),
    grandfather_name VARCHAR(100),
    family_name VARCHAR(100),
    full_name VARCHAR(255),
    gender VARCHAR(20),
    birth_date DATE,
    birth_place VARCHAR(255),
    nationality VARCHAR(100),
    religion VARCHAR(100),
    identity_type VARCHAR(50),
    identity_number VARCHAR(100),
    phone VARCHAR(50),
    alternative_phone VARCHAR(50),
    address TEXT,
    registration_date DATE DEFAULT CURRENT_DATE,
    current_status VARCHAR(50) DEFAULT 'draft',
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT chk_beneficiaries_gender CHECK (gender IS NULL OR gender IN ('male','female')),
    CONSTRAINT chk_beneficiaries_status CHECK (current_status IN ('draft','under_review','approved','returned','marketing','sponsored','suspended','closed'))
);
COMMENT ON TABLE beneficiaries IS 'جدول المستفيدين الرئيسي ويحتوي على البيانات الأساسية لكل مستفيد في النظام';
COMMENT ON COLUMN beneficiaries.id IS 'المعرف الداخلي الفريد للمستفيد بصيغة UUID';
COMMENT ON COLUMN beneficiaries.beneficiary_code IS 'الرقم الثابت الفريد للمستفيد ولا يتكرر على مستوى قاعدة البيانات';
COMMENT ON COLUMN beneficiaries.file_number IS 'رقم ملف المستفيد المستخدم في تسمية وتنظيم المرفقات';
COMMENT ON COLUMN beneficiaries.external_reference IS 'الرقم أو المرجع الخارجي للمستفيد لدى الجهات المانحة، وقد يكون رقمًا أو نصًا';
COMMENT ON COLUMN beneficiaries.beneficiary_type IS 'نوع المستفيد مثل orphan أو family أو student أو patient أو poor أو displaced أو other';
COMMENT ON COLUMN beneficiaries.branch_id IS 'الفرع الذي يتبع له المستفيد';
COMMENT ON COLUMN beneficiaries.site_id IS 'الموقع الذي يتبع له المستفيد';
COMMENT ON COLUMN beneficiaries.center_id IS 'المركز الذي يتبع له المستفيد إن وجد';
COMMENT ON COLUMN beneficiaries.first_name IS 'الاسم الأول للمستفيد';
COMMENT ON COLUMN beneficiaries.father_name IS 'اسم الأب للمستفيد';
COMMENT ON COLUMN beneficiaries.grandfather_name IS 'اسم الجد للمستفيد';
COMMENT ON COLUMN beneficiaries.family_name IS 'اسم العائلة أو اللقب';
COMMENT ON COLUMN beneficiaries.full_name IS 'الاسم الكامل للمستفيد ويمكن توليده من الأسماء الجزئية';
COMMENT ON COLUMN beneficiaries.gender IS 'جنس المستفيد: male أو female';
COMMENT ON COLUMN beneficiaries.birth_date IS 'تاريخ ميلاد المستفيد';
COMMENT ON COLUMN beneficiaries.birth_place IS 'مكان ميلاد المستفيد';
COMMENT ON COLUMN beneficiaries.nationality IS 'جنسية المستفيد';
COMMENT ON COLUMN beneficiaries.religion IS 'ديانة المستفيد عند الحاجة';
COMMENT ON COLUMN beneficiaries.identity_type IS 'نوع وثيقة الهوية مثل بطاقة شخصية أو جواز أو شهادة ميلاد';
COMMENT ON COLUMN beneficiaries.identity_number IS 'رقم الهوية أو الوثيقة';
COMMENT ON COLUMN beneficiaries.phone IS 'رقم الهاتف الأساسي للمستفيد أو من ينوب عنه';
COMMENT ON COLUMN beneficiaries.alternative_phone IS 'رقم هاتف بديل';
COMMENT ON COLUMN beneficiaries.address IS 'عنوان المستفيد التفصيلي';
COMMENT ON COLUMN beneficiaries.registration_date IS 'تاريخ تسجيل المستفيد في النظام';
COMMENT ON COLUMN beneficiaries.current_status IS 'الحالة الحالية للمستفيد ضمن دورة العمل';
COMMENT ON COLUMN beneficiaries.notes IS 'ملاحظات عامة على سجل المستفيد';
COMMENT ON COLUMN beneficiaries.is_active IS 'حالة تفعيل سجل المستفيد';
COMMENT ON COLUMN beneficiaries.created_by IS 'المستخدم الذي أنشأ السجل';
COMMENT ON COLUMN beneficiaries.updated_by IS 'آخر مستخدم قام بتعديل السجل';
COMMENT ON COLUMN beneficiaries.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN beneficiaries.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';
COMMENT ON COLUMN beneficiaries.deleted_at IS 'تاريخ الحذف المنطقي للسجل إن وجد';

CREATE TABLE related_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender VARCHAR(20),
    birth_date DATE,
    identity_type VARCHAR(50),
    identity_number VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    status VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_related_persons_gender CHECK (gender IS NULL OR gender IN ('male','female'))
);
COMMENT ON TABLE related_persons IS 'جدول الأشخاص المرتبطين بالمستفيدين مثل الأب أو الأم أو المعيل أو الأقارب';
COMMENT ON COLUMN related_persons.id IS 'المعرف الداخلي الفريد للشخص المرتبط بصيغة UUID';
COMMENT ON COLUMN related_persons.person_code IS 'الرقم الثابت الفريد للشخص المرتبط، ويمكن ربطه بأكثر من مستفيد';
COMMENT ON COLUMN related_persons.full_name IS 'الاسم الكامل للشخص المرتبط';
COMMENT ON COLUMN related_persons.gender IS 'جنس الشخص المرتبط: male أو female';
COMMENT ON COLUMN related_persons.birth_date IS 'تاريخ ميلاد الشخص المرتبط إن وجد';
COMMENT ON COLUMN related_persons.identity_type IS 'نوع هوية الشخص المرتبط';
COMMENT ON COLUMN related_persons.identity_number IS 'رقم هوية الشخص المرتبط';
COMMENT ON COLUMN related_persons.phone IS 'رقم هاتف الشخص المرتبط';
COMMENT ON COLUMN related_persons.address IS 'عنوان الشخص المرتبط';
COMMENT ON COLUMN related_persons.status IS 'حالة الشخص المرتبط مثل alive أو deceased أو unknown';
COMMENT ON COLUMN related_persons.notes IS 'ملاحظات عامة على الشخص المرتبط';
COMMENT ON COLUMN related_persons.is_active IS 'حالة تفعيل سجل الشخص المرتبط';
COMMENT ON COLUMN related_persons.created_by IS 'المستخدم الذي أنشأ السجل';
COMMENT ON COLUMN related_persons.updated_by IS 'آخر مستخدم قام بتعديل السجل';
COMMENT ON COLUMN related_persons.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN related_persons.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE beneficiary_related_persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON UPDATE CASCADE ON DELETE CASCADE,
    related_person_id UUID NOT NULL REFERENCES related_persons(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    relation_type VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_beneficiary_related_person UNIQUE (beneficiary_id, related_person_id, relation_type),
    CONSTRAINT chk_relation_type CHECK (relation_type IN ('father','mother','guardian','caregiver','relative','other'))
);
COMMENT ON TABLE beneficiary_related_persons IS 'جدول ربط المستفيد بالأشخاص المرتبطين به مثل الأب والأم والمعيل';
COMMENT ON COLUMN beneficiary_related_persons.id IS 'المعرف الداخلي الفريد لسجل الربط بصيغة UUID';
COMMENT ON COLUMN beneficiary_related_persons.beneficiary_id IS 'معرف المستفيد المرتبط بالشخص';
COMMENT ON COLUMN beneficiary_related_persons.related_person_id IS 'معرف الشخص المرتبط بالمستفيد';
COMMENT ON COLUMN beneficiary_related_persons.relation_type IS 'نوع العلاقة مثل father أو mother أو guardian';
COMMENT ON COLUMN beneficiary_related_persons.is_primary IS 'يحدد ما إذا كان هذا الشخص هو الشخص الأساسي ضمن نوع العلاقة';
COMMENT ON COLUMN beneficiary_related_persons.notes IS 'ملاحظات على علاقة الشخص بالمستفيد';
COMMENT ON COLUMN beneficiary_related_persons.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN beneficiary_related_persons.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE attachment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    allowed_extensions TEXT,
    max_file_size_mb INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_attachment_category CHECK (category IN ('beneficiary_form','periodic_report','sponsorship','general'))
);
COMMENT ON TABLE attachment_types IS 'جدول أنواع المرفقات المستخدمة في استمارات المستفيدين والتقارير الدورية وغيرها';
COMMENT ON COLUMN attachment_types.id IS 'المعرف الداخلي الفريد لنوع المرفق بصيغة UUID';
COMMENT ON COLUMN attachment_types.code IS 'كود نوع المرفق المستخدم في مسارات التخزين مثل birth_certificate أو photo';
COMMENT ON COLUMN attachment_types.name_ar IS 'اسم نوع المرفق باللغة العربية';
COMMENT ON COLUMN attachment_types.name_en IS 'اسم نوع المرفق باللغة الإنجليزية إن وجد';
COMMENT ON COLUMN attachment_types.category IS 'تصنيف المرفق مثل beneficiary_form أو periodic_report';
COMMENT ON COLUMN attachment_types.is_required IS 'يحدد ما إذا كان المرفق مطلوبًا إلزاميًا';
COMMENT ON COLUMN attachment_types.allowed_extensions IS 'الامتدادات المسموحة لهذا النوع من المرفقات مثل pdf,jpg,png';
COMMENT ON COLUMN attachment_types.max_file_size_mb IS 'أقصى حجم مسموح للملف بالميجابايت';
COMMENT ON COLUMN attachment_types.is_active IS 'حالة تفعيل نوع المرفق';
COMMENT ON COLUMN attachment_types.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN attachment_types.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE beneficiary_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON UPDATE CASCADE ON DELETE CASCADE,
    attachment_type_id UUID NOT NULL REFERENCES attachment_types(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    site_id UUID NOT NULL REFERENCES sites(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    center_id UUID REFERENCES centers(id) ON UPDATE CASCADE ON DELETE SET NULL,
    file_number VARCHAR(50) NOT NULL,
    file_extension VARCHAR(20) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    uploaded_by UUID,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE beneficiary_attachments IS 'جدول مرفقات المستفيدين الثابتة مثل الصورة وشهادة الميلاد وشهادة الوفاة والهوية';
COMMENT ON COLUMN beneficiary_attachments.id IS 'المعرف الداخلي الفريد للمرفق بصيغة UUID';
COMMENT ON COLUMN beneficiary_attachments.beneficiary_id IS 'معرف المستفيد صاحب المرفق';
COMMENT ON COLUMN beneficiary_attachments.attachment_type_id IS 'نوع المرفق المرتبط بجدول أنواع المرفقات';
COMMENT ON COLUMN beneficiary_attachments.branch_id IS 'الفرع المستخدم في تصنيف مسار المرفق';
COMMENT ON COLUMN beneficiary_attachments.site_id IS 'الموقع المستخدم في تصنيف مسار المرفق';
COMMENT ON COLUMN beneficiary_attachments.center_id IS 'المركز المرتبط بالمرفق إن وجد';
COMMENT ON COLUMN beneficiary_attachments.file_number IS 'رقم ملف المستفيد المستخدم كاسم للملف';
COMMENT ON COLUMN beneficiary_attachments.file_extension IS 'امتداد الملف مثل pdf أو jpg';
COMMENT ON COLUMN beneficiary_attachments.file_path IS 'المسار الكامل للمرفق مثل /uploads/beneficiaries/BR01/SITE03/photo/12548.jpg';
COMMENT ON COLUMN beneficiary_attachments.mime_type IS 'نوع MIME للملف مثل application/pdf أو image/jpeg';
COMMENT ON COLUMN beneficiary_attachments.file_size IS 'حجم الملف بالبايت';
COMMENT ON COLUMN beneficiary_attachments.uploaded_by IS 'المستخدم الذي رفع المرفق';
COMMENT ON COLUMN beneficiary_attachments.uploaded_at IS 'تاريخ ووقت رفع المرفق';
COMMENT ON COLUMN beneficiary_attachments.is_active IS 'حالة تفعيل المرفق';
COMMENT ON COLUMN beneficiary_attachments.notes IS 'ملاحظات على المرفق';
COMMENT ON COLUMN beneficiary_attachments.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN beneficiary_attachments.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE INDEX idx_sites_branch_id ON sites(branch_id);
CREATE INDEX idx_centers_branch_id ON centers(branch_id);
CREATE INDEX idx_centers_site_id ON centers(site_id);
CREATE INDEX idx_beneficiaries_branch_id ON beneficiaries(branch_id);
CREATE INDEX idx_beneficiaries_site_id ON beneficiaries(site_id);
CREATE INDEX idx_beneficiaries_center_id ON beneficiaries(center_id);
CREATE INDEX idx_beneficiaries_current_status ON beneficiaries(current_status);
CREATE INDEX idx_beneficiaries_beneficiary_type ON beneficiaries(beneficiary_type);
CREATE INDEX idx_beneficiaries_full_name ON beneficiaries(full_name);
CREATE INDEX idx_beneficiaries_identity_number ON beneficiaries(identity_number);
CREATE INDEX idx_beneficiaries_external_reference ON beneficiaries(external_reference);
CREATE INDEX idx_related_persons_identity_number ON related_persons(identity_number);
CREATE INDEX idx_related_persons_full_name ON related_persons(full_name);
CREATE INDEX idx_beneficiary_related_beneficiary_id ON beneficiary_related_persons(beneficiary_id);
CREATE INDEX idx_beneficiary_related_person_id ON beneficiary_related_persons(related_person_id);
CREATE INDEX idx_beneficiary_related_relation_type ON beneficiary_related_persons(relation_type);
CREATE INDEX idx_attachment_types_category ON attachment_types(category);
CREATE INDEX idx_beneficiary_attachments_beneficiary_id ON beneficiary_attachments(beneficiary_id);
CREATE INDEX idx_beneficiary_attachments_attachment_type_id ON beneficiary_attachments(attachment_type_id);
CREATE INDEX idx_beneficiary_attachments_file_number ON beneficiary_attachments(file_number);

INSERT INTO attachment_types (code, name_ar, name_en, category, is_required, allowed_extensions, max_file_size_mb)
VALUES
('photo', 'صورة شخصية', 'Personal Photo', 'beneficiary_form', TRUE, 'jpg,jpeg,png', 5),
('birth_certificate', 'شهادة ميلاد', 'Birth Certificate', 'beneficiary_form', TRUE, 'pdf,jpg,jpeg,png', 10),
('father_death_certificate', 'شهادة وفاة الأب', 'Father Death Certificate', 'beneficiary_form', FALSE, 'pdf,jpg,jpeg,png', 10),
('identity_card', 'هوية المستفيد', 'Identity Card', 'beneficiary_form', FALSE, 'pdf,jpg,jpeg,png', 10),
('guardian_card', 'بطاقة المعيل', 'Guardian Card', 'beneficiary_form', FALSE, 'pdf,jpg,jpeg,png', 10),
('form_1', 'استمارة 1', 'Form 1', 'beneficiary_form', FALSE, 'pdf,jpg,jpeg,png', 10),
('form_2', 'استمارة 2', 'Form 2', 'beneficiary_form', FALSE, 'pdf,jpg,jpeg,png', 10)
ON CONFLICT (code) DO NOTHING;
