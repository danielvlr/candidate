-- Backfill CandidateOrigin for legacy candidates (idempotent)
UPDATE candidates SET origin = CASE WHEN jestor_id IS NOT NULL THEN 'JESTOR' ELSE 'MANUAL' END WHERE origin IS NULL;
