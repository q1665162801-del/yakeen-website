// Product data model — interfaces only.
// ponytail: Sanity-first with local JSON fallback — zero downtime during migration.
// If SANITY_PROJECT_ID is set → fetch from Sanity Content Lake.
// If not set or fetch fails → fall back to local JSON (Content Collections).

import { getCollection, type CollectionEntry } from 'astro:content';
import { sanityEnabled, fetchAllProductsFromSanity, fetchProductFromSanity } from '../lib/sanity';

export interface ProductSpec {
  wattage: string;
  efficacy: string;
  cct: string;
  cri: string;
  beamAngle: string;
  ipRating: string;
  dimming: string;
  lifespan: string;
  warranty: string;
  certifications: string;
  moq: string;
  leadTime: string;
}

export interface ProductLocalized {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  features: string[];
  applications: { title: string; desc: string }[];
  faqs: { question: string; answer: string }[];
  caseStudy: { title: string; location: string };
}

export interface Product {
  slug: string;
  name: string;
  shortName: string;
  category: string;
  tagline: string;
  description: string;
  metaDescription: string;
  ogImage: string;
  mainImage: string;
  galleryImages: string[];
  sceneImage: string;
  specs: ProductSpec;
  applications: { title: string; desc: string; icon: string }[];
  features: string[];
  faqs: { question: string; answer: string }[];
  caseStudy: { title: string; location: string; year: string; image: string };
  ar?: ProductLocalized;
  featured?: boolean;
}

// ponytail: local JSON fallback — same as before, unchanged
type ProductEntry = CollectionEntry<'products'>;

async function getLocalProducts(): Promise<Product[]> {
  const entries = await getCollection('products');
  return entries.map(e => e.data as unknown as Product);
}

// ponytail: try Sanity first, fall back to local JSON on any error
export async function getAllProducts(): Promise<Product[]> {
  if (sanityEnabled) {
    try {
      const products = await fetchAllProductsFromSanity();
      if (products.length > 0) return products;
      console.warn('[sanity] No products found, falling back to local JSON');
    } catch (err) {
      console.warn('[sanity] Fetch failed, falling back to local JSON:', err);
    }
  }
  return getLocalProducts();
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  if (sanityEnabled) {
    try {
      const product = await fetchProductFromSanity(slug);
      if (product) return product;
    } catch (err) {
      console.warn('[sanity] Fetch failed, falling back to local JSON:', err);
    }
  }
  const products = await getLocalProducts();
  return products.find(p => p.slug === slug);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const products = await getAllProducts();
  return products.map(p => p.slug);
}
