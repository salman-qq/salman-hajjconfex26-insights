/**
 * محرك المحاكي (Simulator Engine).
 *
 * دوال نقية تقرأ كتالوج المحتوى ولا تلمس DOM ولا تستورد أي وحدة خاصة بـ Node.
 * يعمل الملف نفسه في المتصفح وفي اختبارات Node المحلية.
 */
import {
  CONTENT_CATALOG,
  VALID_CASE_FILTERS,
  VALID_PATHS,
  VALID_SCALES,
} from './content-catalog.js';

/** يبحث عن حجم المنشأة في الكتالوج ويرفض المعرّف غير المعروف. */
export function resolveScale(scaleId = 'enterprise', catalog = CONTENT_CATALOG) {
  const scalesConfig = catalog.scales || CONTENT_CATALOG.scales;
  const resolvedId = scaleId || scalesConfig.defaultScaleId || 'enterprise';
  if (!VALID_SCALES.includes(resolvedId)) {
    throw new Error(`حجم منشأة غير معروف: "${scaleId}"`);
  }
  const scale = scalesConfig.items.find((item) => item.id === resolvedId);
  if (!scale) {
    throw new Error(`حجم منشأة غير معروف: "${scaleId}"`);
  }
  return scale;
}

/** يجد الشاهد الميداني المرتبط بالقطاع من معرض اللقطات الاستشارية (يدعم المعرّف والرمز المختصر). */
export function resolveFieldEvidence(sectorId, catalog = CONTENT_CATALOG) {
  const sector = resolveSector(sectorId, catalog);
  const insightsItems = catalog.insights?.items || CONTENT_CATALOG.insights.items;
  const targetId = sector.fieldEvidenceInsightId || insightsItems[0]?.id;
  const found =
    insightsItems.find(
      (item) => item.id === targetId || item.code === targetId
    ) ||
    insightsItems[0] ||
    null;
  return found ? Object.freeze({ ...found }) : null;
}

/** يبني خريطة البحث عن اللبنات بالمعرّف الأساسي أو المعرّف البديل (aliasId). */
function createBlockLookupMap(catalog = CONTENT_CATALOG) {
  const map = new Map();
  for (const b of catalog.blocks || CONTENT_CATALOG.blocks) {
    map.set(b.id, b);
    if (b.aliasId) {
      map.set(b.aliasId, b);
    }
  }
  return map;
}

/** يفلتر وقائع المختبر العالمي حسب الفئة (`all` | `failure` | `success`). */
export function getCaseStudies(filterId = 'all', catalog = CONTENT_CATALOG) {
  const resolvedFilter = VALID_CASE_FILTERS.includes(filterId) ? filterId : 'all';
  const items = catalog.caseStudies?.items || CONTENT_CATALOG.caseStudies.items;
  if (resolvedFilter === 'all') {
    return items;
  }
  return Object.freeze(items.filter((item) => item.category === resolvedFilter));
}

/**
 * يحسب القيم الخام للمؤشرات الأربعة بناءً على الحالة.
 */
