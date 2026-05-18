-- ============================================================
-- 002_workflow_sponsorship_schema.sql
-- البيانات المتغيرة، السجلات التاريخية، الداعمون والكفالات
-- ============================================================

CREATE TABLE beneficiary_dynamic_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON UPDATE CASCADE ON DELETE CASCADE,
    data_type VARCHAR(50) NOT NULL,
    data_key VARCHAR(100) NOT NULL,
    data_value TEXT,
    record_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE beneficiary_dynamic_data IS 'جدول مرن لحفظ البيانات المتغيرة للمستفيد مثل الصحي والتعليمي والاجتماعي والاحتياجات دون الحاجة لإضافة جداول جديدة';
COMMENT ON COLUMN beneficiary_dynamic_data.id IS 'المعرف الداخلي الفريد لسجل البيانات المتغيرة بصيغة UUID';
COMMENT ON COLUMN beneficiary_dynamic_data.beneficiary_id IS 'معرف المستفيد المرتبط بالبيانات المتغيرة';
COMMENT ON COLUMN beneficiary_dynamic_data.data_type IS 'نوع البيانات المتغيرة مثل health أو education أو social أو need أو economic أو housing';
COMMENT ON COLUMN beneficiary_dynamic_data.data_key IS 'اسم أو مفتاح البيان المتغير مثل disease_type أو education_level';
COMMENT ON COLUMN beneficiary_dynamic_data.data_value IS 'قيمة البيان المتغير';
COMMENT ON COLUMN beneficiary_dynamic_data.record_date IS 'تاريخ تسجيل أو تحديث البيان المتغير';
COMMENT ON COLUMN beneficiary_dynamic_data.notes IS 'ملاحظات على البيان المتغير';
COMMENT ON COLUMN beneficiary_dynamic_data.created_by IS 'المستخدم الذي أنشأ السجل';
COMMENT ON COLUMN beneficiary_dynamic_data.updated_by IS 'آخر مستخدم عدل السجل';
COMMENT ON COLUMN beneficiary_dynamic_data.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN beneficiary_dynamic_data.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE beneficiary_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON UPDATE CASCADE ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_notes TEXT,
    action_by UUID,
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE beneficiary_status_history IS 'جدول تاريخي لتتبع انتقالات حالة المستفيد داخل دورة العمل';
COMMENT ON COLUMN beneficiary_status_history.id IS 'المعرف الداخلي الفريد لحركة الحالة بصيغة UUID';
COMMENT ON COLUMN beneficiary_status_history.beneficiary_id IS 'معرف المستفيد المرتبط بحركة الحالة';
COMMENT ON COLUMN beneficiary_status_history.from_status IS 'الحالة السابقة للمستفيد';
COMMENT ON COLUMN beneficiary_status_history.to_status IS 'الحالة الجديدة للمستفيد';
COMMENT ON COLUMN beneficiary_status_history.action_type IS 'نوع الإجراء مثل submit_review أو approve أو return أو send_marketing';
COMMENT ON COLUMN beneficiary_status_history.action_notes IS 'ملاحظات الإجراء';
COMMENT ON COLUMN beneficiary_status_history.action_by IS 'المستخدم الذي نفذ الإجراء';
COMMENT ON COLUMN beneficiary_status_history.action_at IS 'تاريخ ووقت تنفيذ الإجراء';

CREATE TABLE beneficiary_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON UPDATE CASCADE ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_reason TEXT,
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE beneficiary_change_logs IS 'جدول تفصيلي لحفظ التعديلات التي تمت على بيانات المستفيد مع حفظ الحقول المعدلة فقط';
COMMENT ON COLUMN beneficiary_change_logs.id IS 'المعرف الداخلي الفريد لسجل التغيير بصيغة UUID';
COMMENT ON COLUMN beneficiary_change_logs.beneficiary_id IS 'معرف المستفيد الذي تم تعديل بياناته';
COMMENT ON COLUMN beneficiary_change_logs.table_name IS 'اسم الجدول الذي تم تعديل البيانات فيه';
COMMENT ON COLUMN beneficiary_change_logs.record_id IS 'معرف السجل الذي تم تعديله إن وجد';
COMMENT ON COLUMN beneficiary_change_logs.field_name IS 'اسم الحقل الذي تم تعديله';
COMMENT ON COLUMN beneficiary_change_logs.old_value IS 'القيمة السابقة قبل التعديل';
COMMENT ON COLUMN beneficiary_change_logs.new_value IS 'القيمة الجديدة بعد التعديل';
COMMENT ON COLUMN beneficiary_change_logs.change_reason IS 'سبب التعديل إن تم إدخاله';
COMMENT ON COLUMN beneficiary_change_logs.changed_by IS 'المستخدم الذي قام بالتعديل';
COMMENT ON COLUMN beneficiary_change_logs.changed_at IS 'تاريخ ووقت التعديل';

