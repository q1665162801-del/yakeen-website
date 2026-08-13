// ponytail: blog schema — matches existing markdown frontmatter + Portable Text body
import { defineType, defineField, defineArrayMember } from 'sanity';

export const blog = defineType({
  name: 'blog',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: R => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL identifier)',
      type: 'slug',
      options: { source: 'title' },
      validation: R => R.required(),
    }),
    defineField({
      name: 'description',
      title: 'SEO Description',
      type: 'text',
      rows: 2,
      validation: R => R.required(),
    }),
    defineField({
      name: 'lang',
      title: 'Language',
      type: 'string',
      options: {
        list: [
          { title: 'English', value: 'en' },
          { title: 'العربية (Arabic)', value: 'ar' },
        ],
      },
      initialValue: 'en',
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      initialValue: 'Yakeen Lighting Team',
    }),
    defineField({
      name: 'date',
      title: 'Publish Date',
      type: 'date',
      validation: R => R.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          'Certification',
          'Technical Guide',
          'Market Insights',
          'Procurement Guide',
          'Design Guide',
        ],
      },
    }),
    defineField({
      name: 'image',
      title: 'Cover Image',
      type: 'image',
      options: { hotspot: true, metadata: ['dimensions', 'palette', 'lqip'] },
    }),
    defineField({
      name: 'keywords',
      title: 'SEO Keywords',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'body',
      title: 'Article Body (Markdown)',
      type: 'text',
      rows: 30,
      description: 'Write in Markdown. Same format as local .md files.',
    }),
    defineField({
      name: 'arTitle',
      title: 'Arabic Title (for AR version link)',
      type: 'string',
      description: 'If this is the EN version, put the AR title here for cross-linking',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', media: 'image' },
  },
});
