/**
 * محرك المحاكي (Simulator Engine).
 *
 * دوال نقية تقرأ كتالوج المحتوى ولا تلمس DOM ولا تستورد أي وحدة خاصة بـ Node.
 * يعمل الملف نفسه في المتصفح وفي اختبارات Node المحلية.
 */
import { CONTENT_CATALOG, VALID_PATHS } from './content-catalog.js';

/** يبحث عن القطاع في الكتالوج ويرفض المعرّف غير المعروف. */
function resolveSector(sectorId, catalog) {
  if (typeof sectorId !== 'string' || !sectorId.trim()) {
    throw new Error(`قطاع غير معروف: "${sectorId}"`);
  }

  const sector = catalog.sectors.find((s) => s.id === sectorId);
  if (!sector) {
    throw new Error(`قطاع غير معروف: "${sectorId}"`);
  }
  return sector;
}

/**
 * يبني سلسلة الأثر المرتبة (6 حلقات) للرحلة المبسطة:
 * الموضع 1: المعرفة
 * الموضع 2: الحلقة القطاعية (أول أثر ملموس بلغة القطاع)
 * الموضع 3: الكفاءات
 * الموضع 4: الامتثال
 * الموضع 5: المال
 * الموضع 6: الاستدامة
 *
 * @param {string} sectorId
 * @param {'husk' | 'foundation'} path
 * @param {typeof CONTENT_CATALOG} [catalog]
 */
export function buildChain(sectorId, path, catalog = CONTENT_CATALOG) {
  const sector = resolveSector(sectorId, catalog);

  if (!VALID_PATHS.includes(path)) {
    throw new Error(`مسار غير معروف: "${path}"`);
  }

  const isNegative = path === 'husk';
  const polarity = isNegative ? 'negative' : 'positive';
  const linkKey = isNegative ? 'negativeLink' : 'positiveLink';

  const commonLinks = catalog.axes.map((axis) => {
    const raw = axis[linkKey];
    return {
      scope: 'common',
      axisId: axis.id,
      axisName: axis.name,
      sectorId: sector.id,
      polarity,
      icon: raw.icon,
      title: raw.title,
      simple: raw.simple,
      expert: raw.expert,
    };
  });

  const rawSectorLink = sector[linkKey];
  const sectorLink = {
    scope: 'sector',
    axisId: null,
    axisName: `أثر قطاعي — ${sector.name}`,
    sectorId: sector.id,
    polarity,
    icon: rawSectorLink.icon,
    title: rawSectorLink.title,
    simple: rawSectorLink.simple,
    expert: rawSectorLink.expert,
  };

  // إدراج الحلقة القطاعية في الموضع الثاني (index 1)
  const ordered = [
    commonLinks[0],
    sectorLink,
    ...commonLinks.slice(1),
  ];

  return ordered.map((item, idx) =>
    Object.freeze({
      ...item,
      index: idx + 1,
    })
  );
}

/** يتحقق من صحة خطة البناء المرتبة ويرجع مصفوفة اللبنات المطابقة. */
function resolvePlanBlocks(blockIds, catalog) {
  const { planSize } = catalog.scoring;
  if (!Array.isArray(blockIds) || blockIds.length !== planSize) {
    throw new Error(`يجب أن تتكوّن خطة البناء من ${planSize} لبنات بالضبط`);
  }

  const blockMap = new Map(catalog.blocks.map((b) => [b.id, b]));
  const seen = new Set();

  return blockIds.map((id) => {
    if (typeof id !== 'string' || !blockMap.has(id)) {
      throw new Error(`لبنة تقنية غير معروفة: "${id}"`);
    }
    if (seen.has(id)) {
      throw new Error(`لا يمكن تكرار اللبنة التقنية في الخطة نفسها: "${id}"`);
    }
    seen.add(id);
    return blockMap.get(id);
  });
}

/** يختار مستوى الجاهزية المطابق للدرجة من حدود الكتالوج. */
function resolveReadinessTier(score, tiers) {
  const sorted = [...tiers].sort((a, b) => b.minScore - a.minScore);
  return sorted.find((tier) => score >= tier.minScore) || sorted[sorted.length - 1];
}

/**
 * يقيّم خطة البناء المرتبة في الرؤية المعمقة بناءً على قيم الكتالوج وحدوده فقط.
 *
 * @param {string} sectorId
 * @param {readonly string[]} blockIds
 * @param {typeof CONTENT_CATALOG} [catalog]
 */
export function evaluatePlan(sectorId, blockIds, catalog = CONTENT_CATALOG) {
  const sector = resolveSector(sectorId, catalog);
  const blocks = resolvePlanBlocks(blockIds, catalog);
  const scoring = catalog.scoring;

  let rawScore = 0;
  let foundationCount = 0;
  let aiOnFoundationCount = 0;
  let aiOnSandCount = 0;

  const evaluatedBlocks = blocks.map((block, idx) => {
    if (block.type === 'foundation') {
      foundationCount += 1;
      rawScore += scoring.foundationPoints;
      return Object.freeze({
        ...block,
        slotIndex: idx + 1,
        placement: 'foundation',
        points: scoring.foundationPoints,
      });
    }

    const hasEnoughFoundation = foundationCount >= scoring.minFoundationBeforeAi;
    const points = hasEnoughFoundation
      ? scoring.aiOnFoundationPoints
      : scoring.aiOnSandPoints;
    rawScore += points;

    if (hasEnoughFoundation) {
      aiOnFoundationCount += 1;
    } else {
      aiOnSandCount += 1;
    }

    return Object.freeze({
      ...block,
      slotIndex: idx + 1,
      placement: hasEnoughFoundation ? 'ai-on-foundation' : 'ai-on-sand',
      points,
    });
  });

  const orderBonusApplied = aiOnFoundationCount > 0;
  if (orderBonusApplied) {
    rawScore += scoring.orderBonus;
  }

  const score = Math.min(scoring.maxScore, Math.max(0, rawScore));
  const tier = resolveReadinessTier(score, scoring.tiers);

  return Object.freeze({
    sectorId: sector.id,
    sectorName: sector.name,
    score,
    maxScore: scoring.maxScore,
    tier,
    foundationCount,
    aiOnFoundationCount,
    aiOnSandCount,
    orderBonusApplied,
    blocks: Object.freeze(evaluatedBlocks),
  });
}

