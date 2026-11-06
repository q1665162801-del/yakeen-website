# Yakeen Site — 工程原则

> 每条原则都是踩过的坑。违反了就会出问题，不要自作聪明绕开。

---

## 1. 部署原则

### 1.1 生产环境 = main 分支，不是 production 分支

**惨痛教训（2026-10-14）：** 用 `--branch production` 部署了 N 次，结果全部到了 Preview 环境，正式域名（yakeenlighting.com）一直是旧版本，看起来像"反复横跳"。

**规则：**
- ✅ 生产部署：`npm run deploy` → 内部是 `wrangler pages deploy --branch main`
- ✅ 预览部署：`npm run deploy:preview` → 内部是 `wrangler pages deploy --branch preview`
- ❌ 永远不要手动写 `--branch production`，branch 名和环境名是两回事

**验证方法（部署后必做）：**
```
# 确认正式域名和生产 alias 是同一个版本
# 对比 CSS hash（每个 build 唯一）
https://www.yakeenlighting.com/  ==  https://production.yakeen-lighting.pages.dev/
```
不一致就是部署没生效，立刻查。

### 1.2 部署后必须验证正式域名

部署命令的输出（"Deployment complete"）**不能作为已上线的证据**。必须打开正式域名确认：
- CSS/JS 正常加载（页面不是裸奔状态）
- 本次改动的内容能看到
- 控制台无报错

### 1.3 wrangler 说 "0 files uploaded" = 白部署了

**惨痛教训（2026-10-14）：** 构建后重新部署，wrangler 显示 `Uploaded 0 files`，因为它的本地缓存认为文件没变。实际上 dist 已经是新的，但它没上传。

**规则：**
- 如果部署后发现线上没变，先看是不是 "0 files uploaded"
- 是就加 `--skip-caching` 强制重新上传：`npx wrangler pages deploy dist --branch main --skip-caching`
- 部署后用唯一参数 `?v=随机值` 绕过缓存验证

### 1.4 边缘缓存 + CSS hash = 移动端裸奔风险

**惨痛教训（2026-10-14）：** 每次部署后，KV 边缘缓存里的旧 HTML 引用的是旧 CSS hash（如 `yakeen.abc123.css`），而新部署把旧 CSS 文件替换了。移动端浏览器如果命中旧 HTML 缓存，就会去请求不存在的旧 CSS → 404 → 页面完全没有样式（裸奔）。

**规则：**
- 每次部署后 **必须升级 `CACHE_VERSION`**（在 `functions/_middleware.js` 里），强制所有 KV 缓存失效
- 不要只改 CSS 不改 CACHE_VERSION，否则移动端用户会看到裸奔页面
- CACHE_VERSION 命名格式：`yk-v1`, `yk-v2`, `yk-v3`... 每次 +1
- 部署后用 `?nocache=1` 参数强制绕过 KV 缓存验证效果

### 1.4b Pages Function 构造的响应会绕过 _headers

**惨痛教训（2026-10-16）：** `_middleware.js` 里的 KV 缓存中间件用 `new Response(html, { headers: {...} })` 自己构造响应返回。这种情况下，`_headers` 文件里配置的所有头（CSP、Cache-Control、Referrer-Policy 等）**完全不会应用**。导致 HTML 页面缺安全头、缓存策略不对，但静态资源（图片/CSS）一切正常，排查起来非常迷惑。

**规则：**
- 如果用 Pages Function / _middleware 构造 HTML 响应，必须手动设置所有安全头和缓存头
- 不要依赖 _headers 会自动生效——它只对静态文件有效
- 验证方法：对比 HTML 页面和图片的响应头，如果 HTML 缺 CSP 等头，说明被 Function 绕过去了
- 静态站点尽量不要自己写 HTML 缓存中间件，交给 CDN 就够了

### 1.4c 无痕模式不等于无缓存

**惨痛教训（2026-10-16）：** 页面裸奔了，以为是浏览器本地缓存的问题，开了无痕模式还是裸奔。说明问题不在浏览器本地缓存，而在服务端/边缘缓存（KV、CDN）。

