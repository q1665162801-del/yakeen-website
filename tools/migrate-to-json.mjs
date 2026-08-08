// ponytail: one-shot migration script — reads products.ts, writes JSON files.
// Run: npx tsx tools/migrate-to-json.mjs
import { products } from '../src/data/products.ts';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'src', 'content', 'products');

await mkdir(outDir, { recursive: true });

for (const p of products) {
  // ponytail: keep slug in JSON — filename matches slug, but data also carries it
  const filePath = join(outDir, `${p.slug}.json`);
  await writeFile(filePath, JSON.stringify(p, null, 2), 'utf-8');
  console.log(`  ✓ ${p.slug}.json`);
}

console.log(`\nDone: ${products.length} products written to src/content/products/`);
