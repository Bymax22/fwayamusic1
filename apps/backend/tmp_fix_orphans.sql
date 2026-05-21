BEGIN;

ALTER TABLE media_interactions ALTER COLUMN user_id DROP NOT NULL;
UPDATE media_interactions SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

ALTER TABLE user_devices ALTER COLUMN user_id DROP NOT NULL;
UPDATE user_devices SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

ALTER TABLE sessions ALTER COLUMN user_id DROP NOT NULL;
UPDATE sessions SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

ALTER TABLE followers ALTER COLUMN following_id DROP NOT NULL;
UPDATE followers SET following_id = NULL WHERE following_id IS NOT NULL AND following_id NOT IN (SELECT id FROM users);

ALTER TABLE downloads ALTER COLUMN user_id DROP NOT NULL;
UPDATE downloads SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

ALTER TABLE transactions ALTER COLUMN user_id DROP NOT NULL;
UPDATE transactions SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

ALTER TABLE libraries ALTER COLUMN user_id DROP NOT NULL;
UPDATE libraries SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;
UPDATE notifications SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

ALTER TABLE verifications ALTER COLUMN user_id DROP NOT NULL;
UPDATE verifications SET user_id = NULL WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);

COMMIT;

-- Verify no orphans remain
SELECT 'media_interactions' as table_name, COUNT(*) FROM media_interactions WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
SELECT 'user_devices' as table_name, COUNT(*) FROM user_devices WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
SELECT 'sessions' as table_name, COUNT(*) FROM sessions WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
SELECT 'followers_following' as table_name, COUNT(*) FROM followers WHERE following_id IS NOT NULL AND following_id NOT IN (SELECT id FROM users);
SELECT 'downloads' as table_name, COUNT(*) FROM downloads WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
SELECT 'transactions' as table_name, COUNT(*) FROM transactions WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
SELECT 'libraries' as table_name, COUNT(*) FROM libraries WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
SELECT 'notifications' as table_name, COUNT(*) FROM notifications WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
SELECT 'verifications' as table_name, COUNT(*) FROM verifications WHERE user_id IS NOT NULL AND user_id NOT IN (SELECT id FROM users);
