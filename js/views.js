/**
 * طبقة العرض (Views).
 *
 * تحوّل بيانات الكتالوج وحالة المنسّق إلى DOM للأقسام.
 * لا تحتوي أي قواعد منطقية لبناء السلسلة أو التقييم.
 */
import { getPlatformsForAudience } from './content-catalog.js';

/** أيقونات SVG مضمّنة من مجموعة متسقة (24×24). */
const ICONS = Object.freeze({
  linkedin: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z"/></svg>`,
  portfolio: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9.5h18"/><path d="M8 14h4"/><path d="M8 17h8"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6.5A8 8 0 1 1 21 12Z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>`,
  external: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>`,
  briefcase: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  compass: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5"/></svg>`,
  bus: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16"/><path d="M8 15h.01M16 15h.01"/><path d="M6 18v3M18 18v3"/></svg>`,
  'bus-alert': `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="4" width="14" height="14" rx="2.5"/><path d="M3 11h14"/><path d="M6 18v2M14 18v2"/><path d="M20 7v5"/><path d="M20 15h.01"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  book: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></svg>`,
  'user-alert': `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v4"/><path d="M19 15h.01"/></svg>`,
  users: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  'shield-alert': `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`,
  'shield-check': `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/></svg>`,
  'broken-link': `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m9 17-2 2a4 4 0 0 1-5.66-5.66l2-2"/><path d="m15 7 2-2a4 4 0 0 1 5.66 5.66l-2 2"/><path d="m8 8 8 8"/></svg>`,
  award: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>`,
  utensils: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`,
  crowd: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="6" r="2.5"/><circle cx="5" cy="9" r="2"/><circle cx="19" cy="9" r="2"/><path d="M8 21v-4a4 4 0 0 1 8 0v4"/><path d="M2 20v-2.5A3 3 0 0 1 5 14.5"/><path d="M22 20v-2.5a3 3 0 0 0-3-3"/></svg>`,
  building: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></svg>`,
  truck: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`,
  clipboard: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>`,
  headset: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>`,
  monitor: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="m6 12 4-3 3 2 5-4"/></svg>`,
  check: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20 6 9 17l-5-5"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
});

/** يُرجع كود SVG للأيقونة المطلوبة مع أيقونة احتياطية عند عدم التطابق. */
export function getIconSvg(name) {
  return ICONS[name] || ICONS.globe;
}

/** يهرّب النصوص قبل إدراجها في HTML. */
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** يعزل الوسم #hajjconfex2026 بـ <bdi dir="ltr"> ليظهر سليم الاتجاه داخل النص العربي. */
function formatRtlHashtag(text) {
  return escapeHtml(text).replace(
    /#hajjconfex2026/g,
    '<bdi dir="ltr">#hajjconfex2026</bdi>'
  );
}

/** يبني HTML قسم البطل من بيانات الكتالوج. */
export function renderHeroHtml(catalog) {
  const { hero } = catalog;
  const badgesHtml = hero.badges
    .map((badge) => {
      const icon = badge.variant === 'paid' ? getIconSvg('briefcase') : getIconSvg('compass');
      return `<li class="hero-badge hero-badge--${escapeHtml(badge.variant)}">
        <span class="hero-badge__icon" aria-hidden="true">${icon}</span>
        <span>${escapeHtml(badge.text)}</span>
      </li>`;
    })
    .join('');

  return `
    <p class="eyebrow">${formatRtlHashtag(hero.eyebrow)}</p>
    <h1 id="hero-title" class="hero-title" tabindex="-1">
      ${escapeHtml(hero.titlePrefix)}<span class="text-gold">${escapeHtml(hero.titleHighlight)}</span>
    </h1>
    <p class="lead hero-lead">${escapeHtml(hero.subtitle)}</p>

    <ul class="hero-badges" role="list" aria-label="نطاق الخدمات الاستشارية">
      ${badgesHtml}
    </ul>

    <div class="hero-actions">
      <a class="btn btn--primary" href="#${escapeHtml(hero.primaryCta.targetId)}" data-scroll-target="${escapeHtml(hero.primaryCta.targetId)}">
        ${escapeHtml(hero.primaryCta.label)}
      </a>
      <a class="btn btn--secondary" href="#${escapeHtml(hero.secondaryCta.targetId)}" data-scroll-target="${escapeHtml(hero.secondaryCta.targetId)}">
        ${escapeHtml(hero.secondaryCta.label)}
      </a>
    </div>

    <p class="hero-note">${formatRtlHashtag(hero.initiativeNote)}</p>
  `;
}

