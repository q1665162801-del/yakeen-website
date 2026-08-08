// ─── Build-time i18n utility ─────────────────────────────────────
// Zero runtime JS. Translations are inlined at build time.
// Usage in .astro files:
//   import { t, getLocale } from '../i18n/ui';
//   const locale = getLocale(Astro.url);
//   <h1>{t(locale, 'nav.home')}</h1>

export type Locale = 'en' | 'ar';

const en: Record<string, string> = {
  // Navigation
  'nav.home': 'Home',
  'nav.products': 'Products',
  'nav.aiAssistant': 'AI Assistant',
  'nav.projects': 'Projects',
  'nav.about': 'About',
  'nav.faq': 'FAQ',
  'nav.certifications': 'Certifications',
  'nav.saudi': 'Saudi Market',
  'nav.uae': 'UAE Market',
  'nav.middleEast': 'Middle East',
  'nav.markets': 'Markets',
  'nav.getQuote': 'Get Quote',
  'nav.language': 'Language',
  'nav.openMenu': 'Open menu',
  'nav.closeMenu': 'Close menu',

  // Skip link
  'skip.toMain': 'Skip to main content',

  // Hero
  'hero.badge': 'SASO & G-Mark Certified · Factory Video Audit Available',
  'hero.title': 'Your Trusted Middle East Commercial Lighting Partner',
  'hero.subtitle': 'SASO-certified LED lighting with OEM/ODM customization. From downlights to solar street lights — manufactured to GCC standards, delivered with full compliance documentation.',
  'hero.getQuote': 'Get Your Quote →',
  'hero.browseProducts': 'Browse Products',
  'hero.stat.products': 'Product Categories',
  'hero.stat.heatRated': 'Heat Rated',
  'hero.stat.gcc': 'GCC Countries Served',

  // Trust Bar
  'trust.certified': 'SASO & G-Mark Certified',
  'trust.factoryAudit': 'Factory Video Audit Available',
  'trust.oemOdm': 'OEM/ODM Customization',
  'trust.gccCountries': '6 GCC Countries Served',

  // Products section
  'products.eyebrow': 'Our Products',
  'products.title': 'Commercial Lighting Catalog',
  'products.subtitle': '10 core LED products with full SASO/G-Mark certification. OEM/ODM customization available for all categories.',

  // Why Yakeen
  'whyYakeen.eyebrow': 'Why Yakeen',
  'whyYakeen.title': 'Built for the Middle East',
  'whyYakeen.manufacturing': 'Manufacturing Network',
  'whyYakeen.manufacturingDesc': 'Partner factories across China with SMT lines, assembly, and QC labs. Factory video audit available.',
  'whyYakeen.certified': 'SASO & G-Mark Certified',
  'whyYakeen.certifiedDesc': 'Full compliance documentation for Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, Oman customs clearance.',
  'whyYakeen.customization': 'OEM/ODM Customization',
  'whyYakeen.customizationDesc': 'From private labeling to custom mold design. Your brand, your specifications, our manufacturing.',
  'whyYakeen.delivery': 'End-to-End Delivery',
  'whyYakeen.deliveryDesc': 'From DIALux design to SABER registration to shipping. We handle the entire process.',

  // CTA Banner
  'cta.title': 'Ready to Start Your Lighting Project?',
  'cta.subtitle': 'Get a free quote within 24 hours. SASO-certified products, OEM/ODM customization, and DDP shipping available.',
  'cta.button': 'Get Your Free Quote →',
  'cta.whatsapp': 'WhatsApp Us',
  'cta.watchFactory': 'Watch Factory Tour',

  // Footer
  'footer.tagline': 'Your Trusted Middle East Commercial Lighting Partner',
  'footer.quickLinks': 'Quick Links',
  'footer.products': 'Products',
  'footer.contact': 'Contact',
  'footer.followUs': 'Follow Us',
  'footer.email': 'Email',
  'footer.phone': 'Phone / WhatsApp',
  'footer.address': 'Address',
  'footer.copyright': 'All rights reserved.',
  'footer.privacyPolicy': 'Privacy Policy',
  'footer.browseProducts': 'Browse Products',
  'footer.aboutDesc': 'SASO & G-Mark certified LED commercial lighting manufacturer serving Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, and Oman.',

  // WhatsApp
  'whatsapp.label': 'Chat on WhatsApp',
  'whatsapp.message': 'Hello Yakeen Lighting, I am interested in your LED products for the Middle East market.',

  // Common
  'common.back': 'Back',
  'common.learnMore': 'Learn More',
  'common.viewDetails': 'View Details',
  'common.requestQuote': 'Request Quote',
  'common.contactUs': 'Contact Us',

  // ── About Page ──
  'about.eyebrow': 'About Yakeen Lighting',
  'about.heroDesc': '{legalName}, operating as Yakeen Lighting, is a specialized commercial lighting solution provider focused exclusively on the Middle East and GCC market. Led by founder Alan Ma, we offer free DIALux design, independent quality control, SASO/G-Mark compliance, and end-to-end project support — with partner factories across China.',
  'about.stats.coreProducts': 'Core Products',
  'about.stats.gcc': 'GCC Countries',
  'about.stats.qc': 'Stage QC Process',
  'about.stats.heatRated': 'Heat Rated',
  'about.story.eyebrow': 'Our Story',
  'about.story.title': 'Built for the Middle East, Backed by Chinese Manufacturing',
  'about.story.p1': 'Yakeen Lighting was founded by Alan Ma with a clear mission: to be the most trusted commercial lighting partner for Middle East buyers sourcing from China. We are not a factory pretending to be a trading company, nor a trading company pretending to be a factory.',
  'about.story.p2': 'Our model is different. We maintain a verified network of partner factories across China — each specialized in specific LED categories. We bring independent quality control (5-stage QC), full SASO/G-Mark compliance documentation, OEM/ODM customization, and free DIALux lighting design to every project.',
  'about.story.p3': 'Every claim we make is verifiable. Factory video audits available. Real production lines. Real test labs. Real compliance certificates. Middle East clients can verify everything before placing an order — because trust is the foundation of cross-border B2B.',
  'about.values.eyebrow': 'Our Values',
  'about.values.title': 'What Makes Yakeen Different',
  'about.values.honest.title': 'Honest Positioning',
  'about.values.honest.desc': 'We do not claim to own a factory. We are a manufacturing solutions partner with verified factory network, full QC oversight, and OEM/ODM capability. AI-searchable, client-verifiable, audit-ready.',
  'about.values.middleEast.title': 'Middle East Focus',
  'about.values.middleEast.desc': 'Every product, certification, and process is built for GCC conditions: 50°C heat, dust, UV, and SASO/G-Mark compliance. We serve Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, and Oman.',
  'about.values.technical.title': 'Technical Depth',
  'about.values.technical.desc': 'Free DIALux lighting simulation. LM-80/TM-21 reports. UGR calculations. We do not just sell lights — we engineer lighting solutions for your project.',
  'about.values.partnership.title': 'Long-Term Partnership',
  'about.values.partnership.desc': 'Spare parts buffer for large projects. Remote commissioning support. We invest in relationships, not one-off transactions.',
  'about.founder.eyebrow': 'Founder',
  'about.founder.name': 'Alan Ma',
  'about.founder.quote1': 'After years in the commercial lighting industry, I saw a gap: Middle East buyers needed a partner who understood both Chinese manufacturing capability and GCC market requirements. They needed someone who could provide real factory access, real compliance documentation, and real technical support — not just a website with stock photos.',
  'about.founder.quote2': 'Yakeen Lighting fills that gap. We are honest about what we are: a manufacturing solutions partner with verified factory network. Every claim we make is verifiable. Every product we ship is tested. Every project we take on gets our full technical attention.',
  'about.founder.attribution': '— Alan Ma, Founder & Project Director',
  'about.breadcrumb.about': 'About',

  // ── Contact Page ──
  'contact.hero.title': 'Get Your Lighting Quote',
  'contact.hero.subtitle': 'Tell us about your project. Receive a tailored quotation with SASO/G-Mark documentation within 24 hours.',
  'contact.breadcrumb.contact': 'Contact',
  'contact.directContact': 'Direct Contact',
  'contact.sendMsg': 'Send Us a Message',
  'contact.email': 'Email',
  'contact.whatsapp': 'WhatsApp',
  'contact.phone': 'Phone',
  'contact.serviceArea': 'Service Area',
  'contact.form.name': 'Name *',
  'contact.form.company': 'Company',
  'contact.form.email': 'Email *',
  'contact.form.phone': 'WhatsApp / Phone',
  'contact.form.country': 'Country *',
  'contact.form.selectCountry': 'Select your country',
  'contact.form.productInterest': 'Product Interest',
  'contact.form.selectProduct': 'Select a product category',
  'contact.form.message': 'Project Details *',
  'contact.form.messagePlaceholder': 'Describe your project: space type, quantity, timeline, specific requirements...',
  'contact.form.submit': 'Send Inquiry →',
  'contact.form.success': '✓ Thank you! Your inquiry has been sent. We will respond within 24 hours.',
  'contact.form.error': '✗ Something went wrong. Please email us directly at {email}',
  'contact.country.sa': 'Saudi Arabia',
  'contact.country.ae': 'United Arab Emirates',
  'contact.country.qa': 'Qatar',
  'contact.country.kw': 'Kuwait',
  'contact.country.bh': 'Bahrain',
  'contact.country.om': 'Oman',
  'contact.country.other': 'Other',

  // ── Product Detail Page ──
  'product.specs.title': 'Technical Specifications',
  'product.specs.parameter': 'Parameter',
  'product.specs.value': 'Value',
  'product.specs.wattage': 'Wattage',
  'product.specs.efficacy': 'Luminous Efficacy',
  'product.specs.colorTemp': 'Color Temperature',
  'product.specs.cri': 'CRI',
  'product.specs.beamAngle': 'Beam Angle',
  'product.specs.ipRating': 'IP Rating',
  'product.specs.dimming': 'Dimming',
  'product.specs.lifespan': 'Lifespan',
  'product.specs.warranty': 'Warranty',
  'product.specs.certifications': 'Certifications',
  'product.specs.moq': 'MOQ',
  'product.specs.leadTime': 'Lead Time',
  'product.cta.getQuote': 'Get Your Quote →',
  'product.cta.whatsapp': 'WhatsApp',
  'product.applications.eyebrow': 'Applications',
  'product.applications.title': 'Where {name} Shines',
  'product.features.title': 'Key Features',
  'product.techOptions.title': 'Technical Options',
  'product.techOptions.dimming': 'Dimming',
  'product.techOptions.lifespan': 'Lifespan',
  'product.techOptions.cri': 'CRI',
  'product.techOptions.beamAngle': 'Beam Angle',
  'product.faq.eyebrow': 'FAQ',
  'product.faq.title': '{name} Questions',
  'product.related.title': 'Related Products',
  'product.ctaBanner.title': 'Need a Custom Quote?',
  'product.ctaBanner.subtitle': 'Get project-based pricing for {name} within 24 hours. SASO/G-Mark documentation included.',
  'product.sceneAlt': '{name} application scene',

  // ── Products List Page ──
  'products.hero.title': 'Commercial Lighting Catalog',
  'products.hero.subtitle': '10 core LED products with full SASO & G-Mark certification. OEM/ODM customization available for all categories. Built for Middle East conditions (50°C rated, dust & UV resistant).',
  'products.breadcrumb.products': 'Products',
  'products.filter.all': 'All Products',
  'products.noResults': 'No products found in this category.',
  'products.resetFilter': 'View All Products',
  'products.oem.eyebrow': 'OEM / ODM Customization',
  'products.oem.title': 'Your Brand, Your Specs, Our Manufacturing',
  'products.oem.desc': 'From private labeling and custom packaging to full product redesign and mold development — Yakeen Lighting handles the entire OEM/ODM process. Our partner factories across China deliver production-grade quality with SASO/G-Mark compliance.',
  'products.oem.f1': 'Private label & custom packaging',
  'products.oem.f2': 'Custom wattage / CCT / beam angle',
  'products.oem.f3': 'Full product redesign & mold development',
  'products.oem.f4': 'Brand-exclusive SKU management',
  'products.oem.cta': 'Discuss Your Project →',

  // ── TrustBar ──
  'trustbar.heading': 'Trusted by Projects Across the Middle East',

  // ── AI Search ──
  'ai.search.placeholder': 'Describe your lighting project… e.g. "downlight for hotel lobby UGR<16"',
  'ai.search.button': 'AI Search',
  'ai.search.quickSearch': 'Quick search:',
  'ai.search.quick1': 'Downlight UGR<19',
  'ai.search.quick2': 'Panel 600x600',
  'ai.search.quick3': 'IP65 Flood',
  'ai.search.quick4': 'Solar Street',

  // ── Product Gallery ──
  'product.gallery.mainView': '{name} main view',
  'product.gallery.thumbnail': '{name} thumbnail {index}',
  'product.gallery.viewImage': 'View image {index} of {total}',

  // ── Homepage Categories ──
  'home.cat.indoor.title': 'LED Downlights & Spotlights',
  'home.cat.indoor.desc': 'UGR<16 anti-glare, CRI>90, ideal for malls & hotels',
  'home.cat.track.title': 'LED Track Lights',
  'home.cat.track.desc': '350° rotation, COB LED, flexible retail lighting',
  'home.cat.panel-linear.title': 'LED Panel Lights & Linear Lights',
  'home.cat.panel-linear.desc': 'Ultra-thin edge-lit, 110-130 lm/W efficiency',
  'home.cat.industrial.title': 'LED High Bay & Industrial',
  'home.cat.industrial.desc': '100-240W, IP65, 50°C rated for warehouses',
  'home.cat.outdoor.title': 'Outdoor & Architectural',
  'home.cat.outdoor.desc': 'Solar street, flood, wall washer — IP66/IP68',

  // ── Contact Form Products ──
  'contact.product.downlights': 'LED Downlights & Spotlights',
  'contact.product.track': 'LED Track Lights',
  'contact.product.panel': 'LED Panel Lights & Linear Lights',
  'contact.product.magnetic': 'Magnetic Track Light System',
  'contact.product.highbay': 'LED High Bay & Industrial',
  'contact.product.flood': 'LED Flood Lights',
  'contact.product.solar': 'Solar Street Lights',
  'contact.product.washer': 'Architectural Wall Washer',
  'contact.product.oem': 'OEM/ODM Custom Project',

  // ── Product Filter Labels ──
  'products.filter.indoor': 'Indoor Lighting',
  'products.filter.track': 'Track Lighting',
  'products.filter.panel-linear': 'Panel & Linear',
  'products.filter.industrial': 'Industrial',
  'products.filter.outdoor': 'Outdoor',

  // ── Certifications Page ──
  'cert.hero.title': 'Certifications & Quality Control',
  'cert.hero.subtitle': 'Every product ships with full compliance documentation. Every batch passes a 5-stage QC process. Every claim is verifiable.',
  'cert.breadcrumb': 'Certifications',
  'cert.compliance.eyebrow': 'Compliance',
  'cert.compliance.title': 'Our Certifications',
  'cert.qc.eyebrow': 'Quality Control',
  'cert.qc.title': '5-Stage QC Process',
  'cert.qc.desc': 'Every product passes through 5 quality control stages before shipment. Reports available for every batch.',
  'cert.audit.title': 'Factory Video Audit Available',
  'cert.audit.desc': 'See our partner factories in real time: SMT production lines, assembly workshops, testing laboratories, and finished goods warehouses. Schedule a live video audit via WhatsApp or Zoom.',
  'cert.audit.cta': 'Schedule a Video Audit →',

  // ── Projects Page ──
  'projects.hero.badge': 'Real Installations · 6 GCC Countries',
  'projects.hero.title': 'Projects Across the Middle East',
  'projects.hero.subtitle': 'Real installations. Real results. Explore lighting projects delivered with SASO & G-Mark certified LED products — from hotel lobbies to industrial warehouses.',
  'projects.breadcrumb': 'Projects',
  'projects.section.eyebrow': 'Case Studies',
  'projects.section.title': 'Lighting Projects Portfolio',
  'projects.section.desc': 'Filter by project type to see how Yakeen Lighting products perform in real-world applications across the region.',
  'projects.filter.all': 'All',
  'projects.filter.hotel': 'Hotel',
  'projects.filter.retail': 'Retail',
  'projects.filter.office': 'Office',
  'projects.filter.industrial': 'Industrial',
  'projects.filter.outdoor': 'Outdoor',
  'projects.altSuffix': 'lighting project by Yakeen Lighting',
  'projects.cta.eyebrow': 'Start Your Project',
  'projects.cta.title': 'Have a Lighting Project in Mind?',
  'projects.cta.desc': 'From DIALux design to SABER registration to delivery — Yakeen Lighting handles the full process for your next installation.',
  'projects.card.cta': 'Start a similar project',
  'projects.card.empty': 'No projects in this category yet.',

  // ── FAQ Page ──
  'faq.breadcrumb': 'FAQ',
  'faq.hero.title': 'Frequently Asked Questions',
  'faq.hero.subtitle': 'Everything Middle East buyers need to know about certifications, customization, pricing, shipping, and quality.',
  'faq.cta.title': 'Still Have Questions?',
  'faq.cta.subtitle': 'Contact Yakeen Lighting directly. We respond within 24 hours.',
  'faq.cat.certification': 'Certification & Compliance',
  'faq.cat.oem': 'OEM / ODM Customization',
  'faq.cat.pricing': 'Pricing & Payment',
  'faq.cat.shipping': 'Shipping & Delivery',
  'faq.cat.quality': 'Quality & Warranty',
  'faq.cat.tech': 'Technical Support',

  // ── Misc i18n ──
  'product.specs.caption': 'Product technical specifications',
  'noscript.desc': 'Middle East commercial LED lighting manufacturer — downlights, panels, track lights, flood lights, high bays, and solar street lights. SASO & G-Mark certified.',
  'noscript.tagline': 'Your Trusted Middle East Commercial Lighting Partner',

  // ── Privacy Policy ──
  'privacy.title': 'Privacy Policy',
  'privacy.updated': 'Last updated:',
  'privacy.date': 'August 2026',
  'privacy.intro': 'Taiyuan Yakeen Trading Co., Ltd. ("Yakeen Lighting", "we", "us") respects your privacy. This policy explains how we handle your data.',
  'privacy.collect.title': 'Information We Collect',
  'privacy.collect.desc': 'When you submit our contact form, we collect: name, company, email, phone/WhatsApp, country, and project details you provide. This is used solely to respond to your inquiry.',
  'privacy.use.title': 'How We Use Your Data',
  'privacy.use.desc': 'To respond to inquiries, provide quotations, send product information, and fulfill orders. We do not sell or share your data with third parties for marketing purposes.',
  'privacy.analytics.title': 'Analytics',
  'privacy.analytics.desc': 'We use Google Analytics 4 to understand website traffic patterns. This data is aggregated and anonymous.',
  'privacy.rights.title': 'Your Rights',
  'privacy.rights.desc': 'You may request access to, correction of, or deletion of your personal data by emailing',
  'privacy.contact.title': 'Contact',
  'privacy.contact.desc': 'Questions about this policy? Email',

  // ── Aria labels ──
  'aria.aiSearch': 'AI lighting search',
  'aria.searchProducts': 'Search for lighting products',
  'aria.aiProductSearch': 'AI lighting product search',
  'aria.certifications': 'Certifications and trust signals',
  'aria.breadcrumb': 'Breadcrumb',
  'aria.primary': 'Primary navigation',
  'aria.mobilePrimary': 'Mobile primary navigation',
  'aria.languageSwitcher': 'Language switcher',
  'aria.productFilter': 'Product category filter',
  'aria.productGallery': 'Product image gallery',
  'product.card.viewDetails': 'View {name} details',

  // AI Assistant page
  'ai.badge': 'AI-Powered Product Search',
  'ai.heroTitle': 'AI Lighting Assistant',
  'ai.heroSubtitle': "Describe your lighting project and get instant product recommendations from Yakeen's SASO & G-Mark certified LED catalog.",
  'ai.searchPlaceholder': 'Describe your lighting project… e.g. "downlight for hotel lobby UGR<16"',
  'ai.searchButton': 'Search',
  'ai.popularSearches': 'Popular searches',
  'ai.showingResults': 'Showing results for:',
  'ai.howItWorks.eyebrow': 'How It Works',
  'ai.howItWorks.title': 'From Search to Quote in 3 Steps',
  'ai.howItWorks.desc': 'A simple, guided process to find the right certified lighting for your Middle East project.',
  'ai.faq.eyebrow': 'FAQ',
  'ai.faq.title': 'AI Assistant Questions',
  'ai.faq.subtitle': 'Everything you need to know about finding the right lighting with the Yakeen AI assistant.',
  'ai.stillQuestions': 'Still have questions?',
  'ai.contactExperts': 'Contact our lighting experts',
  'ai.orEmail': 'or email',
  'ai.cta.title': 'Ready to Find Your Lighting?',
  'ai.cta.subtitle': "Describe your project to the AI assistant, or contact Yakeen Lighting directly for a tailored solution and project-based quotation within 24 hours.",

  // ── 404 Page ──
  '404.title': 'Page Not Found',
  '404.message': "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
  '404.backHome': 'Back to Home',
  '404.stillLost': "Still can't find what you need?",
  '404.contactTeam': 'Contact our team',
  '404.orEmail': 'or email',
  '404.quick.home': 'Home',
  '404.quick.homeDesc': 'Return to the homepage',
  '404.quick.products': 'Products',
  '404.quick.productsDesc': 'Browse our LED catalog',
  '404.quick.contact': 'Contact',
  '404.quick.contactDesc': 'Talk to our lighting experts',
  '404.quick.faq': 'FAQ',
  '404.quick.faqDesc': 'Find quick answers',

  // ── Testimonials ──
  'testimonials.eyebrow': 'Client Stories',
  'testimonials.title': 'Trusted by Middle East Buyers',
  'testimonials.subtitle': 'Real feedback from wholesalers, designers, builders, and contractors across the Gulf region.',
  'testimonials.t1.badge': 'Wholesaler',
  'testimonials.t1.text': '"I\'ve been importing LED lights from China for six years. Tried at least a dozen suppliers before settling with Yakeen. What kept me coming back is simple — they don\'t swap chips on you mid-order. Every batch I receive matches the sample I approved. That kind of consistency matters when you\'re supplying 40+ retail shops across Riyadh and Jeddah. Their SASO paperwork is always clean too, saves me headaches at customs."',
  'testimonials.t1.name': 'James Carter',
  'testimonials.t1.role': 'Wholesaler · Riyadh, Saudi Arabia',
  'testimonials.t2.badge': 'Designer',
  'testimonials.t2.text': '"As an interior designer, I care about how light looks, not just how bright it is. Yakeen sent me 3000K, 4000K, and 5000K samples of the same downlight so I could compare them in an actual mock-up room. That\'s not something every supplier offers. The CRI on their premium line holds up against brands costing three times more. My hotel lobby project in Dubai Marina got compliments from the owner — and that\'s the best review I can ask for."',
  'testimonials.t2.name': 'David Thompson',
  'testimonials.t2.role': 'Interior Designer · Dubai, UAE',
  'testimonials.t3.badge': 'Builder',
  'testimonials.t3.text': '"On site, I don\'t have time to chase suppliers. Yakeen\'s team was on WhatsApp replying within an hour every time I had a question — even at night. The delivery for our Muscat office tower arrived exactly when they said it would, and the dimmable drivers worked right out of the box. No defective units in a batch of 1,200 downlights. That\'s the kind of reliability that makes me look good in front of my client."',
  'testimonials.t3.name': 'Hassan Al-Bakri',
  'testimonials.t3.role': 'Builder · Muscat, Oman',
  'testimonials.t4.badge': 'Contractor',
  'testimonials.t4.text': '"We won a government tender for a mosque complex in Doha, and the spec was strict — G-Mark certification, specific lux levels, emergency backup integration. Yakeen\'s technical team handled the DIALux simulation and sent us a full lighting report. Passed the consultant\'s review on the first submission. They even labeled each carton by floor and zone, which made installation on site much faster than expected."',
  'testimonials.t4.name': 'Tariq Al-Subaihi',
  'testimonials.t4.role': 'Contractor · Doha, Qatar',
  'testimonials.t5.badge': 'Project Manager',
  'testimonials.t5.text': '"My second project with Yakeen — this time a shopping mall extension in Manama. What impressed me was the after-sales. Three months after installation, one batch of drivers started buzzing. I sent a video, and within a week Yakeen shipped replacement drivers by air, no argument. That\'s the test of a real supplier — not how they treat you before the order, but what happens after. They earned my long-term trust with that one."',
  'testimonials.t5.name': 'Sarah Mitchell',
  'testimonials.t5.role': 'Project Manager · Manama, Bahrain',
};

