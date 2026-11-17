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
  analyzeInteractivePlan,
  buildChain,
  buildConsequenceTimeline,
  buildExecutiveDiagnosis,
  computeTelemetry,
  evaluatePlan,
  getCaseStudies,
  resolveFieldEvidence,
  resolveScale,
  resolveSimulatorAmbientState,
  sortPlanOptimally,
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

test('5. الصور الست الحقيقية تحمل الصياغة الإيجابية الاحتفالية (التذكرة 11) وكل قطاع يرتبط بشاهد ميداني', () => {
  const expectedTitles = [
    'منجزات وطنية عالمية.. حين تقود الخبرة صناعة الأثر',
    '«حاج بلا حقيبة».. رحلة ميسّرة من المطار إلى غرفتك مباشرة',
    'الروبوت الأمني الذكي.. خفض للتكاليف الإدارية ومساندة للموظفين',
    'الطائرات المسيّرة.. عين استباقية لسلامة الحشود وسرعة الاستجابة',
    'تجربة «المراقب الميداني الذكي».. شرف تحقيق أعلى درجة مع أمانة العاصمة المقدسة',
    'إهداء غالٍ من أمانة العاصمة المقدسة.. اعتزاز وتقدير',
  ];

  const expectedTags = [
    'تميّز مؤسسي وأثر مستدام',
    'ابتكار لوجستي وتجربة ضيف الرحمن',
    'أتمتة ذكية وكفاءة تشغيلية',
    'رصد جوي وذكاء ميداني',
    'تجربة تفاعلية وتمكين الكفاءات',
    'شراكة معرفية وتقدير',
  ];

  const actualTitles = CONTENT_CATALOG.insights.items.map((item) => item.title);
  const actualTags = CONTENT_CATALOG.insights.items.map((item) => item.tag);
  assert.deepEqual(actualTitles, expectedTitles);
  assert.deepEqual(actualTags, expectedTags);

  const photo5 = CONTENT_CATALOG.insights.items[4];
  const photo6 = CONTENT_CATALOG.insights.items[5];
  assert.match(photo5.commentary, /قائد رقابة ذكية خبير/);
  assert.match(photo5.commentary, /أمانة العاصمة المقدسة/);
  assert.match(photo6.title, /إهداء غالٍ من أمانة العاصمة المقدسة/);
  assert.match(photo6.commentary, /ختامٌ أعتز به كثيراً من جناح أمانة العاصمة المقدسة/);

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
  assert.match(quickHtml, /دراسات الحالات الواقعية \(Real-World Case Studies\)/);
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

test('7. التذكرة 11: بطاقة الملاءة المالية والقدرة التحملية وشارات الفرق (+/-) وتخصيص القطاعات السبعة ومصادر الحالات ومختبر المراحل الأربع', () => {
  // أ) بطاقة الملاءة المالية والقدرة التحملية
  const enterprise = resolveScale('enterprise');
  const sme = resolveScale('sme');
  assert.ok(enterprise.solvencyProfile);
  assert.ok(sme.solvencyProfile);
  assert.equal(enterprise.solvencyProfile.tone, 'positive');
  assert.equal(sme.solvencyProfile.tone, 'negative');

  // ب) تخصيص المؤشرات الميدانية والسياق التخصصي لجميع القطاعات السبعة
  assert.equal(CONTENT_CATALOG.sectors.length, 7);
  for (const sector of CONTENT_CATALOG.sectors) {
    assert.equal(sector.fieldMetrics.length, 3, `fieldMetrics ناقصة في ${sector.id}`);
    for (const axis of ['knowledge', 'talent', 'compliance', 'finance', 'sustainability']) {
      assert.ok(sector.axisContexts?.[axis]?.positive, `سياق إيجابي مفقود لـ ${sector.id}.${axis}`);
      assert.ok(sector.axisContexts?.[axis]?.negative, `سياق سلبي مفقود لـ ${sector.id}.${axis}`);
    }
    const chain = buildChain(sector.id, 'husk');
    assert.ok(chain[0].sectorContext, `sectorContext مفقود في السلسلة لـ ${sector.id}`);
  }

  // ج) الروابط المرجعية الخمسة الموثقة في دراسات الحالات الواقعية
  const cases = getCaseStudies('all');
  const expectedUrls = {
    'ups-orion':
      'https://aiforsupplychain.org/case-studies/ups-cuts-100-million-miles-annually-and-saves-300-400m-with-orion-ai-route-optimization',
    dominos:
      'https://www.g-co.agency/insights/dominos-case-study-a-restaurant-digital-transformation',
    zillow: 'https://iceberg.digital/trust-incident-zillow/',
    'mcdonalds-ibm':
      'https://airisk.mit.edu/ai-incidents/475-mcdonald-s-reportedly-ends-ibm-partnership-after-ai',
    'air-canada':
      'https://responsibleai.founderz.com/toolkit/case-studies/air-canada-chatbot-liability',
  };
  for (const c of cases) {
    assert.equal(c.sourceUrl, expectedUrls[c.id]);
  }

  // د) مختبر بناء الخطة التفاعلي المعمّق: المراحل الأربع، التحذير الفوري، النقل، والترتيب التلقائي
  const app = createAppController();
  app.selectSector('catering');
  app.switchMode('builder');

  // نضع لبنة ذكاء اصطناعي في المرحلة 1 قبل تأسيس قاعدتين -> يظهر تحذير فوري "ذكاء فوق الرمال"
  app.addBlockToPlan('ai-forecast');
  const liveAnalysis1 = analyzeInteractivePlan('catering', app.getState().plan);
  assert.equal(liveAnalysis1.sandWarningsCount, 1);
  assert.equal(liveAnalysis1.slotReactions[0].isSandWarning, true);

  const htmlWithSandWarning = renderSimulatorHtml(app.getState(), CONTENT_CATALOG);
  assert.match(htmlWithSandWarning, /data-instant-sand-banner/);
  assert.match(htmlWithSandWarning, /تحذير فوري: ذكاء فوق الرمال!/);
  assert.match(htmlWithSandWarning, /data-solvency-card/);
  assert.match(htmlWithSandWarning, /data-sector-field-metrics/);

  // نضيف 3 لبنات تأسيسية بعده فتكون النتيجة متعثرة بسبب الترتيب الخاطئ
  app.addBlockToPlan('docs-knowledge');
  app.addBlockToPlan('gdp-onboarding');
  app.addBlockToPlan('data-classification');

  // نجرب نقل لبنة بين المراحل
  assert.equal(app.moveBlockInPlan(1, 'right'), true);
  assert.equal(app.getState().plan[0], 'docs-knowledge');
  assert.equal(app.getState().plan[1], 'ai-forecast');

  // نجرب الترتيب التلقائي بالطريقة المعمارية الصحيحة -> تقفز الجاهزية إلى 100/100 لنفس اللبنات الأربع!
  assert.equal(app.autoSortPlan(), true);
  assert.equal(app.getState().simulator, 'evaluated');
  assert.equal(app.getState().evaluation.score, 100);
  assert.equal(app.getState().plan[3], 'ai-forecast');
  assert.match(app.getState().autoSortMessage, /100\/100/);
});

test('8. التذكرة 12: تخطيط العمودين، شريط المراحل، المقاييس بالحد الآمن 70%، خطة المرجع 100/100 دون نقاط حمراء، والمنهجية الموثقة', () => {
  const app = createAppController();
  app.selectSector('shuttle');
  app.switchMode('builder');

  const initialBuilderHtml = renderSimulatorHtml(app.getState(), CONTENT_CATALOG);

  // 1) إلغاء الشريط الثابت + التخطيط الثنائي + شريط المراحل + البطاقات القابلة للطي
  assert.doesNotMatch(initialBuilderHtml, /telemetry-panel--sticky-hud/);
  assert.doesNotMatch(initialBuilderHtml, /data-sticky-hud=/);
  assert.match(initialBuilderHtml, /data-sim-split-layout/);
  assert.match(initialBuilderHtml, /data-bento-cockpit/);
  assert.match(initialBuilderHtml, /data-bento-area="lab"/);
  assert.match(initialBuilderHtml, /data-bento-area="telemetry"/);
  assert.match(initialBuilderHtml, /data-stage-bar/);
  assert.match(initialBuilderHtml, /compact-disclosure/);

  // 2) المؤشرات الأربعة: مقياس الامتلاء البصري + حد الأمان 70% + الشرح والأمثلة
  assert.match(initialBuilderHtml, /telemetry-gauge__track/);
  assert.match(initialBuilderHtml, /data-safety-threshold="70"/);
  assert.match(initialBuilderHtml, /data-meter-explainer="trust"/);
  assert.match(initialBuilderHtml, /ما هذا المؤشر؟ ومثال عليه/);
  assert.match(initialBuilderHtml, /مثال ميداني من قطاع الحج والعمرة:/);

  // 3) دليل البداية السريعة وتلميحات الموضع وتطبيق الخطة المرجعية 100/100
  assert.match(initialBuilderHtml, /data-starter-guide/);
  assert.match(initialBuilderHtml, /بماذا تبدأ؟ \(الفكرة العامة لترتيب القرارات\)/);
  assert.match(initialBuilderHtml, /الموضع الموصى به:/);
  assert.match(initialBuilderHtml, /أثر وضعها في البداية:/);
  assert.match(initialBuilderHtml, /data-action="apply-reference-plan"/);

  const refEval = app.applyReferencePlan();
  assert.equal(app.getState().simulator, 'evaluated');
  assert.equal(refEval.score, 100);
  assert.equal(
    refEval.chain.every((link) => link.polarity === 'positive'),
    true,
    'الخطة المرجعية النظيفة يجب أن تجعل جميع الحلقات الست خضراء دون أي نقاط حمراء'
  );

  // جميع المؤشرات الأربعة الحية بعد الخطة المرجعية آمنة (>= 70%)
  const refMeters = computeTelemetry(
    {
      scaleId: app.getState().scaleId,
      mode: 'builder',
      plan: app.getState().plan,
      evaluation: refEval,
    },
    CONTENT_CATALOG
  );
  for (const m of refMeters) {
    assert.ok(m.value >= 70, `المؤشر ${m.id} أقل من حد الأمان 70%: ${m.value}`);
    assert.equal(m.tone, 'positive');
    assert.equal(m.statusLabel, 'ممتلئ وآمن');
  }

  const refHtml = renderSimulatorHtml(app.getState(), CONTENT_CATALOG);
  assert.match(refHtml, /توصيات المرحلة التوسعية التالية \(بعد استقرار الأساس\)/);
  assert.match(refHtml, /data-plan-clean="true"/);

  // 4 و 5) المنهجية الاستشارية والروابط الموثقة المحدثة
  assert.match(refHtml, /data-methodology-section/);
  assert.match(refHtml, /لماذا صُممت القرارات بهذه الطريقة؟/);
  assert.match(refHtml, /data-methodology-card="gartner-ai-readiness"/);
  assert.match(refHtml, /data-methodology-card="dama-shadow-data"/);
  assert.match(refHtml, /data-methodology-card="scale-liquidity-sensitivity"/);
  assert.match(refHtml, /data-methodology-card="national-regulatory-alignment"/);
  assert.match(refHtml, /dama\.org\/cpages\/body-of-knowledge/);
  assert.match(refHtml, /lack-of-ai-ready-data-puts-ai-projects-at-risk/);
});

test('9. التذكرة 13: لوحة القيادة البينتو ذات 12 عموداً، المحرك المحيطي، أقواس SVG، حبوب القياس، السلسلة السببية، ودرج Popover', () => {
  assert.equal(resolveSimulatorAmbientState({ mode: 'quick', path: null }), 'neutral');
  assert.equal(resolveSimulatorAmbientState({ mode: 'quick', path: 'foundation' }), 'governed');
  assert.equal(resolveSimulatorAmbientState({ mode: 'quick', path: 'husk' }), 'critical');
  assert.equal(
    resolveSimulatorAmbientState({
      mode: 'builder',
      plan: ['docs-knowledge', 'ai-forecast'],
    }),
    'critical'
  );
  assert.equal(
    resolveSimulatorAmbientState({
      mode: 'builder',
      plan: ['docs-knowledge', 'source-lineage'],
    }),
    'governed'
  );

  const rushedChain = buildChain('crowds', 'husk');
  assert.equal(rushedChain[0].isBottleneck, true);
  assert.equal(rushedChain[1].isDegraded, true);

  const cleanEval = evaluatePlan('hospitality', [
    'doc-systems',
    'unify-sources',
    'classify-data',
    'ai-predictive',
  ]);
  assert.equal(cleanEval.score, 100);
  assert.equal(
    cleanEval.chain.every((link) => link.polarity === 'positive' && !link.isBottleneck && !link.isDegraded),
    true
  );

  const html = renderSimulatorHtml(
    {
      simulator: 'chainRevealed',
      mode: 'quick',
      scaleId: 'enterprise',
      sectorId: 'crowds',
      path: 'husk',
      chain: rushedChain,
    },
    CONTENT_CATALOG
  );

  for (const area of [
    'org',
    'sectors',
    'evidence-trigger',
    'lab',
    'telemetry',
    'chain',
    'timeline',
    'matrix-peek',
  ]) {
    assert.match(html, new RegExp(`data-bento-area="${area}"`));
  }

  assert.match(html, /data-sim-state="critical"/);
  assert.match(html, /sectors-scroll-snap/);
  assert.match(html, /fieldset class="segmented-control"/);
  assert.match(html, /id="mode-quick"/);
  assert.match(html, /id="mode-builder"/);
  assert.match(html, /class="arc-svg"/);
  assert.match(html, /pathLength="100"/);
  assert.match(html, /class="pill-meter"/);
  assert.match(html, /class="pill-segment pill-segment--/);
  assert.match(html, /حد الأمان التشغيلي: 70%/);
  assert.match(html, /domino-card--negative[^"]*bottleneck/);
  assert.match(html, /data-degraded="true"/);
  assert.match(html, /<aside[\s\S]*id="evidence-drawer"[\s\S]*popover[\s\S]*class="evidence-sheet"/);
  assert.match(html, /class="weight-bar"/);
  assert.match(html, /30%/);
  assert.match(html, /25%/);
  assert.match(html, /20%/);
  assert.doesNotMatch(html, /PoliciesAr001\.pdf|PersonalData\.pdf|PageNotFoundError/i);
});

test('10. الهدوء البصري والتفاعل الفوري: إتاحة المسارين والخطة المرجعية من اللحظة الأولى، طي التفاصيل الثانوية افتراضياً، وربط GitHub', () => {
  const idleHtml = renderSimulatorHtml(
    {
      simulator: 'idle',
      mode: 'quick',
      scaleId: 'enterprise',
      sectorId: null,
      path: null,
      chain: [],
    },
    CONTENT_CATALOG
  );

  // إتاحة المسارين وزر الخطة المرجعية منذ اللحظة الأولى (idle) دون صندوق فارغ
  assert.match(idleHtml, /data-sim-step="path"/);
  assert.match(idleHtml, /data-action="select-path"[\s\S]*data-path="foundation"/);
  assert.match(idleHtml, /data-action="select-path"[\s\S]*data-path="husk"/);
  assert.match(idleHtml, /data-action="apply-reference-plan"/);
  assert.match(idleHtml, /class="matrix-peek__weights"/);
  assert.match(idleHtml, /class="matrix-peek__cases"/);

  // التحقق من أن عناصر <details class="compact-disclosure"> تبدأ مغلقة افتراضياً لمنع الزحام البصري
  const chosenHtml = renderSimulatorHtml(
    {
      simulator: 'sectorChosen',
      mode: 'builder',
      scaleId: 'enterprise',
      sectorId: 'shuttle',
      path: null,
      chain: [],
      plan: [],
    },
    CONTENT_CATALOG,
    { compactMobile: false }
  );
  assert.doesNotMatch(chosenHtml, /<details[^>]*compact-disclosure[^>]*\bopen\b/);

  // التحقق من وجود حساب GitHub في منصات التواصل
  const urls = CONTENT_CATALOG.contactPlatforms.map((p) => p.url);
  assert.ok(urls.includes('https://github.com/salman-qq'));
});


