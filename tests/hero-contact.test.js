/**
 * اختبارات التذكرة 08: البطل والخلاصة والتواصل (سلامة المحتوى ومنطق الفلترة والعرض).
 *
 * التشغيل من جذر المستودع: node --test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONTENT_CATALOG,
  VALID_AUDIENCES,
  getPlatformsForAudience,
} from '../js/content-catalog.js';
import { renderHeroHtml, renderContactHtml } from '../js/views.js';

test('نص البطل يربط #hajjconfex2026 بفلسفة الأساس قبل الذكاء الاصطناعي ويوضح المبادرة الشخصية', () => {
  const { hero } = CONTENT_CATALOG;
  assert.ok(hero.eyebrow.includes('#hajjconfex2026'));
  assert.ok(hero.titlePrefix.length > 0);
  assert.ok(hero.titleHighlight.length > 0);
  assert.ok(hero.subtitle.includes('حوكمة البيانات'));
  assert.ok(hero.initiativeNote.includes('#hajjconfex2026'));
  assert.ok(hero.initiativeNote.includes('غير تابعة'));
});

test('شارتا البطل توضحان الاستشارة المؤسسية المدفوعة والتوجيه المجاني للأفراد والطلاب', () => {
  const badgeTexts = CONTENT_CATALOG.hero.badges.map((b) => b.text);
  assert.ok(badgeTexts.includes('استشارة مؤسسية: مدفوعة'));
  assert.ok(badgeTexts.includes('توجيه للأفراد والطلاب: مجاني'));
});

test('أزرار البطل تشير إلى قسم المحاكي وقسم التواصل', () => {
  const { primaryCta, secondaryCta } = CONTENT_CATALOG.hero;
  assert.equal(primaryCta.label, 'ابدأ المحاكي');
  assert.equal(primaryCta.targetId, 'simulator');
  assert.equal(secondaryCta.targetId, 'contact');
});

test('رسالة الخلاصة فقرة واحدة موجزة وتتناول تفادي الاختناق المؤسسي', () => {
  const { closing } = CONTENT_CATALOG;
  assert.ok(closing.message.length > 40);
  assert.ok(!closing.message.includes('\n'), 'رسالة الخلاصة يجب أن تكون فقرة واحدة');
  assert.ok(closing.message.includes('الاختناق المؤسسي'));
  assert.equal(closing.tracks.b2b.title, 'الاستشارة المؤسسية (مدفوعة)');
  assert.equal(closing.tracks.individual.title, 'التوجيه المجاني');
});

test('سلامة منصات التواصل: كل رابط يبدأ بـ https:// وكل جمهور من القيم الثلاث المعروفة', () => {
  const platforms = CONTENT_CATALOG.contactPlatforms;
  assert.ok(Array.isArray(platforms) && platforms.length >= 2);

  for (const p of platforms) {
    assert.ok(typeof p.id === 'string' && p.id.length > 0, 'معرّف المنصة مطلوب');
    assert.ok(typeof p.name === 'string' && p.name.length > 0, 'اسم المنصة مطلوب');
    assert.ok(typeof p.icon === 'string' && p.icon.length > 0, 'أيقونة المنصة مطلوبة');
    assert.match(p.url, /^https:\/\/.+/, `رابط غير آمن للمنصة ${p.id}: ${p.url}`);
    assert.ok(
      VALID_AUDIENCES.includes(p.audience),
      `جمهور غير معروف للمنصة ${p.id}: ${p.audience}`
    );
  }

  const urls = platforms.map((p) => p.url);
  assert.ok(urls.includes('https://www.linkedin.com/in/salman-alharbi-data-scientist'));
  assert.ok(urls.includes('https://salman-qq.github.io/Portfolio/'));
});

test('إضافة منصة جديدة في الكتالوج تظهر تلقائياً للجمهور المناسب فقط وفي العرض', () => {
  const customCatalog = {
    ...CONTENT_CATALOG,
    contactPlatforms: [
      ...CONTENT_CATALOG.contactPlatforms,
      {
        id: 'b2b-calendar',
        name: 'حجز جلسة استشارية للشركات',
        icon: 'calendar',
        url: 'https://example.com/b2b',
        audience: 'b2b',
      },
      {
        id: 'student-community',
        name: 'مجتمع الخريجين',
        icon: 'chat',
        url: 'https://example.com/students',
        audience: 'individual',
      },
    ],
  };

  const b2bList = getPlatformsForAudience('b2b', customCatalog.contactPlatforms).map((p) => p.id);
  const indList = getPlatformsForAudience('individual', customCatalog.contactPlatforms).map(
    (p) => p.id
  );

  assert.ok(b2bList.includes('linkedin'));
  assert.ok(b2bList.includes('portfolio'));
  assert.ok(b2bList.includes('b2b-calendar'));
  assert.ok(!b2bList.includes('student-community'));

  assert.ok(indList.includes('linkedin'));
  assert.ok(indList.includes('portfolio'));
  assert.ok(indList.includes('student-community'));
  assert.ok(!indList.includes('b2b-calendar'));

  const contactHtml = renderContactHtml(customCatalog);
  assert.ok(contactHtml.includes('https://example.com/b2b'));
  assert.ok(contactHtml.includes('https://example.com/students'));
  assert.match(contactHtml, /target="_blank"\s+rel="noopener noreferrer"/);
  assert.ok(contactHtml.includes('يُفتح في تبويب جديد'));

  const heroHtml = renderHeroHtml(customCatalog);
  assert.ok(heroHtml.includes('<bdi dir="ltr">#hajjconfex2026</bdi>'));
  assert.ok(heroHtml.includes('data-scroll-target="simulator"'));
  assert.ok(heroHtml.includes('data-scroll-target="contact"'));
});
