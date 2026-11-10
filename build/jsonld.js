/**
 * build/jsonld.js — JSON-LD schema builder
 * Handles: WebPage, TechArticle, Product, Service schemas
 */
const { SITE_BASE } = require('./config');
const { buildPlatformVariants } = require('./fixture-platforms');

// Ensure image/logo URLs are absolute (JSON-LD requires full URLs)
function absUrl(url) {
  // 与 build/page.js 的 ogImage 默认值保持一致；og-default.jpg 从未存在过，
  // 会让 JSON-LD 的 image 指向 404（Check 14 已能拦住这类问题）。
  if (!url) return SITE_BASE + 'images/logo-yakeen.png';
  if (/^https?:\/\//i.test(url)) return url;
  // Remove leading ./ or / and any ../ segments for clean absolute URL
  let clean = url.replace(/^\.\//, '').replace(/^\//, '');
  // Handle relative paths with ../ by just taking the filename part after images/
  const imgMatch = clean.match(/(images\/.+)$/i);
  if (imgMatch) return SITE_BASE + imgMatch[1];
  return SITE_BASE + clean;
}

// Arabic FAQ Q&A set — mirrors the visible FAQ section on Arabic pages
const ARABIC_FAQ_MAIN_ENTITY = [
  {
    '@type': 'Question',
    name: 'ما الذي يميّز ياكين للإضاءة عن شركات الإضاءة الأخرى؟',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'ياكين للإضاءة شريك هندسي متخصص في الإضاءة المعمارية عالية المواصفات، وليس مجرد شركة تجارية. نهندس ونراقب جودة الوحدات عبر شركاء إنتاج معتمدين، مع دعم شهادات SASO وG-Mark وCE. مراجعة المواصفات خلال 48 ساعة، وضمان 5 سنوات، وعينات متاحة قبل الالتزام.',
    },
  },
  {
    '@type': 'Question',
    name: 'هل منتجاتكم معتمدة للسعودية والشرق الأوسط؟',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'نعم. خطوط منتجاتنا الأساسية حاصلة على شهادة كفاءة الطاقة SASO 2902 وشهادة علامة الخليج G-Mark بالكامل. نوفر دعماً كاملاً لتسجيل سابر/IECEE، وامتثال MOIAT/ECAS لدولة الإمارات، وحزم وثائق كاملة لتخليص جمركي سلس في جميع دول مجلس التعاون الخليجي.',
    },
  },
  {
    '@type': 'Question',
    name: 'ما هو الحد الأدنى لحجم المشروع؟',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'لا يوجد حد أدنى صارم للوحدات الهندسية عالية المواصفات. نعمل مع مشاريع بجميع الأحجام — من محلات التجزئة البوتيك إلى التطويرات الفندقية واسعة النطاق. نقدم المواصفات والتسعير لـ 5 وحدات أو 5000 وحدة، وكل مشروع يحصل على نفس الاهتمام الهندسي ومراقبة الجودة.',
    },
  },
  {
    '@type': 'Question',
    name: 'كم يستغرق مشروع الإضاءة الهندسي؟',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'الجدول الزمني المعتاد: 48 ساعة للعرض التقديمي والتسعير، 7–10 أيام لتطوير العينة الهندسية، 20–30 يوماً للإنتاج الكمي، و15–25 يوماً للشحن البحري. تتوفر خيارات مستعجلة للمشاريع العاجلة، ونوفر وثائق كاملة لمراقبة الجودة والشهادات قبل الشحن.',
    },
  },
];