**规则：**
- 无痕模式只隔离 cookie/历史记录/localStorage，HTTP 缓存和边缘缓存依然生效
- 无痕模式下还出问题 → 直接查服务端缓存（KV、CDN），不要浪费时间清浏览器缓存
- 用 `?v=随机数` 或 `?nocache=1` 绕过缓存确认源站状态

### 1.5 移动端必测

**惨痛教训（2026-10-14）：** 桌面端看着没问题，移动端可能完全不一样（字体溢出、布局错乱、背景图消失）。

**规则：**
- 每次样式改动后，必须在真实手机上验证（不是 Chrome DevTools 的设备模拟）
- 至少检查：首页 hero、导航、卡片网格、表单、底部 CTA
- 检查方向：iOS Safari + Android Chrome 各看一眼

### 1.6 HTML 缓存绝对不能设 max-age > 0

**惨痛教训（2026-10-14）：** CSS/JS 用 content hash + immutable 永久缓存，但 HTML 如果设了 `max-age=600`（浏览器缓存 10 分钟），部署后旧 HTML 引用旧 CSS hash → 旧 CSS 文件已被删除 → CSS 404 → 页面裸奔（用户看到的"乱码"）。

**规则：**
- HTML 必须用 `Cache-Control: public, no-cache, must-revalidate`
- 意思是：浏览器可以存，但每次请求必须回源验证（304 则用缓存，200 则换新的）
- 这样部署后用户下一次访问就能拿到最新 HTML，引用最新 CSS hash
- `_headers` 文件里 `/*.html` 和 `/` 两条都必须是 no-cache

---

## 2. 视觉原则

### 2.1 拒绝 AI 味

- 图片生成用真实摄影风格，不要科幻、不要过于干净、不要完美对称
- 建筑/产品图要有自然的瑕疵、真实的光影、材质感
- 绝对不要在图里生成文字、logo、人脸

### 2.2 图片不能重复

- 博客/项目卡片的缩略图，每篇必须有专属图，不能共用同一张 hero 图
- ogImage（社交分享图）也必须每篇不同

### 2.3 颜色不能出错

- 金色色值严格用 CSS 变量，不许手写硬编码色值
- 改颜色之前先确认：页面背景、卡片背景、文字、边框、hover 态都要配套调

### 2.4 对比度是底线

**惨痛教训（2026-10-14）：** 深色 CTA 区域的金色文字、按钮文字，在某些屏幕上几乎看不见。浅色背景上的深色按钮，文字也可能被覆盖成同色系。

**规则：**
- 文字和背景的对比度必须达标（正文至少 4.5:1，大字至少 3:1）
- 深色区域的文字，别用低透明度的金色/浅色，用纯白色或接近白色
- 按钮必须确保：深色底配浅色字，浅色底配深色字，别搞反了
- 改完颜色后，在不同亮度的屏幕上都看看效果

### 2.5 导航 logo 用图片，不用文字拼

**惨痛教训（2026-10-14）：** 导航 logo 用一个 "Y" 字母 + 文字拼的，不是品牌 logo，显得不专业。

**规则：**
- 导航、footer 都用品牌 logo 图片（logo-yakeen.png）
- 不要用单个字母代替 logo
- 图片 logo 保持原比例，高度自适应

---

## 3. 构建原则

### 3.1 0 error / 0 warning 才能上线

`npm run build` 输出必须是：
```
Errors:   0
Warnings: 0
```
有任何错误或警告，修复后再部署。

### 3.2 构建检查项

- 所有 HTML class 在 CSS 里有定义
- 没有死 CSS（定义了但没用的选择器）
- 没有断链（内部链接、锚点链接）
- 重定向规则正确

---

## 4. 调试原则

### 4.1 先看网络，再看代码

