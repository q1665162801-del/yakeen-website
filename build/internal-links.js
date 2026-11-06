/**
 * Internal Links Builder — 单站点 SEO 内链自动化
 * 
 * 后处理模式：读取 dist/ 下所有 HTML，注入相关内容区块。
 * 纯字符串操作，零额外依赖。
 * 
 * 原则：
 * 1. 构建后注入，不碰源文件
 * 2. 注入区块带 data-internal-links="true" 标记，审计跳过
 * 3. 基于关键词匹配 + 手动映射表兜底
 * 
 * 注入内容：
 * - 产品页底部：相关博客文章（3-4 篇）
 * - 博客文章底部：相关产品（1-2 个）+ 相关文章（3 篇）
 * - 服务/Hub 页底部：相关博客（6 篇）
 */

const fs = require('fs');
const path = require('path');
const { DIST } = require('./config');
const { walkDir } = require('./utils');

// ===== 关键词映射表 =====
const PRODUCT_KEYWORDS = {
  'products/downlights': ['downlight', 'recessed ceiling', 'UGR', 'anti-glare', 'COB', 'ceiling light'],
  'products/track-spotlights': ['track light', 'spotlight', 'spot light', 'track system', 'retail lighting', 'museum'],
  'products/linear-lighting': ['linear light', 'cove light', 'suspended linear', 'linear system', 'cove lighting', 'office lighting']
};

const SERVICE_KEYWORDS = {
  'specification': ['specification', 'photometric', 'IES file', 'DIALux', 'lighting calculation', 'spec checklist', 'spec mistake'],
  'engineering-hub': ['custom lighting', 'custom fixture', 'engineering', 'bespoke', 'chandelier', 'villa', 'palace', 'mosque lighting', 'hotel lighting specification', 'retail lighting specification', 'restaurant lighting specification'],
  'certifications-resources': ['saso', 'g-mark', 'moiat', 'ecas', 'qatar certification', 'kuwait certification', 'oman certification', 'saber', 'saso 2902', 'saudi customs', 'hs code', 'certification']
};

const BLOG_TOPICS = [
  {
    id: 'gcc-certification',
    keywords: ['saso', 'g-mark', 'moiat', 'qatar-lighting-certification', 'kuwait-lighting-certification',
      'oman-lighting-certification', 'saber', 'saso-2902', 'saso-2', 'saudi-lighting-customs',
      'saudi-lighting-hs', 'certification-guide'],
    pillarPage: 'certifications-resources'
  },
  {
    id: 'product-guides',
    keywords: ['buying-guide', 'downlight-buying', 'track-spotlight-buying', 'linear-lighting-system',
      'wall-washer-light', 'cove-lighting-specification', 'outdoor-architectural',
      'landscape-facade', 'chandelier-buying'],
  },
  {
    id: 'specification-tech',
    keywords: ['lighting-specification-checklist', 'lighting-specification-mistakes', 'photometric-testing',
      'ies-files', 'lighting-calculations-dialux', 'dali-vs-0-10v',
      'cri-cct-ugr', 'what-is-architectural-lighting', 'sustainable-architectural'],
    pillarPage: 'specification'
  },
  {
    id: 'custom-engineering',
    keywords: ['custom-lighting-process', 'how-long-does-custom', 'how-much-does-architectural',
      'engineering-managed-production', 'how-to-request-lighting-quotation'],
    pillarPage: 'engineering-hub'
  },
  {
    id: 'hospitality',
    keywords: ['hotel-lighting', 'gcc-hotel', 'hotel-lighting-specification',
      'hotel-lighting-middle-east'],
  },
  {
    id: 'retail-fb',
    keywords: ['retail-lighting', 'restaurant-lighting', 'restaurant-cafe'],
  },
  {
    id: 'luxury-residential',
    keywords: ['villa-palace', 'riyadh-villa', 'mosque-lighting', 'mosque-islamic',
      'villa-lighting-design-guide', 'custom-chandelier-villa-guide'],
  },
  {
    id: 'gcc-cities',
    keywords: ['architectural-lighting-dubai', 'architectural-lighting-riyadh',
      'lighting-companies-abu-dhabi', 'lighting-companies-jeddah',
      'lighting-suppliers-doha', 'lighting-suppliers-dammam',
      'lighting-kuwait-city', 'lighting-muscat', 'lighting-manama',
      'saudi-arabia-architectural', 'riyadh-boutique', 'jeddah-flagship'],
  }
];