function calculateRawTelemetryValues(
  { scaleId = 'enterprise', mode = 'quick', path = null, plan = [], evaluation = null },
  catalog = CONTENT_CATALOG
) {
  const scale = resolveScale(scaleId, catalog);
  const isSme = scale.id === 'sme';

  if (mode === 'builder' && evaluation) {
    const chosenAxes = new Set(
      (evaluation.blocks || [])
        .filter((b) => b.type === 'foundation' && b.axisId)
        .map((b) => b.axisId)
    );
    const hasKnowledge = chosenAxes.has('knowledge');
    const hasTalent = chosenAxes.has('talent');
    const hasCompliance = chosenAxes.has('compliance');
    const hasFinance = chosenAxes.has('finance');
    const hasSustainability = chosenAxes.has('sustainability');
    const sandPenalty = (evaluation.aiOnSandCount || 0) * 18;
    const bonus = evaluation.orderBonusApplied ? 10 : 0;

    return {
      financial: Math.max(
        8,
        Math.min(
          98,
          Math.round(
            (isSme ? 24 : 38) +
              (hasFinance ? 34 : 0) +
              (hasSustainability ? 18 : 0) +
              bonus -
              sandPenalty -
              (isSme && !hasFinance ? 10 : 0)
          )
        )
      ),
      trust: Math.max(
        8,
        Math.min(
          98,
          Math.round(
            30 +
              (hasKnowledge ? 32 : 0) +
              (hasTalent ? 32 : 0) +
              (evaluation.orderBonusApplied ? 6 : 0) -
              sandPenalty
          )
        )
      ),
      compliance: Math.max(
        8,
        Math.min(
          98,
          Math.round(
            25 +
              (hasCompliance ? 60 : 0) +
              (hasKnowledge ? 10 : 0) -
              (evaluation.aiOnSandCount > 0 && !hasCompliance ? 15 : 0)
          )
        )
      ),
      resilience: Math.max(
        8,
        Math.min(
          98,
          Math.round(
            28 +
              (hasSustainability ? 34 : 0) +
              (hasKnowledge ? 20 : 0) +
              bonus -
              sandPenalty
          )
        )
      ),
    };
  }

  if (mode === 'builder' && Array.isArray(plan) && plan.length > 0) {
    const blockMap = new Map(
      (catalog.blocks || CONTENT_CATALOG.blocks).map((b) => [b.id, b])
    );
    let foundationSoFar = 0;
    let sandCount = 0;
    let aiOnFoundationCount = 0;
    const chosenAxes = new Set();

    for (const blockId of plan) {
      const b = blockMap.get(blockId);
      if (!b) continue;
      if (b.type === 'foundation') {
        foundationSoFar += 1;
        if (b.axisId) chosenAxes.add(b.axisId);
      } else if (foundationSoFar < (catalog.scoring?.minFoundationBeforeAi || 2)) {
        sandCount += 1;
      } else {
        aiOnFoundationCount += 1;
      }
    }

    const aiBonus = aiOnFoundationCount > 0 ? 12 : 0;

    return {
      financial: Math.max(
        10,
        Math.min(
          96,
          Math.round(
            (isSme ? 42 : 56) +
              (chosenAxes.has('finance') ? 22 : 0) +
              (chosenAxes.has('sustainability') ? 12 : 0) +
              aiBonus -
              sandCount * 16
          )
        )
      ),
      trust: Math.max(
        10,
        Math.min(
          96,
          Math.round(
            50 +
              (chosenAxes.has('knowledge') ? 22 : 0) +
              (chosenAxes.has('talent') ? 22 : 0) +
              (aiOnFoundationCount > 0 ? 6 : 0) -
              sandCount * 18
          )
        )
      ),
      compliance: Math.max(
        10,
        Math.min(
          96,
          Math.round(
            46 +
              (chosenAxes.has('compliance') ? 44 : 0) +
              (chosenAxes.has('knowledge') ? 6 : 0) -
              sandCount * 14
          )
        )
      ),
      resilience: Math.max(
        10,
        Math.min(
          96,
          Math.round(
            48 +
              (chosenAxes.has('sustainability') ? 24 : 0) +
              (chosenAxes.has('knowledge') ? 16 : 0) +
              aiBonus -
              sandCount * 16
          )
        )
      ),
    };
  }

  if (path === 'husk') {
    return {
      financial: isSme ? 12 : 34,
      trust: 18,
      compliance: 20,
      resilience: isSme ? 15 : 24,
    };
  }

  if (path === 'foundation') {
    return {
      financial: isSme ? 88 : 94,
      trust: 92,
      compliance: 95,
      resilience: 91,
    };
  }

  return {
    financial: isSme ? 48 : 68,
    trust: 62,
    compliance: 58,
    resilience: isSme ? 52 : 60,
  };
}

/**
 * يحسب قراءات لوحة المؤشرات الحية الرباعية (4 Live Telemetry Meters)
 * مع شارة الفرق اللحظية (`delta` و `deltaText`) مقارنة بالحالة المرجعية أو القيم السابقة.
 */