const ar: Record<string, string> = {
  // Navigation
  'nav.home': 'الرئيسية',
  'nav.products': 'المنتجات',
  'nav.aiAssistant': 'مساعد الذكاء الاصطناعي',
  'nav.projects': 'المشاريع',
  'nav.about': 'من نحن',
  'nav.faq': 'الأسئلة الشائعة',
  'nav.certifications': 'الشهادات',
  'nav.saudi': 'السوق السعودي',
  'nav.uae': 'سوق الإمارات',
  'nav.middleEast': 'الشرق الأوسط',
  'nav.markets': 'الأسواق',
  'nav.getQuote': 'اطلب عرض سعر',
  'nav.language': 'اللغة',
  'nav.openMenu': 'فتح القائمة',
  'nav.closeMenu': 'إغلاق القائمة',

  // Skip link
  'skip.toMain': 'تخطي إلى المحتوى الرئيسي',

  // Hero
  'hero.badge': 'معتمد SASO و G-Mark · تتوفر جولة فيديو للمصنع',
  'hero.title': 'شريكك الموثوق للإضاءة التجارية في الشرق الأوسط',
  'hero.subtitle': 'إضاءة LED معتمدة SASO مع تخصيص OEM/ODM. من الإضاءة المدمجة إلى أضواء الشوارع الشمسية — مصنعة وفق معايير مجلس التعاون الخليجي مع وثائق امتثال كاملة.',
  'hero.getQuote': 'احصل على عرض السعر ←',
  'hero.browseProducts': 'تصفح المنتجات',
  'hero.stat.products': 'فئات المنتجات',
  'hero.stat.heatRated': 'مقاومة الحرارة',
  'hero.stat.gcc': 'دول مجلس التعاون الخليجي',

  // Trust Bar
  'trust.certified': 'معتمد SASO و G-Mark',
  'trust.factoryAudit': 'تتوفر جولة فيديو للمصنع',
  'trust.oemOdm': 'تخصيص OEM/ODM',
  'trust.gccCountries': '6 دول خليجية مخدومة',

  // Products section
  'products.eyebrow': 'منتجاتنا',
  'products.title': 'كتالوج الإضاءة التجارية',
  'products.subtitle': '10 منتجات LED أساسية مع شهادات SASO/G-Mark كاملة. يتوفر التخصيص OEM/ODM لجميع الفئات.',

  // Why Yakeen
  'whyYakeen.eyebrow': 'لماذا Yakeen',
  'whyYakeen.title': 'مصمم للشرق الأوسط',
  'whyYakeen.manufacturing': 'شبكة التصنيع',
  'whyYakeen.manufacturingDesc': 'مصانع شركاء في جميع أنحاء الصين مع خطوط SMT والتجميع ومختبرات مراقبة الجودة. تتوفر جولة فيديو للمصنع.',
  'whyYakeen.certified': 'معتمد SASO و G-Mark',
  'whyYakeen.certifiedDesc': 'وثائق امتثال كاملة لتخليص الجمارك في السعودية والإمارات وقطر والكويت والبحرين وعمان.',
  'whyYakeen.customization': 'تخصيص OEM/ODM',
  'whyYakeen.customizationDesc': 'من وضع العلامات الخاصة إلى تصميم القوالب المخصصة. علامتك التجارية، مواصفاتك، تصنيعنا.',
  'whyYakeen.delivery': 'تسليم من البداية إلى النهاية',
  'whyYakeen.deliveryDesc': 'من تصميم DIALux إلى تسجيل SABER إلى الشحن. نتولى العملية بأكملها.',

  // CTA Banner
  'cta.title': 'هل أنت مستعد لبدء مشروع الإضاءة الخاص بك؟',
  'cta.subtitle': 'احصل على عرض سعر مجاني خلال 24 ساعة. منتجات معتمدة SASO، تخصيص OEM/ODM، وشحن DDP متاح.',
  'cta.button': 'احصل على عرض سعر مجاني ←',
  'cta.whatsapp': 'تواصل عبر واتساب',
  'cta.watchFactory': 'شاهد جولة المصنع',

  // Footer
  'footer.tagline': 'شريكك الموثوق للإضاءة التجارية في الشرق الأوسط',
  'footer.quickLinks': 'روابط سريعة',
  'footer.products': 'المنتجات',
  'footer.contact': 'اتصل بنا',
  'footer.followUs': 'تابعنا',
  'footer.email': 'البريد الإلكتروني',
  'footer.phone': 'الهاتف / واتساب',
  'footer.address': 'العنوان',
  'footer.copyright': 'جميع الحقوق محفوظة.',
  'footer.privacyPolicy': 'سياسة الخصوصية',
  'footer.browseProducts': 'تصفح المنتجات',
  'footer.aboutDesc': 'مصنع إضاءة LED تجارية معتمد SASO و G-Mark يخدم السعودية والإمارات وقطر والكويت والبحرين وعمان.',

  // WhatsApp
  'whatsapp.label': 'دردشة عبر واتساب',
  'whatsapp.message': 'مرحباً Yakeen Lighting، أنا مهتم بمنتجات LED الخاصة بكم لسوق الشرق الأوسط.',

  // Common
  'common.back': 'رجوع',
  'common.learnMore': 'اعرف المزيد',
  'common.viewDetails': 'عرض التفاصيل',
  'common.requestQuote': 'اطلب عرض سعر',
  'common.contactUs': 'اتصل بنا',

  // ── About Page ──
  'about.eyebrow': 'عن Yakeen Lighting',
  'about.heroDesc': '{legalName}، التي تعمل باسم Yakeen Lighting، هي مزود متخصص لحلول الإضاءة التجارية يركز حصرياً على سوق الشرق الأوسط ودول مجلس التعاون الخليجي. بقيادة المؤسس آلان ما، نقدم تصميم DIALux مجاني، ومراقبة جودة مستقلة، وامتثال SASO/G-Mark، ودعم كامل للمشاريع — مع مصانع شركاء في جميع أنحاء الصين.',
  'about.stats.coreProducts': 'منتجات أساسية',
  'about.stats.gcc': 'دول خليجية',
  'about.stats.qc': 'مراحل مراقبة الجودة',
  'about.stats.heatRated': 'مقاومة الحرارة',
  'about.story.eyebrow': 'قصتنا',
  'about.story.title': 'مصمم للشرق الأوسط، مدعوم بالتصنيع الصيني',
  'about.story.p1': 'تأسست Yakeen Lighting على يد آلان ما بمهمة واضحة: أن تكون شريك الإضاءة التجارية الأكثر ثقة للمشترين من الشرق الأوسط الذين يبحثون عن منتجات من الصين. نحن لسنا مصنعاً يتظاهر بأنه شركة تجارية، ولا شركة تجارية تتظاهر بأنها مصنع.',
  'about.story.p2': 'نموذجنا مختلف. نحافظ على شبكة موثقة من مصانع الشركاء في جميع أنحاء الصين — كل متخصص في فئات LED محددة. نقدم مراقبة جودة مستقلة (5 مراحل)، ووثائق امتثال SASO/G-Mark كاملة، وتخصيص OEM/ODM، وتصميم DIALux مجاني لكل مشروع.',
  'about.story.p3': 'كل ادعاء نقدمه قابل للتحقق. جولات فيديو للمصنع متاحة. خطوط إنتاج حقيقية. مختبرات اختبار حقيقية. شهادات امتثال حقيقية. يمكن للعملاء في الشرق الأوسط التحقق من كل شيء قبل تقديم الطلب — لأن الثقة هي أساس التجارة الإلكترونية بين الدول.',
  'about.values.eyebrow': 'قيمنا',
  'about.values.title': 'ما الذي يميز Yakeen',
  'about.values.honest.title': 'تحديد موقف صادق',
  'about.values.honest.desc': 'لا ندعي امتلاك مصنع. نحن شريك حلول تصنيع بشبكة مصانع موثقة، وإشراف كامل على مراقبة الجودة، وقدرات OEM/ODM. قابل للبحث بواسطة الذكاء الاصطناعي، قابل للتحقق من قبل العميل، جاهز للتدقيق.',
  'about.values.middleEast.title': 'التركيز على الشرق الأوسط',
  'about.values.middleEast.desc': 'كل منتج وشهادة وعملية مصممة لظروف دول مجلس التعاون الخليجي: حرارة 50°م، غبار، أشعة فوق بنفسجية، وامتثال SASO/G-Mark. نخدم السعودية والإمارات وقطر والكويت والبحرين وعمان.',
  'about.values.technical.title': 'عمق تقني',
  'about.values.technical.desc': 'محاكاة إضاءة DIALux مجانية. تقارير LM-80/TM-21. حسابات UGR. نحن لا نبيع الأضواء فحسب — بل نهندس حلول الإضاءة لمشروعك.',
  'about.values.partnership.title': 'شراكة طويلة الأمد',
  'about.values.partnership.desc': 'مخزون قطع غيار للمشاريع الكبيرة. دعم تشغيل عن بعد. نستثمر في العلاقات، لا في الصفقات الفردية.',
  'about.founder.eyebrow': 'المؤسس',
  'about.founder.name': 'آلان ما',
  'about.founder.quote1': 'بعد سنوات في صناعة الإضاءة التجارية، رأيت فجوة: كان المشترون في الشرق الأوسط بحاجة إلى شريك يفهم قدرات التصنيع الصينية ومتطلبات سوق مجلس التعاون الخليجي. كانوا بحاجة إلى شخص يوفر وصولاً حقيقياً للمصنع، ووثائق امتثال حقيقية، ودعماً تقنياً حقيقياً — وليس مجرد موقع إلكتروني بصور جاهزة.',
  'about.founder.quote2': 'تملأ Yakeen Lighting هذه الفجوة. نحن صادقون بشأن ما نحن عليه: شريك حلول تصنيع بشبكة مصانع موثقة. كل ادعاء نقدمه قابل للتحقق. كل منتج نشحنه مختبر. كل مشروع نتولاه يحصل على اهتمامنا التقني الكامل.',
  'about.founder.attribution': '— آلان ما، المؤسس ومدير المشاريع',
  'about.breadcrumb.about': 'من نحن',

  // ── Contact Page ──
  'contact.hero.title': 'احصل على عرض سعر الإضاءة',
  'contact.hero.subtitle': 'أخبرنا عن مشروعك. احصل على عرض سعر مخصص مع وثائق SASO/G-Mark خلال 24 ساعة.',
  'contact.breadcrumb.contact': 'اتصل بنا',
  'contact.directContact': 'معلومات التواصل المباشر',
  'contact.sendMsg': 'أرسل لنا رسالة',
  'contact.email': 'البريد الإلكتروني',
  'contact.whatsapp': 'واتساب',
  'contact.phone': 'الهاتف',
  'contact.serviceArea': 'منطقة الخدمة',
  'contact.form.name': 'الاسم *',
  'contact.form.company': 'الشركة',
  'contact.form.email': 'البريد الإلكتروني *',
  'contact.form.phone': 'واتساب / الهاتف',
  'contact.form.country': 'الدولة *',
  'contact.form.selectCountry': 'اختر دولتك',
  'contact.form.productInterest': 'اهتمام المنتج',
  'contact.form.selectProduct': 'اختر فئة المنتج',
  'contact.form.message': 'تفاصيل المشروع *',
  'contact.form.messagePlaceholder': 'صف مشروعك: نوع المساحة، الكمية، الجدول الزمني، المتطلبات المحددة...',
  'contact.form.submit': 'إرسال الاستفسار ←',
  'contact.form.success': '✓ شكراً لك! تم إرسال استفسارك. سنرد خلال 24 ساعة.',
  'contact.form.error': '✗ حدث خطأ ما. يرجى مراسلتنا مباشرة على {email}',
  'contact.country.sa': 'المملكة العربية السعودية',
  'contact.country.ae': 'الإمارات العربية المتحدة',
  'contact.country.qa': 'قطر',
  'contact.country.kw': 'الكويت',
  'contact.country.bh': 'البحرين',
  'contact.country.om': 'عمان',
  'contact.country.other': 'أخرى',

  // ── Product Detail Page ──
  'product.specs.title': 'المواصفات الفنية',
  'product.specs.parameter': 'المعامل',
  'product.specs.value': 'القيمة',
  'product.specs.wattage': 'الاستطاعة',
  'product.specs.efficacy': 'الكفاءة الضوئية',
  'product.specs.colorTemp': 'حرارة اللون',
  'product.specs.cri': 'مؤشر تجسيد الألوان',
  'product.specs.beamAngle': 'زاوية الشعاع',
  'product.specs.ipRating': 'تصنيف IP',
  'product.specs.dimming': 'التعتيم',
  'product.specs.lifespan': 'العمر الافتراضي',
  'product.specs.warranty': 'الضمان',
  'product.specs.certifications': 'الشهادات',
  'product.specs.moq': 'الحد الأدنى للطلب',
  'product.specs.leadTime': 'مدة التسليم',
  'product.cta.getQuote': 'احصل على عرض السعر ←',
  'product.cta.whatsapp': 'واتساب',
  'product.applications.eyebrow': 'التطبيقات',
  'product.applications.title': 'أين يتألق {name}',
  'product.features.title': 'الميزات الرئيسية',
  'product.techOptions.title': 'الخيارات التقنية',
  'product.techOptions.dimming': 'التعتيم',
  'product.techOptions.lifespan': 'العمر الافتراضي',
  'product.techOptions.cri': 'مؤشر تجسيد الألوان',
  'product.techOptions.beamAngle': 'زاوية الشعاع',
  'product.faq.eyebrow': 'الأسئلة الشائعة',
  'product.faq.title': 'أسئلة حول {name}',
  'product.related.title': 'منتجات ذات صلة',
  'product.ctaBanner.title': 'تحتاج إلى عرض سعر مخصص؟',
  'product.ctaBanner.subtitle': 'احصل على تسعير قائم على المشروع لـ {name} خلال 24 ساعة. تشمل وثائق SASO/G-Mark.',
  'product.sceneAlt': 'مشهد تطبيق {name}',

  // ── Products List Page ──
  'products.hero.title': 'كتالوج الإضاءة التجارية',
  'products.hero.subtitle': '10 منتجات LED أساسية مع شهادات SASO و G-Mark كاملة. يتوفر التخصيص OEM/ODM لجميع الفئات. مصممة لظروف الشرق الأوسط (مقاومة حرارة 50°م، مقاومة الغبار والأشعة فوق البنفسجية).',
  'products.breadcrumb.products': 'المنتجات',
  'products.filter.all': 'جميع المنتجات',
  'products.noResults': 'لا توجد منتجات في هذه الفئة.',
  'products.resetFilter': 'عرض جميع المنتجات',
  'products.oem.eyebrow': 'تخصيص OEM / ODM',
  'products.oem.title': 'علامتك التجارية، مواصفاتك، تصنيعنا',
  'products.oem.desc': 'من وضع العلامات الخاصة والتغليف المخصص إلى إعادة تصميم المنتج بالكامل وتطوير القوالب — تتولى Yakeen Lighting عملية OEM/ODM بأكملها. مصانعنا الشركاء في جميع أنحاء الصين يقدمون جودة بمستوى الإنتاج مع امتثال SASO/G-Mark.',
  'products.oem.f1': 'العلامات الخاصة والتغليف المخصص',
  'products.oem.f2': 'استطاعة / حرارة لونية / زاوية شعاع مخصصة',
  'products.oem.f3': 'إعادة تصميم المنتج بالكامل وتطوير القوالب',
  'products.oem.f4': 'إدارة SKU حصرية للعلامة التجارية',
  'products.oem.cta': 'ناقش مشروعك ←',

  // ── TrustBar ──
  'trustbar.heading': 'موثوق به في مشاريع الشرق الأوسط',

  // ── AI Search ──
  'ai.search.placeholder': 'صف مشروع الإضاءة الخاص بك… مثلاً "إضاءة مدمجة لبهو فندق UGR<16"',
  'ai.search.button': 'بحث ذكي',
  'ai.search.quickSearch': 'بحث سريع:',
  'ai.search.quick1': 'إضاءة مدمجة UGR<19',
  'ai.search.quick2': 'بانل 600x600',
  'ai.search.quick3': 'كشاف IP65',
  'ai.search.quick4': 'ضوء شارع شمسي',

  // ── Product Gallery ──
  'product.gallery.mainView': 'عرض رئيسي لـ {name}',
  'product.gallery.thumbnail': 'صورة مصغرة {index} لـ {name}',
  'product.gallery.viewImage': 'عرض الصورة {index} من {total}',

  // ── Homepage Categories ──
  'home.cat.indoor.title': 'إضاءة LED مدمجة وكشفات',
  'home.cat.indoor.desc': 'UGR<16 مضادة للوهج، CRI>90، مثالية للمولات والفنادق',
  'home.cat.track.title': 'أضواء المسار LED',
  'home.cat.track.desc': 'دوران 350°، COB LED، إضاءة تجزئة مرنة',
  'home.cat.panel-linear.title': 'أضواء بانل وخطية LED',
  'home.cat.panel-linear.desc': 'حافة رفيعة جداً، 110-130 لومن/واط',
  'home.cat.industrial.title': 'إضاءة HID صناعية LED',
  'home.cat.industrial.desc': '100-240واط، IP65، مقاومة 50°م للمستودعات',
  'home.cat.outdoor.title': 'إضاءة خارجية ومعمارية',
  'home.cat.outdoor.desc': 'ضوء شارع شمسي، كشاف، غسالة جدار — IP66/IP68',

  // ── Contact Form Products ──
  'contact.product.downlights': 'إضاءة LED مدمجة وكشفات',
  'contact.product.track': 'أضواء المسار LED',
  'contact.product.panel': 'أضواء بانل وخطية LED',
  'contact.product.magnetic': 'نظام مسار مغناطيسي',
  'contact.product.highbay': 'إضاءة صناعية LED',
  'contact.product.flood': 'كشافات LED',
  'contact.product.solar': 'أضواء الشارع الشمسية',
  'contact.product.washer': 'غسالة جدار معمارية',
  'contact.product.oem': 'مشروع تخصيص OEM/ODM',

  // ── Product Filter Labels ──
  'products.filter.indoor': 'إضاءة داخلية',
  'products.filter.track': 'إضاءة المسار',
  'products.filter.panel-linear': 'بانل وخطي',
  'products.filter.industrial': 'صناعي',
  'products.filter.outdoor': 'خارجي',

  // ── Certifications Page ──
  'cert.hero.title': 'الشهادات ومراقبة الجودة',
  'cert.hero.subtitle': 'كل منتج يُشحن مع وثائق امتثال كاملة. كل دفعة تجتاز عملية مراقبة جودة من 5 مراحل. كل ادعاء قابل للتحقق.',
  'cert.breadcrumb': 'الشهادات',
  'cert.compliance.eyebrow': 'الامتثال',
  'cert.compliance.title': 'شهاداتنا',
  'cert.qc.eyebrow': 'مراقبة الجودة',
  'cert.qc.title': 'عملية مراقبة جودة من 5 مراحل',
  'cert.qc.desc': 'كل منتج يمر بـ 5 مراحل من مراقبة الجودة قبل الشحن. تتوفر تقارير لكل دفعة.',
  'cert.audit.title': 'تتوفر جولة فيديو للمصنع',
  'cert.audit.desc': 'شاهد مصانعنا الشركاء في الوقت الحقيقي: خطوط إنتاج SMT، ورش التجميع، مختبرات الاختبار، ومستودعات البضائع الجاهزة. احجز جولة فيديو مباشرة عبر واتساب أو زووم.',
  'cert.audit.cta': 'احجز جولة فيديو ←',

  // ── Projects Page ──
  'projects.hero.badge': 'تركيبات حقيقية · 6 دول خليجية',
  'projects.hero.title': 'مشاريع في جميع أنحاء الشرق الأوسط',
  'projects.hero.subtitle': 'تركيبات حقيقية. نتائج حقيقية. استكشف مشاريع الإضاءة المنفذة بمنتجات LED معتمدة SASO و G-Mark — من بهوه الفنادق إلى المستودعات الصناعية.',
  'projects.breadcrumb': 'المشاريع',
  'projects.section.eyebrow': 'دراسات حالة',
  'projects.section.title': 'محفظة مشاريع الإضاءة',
  'projects.section.desc': 'قم بالتصفية حسب نوع المشروع لمعرفة كيفية أداء منتجات Yakeen Lighting في تطبيقات حقيقية في جميع أنحاء المنطقة.',
  'projects.filter.all': 'الكل',
  'projects.filter.hotel': 'فندق',
  'projects.filter.retail': 'تجزئة',
  'projects.filter.office': 'مكتب',
  'projects.filter.industrial': 'صناعي',
  'projects.filter.outdoor': 'خارجي',
  'projects.altSuffix': 'مشروع إضاءة من Yakeen Lighting',
  'projects.cta.eyebrow': 'ابدأ مشروعك',
  'projects.cta.title': 'هل لديك مشروع إضاءة في ذهنك؟',
  'projects.cta.desc': 'من تصميم DIALux إلى تسجيل SABER إلى التسليم — تتولى Yakeen Lighting العملية الكاملة لمشروعك القادم.',
  'projects.card.cta': 'ابدأ مشروعاً مماثلاً',
  'projects.card.empty': 'لا توجد مشاريع في هذه الفئة بعد.',

  // ── FAQ Page ──
  'faq.breadcrumb': 'الأسئلة الشائعة',
  'faq.hero.title': 'الأسئلة الشائعة',
  'faq.hero.subtitle': 'كل ما يحتاج معرفته المشترون في الشرق الأوسط عن الشهادات والتخصيص والتسعير والشحن والجودة.',
  'faq.cta.title': 'لا تزال لديك أسئلة؟',
  'faq.cta.subtitle': 'اتصل بـ Yakeen Lighting مباشرة. نرد خلال 24 ساعة.',
  'faq.cat.certification': 'الشهادات والامتثال',
  'faq.cat.oem': 'تخصيص OEM / ODM',
  'faq.cat.pricing': 'التسعير والدفع',
  'faq.cat.shipping': 'الشحن والتسليم',
  'faq.cat.quality': 'الجودة والضمان',
  'faq.cat.tech': 'الدعم الفني',

  // ── Misc i18n ──
  'product.specs.caption': 'المواصفات الفنية للمنتج',
  'noscript.desc': 'مصنع إضاءة LED تجارية للشرق الأوسط — إضاءة مدمجة، بانل، مسار، كشافات، إضاءة صناعية، وأضواء شارع شمسية. معتمد SASO و G-Mark.',
  'noscript.tagline': 'شريكك الموثوق للإضاءة التجارية في الشرق الأوسط',

  // ── Privacy Policy ──
  'privacy.title': 'سياسة الخصوصية',
  'privacy.updated': 'آخر تحديث:',
  'privacy.date': 'أغسطس 2026',
  'privacy.intro': 'تحترم شركة تاييوان ياكين للتجارة المحدودة. ("Yakeen Lighting"، "نحن") خصوصيتك. توضح هذه السياسة كيف نتعامل مع بياناتك.',
  'privacy.collect.title': 'المعلومات التي نجمعها',
  'privacy.collect.desc': 'عند تقديم نموذج الاتصال الخاص بنا، نجمع: الاسم، الشركة، البريد الإلكتروني، الهاتف/واتساب، الدولة، وتفاصيل المشروع التي تقدمها. تُستخدم هذه المعلومات حصرياً للرد على استفسارك.',
  'privacy.use.title': 'كيف نستخدم بياناتك',
  'privacy.use.desc': 'للرد على الاستفسارات، تقديم عروض الأسعار، إرسال معلومات المنتج، وتنفيذ الطلبات. لا نبيع أو نشارك بياناتك مع أطراف ثالثة لأغراض التسويق.',
  'privacy.analytics.title': 'التحليلات',
  'privacy.analytics.desc': 'نستخدم Google Analytics 4 لفهم أنماط حركة المرور على الموقع. هذه البيانات مجهولة الهوية ومجمعة.',
  'privacy.rights.title': 'حقوقك',
  'privacy.rights.desc': 'يمكنك طلب الوصول إلى بياناتك الشخصية أو تصحيحها أو حذفها عبر البريد الإلكتروني',
  'privacy.contact.title': 'اتصل بنا',
  'privacy.contact.desc': 'أسئلة حول هذه السياسة؟ راسلنا عبر البريد الإلكتروني',

  // ── Aria labels ──
  'aria.aiSearch': 'بحث الإضاءة بالذكاء الاصطناعي',
  'aria.searchProducts': 'ابحث عن منتجات الإضاءة',
  'aria.aiProductSearch': 'بحث منتجات الإضاءة بالذكاء الاصطناعي',
  'aria.certifications': 'الشهادات وإشارات الثقة',
  'aria.breadcrumb': 'مسار التنقل',
  'aria.primary': 'التنقل الرئيسي',
  'aria.mobilePrimary': 'التنقل الرئيسي للجوال',
  'aria.languageSwitcher': 'مبدل اللغة',
  'aria.productFilter': 'تصفية فئات المنتجات',
  'aria.productGallery': 'معرض صور المنتج',
  'product.card.viewDetails': 'عرض تفاصيل {name}',

  // AI Assistant page
  'ai.badge': 'بحث المنتجات بالذكاء الاصطناعي',
  'ai.heroTitle': 'مساعد الإضاءة بالذكاء الاصطناعي',
  'ai.heroSubtitle': 'صف مشروع الإضاءة الخاص بك واحصل على توصيات فورية للمنتجات من كتالوج Yakeen المعتمد بشهادات SASO و G-Mark.',
  'ai.searchPlaceholder': 'صف مشروع الإضاءة الخاص بك… مثال "إضاءة مدمجة لبهو فندق UGR<16"',
  'ai.searchButton': 'بحث',
  'ai.popularSearches': 'عمليات بحث شائعة',
  'ai.showingResults': 'عرض نتائج البحث عن:',
  'ai.howItWorks.eyebrow': 'كيف يعمل',
  'ai.howItWorks.title': 'من البحث إلى عرض السعر في 3 خطوات',
  'ai.howItWorks.desc': 'عملية بسيطة وموجهة للعثور على الإضاءة المعتمدة المناسبة لمشروعك في الشرق الأوسط.',
  'ai.faq.eyebrow': 'الأسئلة الشائعة',
  'ai.faq.title': 'أسئلة مساعد الذكاء الاصطناعي',
  'ai.faq.subtitle': 'كل ما تحتاج معرفته للعثور على الإضاءة المناسبة مع مساعد Yakeen الذكي.',
  'ai.stillQuestions': 'لا تزال لديك أسئلة؟',
  'ai.contactExperts': 'تواصل مع خبراء الإضاءة لدينا',
  'ai.orEmail': 'أو راسلنا على',
  'ai.cta.title': 'هل أنت مستعد للعثور على إضاءتك؟',
  'ai.cta.subtitle': 'صف مشروعك لمساعد الذكاء الاصطناعي، أو تواصل مع Yakeen Lighting مباشرة للحصول على حل مخصص وعرض سعر للمشروع خلال 24 ساعة.',

  // ── 404 Page ──
  '404.title': 'الصفحة غير موجودة',
  '404.message': 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها. دعنا نعيدك إلى المسار الصحيح.',
  '404.backHome': 'العودة للرئيسية',
  '404.stillLost': 'لا تزال لا تجد ما تحتاجه؟',
  '404.contactTeam': 'تواصل مع فريقنا',
  '404.orEmail': 'أو راسلنا على',
  '404.quick.home': 'الرئيسية',
  '404.quick.homeDesc': 'العودة إلى الصفحة الرئيسية',
  '404.quick.products': 'المنتجات',
  '404.quick.productsDesc': 'تصفح كتالوج LED',
  '404.quick.contact': 'اتصل بنا',
  '404.quick.contactDesc': 'تحدث مع خبراء الإضاءة',
  '404.quick.faq': 'الأسئلة الشائعة',
  '404.quick.faqDesc': 'اعثر على إجابات سريعة',

  // ── Testimonials ──
  'testimonials.eyebrow': 'قصص عملائنا',
  'testimonials.title': 'موثوق من مشتري الشرق الأوسط',
  'testimonials.subtitle': 'آراء حقيقية من تجار الجملة والمصممين والبنائين والمقاولين في جميع أنحاء الخليج.',
  'testimonials.t1.badge': 'تاجر جملة',
  'testimonials.t1.text': 'أستورد مصابيح LED من الصين منذ ست سنوات. جرّبت حوالي عشرة موردين قبل الاستقرار مع Yakeen. ما يبقيني معهم بسيط — لا يبدّلون الشرائح في منتصف الطلب. كل دفعة أستلمها تطابق العينة التي وافقت عليها. هذا النوع من الاتساق يهمّ عندما تورّد أكثر من 40 متجراً في الرياض وجدة. أوراق SASO الخاصة بهم دائماً نظيفة، مما يوفّرني متاعب الجمارك.',
  'testimonials.t1.name': 'James Carter',
  'testimonials.t1.role': 'تاجر جملة، الرياض، السعودية',
  'testimonials.t2.badge': 'مصمم',
  'testimonials.t2.text': 'كمصمم ديكور، أهتم بكيف يبدو الضوء وليس فقط مدى سطوعه. أرسل لي Yakeen عينات بنفس المصباح بدرجات حرارة 3000K و4000K و5000K لأقارنها في غرفة نموذجية حقيقية. هذا ليس شيئاً يقدمه كل مورد. مؤشر تجسيد الألوان في تشكيلتهم المميزة يضاهي علامات تكلف ثلاثة أضعاف. مشروع بهو الفندق في دبي مارينا حصل على إطراء من المالك — وهذا أفضل تقييم يمكن أن أطلبه.',
  'testimonials.t2.name': 'David Thompson',
  'testimonials.t2.role': 'مصمم ديكور، دبي، الإمارات',
  'testimonials.t3.badge': 'بنّاء',
  'testimonials.t3.text': 'في الموقع، ليس لدي وقت لمطاردة الموردين. فريق Yakeen كان على WhatsApp يرد خلال ساعة في كل مرة كانت لدي فيها سؤال — حتى في الليل. وصل التسليم لبرج مكاتبنا في مسقط في الوقت المحدد تماماً، والمشغّلات القابلة للتعتيم عملت مباشرة من الصندوق. لا توجد قطع معيبة في دفعة من 1200 مصباح مثبت. هذا النوع من الموثوقية يجعلني أبدو جيداً أمام عميلي.',
  'testimonials.t3.name': 'Hassan Al-Bakri',
  'testimonials.t3.role': 'بنّاء، مسقط، عُمان',
  'testimonials.t4.badge': 'مقاول',
  'testimonials.t4.text': 'فزنا بمناقصة حكومية لمجمع مساجد في الدوحة، والمواصفات كانت صارمة — شهادة G-Mark، مستويات إضاءة محددة، تكامل إضاءة طوارئ. فريق Yakeen التقني تولّى محاكاة DIALux وأرسل لنا تقرير إضاءة كامل. اجتاز مراجعة الاستشاري في التقديم الأول. حتى أنهم صنّفوا كل كرتونة حسب الطابق والمنطقة، مما جعل التركيب في الموقع أسرع بكثير من المتوقع.',
  'testimonials.t4.name': 'Tariq Al-Subaihi',
  'testimonials.t4.role': 'مقاول، الدوحة، قطر',
  'testimonials.t5.badge': 'مديرة مشروع',
  'testimonials.t5.text': 'مشروعي الثاني مع Yakeen — هذه المرة توسعة مركز تسوق في المنامة. ما أبهرني هو ما بعد البيع. بعد ثلاثة أشهر من التركيب، بدأت دفعة من المشغّلات تصدر أزيزاً. أرسلت فيديو، وخلال أسبوع شحنت Yakeen مشغّلات بديلة جواً، بلا نقاش. هذا هو اختبار المورد الحقيقي — ليس كيف يعاملك قبل الطلب، بل ما يحدث بعده. كسبوا ثقتي طويلة الأمد بتلك الحادثة.',
  'testimonials.t5.name': 'Sarah Mitchell',
  'testimonials.t5.role': 'مديرة مشروع، المنامة، البحرين',
};

