/**
 * build/indexnow.js — IndexNow URL submission for Bing & Yandex
 *
 * Pushes new/updated URLs to IndexNow so search engines crawl them faster.
 * Zero dependencies — uses native https module.
 *
 * Usage: node build/indexnow.js
 *
 * How it works:
 * 1. Reads all HTML files from dist/
 * 2. Converts to full URLs
 * 3. Submits to IndexNow API
 *
 * The key file (5f6a7e8b4c3d2e1f5f6a7e8b4c3d2e1f.txt) must be accessible at
 * https://www.yakeenlighting.com/5f6a7e8b4c3d2e1f5f6a7e8b4c3d2e1f.txt
 * (it's in static/ and copied to dist/ during build)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const { DIST, SITE_BASE } = require('./config');
const { walkDir } = require('./utils');

const INDEXNOW_KEY = '5f6a7e8b4c3d2e1f5f6a7e8b4c3d2e1f';
const INDEXNOW_ENDPOINT = 'api.indexnow.org';

function getUrls() {
  const htmlFiles = walkDir(DIST, '.html');
  return htmlFiles
    .map(f => {
      let rel = path.relative(DIST, f).replace(/\\/g, '/');
      // Remove index.html from directory paths
      if (rel.endsWith('/index.html')) {
        rel = rel.replace('/index.html', '/');
      }
      return SITE_BASE + rel;
    })
    .filter(url => !url.includes('/blog/tags/')); // exclude tag archive pages
}

function submitToIndexNow(urls) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      host: 'www.yakeenlighting.com',
      key: INDEXNOW_KEY,
      keyLocation: `https://www.yakeenlighting.com/${INDEXNOW_KEY}.txt`,
      urlList: urls
    });

    const options = {
      hostname: INDEXNOW_ENDPOINT,
      port: 443,
      path: '/indexnow',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body });
        } else {
          reject(new Error(`IndexNow returned ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('🔔 IndexNow — submitting URLs to Bing...');

  const urls = getUrls();
  console.log(`   Found ${urls.length} URLs to submit`);

  try {
    // IndexNow has a limit of 10,000 URLs per submission — we're well under
    const result = await submitToIndexNow(urls);
    console.log(`   ✅ Submitted ${urls.length} URLs (status: ${result.status})`);
    console.log(`   Bing will crawl them within a few days`);
  } catch (e) {
    console.log(`   ⚠️  Failed: ${e.message}`);
    console.log(`   (This is normal if running locally without HTTPS — run after deployment)`);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run, getUrls };
