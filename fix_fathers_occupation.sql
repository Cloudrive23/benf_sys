ALTER TABLE fathers ADD COLUMN IF NOT EXISTS occupation_id UUID REFERENCES lookups(id); 
