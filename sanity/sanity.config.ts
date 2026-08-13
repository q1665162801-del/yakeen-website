// ponytail: Sanity Studio config — full-featured backend for products, blog, and site settings
// Run: cd sanity && npm install && npx sanity deploy
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

// Studio desk structure: Products | Blog | Site Settings
const deskStructure = (S) => [
  S.listItem()
    .title('Products')
    .icon(() => '💡')
    .child(S.documentTypeList('product').title('Products')),
  S.listItem()
    .title('Blog')
    .icon(() => '📝')
    .child(
      S.list()
        .title('Blog')
        .items([
          S.listItem()
            .title('English Posts')
            .child(S.documentTypeList('blog').filter('lang == "en"').title('English Posts')),
          S.listItem()
            .title('Arabic Posts')
            .child(S.documentTypeList('blog').filter('lang == "ar"').title('Arabic Posts (العربية)')),
        ])
    ),
  S.divider(),
  S.listItem()
    .title('Site Settings')
    .icon(() => '⚙️')
    .child(
      S.editor()
        .id('siteSettings')
        .schemaType('siteSettings')
        .documentId('siteSettings')
        .title('Site Settings')
    ),
];

export default defineConfig({
  name: 'yakeen-lighting',
  title: 'Yakeen Lighting Studio',
  projectId: 'e2usb7ms',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    structureTool({
      structure: (S) => S.list().title('Content').items(deskStructure(S)),
    }),
    visionTool(),
  ],
  schema: { types: schemaTypes },
});
