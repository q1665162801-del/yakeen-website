/**
 * schema.ts — JSON-LD structured data generators for Yakeen Lighting.
 *
 * Each generator returns a plain JSON-LD object that can be serialized into a
 * <script type="application/ld+json"> tag. All objects use the schema.org
 * vocabulary and pull canonical URLs / org info from siteConfig.
 */

import { siteConfig } from '@data/site-config';
import type { Product } from '@data/products';

/** Minimal JSON-LD base shape (every object starts with @context and @type). */
export interface JsonLd {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

/** Breadcrumb item shape consumed by breadcrumbSchema(). */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** FAQ entry shape consumed by faqPageSchema(). */
export interface FaqEntry {
  question: string;
  answer: string;
}

/** Helper: turn a root-relative path into an absolute URL. */
function absUrl(path: string): string {
  if (path.startsWith('http')) return path;
  return new URL(path, siteConfig.url).href;
}

/**
 * Organization schema — describes Yakeen Lighting as a business entity.
 * Embedded site-wide (every page) so search engines understand who we are.
 */
export function organizationSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    email: siteConfig.email,
    telephone: siteConfig.phone,
    taxID: siteConfig.taxId,
    founder: {
      '@type': 'Person',
      name: siteConfig.founder,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.region,
      postalCode: siteConfig.address.postalCode,
      addressCountry: siteConfig.address.country,
    },
    areaServed: siteConfig.areaServed.map((code) => ({
      '@type': 'Country',
      name: code,
    })),
    knowsAbout: [
      'Commercial LED Lighting',
      'Industrial LED Lighting',
      'Outdoor LED Lighting',
      'Architectural Lighting',
    ],
    hasCredential: siteConfig.certifications,
    logo: {
      '@type': 'ImageObject',
      url: absUrl('/assets/images/brand/logo.png'),
    },
    image: absUrl('/assets/images/hero/hero-bg-v3.jpg'),
    dateModified: '2026-08-02',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: siteConfig.email,
        telephone: siteConfig.phone,
        areaServed: siteConfig.areaServed,
        availableLanguage: ['English', 'Arabic', 'Chinese'],
      },
    ],
    sameAs: [
      siteConfig.social.linkedin,
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.social.youtube,
      siteConfig.social.alibaba,
    ].filter(Boolean),
  };
}

/**
 * Product schema — describes a single Yakeen product for rich results.
 *
 * `additionalProperty` lists all 12 commercial spec points (wattage, efficacy,
 * CCT, CRI, beam angle, IP rating, dimming, lifespan, warranty, certifications,
 * MOQ, lead time) so buyers (and crawlers) get full technical context.
 *
 * The offer is inquiry-type: no fixed retail price, quote-based B2B sales.
 * Google requires price to be numeric — omitting it is valid for inquiry-type offers.
 * ponytail: ceiling = no rich-result price snippet; upgrade path = add real pricing when available.
 */
export function productSchema(product: Product): JsonLd {
  const productUrl = absUrl(`/products/${product.slug}`);
  const imageUrl = absUrl(product.mainImage);

  const additionalProperty = [
    { name: 'Wattage', value: product.specs.wattage },
    { name: 'Luminous Efficacy', value: product.specs.efficacy },
    { name: 'Color Temperature', value: product.specs.cct },
    { name: 'CRI', value: product.specs.cri },
    { name: 'Beam Angle', value: product.specs.beamAngle },
    { name: 'IP Rating', value: product.specs.ipRating },
    { name: 'Dimming', value: product.specs.dimming },
    { name: 'Lifespan', value: product.specs.lifespan },
    { name: 'Warranty', value: product.specs.warranty },
    { name: 'Certifications', value: product.specs.certifications },
    { name: 'MOQ', value: product.specs.moq },
    { name: 'Lead Time', value: product.specs.leadTime },
  ].map((prop) => ({
    '@type': 'PropertyValue',
    name: prop.name,
    value: prop.value,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    description: product.metaDescription,
    category: product.category,
    image: [imageUrl, ...product.galleryImages.map((img) => absUrl(img))],
    url: productUrl,
    brand: {
      '@type': 'Brand',
      name: siteConfig.name,
    },
    manufacturer: {
      '@type': 'Organization',
      name: siteConfig.legalName,
      url: siteConfig.url,
    },
    additionalProperty,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      availability: 'https://schema.org/InStock',
      priceCurrency: 'USD',
      // ponytail: inquiry-type B2B pricing — no numeric price, Google accepts omission
      description: `MOQ ${product.specs.moq}. Contact Yakeen Lighting for a project-based quotation.`,
      eligibleQuantity: {
        '@type': 'QuantitativeValue',
        minValue: parseInt(product.specs.moq, 10) || 1,
        unitText: product.specs.moq,
      },
      seller: {
        '@type': 'Organization',
        name: siteConfig.name,
      },
      // ponytail: priceSpecification omitted — Google requires numeric price, "Contact for quote" triggers error
    },
  };
}

/**
 * BreadcrumbList schema — helps search engines render breadcrumb trails in
 * SERPs and clarifies site hierarchy.
 *
 * @param items ordered list of `{ name, url }` crumbs, root to current page.
 */
export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${absUrl(items[items.length - 1]?.url ?? '/')}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absUrl(item.url),
    })),
  };
}

/**
 * FAQPage schema — enables rich-result expandable FAQ accordions in SERPs.
 *
 * @param faqs list of `{ question, answer }` pairs.
 */
export function faqPageSchema(faqs: FaqEntry[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${siteConfig.url}/#faq`,
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * WebSite schema — enables sitelinks search box and clarifies site identity.
 * Optional helper, embedded on the homepage.
 */
export function websiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.tagline,
    publisher: { '@id': `${siteConfig.url}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/ai-assistant?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'en',
  };
}
