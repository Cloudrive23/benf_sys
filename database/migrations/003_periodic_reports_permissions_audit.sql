-- ============================================================
-- 003_periodic_reports_permissions_audit.sql
-- التقارير الدورية، الصلاحيات، وسجل العمليات العام
-- ============================================================

CREATE TABLE periodic_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_code VARCHAR(50) UNIQUE NOT NULL,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    sponsorship_id UUID REFERENCES sponsorships(id) ON UPDATE CASCADE ON DELETE SET NULL,
    report_year INTEGER NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'preparing',
    report_summary TEXT,
    notes TEXT,
    prepared_by UUID,
    prepared_at TIMESTAMP,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP,
    sent_by UUID,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_periodic_report_status CHECK (status IN ('preparing','updating','updated','approved','returned','sent_to_sponsor'))
);
COMMENT ON TABLE periodic_reports IS 'جدول التقارير الدورية للمستفيدين المكفولين، ويشمل تقارير سنوية أو ربع سنوية أو غيرها';
COMMENT ON COLUMN periodic_reports.id IS 'المعرف الداخلي الفريد للتقرير الدوري بصيغة UUID';
COMMENT ON COLUMN periodic_reports.report_code IS 'كود التقرير الدوري الفريد';
COMMENT ON COLUMN periodic_reports.beneficiary_id IS 'معرف المستفيد صاحب التقرير';
COMMENT ON COLUMN periodic_reports.sponsorship_id IS 'معرف الكفالة المرتبطة بالتقرير إن وجد';
COMMENT ON COLUMN periodic_reports.report_year IS 'سنة التقرير الدوري';
COMMENT ON COLUMN periodic_reports.report_type IS 'نوع التقرير مثل annual أو quarterly أو monthly';
COMMENT ON COLUMN periodic_reports.status IS 'حالة التقرير ضمن دورة العمل';
COMMENT ON COLUMN periodic_reports.report_summary IS 'ملخص التقرير الدوري';
COMMENT ON COLUMN periodic_reports.notes IS 'ملاحظات عامة على التقرير';
COMMENT ON COLUMN periodic_reports.prepared_by IS 'المستخدم الذي جهز التقرير';
COMMENT ON COLUMN periodic_reports.prepared_at IS 'تاريخ ووقت تجهيز التقرير';
COMMENT ON COLUMN periodic_reports.updated_by IS 'آخر مستخدم قام بتحديث التقرير';
COMMENT ON COLUMN periodic_reports.updated_at IS 'تاريخ ووقت آخر تحديث للتقرير';
COMMENT ON COLUMN periodic_reports.approved_by IS 'المستخدم الذي اعتمد التقرير';
COMMENT ON COLUMN periodic_reports.approved_at IS 'تاريخ ووقت اعتماد التقرير';
COMMENT ON COLUMN periodic_reports.sent_by IS 'المستخدم الذي أرسل التقرير للداعم';
COMMENT ON COLUMN periodic_reports.sent_at IS 'تاريخ ووقت إرسال التقرير للداعم';
COMMENT ON COLUMN periodic_reports.created_at IS 'تاريخ ووقت إنشاء التقرير';

