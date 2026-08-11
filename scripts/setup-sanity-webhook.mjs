/**
 * ponytail: one-shot — creates Sanity webhook → GitHub dispatch.
 * Run: SANITY_TOKEN=xxx GITHUB_PAT=xxx node scripts/setup-sanity-webhook.mjs
 *
 * If SANITY_TOKEN lacks project admin perms (401),
 * use the Sanity dashboard instead (see README below).
 */
const PROJECT_ID = 'e2usb7ms';
const DATASET = 'production';
const REPO = 'q1665162801-del/yakeen-website';

const sanityToken = process.env.SANITY_TOKEN;
const githubPat = process.env.GITHUB_PAT;

if (!sanityToken || !githubPat) {
  console.error('Usage: SANITY_TOKEN=xxx GITHUB_PAT=xxx node scripts/setup-sanity-webhook.mjs');
  process.exit(1);
}

const body = {
  type: 'document',
  name: 'GitHub Auto Deploy',
  url: `https://api.github.com/repos/${REPO}/dispatches`,
  projectId: PROJECT_ID,
  dataset: DATASET,
  httpMethod: 'POST',
  apiVersion: 'v2023-05-03',
  includeDrafts: false,
  onCreate: true,
  onUpdate: true,
  onDelete: true,
  onUnpublish: false,
  filter: '_type == "product"',
  httpHeaders: {
    'Authorization': `token ${githubPat}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ event_type: 'sanity_update' }),
};

const res = await fetch(
  `https://api.sanity.io/v2021-10-04/hooks/projects/${PROJECT_ID}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sanityToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }
);

const data = await res.json();
if (res.ok) {
  console.log('✅ Webhook created successfully!');
  console.log(JSON.stringify(data, null, 2));
} else {
  console.error('❌ Failed:', res.status, JSON.stringify(data, null, 2));
  console.error('\n→ If 401: your Sanity token lacks project admin perms.');
  console.error('  Create a token with "Editor" role at:');
  console.error('  https://www.sanity.io/manage/project/e2usb7ms/api#tokens');
  console.error('\n  Or configure manually in dashboard:');
  console.error('  https://www.sanity.io/manage/project/e2usb7ms/api/webhooks');
  process.exit(1);
}
