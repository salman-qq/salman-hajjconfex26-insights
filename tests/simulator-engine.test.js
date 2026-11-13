/**
 * اختبارات التذكرة 02: محرك المحاكي (buildChain) وحالات المنسّق للرحلة المبسطة.
 *
 * تختبر السلوك الخارجي فقط عبر الواجهة العامة (buildChain وcreateAppController).
 * التشغيل من جذر المستودع: node --test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CONTENT_CATALOG } from '../js/content-catalog.js';
import { buildChain } from '../js/simulator-engine.js';
import { createAppController } from '../js/app-controller.js';

const EXPECTED_AXIS_ORDER = [
  'knowledge',
  'talent',
  'compliance',
  'finance',
  'sustainability',
];

test('كتالوج المحتوى يضم محاور الأثر الخمسة وقطاع النقل الترددي بعناوين لا تتجاوز 6 كلمات', () => {
  const axes = CONTENT_CATALOG.axes;
  assert.equal(axes.length, 5);
  assert.deepEqual(
    axes.map((a) => a.id),
    EXPECTED_AXIS_ORDER
  );

  for (const axis of axes) {
    for (const link of [axis.negativeLink, axis.positiveLink]) {
      assert.ok(link.icon && link.title && link.simple && link.expert);
      const wordCount = link.title.trim().split(/\s+/).length;
      assert.ok(
        wordCount <= 6,
        `عنوان الحلقة يتجاوز 6 كلمات (${wordCount}): "${link.title}"`
      );
    }
  }

  const shuttle = CONTENT_CATALOG.sectors.find((s) => s.id === 'shuttle');
  assert.ok(shuttle, 'قطاع النقل الترددي مفقود');
  assert.equal(shuttle.name, 'شركة النقل الترددي');
  assert.ok(shuttle.profile.businessGoal.length > 0);
  assert.ok(shuttle.profile.socialImpact.length > 0);
  for (const link of [shuttle.negativeLink, shuttle.positiveLink]) {
    assert.ok(link.icon && link.title && link.simple && link.expert);
    const wordCount = link.title.trim().split(/\s+/).length;
    assert.ok(wordCount <= 6, `عنوان حلقة القطاع يتجاوز 6 كلمات: "${link.title}"`);
  }
});

test('buildChain يُرجع 6 حلقات بترتيب المحاور الخمسة والحلقة القطاعية في الموضع الثاني (index 1)', () => {
  const chain = buildChain('shuttle', 'husk');
  assert.equal(chain.length, 6);

  assert.equal(chain[0].scope, 'common');
  assert.equal(chain[0].axisId, 'knowledge');

  assert.equal(chain[1].scope, 'sector');
  assert.equal(chain[1].sectorId, 'shuttle');

  assert.equal(chain[2].scope, 'common');
  assert.equal(chain[2].axisId, 'talent');

  assert.equal(chain[3].scope, 'common');
  assert.equal(chain[3].axisId, 'compliance');

  assert.equal(chain[4].scope, 'common');
  assert.equal(chain[4].axisId, 'finance');

  assert.equal(chain[5].scope, 'common');
  assert.equal(chain[5].axisId, 'sustainability');

  assert.deepEqual(
    chain.map((item) => item.index),
    [1, 2, 3, 4, 5, 6]
  );
});

test('مسار القشور (husk) يُرجع حلقات سلبية فقط، ومسار الأساس (foundation) يُرجع حلقات إيجابية فقط', () => {
  const huskChain = buildChain('shuttle', 'husk');
  for (const link of huskChain) {
    assert.equal(link.polarity, 'negative');
    assert.ok(link.simple.length > 0);
    assert.ok(link.expert.length > 0);
  }
  assert.equal(huskChain[1].title, CONTENT_CATALOG.sectors[0].negativeLink.title);

  const foundationChain = buildChain('shuttle', 'foundation');
  for (const link of foundationChain) {
    assert.equal(link.polarity, 'positive');
    assert.ok(link.simple.length > 0);
    assert.ok(link.expert.length > 0);
  }
  assert.equal(
    foundationChain[1].title,
    CONTENT_CATALOG.sectors[0].positiveLink.title
  );
});

test('buildChain يرفض بخطأ واضح معرّف القطاع غير الموجود أو المسار غير المعروف', () => {
  assert.throws(() => buildChain('unknown-sector', 'husk'), /قطاع غير معروف/);
  assert.throws(() => buildChain('', 'foundation'), /قطاع غير معروف/);
  assert.throws(() => buildChain('shuttle', 'invalid-path'), /مسار غير معروف/);
  assert.throws(() => buildChain('shuttle', ''), /مسار غير معروف/);
});

test('منسّق التطبيق ينتقل عبر حالات idle ← sectorChosen ← chainRevealed ويبدّل المسار', () => {
  const app = createAppController();
  assert.equal(app.getState().simulator, 'idle');

  app.selectSector('shuttle');
  const afterSector = app.getState();
  assert.equal(afterSector.simulator, 'sectorChosen');
  assert.equal(afterSector.sectorId, 'shuttle');
  assert.equal(afterSector.path, null);

  app.selectPath('husk');
  const afterHusk = app.getState();
  assert.equal(afterHusk.simulator, 'chainRevealed');
  assert.equal(afterHusk.sectorId, 'shuttle');
  assert.equal(afterHusk.path, 'husk');
  assert.equal(afterHusk.chain.length, 6);
  assert.ok(afterHusk.chain.every((c) => c.polarity === 'negative'));

  app.switchOtherPath();
  const afterSwitch = app.getState();
  assert.equal(afterSwitch.simulator, 'chainRevealed');
  assert.equal(afterSwitch.sectorId, 'shuttle');
  assert.equal(afterSwitch.path, 'foundation');
  assert.equal(afterSwitch.chain.length, 6);
  assert.ok(afterSwitch.chain.every((c) => c.polarity === 'positive'));
});