const translations: Record<Locale, Record<string, string>> = { en, ar };

/** Get locale from URL pathname */
export function getLocale(url: URL): Locale {
  return url.pathname.startsWith('/ar') ? 'ar' : 'en';
}

/** Translate a key for the given locale. Falls back to EN, then to the key itself.
 *  Optional params replace {placeholders} in the translated string. */
export function t(locale: Locale | string, key: string, params?: Record<string, string>): string {
  const l = (locale === 'ar' ? 'ar' : 'en') as Locale;
  let str = translations[l][key] ?? translations.en[key] ?? key;
  if (params) for (const [k, v] of Object.entries(params)) str = str.replaceAll(`{${k}}`, v);
  return str;
}

/** Get text direction for locale */
export function getDir(locale: Locale | string): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** Build the equivalent path for the requested locale */
export function switchLangPath(pathname: string, targetLang: Locale): string {
  const currentLang: Locale = pathname.startsWith('/ar') ? 'ar' : 'en';
  if (targetLang === currentLang) return pathname;
  if (targetLang === 'ar') {
    return pathname === '/' ? '/ar' : `/ar${pathname}`;
  }
  return pathname.replace(/^\/ar/, '') || '/';
}

// ponytail: spec value translation map — technical values (lm/W, CCT, IP, etc.) stay as-is.
const specValueAr: Record<string, string> = {
  '5 years': '5 سنوات',
  '3 years (battery) / 5 years (LED)': '3 سنوات (بطارية) / 5 سنوات (LED)',
  '100 pieces': '100 قطعة',
  '50 pieces': '50 قطعة',
  '50 sets': '50 مجموعة',
  '30 pieces': '30 قطعة',
  '15-25 days': '15-25 يوم',
  '20-30 days': '20-30 يوم',
  '10-20 days': '10-20 يوم',
  'L70 > 50,000 hours': 'L70 > 50,000 ساعة',
  'L70 > 50,000 hours (LED) / 2000+ cycles (battery)': 'L70 > 50,000 ساعة (LED) / 2000+ دورة (بطارية)',
  'Motion sensor (auto dimming)': 'مستشعر حركة (تعتيم تلقائي)',
  '0-10V / DALI / Motion Sensor': '0-10V / DALI / مستشعر حركة',
  'DALI / 0-10V / Smart': 'DALI / 0-10V / ذكي',
};

/** Translate a spec value for the given locale (no-op for EN). */
export function trSpec(locale: Locale | string, value: string): string {
  if (locale !== 'ar') return value;
  return specValueAr[value] ?? value;
}