页面样式不对，第一步不是改 CSS，而是：
1. 打开 DevTools → Network → 看 CSS 文件是不是 200
2. 看返回的内容对不对
3. 看是不是缓存了旧版本

### 4.2 区分"源站问题"和"缓存问题"

Cloudflare Pages + Cloudflare CDN = 两层缓存。
用缓存绕过参数（`?v=随机值`）确认是源站没更新，还是 CDN 缓存没刷新。

---

## 5. 文件命名原则

- 图片用 kebab-case，全小写，和文章 slug 对应
- 不要在文件名里出现空格、中文、特殊字符
- 生成的图如果有 `(1)` 后缀，立刻重命名去掉

---

## 6. 设计系统与组件原则

### 6.1 内联 `<style>` 标签 = 红线，零容忍

**惨痛教训（2026-10-15）：** 复制粘贴式开发，新增页面时连带 `<style>` 标签一起复制，32 个内联样式散落在各个页面里，改一次公共样式要改 N 个地方，设计系统名存实亡。

**规则：**
- ❌ 任何情况下都不许在 HTML 里写 `<style>` 标签
- ✅ 所有样式必须放在 `css/` 目录的对应文件里
- ✅ 公共组件样式放 `css/components/`，页面特有样式放 `css/pages/`，section 级样式放 `css/sections/`
- ✅ 构建审计 Check 5 是硬错误，检出即失败

**如果某个页面需要特殊样式：** 给外层加一个页面级修饰类（如 `.page--about`），在 CSS 里写覆盖规则，不要用内联 style。

### 6.2 组件统一：一个名字 = 一个权威定义

**惨痛教训（2026-10-15）：** `.ra-card` 在 3 个文件里各定义了一次，`.value-card` 在 4 个文件里各定义了一次。每次改一个地方，其他地方还是旧的，同一个组件在不同页面长得不一样。更糟的是，pages 级 CSS 加载顺序在 components 之后，同名选择器会**全局覆盖**权威定义——chandeliers.css 里的 `.ra-card` 把所有页面的 ra-card 都变成了 4px 圆角 + 无 hover 阴影，这是个隐藏了很久的 bug。

**规则：**
- ✅ 每个组件有且只有一个**权威定义**，放在 `css/components/index.css`
- ✅ 差异化用**修饰类变体**实现：`.ra-card`（基础）+ `.ra-card--text`（纯文字变体），不要重新定义一个同名类
- ✅ 修饰类命名格式：`.组件名--变体名`（BEM 风格的 modifier）
- ✅ 只作用于某个 section 家族的区块放 `css/sections/`，只作用于单个页面的样式放 `css/pages/`
- ❌ 不许在 `css/pages/` 或 `css/sections/` 里重新定义已有的组件类名
- ❌ 不许用"同一个类名，不同文件里写不同样式"的方式实现差异化——这是全局污染
- ✅ 构建审计 Check 7 会检测跨文件重复定义，作为警告持续追踪债务

**历史教训（2026-10-16）：** `css/components/modules.css` 曾是一个 3000 行的"杂物抽屉"，把大量 sections 层级的区块（hero、split-section、cta-banner、accordion 等）越权吞进 components 层。已按所有权原则全部拆解归位并删除该文件。components 层现在只剩 `index.css`（组件权威定义）和 `whatsapp-widget.css`（独立挂件）。

### 6.3 CSS 加载顺序 = 优先级陷阱

**规则：**
- CSS 文件加载顺序：`tokens → base → layout → components → sections → pages → themes → responsive`
- **后面加载的文件，同名选择器会覆盖前面的**（优先级相同的情况下）
- 这意味着 `pages/*.css` 里的选择器优先级天然高于 `components/*.css`
- 所以 pages 里**绝对不能**出现和 components 同名的顶层组件类——它会把全站那个组件都覆盖掉
- 如果 pages 里必须覆盖组件样式，用页面级父类包一层：`.page--chandeliers .ra-card { ... }`

### 6.4 清理一类债务，加一道门禁

