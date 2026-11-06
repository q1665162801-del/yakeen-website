# Yakeen Website — CSS Architecture

## `-webkit-text-fill-color` Usage Policy

**WARNING**: `-webkit-text-fill-color` outranks every `color` declaration at the
paint phase — regardless of specificity, cascade order, or `!important`. If a
fill-color rule is present in the cascade, the browser renders using that
value and ignores `color` entirely.

This project's 2026-10-21 bug history: a global fill-color rule in `themes/light.css`
silently defeated every `color: white` override on dark sections site-wide
(`eng-section--dark`, `cta-section--dark`, `hero-global`, ...), producing
black-on-black text. The team then "fixed" individual dark sections by adding
defensive fill-color patches — a patch war that covered up the real cause
and created 25+ redundant declarations. The root rule was removed; the
defensive patches were then cleanly deleted.

### ALLOWED USES (whitelist)

`-webkit-text-fill-color` may be used **only** in these two scenarios:

1. **Gradient text** — paired with `background-clip: text`
   ```css
   .title {
     background: linear-gradient(...);
     -webkit-background-clip: text;
     background-clip: text;
     -webkit-text-fill-color: transparent;  /* required — no alternative */
   }
   .title em { -webkit-text-fill-color: inherit; }  /* keep accent visible */
   ```

2. **Component-level button text color on a colored background** — but prefer
   plain `color` unless you're inside a gradient-text component context.

### FORBIDDEN USES

- **Global theme overrides** that apply fill-color to broad selectors like
  `.section-title`, `h1`, `h2`, `.section-desc`, or component names that appear
  in both light and dark contexts.
- **"Defensive" patches** — adding fill-color with the same value as the
  preceding `color` declaration to "make sure" the right color wins. If you
  feel the urge to do this, the real problem is elsewhere (check `themes/`,
  check specificity, check cascade order).
- **Any fill-color declaration where the value is not `transparent` or
  `inherit` and the selector is broader than a single button/element class**.

### Current legitimate uses in this repo

| File | Line | Value | Reason |
|---|---|---|---|
| `animations.css` | 72 | `transparent` | shimmer gradient title |
| `animations.css` | 79 | `inherit` | `<em>` inherits shimmer |
| `animations.css` | 197 | `var(--color-text-heading)` | reduced-motion fallback for gradient title (MEDIA QUERY — exempt because it's not a normal flow rule) |
| `cta.css` | 330 | `transparent` | home CTA gradient title |
| `cta.css` | 343 | `inherit` | `<em>` inherits CTA gradient |

**BUILD-LEVEL ENFORCEMENT**: `scripts/audit-build.js` Check 11 scans every `.css` file in `css/`. Any `-webkit-text-fill-color` declaration whose value is not `transparent` or `inherit` (outside a `@media (prefers-reduced-motion)` block) causes a **hard error and blocks deployment**.

## CSS File Map

```
css/
├── tokens.css          Design tokens (colors, spacing, fonts)
├── base.css            Reset + body defaults
├── layout.css          Section header variants, containers
├── responsive.css      Mobile breakpoints (last cascade)
├── animations.css      Keyframes + animated gradient titles
├── themes/
│   ├── light.css       Theme OVERRIDES — NO global fill-color here
│   └── dark.css        Dark variant overrides
├── components/
│   ├── index.css       Buttons, cards, badges
│   └── ...
└── sections/
    ├── hero.css        All hero variants (home, page, country)
    ├── cta.css         All CTA variants
    ├── about.css       Team, values, founder
    ├── misc.css        Why-grid, process steps
    ├── markets.css     Country/market hero
    └── ...
```

Cascade order: tokens → base → layout → themes → components → sections → responsive.
