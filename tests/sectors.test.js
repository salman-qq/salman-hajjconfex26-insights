/**
 * اختبارات التذكرة 03: القطاعات السبعة وملف الشركة وسلامة المحتوى.
 * تختبر السلوك عبر الواجهات العامة فقط (buildChain و renderSimulatorHtml و createAppController).
 * التشغيل من جذر المستودع: node --test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { CONTENT_CATALOG } from '../js/content-catalog.js';
import { buildChain } from '../js/simulator-engine.js';
import { renderSimulatorHtml } from '../js/views.js';
import { createAppController } from '../js/app-controller.js';

const FIELD_IDS = ['catering', 'shuttle', 'crowd', 'housing'];
const SUPPORT_IDS = ['logistics', 'supply', 'operator'];

test('الكتالوج يضم القطاعات السبعة مقسّمة إلى ميدانية ومساندة دون تكرار المعرّفات', () => {
  const { sectors, sectorCategories } = CONTENT_CATALOG;
  assert.equal(sectors.length, 7);

  const ids = sectors.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length, 'يوجد معرّف قطاع مكرر');

  assert.deepEqual(
    sectors.filter((s) => s.category === 'field').map((s) => s.id),
    FIELD_IDS
  );
  assert.deepEqual(
    sectors.filter((s) => s.category === 'support').map((s) => s.id),
    SUPPORT_IDS
  );

  assert.deepEqual(
    sectorCategories.map((c) => [c.id, c.title]),
    [
      ['field', 'خدمات ميدانية'],
      ['support', 'خدمات مساندة'],
    ]
  );
});

test('كل قطاع له اسم بصيغة «شركة + القطاع» وأيقونة وملف شركة كامل', () => {
  for (const sector of CONTENT_CATALOG.sectors) {
    assert.ok(sector.name.startsWith('شركة '), `اسم القطاع لا يبدأ بـ «شركة»: ${sector.name}`);
    assert.ok(sector.icon, `القطاع ${sector.id} بلا أيقونة`);
    assert.ok(sector.profile.businessGoal.trim(), `القطاع ${sector.id} بلا هدف تجاري`);
    assert.ok(sector.profile.socialImpact.trim(), `القطاع ${sector.id} بلا أثر مجتمعي`);
  }
});

test('كل قطاع يعطي سلسلة كاملة من ست حلقات في المسارين، ولكل حلقة simple و expert', () => {
  for (const sector of CONTENT_CATALOG.sectors) {
    for (const path of ['husk', 'foundation']) {
      const chain = buildChain(sector.id, path);
      assert.equal(chain.length, 6, `${sector.id}/${path}`);
      assert.equal(chain[1].scope, 'sector');
      for (const link of chain) {
        assert.ok(link.icon && link.title && link.simple && link.expert, `${sector.id}/${path}`);
        const words = link.title.trim().split(/\s+/).length;
        assert.ok(words <= 6, `عنوان يتجاوز 6 كلمات: "${link.title}"`);
      }
    }
  }
});

test('الحلقات القطاعية بلا أرقام مخترعة', () => {
  for (const sector of CONTENT_CATALOG.sectors) {
    for (const link of [sector.negativeLink, sector.positiveLink]) {
      const text = `${link.title} ${link.simple} ${link.expert}`;
      assert.ok(!/[0-9٠-٩]/.test(text), `رقم داخل حلقة ${sector.id}: ${text}`);
    }
  }
});

test('شريط القطاعات يعرض عنواني الفئتين وكل البطاقات السبع', () => {
  const html = renderSimulatorHtml(
    { simulator: 'idle', sectorId: null, path: null, chain: [] },
    CONTENT_CATALOG
  );
  assert.match(html, /خدمات ميدانية/);
  assert.match(html, /خدمات مساندة/);
  for (const id of [...FIELD_IDS, ...SUPPORT_IDS]) {
    assert.match(html, new RegExp(`data-sector-id="${id}"`));
  }
  assert.ok(!html.includes('company-profile'), 'ملف الشركة يظهر قبل اختيار القطاع');
});

test('البطاقة المختارة معلنة بـ aria-pressed ويظهر ملف شركتها', () => {
  const html = renderSimulatorHtml(
    { simulator: 'sectorChosen', sectorId: 'housing', path: null, chain: [] },
    CONTENT_CATALOG
  );
  assert.match(html, /data-sector-id="housing"\s+aria-pressed="true"/);
  assert.match(html, /data-sector-id="catering"\s+aria-pressed="false"/);
  assert.match(html, /ملف شركة الإسكان والضيافة/);
});

test('تغيير القطاع يُرجع المحاكي إلى sectorChosen ويمسح السلسلة', () => {
  const app = createAppController();
  app.selectSector('catering');
  app.selectPath('husk');
  assert.equal(app.getState().simulator, 'chainRevealed');

  app.selectSector('operator');
  const state = app.getState();
  assert.equal(state.simulator, 'sectorChosen');
  assert.equal(state.sectorId, 'operator');
  assert.equal(state.path, null);
  assert.equal(state.chain.length, 0);
});

test('إضافة قطاع ثامن في الكتالوج تكفي لظهوره في العرض والمحرك', () => {
  const extra = Object.freeze({
    id: 'test-sector',
    name: 'شركة القطاع التجريبي',
    category: 'support',
    icon: 'globe',
    profile: { businessGoal: 'هدف', socialImpact: 'أثر' },
    negativeLink: { icon: 'globe', title: 'سلبي', simple: 'س', expert: 'خ' },
    positiveLink: { icon: 'globe', title: 'إيجابي', simple: 'س', expert: 'خ' },
  });
  const catalog = { ...CONTENT_CATALOG, sectors: [...CONTENT_CATALOG.sectors, extra] };

  const chain = buildChain('test-sector', 'foundation', catalog);
  assert.equal(chain.length, 6);
  assert.equal(chain[1].title, 'إيجابي');

  const html = renderSimulatorHtml(
    { simulator: 'idle', sectorId: null, path: null, chain: [] },
    catalog
  );
  assert.match(html, /data-sector-id="test-sector"/);
});

