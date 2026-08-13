// ponytail: siteSettings singleton — matches site-config.ts structure exactly
import { defineType, defineField, defineArrayMember } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // singleton — only one document allowed
  __experimental_actions: ['update', 'publish', /* no 'create', 'delete' */],
  fields: [
    // ── Company Info ──
    defineField({ name: 'name', title: 'Brand Name', type: 'string', initialValue: 'Yakeen Lighting' }),
    defineField({ name: 'legalName', title: 'Legal Company Name', type: 'string', initialValue: 'Taiyuan Yakeen Trading Co., Ltd.' }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string', initialValue: 'Your Trusted Middle East Commercial Lighting Partner' }),
    defineField({ name: 'url', title: 'Website URL', type: 'string', initialValue: 'https://www.yakeenlighting.com' }),
    defineField({ name: 'founder', title: 'Founder', type: 'string', initialValue: 'Alan Ma' }),
    defineField({ name: 'taxId', title: 'Tax ID', type: 'string', initialValue: '91140105MAKGNY4D8A' }),

    // ── Contact ──
    defineField({ name: 'email', title: 'Email', type: 'string', initialValue: 'yakeenlight@outlook.com' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', initialValue: '+86-181-0343-4722' }),
    defineField({ name: 'whatsapp', title: 'WhatsApp (digits only)', type: 'string', initialValue: '8618103434722' }),

    // ── Address ──
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        defineField({ name: 'street', title: 'Street', type: 'string', initialValue: 'Yingze District, Taiyuan City' }),
        defineField({ name: 'city', title: 'City', type: 'string', initialValue: 'Taiyuan' }),
        defineField({ name: 'region', title: 'Region/Province', type: 'string', initialValue: 'Shanxi' }),
        defineField({ name: 'postalCode', title: 'Postal Code', type: 'string', initialValue: '030000' }),
        defineField({ name: 'country', title: 'Country Code', type: 'string', initialValue: 'CN' }),
      ],
    }),

    // ── Business ──
    defineField({
      name: 'areaServed',
      title: 'Areas Served (country codes)',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      initialValue: ['SA', 'AE', 'QA', 'KW', 'BH', 'OM'],
    }),
    defineField({
      name: 'certifications',
      title: 'Certifications',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      initialValue: ['SASO', 'G-Mark', 'CE', 'RoHS', 'ISO 9001:2015'],
    }),

    // ── Social Links ──
    defineField({
      name: 'social',
      title: 'Social Media Links',
      type: 'object',
      fields: [
        defineField({ name: 'linkedin', title: 'LinkedIn', type: 'string', initialValue: 'https://www.linkedin.com/company/yakeenlighting' }),
        defineField({ name: 'facebook', title: 'Facebook', type: 'string', initialValue: 'https://www.facebook.com/yakeenlighting' }),
        defineField({ name: 'instagram', title: 'Instagram', type: 'string', initialValue: 'https://www.instagram.com/yakeen_commercial_lights' }),
        defineField({ name: 'youtube', title: 'YouTube', type: 'string', initialValue: 'https://www.youtube.com/@yakeenlighting' }),
        defineField({ name: 'alibaba', title: 'Alibaba Store', type: 'string', initialValue: 'https://yakeenlighting.en.alibaba.com' }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings', subtitle: 'Company info, contact, social links' }),
  },
});
