-- Fix expired price tier records
-- Update any price tier with effective_to in the past to extend to 2026-12-31

UPDATE "PriceTier"
SET effective_to = '2026-12-31 23:59:59'
WHERE effective_to < NOW();

-- Verify the fix
SELECT id, name, active, effective_from, effective_to, 
       CASE 
         WHEN effective_to < NOW() THEN 'EXPIRED'
         WHEN effective_from > NOW() THEN 'NOT_YET_ACTIVE'
         ELSE 'VALID'
       END as status
FROM "PriceTier"
ORDER BY created_at DESC;
