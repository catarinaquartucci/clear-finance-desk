
ALTER TABLE suppliers ADD COLUMN company_id UUID REFERENCES group_companies(id);
ALTER TABLE customers ADD COLUMN company_id UUID REFERENCES group_companies(id);
ALTER TABLE cost_centers ADD COLUMN company_id UUID REFERENCES group_companies(id);
ALTER TABLE bank_accounts ADD COLUMN company_id UUID REFERENCES group_companies(id);
ALTER TABLE payables ADD COLUMN company_id UUID REFERENCES group_companies(id);
ALTER TABLE receivables ADD COLUMN company_id UUID REFERENCES group_companies(id);

-- Allow finance users to read group_companies for filters
CREATE POLICY "Finance users can read group_companies" ON group_companies
  FOR SELECT USING (
    has_role(auth.uid(), 'finance'::app_role) OR 
    has_role(auth.uid(), 'finance_viewer'::app_role)
  );
