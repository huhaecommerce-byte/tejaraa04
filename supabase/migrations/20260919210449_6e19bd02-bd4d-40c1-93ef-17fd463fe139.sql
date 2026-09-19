DROP TABLE IF EXISTS public.__import_payload;
DROP TABLE IF EXISTS public.__import_fail;
DROP FUNCTION IF EXISTS public.__import_exec(text);
DROP FUNCTION IF EXISTS public.__import_exec_as(text, text);