CREATE TABLE periodic_report_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodic_report_id UUID NOT NULL REFERENCES periodic_reports(id) ON UPDATE CASCADE ON DELETE CASCADE,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    sponsorship_id UUID REFERENCES sponsorships(id) ON UPDATE CASCADE ON DELETE SET NULL,
    attachment_type_id UUID NOT NULL REFERENCES attachment_types(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    report_year INTEGER NOT NULL,
    report_type VARCHAR(50) NOT NULL,
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
COMMENT ON TABLE periodic_report_attachments IS 'جدول مرفقات التقارير الدورية للمكفولين مثل الصورة السنوية أو التقرير الدراسي أو الصحي';
COMMENT ON COLUMN periodic_report_attachments.id IS 'المعرف الداخلي الفريد لمرفق التقرير بصيغة UUID';
COMMENT ON COLUMN periodic_report_attachments.periodic_report_id IS 'معرف التقرير الدوري المرتبط بالمرفق';
COMMENT ON COLUMN periodic_report_attachments.beneficiary_id IS 'معرف المستفيد صاحب المرفق';
COMMENT ON COLUMN periodic_report_attachments.sponsorship_id IS 'معرف الكفالة المرتبطة بالمرفق إن وجدت';
COMMENT ON COLUMN periodic_report_attachments.attachment_type_id IS 'نوع المرفق من جدول أنواع المرفقات';
COMMENT ON COLUMN periodic_report_attachments.report_year IS 'سنة التقرير المستخدمة في مسار التخزين';
COMMENT ON COLUMN periodic_report_attachments.report_type IS 'نوع التقرير المستخدم في مسار التخزين مثل annual أو quarterly';
COMMENT ON COLUMN periodic_report_attachments.branch_id IS 'الفرع المستخدم في مسار التخزين';
COMMENT ON COLUMN periodic_report_attachments.site_id IS 'الموقع المستخدم في مسار التخزين';
COMMENT ON COLUMN periodic_report_attachments.center_id IS 'المركز المرتبط بالمرفق إن وجد';
COMMENT ON COLUMN periodic_report_attachments.file_number IS 'رقم ملف المستفيد المستخدم كاسم للملف';
COMMENT ON COLUMN periodic_report_attachments.file_extension IS 'امتداد الملف مثل pdf أو jpg';
COMMENT ON COLUMN periodic_report_attachments.file_path IS 'المسار الكامل للمرفق مثل /uploads/sponsored_reports/2026/annual/BR01/SITE03/photo/12548.jpg';
COMMENT ON COLUMN periodic_report_attachments.mime_type IS 'نوع MIME للملف';
COMMENT ON COLUMN periodic_report_attachments.file_size IS 'حجم الملف بالبايت';
COMMENT ON COLUMN periodic_report_attachments.uploaded_by IS 'المستخدم الذي رفع المرفق';
COMMENT ON COLUMN periodic_report_attachments.uploaded_at IS 'تاريخ ووقت رفع المرفق';
COMMENT ON COLUMN periodic_report_attachments.is_active IS 'حالة تفعيل المرفق';
COMMENT ON COLUMN periodic_report_attachments.notes IS 'ملاحظات على المرفق';
COMMENT ON COLUMN periodic_report_attachments.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN periodic_report_attachments.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE periodic_report_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodic_report_id UUID NOT NULL REFERENCES periodic_reports(id) ON UPDATE CASCADE ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_notes TEXT,
    action_by UUID,
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE periodic_report_status_history IS 'جدول تاريخي لتتبع انتقالات حالة التقرير الدوري';
COMMENT ON COLUMN periodic_report_status_history.id IS 'المعرف الداخلي الفريد لحركة حالة التقرير بصيغة UUID';
COMMENT ON COLUMN periodic_report_status_history.periodic_report_id IS 'معرف التقرير الدوري المرتبط بالحركة';
COMMENT ON COLUMN periodic_report_status_history.from_status IS 'الحالة السابقة للتقرير';
COMMENT ON COLUMN periodic_report_status_history.to_status IS 'الحالة الجديدة للتقرير';
COMMENT ON COLUMN periodic_report_status_history.action_type IS 'نوع الإجراء مثل update أو approve أو return أو send_to_sponsor';
COMMENT ON COLUMN periodic_report_status_history.action_notes IS 'ملاحظات الإجراء';
COMMENT ON COLUMN periodic_report_status_history.action_by IS 'المستخدم الذي نفذ الإجراء';
COMMENT ON COLUMN periodic_report_status_history.action_at IS 'تاريخ ووقت تنفيذ الإجراء';

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    password_hash TEXT NOT NULL,
    branch_id UUID REFERENCES branches(id) ON UPDATE CASCADE ON DELETE SET NULL,
    site_id UUID REFERENCES sites(id) ON UPDATE CASCADE ON DELETE SET NULL,
    center_id UUID REFERENCES centers(id) ON UPDATE CASCADE ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE users IS 'جدول مستخدمي النظام';
COMMENT ON COLUMN users.id IS 'المعرف الداخلي الفريد للمستخدم بصيغة UUID';
COMMENT ON COLUMN users.username IS 'اسم المستخدم المستخدم لتسجيل الدخول';
COMMENT ON COLUMN users.full_name IS 'الاسم الكامل للمستخدم';
COMMENT ON COLUMN users.email IS 'البريد الإلكتروني للمستخدم';
COMMENT ON COLUMN users.phone IS 'رقم هاتف المستخدم';
COMMENT ON COLUMN users.password_hash IS 'كلمة المرور المشفرة، ولا يتم حفظ كلمة المرور الصريحة';
COMMENT ON COLUMN users.branch_id IS 'الفرع الافتراضي أو نطاق عمل المستخدم';
COMMENT ON COLUMN users.site_id IS 'الموقع الافتراضي أو نطاق عمل المستخدم';
COMMENT ON COLUMN users.center_id IS 'المركز الافتراضي أو نطاق عمل المستخدم';
COMMENT ON COLUMN users.is_active IS 'حالة تفعيل المستخدم';
COMMENT ON COLUMN users.last_login_at IS 'آخر تاريخ ووقت تسجيل دخول للمستخدم';
COMMENT ON COLUMN users.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN users.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_code VARCHAR(100) UNIQUE NOT NULL,
    role_name_ar VARCHAR(255) NOT NULL,
    role_name_en VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE roles IS 'جدول أدوار ومجموعات الصلاحيات في النظام';
COMMENT ON COLUMN roles.id IS 'المعرف الداخلي الفريد للدور بصيغة UUID';
COMMENT ON COLUMN roles.role_code IS 'كود الدور مثل admin أو reviewer أو data_entry';
COMMENT ON COLUMN roles.role_name_ar IS 'اسم الدور باللغة العربية';
COMMENT ON COLUMN roles.role_name_en IS 'اسم الدور باللغة الإنجليزية إن وجد';
COMMENT ON COLUMN roles.description IS 'وصف صلاحيات الدور';
COMMENT ON COLUMN roles.is_active IS 'حالة تفعيل الدور';
COMMENT ON COLUMN roles.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN roles.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE system_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code VARCHAR(100) UNIQUE NOT NULL,
    module_name_ar VARCHAR(255) NOT NULL,
    module_name_en VARCHAR(255),
    parent_module_id UUID REFERENCES system_modules(id) ON UPDATE CASCADE ON DELETE SET NULL,
    module_type VARCHAR(50) NOT NULL,
    route_path VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE system_modules IS 'جدول شجرة النظام ويشمل الشاشات والتقارير والوحدات الرئيسية والفرعية';
COMMENT ON COLUMN system_modules.id IS 'المعرف الداخلي الفريد لوحدة النظام بصيغة UUID';
COMMENT ON COLUMN system_modules.module_code IS 'كود وحدة النظام أو الشاشة أو التقرير';
COMMENT ON COLUMN system_modules.module_name_ar IS 'اسم وحدة النظام باللغة العربية';
COMMENT ON COLUMN system_modules.module_name_en IS 'اسم وحدة النظام باللغة الإنجليزية إن وجد';
COMMENT ON COLUMN system_modules.parent_module_id IS 'معرف الوحدة الأب لتكوين شجرة النظام';
COMMENT ON COLUMN system_modules.module_type IS 'نوع الوحدة مثل module أو screen أو report أو action';
COMMENT ON COLUMN system_modules.route_path IS 'مسار الصفحة أو الشاشة داخل التطبيق';
COMMENT ON COLUMN system_modules.sort_order IS 'ترتيب ظهور الوحدة في القوائم';
COMMENT ON COLUMN system_modules.is_active IS 'حالة تفعيل الوحدة';
COMMENT ON COLUMN system_modules.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN system_modules.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_code VARCHAR(150) UNIQUE NOT NULL,
    permission_name_ar VARCHAR(255) NOT NULL,
    permission_name_en VARCHAR(255),
    module_id UUID REFERENCES system_modules(id) ON UPDATE CASCADE ON DELETE SET NULL,
    action_code VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE permissions IS 'جدول الصلاحيات التفصيلية المرتبطة بالشاشات والتقارير والإجراءات';
COMMENT ON COLUMN permissions.id IS 'المعرف الداخلي الفريد للصلاحية بصيغة UUID';
COMMENT ON COLUMN permissions.permission_code IS 'كود الصلاحية الفريد مثل beneficiaries.create أو beneficiaries.approve';
COMMENT ON COLUMN permissions.permission_name_ar IS 'اسم الصلاحية باللغة العربية';
COMMENT ON COLUMN permissions.permission_name_en IS 'اسم الصلاحية باللغة الإنجليزية إن وجد';
COMMENT ON COLUMN permissions.module_id IS 'وحدة النظام أو الشاشة المرتبطة بالصلاحية';
COMMENT ON COLUMN permissions.action_code IS 'نوع الإجراء مثل view أو create أو update أو delete أو approve أو return أو export';
COMMENT ON COLUMN permissions.description IS 'وصف الصلاحية';
COMMENT ON COLUMN permissions.is_active IS 'حالة تفعيل الصلاحية';
COMMENT ON COLUMN permissions.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN permissions.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id)
);
COMMENT ON TABLE role_permissions IS 'جدول ربط الأدوار بالصلاحيات';
COMMENT ON COLUMN role_permissions.id IS 'المعرف الداخلي الفريد لسجل الربط بصيغة UUID';
COMMENT ON COLUMN role_permissions.role_id IS 'معرف الدور';
COMMENT ON COLUMN role_permissions.permission_id IS 'معرف الصلاحية';
COMMENT ON COLUMN role_permissions.created_at IS 'تاريخ ووقت إنشاء سجل الربط';

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_roles UNIQUE (user_id, role_id)
);
COMMENT ON TABLE user_roles IS 'جدول ربط المستخدمين بالأدوار أو مجموعات الصلاحيات';
COMMENT ON COLUMN user_roles.id IS 'المعرف الداخلي الفريد لسجل الربط بصيغة UUID';
COMMENT ON COLUMN user_roles.user_id IS 'معرف المستخدم';
COMMENT ON COLUMN user_roles.role_id IS 'معرف الدور';
COMMENT ON COLUMN user_roles.created_at IS 'تاريخ ووقت إنشاء سجل الربط';

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(100),
    user_agent TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE audit_logs IS 'جدول سجل العمليات العام لتتبع العمليات الحساسة مثل الإضافة والتعديل والحذف والاعتماد والإرجاع وتسجيل الدخول';
