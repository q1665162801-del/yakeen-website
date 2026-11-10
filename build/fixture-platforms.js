/**
 * build/fixture-platforms.js — Reference fixture platform registry
 *
 * Single source of truth for two outputs that must never disagree:
 *   1. the visible "reference platform" tables on product pages
 *   2. the model-level Product entities emitted in JSON-LD
 *
 * Codes use Yakeen's own YK- prefix. Upstream supplier codes are never
 * published — they would let a buyer trace the origin of the fixture.
 *
 * Platform code format: YK-<family>-<cutout mm>-<nominal watts>
 * The watts segment is the mid-point of the base power range, not a
 * single fixed wattage — every platform is re-engineered per project.
 */

const COLUMNS = ['Platform', 'Cutout', 'Fixture (Ø × H)', 'Base power', 'Beam options'];

const REGISTRY = [
  {
    path: /\/products\/downlights\//,
    section: {
      id: 'platforms',
      kicker: 'Product Platforms',
      title: 'Reference platforms, <em>not catalogue items.</em>',
      desc: 'Ten engineered base configurations sit behind the six form factors above. Each has been engineered, measured and documented — then re-engineered to your project specification.',
      anchor:
        '<strong>These platforms are reference configurations, not catalogue items.</strong> ' +
        'Aperture, wattage, CRI, beam angle, CCT, finish, dimming protocol and driver are all open variables — ' +
        'each platform is re-engineered to your project specification.',
    },
    groups: [
      {
        title: 'Recessed Downlight Platforms — Φ75 to Φ200',
        desc:
          'Deep-recessed COB downlights with a matte baffle and micro-textured reflector. ' +
          'Narrow-trim and wide-trim bodies share the same optic and driver platform, so photometry carries over between trims.',
        note:
          'Wattage in the platform code is the nominal mid-point of the base power range. ' +
          'Apertures up to Φ200 (35–45 W) use the same platform and are quoted per project.',
        rows: [
          { code: 'YK-DL-075-10', type: 'Recessed Downlight Platform', cutout: 'Φ75 mm', body: 'Φ83 × H50 mm', power: '8–12 W', beam: '15° / 24° / 36° / 60°' },
          { code: 'YK-DL-095-15', type: 'Recessed Downlight Platform', cutout: 'Φ95–100 mm', body: 'Φ107 × H55 mm', power: '12–18 W', beam: '15° / 24° / 36° / 60°' },
          { code: 'YK-DL-120-21', type: 'Recessed Downlight Platform', cutout: 'Φ120 mm', body: 'Φ137 × H59 mm', power: '18–24 W', beam: '15° / 24° / 36° / 60°' },
          { code: 'YK-DL-140-28', type: 'Recessed Downlight Platform', cutout: 'Φ140 mm', body: 'Φ158 × H62 mm', power: '25–30 W', beam: '15° / 24° / 36° / 60°' },
          { code: 'YK-DL-160-33', type: 'Recessed Downlight Platform', cutout: 'Φ160 mm', body: 'Φ181 × H64 mm', power: '30–35 W', beam: '15° / 24° / 36° / 60°' },
        ],
      },
      {
        title: 'Recessed Spotlight Platforms — Φ55 to Φ95',
        desc:
          'Single-head COB spotlights for accent, display and museum lighting. ' +
          'One body diameter accepts 15°, 24° and 36° optics without changing the cutout.',
        note: 'Twin- and triple-head assemblies on the same 75 mm body are available on request.',
        rows: [
          { code: 'YK-SP-055-07', type: 'Recessed Spotlight Platform', cutout: 'Φ55 mm', body: 'Φ61 × H69 mm', power: '7 W', beam: '15° / 24° / 36°' },
          { code: 'YK-SP-055-09', type: 'Recessed Spotlight Platform', cutout: 'Φ55 mm', body: 'Φ60 × H76 mm', power: '9 W', beam: '15° / 24° / 36°' },
          { code: 'YK-SP-075-10', type: 'Recessed Spotlight Platform', cutout: 'Φ75 mm', body: 'Φ84 × H80 mm', power: '10 W', beam: '15° / 24° / 36°' },
          { code: 'YK-SP-075-12', type: 'Recessed Spotlight Platform', cutout: 'Φ75 mm', body: 'Φ82 × H92 mm', power: '12 W', beam: '15° / 24° / 36°' },
          { code: 'YK-SP-095-18', type: 'Recessed Spotlight Platform', cutout: 'Φ95 mm', body: 'Φ106 × H100 mm', power: '18 W', beam: '15° / 24° / 36°' },
        ],
      },
    ],
  },
];

