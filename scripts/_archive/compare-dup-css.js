/**
 * compare-dup-css.js
 *
 * Compares top-level CSS class definitions between:
 *   - css/components/modules.css
 *   - css/pages/chandeliers.css
 *
 * For each class that exists in BOTH files, extracts the full rule body
 * and compares them. Outputs:
 *   - Classes with identical rules (safe to delete from chandeliers.css)
 *   - Classes with different rules (need modifier class)
 *   - Summary of differences for non-identical rules
 */

const fs = require('fs');
const path = require('path');

// ── Paths ──────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, '..');
const FILE_A = path.join(ROOT, 'css', 'components', 'modules.css');
const FILE_B = path.join(ROOT, 'css', 'pages', 'chandeliers.css');

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Remove CSS comments from a string (both /* ... *\/ and // line comments).
 */
function stripComments(css) {
  // Block comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  // Line comments (not inside strings — basic approach is fine for our use case)
  css = css.replace(/(?<!:)\/\/[^\n]*/g, '');
  return css;
}

/**
 * Extract top-level .classname { ... } rules from CSS text.
 * Uses simple brace-counting to find matching closing braces.
 *
 * @param {string} css - Raw CSS text
 * @returns {Map<string, string>} Map of className → normalized rule body
 */
function extractTopLevelClasses(css) {
  const clean = stripComments(css);
  const rules = new Map();
  const len = clean.length;
  let i = 0;

  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(clean[i])) i++;
    if (i >= len) break;

    // Look for a top-level class selector: starts with '.'
    if (clean[i] !== '.') {
      // Skip this line / block — find the next '{' then past its matching '}'
      const nextBrace = clean.indexOf('{', i);
      if (nextBrace === -1) break;
      // Skip the entire block by brace counting
      let depth = 0;
      let j = nextBrace;
      while (j < len) {
        if (clean[j] === '{') depth++;
        else if (clean[j] === '}') {
          depth--;
          if (depth === 0) { j++; break; }
        }
        j++;
      }
      i = j;
      continue;
    }

    // We found a '.' — read the selector up to '{'
    // But first verify this is a simple top-level class selector
    // (not nested, not inside at-rule, not combined with other selectors like .a .b)
    const selectorStart = i;

    // Find the opening brace for this rule
    const openBrace = clean.indexOf('{', i);
    if (openBrace === -1) break;

    const selectorText = clean.substring(selectorStart, openBrace).trim();

    // Only match simple top-level class selectors like ".classname"
    // Reject if it contains spaces (descendant), commas (multiple selectors),
    // colons (pseudo), > (child), +, ~, etc.
    // We want ONLY plain .classname at top level.
    if (!/^\.[\w-]+$/.test(selectorText)) {
      // Not a simple top-level class. Skip the entire block.
      let depth = 0;
      let j = openBrace;
      while (j < len) {
        if (clean[j] === '{') depth++;
        else if (clean[j] === '}') {
          depth--;
          if (depth === 0) { j++; break; }
        }
        j++;
      }
      i = j;
      continue;
    }

    const className = selectorText; // e.g. ".section-kicker"

    // Brace-count to find matching closing brace
    let depth = 0;
    let j = openBrace;
    while (j < len) {
      if (clean[j] === '{') depth++;
      else if (clean[j] === '}') {
        depth--;
        if (depth === 0) break;
      }
      j++;
    }

    if (j >= len) {
      console.warn(`  Warning: unclosed block for ${className}`);
      break;
    }

    // Extract body (everything between { and })
    const body = clean.substring(openBrace + 1, j).trim();

    rules.set(className, body);

    i = j + 1;
  }

  return rules;
}

/**
 * Normalize a CSS rule body for comparison:
 * - Split into individual declarations
 * - Sort them
 * - Normalize whitespace
 * This way, order of properties doesn't matter.
 */
function normalizeBody(body) {
  // Split on ';' but be careful with nested semicolons (e.g. in url() or calc())
  // For most CSS, splitting on ';\n' or ';' at top level works.
  // Simpler approach: split by semicolon, trim each line, filter empties, sort.
  const declarations = body
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .sort();
  return declarations.join(';\n');
}

