-- One-time remap of printing statuses to the new flow:
--   old SUBMITTED (= awaiting approval) -> PENDING_APPROVAL
--   old APPROVED                        -> PENDING_ARC_SUBMISSION
-- Guarded on the legacy APPROVED enum value still existing, so this never
-- touches new-style SUBMITTED (= submitted to Arc) rows on later restarts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'PrintingStatus' AND e.enumlabel = 'APPROVED'
  ) THEN
    EXECUTE 'UPDATE "PrintingRequest" SET status = ''PENDING_APPROVAL'' WHERE status = ''SUBMITTED''';
    EXECUTE 'UPDATE "PrintingRequest" SET status = ''PENDING_ARC_SUBMISSION'' WHERE status = ''APPROVED''';
  END IF;
END $$;

-- Normalise budget category names (a live category had a trailing space);
-- the API now trims on create/rename.
DO $$
BEGIN
  IF to_regclass('"BudgetCategory"') IS NOT NULL THEN
    EXECUTE 'UPDATE "BudgetCategory" SET name = trim(name) WHERE name <> trim(name)';
  END IF;
END $$;
