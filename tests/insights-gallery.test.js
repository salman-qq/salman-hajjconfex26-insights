/**
 * اختبارات التذكرة 07: شبكة اللقطات الاستشارية، البدائل المحلية، القابلية للتوسعة، ونافذة `<dialog>`.
 *
 * تختبر السلوك عبر الواجهات العامة فقط.
 * التشغيل من جذر المستودع: node --test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONTENT_CATALOG } from '../js/content-catalog.js';
import { renderInsightsHtml } from '../js/views.js';
import { createAppController } from '../js/app-controller.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('الكتالوج يضم 6 لقطات استشارية بصور WebP فعلية للشبكة (800×500) ونسخ كاملة للتكبير', () => {
  const { insights } = CONTENT_CATALOG;
  assert.ok(insights);
  assert.equal(insights.items.length, 6);

  const ids = new Set();
  for (const item of insights.items) {
    assert.ok(item.id && !ids.has(item.id), `معرّف مكرر أو مفقود: ${item.id}`);
    ids.add(item.id);

    assert.ok(item.tag && item.title && item.alt && item.commentary);
    assert.equal(item.width, 800);
    assert.equal(item.height, 500);
    assert.equal(item.isPlaceholder, false);

    assert.doesNotMatch(item.imageSrc, /^https?:\/\//i, 'ممنوع استخدام روابط خارجية للصور');
    assert.match(item.imageSrc, /^assets\/insights\/insight-0[1-6]\.webp$/);
    assert.ok(existsSync(join(root, item.imageSrc)), `ملف WebP للشبكة غير موجود: ${item.imageSrc}`);

    const cardHeader = readFileSync(join(root, item.imageSrc)).subarray(0, 12);
    assert.equal(cardHeader.subarray(0, 4).toString('ascii'), 'RIFF');
    assert.equal(cardHeader.subarray(8, 12).toString('ascii'), 'WEBP');

    assert.match(item.lightboxSrc, /^assets\/insights\/insight-0[1-6]-full\.webp$/);
    assert.ok(
      existsSync(join(root, item.lightboxSrc)),
      `ملف WebP الكامل للتكبير غير موجود: ${item.lightboxSrc}`
    );
    assert.ok(Number.isInteger(item.lightboxWidth) && item.lightboxWidth > 0);
    assert.ok(Number.isInteger(item.lightboxHeight) && item.lightboxHeight > 0);

    for (const field of [item.tag, item.title, item.alt, item.commentary]) {
      assert.doesNotMatch(
        field,
        /(صورة المعرض|منشور|قانون الخصوصية|GDPR السعودي|هيئة البيانات|هيئة الذكاء الاصطناعي|المطوّر|الخبير(?!ة))/,
        `مصطلح غير معتمد في البطاقة ${item.id}: ${field}`
      );
      assert.doesNotMatch(field, /[0-9\u0660-\u0669]/, `أرقام غير متوقعة في ${item.id}: ${field}`);
    }
  }
});

test('عرض شبكة اللقطات: 6 بطاقات كسولة التحميل بأبعاد 800×500 دون شارة بديل ونافذة <dialog> قياسية', () => {
  const html = renderInsightsHtml(CONTENT_CATALOG);

  const triggers = html.match(/data-action="open-insight"/g) || [];
  assert.equal(triggers.length, 6);

  const lazyImgs = html.match(/class="insight-card__img"[^>]*loading="lazy"/gs) || [];
  assert.equal(lazyImgs.length, 6);

  for (const item of CONTENT_CATALOG.insights.items) {
    assert.ok(html.includes(`data-insight-id="${item.id}"`));
    assert.ok(html.includes(item.title));
    assert.ok(html.includes(item.commentary));
    assert.ok(html.includes(item.imageSrc));
    assert.ok(html.includes(`alt="${item.alt}"`));
  }

  // تظهر عبارة الشارة البديلة مرة واحدة فقط داخل عنصر <dialog> المخفي افتراضياً
  assert.equal((html.match(/صورة المعرض ستُضاف قريباً/g) || []).length, 1);

  // نافذة dialog أصلية: بلا role="dialog" أو aria-modal
  assert.match(html, /<dialog\b[^>]*id="insight-dialog"/);
  assert.match(html, /\bclosedby="any"/);
  assert.match(html, /aria-labelledby="insight-dialog-title"/);
  assert.doesNotMatch(html, /role="dialog"|aria-modal=/);
  assert.match(html, /<form\b[^>]*method="dialog"/);
  assert.match(html, /data-action="close-insight"/);
});

test('قابلية التوسعة من الكتالوج: إضافة لقطة سابعة واستبدال صورة بـ WebP دون تعديل الكود', () => {
  const modifiedCatalog = {
    ...CONTENT_CATALOG,
    insights: {
      ...CONTENT_CATALOG.insights,
      items: [
        {
          ...CONTENT_CATALOG.insights.items[0],
          imageSrc: 'assets/insights/booth-crowd-real.webp',
          isPlaceholder: false,
        },
        ...CONTENT_CATALOG.insights.items.slice(1),
        {
          id: 'seventh-insight',
          tag: 'استدامة تقنية',
          title: 'لوحات متابعة الأثر التشغيلي المستمر',
          commentary:
            'اللوحة التي تصمد بعد الموسم تعتمد على توثيق واضح وحوكمة بيانات مستقرة.',
        },
      ],
    },
  };

  const html = renderInsightsHtml(modifiedCatalog);
  const triggers = html.match(/data-action="open-insight"/g) || [];
  assert.equal(triggers.length, 7);
  assert.ok(html.includes('assets/insights/booth-crowd-real.webp'));
  assert.ok(html.includes('data-insight-id="seventh-insight"'));
  assert.ok(html.includes('src="assets/insights/insight-01.svg"'));

  // اللقطة السابعة (تعود للبديل الافتراضي) + شارة النافذة المخفية = موضعان
  const placeholderHits = (html.match(/صورة المعرض ستُضاف قريباً/g) || []).length;
  assert.equal(placeholderHits, 2);
});

test('المنسّق يفتح نافذة التكبير بمحتوى اللقطة المختارة ويستعيد الإغلاق', () => {
  const controller = createAppController(CONTENT_CATALOG);
  const target = CONTENT_CATALOG.insights.items[2];

  const elements = {
    tagEl: { textContent: '' },
    titleEl: { textContent: '' },
    imgEl: {
      attrs: {},
      setAttribute(name, val) {
        this.attrs[name] = val;
      },
    },
    placeholderEl: { hidden: true },
    commentaryEl: { textContent: '' },
  };

  let showModalCalls = 0;
  let closeCalls = 0;
  const mockDialog = {
    open: false,
    showModal() {
      this.open = true;
      showModalCalls += 1;
    },
    close() {
      this.open = false;
      closeCalls += 1;
    },
    querySelector(selector) {
      if (selector === '[data-insight-dialog-tag]') return elements.tagEl;
      if (selector === '[data-insight-dialog-title]') return elements.titleEl;
      if (selector === '#insight-dialog-img') return elements.imgEl;
      if (selector === '[data-insight-dialog-placeholder]') return elements.placeholderEl;
      if (selector === '[data-insight-dialog-commentary]') return elements.commentaryEl;
      return null;
    },
  };

  const insightsContainer = {
    innerHTML: '',
    querySelector: () => mockDialog,
  };

  const fakeDoc = {
    documentElement: { classList: { add() {} } },
    defaultView: null,
    getElementById(id) {
      if (id === 'insights-content') return insightsContainer;
      if (id === 'insight-dialog') return mockDialog;
      return null;
    },
    querySelector: () => null,
    addEventListener() {},
  };

  controller.start(fakeDoc);
  assert.ok(insightsContainer.innerHTML.includes('insights-grid'));

  const opened = controller.openInsight(target.id);
  assert.equal(opened?.id, target.id);
  assert.equal(showModalCalls, 1);
  assert.equal(mockDialog.open, true);
  assert.equal(elements.titleEl.textContent, target.title);
  assert.equal(elements.commentaryEl.textContent, target.commentary);
  assert.equal(elements.imgEl.attrs.src, target.lightboxSrc);
  assert.equal(elements.imgEl.attrs.width, String(target.lightboxWidth));
  assert.equal(elements.imgEl.attrs.height, String(target.lightboxHeight));
  assert.equal(elements.imgEl.attrs.alt, target.alt);
  assert.equal(elements.placeholderEl.hidden, true);

  controller.closeInsight();
  assert.equal(closeCalls, 1);
  assert.equal(mockDialog.open, false);

  assert.equal(controller.openInsight('unknown-id'), null);
});

test('الأنماط وتوثيق README يلتزمان بتخطيط الأعمدة (1/2/3) وأبعاد WebP وقواعد dialog', () => {
  const css = readFileSync(join(root, 'css', 'main.css'), 'utf8');
  assert.match(css, /\.insights-grid\s*\{[^}]*minmax\(0,\s*1fr\)/s);
  assert.match(css, /@media\s*\(min-width:\s*40rem\)\s*\{\s*\.insights-grid\s*\{[^}]*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /@media\s*\(min-width:\s*62rem\)\s*\{\s*\.insights-grid\s*\{[^}]*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /\.insight-dialog\[open\]\s*\{/);
  assert.match(css, /\.insight-dialog::backdrop\s*\{[^}]*overscroll-behavior:\s*contain/s);

  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  assert.ok(readme.includes('assets/insights/'));
  assert.ok(readme.includes('WebP'));
  assert.ok(readme.includes('800×500'));
  assert.ok(readme.includes('16:10'));
  assert.ok(readme.includes('js/content-catalog.js'));
  assert.match(readme, /وجوه/);
  assert.match(readme, /بطاقات أسماء/);
});