/**
 * Parse a CSS rule body into a Map of property → value.
 * Handles basic CSS property:value pairs.
 */
function parseDeclarations(body) {
  const decls = new Map();
  const lines = body.split(';');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = trimmed.substring(0, colonIdx).trim();
    const value = trimmed.substring(colonIdx + 1).trim();
    decls.set(prop, value);
  }
  return decls;
}

/**
 * Compute a human-readable diff summary between two rule bodies.
 * Returns array of difference descriptions.
 */
function diffRules(bodyA, bodyB) {
  const declsA = parseDeclarations(bodyA);
  const declsB = parseDeclarations(bodyB);
  const diffs = [];

  // Check all properties from A
  for (const [prop, valA] of declsA) {
    if (!declsB.has(prop)) {
      diffs.push(`  - only in modules.css: ${prop}: ${valA}`);
    } else if (declsB.get(prop) !== valA) {
      diffs.push(`  ~ ${prop}:`);
      diffs.push(`      modules.css:     ${valA}`);
      diffs.push(`      chandeliers.css: ${declsB.get(prop)}`);
    }
  }

  // Check properties only in B
  for (const [prop, valB] of declsB) {
    if (!declsA.has(prop)) {
      diffs.push(`  + only in chandeliers.css: ${prop}: ${valB}`);
    }
  }

  return diffs;
}

// ── Main ───────────────────────────────────────────────────────────

function main() {
  console.log('='.repeat(70));
  console.log('CSS Dup Compare: modules.css vs chandeliers.css');
  console.log('='.repeat(70));
  console.log();

  // Read files
  const cssA = fs.readFileSync(FILE_A, 'utf-8');
  const cssB = fs.readFileSync(FILE_B, 'utf-8');

  // Extract top-level classes
  const rulesA = extractTopLevelClasses(cssA);
  const rulesB = extractTopLevelClasses(cssB);

  console.log(`Found ${rulesA.size} top-level classes in modules.css`);
  console.log(`Found ${rulesB.size} top-level classes in chandeliers.css`);
  console.log();

  // Find common classes
  const commonClasses = [...rulesB.keys()].filter(cls => rulesA.has(cls));

  console.log(`Found ${commonClasses.length} class(es) present in BOTH files:`);
  if (commonClasses.length === 0) {
    console.log('  (none)');
    console.log();
    console.log('Classes only in chandeliers.css:');
    for (const cls of rulesB.keys()) {
      console.log(`  ${cls}`);
    }
    return;
  }
  console.log();

  const identical = [];
  const different = [];

  for (const cls of commonClasses) {
    const bodyA = rulesA.get(cls);
    const bodyB = rulesB.get(cls);
    const normA = normalizeBody(bodyA);
    const normB = normalizeBody(bodyB);

    if (normA === normB) {
      identical.push(cls);
    } else {
      different.push({ cls, bodyA, bodyB });
    }
  }

  // ── Output: identical ──────────────────────────────────────────
  console.log('─'.repeat(70));
  console.log('IDENTICAL (can safely delete from chandeliers.css):');
  console.log('─'.repeat(70));
  if (identical.length === 0) {
    console.log('  (none)');
  } else {
    for (const cls of identical) {
      console.log(`  ${cls}`);
    }
  }
  console.log();

  // ── Output: different ──────────────────────────────────────────
  console.log('─'.repeat(70));
  console.log(`DIFFERENT (${different.length}) — need modifier class or manual review:`);
  console.log('─'.repeat(70));
  console.log();

  for (const { cls, bodyA, bodyB } of different) {
    console.log(cls);
    const diffs = diffRules(bodyA, bodyB);
    for (const line of diffs) {
      console.log(line);
    }
    console.log();
  }

  // ── Summary ────────────────────────────────────────────────────
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`  Common classes:     ${commonClasses.length}`);
  console.log(`  Identical:          ${identical.length}  ← safe to remove from chandeliers.css`);
  console.log(`  Different:          ${different.length}  ← need attention`);
  console.log(`  Only in modules:    ${rulesA.size - commonClasses.length}`);
  console.log(`  Only in chandeliers: ${rulesB.size - commonClasses.length}`);
}

main();