// ===== Pillar Page 子主题分组 =====
// 每个 Pillar Page 包含哪些子主题组，每组的标题和匹配关键词
const PILLAR_GROUPS = {
  'certifications-resources': [
    {
      title: 'Saudi Arabia (SASO)',
      keywords: ['saso', 'saber', 'saudi-lighting-customs', 'saudi-lighting-hs', 'saso-2902', 'saso-2']
    },
    {
      title: 'UAE (MOIAT / ECAS)',
      keywords: ['moiat', 'ecas', 'dubai', 'abu-dhabi']
    },
    {
      title: 'GCC Countries',
      keywords: ['qatar-lighting-cert', 'kuwait-lighting-cert', 'oman-lighting-cert', 'bahrain', 'g-mark']
    },
    {
      title: 'Global Standards',
      keywords: ['certification-guide', 'what-is-architectural-lighting']
    }
  ],
  'specification': [
    {
      title: 'Specification Process',
      keywords: ['lighting-specification-checklist', 'lighting-specification-mistakes', 'how-to-request-lighting-quotation']
    },
    {
      title: 'Photometrics & Calculations',
      keywords: ['photometric-testing', 'ies-files', 'lighting-calculations-dialux']
    },
    {
      title: 'Technical Basics',
      keywords: ['cri-cct-ugr', 'dali-vs-0-10v', 'what-is-architectural-lighting']
    },
    {
      title: 'Application Guides',
      keywords: ['hotel-lighting-specification', 'retail-lighting-specification', 'restaurant-lighting-specification', 'mosque-lighting-specification', 'villa-palace-lighting-spec']
    }
  ],
  'engineering-hub': [
    {
      title: 'Custom Lighting Process',
      keywords: ['custom-lighting-process', 'how-long-does-custom', 'how-much-does-architectural', 'engineering-managed-production']
    },
    {
      title: 'Custom Project Types',
      keywords: ['chandelier-buying', 'villa-palace', 'mosque-lighting', 'mosque-islamic']
    },
    {
      title: 'Design & Specification',
      keywords: ['hotel-lighting-specification', 'retail-lighting-specification', 'lighting-specification-checklist']
    }
  ]
};

// ===== 主函数 =====