export function computeTelemetry(
  {
    scaleId = 'enterprise',
    mode = 'quick',
    path = null,
    plan = [],
    evaluation = null,
    previousValues = null,
  } = {},
  catalog = CONTENT_CATALOG
) {
  const scale = resolveScale(scaleId, catalog);
  const metersConfig = catalog.telemetryMeters || CONTENT_CATALOG.telemetryMeters;
  const currentRaw = calculateRawTelemetryValues(
    { scaleId: scale.id, mode, path, plan, evaluation },
    catalog
  );

  // مرجع المقارنة الافتراضي عند عدم تمرير previousValues:
  // في حال اختيار SME بدون قرار سابق، نقارن بملاءة الشركة الكبرى لإظهار فرق حساسية السيولة فوراً (-20%)
  const referenceRaw =
    previousValues ||
    calculateRawTelemetryValues(
      {
        scaleId: !path && (!plan || plan.length === 0) && !evaluation ? 'enterprise' : scale.id,
        mode: 'quick',
        path: null,
        plan: [],
        evaluation: null,
      },
      catalog
    );

  const threshold = metersConfig.safetyThreshold ?? 70;
  const isCleanEvaluatedPlan =
    mode === 'builder' &&
    Boolean(evaluation) &&
    evaluation.aiOnSandCount === 0 &&
    evaluation.foundationCount >= (catalog.scoring?.minFoundationBeforeAi ?? 2);

  return Object.freeze(
    metersConfig.items.map((item) => {
      let value = currentRaw[item.id] ?? 50;
      if (isCleanEvaluatedPlan) {
        const cleanFloor = scale.id === 'sme' ? 74 : 78;
        value = Math.max(value, cleanFloor);
      }
      const prevValue = referenceRaw[item.id] ?? value;
      const delta = value - prevValue;
      const deltaText =
        delta > 0 ? `+${delta}%` : delta < 0 ? `${delta}%` : '0%';
      const deltaTone =
        delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
      const tone =
        value >= threshold ? 'positive' : value >= 45 ? 'warning' : 'negative';
      const litSegments = Math.max(0, Math.min(10, Math.round(value / 10)));
      const detail = metersConfig.detailsById?.[item.id] || {};

      return Object.freeze({
        id: item.id,
        label: item.label,
        icon: item.icon,
        value,
        litSegments,
        prevValue,
        delta,
        deltaText,
        deltaTone,
        tone,
        safetyThreshold: threshold,
        safetyThresholdLabel:
          metersConfig.safetyThresholdLabel || `حد الأمان التشغيلي: ${threshold}%`,
        statusLabel: metersConfig.statusLabels?.[tone] || '',
        statusText: item.descriptions[tone],
        whatItMeasures: detail.whatItMeasures || '',
        hajjFieldExample: detail.hajjFieldExample || '',
      });
    })
  );
}

/**
 * يحلل خطوات خطة البناء التفاعلية خطوة بخطوة (Interactive Step-by-Step Architecture Lab)
 * ويُرجع رد فعل الميدان اللحظي لكل خانة، وشارات التغيير، وتنبيهات «ذكاء فوق الرمال» الفورية.
 */
