const fs = require('fs');
const path = require('path');

function findMain(startDir) {
  const stack = [startDir];
  while (stack.length) {
    const dir = stack.pop();
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) stack.push(full);
      else if (stat.isFile() && f === 'main.js') return full;
    }
  }
  return null;
}

const distRoot = path.resolve(__dirname, '../../dist');
const targetDir = path.resolve(__dirname, '../../dist/apps/backend');

try {
  if (!fs.existsSync(distRoot)) {
    console.error('[fix-entrypoint] dist directory not found:', distRoot);
    process.exit(0);
  }
  const found = findMain(distRoot);
  if (!found) {
    console.error('[fix-entrypoint] No main.js found under dist');
    process.exit(0);
  }
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const dest = path.join(targetDir, 'main.js');
  fs.copyFileSync(found, dest);
  console.log('[fix-entrypoint] Copied', found, '->', dest);
} catch (err) {
  console.error('[fix-entrypoint] Error:', err);
  process.exit(1);
}
