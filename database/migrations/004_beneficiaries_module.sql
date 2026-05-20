-- =========================================================
-- BENEFICIARIES MODULE
-- Enterprise-Level Database Architecture
-- =========================================================

-- =========================================================
-- BENEFICIARIES
-- =========================================================

CREATE TABLE IF NOT EXISTS beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beneficiary_code VARCHAR(30) UNIQUE NOT NULL,
    full_name_ar VARCHAR(255) NOT NULL,
    full_name_en VARCHAR(255),

    gender VARCHAR(10) NOT NULL,
    birth_date DATE,

    national_id VARCHAR(100),
    passport_number VARCHAR(100),

    orphan_status VARCHAR(50),
    marital_status VARCHAR(50),

    phone VARCHAR(50),
    email VARCHAR(255),

    education_level VARCHAR(100),
    health_status TEXT,

    is_active BOOLEAN DEFAULT TRUE,

    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE beneficiaries IS 'Main beneficiaries master table';

COMMENT ON COLUMN beneficiaries.id IS 'Primary unique identifier';
COMMENT ON COLUMN beneficiaries.beneficiary_code IS 'Unique beneficiary code';
COMMENT ON COLUMN beneficiaries.full_name_ar IS 'Arabic full name';
COMMENT ON COLUMN beneficiaries.full_name_en IS 'English full name';
COMMENT ON COLUMN beneficiaries.gender IS 'Gender';
COMMENT ON COLUMN beneficiaries.birth_date IS 'Birth date';
COMMENT ON COLUMN beneficiaries.national_id IS 'National ID';
COMMENT ON COLUMN beneficiaries.passport_number IS 'Passport number';
COMMENT ON COLUMN beneficiaries.orphan_status IS 'Orphan status';
COMMENT ON COLUMN beneficiaries.marital_status IS 'Marital status';
COMMENT ON COLUMN beneficiaries.phone IS 'Phone number';
COMMENT ON COLUMN beneficiaries.email IS 'Email';
COMMENT ON COLUMN beneficiaries.education_level IS 'Education level';
COMMENT ON COLUMN beneficiaries.health_status IS 'Health status';
COMMENT ON COLUMN beneficiaries.is_active IS 'Active status';
COMMENT ON COLUMN beneficiaries.created_by IS 'Created by user';
COMMENT ON COLUMN beneficiaries.updated_by IS 'Last updated by user';

CREATE INDEX idx_beneficiaries_code
ON beneficiaries(beneficiary_code);

CREATE INDEX idx_beneficiaries_name_ar
ON beneficiaries(full_name_ar);

CREATE INDEX idx_beneficiaries_gender
ON beneficiaries(gender);

CREATE INDEX idx_beneficiaries_active
ON beneficiaries(is_active);

-- =========================================================
-- BENEFICIARY GUARDIANS
-- =========================================================

CREATE TABLE IF NOT EXISTS beneficiary_guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id)
    ON DELETE CASCADE,

    guardian_type VARCHAR(50) NOT NULL,

    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    national_id VARCHAR(100),

    occupation VARCHAR(255),
    monthly_income NUMERIC(14,2),

    is_alive BOOLEAN DEFAULT TRUE,

    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE beneficiary_guardians IS 'Beneficiary guardians and parents';

COMMENT ON COLUMN beneficiary_guardians.guardian_type IS 'Father / Mother / Guardian';

CREATE INDEX idx_guardians_beneficiary
ON beneficiary_guardians(beneficiary_id);

-- =========================================================
-- BENEFICIARY ADDRESSES
-- =========================================================

CREATE TABLE IF NOT EXISTS beneficiary_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id)
    ON DELETE CASCADE,

    country VARCHAR(100),
    governorate VARCHAR(100),
    district VARCHAR(100),
    village VARCHAR(255),

    address_details TEXT,

    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE beneficiary_addresses IS 'Beneficiary addresses';

CREATE INDEX idx_addresses_beneficiary
ON beneficiary_addresses(beneficiary_id);

-- =========================================================
-- BENEFICIARY DOCUMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS beneficiary_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id)
    ON DELETE CASCADE,

    document_type VARCHAR(100) NOT NULL,

    original_name VARCHAR(255),
    file_name VARCHAR(255),
    file_path TEXT NOT NULL,

    mime_type VARCHAR(100),
    file_size BIGINT,

    uploaded_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE beneficiary_documents IS 'Beneficiary uploaded documents';

COMMENT ON COLUMN beneficiary_documents.document_type IS 'birth_certificate / photo / death_certificate';

CREATE INDEX idx_documents_beneficiary
ON beneficiary_documents(beneficiary_id);

CREATE INDEX idx_documents_type
ON beneficiary_documents(document_type);

-- =========================================================
-- BENEFICIARY NOTES
-- =========================================================

CREATE TABLE IF NOT EXISTS beneficiary_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id)
    ON DELETE CASCADE,

    note TEXT NOT NULL,

    created_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE beneficiary_notes IS 'Internal notes for beneficiaries';

CREATE INDEX idx_notes_beneficiary
ON beneficiary_notes(beneficiary_id);

-- =========================================================
-- BENEFICIARY AUDIT LOGS
-- =========================================================

CREATE TABLE IF NOT EXISTS beneficiary_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id)
    ON DELETE CASCADE,

    action_type VARCHAR(100) NOT NULL,

    old_values JSONB,
    new_values JSONB,

    action_by UUID REFERENCES users(id),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE beneficiary_audit_logs IS 'Audit logs for beneficiaries changes';

CREATE INDEX idx_audit_beneficiary
ON beneficiary_audit_logs(beneficiary_id);

CREATE INDEX idx_audit_action
ON beneficiary_audit_logs(action_type);

-- =========================================================
-- UPDATED_AT TRIGGER
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_beneficiaries_updated_at ON beneficiaries;

CREATE TRIGGER trg_beneficiaries_updated_at
BEFORE UPDATE ON beneficiaries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

