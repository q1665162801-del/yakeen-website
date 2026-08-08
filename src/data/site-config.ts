// Site-wide configuration
export const siteConfig = {
  name: 'Yakeen Lighting',
  legalName: 'Taiyuan Yakeen Trading Co., Ltd.',
  tagline: 'Your Trusted Middle East Commercial Lighting Partner',
  url: 'https://www.yakeenlighting.com',
  email: 'yakeenlight@outlook.com',
  phone: '+86-181-0343-4722',
  whatsapp: '8618103434722',
  taxId: '91140105MAKGNY4D8A',
  founder: 'Alan Ma',
  address: {
    street: 'Yingze District, Taiyuan City',
    city: 'Taiyuan',
    region: 'Shanxi',
    postalCode: '030000',
    country: 'CN',
  },
  areaServed: ['SA', 'AE', 'QA', 'KW', 'BH', 'OM'],
  certifications: ['SASO', 'G-Mark', 'CE', 'RoHS', 'ISO 9001:2015'],
  social: {
    linkedin: 'https://www.linkedin.com/company/yakeenlighting',
    facebook: 'https://www.facebook.com/yakeenlighting',
    instagram: 'https://www.instagram.com/yakeen_commercial_lights',
    youtube: 'https://www.youtube.com/@yakeenlighting',
    alibaba: 'https://yakeenlighting.en.alibaba.com',
  },
};

// Navigation structure — single source of truth
export const navItems = [
  { label: 'Home', href: '/', page: 'home', i18nKey: 'nav.home' },
  { label: 'Products', href: '/products', page: 'products', i18nKey: 'nav.products' },
  { label: 'AI Assistant', href: '/ai-assistant', page: 'ai', i18nKey: 'nav.aiAssistant' },
  { label: 'Projects', href: '/projects-cases', page: 'projects', i18nKey: 'nav.projects' },
  { label: 'About', href: '/about', page: 'about', i18nKey: 'nav.about' },
  { label: 'FAQ', href: '/faq', i18nKey: 'nav.faq' },
  { label: 'Certifications', href: '/certifications', page: 'certifications', i18nKey: 'nav.certifications' },
];

export const marketItems = [
  { label: 'Saudi Market', href: '/certifications', i18nKey: 'nav.saudi' },
  { label: 'UAE Market', href: '/certifications', i18nKey: 'nav.uae' },
  { label: 'Middle East', href: '/about', i18nKey: 'nav.middleEast' },
];

// Product categories for filters
export const productCategories = [
  { id: 'indoor', label: 'Indoor Lighting' },
  { id: 'track', label: 'Track Lighting' },
  { id: 'panel-linear', label: 'Panel & Linear' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'outdoor', label: 'Outdoor' },
];

// Languages
export const languages = {
  en: { label: 'EN', dir: 'ltr' },
  ar: { label: 'العربية', dir: 'rtl' },
};