**惨痛教训（2026-10-15）：** 清完内联样式，过两天新增页面又带进来了；统一完一个组件，下次复制粘贴又重复定义了。债务是会复发的。

**规则：**
- 每清理完一类技术债务，必须在构建审计里加一道对应的质量门禁
- 门禁级别：
  - **硬错误（ERROR）**：设计系统红线，零容忍，检出即阻止部署——如内联 style 标签
  - **软警告（WARN）**：已知债务，持续追踪，增量为零——如重复类定义、emoji 图标
- 新增的代码不允许增加警告数量（增量为零原则）

**当前门禁清单（构建审计 8 项检查）：**
1. Missing CSS definitions（HTML 类没对应 CSS）
2. Dead CSS selectors（死代码）
3. Broken internal links（内部断链）
4. Broken anchor links（锚点断链）
5. Inline style tags（**硬错误**，设计系统红线）
6. Emoji icons in icon containers（警告，应替换为 SVG）
7. Duplicate CSS class definitions（警告，组件重复定义债务）
8. Redirect rules（重定向循环检测）

### 6.5 脚本目录所有权 = 杂物抽屉陷阱

**惨痛教训（2026-10-16）：** `scripts/` 目录最多时有 94 个文件，其中 80% 是历次债务清理时写的一次性专项脚本（`tmp-*`、`audit-gold2.js`、`cleanup-inline-styles2.js` 等）。新人进来完全分不清哪些是构建核心、哪些是工具、哪些是已经跑完的一次性脚本——和 CSS 的 `modules.css` 杂物抽屉是同一个问题。

**规则：**

`scripts/` 目录采用三级结构，所有权清晰：

| 位置 | 用途 | 数量级 | 例子 |
|------|------|--------|------|
| `scripts/` 根目录 | **构建核心**——被 `build/` 直接 require，构建流程的一部分 | 个位数 | `audit-build.js` |
| `scripts/tools/` | **通用工具箱**——可复用、有明确功能、未来还会用到的工具 | ~20 个 | `move-block.js`、`validate-css.js`、`find-dead-classes.js` |
| `scripts/_archive/` | **一次性脚本**——为某次具体任务写的、任务完成后不再需要的脚本 | 几十上百 | `tmp-*.js`、`audit-*` 专项审计、`fix-*`、`clean-*`、`unify-*` |

- ✅ 新增构建核心脚本 → 放 `scripts/` 根目录，在 `build/` 里有明确引用
- ✅ 新增通用工具 → 放 `scripts/tools/`，命名清晰、功能单一
- ✅ 一次性专项脚本 → 直接写在 `scripts/_archive/` 里，任务结束后不用管
- ❌ 不许把一次性脚本扔在 `scripts/` 根目录"暂时放一下"——放进去就再也不会清了
- ❌ 不许删 `_archive/` 里的脚本，万一日后要回溯或复用有个底

---

## 7. 原则总览

> 快速索引：遇到问题先找对应章节，不要凭感觉。

| 类别 | 核心原则 | 章节 |
|------|----------|------|
| **部署** | 生产 = main 分支，部署后必验正式域名，每次升级 CACHE_VERSION | 1.1, 1.2, 1.4 |
| **部署** | HTML 缓存必须 no-cache，Pages Function 会绕过 _headers，无痕模式 ≠ 无缓存 | 1.4b, 1.4c, 1.6 |
| **视觉** | 拒绝 AI 味，图片不重复，颜色用变量，对比度达标 | 2.1 - 2.4 |
| **构建** | 0 error / 0 warning 才能上线，8 项审计全过 | 3.1, 3.2 |
| **调试** | 先看网络再看代码，区分源站问题和缓存问题 | 4.1, 4.2 |
| **设计系统** | 内联 style 零容忍，一个组件一个权威定义 | 6.1, 6.2 |
| **设计系统** | CSS 加载顺序是陷阱，清理债务加门禁 | 6.3, 6.4 |
| **设计系统** | 脚本目录三级结构，根目录只留构建核心 | 6.5 |
