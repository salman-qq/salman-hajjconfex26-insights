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

/** يبني كائن حلقة واحدة موحّد الشكل لمحور مشترك أو أثر قطاعي. */
function assembleLink(scope, entity, axisName, sectorId, polarity) {
  const linkKey = polarity === 'negative' ? 'negativeLink' : 'positiveLink';
  const raw = entity[linkKey];
  return {
    scope,
    axisId: scope === 'common' ? entity.id : null,
    axisName,
    sectorId,
    polarity,
    icon: raw.icon,
    title: raw.title,
    simple: raw.simple,
    expert: raw.expert,
  };
}

/** يبني سلسلة الحلقات الست المرتبة واضعاً الحلقة القطاعية في الموضع الثاني (index 1). */
function createOrderedChain({ sector, catalog, resolveAxisPolarity, sectorPolarity }) {
  const commonLinks = catalog.axes.map((axis) =>
    assembleLink('common', axis, axis.name, sector.id, resolveAxisPolarity(axis))
  );
  const sectorLink = assembleLink(
    'sector',
    sector,
    `أثر قطاعي — ${sector.name}`,
    sector.id,
    sectorPolarity
  );

  // إدراج الحلقة القطاعية في الموضع الثاني (index 1)
  const ordered = [commonLinks[0], sectorLink, ...commonLinks.slice(1)];
  return Object.freeze(
    ordered.map((item, idx) => Object.freeze({ ...item, index: idx + 1 }))
  );
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

  const polarity = path === 'husk' ? 'negative' : 'positive';
  return createOrderedChain({
    sector,
    catalog,
    resolveAxisPolarity: () => polarity,
    sectorPolarity: polarity,
  });
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

/** يبني تفسير النتيجة: السلسلة المعمقة والفرص الفائتة وتنبيهات «ذكاء فوق الرمال». */
function resolveEvaluationDetails({
  sector,
  blocks,
  evaluatedBlocks,
  foundationCount,
  aiOnSandCount,
  catalog,
}) {
  const scoring = catalog.scoring;
  const builderUi = catalog.simulatorUi?.builder || CONTENT_CATALOG.simulatorUi.builder;

  const chosenFoundationAxes = new Set(
    blocks.filter((b) => b.type === 'foundation' && b.axisId).map((b) => b.axisId)
  );
  const isSectorPositive =
    foundationCount >= scoring.minFoundationBeforeAi && aiOnSandCount === 0;

  const chain = createOrderedChain({
    sector,
    catalog,
    resolveAxisPolarity: (axis) =>
      chosenFoundationAxes.has(axis.id) ? 'positive' : 'negative',
    sectorPolarity: isSectorPositive ? 'positive' : 'negative',
  });

  const missed = catalog.axes
    .filter((axis) => !chosenFoundationAxes.has(axis.id))
    .map((axis) => {
      const raw = axis.positiveLink;
      return Object.freeze({
        kind: 'axis',
        id: `missed-${axis.id}`,
        axisId: axis.id,
        axisName: axis.name,
        icon: raw.icon,
        title: raw.title,
        simple: raw.simple,
        expert: raw.expert,
      });
    });

  if (!blocks.some((b) => b.type === 'ai')) {
    const aiOpp =
      builderUi.missedAiOpportunity || CONTENT_CATALOG.simulatorUi.builder.missedAiOpportunity;
    missed.push(
      Object.freeze({
        kind: 'ai-opportunity',
        id: aiOpp.id,
        axisId: null,
        axisName: aiOpp.categoryLabel,
        icon: aiOpp.icon,
        title: aiOpp.title,
        simple: aiOpp.simple,
        expert: aiOpp.expert,
      })
    );
  }

  const warnings = evaluatedBlocks
    .filter((b) => b.placement === 'ai-on-sand')
    .map((b) =>
      Object.freeze({
        id: `warning-sand-${b.slotIndex}-${b.id}`,
        kind: 'ai-on-sand',
        blockId: b.id,
        blockName: b.name,
        slotIndex: b.slotIndex,
        requiredFoundationCount: scoring.minFoundationBeforeAi,
        icon: 'shield-alert',
        title: builderUi.sandWarningTitle,
        description: `«${b.name}» (${builderUi.sandWarningActionLead} ${b.slotIndex}) ${builderUi.sandWarningReason}`,
      })
    );

  return {
    chain,
    missed: Object.freeze(missed),
    warnings: Object.freeze(warnings),
  };
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
  const details = resolveEvaluationDetails({
    sector,
    blocks,
    evaluatedBlocks,
    foundationCount,
    aiOnSandCount,
    catalog,
  });

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
    chain: details.chain,
    missed: details.missed,
    warnings: details.warnings,
  });
}

