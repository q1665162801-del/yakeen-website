// ponytail: one dependency (@sanity/client), one GROQ query, image URLs resolved in-query
// No @sanity/image-url needed — GROQ resolves mainImage.asset->url directly.
import { createClient } from '@sanity/client';
import type { Product } from '../data/products';

const projectId = import.meta.env.SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET || 'production';

// ponytail: if no project ID, site falls back to local JSON (zero downtime transition)
export const sanityEnabled = !!projectId;

export const sanityClient = sanityEnabled
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2025-02-06',
      useCdn: false, // static build — always fetch fresh
      perspective: 'published',
    })
  : null;

// GROQ: resolve image URLs in-query, shape matches Product interface exactly
const ALL_PRODUCTS_QUERY = `*[_type == "product"] | order(name asc) {
  "slug": slug.current,
  name, shortName, category, tagline, description, metaDescription,
  "mainImage": coalesce(mainImage.asset->url, ""),
  "sceneImage": coalesce(sceneImage.asset->url, ""),
  "ogImage": coalesce(ogImage, ""),
  galleryImages,
  specs,
  applications,
  features,
  faqs,
  caseStudy,
  ar,
  featured
}`;

const SINGLE_PRODUCT_QUERY = `*[_type == "product" && slug.current == $slug][0]{
  "slug": slug.current,
  name, shortName, category, tagline, description, metaDescription,
  "mainImage": coalesce(mainImage.asset->url, ""),
  "sceneImage": coalesce(sceneImage.asset->url, ""),
  "ogImage": coalesce(ogImage, ""),
  galleryImages,
  specs,
  applications,
  features,
  faqs,
  caseStudy,
  ar,
  featured
}`;

export async function fetchAllProductsFromSanity(): Promise<Product[]> {
  if (!sanityClient) return [];
  const results = await sanityClient.fetch(ALL_PRODUCTS_QUERY);
  // ponytail: ogImage fallback to mainImage if not set
  return (results || []).map((p: any) => ({
    ...p,
    ogImage: p.ogImage || p.mainImage || '',
    galleryImages: p.galleryImages || [],
    applications: p.applications || [],
    features: p.features || [],
    faqs: p.faqs || [],
    featured: p.featured || false,
  })) as Product[];
}

export async function fetchProductFromSanity(slug: string): Promise<Product | undefined> {
  if (!sanityClient) return undefined;
  const result = await sanityClient.fetch(SINGLE_PRODUCT_QUERY, { slug });
  if (!result) return undefined;
  return {
    ...result,
    ogImage: result.ogImage || result.mainImage || '',
    galleryImages: result.galleryImages || [],
    applications: result.applications || [],
    features: result.features || [],
    faqs: result.faqs || [],
    featured: result.featured || false,
  } as Product;
}