export function analyzeInteractivePlan(
  sectorId,
  plan = [],
  catalog = CONTENT_CATALOG
) {
  const sector = sectorId
    ? catalog.sectors.find((s) => s.id === sectorId || s.aliasId === sectorId) ||
      catalog.sectors[0]
    : catalog.sectors[0];
  const minFoundation = catalog.scoring?.minFoundationBeforeAi || 2;
  const stageLabels =
    catalog.simulatorUi?.builder?.stageLabels ||
    CONTENT_CATALOG.simulatorUi.builder.stageLabels;
  const blockMap = createBlockLookupMap(catalog);

  let foundationSoFar = 0;
  let sandWarningsCount = 0;

  const slotReactions = (plan || []).map((blockId, idx) => {
    const block = blockMap.get(blockId);
    const stageLabel = stageLabels[idx] || `المرحلة ${idx + 1}`;
    if (!block) return null;

    if (block.type === 'foundation') {
      foundationSoFar += 1;
      const axisContext =
        (block.axisId && sector?.axisContexts?.[block.axisId]?.positive) ||
        block.description;
      const deltaBadge =
        block.axisId === 'compliance'
          ? '+44% امتثال سيادي'
          : block.axisId === 'finance'
            ? '+22% سيولة وعائد'
            : block.axisId === 'sustainability'
              ? '+24% صمود وقت الذروة'
              : '+22% ذاكرة وثقة الفريق';

      return Object.freeze({
        slotIndex: idx,
        slotNumber: idx + 1,
        stageLabel,
        blockId: block.id,
        blockName: block.name,
        blockType: block.type,
        placement: 'foundation',
        tone: 'positive',
        isSandWarning: false,
        deltaBadge,
        reactionTitle: `تأسيس سليم في ${stageLabel}`,
        reactionText: axisContext,
      });
    }

    const isReady = foundationSoFar >= minFoundation;
    if (!isReady) {
      sandWarningsCount += 1;
      return Object.freeze({
        slotIndex: idx,
        slotNumber: idx + 1,
        stageLabel,
        blockId: block.id,
        blockName: block.name,
        blockType: block.type,
        placement: 'ai-on-sand',
        tone: 'negative',
        isSandWarning: true,
        deltaBadge: '-18% ذاكرة الفريق · -16% سيولة',
        reactionTitle: 'تحذير فوري: ذكاء فوق الرمال!',
        reactionText: `في ${sector.name}: إطلاق «${block.name}» في ${stageLabel} قبل استكمال لبنتي أساس على الأقل يجبر الفريق الميداني على تصحيح مخرجات الآلة يدوياً ويهبط بثقة الموظفين والسيولة!`,
      });
    }

    return Object.freeze({
      slotIndex: idx,
      slotNumber: idx + 1,
      stageLabel,
      blockId: block.id,
      blockName: block.name,
      blockType: block.type,
      placement: 'ai-on-foundation',
      tone: 'positive',
      isSandWarning: false,
      deltaBadge: '+20 نقطة مكافأة ترتيب · +12% عائد',
      reactionTitle: `ذكاء اصطناعي على أساس متين (${stageLabel})`,
      reactionText: `في ${sector.name}: يعمل «${block.name}» الآن فوق ${foundationSoFar} لبنات أساس موثوقة، فيحقق تنبؤاً دقيقاً ويرفع كفاءة الفريق دون عبء يدوي.`,
    });
  });

  // هل يمكن تحسين ترتيب اللبنات الحالية (وجود لبنة ذكاء تسبق لبنة أساس)؟
  let seenAi = false;
  let canAutoSort = false;
  for (const id of plan) {
    const b = blockMap.get(id);
    if (!b) continue;
    if (b.type === 'ai') seenAi = true;
    if (b.type === 'foundation' && seenAi) {
      canAutoSort = true;
      break;
    }
  }

  return Object.freeze({
    slotReactions: Object.freeze(slotReactions.filter(Boolean)),
    foundationCount: foundationSoFar,
    sandWarningsCount,
    canAutoSort,
  });
}

/**
 * يرتب لبنات الخطة الحالية تلقائياً بالطريقة الصحيحة (لبنات الأساس أولاً ثم لبنات الذكاء الاصطناعي)
 * مع الحفاظ على الترتيب النسبي لكل فئة.
 */
export function sortPlanOptimally(plan = [], catalog = CONTENT_CATALOG) {
  const blockMap = createBlockLookupMap(catalog);
  const foundations = [];
  const ais = [];
  for (const id of plan) {
    const b = blockMap.get(id);
    if (!b) continue;
    if (b.type === 'foundation') {
      foundations.push(b.id);
    } else {
      ais.push(b.id);
    }
  }
  // إذا كانت الخطة أقل من 4 لبنات ولا تحتوي على لبنتي أساس على الأقل، نكملها تلقائياً إلى 4 لبنات مثالية للمقارنة الفورية
  const result = [...foundations, ...ais];
  if (result.length > 0 && foundations.length < 2) {
    for (const b of catalog.blocks || CONTENT_CATALOG.blocks) {
      if (b.type === 'foundation' && !result.includes(b.id) && result.length < 4) {
        foundations.push(b.id);
      }
      if (foundations.length >= 2) break;
    }
    return Object.freeze([...foundations, ...ais].slice(0, 4));
  }
  return Object.freeze(result);
}

/**
 * يبني الفصول الزمنية الثلاثة وتأثير القرار المتأخر (3-Phase Delayed Consequence Timeline)
 * مع تخصيص الفصل الثالث حسب حجم المنشأة (Enterprise مقابل SME).
 */
