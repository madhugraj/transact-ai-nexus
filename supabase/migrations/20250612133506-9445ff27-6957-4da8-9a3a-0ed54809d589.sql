
-- Drop existing invoice_table and create new optimized schema
DROP TABLE IF EXISTS invoice_table CASCADE;

-- Create the new invoices table with your specified schema
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    extraction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    supplier_gst_number VARCHAR(15),
    bill_to_gst_number VARCHAR(15),
    po_number VARCHAR(50),
    shipping_address TEXT,
    seal_and_sign_present BOOLEAN DEFAULT FALSE,
    seal_sign_image BYTEA,  -- For base64 storage
    document_quality_notes TEXT,
    raw_json JSONB NOT NULL,  -- Stores the original extracted data
    confidence_score INTEGER  -- Overall confidence (0-100)
);

-- Create the invoice line items table
CREATE TABLE invoice_line_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    item_index INTEGER NOT NULL,  -- Maintains original order
    description TEXT,
    hsn_sac VARCHAR(10),
    quantity DECIMAL(12, 3),
    unit_price DECIMAL(12, 2),
    total_amount DECIMAL(12, 2) NOT NULL,
    serial_number VARCHAR(50),
    item_confidence INTEGER  -- Confidence for this line item (0-100)
);

-- Create indexes for faster querying
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_supplier_gst ON invoices(supplier_gst_number);
CREATE INDEX idx_line_items_hsn ON invoice_line_items(hsn_sac);

-- Add RLS policies for security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert and select their own data
CREATE POLICY "Users can insert invoices" ON invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view invoices" ON invoices FOR SELECT USING (true);
CREATE POLICY "Users can update invoices" ON invoices FOR UPDATE USING (true);

CREATE POLICY "Users can insert line items" ON invoice_line_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view line items" ON invoice_line_items FOR SELECT USING (true);
CREATE POLICY "Users can update line items" ON invoice_line_items FOR UPDATE USING (true);
