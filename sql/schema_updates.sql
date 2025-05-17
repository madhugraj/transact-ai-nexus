
-- Add classification fields to uploaded_files table
ALTER TABLE IF EXISTS uploaded_files
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS classification_confidence REAL DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create a new table for cloud storage connections
CREATE TABLE IF NOT EXISTS cloud_storage_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    provider TEXT NOT NULL,
    provider_id TEXT,
    token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create RLS policies for cloud storage connections
ALTER TABLE cloud_storage_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cloud storage connections"
ON cloud_storage_connections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cloud storage connections"
ON cloud_storage_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cloud storage connections"
ON cloud_storage_connections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cloud storage connections"
ON cloud_storage_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Create a document classifications table to track document types
CREATE TABLE IF NOT EXISTS document_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default document classifications
INSERT INTO document_classifications (name, description, icon, color, is_default)
VALUES
    ('invoice', 'Invoices and bills for payment', 'file-text', 'blue', true),
    ('purchase_order', 'Purchase orders and requisitions', 'clipboard', 'purple', true),
    ('bill', 'Bills and accounts payable', 'credit-card', 'red', true),
    ('receipt', 'Receipts and proofs of payment', 'receipt', 'green', true),
    ('email', 'Email correspondence', 'mail', 'yellow', true),
    ('report', 'Reports and documents', 'bar-chart', 'orange', true),
    ('other', 'Other document types', 'file', 'gray', true)
ON CONFLICT (name) DO NOTHING;
