/**
 * اختبارات الهيكل (التذكرة 01).
 *
 * Node يُستخدم هنا للاختبار المحلي فقط. ملفات الموقع نفسها لا تستورد أي شيء من Node.
 * التشغيل من جذر المستودع: node --test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAppController } from '../js/app-controller.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const html = read('index.html');

/** يجمع كل الملفات بامتداد معيّن داخل مجلد (تكرارياً). */
function filesIn(dir, ext) {
  const abs = join(root, dir);
  return readdirSync(abs).flatMap((name) => {
    const rel = join(dir, name);
    if (statSync(join(root, rel)).isDirectory()) return filesIn(rel, ext);
    return extname(name) === ext ? [rel] : [];
  });
}

const isExternalOrRootAbsolute = (url) => /^(?:[a-z]+:)?\/\//i.test(url) || url.startsWith('/');

test('الصفحة عربية واتجاهها من اليمين لليسار', () => {
  assert.match(html, /<html[^>]*\blang="ar"/);
  assert.match(html, /<html[^>]*\bdir="rtl"/);
});

test('الأقسام الأربعة موجودة بمعرّفاتها الثابتة', () => {
  for (const id of ['hero', 'simulator', 'insights', 'contact']) {
    assert.match(html, new RegExp(`<section[^>]*\\bid="${id}"`), `القسم #${id} مفقود`);
  }
});

test('إخلاء المسؤولية المعتمد موجود حرفياً', () => {
  const disclaimer =
    'هذا المحاكي مجرد افتراض ورؤية تحليلية لما قد يحدث في الشركات بناءً على قرارات تقنية، ولا يمثل استشارة قانونية أو واقعة لجهة بعينها.';
  assert.ok(html.includes(disclaimer));
});

test('كل موارد الصفحة (CSS وJS وخطوط وأيقونات) محلية ونسبية — لا CDN ولا مسارات جذرية', () => {
  const resourceUrls = [
    ...[...html.matchAll(/<link\b[^>]*\bhref="([^"]+)"[^>]*>/g)]
      .filter(([tag]) => !/rel="canonical"/.test(tag))
      .map(([, url]) => url),
    ...[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(([, url]) => url),
  ];
  assert.ok(resourceUrls.length > 0);
  for (const url of resourceUrls) {
    assert.ok(!isExternalOrRootAbsolute(url), `مورد غير نسبي أو خارجي: ${url}`);
  }

  for (const file of filesIn('css', '.css')) {
    for (const [, url] of read(file).matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      assert.ok(!isExternalOrRootAbsolute(url), `${file}: رابط غير نسبي أو خارجي: ${url}`);
    }
  }
});

test('ملفات جافاسكربت الموقع لا تعتمد على Node (تعمل في المتصفح فقط)', () => {
  for (const file of filesIn('js', '.js')) {
    const src = read(file);
    assert.doesNotMatch(src, /from\s+['"]node:/, `${file} يستورد وحدة Node`);
    assert.doesNotMatch(src, /\brequire\s*\(/, `${file} يستخدم require`);
    assert.doesNotMatch(src, /from\s+['"](?:fs|path|url|os|http|https|child_process)['"]/, `${file} يستورد وحدة Node`);
  }
});

test('منسّق التطبيق يُستورد دون DOM ويبدأ بحالة idle', () => {
  const app = createAppController();
  assert.deepEqual(app.getState(), { simulator: 'idle' });
});

