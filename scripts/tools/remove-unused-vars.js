const fs = require('fs');
const path = require('path');

// Remove unused CSS variables from all files
const filesToClean = [
  {
    file: 'css/tokens.css',
    vars: [
      '--color-bg-primary', '--color-bg-tertiary', '--color-gold-deep',
      '--font-size-2xl', '--font-size-3xl', '--font-size-4xl', '--font-size-hero', '--font-size-xl',
      '--gold-gradient-soft',
      '--line-height-normal', '--line-height-tight',
      '--nav-height', '--noise-texture',
      '--radius-2xl', '--radius-xl',
      '--shadow-xl',
      '--space-1', '--space-10', '--space-2', '--space-20', '--space-24',
      '--space-3', '--space-4', '--space-6',
      '--tracking-normal', '--tracking-tight',
      '--transition-lux', '--z-sticky'
    ]
  },
  {
    file: 'css/sections/components.css',
    vars: ['--eng', '--gold', '--outline', '--outline-light', '--spec']
  },
  {
    file: 'css/sections/misc.css',
    vars: ['--ar-partial']
  },
  {
    file: 'css/sections/products.css',
    vars: ['--image']
  },
  {
    file: 'css/themes/rtl.css',
    vars: ['--featured']
  },
];

let totalRemoved = 0;

for (const { file, vars } of filesToClean) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log('✗ Skip (not found): ' + file);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let removed = 0;

  for (const v of vars) {
    // Match the full variable declaration line: --varname: value;
    // Also handle multi-line values
    const re = new RegExp('^\\s*' + v.replace(/-/g, '\\-') + '\\s*:\\s*[^;]+;\\s*$', 'gm');
    const before = content.length;
    content = content.replace(re, '');
    if (content.length < before) {
      removed++;
      totalRemoved++;
    }
  }

  // Clean up resulting blank lines (more than 2 consecutive)
  content = content.replace(/\n{3,}/g, '\n\n');

  fs.writeFileSync(filePath, content);
  console.log('✓ ' + file + ': removed ' + removed + '/' + vars.length + ' vars');
}

console.log('\nTotal variables removed: ' + totalRemoved);
