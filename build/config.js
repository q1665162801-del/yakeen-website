﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿/**
 * build/config.js — Shared build paths and constants
 */
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const TEMPLATES = path.join(SRC, 'templates');
const PAGES = path.join(SRC, 'pages');
const DIST = path.join(ROOT, 'dist');

const SITE_BASE = 'https://www.yakeenlighting.com/';

const CSS_FILES = [
  // Fonts — self-hosted Arabic typeface (must precede tokens)
  'fonts.css',
  // Foundation — design tokens & base reset
  'tokens.css',
  'base.css',
  'layout.css',
  'utilities.css',
  'animations.css',
  // Components — buttons, cards, forms, modules
  'components/index.css',
  'components/whatsapp-widget.css',
  'components/form-enhance.css',
  'components/internal-links.css',
  'components/newsletter-modal.css',
  'components/marquee.css',
  // Sections — page sections (order = DOM order)
  'sections/misc.css',
  'sections/blog.css',
  'sections/hero.css',
  'sections/features.css',
  'sections/products.css',
  'sections/projects.css',
  'sections/markets.css',
  'sections/about.css',
  'sections/form.css',
  'sections/cta.css',
  // Page-specific
  'pages/certifications.css',
  'pages/contact.css',
  'pages/faq.css',
  'pages/home-ar.css',
  'pages/home.css',
  'pages/offline.css',
  'pages/projects.css',
  'pages/request-sample.css',
  'pages/resources.css',
  'pages/specification.css',
  'pages/start-project-ar.css',
  'pages/testing-quality.css',
  // Theme — light theme color overrides
  'themes/light.css',
  // Responsive — mobile overrides
  'responsive.css',
  // Refinements — luxury polish overlay (FINAL layer, beats everything above)
  'refinements.css',
];

const STATIC_DIRS = ['images', 'assets'];

// Single JS bundle — all scripts concatenated, content-hashed for cache-busting
const JS_BUNDLES = [
  {
    output: 'yakeen', // base name; hash gets appended: yakeen.abc123.js
    files: [
      'conversion-tracking.js',
      'nav-scroll.js',
      'nav-dropdown.js',
      'mobile-nav.js',
      'scroll-reveal.js',
      'micro-effects.js',
      'accordion.js',
      'whatsapp-widget.js',
      'form-submit.js',
      'form-enhance.js',
      'stats-counter.js',
      'product-cta.js',
      'newsletter-modal.js',
    ],
  },
];

const ROOT_FILES = [
  'robots.txt',
  'llms.txt',
  '_headers',
  '_redirects',
  'favicon.svg',
  'favicon-32.png',
  'icon-192.png',
  'icon-512.png',
  'manifest.webmanifest',
  'sw.js',
  '5f6a7e8b4c3d2e1f5f6a7e8b4c3d2e1f.txt',
];

// Analytics — third-party IDs. Empty string = provider disabled, zero bytes shipped.
const ANALYTICS = {
  ga4MeasurementId: '',       // Google Analytics 4 — e.g. 'G-XXXXXXXXXX'
  clarityProjectId: '',       // Microsoft Clarity — e.g. 'abcdefghij'
  cloudflareBeaconToken: '',  // Cloudflare Web Analytics — beacon token
};

module.exports = {
  ROOT,
  SRC,
  TEMPLATES,
  PAGES,
  DIST,
  SITE_BASE,
  CSS_FILES,
  JS_BUNDLES,
  STATIC_DIRS,
  ROOT_FILES,
  ANALYTICS,
};
