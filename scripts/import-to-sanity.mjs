// ponytail: import existing JSON products into Sanity Content Lake
// Usage: SANITY_PROJECT_ID=xxx SANITY_WRITE_TOKEN=xxx node scripts/import-to-sanity.mjs
// Reads src/content/products/*.json, uploads images, creates documents.
import { createClient } from '@sanity/client';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const PROJECT_ID = process.env.SANITY_PROJECT_ID;
const DATASET = process.env.SANITY_DATASET || 'production';
const WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN;

if (!PROJECT_ID || !WRITE_TOKEN) {
  console.error('Missing SANITY_PROJECT_ID or SANITY_WRITE_TOKEN env vars.');
  console.error('Get them from: sanity.io/manage → your project → API → Tokens');
  process.exit(1);
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2025-02-06',
  useCdn: false,
  token: WRITE_TOKEN,
});

const PRODUCTS_DIR = join(process.cwd(), 'src', 'content', 'products');
const PUBLIC_DIR = join(process.cwd(), 'public');

// ponytail: cache uploaded assets by filename to avoid re-uploading
const assetCache = new Map();

async function uploadImage(urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return null;
  // URL paths like /assets/images/products/xxx.jpeg → public/assets/images/products/xxx.jpeg
  const filePath = join(PUBLIC_DIR, urlPath);
  if (!existsSync(filePath)) {
    console.warn(`  ⚠ Image not found: ${filePath}`);
    return null;
  }
  const filename = basename(urlPath);
  if (assetCache.has(filename)) return assetCache.get(filename);

  const buffer = readFileSync(filePath);
  const asset = await client.assets.upload('image', buffer, { filename });
  console.log(`  📤 Uploaded: ${filename} → ${asset._id}`);
  assetCache.set(filename, asset._id);
  return asset._id;
}

function imageRef(assetId) {
  if (!assetId) return undefined;
  return { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
}

async function main() {
  const files = readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} product JSON files.\n`);

  const tx = client.transaction();
  let imported = 0;

  for (const file of files) {
    const data = JSON.parse(readFileSync(join(PRODUCTS_DIR, file), 'utf-8'));
    console.log(`Processing: ${data.name || file}`);

    // Upload images
    const mainImgId = await uploadImage(data.mainImage);
    const sceneImgId = await uploadImage(data.sceneImage);

    if (!mainImgId) {
      console.warn(`  ⚠ Skipping — no main image for ${file}`);
      continue;
    }

    // Build Sanity document — 1:1 with schema
    const doc = {
      _id: `product-${data.slug}`,
      _type: 'product',
      slug: { _type: 'slug', current: data.slug },
      name: data.name,
      shortName: data.shortName || '',
      category: data.category || '',
      tagline: data.tagline || '',
      description: data.description || '',
      metaDescription: data.metaDescription || '',
      mainImage: imageRef(mainImgId),
      sceneImage: sceneImgId ? imageRef(sceneImgId) : undefined,
      ogImage: data.ogImage || '',
      galleryImages: data.galleryImages || [],
      specs: data.specs || {},
      applications: data.applications || [],
      features: data.features || [],
      faqs: data.faqs || [],
      caseStudy: data.caseStudy || undefined,
      ar: data.ar || undefined,
      featured: data.featured || false,
    };

    // Remove undefined fields
    Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);

    tx.createOrReplace(doc);
    imported++;
  }

  if (imported === 0) {
    console.error('No products to import.');
    process.exit(1);
  }

  console.log(`\nCommitting ${imported} documents to Sanity...`);
  const result = await tx.commit();
  console.log(`✅ Imported ${result.results.length} products successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  1. cd sanity && npm install && npx sanity deploy`);
  console.log(`  2. Add SANITY_PROJECT_ID to your Astro .env`);
  console.log(`  3. Set up webhook: sanity.io/manage → API → Webhooks → your build hook URL`);
}

main().catch(err => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
