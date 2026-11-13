/**
 * اختبارات التذكرة 05: تفسير النتيجة (chain وmissed وwarnings) والانتقال بين الأنماط وإعادة البناء.
 *
 * تختبر السلوك عبر الواجهات العامة فقط.
 * التشغيل من جذر المستودع: node --test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CONTENT_CATALOG } from '../js/content-catalog.js';
import { buildChain, evaluatePlan } from '../js/simulator-engine.js';
import { renderBuilderResultHtml, renderSimulatorHtml } from '../js/views.js';
import { createAppController } from '../js/app-controller.js';

const F = [
  'docs-knowledge',
  'gdp-onboarding',
  'data-classification',
  'kpi-roi',
  'source-lineage',
];
const AI = ['ai-forecast', 'ai-assistant', 'ai-dashboard'];

test('سلسلة evaluatePlan تتبع اتجاه كل محور بلبنته التأسيسية وبنفس ترتيب buildChain', () => {
  // اختيار: المعرفة (F[0]) والامتثال (F[2]) والاستدامة (F[4]) + AI[0]
  const res = evaluatePlan('shuttle', [F[0], F[2], F[4], AI[0]]);
  const refChain = buildChain('shuttle', 'foundation');

  assert.equal(res.chain.length, 6);
  assert.deepEqual(
    res.chain.map((l) => [l.index, l.scope, l.axisId]),
    refChain.map((l) => [l.index, l.scope, l.axisId])
  );

  const byAxis = new Map(
    res.chain.filter((l) => l.axisId).map((l) => [l.axisId, l])
  );
  assert.equal(byAxis.get('knowledge').polarity, 'positive');
  assert.equal(byAxis.get('talent').polarity, 'negative');
  assert.equal(byAxis.get('compliance').polarity, 'positive');
  assert.equal(byAxis.get('finance').polarity, 'negative');
  assert.equal(byAxis.get('sustainability').polarity, 'positive');

  const knowledgeAxis = CONTENT_CATALOG.axes.find((a) => a.id === 'knowledge');
  const talentAxis = CONTENT_CATALOG.axes.find((a) => a.id === 'talent');
  assert.equal(byAxis.get('knowledge').expert, knowledgeAxis.positiveLink.expert);
  assert.equal(byAxis.get('talent').expert, talentAxis.negativeLink.expert);
});

test('الحلقة القطاعية في الموضع الثاني تكون إيجابية فقط مع >= لبنتي أساس وصفر ذكاء فوق الرمال', () => {
  // حالة إيجابية: 3 أساس + 1 ذكاء بعد الأساس
  const posWithAi = evaluatePlan('catering', [F[0], F[1], F[2], AI[0]]);
  assert.equal(posWithAi.chain[1].scope, 'sector');
  assert.equal(posWithAi.chain[1].polarity, 'positive');

  // حالة إيجابية: 4 أساس بدون ذكاء
  const posFourF = evaluatePlan('catering', [F[0], F[1], F[2], F[3]]);
  assert.equal(posFourF.chain[1].polarity, 'positive');

  // حالة سلبية رغم وجود 3 لبنات أساس بسبب ذكاء فوق الرمال في الخانة 1
  const negSandFirst = evaluatePlan('catering', [AI[0], F[0], F[1], F[2]]);
  assert.equal(negSandFirst.foundationCount, 3);
  assert.equal(negSandFirst.aiOnSandCount, 1);
  assert.equal(negSandFirst.chain[1].scope, 'sector');
  assert.equal(negSandFirst.chain[1].polarity, 'negative');

  // حالة سلبية: أساس واحد فقط + 3 ذكاء فوق الرمال
  const negOneFoundation = evaluatePlan('catering', [AI[0], AI[1], AI[2], F[0]]);
  assert.equal(negOneFoundation.chain[1].polarity, 'negative');
});

test('الفرص الفائتة تشمل المحاور غير المختارة وتضيف فرصة الذكاء عند غياب لبنات الذكاء', () => {
  // خطة 4 أساس فقط: يفوت محور sustainability + فرصة «قيمة الذكاء الاصطناعي على أساس جاهز»
  const fourFoundations = evaluatePlan('logistics', [F[0], F[1], F[2], F[3]]);
  assert.equal(fourFoundations.missed.length, 2);
  assert.equal(fourFoundations.missed[0].axisId, 'sustainability');
  assert.equal(
    fourFoundations.missed[0].title,
    CONTENT_CATALOG.axes.find((a) => a.id === 'sustainability').positiveLink.title
  );
  assert.match(fourFoundations.missed[1].title, /قيمة الذكاء الاصطناعي على أساس جاهز/);

  // خطة تضم لبنة ذكاء: تفوت محاور finance وsustainability فقط دون فرصة الذكاء
  const withAi = evaluatePlan('logistics', [F[0], F[1], F[2], AI[0]]);
  assert.deepEqual(
    withAi.missed.map((m) => m.axisId),
    ['finance', 'sustainability']
  );
});

test('التنبيهات تضاف لكل لبنة ذكاء لم تسبقها لبنتا أساس وتغيب عند الترتيب السليم', () => {
  const cleanPlan = evaluatePlan('crowd', [F[0], F[1], AI[0], AI[1]]);
  assert.equal(cleanPlan.warnings.length, 0);

  const fourFoundations = evaluatePlan('crowd', [F[0], F[1], F[2], F[3]]);
  assert.equal(fourFoundations.warnings.length, 0);

  const oneSand = evaluatePlan('crowd', [F[0], AI[0], F[1], F[2]]);
  assert.equal(oneSand.warnings.length, 1);
  assert.match(oneSand.warnings[0].title, /ذكاء فوق الرمال/);
  assert.equal(oneSand.warnings[0].slotIndex, 2);

  const threeSand = evaluatePlan('crowd', [AI[0], AI[1], AI[2], F[0]]);
  assert.equal(threeSand.warnings.length, 3);
  assert.deepEqual(
    threeSand.warnings.map((w) => [w.slotIndex, w.blockId]),
    [
      [1, AI[0]],
      [2, AI[1]],
      [3, AI[2]],
    ]
  );
});

test('منسّق التطبيق ينتقل من الرحلة المبسطة للرؤية المعمقة ويعيد البناء ويعيد الضبط عند تغيير القطاع', () => {
  const app = createAppController();
  app.selectSector('housing');
  app.selectPath('husk');
  assert.equal(app.getState().simulator, 'chainRevealed');

  // الانتقال للرؤية المعمقة يحافظ على القطاع ويدخل planning
  app.goToBuilder();
  assert.equal(app.getState().mode, 'builder');
  assert.equal(app.getState().sectorId, 'housing');
  assert.equal(app.getState().simulator, 'planning');

  // تغيير القطاع من chainRevealed يرجع sectorChosen دون خطة قديمة
  app.switchMode('quick');
  app.selectPath('foundation');
  assert.equal(app.getState().simulator, 'chainRevealed');
  app.selectSector('supply');
  assert.equal(app.getState().simulator, 'sectorChosen');
  assert.deepEqual(app.getState().plan, []);
  assert.equal(app.getState().chain.length, 0);

  // بناء وتقييم ثم «أعد البناء»
  app.switchMode('builder');
  app.addBlockToPlan(AI[0]);
  app.addBlockToPlan(F[0]);
  app.addBlockToPlan(F[1]);
  assert.equal(app.getState().simulator, 'planning');

  // تغيير القطاع أثناء planning
  app.selectSector('operator');
  assert.equal(app.getState().simulator, 'sectorChosen');
  assert.deepEqual(app.getState().plan, []);

  // التقييم ثم تغيير القطاع من evaluated، ثم إعادة التقييم و«أعد البناء»
  app.switchMode('builder');
  for (const id of [F[0], F[1], F[2], AI[0]]) app.addBlockToPlan(id);
  const eval1 = app.evaluateCurrentPlan();
  assert.equal(app.getState().simulator, 'evaluated');
  assert.equal(eval1.score, 100);

  app.selectSector('catering');
  assert.equal(app.getState().simulator, 'sectorChosen');
  assert.deepEqual(app.getState().plan, []);
  assert.equal(app.getState().evaluation, null);

  app.switchMode('builder');
  for (const id of [AI[0], F[0], F[1], F[2]]) app.addBlockToPlan(id);
  app.evaluateCurrentPlan();
  assert.equal(app.getState().simulator, 'evaluated');

  app.rebuildPlan();
  assert.equal(app.getState().sectorId, 'catering');
  assert.equal(app.getState().mode, 'builder');
  assert.equal(app.getState().simulator, 'planning');
  assert.deepEqual(app.getState().plan, []);
  assert.equal(app.getState().evaluation, null);
});

test('العرض يعرض أقسام النتيجة بالترتيب المعتمد، وأزرار الانتقال وإعادة البناء، وإخلاء المسؤولية في الرحلتين', () => {
  const evalWithWarnings = evaluatePlan('shuttle', [AI[0], F[0], F[1], F[2]]);
  const htmlWithWarn = renderBuilderResultHtml(evalWithWarnings, CONTENT_CATALOG);

  const posScore = htmlWithWarn.indexOf('data-result-section="score"');
  const posChain = htmlWithWarn.indexOf('data-result-section="chain"');
  const posMissed = htmlWithWarn.indexOf('data-result-section="missed"');
  const posWarn = htmlWithWarn.indexOf('data-result-section="warnings"');
  const posDisc = htmlWithWarn.indexOf('data-builder-disclaimer');
  const posRebuild = htmlWithWarn.indexOf('data-action="rebuild-plan"');

  assert.ok(posScore !== -1 && posChain > posScore);
  assert.ok(posMissed > posChain);
  assert.ok(posWarn > posMissed);
  assert.ok(posDisc > posWarn);
  assert.ok(posRebuild > posDisc);

  // التحقق من استخدام نصوص expert وليس simple في سلسلة الرؤية المعمقة
  const financeAxis = CONTENT_CATALOG.axes.find((a) => a.id === 'finance');
  assert.ok(htmlWithWarn.includes(financeAxis.negativeLink.expert));
  assert.ok(htmlWithWarn.includes(CONTENT_CATALOG.meta.disclaimer));
  assert.match(htmlWithWarn, /أعد البناء/);

  // خطة بدون تحذيرات لا تعرض قسم التحذيرات
  const evalClean = evaluatePlan('shuttle', [F[0], F[1], F[2], F[3]]);
  const htmlClean = renderBuilderResultHtml(evalClean, CONTENT_CATALOG);
  assert.equal(htmlClean.includes('data-result-section="warnings"'), false);
  assert.ok(htmlClean.includes('قيمة الذكاء الاصطناعي على أساس جاهز'));

  // نهاية الرحلة المبسطة تعرض زر «انتقل للرؤية المعمقة» وإخلاء المسؤولية
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
  assert.match(quickHtml, /data-action="go-to-builder"/);
  assert.match(quickHtml, /انتقل للرؤية المعمقة/);
  assert.ok(quickHtml.includes('data-chain-disclaimer'));
  assert.ok(quickHtml.includes(CONTENT_CATALOG.meta.disclaimer));
});