export function buildConsequenceTimeline(
  { tone = 'negative', scaleId = 'enterprise', sectorId = 'shuttle' } = {},
  catalog = CONTENT_CATALOG
) {
  const scale = resolveScale(scaleId, catalog);
  const sector = resolveSector(sectorId, catalog);
  const timelineConfig =
    catalog.consequenceTimeline || CONTENT_CATALOG.consequenceTimeline;
  const resolvedTone =
    tone === 'positive' || tone === 'warning' || tone === 'negative'
      ? tone
      : 'negative';
  const scaleOutcome = scale.outcomes[resolvedTone];

  return Object.freeze(
    timelineConfig.phases.map((phase, idx) => {
      const baseNarrative = phase.narratives[resolvedTone];
      const isFinalPhase = idx === timelineConfig.phases.length - 1;
      return Object.freeze({
        id: phase.id,
        stepNumber: phase.stepNumber,
        timeframe: phase.timeframe,
        title: phase.title,
        tone: resolvedTone,
        narrative: isFinalPhase
          ? `${baseNarrative} — في ${sector.name} (${scale.shortLabel}): ${scaleOutcome.fateSummary}`
          : baseNarrative,
        scaleFateTitle: isFinalPhase ? scaleOutcome.fateTitle : null,
      });
    })
  );
}

/**
 * يبني بطاقة «الفكرة العامة والتشخيص التنفيذي لمنشأتك» (Executive Diagnosis)
 * شاملة النقاط الثلاث الحاسمة ونص المشاركة الجاهز لـ LinkedIn.
 */
export function buildExecutiveDiagnosis(
  {
    sectorId,
    scaleId = 'enterprise',
    mode = 'quick',
    path = 'husk',
    evaluation = null,
  },
  catalog = CONTENT_CATALOG
) {
  const sector = resolveSector(sectorId, catalog);
  const scale = resolveScale(scaleId, catalog);
  const metersConfig = catalog.telemetryMeters || CONTENT_CATALOG.telemetryMeters;
  const trustMeter = metersConfig.items.find((m) => m.id === 'trust');

  let tone = 'negative';
  let decisionLabel = '';
  let scoreBadge = null;

  if (mode === 'builder' && evaluation) {
    tone = evaluation.tier.tone;
    decisionLabel = `خطة البناء (${evaluation.score}/${evaluation.maxScore} — ${evaluation.tier.label})`;
    scoreBadge = `${evaluation.score}/${evaluation.maxScore} · ${evaluation.tier.label}`;
  } else {
    tone = path === 'foundation' ? 'positive' : 'negative';
    const pathConfig =
      (catalog.simulatorUi?.paths || CONTENT_CATALOG.simulatorUi.paths)[path] ||
      CONTENT_CATALOG.simulatorUi.paths.husk;
    decisionLabel = pathConfig.label;
    scoreBadge = path === 'foundation' ? 'مسار الأساس المحكوم' : 'مسار القشور المتعثر';
  }

  const scaleOutcome = scale.outcomes[tone];
  const employeeMemoryImpact =
    tone === 'negative'
      ? `${metersConfig.employeeMemoryCalloutBody} وفي ${sector.name} يتضاعف هذا الأثر حين يغادر المشرفون الميدانيون حاملين معهم تفاصيل التشغيل غير الموثقة.`
      : tone === 'warning'
        ? `توثيق جزئي للعمليات في ${sector.name} يحفظ جزءاً من المعرفة، لكن الفجوات المتبقية لا تزال تفرض عبئاً يدوياً يهدد ثقة الفريق واستقراره في ذروة الموسم.`
        : `${trustMeter.descriptions.positive} وبذلك تتحول خبرة فريق ${sector.name} إلى أصل مؤسسي موثق لا يتأثر بدوران الأفراد.`;

  const strategicLesson =
    tone === 'negative'
      ? `لا تطلق نماذج الذكاء الاصطناعي في ${sector.name} قبل توحيد مصادر البيانات وتوثيق الأنظمة وتصنيفها وفق NDMO وPDPL؛ فالتقنية بلا حوكمة تستنزف القوائم المالية وتطرد الكفاءات.`
      : tone === 'warning'
        ? `الخطوات التأسيسية في ${sector.name} واعدة، لكن حماية السيولة وذاكرة الفريق تتطلب إغلاق فجوات الحوكمة المتبقية وترتيب الأولويات قبل التوسع في الذكاء الاصطناعي.`
        : `تأسيس حوكمة البيانات ومسار التدقيق أولاً في ${sector.name} هو الاستثمار الأعلى عائداً: حماية للسيولة، وصون لذاكرة الموظف، وجاهزية فورية للذكاء الاصطناعي والتقييم الاستثماري.`;

  const diagnosis = Object.freeze({
    sectorId: sector.id,
    sectorName: sector.name,
    scaleId: scale.id,
    scaleLabel: scale.label,
    scaleShortLabel: scale.shortLabel,
    mode,
    tone,
    decisionLabel,
    scoreBadge,
    fateTitle: scaleOutcome.fateTitle,
    fateSummary: scaleOutcome.fateSummary,
    financialImpact: scaleOutcome.financialImpact,
    employeeMemoryImpact,
    strategicLesson,
  });

  return Object.freeze({
    ...diagnosis,
    shareText: formatDiagnosisShareText(diagnosis, catalog),
  });
}

