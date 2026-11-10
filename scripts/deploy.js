/**
 * deploy.js — 唯一发布入口（package.json 的 deploy 只调这一个脚本）
 *
 * 为什么要有它：之前 deploy 是 4 条命令用 && 串起来的，wrangler 上传的是
 * 「当前工作目录里的 dist」，与 git commit 完全无关 —— 线上到底是哪个版本
 * 无从追溯，回滚只能靠控制台按时间点猜。这里把 commit 显式绑定到部署上，
 * 并在最后跑线上自检，任何一项不通过就 exit 1。
 *
 * 顺序：build+audit → wrangler（带 commit）→ IndexNow → 线上自检
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const run = (cmd) => {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT });
};

const git = (args) => {
  try {
    return execSync(`git ${args}`, { cwd: ROOT }).toString().trim();
  } catch {
    return '';
  }
};

const commitHash = git('rev-parse HEAD');
const dirty = git('status --porcelain').length > 0;

if (!commitHash) {
  console.warn('\n⚠️  未检测到 git commit —— 本次部署无法按版本追溯。');
} else if (dirty) {
  console.warn(`\n⚠️  工作区有未提交改动（HEAD=${commitHash.slice(0, 7)}）。`);
  console.warn('   本次部署仍绑定该 commit，但线上内容包含未提交的本地修改。');
  console.warn('   要做到「线上 = 某个 commit」，先 commit 再发布。');
}

run('npm run build');

const flags = [
  '--branch main',
  commitHash ? `--commit-hash=${commitHash}` : '',
  dirty ? '--commit-dirty=true' : '',
]
  .filter(Boolean)
  .join(' ');

run(`npx wrangler pages deploy ${flags}`);
run('node build/indexnow.js');
run('node scripts/postdeploy-check.js');

console.log('\n✅ 发布完成：build → audit → deploy → IndexNow → 线上自检');