COMMENT ON COLUMN audit_logs.id IS 'المعرف الداخلي الفريد لسجل العملية بصيغة UUID';
COMMENT ON COLUMN audit_logs.user_id IS 'معرف المستخدم الذي نفذ العملية';
COMMENT ON COLUMN audit_logs.action IS 'نوع العملية مثل create أو update أو delete أو approve أو login';
COMMENT ON COLUMN audit_logs.entity_name IS 'اسم الكيان أو الجدول أو الوحدة التي تمت عليها العملية';
COMMENT ON COLUMN audit_logs.entity_id IS 'معرف السجل الذي تمت عليه العملية إن وجد';
COMMENT ON COLUMN audit_logs.old_data IS 'البيانات القديمة بصيغة JSON قبل التعديل إن وجدت';
COMMENT ON COLUMN audit_logs.new_data IS 'البيانات الجديدة بصيغة JSON بعد التعديل إن وجدت';
COMMENT ON COLUMN audit_logs.ip_address IS 'عنوان IP للمستخدم عند تنفيذ العملية';
COMMENT ON COLUMN audit_logs.user_agent IS 'بيانات المتصفح أو الجهاز المستخدم';
COMMENT ON COLUMN audit_logs.notes IS 'ملاحظات إضافية على العملية';
COMMENT ON COLUMN audit_logs.created_at IS 'تاريخ ووقت تنفيذ العملية';

