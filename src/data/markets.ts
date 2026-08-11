// Market-specific data for GEO/AI search optimization.
// ponytail: pure data file, zero abstraction — same pattern as products.ts
// Each market page targets high-intent search queries from Middle East buyers.

export interface MarketFaq {
  question: string;
  answer: string;
}

export interface MarketCert {
  name: string;
  desc: string;
}

export interface MarketProject {
  title: string;
  location: string;
  type: string;
  desc: string;
}

export interface Market {
  slug: string;
  name: string;
  country: string;
  countryCode: string;
  metaTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  // AI-search conclusion-first summary (first paragraph on page)
  summary: string;
  // Market-specific certifications with standard numbers
  certifications: MarketCert[];
  // Featured projects in this market
  projects: MarketProject[];
  // Recommended product categories for this market
  recommendedCategories: string[];
  // Market-specific FAQ (AI engines parse FAQPage schema)
  faqs: MarketFaq[];
  // Arabic translations
  ar?: {
    name: string;
    heroTitle: string;
    heroSubtitle: string;
    summary: string;
    certifications: MarketCert[];
    projects: MarketProject[];
    faqs: MarketFaq[];
  };
}

export const markets: Market[] = [
  {
    slug: 'saudi-arabia',
    name: 'Saudi Arabia Market',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    metaTitle: 'SASO Certified LED Lighting Supplier for Saudi Arabia | Yakeen Lighting',
    metaDescription: 'SASO and SABER registered LED commercial lighting supplier serving Saudi Arabia. Downlights, panel lights, high bays, and solar street lights with full compliance documentation for Saudi customs clearance.',
    heroTitle: 'LED Lighting Solutions for Saudi Arabia',
    heroSubtitle: 'SASO-certified products with SABER registration. From Riyadh hotels to Jeddah malls to NEOM infrastructure — full compliance documentation for Saudi customs.',
    summary: 'Yakeen Lighting is a SASO-certified LED lighting supplier for the Saudi Arabian market. Every product ships with SABER registration and full compliance documentation required by Saudi Customs (SFDA). We serve wholesalers in Riyadh, project contractors in Jeddah, and government tender suppliers across the Kingdom. Saudi Vision 2030 infrastructure projects demand lighting that withstands 50°C heat, sandstorms, and high UV — our products are engineered for these conditions.',
    certifications: [
      { name: 'SASO', desc: 'Saudi Standards, Metrology and Quality Organization certification mandatory for all lighting products imported into Saudi Arabia.' },
      { name: 'SABER', desc: 'Saudi product safety registration platform. Every shipment must have a valid SABER Certificate of Conformity (CoC) for customs clearance.' },
      { name: 'G-Mark', desc: 'GCC Conformity Marking required for low-voltage electrical equipment sold in Saudi Arabia and other GCC countries.' },
      { name: 'CE & RoHS', desc: 'European compliance standards accepted as supporting documentation for Saudi import verification.' },
    ],
    projects: [
      { title: 'Riyadh Hotel Lobby', location: 'Riyadh', type: 'Hotel', desc: 'UGR<16 anti-glare downlights and COB track lights for a 5-star hotel lobby. 1,200 units delivered with DIALux design support.' },
      { title: 'Jeddah Mall Retail', location: 'Jeddah', type: 'Retail', desc: 'Panel lights and magnetic track systems for a shopping mall extension. 3,500 units with custom CCT (4000K) and CRI>90 specification.' },
      { title: 'Dammam Warehouse', location: 'Dammam', type: 'Industrial', desc: '150W UFO high bay lights for a logistics warehouse. IP65 rated, 50°C ambient temperature rated, 130 lm/w efficacy.' },
      { title: 'NEOM Area Roadway', location: 'Tabuk', type: 'Outdoor', desc: 'Solar street lights for a remote access road near NEOM. IP66, 200W solar panel, 5-day battery backup, dust-resistant design.' },
    ],
    recommendedCategories: ['LED Downlights & Spotlights', 'LED Panel Lights', 'LED High Bay', 'Solar Street Lights', 'LED Track Lights'],
    faqs: [
      { question: 'What certifications are required to import LED lighting into Saudi Arabia?', answer: 'Saudi Arabia requires SASO certification and SABER registration for all LED lighting products. The SABER platform issues a Certificate of Conformity (CoC) that must be presented at customs. Additionally, the G-Mark (GCC Conformity Marking) is required for low-voltage electrical equipment. Yakeen Lighting provides all necessary documentation for every shipment.' },
      { question: 'Can Yakeen Lighting help with SABER registration?', answer: 'Yes. We handle SABER registration for all products shipped to Saudi Arabia. Our team submits the required technical files, test reports, and conformity declarations to obtain the Certificate of Conformity before shipment. This ensures smooth customs clearance at Saudi ports.' },
      { question: 'Are your LED products rated for Saudi Arabia\'s climate?', answer: 'Yes. All our products are engineered for GCC conditions: 50°C ambient temperature rating, dust-resistant IP65/IP66 enclosures, UV-resistant materials, and surge protection for areas with unstable power grids. These specifications are verified in our partner factory test labs.' },
      { question: 'What is the typical lead time for Saudi Arabia orders?', answer: 'Standard products: 15-20 days production + 7-10 days shipping to Jeddah Islamic Port or King Abdulaziz Port Dammam. Custom OEM/ODM products: 25-35 days depending on customization scope. SABER registration adds 3-5 days for first-time registrations.' },
      { question: 'Do you support Saudi Vision 2030 infrastructure projects?', answer: 'Yes. We supply lighting products for Vision 2030 mega-projects including NEOM, Red Sea Project, and Qiddiya. Our products meet the stringent technical specifications required by Saudi government tenders, and we provide full DIALux lighting design, LM-80 reports, and project documentation support.' },
    ],
    ar: {
      name: 'السوق السعودي',
      heroTitle: 'حلول إضاءة LED للسوق السعودي',
      heroSubtitle: 'منتجات معتمدة SASO مع تسجيل SABER. من فنادق الرياض إلى مراكز جدة إلى مشاريع نيوم — وثائق امتثال كاملة لتخليص الجمارك السعودية.',
      summary: 'Yakeen Lighting هو مورد إضاءة LED معتمد SASO للسوق السعودي. كل منتج يأتي مع تسجيل SABER ووثائق امتثال كاملة مطلوبة من الجمارك السعودية (SFDA). نخدم الموزعين في الرياض ومقاولي المشاريع في جدة وموردي المناقصات الحكومية في جميع أنحاء المملكة.',
      certifications: [
        { name: 'SASO', desc: 'شهادة الهيئة السعودية للمواصفات والمقاييس والجودة إلزامية لجميع منتجات الإضاءة المستوردة إلى السعودية.' },
        { name: 'SABER', desc: 'منصة السلامة للمنتجات السعودية. كل شحنة يجب أن يكون لديها شهادة مطابقة SABER صالحة لتخليص الجمارك.' },
        { name: 'G-Mark', desc: 'علامة مطابقة دول مجلس التعاون الخليجي المطلوبة للمعدات الكهربائية منخفضة الجهد في السعودية.' },
        { name: 'CE & RoHS', desc: 'معايير الامتثال الأوروبية مقبولة كوثائق داعمة للتحقق من الاستيراد السعودي.' },
      ],
      projects: [
        { title: 'بهو فندق الرياض', location: 'الرياض', type: 'فندق', desc: 'إضاءة موجهة مضادة للوهج UGR<16 وأضواء مسار COB لبهو فندق 5 نجوم. 1,200 وحدة مع دعم تصميم DIALux.' },
        { title: 'مركز تجاري في جدة', location: 'جدة', type: 'تجزئة', desc: 'أضواء لوحية وأنظمة مسار مغناطيسي لتوسعة مركز تجاري. 3,500 وحدة بمواصفات CCT مخصصة (4000K) وCRI>90.' },
        { title: 'مستودع الدمام', location: 'الدمام', type: 'صناعي', desc: 'أضواء عالية UFO 150 واط لمستودع لوجستي. IP65، rated لحرارة 50°م، كفاءة 130 lm/w.' },
        { title: 'طريق نيوم', location: 'تبوك', type: 'خارجي', desc: 'أضواء شوارع شمسية لطريق وصول قرب نيوم. IP66، لوح شمسي 200 واط، بطارية احتياطية 5 أيام.' },
      ],
      faqs: [
        { question: 'ما الشهادات المطلوبة لاستيراد إضاءة LED إلى السعودية؟', answer: 'تتطلب السعودية شهادة SASO وتسجيل SABER لجميع منتجات إضاءة LED. تصدر منصة SABER شهادة مطابقة يجب تقديمها في الجمارك. كما تتطلب علامة G-Mark للمعدات الكهربائية منخفضة الجهد. يوفر Yakeen Lighting جميع الوثائق اللازمة لكل شحنة.' },
        { question: 'هل يمكن لـ Yakeen Lighting المساعدة في تسجيل SABER؟', answer: 'نعم. نتولى تسجيل SABER لجميع المنتجات المشحونة إلى السعودية. يقدم فريقنا الملفات الفنية وتقارير الاختبار وإعلانات المطابقة للحصول على شهادة المطابقة قبل الشحن.' },
        { question: 'هل منتجات LED الخاصة بكم مصممة لمناخ السعودية؟', answer: 'نعم. جميع منتجاتنا مصممة لظروف الخليج: rated لحرارة 50°م، IP65/IP66 مقاومة للغبار، مواد مقاومة للأشعة فوق البنفسجية، وحماية من الطفرات الكهربائية.' },
        { question: 'ما هو وقت التسليم النموذجي للطلبات السعودية؟', answer: 'المنتجات القياسية: 15-20 يوم إنتاج + 7-10 أيام شحن إلى ميناء جدة الإسلامي أو ميناء الملك عبدالعزيز بالدمام. المنتجات المخصصة: 25-35 يوم. تسجيل SABER يضيف 3-5 أيام للتسجيل الأول.' },
        { question: 'هل تدعمون مشاريع رؤية السعودية 2030؟', answer: 'نعم. نورد منتجات الإضاءة لمشاريع رؤية 2030 بما في ذلك نيوم ومشروع البحر الأحمر والقدية. منتجاتنا تلبي المواصفات الفنية الصارمة المطلوبة للمناقصات الحكومية السعودية.' },
      ],
    },
  },
  {
    slug: 'uae',
    name: 'UAE Market',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    metaTitle: 'ECAS & G-Mark Certified LED Lighting Supplier for UAE | Yakeen Lighting',
    metaDescription: 'ECAS and G-Mark certified LED lighting supplier serving Dubai, Abu Dhabi, and Sharjah. Commercial lighting for hotels, malls, warehouses, and urban projects with full UAE compliance documentation.',
    heroTitle: 'LED Lighting Solutions for UAE',
    heroSubtitle: 'ECAS certified, G-Mark compliant. From Dubai Marina towers to Abu Dhabi malls to Sharjah industrial zones — lighting that meets UAE ESMA standards.',
    summary: 'Yakeen Lighting is an ECAS-certified LED lighting supplier for the United Arab Emirates. Our products comply with ESMA (Emirates Authority for Standardization and Metrology) requirements and carry the G-Mark for GCC conformity. We serve interior designers in Dubai, facility managers in Abu Dhabi, and industrial contractors in Sharjah. UAE projects demand premium aesthetics, energy efficiency ratings aligned with Dubai Municipality green building codes, and reliable after-sales support — all of which we provide.',
    certifications: [
      { name: 'ECAS', desc: 'Emirates Conformity Assessment Scheme — mandatory product certification by ESMA for lighting products sold in the UAE.' },
      { name: 'G-Mark', desc: 'GCC Conformity Marking required for low-voltage electrical equipment in UAE and other GCC member states.' },
      { name: 'Dubai Municipality Approval', desc: 'Products meeting Dubai Municipality technical specifications for green building and energy efficiency requirements.' },
      { name: 'CE & RoHS', desc: 'European compliance standards accepted as supporting documentation for UAE import verification.' },
    ],
    projects: [
      { title: 'Dubai Marina Tower', location: 'Dubai', type: 'Hotel', desc: 'Premium downlights with CRI>90 and UGR<16 for a residential hotel tower. 2,000 units with custom gold-trim bezels matching interior design.' },
      { title: 'Abu Dhabi Mall', location: 'Abu Dhabi', type: 'Retail', desc: 'Linear lights and track systems for a luxury retail expansion. 4,500 units with 350° rotation track heads and DALI dimming.' },
      { title: 'Sharjah Industrial Zone', location: 'Sharjah', type: 'Industrial', desc: '200W high bay lights for a manufacturing facility. IP65, 50°C rated, with motion sensor integration for energy savings.' },
      { title: 'Dubai Parks Boulevard', location: 'Dubai', type: 'Outdoor', desc: 'Architectural wall washers and flood lights for an entertainment district. IP66, RGBW color options, DMX control compatible.' },
    ],
    recommendedCategories: ['LED Downlights & Spotlights', 'LED Track Lights', 'LED Panel Lights & Linear Lights', 'LED Flood Lights', 'Architectural Wall Washer'],
    faqs: [
      { question: 'What certifications are required to import LED lighting into the UAE?', answer: 'The UAE requires ECAS (Emirates Conformity Assessment Scheme) certification from ESMA for all lighting products. The G-Mark (GCC Conformity Marking) is also required for low-voltage electrical equipment. Yakeen Lighting provides ECAS-compliant products with full documentation for UAE customs clearance.' },
      { question: 'Do your products meet Dubai green building standards?', answer: 'Yes. Our products meet Dubai Municipality green building code requirements, including minimum luminous efficacy thresholds (≥110 lm/W for indoor, ≥130 lm/W for outdoor), CRI>80 for commercial spaces, and DALI/dimmable options for energy management systems.' },
      { question: 'Can you supply projects in Abu Dhabi and Dubai simultaneously?', answer: 'Yes. We have experience delivering to both Dubai (Jebel Ali Port) and Abu Dhabi (Zayed Port). Our logistics team coordinates shipments to either emirate, and our products carry certifications valid across all UAE emirates.' },
      { question: 'What is the typical lead time for UAE orders?', answer: 'Standard products: 12-18 days production + 5-7 days shipping to Jebel Ali Port or Zayed Port. Custom OEM/ODM: 20-30 days. UAE customs clearance with ECAS documentation typically takes 2-3 days.' },
      { question: 'Do you offer DALI dimming and smart lighting control compatible with UAE projects?', answer: 'Yes. We offer DALI, 0-10V, TRIAC, and PWM dimming options across our product range. For UAE smart building projects, we provide DALI-2 compatible drivers and can integrate with KNX and BMS systems used in Dubai and Abu Dhabi developments.' },
    ],
    ar: {
      name: 'سوق الإمارات',
      heroTitle: 'حلول إضاءة LED للسوق الإماراتي',
      heroSubtitle: 'معتمد ECAS، متوافق مع G-Mark. من أبراج دبي مارينا إلى مراكز أبو ظبي إلى مناطق الشارقة الصناعية — إضاءة تلبي معايير ESMA الإماراتية.',
      summary: 'Yakeen Lighting هو مورد إضاءة LED معتمد ECAS للإمارات العربية المتحدة. منتجاتنا متوافقة مع متطلبات ESMA وتحمل علامة G-Mark لمطابقة دول مجلس التعاون الخليجي. نخدم مصممي الديكور في دبي ومديري المرافق في أبو ظبي ومقاولي الصناعة في الشارقة.',
      certifications: [
        { name: 'ECAS', desc: 'نظام تقييم المطابقة الإماراتي — شهادة منتج إلزامية من ESMA لمنتجات الإضاءة في الإمارات.' },
        { name: 'G-Mark', desc: 'علامة مطابقة دول مجلس التعاون الخليجي المطلوبة للمعدات الكهربائية في الإمارات.' },
        { name: 'موافقة بلدية دبي', desc: 'منتجات تلبي مواصفات بلدية دبي التقنية لمتطلبات المباني الخضراء وكفاءة الطاقة.' },
        { name: 'CE & RoHS', desc: 'معايير الامتثال الأوروبية مقبولة كوثائق داعمة للتحقق من الاستيراد الإماراتي.' },
      ],
      projects: [
        { title: 'برج دبي مارينا', location: 'دبي', type: 'فندق', desc: 'إضاءة موجهة فاخرة CRI>90 وUGR<16 لبرج فندقي سكني. 2,000 وحدة بحواف ذهبية مخصصة.' },
        { title: 'مركز أبو ظبي', location: 'أبو ظبي', type: 'تجزئة', desc: 'إضاءة خطية وأنظمة مسار لتوسعة تجزئة فاخرة. 4,500 وحدة مع تعتيم DALI.' },
        { title: 'منطقة الشارقة الصناعية', location: 'الشارقة', type: 'صناعي', desc: 'أضواء عالية 200 واط لمنشأة تصنيع. IP65، rated لحرارة 50°م، مع تكامل مستشعر الحركة.' },
        { title: 'شارع دبي باركس', location: 'دبي', type: 'خارجي', desc: 'إضاءة معمارية وكشافات لمنطقة ترفيهية. IP66، خيارات RGBW، متوافق مع تحكم DMX.' },
      ],
      faqs: [
        { question: 'ما الشهادات المطلوبة لاستيراد إضاءة LED إلى الإمارات؟', answer: 'تتطلب الإمارات شهادة ECAS من ESMA لجميع منتجات الإضاءة. كما تتطلب علامة G-Mark للمعدات الكهربائية. يوفر Yakeen Lighting منتجات متوافقة مع ECAS مع وثائق كاملة لتخليص الجمارك الإماراتية.' },
        { question: 'هل منتجاتكم تلبي معايير المباني الخضراء في دبي؟', answer: 'نعم. منتجاتنا تلبي متطلبات قانون المباني الخضراء في بلدية دبي، بما في ذلك عتبات الكفاءة (≥110 lm/W داخلي، ≥130 lm/W خارجي) وCRI>80 وخيارات تعتيم DALI.' },
        { question: 'هل يمكنكم توريد المشاريع في أبو ظبي ودبي في وقت واحد؟', answer: 'نعم. لدينا خبرة في التسليم إلى دبي (ميناء جبل علي) وأبو ظبي (ميناء زايد). فريقنا اللوجستي ينسق الشحنات إلى أي إمارة.' },
        { question: 'ما هو وقت التسليم النموذجي للطلبات الإماراتية؟', answer: 'المنتجات القياسية: 12-18 يوم إنتاج + 5-7 أيام شحن. المخصصة: 20-30 يوم. تخليص الجمارك الإماراتية يستغرق عادة 2-3 أيام.' },
        { question: 'هل تقدمون تعتيم DALI والتحكم الذكي بالإضاءة؟', answer: 'نعم. نقدم خيارات تعتيم DALI و0-10V وTRIAC وPWM. للمشاريع الذكية، نوفر مشغلات DALI-2 متوافقة مع أنظمة KNX وBMS.' },
      ],
    },
  },
  {
    slug: 'middle-east',
    name: 'Middle East Market',
    country: 'Middle East & GCC',
    countryCode: 'ME',
    metaTitle: 'Commercial LED Lighting Supplier for Middle East & GCC | Yakeen Lighting',
    metaDescription: 'SASO, G-Mark, ECAS certified LED lighting supplier serving Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, and Oman. OEM/ODM customization with full GCC compliance documentation.',
    heroTitle: 'LED Lighting Solutions for the Middle East',
    heroSubtitle: 'Serving all 6 GCC countries with certified, heat-rated, dust-resistant LED lighting. From Doha mosques to Kuwait towers to Muscat offices — one partner, full compliance.',
    summary: 'Yakeen Lighting is a commercial LED lighting supplier serving the entire Middle East and GCC region: Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, and Oman. We provide a single-source solution for cross-border lighting procurement with certifications valid in all six GCC markets. Our products carry SASO, G-Mark, ECAS, and CE certifications, with 50°C heat rating and IP65/IP66 dust resistance standard across the catalog. Middle East buyers benefit from our localized expertise: Arabic communication, Sharia-compliant business practices, understanding of GCC import regulations, and experience with regional project requirements from mosque lighting to mega-developments.',
    certifications: [
      { name: 'SASO', desc: 'Saudi Standards certification — required for Saudi Arabia market access.' },
      { name: 'G-Mark', desc: 'GCC Conformity Marking — valid across all 6 GCC member states (SA, AE, QA, KW, BH, OM).' },
      { name: 'ECAS', desc: 'Emirates Conformity Assessment Scheme — required for UAE market access.' },
      { name: 'CE & RoHS', desc: 'European compliance standards — accepted as supporting documentation across GCC.' },
    ],
    projects: [
      { title: 'Doha Mosque Complex', location: 'Doha, Qatar', type: 'Religious', desc: 'G-Mark certified downlights and wall washers for a mosque complex. Emergency backup integration, specific lux levels, 3000K warm white for prayer hall ambiance.' },
      { title: 'Kuwait City Tower', location: 'Kuwait City, Kuwait', type: 'Office', desc: 'Panel lights and linear lights for a corporate headquarters. UGR<19, DALI dimming, 4000K, 3,000 units with zone-by-zone labeling.' },
      { title: 'Manama Shopping Mall', location: 'Manama, Bahrain', type: 'Retail', desc: 'Track lights and panel lights for a shopping mall renovation. CRI>90, custom CCT options, 2,800 units delivered with replacement driver stock.' },
      { title: 'Muscat Office Building', location: 'Muscat, Oman', type: 'Office', desc: 'Downlights and panel lights for a commercial office tower. 1,200 units, zero defective on arrival, dimmable drivers worked out of the box.' },
    ],
    recommendedCategories: ['LED Downlights & Spotlights', 'LED Panel Lights & Linear Lights', 'LED High Bay & Industrial', 'LED Track Lights', 'Outdoor & Architectural'],
    faqs: [
      { question: 'Which Middle East countries does Yakeen Lighting serve?', answer: 'We serve all 6 GCC countries: Saudi Arabia (SA), United Arab Emirates (AE), Qatar (QA), Kuwait (KW), Bahrain (BH), and Oman (OM). Our products carry certifications valid across the entire GCC region, including SASO, G-Mark, and ECAS.' },
      { question: 'Can you handle multi-country GCC projects with different certification requirements?', answer: 'Yes. We have experience supplying projects across multiple GCC countries simultaneously. Our products carry G-Mark (valid across all GCC), plus country-specific certifications (SASO for Saudi Arabia, ECAS for UAE). We manage the documentation for each destination country separately.' },
      { question: 'How do you handle shipping to different GCC ports?', answer: 'We ship to all major GCC ports: Jeddah Islamic Port and King Abdulaziz Port Dammam (Saudi Arabia), Jebel Ali Port (UAE), Hamad Port (Qatar), Shuwaikh Port (Kuwait), Khalifa Bin Salman Port (Bahrain), and Sultan Qaboos Port (Oman). DDP shipping terms available.' },
      { question: 'What payment terms do you accept for Middle East buyers?', answer: 'We accept T/T (bank transfer), L/C (Letter of Credit), and Western Union. For established clients, we offer flexible payment terms (30% deposit, 70% before shipment). All payment terms are negotiable based on order volume and relationship history.' },
      { question: 'Do you provide Arabic language support and understand Middle East business culture?', answer: 'Yes. Our team communicates in both English and Arabic. We understand GCC business practices, Islamic finance principles, and the importance of relationship-building in Middle East commerce. Our website is fully bilingual (English/Arabic) with RTL support, and we offer WhatsApp as the primary communication channel — preferred by most Middle East buyers.' },
    ],
    ar: {
      name: 'الشرق الأوسط',
      heroTitle: 'حلول إضاءة LED للشرق الأوسط',
      heroSubtitle: 'نخدم جميع دول مجلس التعاون الخليجي الست بإضاءة LED معتمدة ومقاومة للحرارة والغبار. من مساجد الدوحة إلى أبراج الكويت إلى مكاتب مسقط — شريك واحد، امتثال كامل.',
      summary: 'Yakeen Lighting هو مورد إضاءة LED تجارية يخدم منطقة الشرق الأوسط ودول مجلس التعاون الخليجي بأكملها: السعودية والإمارات وقطر والكويت والبحرين وعمان. نقدم حلاً مصدراً واحداً لشراء الإضاءة عبر الحدود مع شهادات صالحة في جميع أسواق الخليج الستة.',
      certifications: [
        { name: 'SASO', desc: 'شهادة الهيئة السعودية للمواصفات — مطلوبة للوصول إلى السوق السعودي.' },
        { name: 'G-Mark', desc: 'علامة مطابقة دول مجلس التعاون الخليجي — صالحة في جميع دول الخليج الست.' },
        { name: 'ECAS', desc: 'نظام تقييم المطابقة الإماراتي — مطلوب للوصول إلى السوق الإماراتي.' },
        { name: 'CE & RoHS', desc: 'معايير الامتثال الأوروبية — مقبولة كوثائق داعمة في الخليج.' },
      ],
      projects: [
        { title: 'مجمع مسجد الدوحة', location: 'الدوحة، قطر', type: 'ديني', desc: 'إضاءة موجهة وكشافات جدارية معتمدة G-Mark لمجمع مسجد. تكامل نظام الطوارئ، 3000K أبيض دافئ.' },
        { title: 'برج مدينة الكويت', location: 'مدينة الكويت، الكويت', type: 'مكتبي', desc: 'أضواء لوحية وخطية لمقر شركة. UGR<19، تعتيم DALI، 3,000 وحدة.' },
        { title: 'مركز تجاري المنامة', location: 'المنامة، البحرين', type: 'تجزئة', desc: 'أضواء مسار وألواح لتجديد مركز تجاري. CRI>90، 2,800 وحدة.' },
        { title: 'مبنى مكاتب مسقط', location: 'مسقط، عمان', type: 'مكتبي', desc: 'إضاءة موجهة وألواح لبرج مكاتب تجاري. 1,200 وحدة، صفر معيب.' },
      ],
      faqs: [
        { question: 'ما دول الشرق الأوسط التي يخدمها Yakeen Lighting؟', answer: 'نخدم جميع دول مجلس التعاون الخليجي الست: السعودية والإمارات وقطر والكويت والبحرين وعمان. منتجاتنا تحمل شهادات صالحة في جميع أنحاء الخليج.' },
        { question: 'هل يمكنكم التعامل مع مشاريع خليجية متعددة الدول؟', answer: 'نعم. لدينا خبرة في توريد المشاريع عبر دول الخليج. منتجاتنا تحمل G-Mark بالإضافة إلى شهادات خاصة بكل دولة.' },
        { question: 'كيف تتعاملون مع الشحن إلى موانئ الخليج المختلفة؟', answer: 'نشحن إلى جميع الموانئ الخليجية الرئيسية: ميناء جدة الإسلامي، ميناء جبل علي، ميناء حمد، ميناء الشويخ، وغيرها. شحن DDP متاح.' },
        { question: 'ما شروط الدفع للمشترين من الشرق الأوسط؟', answer: 'نقبل التحويل البنكي (T/T) وخطاب الاعتماد (L/C). للعملاء الدائمين، نقدم شروط دفع مرنة (30% دفعة مقدمة، 70% قبل الشحن).' },
        { question: 'هل تقدمون دعم اللغة العربية؟', answer: 'نعم. فريقنا يتواصل بالإنجليزية والعربية. نفهم ممارسات الأعمال الخليجية ومبادئ التمويل الإسلامي. موقعنا ثنائي اللغة بالكامل.' },
      ],
    },
  },
];

export async function getAllMarkets(): Promise<Market[]> {
  return markets;
}

export async function getMarket(slug: string): Promise<Market | undefined> {
  return markets.find((m) => m.slug === slug);
}

export async function getAllMarketSlugs(): Promise<string[]> {
  return markets.map((m) => m.slug);
}
