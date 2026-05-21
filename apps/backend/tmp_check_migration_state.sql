-- Check enum labels for UserRole
SELECT t.typname AS enum_type, array_agg(e.enumlabel) AS labels
FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname ILIKE 'userrole'
GROUP BY t.typname;

-- Check presence of key tables added by migration
SELECT to_regclass('media_comments') AS media_comments;
SELECT to_regclass('float_accounts') AS float_accounts;
SELECT to_regclass('queued_payouts') AS queued_payouts;
SELECT to_regclass('system_alerts') AS system_alerts;
SELECT to_regclass('media_interactions') AS media_interactions;
SELECT to_regclass('verifications') AS verifications;
