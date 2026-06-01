CREATE TABLE IF NOT EXISTS lookups (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), lookup_type VARCHAR(100) NOT NULL, code VARCHAR(100), name_ar VARCHAR(255) NOT NULL, name_en VARCHAR(255), notes TEXT, sort_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT TRUE, is_deleted BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP); 
CREATE UNIQUE INDEX IF NOT EXISTS ux_lookups_type_name_active ON lookups(lookup_type, name_ar) WHERE is_deleted = false; 
CREATE INDEX IF NOT EXISTS idx_lookups_type ON lookups(lookup_type); 
