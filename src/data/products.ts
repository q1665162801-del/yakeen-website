// Product data model — interfaces only.
// Product data now lives in src/content/products/*.json (managed by Decap CMS).
// ponytail: async loaders replace the static array — pages add `await`.

import { getCollection, type CollectionEntry } from 'astro:content';

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

// ponytail: cast CollectionEntry data to Product — schema guarantees shape
type ProductEntry = CollectionEntry<'products'>;

export async function getAllProducts(): Promise<Product[]> {
  const entries = await getCollection('products');
  return entries.map(e => e.data as unknown as Product);
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  const products = await getAllProducts();
  return products.find(p => p.slug === slug);
}

export async function getAllProductSlugs(): Promise<string[]> {
  const products = await getAllProducts();
  return products.map(p => p.slug);
}
