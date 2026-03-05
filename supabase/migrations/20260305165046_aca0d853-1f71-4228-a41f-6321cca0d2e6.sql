DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());