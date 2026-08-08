/**
 * ponytail: one-command deploy — clean → build → copy assets → deploy.
 * Astro's post-build cleanup throws ENOENT on Windows reparse points,
 * but the build output is already complete. We verify output exists
 * and continue. Zero deps beyond node:child_process + node:fs.
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { tmpdir } = require('node:os');

const root = path.join(__dirname, '..');
const outDir = path.join(tmpdir(), 'yakeen-dist');

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

// 1. Clean .astro cache (handles reparse point corruption)
console.log('\n[deploy] Step 1/4: Cleaning .astro cache...');
run('node scripts/clean-astro-cache.cjs');

// 2. Build — Astro post-build cleanup may throw non-critical ENOENT
console.log('\n[deploy] Step 2/4: Building Astro site...');
try {
  run('npx astro build');
} catch {
  // ponytail: verify output exists before ignoring the error
  if (!fs.existsSync(outDir) || fs.readdirSync(outDir).length === 0) {
    console.error('\n[deploy] ✗ Build failed with no output generated.');
    process.exit(1);
  }
  console.log('[deploy] Build completed (non-critical post-build error ignored)');
}

// 3. Copy CSS/JS assets to output dir (handles Vite copy failures)
console.log('\n[deploy] Step 3/5: Copying assets...');
run('node scripts/copy-astro-assets.cjs');

// 4. Copy functions/ to output dir (Pages Functions — admin API + middleware)
console.log('\n[deploy] Step 4/5: Copying functions/...');
const functionsSrc = path.join(root, 'functions');
const functionsDst = path.join(outDir, 'functions');
if (fs.existsSync(functionsSrc)) {
  fs.cpSync(functionsSrc, functionsDst, { recursive: true });
  console.log('[deploy] functions/ copied to output');
} else {
  console.log('[deploy] No functions/ directory found, skipping');
}

// 5. Deploy to Cloudflare Pages
console.log('\n[deploy] Step 5/5: Deploying to Cloudflare Pages...');
run(`npx wrangler pages deploy "${outDir}" --project-name yakeen-lighting --branch main --commit-dirty`);

console.log('\n[deploy] ✓ Done — site is live on Cloudflare Pages.');
