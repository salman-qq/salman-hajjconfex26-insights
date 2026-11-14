/**
 * اختبارات التذكرة 10: المحاكي التنفيذي المتكامل وديناميكيات الواقع المؤسسي.
 *
 * تختبر المخرجات الستة الإلزامية:
 * 1. مفتاح حجم المنشأة (Enterprise vs. SME Scale Toggle) وتأثيره على مصير الشركة
 * 2. لوحة المؤشرات الحية الرباعية (4 Live Telemetry Meters) شاملة «ذاكرة الموظف»
 * 3. الفصول الزمنية الثلاثة وتأثير القرار المتأخر (3-Phase Delayed Consequence Timeline)
 * 4. مختبر الوقائع العالمية الحقيقية (Real-World Case Studies — من نجح ومن فشل)
 * 5. العناوين والتعليقات التنفيذية الجديدة للصور الست الحقيقية وربط «شاهد ميداني من المعرض»
 * 6. بطاقة «الفكرة العامة والتشخيص التنفيذي» ونسخ ملخص LinkedIn وزر حجز الاستشارة
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONTENT_CATALOG,
  VALID_CASE_FILTERS,
  VALID_SCALES,
} from '../js/content-catalog.js';
import {
  buildConsequenceTimeline,
  buildExecutiveDiagnosis,
  computeTelemetry,
  evaluatePlan,
  getCaseStudies,
  resolveFieldEvidence,
  resolveScale,
} from '../js/simulator-engine.js';
import { createAppController } from '../js/app-controller.js';
import {
  renderBuilderResultHtml,
  renderSimulatorHtml,
} from '../js/views.js';

test('1. مفتاح حجم المنشأة يميز بين الشركة الكبرى والمنشأة المتوسطة أو الصغيرة ويغير المصير النهائي', () => {
  assert.deepEqual(VALID_SCALES, ['enterprise', 'sme']);
  const enterprise = resolveScale('enterprise');
  const sme = resolveScale('sme');

  assert.equal(enterprise.label, 'شركة كبرى (ملاءة مالية عالية)');
  assert.equal(
    sme.label,
    'منشأة متوسطة أو صغيرة (موارد محدودة وحساسية عالية للسيولة)'
  );

  assert.match(
    enterprise.outcomes.negative.fateSummary,
    /خسارة مالية ضخمة تُسجّل في القوائم المالية كبند تحول رقمي\/استدامة مع بقاء الشركة/
  );
  assert.match(
    sme.outcomes.negative.fateSummary,
    /أزمة سيولة حادة، شلل تشغيلي، وخطر الخروج من السوق/
  );

  const evalEnterprise = evaluatePlan(
    'shuttle',
    ['ai-forecast', 'ai-assistant', 'ai-dashboard', 'docs-knowledge'],
    CONTENT_CATALOG,
    { scaleId: 'enterprise' }
  );
  const evalSme = evaluatePlan(
    'shuttle',
    ['ai-forecast', 'ai-assistant', 'ai-dashboard', 'docs-knowledge'],
    CONTENT_CATALOG,
    { scaleId: 'sme' }
  );

  assert.equal(evalEnterprise.tier.id, 'at-risk');
  assert.equal(evalSme.tier.id, 'at-risk');
  assert.notEqual(
    evalEnterprise.diagnosis.financialImpact,
    evalSme.diagnosis.financialImpact
  );
  assert.match(evalEnterprise.diagnosis.financialImpact, /بقاء الشركة/);
  assert.match(evalSme.diagnosis.financialImpact, /خطر الخروج من السوق/);
});

test('2. لوحة المؤشرات الحية الرباعية تعرض المؤشرات الأربعة وتبرز منطق «ذاكرة الموظف وثقة الفريق»', () => {
  const metersConfig = CONTENT_CATALOG.telemetryMeters;
  assert.equal(metersConfig.items.length, 4);
  assert.deepEqual(
    metersConfig.items.map((m) => m.id),
    ['financial', 'trust', 'compliance', 'resilience']
  );

  const trustConfig = metersConfig.items.find((m) => m.id === 'trust');
  assert.match(trustConfig.label, /ذاكرة الموظف وثقة الفريق/);
  assert.match(metersConfig.employeeMemoryCalloutBody, /ذاكرة الموظف/);
  assert.match(metersConfig.employeeMemoryCalloutBody, /العمل اليدوي لتصحيح أخطاء الآلة/);

  const huskMeters = computeTelemetry({
    scaleId: 'sme',
    mode: 'quick',
    path: 'husk',
  });
  const foundationMeters = computeTelemetry({
    scaleId: 'sme',
    mode: 'quick',
    path: 'foundation',
  });

  for (let i = 0; i < 4; i += 1) {
    assert.equal(huskMeters[i].tone, 'negative');
    assert.equal(foundationMeters[i].tone, 'positive');
    assert.ok(foundationMeters[i].value > huskMeters[i].value);
  }
});

test('3. الفصول الزمنية الثلاثة تعرض مراحل ضبابية القيادة وتخصص المرحلة الثالثة حسب حجم المنشأة', () => {
  const enterprisePhases = buildConsequenceTimeline({
    tone: 'negative',
    scaleId: 'enterprise',
    sectorId: 'catering',
  });
  const smePhases = buildConsequenceTimeline({
    tone: 'negative',
    scaleId: 'sme',
    sectorId: 'catering',
  });

  assert.equal(enterprisePhases.length, 3);
  assert.equal(enterprisePhases[0].timeframe, 'بداية التطبيق');
  assert.equal(enterprisePhases[1].timeframe, 'ذروة الموسم');
  assert.equal(enterprisePhases[2].timeframe, 'بعد 6 أشهر — التقرير الختامي');

  assert.match(enterprisePhases[0].narrative, /انطباع خادع/);
  assert.match(enterprisePhases[1].narrative, /اختبار الضغط الميداني المفاجئ/);
  assert.match(enterprisePhases[2].narrative, /ذاكرة الموظف/);
  assert.match(enterprisePhases[2].narrative, /بقاء الشركة/);
  assert.match(smePhases[2].narrative, /خطر الخروج من السوق/);
});

test('4. مختبر الوقائع العالمية يضم الوقائع الخمس الموثقة بالأسماء والأرقام ويدعم التصفية', () => {
  assert.deepEqual(VALID_CASE_FILTERS, ['all', 'failure', 'success']);

  const allCases = getCaseStudies('all');
  const failedCases = getCaseStudies('failure');
  const successCases = getCaseStudies('success');

  assert.equal(allCases.length, 5);
  assert.equal(failedCases.length, 3);
  assert.equal(successCases.length, 2);

  const companies = allCases.map((c) => c.company);
  assert.ok(companies.includes('Zillow Offers'));
  assert.ok(companies.includes("McDonald's & IBM AI Drive-Thru"));
  assert.ok(companies.includes('Air Canada Chatbot'));
  assert.ok(companies.includes('UPS ORION'));
  assert.ok(companies.includes("Domino's Pizza Data Platform"));

  const zillow = allCases.find((c) => c.id === 'zillow');
  assert.match(zillow.summary, /500 مليون دولار/);
  assert.match(zillow.summary, /25%/);

  const mcd = allCases.find((c) => c.id === 'mcdonalds-ibm');
  assert.match(mcd.summary, /100 فرع/);

  const ups = allCases.find((c) => c.id === 'ups-orion');
  assert.match(ups.summary, /100 مليون ميل/);
  assert.match(ups.summary, /400 مليون دولار/);

  const dominos = allCases.find((c) => c.id === 'dominos');
  assert.match(dominos.summary, /95%/);
});

test('5. الصور الست الحقيقية تحمل العناوين التنفيذية الستة المعتمدة وكل قطاع يرتبط بشاهد ميداني', () => {
  const expectedTitles = [
    'وهم الجوائز مقابل حقيقة القوائم المالية',
    'حقيبة واحدة ضائعة تكشف غياب حوكمة البيانات',
    'حين تشتري الإدارة روبوتاً وتخسر ذاكرة موظفيها',
    'عين في السماء.. ولكن هل يراها مركز القرار؟',
    'الموظف الميداني: إما شريك ذكي أو ضحية نظام معطوب',
    'من أروقة المعرض إلى واقع منشأتك: الأساس قبل القشور',
  ];

  const actualTitles = CONTENT_CATALOG.insights.items.map((item) => item.title);
  assert.deepEqual(actualTitles, expectedTitles);

  for (const sector of CONTENT_CATALOG.sectors) {
    const evidence = resolveFieldEvidence(sector.id);
    assert.ok(evidence, `شاهد ميداني مفقود للقطاع ${sector.id}`);
    assert.ok(expectedTitles.includes(evidence.title));
  }
});

test('6. بطاقة الفكرة العامة والتشخيص التنفيذي ومنسق التطبيق يدعمان نسخ ملخص LinkedIn وتبديل الحجم والفلتر', async () => {
  const app = createAppController();
  assert.equal(app.getState().scaleId, 'enterprise');
  assert.equal(app.getState().caseFilter, 'all');

  app.selectScale('sme');
  assert.equal(app.getState().scaleId, 'sme');

  app.filterCases('failure');
  assert.equal(app.getState().caseFilter, 'failure');

  app.selectSector('shuttle');
  app.selectPath('husk');

  const copiedText = await app.copyDiagnosis();
  assert.ok(copiedText);
  assert.match(copiedText, /شركة النقل الترددي/);
  assert.match(copiedText, /منشأة متوسطة أو صغيرة/);
  assert.match(copiedText, /https:\/\/salman-qq\.github\.io\/salman-hajjconfex26-insights\//);
  assert.equal(app.getState().copiedDiagnosis, true);

  const quickHtml = renderSimulatorHtml(app.getState(), CONTENT_CATALOG);
  assert.match(quickHtml, /الفكرة العامة والتشخيص التنفيذي لمنشأتك/);
  assert.match(quickHtml, /شاهد ميداني من المعرض/);
  assert.match(quickHtml, /مختبر الوقائع العالمية الحقيقية/);
  assert.match(quickHtml, /الفصول الزمنية الثلاثة/);
  assert.match(quickHtml, /لوحة المؤشرات الحية الرباعية/);
  assert.match(quickHtml, /احجز جلسة تشخيص استشارية لمنشأتك/);
  assert.match(quickHtml, /data-action="copy-diagnosis"/);

  app.switchMode('builder');
  app.addBlockToPlan('docs-knowledge');
  app.addBlockToPlan('gdp-onboarding');
  app.addBlockToPlan('data-classification');
  app.addBlockToPlan('ai-forecast');
  const evaluation = app.evaluateCurrentPlan();

  const builderHtml = renderBuilderResultHtml(evaluation, CONTENT_CATALOG, {
    caseFilter: 'success',
    copiedDiagnosis: false,
  });
  assert.match(builderHtml, /الفكرة العامة والتشخيص التنفيذي لمنشأتك/);
  assert.match(builderHtml, /UPS ORION/);
  assert.match(builderHtml, /انسخ ملخص تشخيصك لمشاركته في LinkedIn/);
});