/** يصيغ نص المشاركة التفاعلي الجاهز للنشر على LinkedIn مع رابط الموقع. */
export function formatDiagnosisShareText(diagnosis, catalog = CONTENT_CATALOG) {
  const siteUrl =
    catalog.meta?.siteUrl ||
    CONTENT_CATALOG.meta.siteUrl ||
    'https://salman-qq.github.io/salman-hajjconfex26-insights/';
  const hashtag = catalog.meta?.hashtag || '#hajjconfex2026';

  return [
    `جرّبت «محاكي القرارات التنفيذي» (سلمان الحربي — ${hashtag}) لقطاع «${diagnosis.sectorName}» (${diagnosis.scaleShortLabel}):`,
    `• القرار التقني: ${diagnosis.decisionLabel}`,
    `• النتيجة التنفيذية: ${diagnosis.fateTitle}`,
    `• الأثر المالي: ${diagnosis.financialImpact}`,
    `• أثر القرار على ذاكرة الموظف: ${diagnosis.employeeMemoryImpact}`,
    `• الدرس الاستراتيجي: ${diagnosis.strategicLesson}`,
    `اختبر جاهزية منشأتك بنفسك: ${siteUrl}`,
  ].join('\n');
}

/** يبحث عن القطاع في الكتالوج ويرفض المعرّف غير المعروف. */
function resolveSector(sectorId, catalog) {
  if (typeof sectorId !== 'string' || !sectorId.trim()) {
    throw new Error(`قطاع غير معروف: "${sectorId}"`);
  }

  const sector = catalog.sectors.find(
    (s) => s.id === sectorId || s.aliasId === sectorId
  );
  if (!sector) {
    throw new Error(`قطاع غير معروف: "${sectorId}"`);
  }
  return sector;
}

/** يتحقق من وجود المرجع التنظيمي في الكتالوج ويُرجع نسخه المجمّدة عند ارتباطه بالحلقة. */
function resolveRegulatoryRef(refId, catalog) {
  if (!refId) return null;
  const ref = (catalog.regulatoryReferences || []).find((item) => item.id === refId);
  if (!ref) {
    throw new Error(`مرجع تنظيمي غير معروف: "${refId}"`);
  }
  return Object.freeze({ ...ref });
}

/** يبني كائن حلقة واحدة موحّد الشكل لمحور مشترك أو أثر قطاعي مع السياق الميداني المخصص للقطاع. */
function assembleLink(scope, entity, axisName, sector, polarity, catalog) {
  const linkKey = polarity === 'negative' ? 'negativeLink' : 'positiveLink';
  const raw = entity[linkKey];
  const regulatoryRef = resolveRegulatoryRef(raw.regulatoryRefId, catalog);
  const sectorContext =
    scope === 'common'
      ? sector.axisContexts?.[entity.id]?.[polarity] || null
      : null;

  return {
    scope,
    axisId: scope === 'common' ? entity.id : null,
    axisName,
    sectorId: sector.id,
    sectorName: sector.name,
    polarity,
    icon: raw.icon,
    title: raw.title,
    simple: raw.simple,
    expert: raw.expert,
    sectorContext,
    regulatoryRef,
  };
}