/** يبني HTML نتيجة التقييم الاستراتيجي داخل منطقة aria-live في الرؤية المعمقة. */
export function renderBuilderResultHtml(evaluation, catalog) {
  if (!evaluation) return '';
  const builderUi = catalog.simulatorUi.builder;
  const { score, maxScore, tier, sectorName } = evaluation;

  return `
    <div class="builder-result builder-result--${escapeHtml(tier.tone)}" data-tier-id="${escapeHtml(tier.id)}">
      <div class="builder-result__header">
        <div>
          <p class="builder-result__eyebrow">${escapeHtml(builderUi.resultTitle)} — ${escapeHtml(sectorName)}</p>
          <p class="builder-result__tier">
            <span>${escapeHtml(builderUi.readinessLabel)}</span>
            <strong class="builder-result__tier-badge builder-result__tier-badge--${escapeHtml(tier.tone)}">
              ${escapeHtml(tier.label)}
            </strong>
          </p>
        </div>
        <div class="builder-result__score" aria-label="${escapeHtml(String(score))} ${escapeHtml(builderUi.scoreOutOfLabel)} ${escapeHtml(String(maxScore))}">
          <span class="builder-result__score-value">${escapeHtml(String(score))}</span>
          <span class="builder-result__score-max">/ ${escapeHtml(String(maxScore))}</span>
        </div>
      </div>
      <p class="builder-result__summary">${escapeHtml(tier.summary)}</p>
    </div>
  `;
}

