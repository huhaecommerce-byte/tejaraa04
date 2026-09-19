GRANT TRIGGER ON TABLE auth.users TO sandbox_exec;
GRANT USAGE ON SCHEMA cron TO sandbox_exec;
GRANT ALL ON ALL TABLES IN SCHEMA cron TO sandbox_exec;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA cron TO sandbox_exec;
GRANT USAGE ON SCHEMA extensions TO sandbox_exec;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO sandbox_exec;
GRANT USAGE ON SCHEMA pgmq TO sandbox_exec;
GRANT ALL ON ALL TABLES IN SCHEMA pgmq TO sandbox_exec;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgmq TO sandbox_exec;