CREATE TABLE sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_code VARCHAR(50) UNIQUE NOT NULL,
    sponsor_name VARCHAR(255) NOT NULL,
    sponsor_type VARCHAR(50) NOT NULL,
    parent_sponsor_id UUID REFERENCES sponsors(id) ON UPDATE CASCADE ON DELETE SET NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    contact_person VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sponsor_type CHECK (sponsor_type IN ('main','sub','individual','organization'))
);
COMMENT ON TABLE sponsors IS 'جدول الداعمين ويشمل الداعمين الرئيسيين والفرعيين في جدول واحد بعلاقة ذاتية';
COMMENT ON COLUMN sponsors.id IS 'المعرف الداخلي الفريد للداعم بصيغة UUID';
COMMENT ON COLUMN sponsors.sponsor_code IS 'الرقم أو الكود الفريد للداعم';
COMMENT ON COLUMN sponsors.sponsor_name IS 'اسم الداعم أو الجهة الداعمة';
COMMENT ON COLUMN sponsors.sponsor_type IS 'نوع الداعم مثل main أو sub أو individual أو organization';
COMMENT ON COLUMN sponsors.parent_sponsor_id IS 'معرف الداعم الرئيسي إذا كان هذا الداعم فرعيًا';
COMMENT ON COLUMN sponsors.phone IS 'رقم هاتف الداعم';
COMMENT ON COLUMN sponsors.email IS 'البريد الإلكتروني للداعم';
COMMENT ON COLUMN sponsors.address IS 'عنوان الداعم';
COMMENT ON COLUMN sponsors.contact_person IS 'اسم مسؤول التواصل لدى الجهة الداعمة';
COMMENT ON COLUMN sponsors.notes IS 'ملاحظات عامة على الداعم';
COMMENT ON COLUMN sponsors.is_active IS 'حالة تفعيل الداعم';
COMMENT ON COLUMN sponsors.created_by IS 'المستخدم الذي أنشأ السجل';
COMMENT ON COLUMN sponsors.updated_by IS 'آخر مستخدم عدل السجل';
COMMENT ON COLUMN sponsors.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN sponsors.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE sponsorships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsorship_code VARCHAR(50) UNIQUE NOT NULL,
    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    sponsorship_type VARCHAR(50) NOT NULL,
    amount NUMERIC(14,2),
    currency VARCHAR(10) DEFAULT 'YER',
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sponsorship_status CHECK (status IN ('active','paused','transferred','ended','cancelled'))
);
COMMENT ON TABLE sponsorships IS 'جدول الكفالات ويربط المستفيد بالداعم، ويسمح بوجود أكثر من كفالة للمستفيد الواحد';
COMMENT ON COLUMN sponsorships.id IS 'المعرف الداخلي الفريد للكفالة بصيغة UUID';
COMMENT ON COLUMN sponsorships.sponsorship_code IS 'كود الكفالة الفريد';
COMMENT ON COLUMN sponsorships.beneficiary_id IS 'معرف المستفيد المرتبط بالكفالة';
COMMENT ON COLUMN sponsorships.sponsor_id IS 'معرف الداعم المرتبط بالكفالة';
COMMENT ON COLUMN sponsorships.sponsorship_type IS 'نوع الكفالة مثل monthly أو education أو health أو seasonal';
COMMENT ON COLUMN sponsorships.amount IS 'قيمة الكفالة';
COMMENT ON COLUMN sponsorships.currency IS 'عملة الكفالة';
COMMENT ON COLUMN sponsorships.start_date IS 'تاريخ بداية الكفالة';
COMMENT ON COLUMN sponsorships.end_date IS 'تاريخ نهاية الكفالة';
COMMENT ON COLUMN sponsorships.status IS 'حالة الكفالة الحالية';
COMMENT ON COLUMN sponsorships.notes IS 'ملاحظات على الكفالة';
COMMENT ON COLUMN sponsorships.created_by IS 'المستخدم الذي أنشأ الكفالة';
COMMENT ON COLUMN sponsorships.updated_by IS 'آخر مستخدم عدل الكفالة';
COMMENT ON COLUMN sponsorships.created_at IS 'تاريخ ووقت إنشاء السجل';
COMMENT ON COLUMN sponsorships.updated_at IS 'تاريخ ووقت آخر تعديل على السجل';

