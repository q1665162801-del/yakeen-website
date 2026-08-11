# Arabic Translation Review Brief — Yakeen Lighting Website

## Project Overview
- **Website**: Yakeen Lighting (yakeenlighting.com) — B2B commercial LED lighting supplier for Middle East
- **Target Markets**: Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman (GCC)
- **Language**: Modern Standard Arabic (MSA / Fus'ha)
- **Content Type**: B2B commercial website — product descriptions, market pages, FAQs, company info

## What Needs Review
AI-generated Arabic translations need native-speaker review and editing. The content was translated by an AI assistant and has NOT been reviewed by a native Arabic speaker.

## Review Scope
1. **Market pages** (3 pages, ~2,400 words):
   - `/ar/markets/saudi-arabia` — Saudi market page (hero, summary, certifications, projects, FAQs)
   - `/ar/markets/uae` — UAE market page
   - `/ar/markets/middle-east` — Middle East/GCC market page

2. **Existing site pages** (~5,000 words):
   - Homepage, product pages, about page, contact page, FAQ page
   - Navigation labels, footer, CTA buttons

## Review Checklist
- [ ] **Accuracy**: Does the Arabic accurately convey the English meaning?
- [ ] **Naturalness**: Does it sound like a native Arabic speaker wrote it (not translated)?
- [ ] **Terminology**: Are LED lighting terms correct? (See `arabic-glossary.md`)
- [ ] **Tone**: Is the tone professional and appropriate for B2B Middle East buyers?
- [ ] **Cultural fit**: Are expressions culturally appropriate for Gulf region buyers?
- [ ] **SEO keywords**: Are there better Arabic keywords that Gulf buyers actually search for?
- [ ] **RTL formatting**: Are punctuation marks and numbers correctly oriented for RTL?
- [ ] **CTA buttons**: Do call-to-action phrases sound natural in Arabic?
- [ ] **FAQ answers**: Do answers match how Middle East business people communicate?
- [ ] **Consistency**: Are terms used consistently across all pages?

## Key Rules
1. Keep these in English (do NOT translate): LED, SASO, SABER, ECAS, ESMA, G-Mark, CE, RoHS, CB, ISO, OEM, ODM, MOQ, DDP, T/T, L/C, DALI, KNX, BMS
2. Use Modern Standard Arabic (MSA) — NOT dialects
3. Brand name "Yakeen Lighting" stays in English
4. Product model numbers stay in English
5. If a technical term has a more common colloquial usage in Gulf business context, note it

## Output Format
Please provide:
1. **Corrected Arabic text** for each page/section
2. **List of changes made** with brief explanations (so we learn for future translations)
3. **SEO keyword suggestions** — Arabic keywords that Gulf buyers actually search for (that differ from direct translations)
4. **Cultural notes** — any content that might be inappropriate or could be improved for Middle East audience

## Files to Review
- `src/data/markets.ts` — Arabic fields in the `ar:` object of each market
- `src/i18n/ui.ts` — Arabic translation keys (the `ar` dictionary)
- Any other Arabic content visible on the website

## How to Access
- Local dev server: `http://localhost:4322/ar/markets/saudi-arabia`
- Production: `https://www.yakeenlighting.com/ar/`

## Budget & Timeline
- Budget: negotiable (MTPE rate ~$0.05-0.08/word)
- Timeline: 3-5 business days
- Total word count: ~7,400 words
