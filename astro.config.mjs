import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

// ─── esbuild write-permission fix (sandbox only) ─────────────────────
// In TRAE sandbox, esbuild's Go binary cannot write files.
// scripts/postinstall-patch.cjs patches esbuild's main.js at the source level.
// This runtime patch is a belt-and-suspenders fallback.
function patchEsbuildWrite(esbuildModule) {
  if (!esbuildModule || !esbuildModule.build || esbuildModule.__patched) return;
  const originalBuild = esbuildModule.build;
  esbuildModule.__patched = true;
  esbuildModule.build = function (options) {
    if (options && options.write !== false) {
      const opts = { ...options, write: false };
      return originalBuild.call(this, opts).then((result) => {
        if (result && result.outputFiles) {
          for (const file of result.outputFiles) {
            fs.mkdirSync(path.dirname(file.path), { recursive: true });
            fs.writeFileSync(file.path, file.contents);
          }
        }
        return result;
      });
    }
    return originalBuild.call(this, options);
  };
}
try { patchEsbuildWrite(await import('vite/node_modules/esbuild')); } catch {}
try { patchEsbuildWrite(await import('esbuild')); } catch {}
// ──────────────────────────────────────────────────────────────────────

export default defineConfig({
  site: 'https://www.yakeenlighting.com',
  // ponytail: 每次构建输出到系统临时目录，彻底绕开项目目录下dist的reparse point损坏问题
  outDir: path.join(tmpdir(), 'yakeen-dist'),
  cacheDir: path.join(tmpdir(), 'astro-cache-yakeen'),
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'en', locales: { en: 'en-US', ar: 'ar-SA' } },
    }),
    tailwind({ applyBaseStyles: false }),
  ],
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // ponytail: CSS chunks fail to write to disk due to esbuild/sandbox issue.
  // Inline all stylesheets into HTML to eliminate external CSS file dependency.
  build: { inlineStylesheets: 'always' },
  vite: {
    // ponytail: disabled=true is deprecated in Vite 5.1 but still functional.
    // Removing it triggers broken aria-query/axobject-query devDeps.
    optimizeDeps: { disabled: true },
  },
});