CREATE TABLE sponsorship_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsorship_id UUID NOT NULL REFERENCES sponsorships(id) ON UPDATE CASCADE ON DELETE CASCADE,
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_notes TEXT,
    action_by UUID,
    action_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE sponsorship_status_history IS 'جدول تاريخي لتتبع تغيرات حالة الكفالة مثل التفعيل والإيقاف والتحويل والإنهاء';
COMMENT ON COLUMN sponsorship_status_history.id IS 'المعرف الداخلي الفريد لحركة حالة الكفالة بصيغة UUID';
COMMENT ON COLUMN sponsorship_status_history.sponsorship_id IS 'معرف الكفالة المرتبطة بالحركة';
COMMENT ON COLUMN sponsorship_status_history.from_status IS 'الحالة السابقة للكفالة';
COMMENT ON COLUMN sponsorship_status_history.to_status IS 'الحالة الجديدة للكفالة';
COMMENT ON COLUMN sponsorship_status_history.action_type IS 'نوع الإجراء مثل pause أو transfer أو end';
COMMENT ON COLUMN sponsorship_status_history.action_notes IS 'ملاحظات الإجراء';
COMMENT ON COLUMN sponsorship_status_history.action_by IS 'المستخدم الذي نفذ الإجراء';
COMMENT ON COLUMN sponsorship_status_history.action_at IS 'تاريخ ووقت تنفيذ الإجراء';

CREATE INDEX idx_dynamic_data_beneficiary_id ON beneficiary_dynamic_data(beneficiary_id);
CREATE INDEX idx_dynamic_data_type ON beneficiary_dynamic_data(data_type);
CREATE INDEX idx_dynamic_data_key ON beneficiary_dynamic_data(data_key);
CREATE INDEX idx_dynamic_data_record_date ON beneficiary_dynamic_data(record_date);
CREATE INDEX idx_beneficiary_status_history_beneficiary_id ON beneficiary_status_history(beneficiary_id);
CREATE INDEX idx_beneficiary_status_history_to_status ON beneficiary_status_history(to_status);
CREATE INDEX idx_beneficiary_status_history_action_at ON beneficiary_status_history(action_at);
CREATE INDEX idx_beneficiary_change_logs_beneficiary_id ON beneficiary_change_logs(beneficiary_id);
CREATE INDEX idx_beneficiary_change_logs_table_name ON beneficiary_change_logs(table_name);
CREATE INDEX idx_beneficiary_change_logs_changed_at ON beneficiary_change_logs(changed_at);
CREATE INDEX idx_beneficiary_change_logs_changed_by ON beneficiary_change_logs(changed_by);
CREATE INDEX idx_sponsors_parent_sponsor_id ON sponsors(parent_sponsor_id);
CREATE INDEX idx_sponsors_sponsor_type ON sponsors(sponsor_type);
CREATE INDEX idx_sponsors_name ON sponsors(sponsor_name);
CREATE INDEX idx_sponsorships_beneficiary_id ON sponsorships(beneficiary_id);
CREATE INDEX idx_sponsorships_sponsor_id ON sponsorships(sponsor_id);
CREATE INDEX idx_sponsorships_status ON sponsorships(status);
CREATE INDEX idx_sponsorships_start_date ON sponsorships(start_date);
CREATE INDEX idx_sponsorships_end_date ON sponsorships(end_date);
CREATE INDEX idx_sponsorship_status_history_sponsorship_id ON sponsorship_status_history(sponsorship_id);
CREATE INDEX idx_sponsorship_status_history_action_at ON sponsorship_status_history(action_at);