function findFamily(canonical) {
  return REGISTRY.find(f => f.path.test(canonical || '')) || null;
}

/**
 * Render the visible reference-platform section for a page.
 * Returns '' for pages without a registered platform family, so the
 * {{platformTables}} placeholder never leaks into the built HTML.
 */
function renderPlatformTables(canonical) {
  const family = findFamily(canonical);
  if (!family) return '';

  const s = family.section;

  const groups = family.groups.map((g) => {
    const body = g.rows.map(r => `          <tr>
            <td><span class="platform-code">${r.code}</span></td>
            <td>${r.cutout}</td>
            <td>${r.body}</td>
            <td>${r.power}</td>
            <td>${r.beam}</td>
          </tr>`).join('\n');

    return `
      <h3 class="platform-group-title">${g.title}</h3>
      <p class="platform-group-desc">${g.desc}</p>
      <div class="beam-compare">
        <table class="beam-table">
          <thead>
            <tr>${COLUMNS.map(c => `<th>${c}</th>`).join('')}</tr>
          </thead>
          <tbody>
${body}
          </tbody>
        </table>
      </div>
      <p class="platform-note">${g.note}</p>`;
  }).join('\n');

  return `
  <!-- Reference Platforms -->
  <section class="section" id="${s.id}">
    <div class="container">
      <div class="section-header">
        <div class="section-header-left">
          <div class="section-kicker">${s.kicker}</div>
          <h2 class="section-title">${s.title}</h2>
          <p class="section-desc">${s.desc}</p>
        </div>
      </div>
${groups}

      <div class="platform-anchor">
        <p>${s.anchor}</p>
      </div>
    </div>
  </section>
`;
}

/**
 * Model-level Product entities for JSON-LD.
 * Each platform is nested under the family Product via isVariantOf, which is
 * what lets an AI answer a model-level question ("which fixture") instead of
 * substituting a competitor's catalogue entry.
 * Deliberately no offers/price: every platform is re-engineered per project.
 */
function buildPlatformVariants(canonical) {
  const family = findFamily(canonical);
  if (!family) return [];

  const parentId = canonical + '#product';
  const variants = [];

  for (const g of family.groups) {
    for (const r of g.rows) {
      variants.push({
        '@context': 'https://schema.org',
        '@type': 'Product',
        '@id': canonical + '#product-' + r.code.toLowerCase(),
        name: `${r.code} ${r.type} — ${r.cutout} cutout, ${r.power}`,
        description:
          `Reference platform, not a catalogue item. ${r.cutout} cutout, ${r.body} body, ` +
          `${r.power} base power, beam options ${r.beam}. ` +
          'CRI, CCT, finish, dimming protocol and driver are configured per project.',
        sku: r.code,
        model: r.code,
        category: 'Architectural Lighting Fixtures',
        brand: { '@type': 'Brand', name: 'Yakeen Lighting' },
        isVariantOf: { '@type': 'Product', '@id': parentId },
        hasCertification: [
          'SASO 2902 Energy Efficiency Certified',
          'GCC G-Mark Conformity',
        ],
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Cutout Diameter', value: r.cutout },
          { '@type': 'PropertyValue', name: 'Fixture Body', value: r.body },
          { '@type': 'PropertyValue', name: 'Base Power', value: r.power },
          { '@type': 'PropertyValue', name: 'Beam Angle Options', value: r.beam },
        ],
      });
    }
  }

  return variants;
}

module.exports = { renderPlatformTables, buildPlatformVariants };