/** يبني لوحة الرؤية المعمقة (8 لبنات + 4 خانات مرتبة + زر التقييم + النتيجة). */
function renderBuilderPanelHtml(state, catalog, selectedSector) {
  const builderUi = catalog.simulatorUi.builder;
  if (!selectedSector) {
    return `
      <div class="builder-empty" role="note">
        <p>${escapeHtml(builderUi.chooseSectorPrompt)}</p>
      </div>
    `;
  }

  const plan = state.plan || [];
  const planSize = catalog.scoring.planSize;
  const remaining = Math.max(0, planSize - plan.length);
  const isComplete = remaining === 0;
  const blocks = catalog.blocks || [];
  const blockById = new Map(blocks.map((b) => [b.id, b]));

  const poolHtml = blocks
    .map((block) => {
      const slotPos = plan.indexOf(block.id);
      const isInPlan = slotPos !== -1;
      const isBlocked = isInPlan || isComplete;
      const isFoundation = block.type === 'foundation';
      const typeLabel = isFoundation ? builderUi.foundationBadge : builderUi.aiBadge;
      const typeIcon = isFoundation ? 'layers' : 'spark';
      const statusBadge = isInPlan
        ? `<span class="block-card__status">${getIconSvg('check')}<span>${escapeHtml(builderUi.placedBadgePrefix)} ${slotPos + 1}</span></span>`
        : '';

      return `
        <li class="block-grid__item">
          <button
            type="button"
            class="block-card block-card--${escapeHtml(block.type)} ${isInPlan ? 'block-card--in-plan' : ''}"
            data-action="add-block"
            data-block-id="${escapeHtml(block.id)}"
            data-block-type="${escapeHtml(block.type)}"
            aria-disabled="${isBlocked ? 'true' : 'false'}"
          >
            <span class="block-card__top">
              <span class="block-card__type block-card__type--${escapeHtml(block.type)}">
                <span class="block-card__type-icon" aria-hidden="true">${getIconSvg(typeIcon)}</span>
                <span>${escapeHtml(typeLabel)}</span>
              </span>
              ${statusBadge}
            </span>
            <span class="block-card__main">
              <span class="block-card__icon" aria-hidden="true">${getIconSvg(block.icon)}</span>
              <span class="block-card__name">${escapeHtml(block.name)}</span>
            </span>
            <span class="block-card__desc">${escapeHtml(block.description)}</span>
          </button>
        </li>
      `;
    })
    .join('');

  const slotsHtml = Array.from({ length: planSize }, (_, idx) => {
    const slotNumber = idx + 1;
    const blockId = plan[idx];
    const block = blockId ? blockById.get(blockId) : null;

    if (!block) {
      return `
        <li class="plan-slots__item">
          <div class="plan-slot plan-slot--empty" data-slot-index="${idx}">
            <span class="plan-slot__number" aria-hidden="true">${slotNumber}</span>
            <span class="plan-slot__empty-text">خانة ${slotNumber} — ${escapeHtml(builderUi.emptySlotHint)}</span>
          </div>
        </li>
      `;
    }

    const isFoundation = block.type === 'foundation';
    const typeLabel = isFoundation ? builderUi.foundationBadge : builderUi.aiBadge;

    return `
      <li class="plan-slots__item">
        <button
          type="button"
          class="plan-slot plan-slot--filled plan-slot--${escapeHtml(block.type)}"
          data-action="remove-block"
          data-slot-index="${idx}"
          data-block-id="${escapeHtml(block.id)}"
        >
          <span class="plan-slot__number">${slotNumber}</span>
          <span class="plan-slot__content">
            <span class="plan-slot__meta">
              <span class="plan-slot__type">${escapeHtml(typeLabel)}</span>
              <span class="plan-slot__title">${escapeHtml(block.name)}</span>
            </span>
            <span class="plan-slot__remove">
              ${getIconSvg('close')}
              <span>إزالة</span>
              <span class="visually-hidden">من الخانة ${slotNumber} وإعادتها إلى اللبنات المتاحة</span>
            </span>
          </span>
        </button>
      </li>
    `;
  }).join('');

  let hintText = builderUi.readyToEvaluateHint;
  if (!isComplete) {
    hintText =
      remaining === 1
        ? `${builderUi.missingSinglePrefix} لتكتمل الخانات الأربع قبل التقييم.`
        : `${builderUi.missingPluralPrefix} ${remaining} ${builderUi.missingPluralSuffix}`;
  }

  return `
    <div class="builder-workspace" data-builder-workspace>
      <div class="builder-header">
        <h3 class="sim-step__title">${escapeHtml(builderUi.stepTitle)}</h3>
        <p class="builder-intro">${escapeHtml(builderUi.stepIntro)}</p>
      </div>

      <div class="builder-pool">
        <h4 class="builder-subhead">${escapeHtml(builderUi.poolTitle)}</h4>
        <ul class="block-grid" role="list">
          ${poolHtml}
        </ul>
      </div>

      <div class="builder-plan">
        <h4 class="builder-subhead">${escapeHtml(builderUi.slotsTitle)}</h4>
        <ol class="plan-slots" role="list" aria-label="${escapeHtml(builderUi.slotsTitle)}">
          ${slotsHtml}
        </ol>

        <div class="builder-submit">
          <p id="builder-plan-hint" class="builder-hint">${escapeHtml(hintText)}</p>
          <button
            type="button"
            class="btn btn--primary builder-evaluate-btn"
            data-action="evaluate-plan"
            aria-disabled="${isComplete ? 'false' : 'true'}"
            aria-describedby="builder-plan-hint"
          >
            ${escapeHtml(builderUi.evaluateLabel)}
          </button>
        </div>
      </div>

      <div id="builder-result-live" class="builder-result-live" aria-live="polite" aria-atomic="true">
        ${state.simulator === 'evaluated' ? renderBuilderResultHtml(state.evaluation, catalog) : ''}
      </div>
    </div>
  `;
}

