REVOKE EXECUTE ON FUNCTION public.get_notas_fiscais_mes() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_notas_fiscais_mes() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.aggregate_raw_to_detailed(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.aggregate_raw_to_detailed(integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.populate_cash_flow_tables(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.populate_cash_flow_tables(integer) TO authenticated, service_role;