function buildPageSchema(fm, base) {
  const schemas = [];
  const type = fm.type || 'webpage';

  // WebPage schema (all pages)
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': fm.canonical + '#webpage',
    url: fm.canonical,
    name: fm.title,
    description: fm.description,
    inLanguage: fm.lang || 'en',
    isPartOf: {
      '@type': 'WebSite',
      '@id': SITE_BASE + '#website',
    },
  });

  // Article schema (blog posts, insights, guides)
  if (type === 'article' || fm.datePublished) {
    const article = {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      '@id': fm.canonical + '#article',
      headline: fm.title,
      description: fm.description,
      image: [absUrl(fm.ogImage)],
      datePublished: fm.datePublished || '',
      dateModified: fm.dateModified || fm.datePublished || '',
      author: {
        '@type': 'Person',
        name: 'Alan Ma',
        url: SITE_BASE + 'about',
        worksFor: {
          '@type': 'Organization',
          name: 'Yakeen Lighting',
          url: SITE_BASE,
        },
      },
      publisher: {
        '@type': 'Organization',
        name: 'Yakeen Lighting',
        logo: {
          '@type': 'ImageObject',
          url: SITE_BASE + 'images/logo-yakeen.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': fm.canonical,
      },
      inLanguage: fm.lang || 'en',
      articleSection: fm.articleSection || 'Lighting Specification',
    };

    if (fm.keywords) article.keywords = fm.keywords;
    if (fm.articleBody) article.articleBody = fm.articleBody;
    if (fm.expertiseLevel) article.educationalLevel = fm.expertiseLevel;

    schemas.push(article);
  }

  // Product pages use Service schema — Yakeen sells custom lighting engineering
  // services, not off-the-shelf retail products. Service schema avoids
  // price/availability/review requirements that don't apply to B2B custom work.
  if (type === 'product') {
    const service = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': fm.canonical + '#service',
      name: fm.productName || fm.title,
      description: fm.description,
      image: absUrl(fm.ogImage),
      url: fm.canonical,
      serviceType: 'Custom Architectural Lighting',
      provider: { '@type': 'Organization', name: 'Yakeen Lighting' },
      areaServed: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Oman', 'Bahrain'],
      hasCertification: [
        'SASO 2902 Energy Efficiency Certified',
        'GCC G-Mark Conformity',
        'CE Marking (LVD + EMC)',
      ],
      isRelatedTo: [
        { '@type': 'Service', name: 'Lighting Specification Support' },
        { '@type': 'Service', name: 'Photometric Design' },
        { '@type': 'Service', name: 'Custom Engineering' },
        { '@type': 'Service', name: 'SASO / G-Mark Certification Assistance' },
      ],
    };

    const props = [];
    const specMap = {
      criValue: ['Color Rendering Index (CRI)', 'Ra'],
      r9Value: ['R9 Red Rendering', ''],
      ugrValue: ['Unified Glare Rating (UGR)', ''],
      wattage: ['Power Consumption', 'W'],
      lumens: ['Luminous Flux', 'lm'],
      efficacy: ['Luminous Efficacy', 'lm/W'],
      beamAngle: ['Beam Angle', '°'],
      ipRating: ['Ingress Protection Rating', ''],
      dimmingProtocols: ['Dimming Protocols', ''],
      colorTemp: ['Color Temperature', 'K'],
      warrantyYears: ['Warranty Period', 'years'],
      lifespanHours: ['Rated Lifespan (L70)', 'hours'],
      testingStandards: ['Testing Standards', ''],
    };

    for (const [key, [name, unit]] of Object.entries(specMap)) {
      if (fm[key]) {
        props.push({
          '@type': 'PropertyValue',
          name,
          value: fm[key],
          unitText: unit,
        });
      }
    }

    if (props.length > 0) service.additionalProperty = props;
    schemas.push(service);

    // Product entity — lets AI answer model-level questions ("who makes
    // UGR<19 anti-glare downlights certified to SASO 2902"). Only emitted for
    // actual fixture families (pages that declare productName); the /products/
    // hub is a category listing and must not become a Product entity.
    // No price/offers are declared because every fixture is engineered to spec.
    if (fm.productName) {
      const skuSlug = (fm.canonical || '')
      .replace(/^https?:\/\/[^/]+/, '')
      .replace(/\/$/, '')
      .split('/')
      .filter(Boolean)
      .pop() || 'lighting';
    const product = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': fm.canonical + '#product',
      name: fm.productName || fm.title,
      description: fm.description,
      image: absUrl(fm.ogImage),
      url: fm.canonical,
      sku: 'YK-' + skuSlug.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
      category: 'Architectural Lighting Fixtures',
      brand: { '@type': 'Brand', name: 'Yakeen Lighting' },
      audience: {
        '@type': 'BusinessAudience',
        audienceType: 'Architects, lighting designers, MEP consultants and contractors in the GCC',
      },
      hasCertification: [
        'SASO 2902 Energy Efficiency Certified',
        'GCC G-Mark Conformity',
      ],
    };
    if (props.length > 0) product.additionalProperty = props;
    schemas.push(product);

    // Model-level entities. A category-only Product ("Architectural COB Downlights")
    // gives an AI nothing concrete to cite, so it substitutes another brand's
    // catalogue entry. Each reference platform is therefore published as its own
    // Product nested under the family via isVariantOf — the same physical fixture,
    // still priced per project (no offers, no price).
    // Arabic pages stay variant-free until the Arabic platform table ships, so
    // the structured data never describes models that are not visible on that page.
    if (fm.lang !== 'ar') {
      for (const variant of buildPlatformVariants(fm.canonical)) schemas.push(variant);
    }
    }
  }

  // Service schema (solutions pages)
  if (type === 'service') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: fm.serviceName || fm.title,
      description: fm.description,
      provider: { '@type': 'Organization', name: 'Yakeen Lighting' },
      areaServed: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Oman', 'Bahrain'],
    });
  }

  // Country / Market page schema — coverage signals for AI crawlers.
  // Deliberately a Service, not a LocalBusiness: Yakeen has no office or
  // entity in the GCC, so a LocalBusiness with a GCC address would state
  // something untrue. Coverage is expressed via areaServed + provider.
  if (type === 'country') {
    const service = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `Yakeen Lighting — ${fm.countryName || fm.title}`,
      description: fm.description,
      url: fm.canonical,
      image: absUrl(fm.ogImage),
      areaServed: fm.countryName ? [{ '@type': 'Country', name: fm.countryName }] : [],
      provider: {
        '@type': 'Organization',
        name: 'Yakeen Lighting',
        url: 'https://www.yakeenlighting.com',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Taiyuan',
          addressRegion: 'Shanxi',
          addressCountry: 'CN',
        },
      },
    };

    if (fm.certifications) {
      service.hasOfferCatalog = {
        '@type': 'OfferCatalog',
        name: `Specification-Grade Lighting — ${fm.countryName || ''}`,
        itemListElement: fm.certifications.split(',').map(c => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: c.trim() + ' Certified Lighting',
          },
        })),
      };
    }

    // Service type for lighting design, supply and controls
    service.hasOfferCatalog = service.hasOfferCatalog || {
      '@type': 'OfferCatalog',
      name: 'Lighting Design & Supply',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Architectural Lighting Design' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Lighting Supply & Specification' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Lighting Control Systems' } },
      ],
    };

    schemas.push(service);
  }

  // FAQ schema (opt-in via front-matter faq: true)
  if (fm.faq === true) {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What makes Yakeen Lighting different from other lighting companies?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yakeen Lighting specializes in specification-grade architectural lighting. We engineer and quality-control premium fixtures through our vetted production partners, with SASO, G-Mark, and CE certification support. 48-hour specification reviews, 5-year warranty, and samples available before you commit.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can you engineer fixtures to our project specification?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes — that\'s our core engineering capability. Send us your specification or lighting design intent, and our engineering team will deliver fixtures built to exactly those parameters. We handle optical design (beam angles from 10° to 120°, CRI 80/90/95/98, UGR<19 anti-glare), mechanical engineering (precision sizes, housings, RAL color matching), and control specification (DALI/0-10V/TRIAC dimming, smart controls, emergency backup). Every fixture comes with full photometric data.',
          },
        },
        {
          '@type': 'Question',
          name: 'Are your products certified for Saudi Arabia and the Middle East?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, our core product lines are fully SASO 2902 energy efficiency certified and GCC G-Mark certified. We also provide full SABER/IECEE registration support, MOIAT/ECAS compliance for UAE, and complete documentation packages for smooth customs clearance across all GCC countries.',
          },
        },
        {
          '@type': 'Question',
          name: 'What\'s the minimum project size?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'There\'s no strict minimum for specification-grade engineered fixtures. We work with projects of all sizes — from boutique retail fit-outs to large-scale hospitality developments. We specify and price for 5 units or 5,000 units. Every project gets the same engineering attention and quality control.',
          },
        },
        {
          '@type': 'Question',
          name: 'How long does an engineered lighting project take?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Typical timeline: 48 hours for proposal and quotation, 7-10 days for engineered sample development, 20-30 days for mass production, and 15-25 days for sea freight. Rush options are available for urgent projects. We provide full QC and certification documentation before shipment.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is specification-grade LED lighting?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Specification-grade LED lighting refers to commercial and architectural luminaires engineered to meet precise performance criteria for professional projects. Spec-grade fixtures have verified photometric data (IES files), controlled color consistency (MacAdam 3-step), documented driver performance, LM-80 validated thermal management, and published efficiency ratings. They are used by architects, lighting designers, and MEP engineers who need to write fixtures into construction specifications with performance guarantees.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the difference between commercial grade and specification grade lighting?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Commercial-grade lighting is built for basic commercial use with acceptable performance. Specification-grade lighting is a higher tier designed for architectural specification — it includes full IES photometric testing reports, tighter color tolerances, better optical control (UGR ratings, precise beam angles), 5+ year warranties, premium drivers (Philips Xitanium, Tridonic), and complete submittal documentation. Spec-grade fixtures can be written into project specifications with performance guarantees.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is SASO 2902 certification for LED lighting?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'SASO 2902 is the Saudi Standards, Metrology and Quality Organization\'s energy efficiency certification program for lighting products sold in Saudi Arabia. It sets minimum efficacy (lumens per watt) requirements for LED lamps and luminaires. Products must be tested by an accredited laboratory and registered through the SABER platform to obtain a Certificate of Conformity before customs clearance. SASO 2902 covers both energy performance and IEC 60598-1 safety requirements.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is G-Mark certification for lighting products?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'G-Mark (Gulf Conformity Mark) is a regional certification mark indicating that a product meets Gulf Standardization Organization (GSO) technical requirements. For LED lighting, G-Mark demonstrates compliance with Gulf safety and performance standards. It simplifies market access across all six GCC countries (Saudi Arabia, UAE, Qatar, Kuwait, Oman, Bahrain) and is increasingly required for government and large-scale commercial tenders.',
          },
        },
        {
          '@type': 'Question',
          name: 'What does UGR less than 19 mean?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'UGR (Unified Glare Rating) is a standardized measure of discomfort glare from interior luminaires. UGR < 19 means the fixture produces low enough glare for general office environments where people work at screens and on documents. Achieving UGR < 19 requires deep-recessed optics, louvers, or specific lens designs. It is the standard glare requirement for open-plan offices, meeting rooms, and educational spaces.',
          },
        },
      ],
    };
    // Arabic pages get the Arabic Q&A set (mirrors the visible Arabic FAQ section)
    if (fm.lang === 'ar') faqSchema.mainEntity = ARABIC_FAQ_MAIN_ENTITY;
    schemas.push(faqSchema);
  }

  if (schemas.length === 0) return '';

  return schemas.map(s =>
    `<script type="application/ld+json">${JSON.stringify(s)}</script>`
  ).join('\n');
}

