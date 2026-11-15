/**
 * اختبارات التذكرة 06: المراجع التنظيمية (SDAIA / NDMO) وسلامة روابطها وتكاملها مع المحاكي والعرض.
 *
 * تختبر السلوك عبر الواجهات العامة فقط.
 * التشغيل من جذر المستودع: node --test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CONTENT_CATALOG } from '../js/content-catalog.js';
import { buildChain, evaluatePlan } from '../js/simulator-engine.js';
import {
  getRegulatoryThumbnailSvg,
  renderBuilderResultHtml,
  renderSimulatorHtml,
} from '../js/views.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('الكتالوج يضم المرجعين التنظيميين (سدايا وNDMO) بأسماء وصور مصغرة بديلة وروابط https فقط', () => {
  const refs = CONTENT_CATALOG.regulatoryReferences;
  assert.equal(refs.length, 2);
  assert.deepEqual(
    refs.map((r) => r.id),
    ['sdaia', 'ndmo']
  );

  for (const ref of refs) {
    assert.ok(ref.name && ref.shortLabel && ref.subtitle && ref.thumbnailKey);
    assert.match(ref.url, /^https:\/\//, `رابط غير آمن: ${ref.url}`);
    assert.match(ref.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    const thumbSvg = getRegulatoryThumbnailSvg(ref.thumbnailKey);
    assert.match(thumbSvg, /^<svg\b[^>]*aria-hidden="true"/);
  }
});

test('سلامة ربط الحلقات بالكتالوج وعدم وجود أرقام غرامات أو نصوص مواد نظامية', () => {
  const refIds = new Set(CONTENT_CATALOG.regulatoryReferences.map((r) => r.id));

  for (const axis of CONTENT_CATALOG.axes) {
    for (const link of [axis.negativeLink, axis.positiveLink]) {
      if (link.regulatoryRefId) {
        assert.ok(refIds.has(link.regulatoryRefId), `مرجع غير موجود: ${link.regulatoryRefId}`);
      }
      for (const field of [link.title, link.simple, link.expert]) {
        assert.doesNotMatch(field, /[0-9\u0660-\u0669]/, `أرقام غير مسموحة في المحاور: ${field}`);
        assert.doesNotMatch(field, /(مادة|غرامة|مليون|سجن)/, `صياغة جزائية/نظامية: ${field}`);
      }
    }
  }

  for (const ref of CONTENT_CATALOG.regulatoryReferences) {
    for (const field of [ref.name, ref.shortLabel, ref.subtitle]) {
      assert.doesNotMatch(field, /[0-9\u0660-\u0669]/, `أرقام غير مسموحة في المرجع: ${field}`);
      assert.doesNotMatch(field, /(قانون الخصوصية|GDPR السعودي|هيئة البيانات|هيئة الذكاء الاصطناعي|المادة القانونية)/);
    }
  }

  const complianceAxis = CONTENT_CATALOG.axes.find((a) => a.id === 'compliance');
  assert.equal(complianceAxis.negativeLink.regulatoryRefId, 'sdaia');
  assert.equal(complianceAxis.positiveLink.regulatoryRefId, 'ndmo');
});

test('المحرك يربط مرجعي سدايا وNDMO بحلقتي الامتثال في الرحلتين ويرفض المراجع غير المعرّفة', () => {
  const huskCompliance = buildChain('shuttle', 'husk').find((l) => l.axisId === 'compliance');
  assert.equal(huskCompliance.regulatoryRef.id, 'sdaia');
  assert.equal(buildChain('shuttle', 'husk')[0].regulatoryRef, null);

  const foundationCompliance = buildChain('shuttle', 'foundation').find((l) => l.axisId === 'compliance');
  assert.equal(foundationCompliance.regulatoryRef.id, 'ndmo');

  // خطة متسرعة تبدأ بالذكاء دون لبنة التصنيف -> حلقة امتثال سلبية بمرجع سدايا
  const rushedWithoutCompliance = evaluatePlan('catering', [
    'ai-forecast',
    'docs-knowledge',
    'gdp-onboarding',
    'kpi-roi',
  ]);
  const evalNegCompliance = rushedWithoutCompliance.chain.find((l) => l.axisId === 'compliance');
  assert.equal(evalNegCompliance.polarity, 'negative');
  assert.equal(evalNegCompliance.regulatoryRef.id, 'sdaia');

  // خطة صحيحة (أساس أولاً) تمنح حلقة امتثال إيجابية بمرجع NDMO وتُدرج التصنيف غير المختار في التوصيات التوسعية إن غاب
  const withCompliance = evaluatePlan('catering', [
    'docs-knowledge',
    'gdp-onboarding',
    'data-classification',
    'ai-forecast',
  ]);
  const evalPosCompliance = withCompliance.chain.find((l) => l.axisId === 'compliance');
  assert.equal(evalPosCompliance.polarity, 'positive');
  assert.equal(evalPosCompliance.regulatoryRef.id, 'ndmo');

  // كتالوج مع مرجع مفقود يرفضه المحرك بخطأ واضح
  const brokenCatalog = {
    ...CONTENT_CATALOG,
    regulatoryReferences: [],
  };
  assert.throws(() => buildChain('shuttle', 'husk', brokenCatalog), /مرجع تنظيمي غير معروف/);
});

test('العرض يظهر الصورة المصغرة والرابطين المباشرين (الوثيقة + المنصة) وإشارة النافذة الجديدة في النمطين', () => {
  const quickChain = buildChain('shuttle', 'husk');
  const quickHtml = renderSimulatorHtml(
    {
      simulator: 'chainRevealed',
      mode: 'quick',
      sectorId: 'shuttle',
      path: 'husk',
      chain: quickChain,
    },
    CONTENT_CATALOG
  );

  assert.match(quickHtml, /data-regulatory-ref="sdaia"/);
  assert.match(
    quickHtml,
    /href="https:\/\/dgp\.sdaia\.gov\.sa\/wps\/portal\/pdp\/knowledgecenter\/details\/PDPL"/
  );
  assert.match(
    quickHtml,
    /href="https:\/\/sdaia\.gov\.sa\/ar\/Research\/Pages\/DataProtection\.aspx"/
  );
  assert.match(quickHtml, /target="_blank"/);
  assert.match(quickHtml, /rel="noopener noreferrer"/);
  assert.match(quickHtml, /regulatory-ref__thumb-svg/);
  assert.match(quickHtml, /يُفتح في نافذة جديدة/);
  assert.doesNotMatch(quickHtml, /PersonalData\.pdf|PoliciesAr001\.pdf|PageNotFoundError/i);

  const evaluated = evaluatePlan('shuttle', [
    'docs-knowledge',
    'gdp-onboarding',
    'data-classification',
    'ai-forecast',
  ]);
  const builderHtml = renderBuilderResultHtml(evaluated, CONTENT_CATALOG);
  assert.match(builderHtml, /data-regulatory-ref="ndmo"/);
  assert.match(
    builderHtml,
    /href="https:\/\/sdaia\.gov\.sa\/ar\/Sectors\/Ndmo\/Pages\/default\.aspx"/
  );
  assert.match(builderHtml, /href="https:\/\/dgp\.sdaia\.gov\.sa\/"/);
  assert.match(builderHtml, /target="_blank"/);
  assert.match(builderHtml, /rel="noopener noreferrer"/);
  assert.match(builderHtml, /يُفتح في نافذة جديدة/);
  assert.doesNotMatch(builderHtml, /PersonalData\.pdf|PoliciesAr001\.pdf|PageNotFoundError/i);

  // التحقق من استخدام اللون المعتمد --link-external في تنسيق المراجع التنظيمية دون ألوان خام
  const css = readFileSync(join(root, 'css/main.css'), 'utf8');
  assert.match(css, /\.regulatory-ref[\s\S]*var\(--link-external\)/);
});

