GRANT USAGE, CREATE ON SCHEMA public TO sandbox_exec;
GRANT USAGE ON SCHEMA auth, storage, extensions, pgmq TO sandbox_exec;
GRANT EXECUTE ON FUNCTION public.__import_exec(text) TO sandbox_exec;
GRANT EXECUTE ON FUNCTION public.__import_exec_as(text, text) TO sandbox_exec;