function buildInternalLinks() {
  console.log('🔗 Building internal link network...');

  const allPages = collectPages();
  
  const blogPosts = allPages.filter(p => p.type === 'blog');
  const productPages = allPages.filter(p => p.type === 'product');
  const servicePages = allPages.filter(p => p.type === 'service');

  console.log(`   📝 Blog posts: ${blogPosts.length}`);
  console.log(`   📦 Product pages: ${productPages.length}`);
  console.log(`   🛠️  Service/hub pages: ${servicePages.length}`);

  let injectedCount = 0;

  // 1. 产品页 → 相关博客
  for (const page of productPages) {
    const keywords = PRODUCT_KEYWORDS[page.urlKey] || [];
    const related = topMatches(blogPosts, keywords, 4);
    if (related.length >= 2) {
      injectBeforeFooter(page, renderBlogGrid(related, page, 'product'));
      injectedCount++;
    }
  }

  // 2. 博客 → 相关产品 + 相关文章
  for (const post of blogPosts) {
    const relatedProducts = topMatches(productPages, 
      (p) => {
        const kws = PRODUCT_KEYWORDS[p.urlKey] || [];
        return scoreMatch(kws, post.searchText);
      }, 2);

    // 相关文章：同主题优先
    const postTopic = BLOG_TOPICS.find(t => 
      t.keywords.some(kw => post.urlPath.includes(kw))
    );
    
    let relatedPosts = [];
    if (postTopic) {
      relatedPosts = blogPosts
        .filter(p => p.urlPath !== post.urlPath)
        .filter(p => postTopic.keywords.some(kw => p.urlPath.includes(kw)))
        .slice(0, 3);
    }
    
    if (relatedPosts.length < 3) {
      const postKeywords = extractKeywords(post.title + ' ' + post.description);
      const scored = blogPosts
        .filter(p => p.urlPath !== post.urlPath)
        .filter(p => !relatedPosts.includes(p))
        .map(p => ({ post: p, score: scoreMatch(postKeywords, p.searchText) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3 - relatedPosts.length)
        .map(x => x.post);
      relatedPosts = [...relatedPosts, ...scored];
    }
    relatedPosts = relatedPosts.slice(0, 3);

    if (relatedProducts.length > 0 || relatedPosts.length > 0) {
      const html = renderBlogSidebar(relatedProducts, relatedPosts, post);
      injectInArticle(post, html);
      injectedCount++;
    }
  }

  // 3. 服务/Hub 页 → Pillar Page 主题资源库（按子主题分组）
  for (const page of servicePages) {
    const library = buildPillarResourceLibrary(page, blogPosts);
    if (library.groups.length >= 2) {
      injectBeforeFooter(page, renderPillarLibrary(library, page));
      injectedCount++;
    }
  }

  console.log(`   ✅ Injected into ${injectedCount} pages`);
}

// ===== Pillar Page 资源库 =====

function buildPillarResourceLibrary(page, blogPosts) {
  const groups = PILLAR_GROUPS[page.urlKey] || [];
  const resultGroups = [];
  const usedPosts = new Set();
  
  for (const group of groups) {
    const posts = blogPosts
      .filter(p => !usedPosts.has(p.relPath))
      .filter(p => group.keywords.some(kw => 
        p.searchText.includes(kw.toLowerCase())
      ))
      .slice(0, 4);
    
    if (posts.length >= 2) {
      posts.forEach(p => usedPosts.add(p.relPath));
      resultGroups.push({
        title: group.title,
        posts
      });
    }
  }
  
  // 如果分组太少，补一个"All Resources"组放剩余相关文章
  if (resultGroups.length < 2) {
    const allRelated = topMatches(blogPosts, 
      SERVICE_KEYWORDS[page.urlKey] || [], 6);
    const remaining = allRelated.filter(p => !usedPosts.has(p.relPath));
    if (remaining.length >= 2) {
      resultGroups.push({
        title: 'More Resources',
        posts: remaining.slice(0, 4)
      });
    }
  }
  
  return { groups: resultGroups };
}

function renderPillarLibrary(library, fromPage) {
  const groupsHtml = library.groups.map(group => `
    <div class="pillar-group">
      <h3 class="pillar-group__title">${escapeHtml(group.title)}</h3>
      <ul class="pillar-group__list">
        ${group.posts.map(post => `
          <li>
            <a href="${relPathFor(fromPage, post)}" class="pillar-link">
              <span class="pillar-link__title">${escapeHtml(cleanTitle(post.title))}</span>
              <span class="pillar-link__arrow">→</span>
            </a>
          </li>
        `).join('')}
      </ul>
    </div>
  `).join('');
  
  return `
<section class="section pillar-resources-section" data-internal-links="true" data-context="pillar">
  <div class="container">
    <div class="section-header section-header--center">
      <span class="eyebrow">Resource Library</span>
      <h2>Everything you need to know</h2>
      <p class="section-lead">Browse our complete collection of guides, checklists, and technical resources — organized by topic.</p>
    </div>
    <div class="pillar-groups-grid">
      ${groupsHtml}
    </div>
  </div>
</section>`;
}

// ===== 页面收集 =====

function collectPages() {
  const htmlFiles = walkDir(DIST, '.html');
  const pages = [];

  for (const file of htmlFiles) {
    const relPath = path.relative(DIST, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf-8');
    
    const title = extractTag(content, 'title');
    const description = extractMeta(content, 'description');
    const h1 = extractFirstH1(content);
    
    let type = 'other';
    let urlKey = '';
    
    if (relPath.startsWith('blog/') && !relPath.includes('index')) {
      type = 'blog';
      urlKey = relPath.replace('.html', '').replace('blog/', '');
    } else if (relPath.startsWith('products/') && relPath.endsWith('index.html')) {
      type = 'product';
      urlKey = relPath.replace('/index.html', '');
    } else if (relPath === 'specification/index.html') {
      type = 'service';
      urlKey = 'specification';
    } else if (relPath === 'engineering-hub.html') {
      type = 'service';
      urlKey = 'engineering-hub';
    } else if (relPath === 'certifications-resources.html') {
      type = 'service';
      urlKey = 'certifications-resources';
    }
    
    const productName = type === 'product' ? (h1 || cleanTitle(title)) : null;

    pages.push({
      filePath: file,
      relPath,
      urlPath: relPath,
      urlKey,
      type,
      title,
      description,
      productName,
      searchText: (title + ' ' + description + ' ' + relPath).toLowerCase()
    });
  }

  return pages;
}

// ===== 匹配辅助 =====

function topMatches(items, keywordsOrFn, limit) {
  const isFn = typeof keywordsOrFn === 'function';
  return items
    .map(item => ({
      item,
      score: isFn ? keywordsOrFn(item) : scoreMatch(keywordsOrFn, item.searchText)
    }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.item);
}

function scoreMatch(keywords, text) {
  let score = 0;
  const textLower = text.toLowerCase();
  for (const kw of keywords) {
    if (textLower.includes(kw.toLowerCase())) {
      score += kw.length;
    }
  }
  return score;
}

function extractKeywords(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
}

// ===== HTML 提取工具 =====

function extractTag(html, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = html.match(re);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function extractMeta(html, name) {
  const re = new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
  const m = html.match(re);
  if (m) return m[1].trim();
  // 试试反过来：content 在前 name 在后
  const re2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i');
  const m2 = html.match(re2);
  return m2 ? m2[1].trim() : '';
}

function extractFirstH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

// ===== 注入函数 =====

function injectBeforeFooter(page, htmlToInject) {
  const content = fs.readFileSync(page.filePath, 'utf-8');
  // 在 <footer 之前插入
  const footerMatch = content.search(/<footer[^>]*>/i);
  if (footerMatch === -1) return;
  
  const newContent = content.slice(0, footerMatch) + htmlToInject + content.slice(footerMatch);
  fs.writeFileSync(page.filePath, newContent);
}

function injectInArticle(post, htmlToInject) {
  const content = fs.readFileSync(post.filePath, 'utf-8');
  
  // 尝试找 </article> 或 article 结尾
  const articleEnd = content.lastIndexOf('</article>');
  if (articleEnd !== -1) {
    const newContent = content.slice(0, articleEnd) + htmlToInject + content.slice(articleEnd);
    fs.writeFileSync(post.filePath, newContent);
    return;
  }
  
  // 回退：找 footer 前注入
  const footerMatch = content.search(/<footer[^>]*>/i);
  if (footerMatch !== -1) {
    const newContent = content.slice(0, footerMatch) + htmlToInject + content.slice(footerMatch);
    fs.writeFileSync(post.filePath, newContent);
  }
}

// ===== 渲染函数 =====

function renderBlogGrid(posts, fromPage, context) {
  return `
<section class="section related-content-section" data-internal-links="true" data-context="${context}">
  <div class="container">
    <div class="section-header section-header--center">
      <span class="eyebrow">Deep Dive</span>
      <h2>Learn more from our insights</h2>
      <p class="section-lead">Guides, specification resources, and engineering notes for GCC lighting projects.</p>
    </div>
    <div class="related-blog-grid">
      ${posts.map(post => `
        <a href="${relPathFor(fromPage, post)}" class="related-blog-card">
          <div class="related-blog-card__content">
            <h3>${escapeHtml(cleanTitle(post.title))}</h3>
            <p>${escapeHtml(truncate(post.description, 120))}</p>
            <span class="related-blog-card__link">Read more →</span>
          </div>
        </a>
      `).join('')}
    </div>
  </div>
</section>`;
}

function renderBlogSidebar(relatedProducts, relatedPosts, fromPost) {
  let inner = '';
  
  if (relatedProducts.length > 0) {
    inner += `
      <div class="related-products-block" data-internal-links="true" data-type="products">
        <span class="related-block-eyebrow">Product Line</span>
        <h3>Explore the fixtures</h3>
        <div class="related-products-list">
          ${relatedProducts.map(p => `
            <a href="${relPathFor(fromPost, p)}" class="related-product-item">
              <div class="related-product-item__title">${escapeHtml(p.productName || cleanTitle(p.title))}</div>
              <span class="related-product-item__link">View specs →</span>
            </a>
          `).join('')}
        </div>
      </div>`;
  }
  
  if (relatedPosts.length > 0) {
    inner += `
      <div class="related-posts-block" data-internal-links="true" data-type="posts">
        <span class="related-block-eyebrow">Keep Reading</span>
        <h3>More on this topic</h3>
        <div class="related-posts-list">
          ${relatedPosts.map(p => `
            <a href="${relPathFor(fromPost, p)}" class="related-post-item">
              <div class="related-post-item__title">${escapeHtml(cleanTitle(p.title))}</div>
              <span class="related-post-item__link">Read article →</span>
            </a>
          `).join('')}
        </div>
      </div>`;
  }
  
  return `<div class="article-related-wrap" data-internal-links="true">${inner}</div>`;
}

// ===== 路径工具 =====

function relPathFor(fromPage, toPage) {
  const fromDir = fromPage.relPath.includes('/') 
    ? fromPage.relPath.substring(0, fromPage.relPath.lastIndexOf('/') + 1) 
    : '';
  const fromDepth = (fromDir.match(/\//g) || []).length;
  
  let prefix = '';
  for (let i = 0; i < fromDepth; i++) prefix += '../';
  
  // Pretty URLs: strip ".html", and collapse "…/index" to "…/" so Cloudflare
  // serves the directory directly instead of a 308 redirect.
  let rel = toPage.relPath.replace(/\.html$/, '');
  rel = rel.replace(/\/index$/, '/');
  if (rel === 'index') rel = '';

  return prefix + rel;
}

// ===== 文本工具 =====

function cleanTitle(title) {
  return title.replace(/\s*\|.*$/, '').trim();
}

function truncate(text, maxLen) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { buildInternalLinks };
