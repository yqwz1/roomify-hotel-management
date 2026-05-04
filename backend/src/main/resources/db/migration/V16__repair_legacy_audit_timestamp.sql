DO $$
BEGIN
    IF to_regclass('public.audit_logs') IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'audit_logs'
              AND column_name = 'timestamp'
        ) THEN
        UPDATE audit_logs
        SET "timestamp" = COALESCE("timestamp", created_at, CURRENT_TIMESTAMP)
        WHERE "timestamp" IS NULL;

        ALTER TABLE audit_logs
            ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP;

        ALTER TABLE audit_logs
            ALTER COLUMN "timestamp" DROP NOT NULL;
    END IF;
END $$;
