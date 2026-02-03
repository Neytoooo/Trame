-- Add stock management columns to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier text;

-- Create an index on supplier if needed later for searching
CREATE INDEX IF NOT EXISTS idx_articles_supplier ON articles(supplier);
