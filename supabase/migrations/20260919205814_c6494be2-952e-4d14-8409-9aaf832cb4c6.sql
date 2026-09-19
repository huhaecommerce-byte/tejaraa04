CREATE OR REPLACE FUNCTION public.__import_exec_as(_role text, sql text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  EXECUTE format('SET LOCAL ROLE %I', _role);
  EXECUTE sql;
  RESET ROLE;
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.__import_exec_as(text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.__import_exec_as(text,text) TO sandbox_exec;