/**
 * اختبارات التذكرة 04: أداة البناء والتقييم الاستراتيجي (evaluatePlan وكتالوج اللبنات وحالات المنسّق).
 *
 * تختبر السلوك عبر الواجهات العامة فقط (evaluatePlan وcreateAppController وrenderSimulatorHtml).
 * التشغيل من جذر المستودع: node --test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CONTENT_CATALOG } from '../js/content-catalog.js';
import { evaluatePlan } from '../js/simulator-engine.js';
import { renderSimulatorHtml } from '../js/views.js';
import { createAppController } from '../js/app-controller.js';

const F = [
  'docs-knowledge',
  'gdp-onboarding',
  'data-classification',
  'kpi-roi',
  'source-lineage',
];
const AI = ['ai-forecast', 'ai-assistant', 'ai-dashboard'];

test('الكتالوج يضم اللبنات الثماني (5 أساس تحمي المحاور الخمسة + 3 ذكاء) دون أرقام منطق مكررة', () => {
  const { blocks, axes, scoring } = CONTENT_CATALOG;
  assert.equal(blocks.length, 8);

  const foundationBlocks = blocks.filter((b) => b.type === 'foundation');
  const aiBlocks = blocks.filter((b) => b.type === 'ai');
  assert.equal(foundationBlocks.length, 5);
  assert.equal(aiBlocks.length, 3);

  const axisIds = axes.map((a) => a.id);
  const protectedAxes = foundationBlocks.map((b) => b.axisId);
  assert.deepEqual([...protectedAxes].sort(), [...axisIds].sort());

  for (const aiBlock of aiBlocks) {
    assert.equal(aiBlock.axisId, null);
  }

  for (const block of blocks) {
    assert.ok(block.id && block.name && block.icon && block.description);
  }

  assert.equal(scoring.planSize, 4);
  assert.equal(scoring.maxScore, 100);
  assert.deepEqual(
    scoring.tiers.map((t) => [t.minScore, t.label]),
    [
      [80, 'جاهزة للاستثمار'],
      [50, 'على الطريق'],
      [0, 'في خطر'],
    ]
  );
});

test('أمثلة SPEC الأربعة وخطة أساس-أساس-ذكاء-ذكاء تُحسب بدقة', () => {
  const r100 = evaluatePlan('shuttle', [F[0], F[1], F[2], AI[0]]);
  assert.equal(r100.score, 100);
  assert.equal(r100.tier.label, 'جاهزة للاستثمار');
  assert.equal(r100.orderBonusApplied, true);

  const r80 = evaluatePlan('shuttle', [F[0], F[1], F[2], F[3]]);
  assert.equal(r80.score, 80);
  assert.equal(r80.tier.label, 'جاهزة للاستثمار');
  assert.equal(r80.orderBonusApplied, false);

  const r65 = evaluatePlan('shuttle', [AI[0], F[0], F[1], F[2]]);
  assert.equal(r65.score, 65);
  assert.equal(r65.tier.label, 'على الطريق');
  assert.equal(r65.aiOnSandCount, 1);
  assert.equal(r65.orderBonusApplied, false);

  const r35 = evaluatePlan('shuttle', [AI[0], AI[1], AI[2], F[0]]);
  assert.equal(r35.score, 35);
  assert.equal(r35.tier.label, 'في خطر');
  assert.equal(r35.aiOnSandCount, 3);
  assert.equal(r35.orderBonusApplied, false);

  // خطة: أساس، أساس، ذكاء، ذكاء = 20 + 20 + 20 + 20 + 20 مكافأة مرة واحدة = 100
  const rFFAA = evaluatePlan('catering', [F[0], F[1], AI[0], AI[1]]);
  assert.equal(rFFAA.score, 100);
  assert.equal(rFFAA.aiOnFoundationCount, 2);
  assert.equal(rFFAA.orderBonusApplied, true);
});

test('الحد الأعلى 100، والمنطق يقرأ قيم التقييم وحدود المستويات (49 و50 و79 و80) من الكتالوج', () => {
  // 50 طبيعية: ذكاء، ذكاء، أساس، أساس = 5 + 5 + 20 + 20 = 50
  const r50 = evaluatePlan('housing', [AI[0], AI[1], F[0], F[1]]);
  assert.equal(r50.score, 50);
  assert.equal(r50.tier.label, 'على الطريق');

  // 80 طبيعية: أربع لبنات أساس = 80
  const r80 = evaluatePlan('housing', [F[0], F[1], F[2], F[3]]);
  assert.equal(r80.score, 80);
  assert.equal(r80.tier.label, 'جاهزة للاستثمار');

  // فحص 49 و79 والحد الأعلى عبر تمرير كتالوج مخصص يؤكد عدم وجود قيم ثابتة في المحرك
  const eval49Catalog = {
    ...CONTENT_CATALOG,
    scoring: { ...CONTENT_CATALOG.scoring, foundationPoints: 15, aiOnSandPoints: 4 },
  };
  const r49 = evaluatePlan('shuttle', [AI[0], F[0], F[1], F[2]], eval49Catalog);
  assert.equal(r49.score, 49);
  assert.equal(r49.tier.label, 'في خطر');

  const eval79Catalog = {
    ...CONTENT_CATALOG,
    scoring: { ...CONTENT_CATALOG.scoring, foundationPoints: 20, aiOnSandPoints: 19 },
  };
  const r79 = evaluatePlan('shuttle', [AI[0], F[0], F[1], F[2]], eval79Catalog);
  assert.equal(r79.score, 79);
  assert.equal(r79.tier.label, 'على الطريق');

  const cappedCatalog = {
    ...CONTENT_CATALOG,
    scoring: { ...CONTENT_CATALOG.scoring, foundationPoints: 40, orderBonus: 50, maxScore: 100 },
  };
  const rCapped = evaluatePlan('shuttle', [F[0], F[1], F[2], AI[0]], cappedCatalog);
  assert.equal(rCapped.score, 100);
});

test('evaluatePlan يرفض المدخلات غير الصالحة بخطأ واضح', () => {
  assert.throws(() => evaluatePlan('unknown-sector', [F[0], F[1], F[2], F[3]]), /قطاع غير معروف/);
  assert.throws(() => evaluatePlan('shuttle', []), /4 لبنات/);
  assert.throws(() => evaluatePlan('shuttle', [F[0], F[1], F[2]]), /4 لبنات/);
  assert.throws(() => evaluatePlan('shuttle', [F[0], F[1], F[2], F[3], F[4]]), /4 لبنات/);
  assert.throws(() => evaluatePlan('shuttle', [F[0], F[0], F[1], F[2]]), /تكرار/);
  assert.throws(() => evaluatePlan('shuttle', [F[0], 'non-existent', F[1], F[2]]), /غير معروفة/);
});

test('منسّق التطبيق يدير التبويب والخانات الأربع والانتقال من planning إلى evaluated', () => {
  const app = createAppController();
  assert.equal(app.getState().mode, 'quick');

  assert.throws(() => app.switchMode('invalid'), /نمط/);
  assert.throws(() => app.addBlockToPlan(F[0]), /قطاع/);
  assert.throws(() => app.evaluateCurrentPlan(), /قطاع/);

  app.selectSector('crowd');
  app.switchMode('builder');
  assert.equal(app.getState().simulator, 'planning');
  assert.equal(app.getState().mode, 'builder');

  assert.equal(app.addBlockToPlan(F[0]), true);
  assert.equal(app.addBlockToPlan(F[0]), false, 'منع التكرار');
  assert.equal(app.addBlockToPlan(F[1]), true);
  assert.equal(app.addBlockToPlan(AI[0]), true);
  assert.throws(() => app.evaluateCurrentPlan(), /4 لبنات/);

  assert.equal(app.addBlockToPlan(AI[1]), true);
  assert.equal(app.addBlockToPlan(F[2]), false, 'الخانات الأربع ممتلئة');
  assert.deepEqual(app.getState().plan, [F[0], F[1], AI[0], AI[1]]);

  const evalResult = app.evaluateCurrentPlan();
  assert.equal(evalResult.score, 100);
  assert.equal(app.getState().simulator, 'evaluated');

  // إزالة اللبنة الثانية تعيد الترتيب وتعيد الحالة إلى planning
  assert.equal(app.removeBlockFromSlot(1), true);
  assert.equal(app.getState().simulator, 'planning');
  assert.equal(app.getState().evaluation, null);
  assert.deepEqual(app.getState().plan, [F[0], AI[0], AI[1]]);
});

test('العرض يعرض مفتاح التبويب واللبنات المميزة والأربع خانات ومنطقة aria-live وزر التقييم المعطّل حتى الاكتمال', () => {
  const incompleteHtml = renderSimulatorHtml(
    {
      simulator: 'planning',
      mode: 'builder',
      sectorId: 'shuttle',
      path: null,
      chain: [],
      plan: [F[0], AI[0]],
      evaluation: null,
    },
    CONTENT_CATALOG
  );
  assert.match(incompleteHtml, /role="tablist"/);
  assert.match(incompleteHtml, /id="tab-quick"[^>]*aria-selected="false"/);
  assert.match(incompleteHtml, /id="tab-builder"[^>]*aria-selected="true"/);
  assert.doesNotMatch(incompleteHtml, /aria-controls=/);
  assert.match(incompleteHtml, /لبنة أساس/);
  assert.match(incompleteHtml, /لبنة ذكاء/);
  assert.match(incompleteHtml, /data-slot-index="3"/);
  assert.match(incompleteHtml, /data-action="evaluate-plan"[^>]*aria-disabled="true"/);
  assert.match(incompleteHtml, /متبقٍ 2/);

  const evaluated = evaluatePlan('shuttle', [F[0], F[1], F[2], AI[0]]);
  const doneHtml = renderSimulatorHtml(
    {
      simulator: 'evaluated',
      mode: 'builder',
      sectorId: 'shuttle',
      path: null,
      chain: [],
      plan: [F[0], F[1], F[2], AI[0]],
      evaluation: evaluated,
    },
    CONTENT_CATALOG
  );
  assert.match(doneHtml, /data-action="evaluate-plan"[^>]*aria-disabled="false"/);
  assert.match(doneHtml, /aria-live="polite"/);
  assert.match(doneHtml, /جاهزة للاستثمار/);
  assert.match(doneHtml, />100</);
});
