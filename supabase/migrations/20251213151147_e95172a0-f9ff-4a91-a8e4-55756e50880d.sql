-- Add annual_target column to sales_targets table
ALTER TABLE sales_targets 
ADD COLUMN annual_target numeric DEFAULT 0;