CREATE INDEX idx_periodic_reports_beneficiary_id ON periodic_reports(beneficiary_id);
CREATE INDEX idx_periodic_reports_sponsorship_id ON periodic_reports(sponsorship_id);
CREATE INDEX idx_periodic_reports_year_type ON periodic_reports(report_year, report_type);
CREATE INDEX idx_periodic_reports_status ON periodic_reports(status);
CREATE INDEX idx_periodic_report_attachments_report_id ON periodic_report_attachments(periodic_report_id);
CREATE INDEX idx_periodic_report_attachments_beneficiary_id ON periodic_report_attachments(beneficiary_id);
CREATE INDEX idx_periodic_report_attachments_year_type ON periodic_report_attachments(report_year, report_type);
CREATE INDEX idx_periodic_report_status_history_report_id ON periodic_report_status_history(periodic_report_id);
CREATE INDEX idx_periodic_report_status_history_action_at ON periodic_report_status_history(action_at);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_branch_id ON users(branch_id);
CREATE INDEX idx_roles_code ON roles(role_code);
CREATE INDEX idx_system_modules_parent_id ON system_modules(parent_module_id);
CREATE INDEX idx_permissions_module_id ON permissions(module_id);
CREATE INDEX idx_permissions_action_code ON permissions(action_code);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_name, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

INSERT INTO roles (role_code, role_name_ar, role_name_en, description)
VALUES
('admin', 'مدير النظام', 'System Administrator', 'صلاحيات كاملة لإدارة النظام'),
('data_entry', 'مدخل بيانات', 'Data Entry', 'إدخال وتعديل بيانات المستفيدين حسب الصلاحيات'),
('reviewer', 'مراجع', 'Reviewer', 'مراجعة بيانات المستفيدين والتقارير'),
('approver', 'معتمد', 'Approver', 'اعتماد أو إرجاع البيانات والتقارير'),
('reports_viewer', 'مستخدم تقارير', 'Reports Viewer', 'عرض التقارير والإحصائيات')
ON CONFLICT (role_code) DO NOTHING;

INSERT INTO attachment_types (code, name_ar, name_en, category, is_required, allowed_extensions, max_file_size_mb)
VALUES
('annual_photo', 'صورة سنوية', 'Annual Photo', 'periodic_report', FALSE, 'jpg,jpeg,png', 5),
('school_report', 'تقرير دراسي', 'School Report', 'periodic_report', FALSE, 'pdf,jpg,jpeg,png', 10),
('health_report', 'تقرير صحي', 'Health Report', 'periodic_report', FALSE, 'pdf,jpg,jpeg,png', 10)
ON CONFLICT (code) DO NOTHING;
