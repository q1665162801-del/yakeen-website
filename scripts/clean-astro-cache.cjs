/**
 * ponytail: delete .astro cache before each build.
 * Reparse point corruption accumulates in .astro/ over time on Windows.
 * Deleting it forces Astro to regenerate from scratch — clean build every time.
 * Zero deps, just fs. Silently continues if dir doesn't exist.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const astroCache = path.join(__dirname, '..', '.astro');

if (!fs.existsSync(astroCache)) {
  console.log('[clean-astro-cache] .astro not found, skipping');
  process.exit(0);
}

// ponytail: try fs.rmSync → Windows native `rd /s /q` → rename+delete, in that order.
// rd /s /q handles reparse points that Node.js fs API chokes on.
try {
  fs.rmSync(astroCache, { recursive: true, force: true });
  console.log('[clean-astro-cache] .astro deleted (fs.rmSync)');
} catch {
  try {
    execSync(`rd /s /q "${astroCache}"`, { stdio: 'pipe' });
    console.log('[clean-astro-cache] .astro deleted (rd /s /q)');
  } catch {
    try {
      const tmp = astroCache + '.old.' + Date.now();
      fs.renameSync(astroCache, tmp);
      execSync(`rd /s /q "${tmp}"`, { stdio: 'pipe' });
      console.log('[clean-astro-cache] .astro renamed+deleted (fallback)');
    } catch (e3) {
      console.error('[clean-astro-cache] WARNING: could not delete .astro:', e3.message);
      process.exit(0);
    }
  }
}
