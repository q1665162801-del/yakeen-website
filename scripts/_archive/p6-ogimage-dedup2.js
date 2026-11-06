const fs = require('fs'), path = require('path');
const PAGES = path.join(__dirname, '..', '..', 'src', 'pages');
const CDN = 'https://www.yakeenlighting.com/images/';
const list = [
  ['blog/architectural-lighting-dubai.html', 'blog/architectural-modern-interior.jpg'],
  ['blog/villa-palace-lighting-specification.html', 'blog/villa-palace-lighting.jpg'],
  ['lighting-design.html', 'hero-lighting-design.jpg'],
  ['lighting-design-ar.html', 'hero-lighting-design.jpg'],
  ['led-lighting-supplier-gcc.html', 'jeddah-flagship-hero.jpg'],
];
for (const [p, img] of list) {
  const fp = path.join(PAGES, p);
  if (!fs.existsSync(fp)) { console.log('❌', p); continue; }
  let c = fs.readFileSync(fp, 'utf-8');
  c = c.replace(/^ogImage:\s*".*"$/m, 'ogImage: "' + CDN + img + '"');
  fs.writeFileSync(fp, c);
  console.log('✅', p, '→', img);
}