// ─── BreadcrumbList schema builder ───
// Builds a breadcrumb JSON-LD from an array of [{name, url}] items
function buildBreadcrumbSchema(items, canonical) {
  const listItems = items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: item.url || (i === items.length - 1 ? canonical : undefined),
  }));

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': canonical + '#breadcrumb',
    itemListElement: listItems,
  };

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

module.exports = { buildPageSchema, buildBreadcrumbSchema };

// ─── FAQPage schema auto-extractor ───
// Scans HTML content for an FAQ section and extracts Q&A pairs.
// Section discovery, in priority order:
//   1. <section> whose class contains "faq" (faq-section, local-faq-section, ...)
//   2. an .eyebrow / .section-label element whose text contains "FAQ"
//   3. a heading (h2/h3) containing "FAQ" or "Frequently Asked"
// Questions may be marked up as h3 OR h4 (site uses both patterns).
// Returns an HTML string with the FAQPage JSON-LD script tag, or '' if no FAQ found.
function extractFaqSchema(html, canonical) {
  if (!html) return '';

  let faqSection = '';

  // Strategy 1: section with faq in its class
  const sectionMatch = html.match(/<section[^>]*class="[^"]*faq[^"]*"[^>]*>/i);
  if (sectionMatch) {
    const start = sectionMatch.index + sectionMatch[0].length;
    const end = html.indexOf('</section>', start);
    if (end !== -1) faqSection = html.slice(start, end);
  }

  // Strategy 2: eyebrow/section-label text containing "FAQ"
  if (!faqSection) {
    const labelMatch = html.match(/<(?:div|span)[^>]*class="(?:eyebrow|section-label)"[^>]*>\s*[^<]*FAQ[^<]*<\s*\/(?:div|span)>/i);
    if (labelMatch) {
      const start = labelMatch.index + labelMatch[0].length;
      const end = html.indexOf('</section>', start);
      if (end !== -1) faqSection = html.slice(start, end);
    }
  }

  // Strategy 3: heading containing "FAQ" / "Frequently Asked" (legacy pattern)
  if (!faqSection) {
    const faqHeadingRegex = /<h[23][^>]*>\s*.*?(FAQ|Frequently Asked Questions|Frequently Asked).*?<\/h[23]>/i;
    const faqMatch = html.match(faqHeadingRegex);
    if (faqMatch) {
      const start = faqMatch.index + faqMatch[0].length;
      const end = html.indexOf('</section>', start);
      faqSection = html.slice(start, end !== -1 ? end : undefined);
    }
  }

  if (!faqSection) return '';

  // Extract Q&A pairs: h3 or h4 questions followed by <p> answers
  const qaPairs = [];
  const qaRegex = /<(h[34])[^>]*>([\s\S]*?)<\/h[34]>\s*(<p[\s\S]*?<\/p>)/g;
  let match;

  while ((match = qaRegex.exec(faqSection)) !== null) {
    const question = match[2].replace(/<[^>]+>/g, '').trim();
    const answer = match[3].replace(/<[^>]+>/g, '').trim();

    if (question && answer && answer.length > 20) {
      qaPairs.push({ question, answer });
    }

    // Limit to 10 Q&A pairs max
    if (qaPairs.length >= 10) break;
  }

  if (qaPairs.length < 2) return ''; // Need at least 2 Q&A for a valid FAQPage

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': canonical + '#faq',
    mainEntity: qaPairs.map(qa => ({
      '@type': 'Question',
      name: qa.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: qa.answer,
      },
    })),
  };

  return `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
}

module.exports = { buildPageSchema, buildBreadcrumbSchema, extractFaqSchema };
