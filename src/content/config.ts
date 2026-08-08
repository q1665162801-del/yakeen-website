// ponytail: Astro 5 Content Collection schema — 1:1 match with Product interface
// Decap CMS writes JSON to src/content/products/*.json, this validates it.
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const products = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/products' }),
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    shortName: z.string(),
    category: z.string(),
    tagline: z.string(),
    description: z.string(),
    metaDescription: z.string().optional().default(''),
    ogImage: z.string().optional().default(''),
    mainImage: z.string(),
    galleryImages: z.array(z.string()).default([]),
    sceneImage: z.string().optional().default(''),
    specs: z.object({
      wattage: z.string(),
      efficacy: z.string(),
      cct: z.string(),
      cri: z.string().optional().default(''),
      beamAngle: z.string().optional().default(''),
      ipRating: z.string().optional().default(''),
      dimming: z.string().optional().default(''),
      lifespan: z.string().optional().default(''),
      warranty: z.string().optional().default(''),
      certifications: z.string().optional().default(''),
      moq: z.string().optional().default(''),
      leadTime: z.string().optional().default(''),
    }),
    applications: z.array(z.object({
      title: z.string(),
      desc: z.string().optional().default(''),
      icon: z.string().optional().default(''),
    })).default([]),
    features: z.array(z.string()).default([]),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).default([]),
    caseStudy: z.object({
      title: z.string(),
      location: z.string(),
      year: z.string().optional().default(''),
      image: z.string().optional().default(''),
    }).optional(),
    ar: z.object({
      name: z.string(),
      shortName: z.string(),
      tagline: z.string(),
      description: z.string(),
      features: z.array(z.string()).default([]),
      applications: z.array(z.object({
        title: z.string(),
        desc: z.string().optional().default(''),
      })).default([]),
      faqs: z.array(z.object({
        question: z.string(),
        answer: z.string(),
      })).default([]),
      caseStudy: z.object({
        title: z.string(),
        location: z.string(),
      }).optional(),
    }).optional(),
    featured: z.boolean().optional().default(false),
  }),
});

export const collections = { products };
