// ponytail: Sanity Studio config — deploy to sanity.io free hosting
// Run: cd sanity && npm install && npx sanity deploy
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'yakeen-lighting',
  title: 'Yakeen Lighting Studio',
  projectId: 'e2usb7ms',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
});
