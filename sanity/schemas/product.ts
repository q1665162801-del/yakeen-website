// ponytail: 1:1 match with existing Product interface — zero data shape change
// mainImage + sceneImage are native image type (uploadable with preview)
// All other image fields stay as strings (URLs) — upgrade later if needed
import { defineType, defineField, defineArrayMember } from 'sanity';

const specFields = [
  'wattage', 'efficacy', 'cct', 'cri', 'beamAngle',
  'ipRating', 'dimming', 'lifespan', 'warranty',
  'certifications', 'moq', 'leadTime',
].map(name => defineField({ name, title: name, type: 'string' }));

export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug (URL identifier)',
      type: 'slug',
      options: { source: 'name' },
      validation: R => R.required(),
    }),
    defineField({ name: 'name', title: 'Product Name', type: 'string', validation: R => R.required() }),
    defineField({ name: 'shortName', title: 'Short Name', type: 'string' }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Indoor', value: 'indoor' },
          { title: 'Track', value: 'track' },
          { title: 'Panel / Linear', value: 'panel-linear' },
          { title: 'Industrial', value: 'industrial' },
          { title: 'Outdoor', value: 'outdoor' },
        ],
      },
    }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 4 }),
    defineField({ name: 'metaDescription', title: 'SEO Description', type: 'text', rows: 2 }),

    // ── Images (native upload) ──
    defineField({
      name: 'mainImage',
      title: 'Main Product Image',
      type: 'image',
      options: { hotspot: true, metadata: ['dimensions', 'palette', 'lqip'] },
      validation: R => R.required(),
    }),
    defineField({
      name: 'sceneImage',
      title: 'Scene / Application Image',
      type: 'image',
      options: { hotspot: true },
    }),

    // ── Other image URLs (string, upgrade later) ──
    defineField({ name: 'ogImage', title: 'OG Share Image (URL)', type: 'string', description: 'Leave empty to auto-use mainImage' }),
    defineField({
      name: 'galleryImages',
      title: 'Gallery Images (URLs)',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),

    // ── Technical Specs ──
    defineField({
      name: 'specs',
      title: 'Technical Specs',
      type: 'object',
      fields: specFields,
    }),

    // ── Applications ──
    defineField({
      name: 'applications',
      title: 'Applications',
      type: 'array',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({ name: 'title', type: 'string' }),
          defineField({ name: 'desc', type: 'text', rows: 2 }),
          defineField({ name: 'icon', type: 'string' }),
        ],
      })],
    }),

    // ── Features ──
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),

    // ── FAQs ──
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({ name: 'question', type: 'string' }),
          defineField({ name: 'answer', type: 'text', rows: 3 }),
        ],
      })],
    }),

    // ── Case Study ──
    defineField({
      name: 'caseStudy',
      title: 'Case Study',
      type: 'object',
      fields: [
        defineField({ name: 'title', type: 'string' }),
        defineField({ name: 'location', type: 'string' }),
        defineField({ name: 'year', type: 'string' }),
        defineField({ name: 'image', type: 'string', description: 'URL path' }),
      ],
    }),

    // ── Arabic Localization ──
    defineField({
      name: 'ar',
      title: 'Arabic Translation (عربي)',
      type: 'object',
      fields: [
        defineField({ name: 'name', type: 'string', description: 'الاسم' }),
        defineField({ name: 'shortName', type: 'string' }),
        defineField({ name: 'tagline', type: 'string' }),
        defineField({ name: 'description', type: 'text', rows: 4 }),
        defineField({
          name: 'features',
          type: 'array',
          of: [defineArrayMember({ type: 'string' })],
        }),
        defineField({
          name: 'applications',
          type: 'array',
          of: [defineArrayMember({
            type: 'object',
            fields: [
              defineField({ name: 'title', type: 'string' }),
              defineField({ name: 'desc', type: 'string' }),
            ],
          })],
        }),
        defineField({
          name: 'faqs',
          type: 'array',
          of: [defineArrayMember({
            type: 'object',
            fields: [
              defineField({ name: 'question', type: 'string' }),
              defineField({ name: 'answer', type: 'text', rows: 3 }),
            ],
          })],
        }),
        defineField({
          name: 'caseStudy',
          type: 'object',
          fields: [
            defineField({ name: 'title', type: 'string' }),
            defineField({ name: 'location', type: 'string' }),
          ],
        }),
      ],
    }),

    defineField({ name: 'featured', title: 'Featured on Homepage', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'category', media: 'mainImage' },
  },
});