/**
 * يبني HTML قسم المحاكي (شريط القطاعات + تبويبَي الرحلة المبسطة والرؤية المعمقة).
 *
 * @param {{ simulator: string, mode?: 'quick' | 'builder', sectorId: string | null, path: 'husk' | 'foundation' | null, chain: readonly any[], plan?: readonly string[], evaluation?: any }} state
 * @param {any} catalog
 * @param {{ animateSteps?: boolean }} [options]
 */
export function renderSimulatorHtml(state, catalog, options = {}) {
  const { simulatorUi, sectors, sectorCategories } = catalog;
  const activeMode = state.mode || 'quick';
  const selectedSector = sectors.find((s) => s.id === state.sectorId) || null;
  const animateSteps = Boolean(options.animateSteps);

  const renderSectorCard = (sector) => {
      const isSelected = sector.id === state.sectorId;
      return `
        <li class="sector-grid__item">
        <button
          type="button"
          class="sector-card ${isSelected ? 'sector-card--selected' : ''}"
          data-action="select-sector"
          data-sector-id="${escapeHtml(sector.id)}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
        >
          <span class="sector-card__icon" aria-hidden="true">${getIconSvg(sector.icon)}</span>
          <span class="sector-card__name">${escapeHtml(sector.name)}</span>
        </button>
        </li>
      `;
  };

  const sectorCardsHtml = (sectorCategories || [])
    .map((category) => {
      const items = sectors.filter((s) => s.category === category.id);
      if (items.length === 0) return '';
      const headingId = `sector-group-${escapeHtml(category.id)}`;
      return `
        <div class="sector-group" data-sector-category="${escapeHtml(category.id)}">
          <h4 id="${headingId}" class="sector-group__title">${escapeHtml(category.title)}</h4>
          <p class="sector-group__desc">${escapeHtml(category.description)}</p>
          <ul class="sector-grid" role="list" aria-labelledby="${headingId}">
            ${items.map(renderSectorCard).join('')}
          </ul>
        </div>
      `;
    })
    .join('');

  const profileHtml = selectedSector
    ? `
      <div class="company-profile" role="region" aria-label="ملف ${escapeHtml(selectedSector.name)}">
        <div class="company-profile__item">
          <span class="company-profile__label">الهدف التجاري:</span>
          <span class="company-profile__value">${escapeHtml(selectedSector.profile.businessGoal)}</span>
        </div>
        <div class="company-profile__item">
          <span class="company-profile__label">الأثر المجتمعي المستهدف:</span>
          <span class="company-profile__value">${escapeHtml(selectedSector.profile.socialImpact)}</span>
        </div>
      </div>
    `
    : '';

  const showPathStep =
    state.simulator === 'sectorChosen' || state.simulator === 'chainRevealed';

  const pathStepHtml = showPathStep
    ? `
      <div class="sim-step" data-sim-step="path">
        <h3 class="sim-step__title">${escapeHtml(simulatorUi.stepPathTitle)}</h3>
        <div class="path-grid">
          ${(['husk', 'foundation'])
            .map((pathKey) => {
              const p = simulatorUi.paths[pathKey];
              const isSelected = state.path === pathKey;
              return `
                <button
                  type="button"
                  class="path-card path-card--${escapeHtml(p.id)} ${isSelected ? 'path-card--selected' : ''}"
                  data-action="select-path"
                  data-path="${escapeHtml(p.id)}"
                  aria-pressed="${isSelected ? 'true' : 'false'}"
                >
                  <span class="path-card__icon" aria-hidden="true">${getIconSvg(p.icon)}</span>
                  <span class="path-card__label">${escapeHtml(p.label)}</span>
                  <span class="path-card__sub">${escapeHtml(p.subtitle)}</span>
                </button>
              `;
            })
            .join('')}
        </div>
      </div>
    `
    : '';

  let chainHtml = '';
  if (state.simulator === 'chainRevealed' && state.path && state.chain.length > 0) {
    const pathMeta = simulatorUi.paths[state.path];
    const otherPathKey = state.path === 'husk' ? 'foundation' : 'husk';
    const otherPathMeta = simulatorUi.paths[otherPathKey];
    const polarity = state.path === 'husk' ? 'negative' : 'positive';

    const dominoItemsHtml = state.chain
      .map((link) => {
        const hideInitially = animateSteps && link.index > 1;
        return `
          <li
            class="domino-card domino-card--${escapeHtml(link.polarity)} ${link.scope === 'sector' ? 'domino-card--sector' : ''}"
            data-domino-step="${link.index}"
            ${hideInitially ? 'hidden' : ''}
          >
            <div class="domino-card__top">
              <span class="domino-card__step">حلقة ${link.index}</span>
              <span class="domino-card__axis">${escapeHtml(link.axisName)}</span>
            </div>
            <div class="domino-card__body">
              <span class="domino-card__icon" aria-hidden="true">${getIconSvg(link.icon)}</span>
              <div class="domino-card__content">
                <h4 class="domino-card__title">${escapeHtml(link.title)}</h4>
                <p class="domino-card__text">${escapeHtml(link.simple)}</p>
              </div>
            </div>
          </li>
        `;
      })
      .join('');

    chainHtml = `
      <div class="chain-result chain-result--${polarity}" data-chain-polarity="${polarity}">
        <div class="chain-result__header">
          <h3 id="chain-result-title" class="chain-result__title" tabindex="-1">
            ${escapeHtml(pathMeta.resultTitle)}
          </h3>
          <p class="chain-result__summary">${escapeHtml(pathMeta.resultSummary)}</p>
        </div>

        <ol class="domino-chain" role="list" aria-label="سلسلة الأثر المترتبة على القرار">
          ${dominoItemsHtml}
        </ol>

        <div class="chain-actions" data-chain-actions ${animateSteps ? 'hidden' : ''}>
          <button type="button" class="btn btn--secondary" data-action="switch-path">
            <span class="btn__icon" aria-hidden="true">${getIconSvg('refresh')}</span>
            <span>${escapeHtml(simulatorUi.switchPathLabel)}: ${escapeHtml(otherPathMeta.label)}</span>
          </button>
        </div>
      </div>
    `;
  }

  const modes = simulatorUi.modes;
  const modeTabsHtml = `
    <div class="sim-modes">
      <div class="sim-tablist" role="tablist" aria-label="أنماط المحاكي">
        ${(['quick', 'builder'])
          .map((modeKey) => {
            const m = modes[modeKey];
            const isActive = activeMode === modeKey;
            return `
              <button
                type="button"
                role="tab"
                id="tab-${escapeHtml(m.id)}"
                class="sim-tab"
                data-action="switch-mode"
                data-mode="${escapeHtml(m.id)}"
                aria-selected="${isActive ? 'true' : 'false'}"
                tabindex="${isActive ? '0' : '-1'}"
              >
                <span class="sim-tab__label">${escapeHtml(m.label)}</span>
                <span class="sim-tab__hint">${escapeHtml(m.hint)}</span>
              </button>
            `;
          })
          .join('')}
      </div>
    </div>
  `;

  const quickPanelContent =
    activeMode === 'quick' ? `${pathStepHtml}${chainHtml}` : '';
  const builderPanelContent =
    activeMode === 'builder'
      ? renderBuilderPanelHtml(state, catalog, selectedSector)
      : '';

  const quickEmptyTabindex = activeMode === 'quick' && !selectedSector ? 'tabindex="0"' : '';
  const builderEmptyTabindex = activeMode === 'builder' && !selectedSector ? 'tabindex="0"' : '';

  return `
    <p class="eyebrow">${escapeHtml(simulatorUi.eyebrow)}</p>
    <h2 id="simulator-title" class="section-title" tabindex="-1">${escapeHtml(simulatorUi.title)}</h2>
    <p class="lead">${escapeHtml(simulatorUi.intro)}</p>

    <div class="sim-step" data-sim-step="sector">
      <h3 class="sim-step__title">${escapeHtml(simulatorUi.stepSectorTitle)}</h3>
      <div class="sector-groups">
        ${sectorCardsHtml}
      </div>
      ${profileHtml}
    </div>

    ${modeTabsHtml}

    <div
      role="tabpanel"
      id="panel-quick"
      class="sim-tabpanel"
      aria-labelledby="tab-quick"
      ${quickEmptyTabindex}
      ${activeMode !== 'quick' ? 'hidden' : ''}
    >
      ${quickPanelContent}
    </div>

    <div
      role="tabpanel"
      id="panel-builder"
      class="sim-tabpanel"
      aria-labelledby="tab-builder"
      ${builderEmptyTabindex}
      ${activeMode !== 'builder' ? 'hidden' : ''}
    >
      ${builderPanelContent}
    </div>
  `;
}

