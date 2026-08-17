-- Check current price tiers and their validity
SELECT 
  id,
  name,
  product_type_id,
  active,
  direct_price,
  effective_from,
  effective_to,
  CASE 
    WHEN effective_to < NOW() THEN 'EXPIRED'
    WHEN effective_from > NOW() THEN 'NOT_YET_ACTIVE'
    ELSE 'VALID'
  END as status,
  created_at
FROM "PriceTier"
ORDER BY created_at DESC;

-- To fix the expired tier, extend the effective_to date to 2026-12-31:
UPDATE "PriceTier" 
SET effective_to = '2026-12-31 23:59:59' 
WHERE id = 1 AND effective_to < NOW();

-- Or to create a brand new valid Single Song tier:
INSERT INTO "PriceTier" (
  product_type_id,
  name,
  direct_price,
  reseller_discount,
  min_price,
  max_price,
  active,
  reseller_allowed,
  attribution_period_days,
  effective_from,
  effective_to,
  created_at,
  updated_at
) VALUES (
  1,
  'Single Song',
  5.00,
  1,
  3,
  10,
  true,
  true,
  7,
  NOW(),
  '2026-12-31 23:59:59',
  NOW(),
  NOW()
);
