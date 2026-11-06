/* ============================================================
   SVG Icon Library — minimal line-style, gold accent
   Icons use currentColor for easy theming via CSS
   ============================================================ */

// Each icon is a 24x24 viewBox SVG with stroke=currentColor
const icons = {
  // 🔦 Spotlight / track light
  '🔦': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <path d="M12 3L8 9h8l-4-6z"/>
    <path d="M9 9v5l-2 5h10l-2-5V9"/>
    <path d="M7 19h10"/>
    <path d="M10 22h4"/>
  </svg>`,

  // 🛠️ Tools / engineering
  '🛠️': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <path d="M14.7 6.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-1.7 1.7-3-3 1.7-1.7z"/>
    <path d="M13 8l-9 9v3h3l9-9"/>
    <path d="M16 5l3-3"/>
    <circle cx="18" cy="16" r="2.5"/>
  </svg>`,

  // 📝 Document / proposal
  '📝': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <rect x="5" y="3" width="14" height="18" rx="1"/>
    <path d="M9 7h6M9 11h6M9 15h4"/>
    <path d="M5 7h14"/>
  </svg>`,

  // 📸 Camera / QC
  '📸': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <rect x="3" y="7" width="18" height="13" rx="1.5"/>
    <circle cx="12" cy="13.5" r="3.5"/>
    <path d="M8 7L9.5 4.5h5L16 7"/>
    <circle cx="17" cy="10" r="0.8" fill="currentColor"/>
  </svg>`,

  // 🚚 Truck / delivery
  '🚚': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <rect x="2" y="8" width="13" height="9" rx="1"/>
    <path d="M15 10h3l3 3v4h-6"/>
    <circle cx="7" cy="18" r="1.8"/>
    <circle cx="17.5" cy="18" r="1.8"/>
    <path d="M2 12h13"/>
  </svg>`,

  // 📌 Pin / highlight
  '📌': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <path d="M12 2v6"/>
    <path d="M8 8l4 12 4-12"/>
    <path d="M6 8h12"/>
    <path d="M9 5h6"/>
  </svg>`,

  // 📧 Email
  '📧': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <rect x="3" y="5" width="18" height="14" rx="1.5"/>
    <path d="M3 6.5l9 6.5 9-6.5"/>
  </svg>`,

  // 📱 Phone / mobile
  '📱': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <rect x="6" y="2.5" width="12" height="19" rx="2"/>
    <path d="M10 20h4"/>
    <path d="M8 6h8"/>
  </svg>`,

  // 🧭 Compass / approach
  '🧭': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <circle cx="12" cy="12" r="9"/>
    <circle cx="12" cy="12" r="6"/>
    <polygon points="12,7 14,12 12,17 10,12" fill="currentColor" stroke="none"/>
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>
  </svg>`,

  // 🌃 City / skyline
  '🌃': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <rect x="3" y="12" width="4" height="9"/>
    <rect x="8" y="8" width="5" height="13"/>
    <rect x="14" y="11" width="3" height="10"/>
    <rect x="18" y="6" width="3" height="15"/>
    <path d="M3 21h18"/>
    <circle cx="18" cy="4" r="0.6" fill="currentColor"/>
  </svg>`,

  // 📑 Report / checklist
  '📑': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <rect x="5" y="3" width="14" height="18" rx="1"/>
    <path d="M8 8l2 2 4-4"/>
    <path d="M8 13h8M8 16h6M8 19h4"/>
    <path d="M5 6h14"/>
  </svg>`,

  // 🔆 Brightness / light
  '🔆': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
    <path d="M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>
  </svg>`,

  // 🏷️ Tag / brand
  '🏷️': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <path d="M19 3H12L3 12l9 9 9-9V3z"/>
    <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/>
  </svg>`,

  // 🚫 Ban / no
  '🚫': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <circle cx="12" cy="12" r="9"/>
    <path d="M6 6l12 12"/>
  </svg>`,

  // 💸 Cost / money
  '💸': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <rect x="4" y="7" width="16" height="10" rx="1.5"/>
    <circle cx="12" cy="12" r="2.5"/>
    <path d="M7 7V5M17 7V5M7 19v-2M17 19v-2"/>
    <path d="M12 8.5v0.5M12 15v0.5"/>
  </svg>`,

  // 🌆 Sunset / wall lights
  '🌆': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <path d="M3 17h18"/>
    <path d="M5 17V10l4-4 4 4v7"/>
    <path d="M15 17V12l2-2 2 2v5"/>
    <circle cx="18" cy="5" r="1.5"/>
    <path d="M3 14h18" stroke-dasharray="1 2"/>
  </svg>`,

  // 🔨 Hammer / manufacturing
  '🔨': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <path d="M14 3l5 5-2 2-5-5 2-2z"/>
    <path d="M12 5L3 14"/>
    <path d="M3 14l-1 4 4-1"/>
    <path d="M10 7l7 7"/>
  </svg>`,

  // 🏡 House / residential
  '🏡': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <path d="M3 12l9-7 9 7"/>
    <rect x="5" y="12" width="14" height="9" rx="0.5"/>
    <rect x="10" y="15" width="4" height="6"/>
    <path d="M5 21h14"/>
  </svg>`,

  // 🏪 Shop / retail
  '🏪': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <path d="M3 9l1.5-4h15L21 9"/>
    <rect x="3" y="9" width="18" height="4" rx="0.5"/>
    <rect x="5" y="13" width="14" height="8" rx="0.5"/>
    <path d="M9 13v8M15 13v8"/>
  </svg>`,

  // 🌏 Globe / Europe
  '🌏': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <circle cx="12" cy="12" r="9"/>
    <path d="M3 12h18"/>
    <path d="M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/>
    <path d="M6 5.5c3 2 9 2 12 0M6 18.5c3-2 9-2 12 0"/>
  </svg>`,

  // 📰 Newspaper / marketing
  '📰': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <rect x="3" y="5" width="14" height="16" rx="0.5"/>
    <rect x="17" y="8" width="4" height="13" rx="0.5"/>
    <path d="M5 8h10M5 11h10M5 14h6M5 17h8"/>
    <path d="M3 7h14"/>
  </svg>`,

  // 🔗 Link / channel
  '🔗': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <path d="M10 14a3.5 3.5 0 0 1 0-5l3-3a3.5 3.5 0 0 1 5 5l-1.5 1.5"/>
    <path d="M14 10a3.5 3.5 0 0 1 0 5l-3 3a3.5 3.5 0 0 1-5-5l1.5-1.5"/>
  </svg>`,

  // 🖼️ Frame / museum
  '🖼️': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <rect x="3" y="3" width="18" height="18" rx="1"/>
    <rect x="6" y="6" width="12" height="12" rx="0.5"/>
    <path d="M6 12l3-3 3 3 3-3 3 3"/>
  </svg>`,

  // 🕌 Mosque / cultural
  '🕌': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <path d="M12 2C10 4 10 7 12 8c2-1 2-4 0-6z"/>
    <path d="M8 8v3"/>
    <rect x="4" y="11" width="16" height="10" rx="0.5"/>
    <path d="M4 11h16"/>
    <path d="M8 21v-5M16 21v-5"/>
    <path d="M12 21v-7"/>
    <path d="M12 8v3"/>
  </svg>`,

  // 🏥 Hospital / healthcare
  '🏥': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:1em;height:1em;display:block;">
    <rect x="4" y="4" width="16" height="17" rx="0.5"/>
    <path d="M4 8h16"/>
    <path d="M12 11v6M9 14h6"/>
    <path d="M7 21v-5M17 21v-5"/>
  </svg>`,
};

module.exports = { icons };
