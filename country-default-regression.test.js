const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname);
const prismaSchema = fs.readFileSync(path.join(repoRoot, 'apps/backend/prisma/schema.prisma'), 'utf8');
const signupPages = [
  'apps/frontend/app/auth/signup/page.tsx',
  'apps/frontend/app/auth/user/signup/page.tsx',
  'apps/frontend/app/auth/artist/signup/page.tsx',
  'apps/frontend/app/auth/producer/signup/page.tsx',
].map(file => fs.readFileSync(path.join(repoRoot, file), 'utf8'));

test('prisma user country defaults to Zambia', () => {
  assert.match(prismaSchema, /country\s+String\?\s+@default\("ZM"\)/);
  assert.doesNotMatch(prismaSchema, /country\s+String\?\s+@default\("US"\)/);
});

test('signup forms default to Zambia', () => {
  for (const document of signupPages) {
    assert.match(document, /country:\s*['"]ZM['"]/);
  }
});