/** يبني بطاقة تواصل واحدة (مؤسسية أو أفراد/طلاب) مع المنصات المناسبة لجمهورها. */
function renderTrackCardHtml(track, platforms) {
  const isB2B = track.audience === 'b2b';
  const cardIcon = isB2B ? getIconSvg('briefcase') : getIconSvg('compass');
  const linksHtml = platforms
    .map(
      (p) => `<li class="platform-item">
        <a class="platform-link" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer">
          <span class="platform-link__icon" aria-hidden="true">${getIconSvg(p.icon)}</span>
          <span class="platform-link__name">${escapeHtml(p.name)}</span>
          <span class="visually-hidden"> (يُفتح في تبويب جديد)</span>
          <span class="platform-link__ext" aria-hidden="true">${getIconSvg('external')}</span>
        </a>
      </li>`
    )
    .join('');

  return `
    <article class="contact-card contact-card--${escapeHtml(track.id)}" aria-labelledby="contact-card-${escapeHtml(track.id)}-title">
      <div class="contact-card__header">
        <span class="contact-card__badge contact-card__badge--${escapeHtml(track.id)}">
          <span class="contact-card__badge-icon" aria-hidden="true">${cardIcon}</span>
          <span>${escapeHtml(track.badge)}</span>
        </span>
        <h3 id="contact-card-${escapeHtml(track.id)}-title" class="contact-card__title">${escapeHtml(track.title)}</h3>
      </div>
      <p class="contact-card__desc">${escapeHtml(track.description)}</p>
      <ul class="platform-list" role="list" aria-label="قنوات ${escapeHtml(track.title)}">
        ${linksHtml}
      </ul>
    </article>
  `;
}

/** يبني HTML قسم الخلاصة والتواصل من بيانات الكتالوج. */
export function renderContactHtml(catalog) {
  const { closing, contactPlatforms } = catalog;
  const b2bPlatforms = getPlatformsForAudience('b2b', contactPlatforms);
  const indPlatforms = getPlatformsForAudience('individual', contactPlatforms);

  return `
    <p class="eyebrow">${escapeHtml(closing.eyebrow)}</p>
    <h2 id="contact-title" class="section-title" tabindex="-1">${escapeHtml(closing.title)}</h2>
    <p class="closing-message">${escapeHtml(closing.message)}</p>

    <div class="contact-grid">
      ${renderTrackCardHtml(closing.tracks.b2b, b2bPlatforms)}
      ${renderTrackCardHtml(closing.tracks.individual, indPlatforms)}
    </div>
  `;
}
