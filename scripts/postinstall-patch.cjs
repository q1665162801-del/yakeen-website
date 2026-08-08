/**
 * postinstall: Patch esbuild for TRAE sandbox environment
 *
 * In TRAE's sandboxed environment, esbuild's Go binary subprocess cannot write
 * files directly. This script patches esbuild's main.js to:
 *   1. Force write=false in all internal build/context calls
 *   2. Manually write outputFiles via Node.js fs (which has write permission)
 *
 * This script runs automatically after `npm install` via the postinstall hook.
 * In CI/CD environments (GitHub Actions, Cloudflare Pages), the patch is harmless
 * but unnecessary — the build works normally without it.
 */
const fs = require('fs');
const path = require('path');

// Find all esbuild main.js files (Vite's bundled + top-level)
function findEsbuildMainFiles(rootDir) {
  const results = [];
  const check = (dir) => {
    const target = path.join(dir, 'node_modules', 'esbuild', 'lib', 'main.js');
    if (fs.existsSync(target)) results.push(target);

    // Also check Vite's bundled esbuild
    const viteTarget = path.join(dir, 'node_modules', 'vite', 'node_modules', 'esbuild', 'lib', 'main.js');
    if (fs.existsSync(viteTarget)) results.push(viteTarget);
  };

  check(rootDir);

  // Also scan node_modules subdirectories for nested esbuild instances
  const nmDir = path.join(rootDir, 'node_modules');
  if (fs.existsSync(nmDir)) {
    try {
      for (const entry of fs.readdirSync(nmDir)) {
        if (entry.startsWith('.')) continue;
        const subNm = path.join(nmDir, entry, 'node_modules');
        if (fs.existsSync(subNm)) {
          const nested = path.join(subNm, 'esbuild', 'lib', 'main.js');
          if (fs.existsSync(nested) && !results.includes(nested)) results.push(nested);
        }
      }
    } catch {}
  }

  return results;
}

// Patch: force write=false + manual file writing
function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Already patched check
  if (content.includes('_pFs') && content.includes('request.write = false')) {
    return 'already-patched';
  }

  // Patch A: Force request.write = false after request object creation
  // This tells esbuild's Go binary to NOT write files directly
  const patchA_pattern = /if \(mangleCache\) request\.mangleCache = request\.mangleCache;/;
  if (patchA_pattern.test(content) && !content.includes('request.write = false')) {
    content = content.replace(
      patchA_pattern,
      (match) => match + '\n    request.write = false;'
    );
    modified = true;
  }

  // Also check for alternative pattern (single-line)
  const patchA_alt = /request\.mangleCache = request\.mangleCache;/;
  if (!modified && patchA_alt.test(content) && !content.includes('request.write = false')) {
    content = content.replace(
      patchA_alt,
      (match) => match + '\n    request.write = false;'
    );
    modified = true;
  }

  // Patch B: Manually write outputFiles in buildResponseToResult
  // This writes files via Node.js fs instead of Go binary
  const patchB_pattern = /if \(response\.outputFiles\) result\.outputFiles = response\.outputFiles\.map\(convertOutputFiles\);/;
  if (patchB_pattern.test(content) && !content.includes('_pFs')) {
    content = content.replace(patchB_pattern, `if (response.outputFiles) {
        result.outputFiles = response.outputFiles.map(convertOutputFiles);
        var _pFs = require("fs");
        var _pPath = require("path");
        for (var _pi = 0; _pi < result.outputFiles.length; _pi++) {
          var _pf = result.outputFiles[_pi];
          try {
            _pFs.mkdirSync(_pPath.dirname(_pf.path), { recursive: true });
            _pFs.writeFileSync(_pf.path, _pf.contents);
          } catch(_pe) {
            console.error("[esbuild-patch] Failed to write:", _pf.path, _pe.message);
          }
        }
      }`);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return 'patched';
  }
  return 'no-changes';
}

// Main
const projectRoot = __dirname.replace(/scripts$/, '');
console.log('[postinstall] Patching esbuild for sandbox compatibility...');

const targets = findEsbuildMainFiles(projectRoot);

if (targets.length === 0) {
  console.log('[postinstall] No esbuild installations found, skipping.');
  process.exit(0);
}

for (const target of targets) {
  const relPath = path.relative(projectRoot, target);
  try {
    const result = patchFile(target);
    console.log(`  ${relPath}: ${result}`);
  } catch (e) {
    console.error(`  ${relPath}: ERROR - ${e.message}`);
  }
}

console.log('[postinstall] Done.');
