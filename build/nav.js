/**
 * build/nav.js — Navigation renderer
 * 
 * Reads nav data from src/data/nav.json and renders the full navigation
 * HTML. This replaces the hardcoded nav.html template.
 * 
 * Benefits:
 * - Menu items are data-driven — edit JSON, not HTML
 * - Same data can power mobile nav, footer nav, breadcrumbs
 * - Easy to add/remove items without touching template markup
 * - Supports Arabic (RTL) with labelAr fields
 */

const fs = require('fs');
const path = require('path');
const { SRC } = require('./config');

const NAV_DATA_PATH = path.join(SRC, 'data', 'nav.json');

function loadNavData() {
  if (!fs.existsSync(NAV_DATA_PATH)) {
    throw new Error(`Nav data not found: ${NAV_DATA_PATH}`);
  }
  let content = fs.readFileSync(NAV_DATA_PATH, 'utf-8');
  // Strip UTF-8 BOM if present (editors like PowerShell may add it)
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return JSON.parse(content);
}

// ─── Get label for current language ───
function getLabel(item, lang) {
  if (lang === 'ar' && item.labelAr) return item.labelAr;
  return item.label;
}

// ─── Get aria label for current language ───
function getAriaLabel(item, lang) {
  if (lang === 'ar' && item.ariaLabelAr) return item.ariaLabelAr;
  return item.ariaLabel;
}

// ─── Get href for current language ───
function getHref(item, lang) {
  if (lang === 'ar' && item.hrefAr) return item.hrefAr;
  return item.href;
}

// ─── Render a single nav item ───
function renderItem(item, base, lang) {
  const label = getLabel(item, lang);
  const href = base + getHref(item, lang);

  if (item.type === 'link') {
    return `        <a href="${href}" class="nav-link" role="menuitem">${label}</a>`;
  }

  if (item.type === 'dropdown') {
    const children = item.children.map(child => {
      const childLabel = getLabel(child, lang);
      const childHref = base + getHref(child, lang);
      const featuredClass = child.featured ? ' nav-dropdown-item--featured' : '';
      return `            <a href="${childHref}" class="nav-dropdown-item${featuredClass}" role="menuitem">${childLabel}</a>`;
    }).join('\n');

    return `        <div class="nav-dropdown" role="none">
          <a href="#" class="nav-link" role="menuitem" aria-haspopup="true" aria-expanded="false">${label} ▾</a>
          <div class="nav-dropdown-menu" role="menu">
${children}
          </div>
        </div>`;
  }

  if (item.type === 'lang') {
    const ariaLabel = getAriaLabel(item, lang);
    // The switch points at the *other* language, so the declared hreflang must
    // follow the page language, not a single static value — otherwise the
    // Arabic nav advertises an English target as `hreflang="ar"`.
    const hreflang = lang === 'ar' ? (item.hreflangAr || 'en') : item.hreflang;
    return `        <a href="{{arSwitchUrl}}" class="nav-link nav-link--ar {{arPartialClass}}" role="menuitem" hreflang="${hreflang}" aria-label="${ariaLabel}">
          ${label}
          {{arHintHtml}}
        </a>`;
  }

  return '';
}

// ─── Render full navigation HTML ───
function renderNav(base, variant, lang) {
  const data = loadNavData();
  const logoHref = base + getHref(data.logo, lang);
  const ctaHref = base + getHref(data.cta, lang);
  const logoAriaLabel = getAriaLabel(data.logo, lang);
  const ctaLabel = getLabel(data.cta, lang);

  const items = data.items
    .map(item => renderItem(item, base, lang))
    .filter(Boolean)
    .join('\n');

  const navAriaLabel = lang === 'ar' ? 'القائمة الرئيسية' : 'Main navigation';
  const toggleAriaLabel = lang === 'ar' ? 'فتح القائمة' : 'Toggle menu';

  return `<div class="grain-overlay" aria-hidden="true"></div>
<nav class="nav nav--${variant} nav--fixed" role="navigation" aria-label="${navAriaLabel}">
    <div class="container nav-inner">
      <a href="${logoHref}" class="nav-logo" aria-label="${logoAriaLabel}">
        <img loading="eager" src="${base}images/logo-yakeen.webp" alt="Yakeen Lighting" class="nav-logo-img">
      </a>
      <div class="nav-links" role="menubar">
${items}
      </div>
      <a href="${ctaHref}" class="nav-cta" role="button">${ctaLabel}</a>
      <button type="button" class="nav-toggle" aria-label="${toggleAriaLabel}" aria-expanded="false" aria-controls="mobile-menu">
        <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
      </button>
    </div>
  </nav>`;
}

module.exports = { renderNav, loadNavData };