/** يبني سلسلة الحلقات الست المرتبة واضعاً الحلقة القطاعية في الموضع الثاني (index 1). */
function createOrderedChain({ sector, catalog, resolveAxisPolarity, sectorPolarity }) {
  const commonLinks = catalog.axes.map((axis) =>
    assembleLink('common', axis, axis.name, sector, resolveAxisPolarity(axis), catalog)
  );
  const sectorLink = assembleLink(
    'sector',
    sector,
    `أثر قطاعي — ${sector.name}`,
    sector,
    sectorPolarity,
    catalog
  );

  // إدراج الحلقة القطاعية في الموضع الثاني (index 1)
  const ordered = [commonLinks[0], sectorLink, ...commonLinks.slice(1)];
  let firstBottleneckIndex = -1;
  return Object.freeze(
    ordered.map((item, idx) => {
      let isBottleneck = false;
      let isDegraded = false;
      if (item.polarity === 'negative' && firstBottleneckIndex === -1) {
        firstBottleneckIndex = idx;
        isBottleneck = true;
      } else if (firstBottleneckIndex !== -1 && idx > firstBottleneckIndex) {
        isDegraded = true;
      }
      return Object.freeze({
        ...item,
        index: idx + 1,
        isBottleneck,
        isDegraded,
      });
    })
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

  const blockMap = createBlockLookupMap(catalog);
  const seen = new Set();

  return blockIds.map((id) => {
    const resolved = typeof id === 'string' ? blockMap.get(id) : null;
    if (!resolved) {
      throw new Error(`لبنة تقنية غير معروفة: "${id}"`);
    }
    if (seen.has(resolved.id)) {
      throw new Error(`لا يمكن تكرار اللبنة التقنية في الخطة نفسها: "${id}"`);
    }
    seen.add(resolved.id);
    return resolved;
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
      isSectorPositive || chosenFoundationAxes.has(axis.id)
        ? 'positive'
        : 'negative',
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
 * @param {{ scaleId?: 'enterprise' | 'sme' }} [options]
 */
export function evaluatePlan(
  sectorId,
  blockIds,
  catalog = CONTENT_CATALOG,
  options = {}
) {
  const sector = resolveSector(sectorId, catalog);
  const scale = resolveScale(options?.scaleId, catalog);
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

  const baseEval = {
    sectorId: sector.id,
    sectorName: sector.name,
    scaleId: scale.id,
    scaleLabel: scale.label,
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
  };

  const telemetry = computeTelemetry(
    {
      scaleId: scale.id,
      mode: 'builder',
      evaluation: baseEval,
    },
    catalog
  );
  const timeline = buildConsequenceTimeline(
    {
      tone: tier.tone,
      scaleId: scale.id,
      sectorId: sector.id,
    },
    catalog
  );
  const fieldEvidence = resolveFieldEvidence(sector.id, catalog);
  const diagnosis = buildExecutiveDiagnosis(
    {
      sectorId: sector.id,
      scaleId: scale.id,
      mode: 'builder',
      evaluation: baseEval,
    },
    catalog
  );

  return Object.freeze({
    ...baseEval,
    telemetry,
    timeline,
    fieldEvidence,
    diagnosis,
  });
}

/**
 * يحدّد حالة المحرك المحيطي للواجهة (`neutral` | `governed` | `warning` | `critical`)
 * لتلوين الأورورا، شبكة التدفق الخلفية، وتوهّج البطاقات تلقائياً حسب وضع القرار الحالي.
 */
export function resolveSimulatorAmbientState(
  { mode = 'quick', path = null, plan = [], evaluation = null } = {},
  catalog = CONTENT_CATALOG
) {
  const safetyThreshold = catalog.telemetryMeters?.safetyThreshold ?? 70;
  const minFoundation = catalog.scoring?.minFoundationBeforeAi ?? 2;

  if (mode === 'quick') {
    if (path === 'foundation') return 'governed';
    if (path === 'husk') return 'critical';
    return 'neutral';
  }

  if (evaluation) {
    if (evaluation.aiOnSandCount > 0 || evaluation.score < 45) {
      return 'critical';
    }
    if (evaluation.score >= safetyThreshold && evaluation.aiOnSandCount === 0) {
      return 'governed';
    }
    return 'warning';
  }

  if (Array.isArray(plan) && plan.length > 0) {
    const analysis = analyzeInteractivePlan(null, plan, catalog);
    if (analysis.sandWarningsCount > 0) {
      return 'critical';
    }
    if (analysis.foundationCount >= minFoundation) {
      return 'governed';
    }
    return 'warning';
  }

  return 'neutral';
}

