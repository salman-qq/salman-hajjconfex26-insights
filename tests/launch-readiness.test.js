/**
 * اختبارات التذكرة 09: جاهزية الإطلاق على GitHub Pages، الوسوم الاجتماعية، الأيقونة، النظافة المعمارية.
 *
 * التشغيل من جذر المستودع: node --test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONTENT_CATALOG } from '../js/content-catalog.js';
import { buildChain } from '../js/simulator-engine.js';
import {
  renderHeroHtml,
  renderSimulatorHtml,
  renderInsightsHtml,
  renderContactHtml,
} from '../js/views.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

function readPngDimensions(relPath) {
  const buf = readFileSync(join(root, relPath));
  assert.equal(
    buf.subarray(0, 8).toString('hex'),
    '89504e470d0a1a0a',
    `الملف ${relPath} ليس صورة PNG صالحة`
  );
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

function filesIn(dir, ext) {
  const abs = join(root, dir);
  return readdirSync(abs).flatMap((name) => {
    const rel = join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) return filesIn(rel, ext);
    return extname(name) === ext ? [rel] : [];
  });
}

test('أيقونة الموقع وصورة المشاركة 1200×630 موجودتان ومربوطتان بمسار GitHub Pages الصحيح', () => {
  const favicon = read('assets/favicon.svg');
  assert.match(favicon, /^<svg\b[^>]*viewBox="0 0 64 64"/);
  assert.ok(favicon.includes('#0B0B0D'));
  assert.ok(favicon.includes('#C9A54C'));

  assert.deepEqual(readPngDimensions('assets/apple-touch-icon.png'), {
    width: 180,
    height: 180,
  });

  assert.deepEqual(readPngDimensions('assets/og-image.png'), {
    width: 1200,
    height: 630,
  });

  const html = read('index.html');
  assert.match(html, /<link\s+rel="icon"\s+href="assets\/favicon\.svg"\s+type="image\/svg\+xml">/);
  assert.match(
    html,
    /<link\s+rel="apple-touch-icon"\s+sizes="180x180"\s+href="assets\/apple-touch-icon\.png">/
  );

  const expectedOgImage =
    'https://salman-qq.github.io/salman-hajjconfex26-insights/assets/og-image.png';
  assert.ok(html.includes(`<meta property="og:image" content="${expectedOgImage}">`));
  assert.ok(html.includes('<meta property="og:image:type" content="image/png">'));
  assert.ok(html.includes('<meta property="og:image:width" content="1200">'));
  assert.ok(html.includes('<meta property="og:image:height" content="630">'));
  assert.ok(html.includes(`<meta name="twitter:image" content="${expectedOgImage}">`));
  assert.ok(!html.includes('مكان محجوز: صورة المعاينة'));
});

test('غياب package.json وأي اعتماديات Node أو طلبات شبكة تلقائية وقت التشغيل', () => {
  for (const forbidden of [
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'node_modules',
  ]) {
    assert.equal(existsSync(join(root, forbidden)), false, `ملف/مجلد ممنوع في المستودع: ${forbidden}`);
  }

  for (const file of filesIn('js', '.js')) {
    const src = read(file);
    assert.doesNotMatch(src, /from\s+['"]node:/);
    assert.doesNotMatch(src, /\brequire\s*\(/);
    assert.doesNotMatch(src, /\bfetch\s*\(/);
    assert.doesNotMatch(src, /\bXMLHttpRequest\b/);
    assert.doesNotMatch(src, /\bBuffer\b/);
  }

  const allowedExternalUrls = new Set([
    ...CONTENT_CATALOG.contactPlatforms.map((p) => p.url),
    ...CONTENT_CATALOG.regulatoryReferences.map((r) => r.url),
  ]);

  // كل الروابط الخارجية في العروض تنتمي إلى منصات التواصل أو المراجع التنظيمية وتُفتح عند نقر الزائر فقط
  const renderedSamples = [
    renderHeroHtml(CONTENT_CATALOG),
    renderSimulatorHtml(
      {
        simulator: 'chainRevealed',
        mode: 'quick',
        sectorId: 'shuttle',
        path: 'husk',
        chain: buildChain('shuttle', 'husk'),
        plan: [],
        evaluation: null,
      },
      CONTENT_CATALOG
    ),
    renderInsightsHtml(CONTENT_CATALOG),
    renderContactHtml(CONTENT_CATALOG),
  ].join('\n');

  for (const [, href] of renderedSamples.matchAll(/\bhref="(https?:\/\/[^"]+)"/g)) {
    assert.ok(allowedExternalUrls.has(href), `رابط خارجي غير مصرح به في العرض: ${href}`);
  }
  assert.doesNotMatch(renderedSamples, /\bsrc="https?:\/\//i);
});

test('التزام main.css بـ tokens.css وحماية .gitignore وتحديث README بالرابط المنشور', () => {
  const mainCss = read('css/main.css');
  assert.doesNotMatch(
    mainCss,
    /#[0-9a-fA-F]{3,8}\b/,
    'ممنوع كتابة قيم hex مباشرة داخل css/main.css — استخدم tokens.css'
  );
  assert.doesNotMatch(
    mainCss,
    /\b(?:rgba?|hsla?)\s*\(/i,
    'ممنوع كتابة rgb/hsl مباشرة داخل css/main.css — استخدم tokens.css أو color-mix'
  );

  const gitignore = read('.gitignore');
  assert.match(gitignore, /^\.agents\/$/m);
  assert.match(gitignore, /^\.scratch\/$/m);
  assert.match(gitignore, /^skills-lock\.json$/m);
  assert.match(gitignore, /^node_modules\/$/m);

  const readme = read('README.md');
  assert.ok(
    readme.includes('https://salman-qq.github.io/salman-hajjconfex26-insights/'),
    'يجب توثيق رابط GitHub Pages في README.md'
  );
});
