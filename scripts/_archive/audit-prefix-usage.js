const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function findHTML(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results = results.concat(findHTML(full));
    } else if (e.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const htmlFiles = findHTML(path.join(ROOT, 'src'));

const prefixes = [
  'article-', 'spec-', 'tested-', 'faq-', 'featured-', 'equip-', 'boom-',
  'luxury-', 'project-', 'tq-', 'pie-', 'quick-', 'alt-', 'resource-', 'cert-',
  'newsletter-', 'compare-', 'report-', 'why-', 'deliverable-', 'component-',
  'market-', 'cap-', 'capability-', 'workflow-', 'price-', 'eng-', 'solution-',
  'standard-', 'lab-', 'qc-', 'doc-', 'process-', 'quality-', 'slc-', 'page-',
  'country-', 'gmark-', 'standards-', 'read-', 'sidebar-', 'request-', 'ai-',
  'heritage-', 'finance-', 'residence-', 'stat-', 'home-', 'equipment-',
  'available-', 'coming-', 'check-', 'brand-', 'pillar-', 'arrow-',
];

function getPageName(filePath) {
  const rel = path.relative(path.join(ROOT, 'src', 'pages'), filePath);
  return rel.replace(/\\/g, '/');
}

for (const prefix of prefixes) {
  const pages = new Set();
  for (const f of htmlFiles) {
    const content = fs.readFileSync(f, 'utf8');
    // Match class names starting with this prefix (boundary check)
    const re = new RegExp('class="[^"]*\\b' + prefix.replace(/-/g, '\\-') + '[a-zA-Z]', 'g');
    if (re.test(content)) {
      pages.add(getPageName(f));
    }
  }
  if (pages.size > 0) {
    const pageList = [...pages].sort();
    const sample = pageList.slice(0, 2).join(', ');
    const more = pageList.length > 2 ? ` +${pageList.length - 2} more` : '';
    console.log(`${prefix.padEnd(14)} ${String(pageList.length).padStart(3)} pages  →  ${sample}${more}`);
  } else {
    console.log(`${prefix.padEnd(14)}   0 pages  →  DEAD?`);
  }
}
