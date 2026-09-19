GRANT CREATE ON SCHEMA public TO service_role;
SELECT pg_has_role('postgres','service_role','MEMBER') AS postgres_in_service_role;