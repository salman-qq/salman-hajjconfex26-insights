/**
 * طبقة العرض (Views).
 *
 * تحوّل بيانات الكتالوج وحالة المنسّق إلى DOM للأقسام.
 * لا تحتوي أي قواعد منطقية لبناء السلسلة أو التقييم.
 */
import { CONTENT_CATALOG, getPlatformsForAudience } from './content-catalog.js';
import {
  analyzeInteractivePlan,
  buildConsequenceTimeline,
  buildExecutiveDiagnosis,
  computeTelemetry,
  getCaseStudies,
  resolveFieldEvidence,
  resolveSimulatorAmbientState,
} from './simulator-engine.js';

/** أيقونات SVG مضمّنة من مجموعة متسقة (24×24). */
const ICONS = Object.freeze({
  linkedin: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" focusable="false"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/></svg>`,
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
  zoom: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="m21 3-7 7"/><path d="m3 21 7-7"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
});

/** يُرجع كود SVG للأيقونة المطلوبة مع أيقونة احتياطية عند عدم التطابق. */
export function getIconSvg(name) {
  return ICONS[name] || ICONS.globe;
}

/** صور مصغرة بديلة مرسومة داخل الموقع للمراجع التنظيمية (بلا شعارات رسمية منسوخة). */
const REGULATORY_THUMBNAILS = Object.freeze({
  sdaia: `<svg viewBox="0 0 80 48" width="80" height="48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="regulatory-ref__thumb-svg" aria-hidden="true" focusable="false"><rect x="2" y="2" width="76" height="44" rx="6" stroke-opacity="0.35" stroke-dasharray="3 2"/><path d="M40 9 53 14v8.5c0 8.2-5.4 14-13 16.5-7.6-2.5-13-8.3-13-16.5V14L40 9Z" fill="currentColor" fill-opacity="0.12"/><circle cx="40" cy="23" r="3.5" fill="currentColor" fill-opacity="0.28"/><circle cx="15" cy="18" r="2.2"/><circle cx="15" cy="30" r="2.2"/><circle cx="65" cy="18" r="2.2"/><circle cx="65" cy="30" r="2.2"/><path d="M17.2 18H27M17.2 30H28M53 18h9.8M52 30h10.8" stroke-opacity="0.7"/></svg>`,
  ndmo: `<svg viewBox="0 0 80 48" width="80" height="48" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="regulatory-ref__thumb-svg" aria-hidden="true" focusable="false"><rect x="2" y="2" width="76" height="44" rx="6" stroke-opacity="0.35" stroke-dasharray="3 2"/><rect x="14" y="13" width="12" height="22" rx="2" fill="currentColor" fill-opacity="0.12"/><rect x="30" y="18" width="12" height="17" rx="2" fill="currentColor" fill-opacity="0.12"/><path d="M11 38h35" stroke-opacity="0.85"/><path d="M56 14a9 9 0 1 1 0 18 9 9 0 0 1 0-18Z" fill="currentColor" fill-opacity="0.14"/><path d="m52.5 23 2.5 2.5 5-5"/></svg>`,
});

/** يُرجع الصورة المصغرة المرسومة للمرجع التنظيمي المطلوب. */
export function getRegulatoryThumbnailSvg(key) {
  return REGULATORY_THUMBNAILS[key] || REGULATORY_THUMBNAILS.sdaia;
}

/** يبني رابط المرجع التنظيمي وصورته المصغرة داخل حلقة الامتثال باللون الأزرق النيلي. */
function renderRegulatoryRefHtml(ref, regulatoryLabels) {
  if (!ref) return '';
  const eyebrow = regulatoryLabels?.eyebrow || 'مرجع تنظيمي رسمي';
  const externalHint = regulatoryLabels?.externalHint || '(يُفتح في نافذة جديدة)';
  const docHref = ref.docUrl || ref.url;
  const docLabel = ref.docLabel || ref.shortLabel || ref.name;
  const portalHref = ref.portalUrl || '';
  const portalLabel = ref.portalLabel || 'المنصة الرسمية';

  const portalLinkHtml = portalHref
    ? `<a
        class="regulatory-ref__btn regulatory-ref__btn--secondary"
        href="${escapeHtml(portalHref)}"
        target="_blank"
        rel="noopener noreferrer"
        data-regulatory-ref-portal="${escapeHtml(ref.id)}"
      >
        <span>${escapeHtml(portalLabel)}</span>
        <span class="regulatory-ref__ext-icon" aria-hidden="true">${getIconSvg('external')}</span>
        <span class="visually-hidden"> ${escapeHtml(externalHint)}</span>
      </a>`
    : '';

  return `
    <div class="domino-card__ref">
      <div class="regulatory-ref" data-regulatory-ref-card="${escapeHtml(ref.id)}">
        <div class="regulatory-ref__header">
          <span class="regulatory-ref__thumb" aria-hidden="true">
            ${getRegulatoryThumbnailSvg(ref.thumbnailKey)}
            <span class="regulatory-ref__thumb-code">${escapeHtml(ref.shortLabel)}</span>
          </span>
          <span class="regulatory-ref__meta">
            <span class="regulatory-ref__eyebrow">
              <span>${escapeHtml(eyebrow)}</span>
            </span>
            <strong class="regulatory-ref__name">${escapeHtml(ref.name)}</strong>
            <span class="regulatory-ref__sub">${escapeHtml(ref.subtitle)}</span>
          </span>
        </div>
        <div class="regulatory-ref__actions">
          <a
            class="regulatory-ref__btn regulatory-ref__btn--primary"
            href="${escapeHtml(docHref)}"
            target="_blank"
            rel="noopener noreferrer"
            data-regulatory-ref="${escapeHtml(ref.id)}"
          >
            <span>${escapeHtml(docLabel)}</span>
            <span class="regulatory-ref__ext-icon" aria-hidden="true">${getIconSvg('external')}</span>
            <span class="visually-hidden"> ${escapeHtml(externalHint)}</span>
          </a>
          ${portalLinkHtml}
        </div>
      </div>
    </div>
  `;
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
  return escapeHtml(text)
    .replace(/#hajjconfex2026/g, '<bdi dir="ltr">#hajjconfex2026</bdi>')
    .replace(/#HajjConfex2026/g, '<bdi dir="ltr">#HajjConfex2026</bdi>');
}

/** يبني شريط الانتقال بين المحطات الخمس في ذيل كل محطة. */
export function renderStationFooterNavHtml(stationId, catalog = CONTENT_CATALOG) {
  const stationsConfig =
    catalog?.journeyStations || CONTENT_CATALOG.journeyStations;
  const items = stationsConfig?.items || [];
  const currentIdx = items.findIndex((s) => s.id === stationId);
  if (currentIdx === -1) return '';

  const currentStation = items[currentIdx];
  const prevStation = currentIdx > 0 ? items[currentIdx - 1] : null;
  const nextStation = currentIdx < items.length - 1 ? items[currentIdx + 1] : null;

  const prevBtnHtml = prevStation
    ? `
      <a
        class="btn btn--secondary station-nav-bar__btn station-nav-bar__btn--prev"
        href="#${escapeHtml(prevStation.id)}"
        data-action="go-station"
        data-station-target="${escapeHtml(prevStation.id)}"
        data-scroll-target="${escapeHtml(prevStation.id)}"
      >
        <span>→ المحطة ${escapeHtml(prevStation.number)}: ${escapeHtml(prevStation.shortLabel)}</span>
      </a>
    `
    : `<span class="station-nav-bar__spacer" aria-hidden="true"></span>`;

  const nextBtnHtml = nextStation
    ? `
      <a
        class="btn btn--primary station-nav-bar__btn station-nav-bar__btn--next"
        href="#${escapeHtml(nextStation.id)}"
        data-action="go-station"
        data-station-target="${escapeHtml(nextStation.id)}"
        data-scroll-target="${escapeHtml(nextStation.id)}"
      >
        <span>انتقل للمحطة ${escapeHtml(nextStation.number)} (${escapeHtml(nextStation.shortLabel)}) ←</span>
      </a>
    `
    : `
      <a
        class="btn btn--secondary station-nav-bar__btn station-nav-bar__btn--restart"
        href="#simulator"
        data-action="go-station"
        data-station-target="simulator"
        data-scroll-target="simulator"
      >
        <span>عودة إلى المحاكي التنفيذي (المحطة 02) ↺</span>
      </a>
    `;

  return `
    <nav
      class="station-nav-bar"
      data-station-footer-nav="${escapeHtml(stationId)}"
      aria-label="التنقل من المحطة ${escapeHtml(currentStation.number)}"
    >
      ${prevBtnHtml}
      <span class="station-nav-bar__status">
        المحطة <strong>${escapeHtml(currentStation.number)}</strong> من <strong>0${items.length}</strong> · ${escapeHtml(currentStation.title)}
      </span>
      ${nextBtnHtml}
    </nav>
  `;
}

/** يبني HTML قسم البطل (المحطة 1: قُد القرار الأذكى) من بيانات الكتالوج. */
export function renderHeroHtml(catalog) {
  const { hero } = catalog;
  const motto = hero.motto || 'قُد القرار الأذكى';
  const identityLine =
    hero.identityLine ||
    'سلمان الحربي | رؤى استشارية ومحاكي قرارات البيانات والذكاء الاصطناعي — معرض الحج والعمرة #HajjConfex2026';
  const launchLabel = hero.journeyLaunchLabel || 'ابدأ رحلة القرار ←';

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
    <div class="motto-crest-banner" data-motto-banner>
      <div class="motto-crest-banner__emblem" aria-hidden="true">
        <svg viewBox="0 0 72 72" width="64" height="64" fill="none" class="motto-crest-svg" focusable="false">
          <polygon points="36,3 65,19.5 65,52.5 36,69 7,52.5 7,19.5" stroke="currentColor" stroke-width="2" class="motto-crest-svg__outer"/>
          <polygon points="36,10 58,23 58,49 36,62 14,49 14,23" stroke="currentColor" stroke-width="1.3" stroke-dasharray="4 3" class="motto-crest-svg__mid"/>
          <path d="M36 16L47 36L36 56L25 36L36 16Z" class="motto-crest-svg__emerald"/>
          <circle cx="36" cy="36" r="5" class="motto-crest-svg__core"/>
        </svg>
      </div>
      <div class="motto-crest-banner__text">
        <span class="motto-crest-banner__station-pill">المحطة 01 · المنطلق الاستراتيجي</span>
        <p class="motto-crest-banner__headline" data-motto-headline>«${escapeHtml(motto)}»</p>
        <p class="motto-crest-banner__identity">${formatRtlHashtag(identityLine)}</p>
      </div>
    </div>

    <p class="eyebrow">${formatRtlHashtag(hero.eyebrow)}</p>
    <h1 id="hero-title" class="hero-title" tabindex="-1">
      ${escapeHtml(hero.titlePrefix)}<span class="text-gold">${escapeHtml(hero.titleHighlight)}</span>
    </h1>
    <p class="lead hero-lead">${escapeHtml(hero.subtitle)}</p>

    <ul class="hero-badges" role="list" aria-label="نطاق الخدمات الاستشارية">
      ${badgesHtml}
    </ul>

    <div class="hero-actions">
      <a class="btn btn--primary btn--hero-launch" href="#${escapeHtml(hero.primaryCta.targetId)}" data-action="go-station" data-station-target="${escapeHtml(hero.primaryCta.targetId)}" data-scroll-target="${escapeHtml(hero.primaryCta.targetId)}">
        <span>${escapeHtml(launchLabel)}</span>
        <span class="visually-hidden"> (${escapeHtml(hero.primaryCta.label)})</span>
      </a>
      <a class="btn btn--secondary" href="#methodology" data-action="go-station" data-station-target="methodology" data-scroll-target="methodology">
        المنهجيات والشواهد (المحطة 03)
      </a>
      <a class="btn btn--secondary" href="#${escapeHtml(hero.secondaryCta.targetId)}" data-action="go-station" data-station-target="${escapeHtml(hero.secondaryCta.targetId)}" data-scroll-target="${escapeHtml(hero.secondaryCta.targetId)}">
        ${escapeHtml(hero.secondaryCta.label)}
      </a>
    </div>

    <p class="hero-note">${formatRtlHashtag(hero.initiativeNote)}</p>
    ${renderStationFooterNavHtml('hero', catalog)}
  `;
}

/** يبني بطاقة حلقة دومينو واحدة تشترك فيها الرحلة المبسطة والنتيجة المعمقة. */
function renderDominoCardHtml(link, options = {}) {
  const {
    textField = 'simple',
    headingTag = 'h4',
    hideInitially = false,
    showPolarityBadge = false,
    polarityLabels = null,
    regulatoryLabels = null,
  } = options;
  const polarityBadge =
    showPolarityBadge && polarityLabels
      ? `<span class="domino-card__polarity domino-card__polarity--${escapeHtml(link.polarity)}">${escapeHtml(
          link.polarity === 'positive' ? polarityLabels.positive : polarityLabels.negative
        )}</span>`
      : '';
  const bodyText = link[textField] || link.expert || link.simple;
  const refHtml = renderRegulatoryRefHtml(link.regulatoryRef, regulatoryLabels);
  const sectorContextHtml = link.sectorContext
    ? `<p class="domino-card__sector-context" data-sector-context="${escapeHtml(link.sectorId)}">${escapeHtml(link.sectorContext)}</p>`
    : '';
  const stateClasses = [
    link.isBottleneck ? 'bottleneck' : '',
    link.isDegraded ? 'degraded' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const causalPill = link.isBottleneck
    ? `<span class="domino-card__causal-pill domino-card__causal-pill--bottleneck">نقطة الاختناق الأولى</span>`
    : link.isDegraded
      ? `<span class="domino-card__causal-pill domino-card__causal-pill--degraded">تأثر متسلسل</span>`
      : '';

  return `
    <li
      class="domino-card domino-card--${escapeHtml(link.polarity)} ${link.scope === 'sector' ? 'domino-card--sector' : ''} ${stateClasses}"
      data-domino-step="${link.index}"
      data-polarity="${escapeHtml(link.polarity)}"
      ${link.isBottleneck ? 'data-bottleneck="true"' : ''}
      ${link.isDegraded ? 'data-degraded="true"' : ''}
      ${hideInitially ? 'hidden' : ''}
    >
      <div class="domino-card__top">
        <span class="domino-card__step">حلقة ${link.index}</span>
        <span class="domino-card__tags">
          <span class="domino-card__axis">${escapeHtml(link.axisName)}</span>
          ${causalPill}
          ${polarityBadge}
        </span>
      </div>
      <div class="domino-card__body">
        <span class="domino-card__icon" aria-hidden="true">${getIconSvg(link.icon)}</span>
        <div class="domino-card__content">
          <${headingTag} class="domino-card__title">${escapeHtml(link.title)}</${headingTag}>
          <p class="domino-card__text">${escapeHtml(bodyText)}</p>
          ${sectorContextHtml}
          ${refHtml}
        </div>
      </div>
    </li>
  `;
}

/** يبني مفتاح حجم المنشأة (Enterprise vs. SME Scale Toggle) مع بطاقة الملاءة المالية الفورية. */
export function renderScaleToggleHtml(
  activeScaleId = 'enterprise',
  catalog = CONTENT_CATALOG,
  options = {}
) {
  const scalesConfig = catalog.scales || CONTENT_CATALOG.scales;
  const resolvedScaleId = activeScaleId || scalesConfig.defaultScaleId || 'enterprise';
  const activeScale =
    scalesConfig.items.find((s) => s.id === resolvedScaleId) || scalesConfig.items[0];
  const solvency = activeScale.solvencyProfile;
  const labels =
    scalesConfig.solvencyMetricsLabels || CONTENT_CATALOG.scales.solvencyMetricsLabels;
  const expandCompact = options.compactMobile !== true;

  const buttonsHtml = scalesConfig.items
    .map((scale) => {
      const isSelected = scale.id === resolvedScaleId;
      return `
        <button
          type="button"
          class="scale-toggle__btn ${isSelected ? 'scale-toggle__btn--selected' : ''}"
          data-action="select-scale"
          data-scale-id="${escapeHtml(scale.id)}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
        >
          <span class="scale-toggle__top">
            <span class="scale-toggle__icon" aria-hidden="true">${getIconSvg(scale.icon)}</span>
            <span class="scale-toggle__badge">${escapeHtml(scale.badge)}</span>
          </span>
          <strong class="scale-toggle__label">${escapeHtml(scale.label)}</strong>
          <span class="scale-toggle__desc">${escapeHtml(scale.description)}</span>
        </button>
      `;
    })
    .join('');

  const solvencyCardHtml = solvency
    ? `
      <div
        class="solvency-card solvency-card--${escapeHtml(solvency.tone)}"
        data-solvency-card="${escapeHtml(activeScale.id)}"
        data-solvency-tone="${escapeHtml(solvency.tone)}"
      >
        <div class="solvency-card__header">
          <div class="solvency-card__title-wrap">
            <span class="solvency-card__icon" aria-hidden="true">${getIconSvg(activeScale.icon)}</span>
            <div>
              <h4 class="solvency-card__title">${escapeHtml(scalesConfig.solvencyCardTitle || '')}</h4>
              <span class="solvency-card__status solvency-card__status--${escapeHtml(solvency.tone)}">${escapeHtml(solvency.statusBadge)}</span>
            </div>
          </div>
          <span class="delta-badge delta-badge--${escapeHtml(solvency.deltaTone)}" data-scale-delta-badge>
            ${escapeHtml(solvency.deltaBadgeText)}
          </span>
        </div>
        <div class="solvency-card__quick-kpis">
          <span class="solvency-card__quick-kpi"><strong>${escapeHtml(labels.seasonalReserve)}:</strong> ${escapeHtml(solvency.seasonalReserve)}</span>
          <span class="solvency-card__quick-kpi"><strong>${escapeHtml(labels.riskCeiling)}:</strong> ${escapeHtml(solvency.riskCeiling)}</span>
        </div>
        <details
          class="compact-disclosure solvency-card__disclosure"
          data-compact-disclosure="solvency"
        >
          <summary class="compact-disclosure__summary">
            <span>عرض تفاصيل الملاءة والقدرة التحملية للأزمات</span>
          </summary>
          <dl class="solvency-card__grid">
            <div class="solvency-metric">
              <dt class="solvency-metric__label">${escapeHtml(labels.seasonalReserve)}</dt>
              <dd class="solvency-metric__value">${escapeHtml(solvency.seasonalReserve)}</dd>
            </div>
            <div class="solvency-metric">
              <dt class="solvency-metric__label">${escapeHtml(labels.failureAbsorption)}</dt>
              <dd class="solvency-metric__value">${escapeHtml(solvency.failureAbsorption)}</dd>
            </div>
            <div class="solvency-metric">
              <dt class="solvency-metric__label">${escapeHtml(labels.riskCeiling)}</dt>
              <dd class="solvency-metric__value">${escapeHtml(solvency.riskCeiling)}</dd>
            </div>
            <div class="solvency-metric">
              <dt class="solvency-metric__label">${escapeHtml(labels.liquidityImpact)}</dt>
              <dd class="solvency-metric__value">${escapeHtml(solvency.liquidityImpact)}</dd>
            </div>
          </dl>
        </details>
      </div>
    `
    : '';

  return `
    <div class="sim-step scale-toggle" data-sim-step="scale" role="group" aria-labelledby="sim-scale-title">
      <div class="scale-toggle__header">
        <h3 id="sim-scale-title" class="sim-step__title">${escapeHtml(scalesConfig.stepLabel)}</h3>
        <p class="scale-toggle__hint">${escapeHtml(scalesConfig.stepHint)}</p>
      </div>
      <div class="scale-toggle__grid">
        ${buttonsHtml}
      </div>
      ${solvencyCardHtml}
    </div>
  `;
}

/** يبني لوحة المؤشرات الحية الرباعية (4 Live Telemetry Meters) بشريط امتلاء بصري واضح وعلامة حد الأمان 70% وشرح ومثال لكل مؤشر. */
export function renderTelemetryPanelHtml(
  meters,
  catalog = CONTENT_CATALOG,
  idPrefix = 'sim',
  options = {}
) {
  const metersConfig = catalog.telemetryMeters || CONTENT_CATALOG.telemetryMeters;
  if (!Array.isArray(meters) || meters.length === 0) return '';
  const pulseActive = Boolean(options.pulseActive);
  const actionReason = options.lastActionReason || '';
  const defaultThreshold = metersConfig.safetyThreshold ?? 70;
  const explainerToggleLabel =
    metersConfig.explainerToggleLabel || 'ما هذا المؤشر؟ ومثال عليه';
  const measuresHeading = metersConfig.measuresHeading || 'ماذا يقيس هذا المؤشر؟';
  const exampleHeading =
    metersConfig.exampleHeading || 'مثال ميداني من قطاع الحج والعمرة:';

  const itemsHtml = meters
    .map((meter) => {
      const labelId = `${escapeHtml(idPrefix)}-meter-label-${escapeHtml(meter.id)}`;
      const delta = Number(meter.delta) || 0;
      const deltaText = meter.deltaText || (delta > 0 ? `+${delta}%` : `${delta}%`);
      const deltaTone =
        meter.deltaTone || (delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral');
      const pulseClass =
        pulseActive && delta !== 0 ? `telemetry-meter--pulse-${escapeHtml(deltaTone)}` : '';
      const threshold = Number(meter.safetyThreshold ?? defaultThreshold);
      const statusLabel =
        meter.statusLabel || metersConfig.statusLabels?.[meter.tone] || '';
      const thresholdLabel =
        meter.safetyThresholdLabel || `حد الأمان التشغيلي: ${threshold}%`;
      const detailFallback = metersConfig.detailsById?.[meter.id] || {};
      const whatItMeasures = meter.whatItMeasures || detailFallback.whatItMeasures || '';
      const hajjFieldExample =
        meter.hajjFieldExample || detailFallback.hajjFieldExample || '';
      const clampedValue = Math.max(0, Math.min(100, Number(meter.value) || 0));
      const dashOffset = Math.max(0, Math.min(100, 100 - clampedValue));
      const prevDashOffset = Math.max(
        0,
        Math.min(100, 100 - Number(meter.prevValue ?? clampedValue))
      );
      const litSegments = Number(
        meter.litSegments ?? Math.round(clampedValue / 10)
      );
      const pillSegmentsHtml = Array.from({ length: 10 }, (_, segIdx) => {
        const isLit = segIdx < litSegments;
        return `<span class="pill-segment pill-segment--${escapeHtml(meter.tone)} ${isLit ? 'lit' : ''}" data-seg-index="${segIdx + 1}"></span>`;
      }).join('');

      return `
        <li
          class="telemetry-meter telemetry-meter--${escapeHtml(meter.tone)} ${pulseClass}"
          data-telemetry-meter="${escapeHtml(meter.id)}"
          data-meter-tone="${escapeHtml(meter.tone)}"
          data-meter-delta="${escapeHtml(String(delta))}"
        >
          <div class="telemetry-meter__header">
            <span class="telemetry-meter__title-wrap">
              <span class="telemetry-meter__icon" aria-hidden="true">${getIconSvg(meter.icon)}</span>
              <strong id="${labelId}" class="telemetry-meter__label">${escapeHtml(meter.label)}</strong>
            </span>
            <span class="telemetry-meter__numbers">
              ${
                statusLabel
                  ? `<span class="telemetry-meter__status telemetry-meter__status--${escapeHtml(meter.tone)}" data-meter-status="${escapeHtml(meter.id)}">${escapeHtml(statusLabel)}</span>`
                  : ''
              }
              <span
                class="delta-badge delta-badge--${escapeHtml(deltaTone)}"
                data-meter-delta-badge="${escapeHtml(meter.id)}"
              >${escapeHtml(deltaText)}</span>
              <span
                class="telemetry-meter__value"
                data-meter-value="${escapeHtml(String(clampedValue))}"
                data-meter-prev="${escapeHtml(String(meter.prevValue ?? clampedValue))}"
              >${escapeHtml(String(clampedValue))}%</span>
            </span>
          </div>

          <div class="telemetry-meter__visual-row">
            <div class="telemetry-arc-wrap" aria-hidden="true">
              <svg class="arc-svg" viewBox="0 0 120 70" width="92" height="54" focusable="false">
                <path class="arc-track" d="M 10 60 A 50 50 0 0 1 110 60" pathLength="100" />
                <path
                  class="arc-fill arc-fill--${escapeHtml(meter.tone)}"
                  d="M 10 60 A 50 50 0 0 1 110 60"
                  pathLength="100"
                  style="stroke-dashoffset: ${escapeHtml(String(dashOffset))};"
                  data-arc-fill="${escapeHtml(meter.id)}"
                  data-arc-target="${escapeHtml(String(dashOffset))}"
                  data-arc-prev="${escapeHtml(String(prevDashOffset))}"
                />
              </svg>
              <span class="telemetry-arc__threshold-badge">${escapeHtml(String(threshold))}%</span>
            </div>

            <div
              class="telemetry-gauge"
              role="meter"
              aria-labelledby="${labelId}"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${escapeHtml(String(clampedValue))}"
            >
              <div class="pill-meter" aria-hidden="true" data-pill-meter="${escapeHtml(meter.id)}">
                ${pillSegmentsHtml}
              </div>
              <div class="telemetry-gauge__track">
                <div
                  class="telemetry-gauge__fill telemetry-gauge__fill--${escapeHtml(meter.tone)}"
                  style="inline-size: ${escapeHtml(String(clampedValue))}%;"
                  data-meter-fill-target="${escapeHtml(String(clampedValue))}"
                  data-meter-fill-prev="${escapeHtml(String(meter.prevValue ?? clampedValue))}"
                ></div>
                <div
                  class="telemetry-gauge__threshold"
                  style="inset-inline-start: ${escapeHtml(String(threshold))}%;"
                  data-safety-threshold="${escapeHtml(String(threshold))}"
                  title="${escapeHtml(thresholdLabel)}"
                >
                  <span class="telemetry-gauge__threshold-line" aria-hidden="true"></span>
                  <span class="telemetry-gauge__threshold-tag">${escapeHtml(String(threshold))}%</span>
                </div>
              </div>
              <div class="telemetry-gauge__scale" aria-hidden="true">
                <span>0%</span>
                <span>${escapeHtml(thresholdLabel)}</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <p class="telemetry-meter__desc">${escapeHtml(meter.statusText)}</p>

          <details
            class="compact-disclosure telemetry-meter__explainer"
            data-meter-explainer="${escapeHtml(meter.id)}"
          >
            <summary class="compact-disclosure__summary telemetry-meter__explainer-toggle">
              <span>${escapeHtml(explainerToggleLabel)}</span>
            </summary>
            <div class="telemetry-meter__explainer-body">
              <p><strong>${escapeHtml(measuresHeading)}</strong> ${escapeHtml(whatItMeasures)}</p>
              <p><strong>${escapeHtml(exampleHeading)}</strong> ${escapeHtml(hajjFieldExample)}</p>
            </div>
          </details>
        </li>
      `;
    })
    .join('');

  const reasonBannerHtml = actionReason
    ? `<p class="telemetry-panel__reason" data-telemetry-reason>${escapeHtml(actionReason)}</p>`
    : '';

  return `
    <section
      class="telemetry-panel"
      data-telemetry-panel
      aria-labelledby="${escapeHtml(idPrefix)}-telemetry-title"
    >
      <div class="telemetry-panel__header">
        <div class="telemetry-panel__title-row">
          <h3 id="${escapeHtml(idPrefix)}-telemetry-title" class="telemetry-panel__title">${escapeHtml(metersConfig.title)}</h3>
          ${reasonBannerHtml}
        </div>
        <p class="telemetry-panel__subtitle">${escapeHtml(metersConfig.subtitle)}</p>
      </div>
      <ul class="telemetry-grid" role="list" aria-label="${escapeHtml(metersConfig.title)}">
        ${itemsHtml}
      </ul>
      <aside class="telemetry-callout" aria-label="${escapeHtml(metersConfig.employeeMemoryCalloutTitle)}">
        <span class="telemetry-callout__icon" aria-hidden="true">${getIconSvg('user-alert')}</span>
        <div class="telemetry-callout__content">
          <strong class="telemetry-callout__title">${escapeHtml(metersConfig.employeeMemoryCalloutTitle)}</strong>
          <p class="telemetry-callout__text">${escapeHtml(metersConfig.employeeMemoryCalloutBody)}</p>
        </div>
      </aside>
    </section>
  `;
}

/** يبني الفصول الزمنية الثلاثة وتأثير القرار المتأخر (3-Phase Delayed Consequence Timeline). */
export function renderConsequenceTimelineHtml(phases, catalog = CONTENT_CATALOG, idPrefix = 'sim') {
  if (!Array.isArray(phases) || phases.length === 0) return '';
  const timelineConfig =
    catalog.consequenceTimeline || CONTENT_CATALOG.consequenceTimeline;

  const phasesHtml = phases
    .map(
      (phase, idx) => `
        <li class="timeline-phase timeline-phase--${escapeHtml(phase.tone)}" data-timeline-phase="${escapeHtml(phase.id)}" data-phase-index="${idx + 1}">
          <div class="timeline-phase__header">
            <span class="timeline-phase__step">
              <span class="timeline-phase__icon" aria-hidden="true">${getIconSvg('clock')}</span>
              <span>${escapeHtml(phase.stepNumber)}</span>
            </span>
            <span class="timeline-phase__timeframe">${escapeHtml(phase.timeframe)}</span>
          </div>
          <h5 class="timeline-phase__title">${escapeHtml(phase.title)}</h5>
          <p class="timeline-phase__text">${escapeHtml(phase.narrative)}</p>
          ${
            phase.scaleFateTitle
              ? `<p class="timeline-phase__fate"><strong>الحصيلة بحسب حجم المنشأة:</strong> ${escapeHtml(phase.scaleFateTitle)}</p>`
              : ''
          }
        </li>
      `
    )
    .join('');

  return `
    <section class="consequence-timeline" data-result-section="timeline" data-consequence-timeline aria-labelledby="${escapeHtml(idPrefix)}-timeline-title">
      <p class="eyebrow">${escapeHtml(timelineConfig.eyebrow)}</p>
      <h4 id="${escapeHtml(idPrefix)}-timeline-title" class="consequence-timeline__title">${escapeHtml(timelineConfig.title)}</h4>
      <p class="consequence-timeline__subtitle">${escapeHtml(timelineConfig.subtitle)}</p>
      <ol class="timeline-grid" role="list" aria-label="${escapeHtml(timelineConfig.title)}">
        ${phasesHtml}
      </ol>
    </section>
  `;
}

/** يبني بطاقة «شاهد ميداني من المعرض» المدمجة داخل نتيجة المحاكي والمرتبطة بنافذة التكبير. */
export function renderFieldEvidenceCardHtml(insightItem, catalog = CONTENT_CATALOG, idPrefix = 'sim') {
  if (!insightItem) return '';
  const execConfig =
    catalog.executiveDiagnosis || CONTENT_CATALOG.executiveDiagnosis;
  const insightsConfig = catalog.insights || CONTENT_CATALOG.insights;
  const { src, width, height } = resolveInsightMedia(insightItem, insightsConfig, false);

  return `
    <section class="field-evidence" data-result-section="field-evidence" data-field-evidence="${escapeHtml(insightItem.id)}" aria-labelledby="${escapeHtml(idPrefix)}-evidence-title">
      <div class="field-evidence__media">
        <img
          class="field-evidence__img"
          src="${escapeHtml(src)}"
          alt="${escapeHtml(insightItem.alt || insightItem.title)}"
          width="${width}"
          height="${height}"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div class="field-evidence__body">
        <span class="field-evidence__eyebrow">
          <span>${escapeHtml(execConfig.fieldEvidenceEyebrow)}</span>
          <span class="field-evidence__tag">${escapeHtml(insightItem.tag)}</span>
        </span>
        <h4 id="${escapeHtml(idPrefix)}-evidence-title" class="field-evidence__title">${escapeHtml(insightItem.title)}</h4>
        <p class="field-evidence__commentary">${escapeHtml(insightItem.commentary)}</p>
        <button
          type="button"
          class="btn btn--secondary field-evidence__btn"
          data-action="open-insight"
          data-insight-id="${escapeHtml(insightItem.id)}"
        >
          <span class="btn__icon" aria-hidden="true">${getIconSvg('zoom')}</span>
          <span>${escapeHtml(execConfig.fieldEvidenceCtaLabel)}</span>
        </button>
      </div>
    </section>
  `;
}

/** يبني قسم دراسات الحالات الواقعية (Real-World Case Studies — من نجح ومن فشل) مع الروابط الموثقة. */
export function renderCaseStudiesLabHtml(
  activeFilter = 'all',
  catalog = CONTENT_CATALOG,
  idPrefix = 'sim'
) {
  const casesConfig = catalog.caseStudies || CONTENT_CATALOG.caseStudies;
  const filteredItems = getCaseStudies(activeFilter, catalog);
  const sourceLinkLabel =
    casesConfig.sourceLinkLabel || 'استعرض المصدر الموثق لدراسة الحالة ↗';

  const filterButtonsHtml = casesConfig.filters
    .map((f) => {
      const isSelected = f.id === activeFilter;
      return `
        <button
          type="button"
          class="case-lab__filter-btn ${isSelected ? 'case-lab__filter-btn--active' : ''}"
          data-action="filter-cases"
          data-case-filter="${escapeHtml(f.id)}"
          aria-pressed="${isSelected ? 'true' : 'false'}"
        >
          ${escapeHtml(f.label)}
        </button>
      `;
    })
    .join('');

  const cardsHtml = filteredItems
    .map((item) => {
      const isFailure = item.category === 'failure';
      const badgeLabel = isFailure
        ? casesConfig.categoryLabels.failure
        : casesConfig.categoryLabels.success;
      const badgeIcon = isFailure ? 'shield-alert' : 'award';
      const sourceLinkHtml = item.sourceUrl
        ? `
          <div class="case-card__footer">
            <a
              class="btn btn--secondary case-card__source-link"
              href="${escapeHtml(item.sourceUrl)}"
              target="_blank"
              rel="noopener noreferrer"
              data-case-source="${escapeHtml(item.id)}"
            >
              <span class="btn__icon" aria-hidden="true">${getIconSvg('external')}</span>
              <span>${escapeHtml(sourceLinkLabel)}</span>
              <span class="visually-hidden"> (يُفتح في نافذة جديدة)</span>
            </a>
          </div>
        `
        : '';

      return `
        <li class="case-card case-card--${escapeHtml(item.category)}" data-case-id="${escapeHtml(item.id)}" data-case-category="${escapeHtml(item.category)}">
          <div class="case-card__top">
            <span class="case-card__badge case-card__badge--${escapeHtml(item.category)}">
              <span class="case-card__badge-icon" aria-hidden="true">${getIconSvg(badgeIcon)}</span>
              <span>${escapeHtml(badgeLabel)}</span>
            </span>
            <span class="case-card__domain">${escapeHtml(item.domain)}</span>
          </div>
          <h5 class="case-card__company"><bdi dir="ltr">${escapeHtml(item.company)}</bdi></h5>
          <p class="case-card__metric">${escapeHtml(item.headlineMetric)}</p>
          ${
            item.decisionPoint || item.causalRule
              ? `
                <div class="case-card__diagnostics">
                  ${item.decisionPoint ? `<p class="case-card__decision"><strong>نقطة القرار:</strong> ${escapeHtml(item.decisionPoint)}</p>` : ''}
                  ${item.causalRule ? `<p class="case-card__causal"><strong>القاعدة السببية:</strong> ${escapeHtml(item.causalRule)}</p>` : ''}
                </div>
              `
              : ''
          }
          <p class="case-card__summary">${escapeHtml(item.summary)}</p>
          <p class="case-card__lesson"><strong>الدرس التأسيسي:</strong> ${escapeHtml(item.governanceLesson)}</p>
          ${sourceLinkHtml}
        </li>
      `;
    })
    .join('');

  return `
    <section class="case-lab" data-result-section="case-studies" data-case-studies-lab aria-labelledby="${escapeHtml(idPrefix)}-case-lab-title">
      <div class="case-lab__header">
        <p class="eyebrow">${escapeHtml(casesConfig.eyebrow)}</p>
        <h4 id="${escapeHtml(idPrefix)}-case-lab-title" class="case-lab__title">${escapeHtml(casesConfig.title)}</h4>
        <p class="case-lab__subtitle">${escapeHtml(casesConfig.subtitle)}</p>
      </div>
      <div class="case-lab__filters" role="group" aria-label="تصفية دراسات الحالات الواقعية">
        ${filterButtonsHtml}
      </div>
      <ul class="case-lab__grid" role="list" aria-label="${escapeHtml(casesConfig.title)}">
        ${cardsHtml}
      </ul>
    </section>
  `;
}

/** يبني بطاقة «الفكرة العامة والتشخيص التنفيذي لمنشأتك» مع زر النسخ لـ LinkedIn وزر الاستشارة. */
export function renderExecutiveDiagnosisCardHtml(
  diagnosis,
  catalog = CONTENT_CATALOG,
  options = {}
) {
  if (!diagnosis) return '';
  const execConfig =
    catalog.executiveDiagnosis || CONTENT_CATALOG.executiveDiagnosis;
  const copied = Boolean(options.copiedDiagnosis);
  const idPrefix = options.idPrefix || 'sim';
  const copyBtnText = copied
    ? execConfig.copiedButtonLabel
    : execConfig.copyButtonLabel;

  return `
    <section
      class="executive-diagnosis executive-diagnosis--${escapeHtml(diagnosis.tone)}"
      data-result-section="executive-diagnosis"
      data-executive-diagnosis
      data-diagnosis-scale="${escapeHtml(diagnosis.scaleId)}"
      data-diagnosis-tone="${escapeHtml(diagnosis.tone)}"
      aria-labelledby="${escapeHtml(idPrefix)}-diagnosis-title"
    >
      <div class="executive-diagnosis__header">
        <div>
          <p class="eyebrow">${escapeHtml(execConfig.eyebrow)}</p>
          <h4 id="${escapeHtml(idPrefix)}-diagnosis-title" class="executive-diagnosis__title">${escapeHtml(execConfig.title)}</h4>
          <p class="executive-diagnosis__subtitle">${escapeHtml(execConfig.subtitle)}</p>
        </div>
        <div class="executive-diagnosis__meta">
          <span class="executive-diagnosis__chip">${escapeHtml(diagnosis.sectorName)}</span>
          <span class="executive-diagnosis__chip executive-diagnosis__chip--scale">${escapeHtml(diagnosis.scaleShortLabel)}</span>
          ${
            diagnosis.scoreBadge
              ? `<span class="executive-diagnosis__chip executive-diagnosis__chip--tone">${escapeHtml(diagnosis.scoreBadge)}</span>`
              : ''
          }
        </div>
      </div>

      <div class="executive-diagnosis__fate">
        <strong class="executive-diagnosis__fate-title">${escapeHtml(diagnosis.fateTitle)}</strong>
        <p class="executive-diagnosis__fate-summary">${escapeHtml(diagnosis.fateSummary)}</p>
      </div>

      <div class="executive-diagnosis__pillars">
        <article class="diagnosis-pillar" data-diagnosis-pillar="financial">
          <h5 class="diagnosis-pillar__title">
            <span class="diagnosis-pillar__icon" aria-hidden="true">${getIconSvg('chart')}</span>
            <span>${escapeHtml(execConfig.pillars.financialLabel)}</span>
          </h5>
          <p class="diagnosis-pillar__text">${escapeHtml(diagnosis.financialImpact)}</p>
        </article>

        <article class="diagnosis-pillar" data-diagnosis-pillar="employee-memory">
          <h5 class="diagnosis-pillar__title">
            <span class="diagnosis-pillar__icon" aria-hidden="true">${getIconSvg('users')}</span>
            <span>${escapeHtml(execConfig.pillars.employeeMemoryLabel)}</span>
          </h5>
          <p class="diagnosis-pillar__text">${escapeHtml(diagnosis.employeeMemoryImpact)}</p>
        </article>

        <article class="diagnosis-pillar" data-diagnosis-pillar="strategic-lesson">
          <h5 class="diagnosis-pillar__title">
            <span class="diagnosis-pillar__icon" aria-hidden="true">${getIconSvg('award')}</span>
            <span>${escapeHtml(execConfig.pillars.strategicLessonLabel)}</span>
          </h5>
          <p class="diagnosis-pillar__text">${escapeHtml(diagnosis.strategicLesson)}</p>
        </article>
      </div>

      <div class="executive-diagnosis__actions">
        <a
          class="btn btn--primary executive-diagnosis__cta"
          href="#${escapeHtml(execConfig.consultationCtaTargetId)}"
          data-scroll-target="${escapeHtml(execConfig.consultationCtaTargetId)}"
          data-diagnosis-cta="contact"
        >
          <span class="btn__icon" aria-hidden="true">${getIconSvg('briefcase')}</span>
          <span>${escapeHtml(execConfig.consultationCtaLabel)}</span>
        </a>
        <button
          type="button"
          class="btn btn--secondary executive-diagnosis__share ${copied ? 'executive-diagnosis__share--copied' : ''}"
          data-action="copy-diagnosis"
          data-copied="${copied ? 'true' : 'false'}"
        >
          <span class="btn__icon" aria-hidden="true">${getIconSvg(copied ? 'check' : 'copy')}</span>
          <span>${escapeHtml(copyBtnText)}</span>
        </button>
      </div>
    </section>
  `;
}

/** يبني HTML نتيجة التقييم الاستراتيجي داخل منطقة aria-live في الرؤية المعمقة بالترتيب المعتمد. */
export function renderBuilderResultHtml(evaluation, catalog = CONTENT_CATALOG, options = {}) {
  if (!evaluation) return '';
  const simulatorUi = catalog.simulatorUi;
  const builderUi = simulatorUi.builder;
  const {
    score,
    maxScore,
    tier,
    sectorId,
    sectorName,
    scaleId = 'enterprise',
    chain = [],
    missed = [],
    warnings = [],
  } = evaluation;
  const activeCaseFilter = options.caseFilter || 'all';
  const copiedDiagnosis = Boolean(options.copiedDiagnosis);
  const embeddedInSplitLayout = Boolean(options.embeddedInSplitLayout);
  const embeddedInBentoCockpit = Boolean(options.embeddedInBentoCockpit);
  const omitTelemetryAndCases = embeddedInSplitLayout || embeddedInBentoCockpit;
  const minFoundationBeforeAi = catalog.scoring?.minFoundationBeforeAi ?? 2;
  const aiOnSandCount = Number(evaluation.aiOnSandCount || 0);
  const foundationCount = Number(evaluation.foundationCount || 0);
  const isCleanPlan =
    warnings.length === 0 &&
    aiOnSandCount === 0 &&
    foundationCount >= minFoundationBeforeAi &&
    chain.every((link) => link.polarity === 'positive');

  const missedSectionHeading = isCleanPlan
    ? builderUi.expansionTitle || builderUi.missedTitle
    : builderUi.missedTitle;
  const missedSectionIntro = isCleanPlan
    ? builderUi.expansionSubtitle || builderUi.missedSubtitle
    : builderUi.missedSubtitle;

  const telemetry =
    evaluation.telemetry ||
    computeTelemetry({ scaleId, mode: 'builder', evaluation }, catalog);
  const timeline =
    evaluation.timeline ||
    buildConsequenceTimeline(
      { tone: tier.tone, scaleId, sectorId: sectorId || 'shuttle' },
      catalog
    );
  const fieldEvidence =
    evaluation.fieldEvidence ||
    (sectorId ? resolveFieldEvidence(sectorId, catalog) : null);
  const diagnosis =
    evaluation.diagnosis ||
    (sectorId
      ? buildExecutiveDiagnosis(
          { sectorId, scaleId, mode: 'builder', evaluation },
          catalog
        )
      : null);

  const regulatoryLabels = {
    eyebrow: simulatorUi.regulatoryRefEyebrow,
    externalHint: simulatorUi.regulatoryRefExternalHint,
  };

  const dominoItemsHtml = chain
    .map((link) =>
      renderDominoCardHtml(link, {
        textField: 'expert',
        headingTag: 'h6',
        showPolarityBadge: true,
        polarityLabels: {
          positive: builderUi.positiveLinkBadge,
          negative: builderUi.negativeLinkBadge,
        },
        regulatoryLabels,
      })
    )
    .join('');

  const missedContentHtml =
    missed.length > 0
      ? `<ul class="missed-list" role="list" aria-label="${escapeHtml(missedSectionHeading)}">
          ${missed
            .map(
              (item) => `
                <li class="missed-card ${isCleanPlan ? 'missed-card--expansion' : ''} missed-card--${escapeHtml(item.kind || 'axis')}" data-missed-id="${escapeHtml(item.id)}">
                  <div class="missed-card__top">
                    <span class="missed-card__icon" aria-hidden="true">${getIconSvg(item.icon)}</span>
                    <span class="missed-card__category">${escapeHtml(item.axisName)}</span>
                  </div>
                  <h6 class="missed-card__title">${escapeHtml(item.title)}</h6>
                  <p class="missed-card__text">${escapeHtml(item.expert || item.simple)}</p>
                </li>
              `
            )
            .join('')}
        </ul>`
      : `<p class="builder-result__empty-note">${escapeHtml(builderUi.missedAllCoveredNote)}</p>`;

  const warningsSectionHtml =
    warnings.length > 0
      ? `
        <section class="builder-result__section builder-warnings" data-result-section="warnings" aria-labelledby="builder-warnings-title">
          <h5 id="builder-warnings-title" class="builder-result__section-title builder-warnings__title">
            <span class="builder-warnings__icon" aria-hidden="true">${getIconSvg('shield-alert')}</span>
            <span>${escapeHtml(builderUi.warningsTitle)}</span>
          </h5>
          <p class="builder-result__section-intro">${escapeHtml(builderUi.warningsSubtitle)}</p>
          <ul class="warning-list" role="list" aria-label="${escapeHtml(builderUi.warningsTitle)}">
            ${warnings
              .map(
                (w) => `
                  <li class="warning-card" data-warning-block-id="${escapeHtml(w.blockId)}">
                    <div class="warning-card__header">
                      <span class="warning-card__icon" aria-hidden="true">${getIconSvg(w.icon)}</span>
                      <h6 class="warning-card__title">${escapeHtml(w.title)}</h6>
                    </div>
                    <p class="warning-card__text">${escapeHtml(w.description)}</p>
                  </li>
                `
              )
              .join('')}
          </ul>
        </section>
      `
      : '';

  const telemetryHtml = omitTelemetryAndCases
    ? ''
    : renderTelemetryPanelHtml(telemetry, catalog, 'builder-eval');
  const timelineHtml = embeddedInBentoCockpit
    ? ''
    : renderConsequenceTimelineHtml(timeline, catalog, 'builder-eval');
  const fieldEvidenceHtml = embeddedInBentoCockpit
    ? ''
    : renderFieldEvidenceCardHtml(
        fieldEvidence,
        catalog,
        'builder-eval'
      );
  const caseLabHtml = omitTelemetryAndCases
    ? ''
    : renderCaseStudiesLabHtml(activeCaseFilter, catalog, 'builder-eval');
  const diagnosisHtml = embeddedInBentoCockpit
    ? ''
    : renderExecutiveDiagnosisCardHtml(diagnosis, catalog, {
        copiedDiagnosis,
        idPrefix: 'builder-eval',
      });

  return `
    <div class="builder-result builder-result--${escapeHtml(tier.tone)}" data-tier-id="${escapeHtml(tier.id)}" data-scale-id="${escapeHtml(scaleId)}" ${isCleanPlan ? 'data-plan-clean="true"' : ''}>
      <div class="builder-result__header" data-result-section="score">
        <div>
          <h4 id="builder-result-title" class="builder-result__eyebrow" tabindex="-1">${escapeHtml(builderUi.resultTitle)} — ${escapeHtml(sectorName)}</h4>
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

      <section class="builder-result__section" data-result-section="chain" aria-labelledby="builder-chain-title">
        <h5 id="builder-chain-title" class="builder-result__section-title">${escapeHtml(builderUi.chainTitle)}</h5>
        <p class="builder-result__section-intro">${escapeHtml(builderUi.chainSubtitle)}</p>
        <ol class="domino-chain builder-domino-chain" role="list" aria-label="${escapeHtml(builderUi.chainTitle)}">
          ${dominoItemsHtml}
        </ol>
      </section>

      <section
        class="builder-result__section ${isCleanPlan ? 'builder-result__section--expansion' : ''}"
        data-result-section="missed"
        ${isCleanPlan ? 'data-plan-clean="true"' : ''}
        aria-labelledby="builder-missed-title"
      >
        <h5 id="builder-missed-title" class="builder-result__section-title">${escapeHtml(missedSectionHeading)}</h5>
        <p class="builder-result__section-intro">${escapeHtml(missedSectionIntro)}</p>
        ${missedContentHtml}
      </section>

      ${warningsSectionHtml}

      ${telemetryHtml}
      ${timelineHtml}
      ${fieldEvidenceHtml}
      ${caseLabHtml}
      ${diagnosisHtml}

      <p class="disclaimer sim-disclaimer" data-builder-disclaimer>
        ${escapeHtml(catalog.meta.disclaimer)}
      </p>

      <div class="builder-result__actions">
        <button type="button" class="btn btn--secondary" data-action="rebuild-plan">
          <span class="btn__icon" aria-hidden="true">${getIconSvg('refresh')}</span>
          <span>${escapeHtml(builderUi.rebuildLabel)}</span>
        </button>
      </div>
    </div>
  `;
}

/** يبني لوحة مختبر بناء الخطة التفاعلية (8 لبنات + 4 مراحل تنفيذية مع ردود فعل لحظية + زر الترتيب التلقائي + النتيجة). */
function renderBuilderPanelHtml(state, catalog, selectedSector, options = {}) {
  const builderUi = catalog.simulatorUi.builder;
  const includeResult = options.includeResult !== false;
  const expandCompact = options.compactMobile !== true;

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
  const stageLabels =
    builderUi.stageLabels || CONTENT_CATALOG.simulatorUi.builder.stageLabels;
  const analysis = analyzeInteractivePlan(selectedSector.id, plan, catalog);
  const reactionBySlot = new Map(
    analysis.slotReactions.map((r) => [r.slotIndex, r])
  );
  const starterGuide = builderUi.starterGuide || null;
  const blockHints = builderUi.blockHints || {};

  const starterGuideHtml = starterGuide
    ? `
      <section class="starter-guide" data-starter-guide aria-labelledby="starter-guide-title">
        <div class="starter-guide__header">
          <div class="starter-guide__intro">
            <h4 id="starter-guide-title" class="starter-guide__title">${escapeHtml(starterGuide.title)}</h4>
            <p class="starter-guide__lead">${escapeHtml(starterGuide.lead)}</p>
          </div>
          <button
            type="button"
            class="btn btn--primary starter-guide__cta"
            data-action="apply-reference-plan"
          >
            <span class="btn__icon" aria-hidden="true">${getIconSvg('spark')}</span>
            <span>${escapeHtml(starterGuide.applyReferenceBtnLabel)}</span>
          </button>
        </div>
        <details class="compact-disclosure starter-guide__scenarios-wrap" data-compact-disclosure="starter-guide">
          <summary class="compact-disclosure__summary">
            <span>قارن السيناريوهات الثلاثة للبداية (الآمنة مقابل المتسرعة)</span>
          </summary>
          <ul class="starter-guide__grid" role="list">
            ${(starterGuide.scenarios || [])
              .map(
                (sc) => `
                  <li class="starter-scenario starter-scenario--${escapeHtml(sc.tone)}" data-starter-scenario="${escapeHtml(sc.id)}">
                    <span class="starter-scenario__badge">${escapeHtml(sc.badge)}</span>
                    <strong class="starter-scenario__title">${escapeHtml(sc.title)}</strong>
                    <p class="starter-scenario__summary">${escapeHtml(sc.summary)}</p>
                  </li>
                `
              )
              .join('')}
          </ul>
        </details>
      </section>
    `
    : '';

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
      const hint = blockHints[block.id] || {};
      const hintsHtml =
        hint.recommendedStage || hint.earlyPlacementEffect
          ? `<span class="block-card__hints" data-block-hints="${escapeHtml(block.id)}">
              ${
                hint.recommendedStage
                  ? `<span class="block-card__hint-row"><strong>الموضع الموصى به:</strong> ${escapeHtml(hint.recommendedStage)}</span>`
                  : ''
              }
              ${
                hint.earlyPlacementEffect
                  ? `<span class="block-card__hint-row"><strong>أثر وضعها في البداية:</strong> ${escapeHtml(hint.earlyPlacementEffect)}</span>`
                  : ''
              }
            </span>`
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
            ${hintsHtml}
          </button>
        </li>
      `;
    })
    .join('');

  const slotsHtml = Array.from({ length: planSize }, (_, idx) => {
    const slotNumber = idx + 1;
    const stageLabel = stageLabels[idx] || `المرحلة ${slotNumber}`;
    const blockId = plan[idx];
    const block = blockId ? blockById.get(blockId) : null;
    const reaction = reactionBySlot.get(idx) || null;

    if (!block) {
      const stageHint = builderUi.stageHints?.[idx] || '';
      return `
        <li class="plan-slots__item" data-stage-slot="${slotNumber}">
          <div class="plan-slot plan-slot--empty" data-slot-index="${idx}">
            <span class="plan-slot__number" aria-hidden="true">${slotNumber}</span>
            <div class="plan-slot__stage-wrap">
              <strong class="plan-slot__stage-label">${escapeHtml(stageLabel)}</strong>
              <span class="plan-slot__empty-text">خانة ${slotNumber} — ${escapeHtml(builderUi.emptySlotHint)}</span>
              ${stageHint ? `<span class="plan-slot__stage-hint">${escapeHtml(stageHint)}</span>` : ''}
            </div>
          </div>
        </li>
      `;
    }

    const isFoundation = block.type === 'foundation';
    const typeLabel = isFoundation ? builderUi.foundationBadge : builderUi.aiBadge;
    const canMoveRight = idx > 0;
    const canMoveLeft = idx < plan.length - 1;

    const reactionHtml = reaction
      ? `
        <div
          class="slot-reaction slot-reaction--${escapeHtml(reaction.tone)}"
          data-slot-reaction="${idx}"
          data-reaction-tone="${escapeHtml(reaction.tone)}"
          ${reaction.isSandWarning ? 'data-instant-sand-warning="true"' : ''}
        >
          <div class="slot-reaction__top">
            <strong class="slot-reaction__title">
              <span class="slot-reaction__icon" aria-hidden="true">${getIconSvg(reaction.isSandWarning ? 'shield-alert' : 'check')}</span>
              <span>${escapeHtml(reaction.reactionTitle)}</span>
            </strong>
            <span class="delta-badge delta-badge--${escapeHtml(reaction.tone)}" data-slot-delta-badge="${idx}">
              ${escapeHtml(reaction.deltaBadge)}
            </span>
          </div>
          <p class="slot-reaction__text">${escapeHtml(reaction.reactionText)}</p>
        </div>
      `
      : '';

    return `
      <li class="plan-slots__item plan-slots__item--filled" data-stage-slot="${slotNumber}">
        <div class="plan-slot-card plan-slot-card--${escapeHtml(reaction?.tone || block.type)}">
          <div class="plan-slot__stage-header">
            <span class="plan-slot__stage-badge">${escapeHtml(stageLabel)}</span>
            <div class="plan-slot__controls" role="group" aria-label="تحريك أو إزالة لبنة ${escapeHtml(block.name)}">
              <button
                type="button"
                class="plan-slot__move-btn"
                data-action="move-block"
                data-slot-index="${idx}"
                data-direction="right"
                aria-label="${escapeHtml(builderUi.moveRightLabel || 'تحريك لليمين')}: ${escapeHtml(block.name)}"
                ${canMoveRight ? '' : 'disabled aria-disabled="true"'}
              >
                <span aria-hidden="true">→</span>
                <span>تقديم</span>
              </button>
              <button
                type="button"
                class="plan-slot__move-btn"
                data-action="move-block"
                data-slot-index="${idx}"
                data-direction="left"
                aria-label="${escapeHtml(builderUi.moveLeftLabel || 'تحريك لليسار')}: ${escapeHtml(block.name)}"
                ${canMoveLeft ? '' : 'disabled aria-disabled="true"'}
              >
                <span>تأخير</span>
                <span aria-hidden="true">←</span>
              </button>
            </div>
          </div>

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

          ${reactionHtml}
        </div>
      </li>
    `;
  }).join('');

  const instantSandAlertHtml =
    analysis.sandWarningsCount > 0
      ? `
        <div class="instant-sand-alert" role="status" data-instant-sand-banner>
          <div class="instant-sand-alert__content">
            <span class="instant-sand-alert__icon" aria-hidden="true">${getIconSvg('shield-alert')}</span>
            <div>
              <strong class="instant-sand-alert__title">${escapeHtml(builderUi.instantSandAlertTitle || 'تحذير فوري: ذكاء فوق الرمال!')}</strong>
              <p class="instant-sand-alert__text">${escapeHtml(builderUi.instantSandAlertBody || '')}</p>
            </div>
          </div>
          <button
            type="button"
            class="btn btn--primary instant-sand-alert__btn"
            data-action="auto-sort-plan"
          >
            <span class="btn__icon" aria-hidden="true">${getIconSvg('spark')}</span>
            <span>${escapeHtml(builderUi.autoSortLabel || 'رتب خطتي تلقائياً بالطريقة الصحيحة وقارن الفرق')}</span>
          </button>
        </div>
      `
      : plan.length >= 2 && analysis.canAutoSort
        ? `
          <div class="builder-autosort-bar">
            <button
              type="button"
              class="btn btn--secondary"
              data-action="auto-sort-plan"
            >
              <span class="btn__icon" aria-hidden="true">${getIconSvg('refresh')}</span>
              <span>${escapeHtml(builderUi.autoSortLabel || 'رتب خطتي تلقائياً بالطريقة الصحيحة وقارن الفرق')}</span>
            </button>
          </div>
        `
        : '';

  const autoSortedFeedbackHtml = state.autoSortMessage
    ? `<p class="builder-autosort-feedback" data-autosort-feedback>${escapeHtml(state.autoSortMessage)}</p>`
    : '';

  let hintText = builderUi.readyToEvaluateHint;
  if (!isComplete) {
    hintText =
      remaining === 1
        ? `${builderUi.missingSinglePrefix} لتكتمل الخانات الأربع قبل التقييم.`
        : `${builderUi.missingPluralPrefix} ${remaining} ${builderUi.missingPluralSuffix}`;
  }

  const standaloneResultHtml = includeResult
    ? `
      <div id="builder-result-live" class="builder-result-live" aria-live="polite">
        ${
          state.simulator === 'evaluated'
            ? renderBuilderResultHtml(state.evaluation, catalog, {
                caseFilter: state.caseFilter || 'all',
                copiedDiagnosis: Boolean(state.copiedDiagnosis),
              })
            : ''
        }
      </div>
    `
    : '';

  return `
    <div class="builder-workspace" data-builder-workspace>
      <div class="builder-header">
        <h3 id="builder-step-title" class="sim-step__title" tabindex="-1">${escapeHtml(builderUi.stepTitle)}</h3>
        <p class="builder-intro">${escapeHtml(builderUi.stepIntro)}</p>
      </div>

      ${starterGuideHtml}

      <div class="builder-pool">
        <h4 class="builder-subhead">${escapeHtml(builderUi.poolTitle)}</h4>
        <ul class="block-grid" role="list">
          ${poolHtml}
        </ul>
      </div>

      <div class="builder-plan">
        <div class="builder-plan__header">
          <h4 class="builder-subhead">${escapeHtml(builderUi.slotsTitle)}</h4>
          ${
            plan.length > 0
              ? `
                <button
                  type="button"
                  class="btn btn--secondary builder-autosort-top-btn"
                  data-action="auto-sort-plan"
                >
                  <span class="btn__icon" aria-hidden="true">${getIconSvg('spark')}</span>
                  <span>${escapeHtml(builderUi.autoSortLabel || 'رتب خطتي تلقائياً بالطريقة الصحيحة وقارن الفرق')}</span>
                </button>
              `
              : ''
          }
        </div>

        ${instantSandAlertHtml}
        ${autoSortedFeedbackHtml}

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

      ${standaloneResultHtml}
    </div>
  `;
}

/** يبني شريط المراحل الانتقالي أعلى المحاكي لتتبع التقدم بين الإعداد والقرار والتشخيص. */
export function renderStageProgressBarHtml(state = {}, catalog = CONTENT_CATALOG) {
  const barConfig =
    catalog.simulatorUi?.stageProgressBar ||
    CONTENT_CATALOG.simulatorUi.stageProgressBar;
  if (!barConfig || !Array.isArray(barConfig.stages)) return '';

  const activeMode = state.mode || 'quick';
  let activeIndex = 0;
  if (
    (activeMode === 'quick' && Boolean(state.path)) ||
    (activeMode === 'builder' && state.simulator === 'evaluated')
  ) {
    activeIndex = 2;
  } else if (Boolean(state.sectorId) || activeMode === 'builder') {
    activeIndex = 1;
  }

  const activeStageId = barConfig.stages[activeIndex]?.id || 'setup';

  const itemsHtml = barConfig.stages
    .map((stage, idx) => {
      const status =
        idx < activeIndex ? 'done' : idx === activeIndex ? 'active' : 'upcoming';
      return `
        <li
          class="sim-stage-bar__item sim-stage-bar__item--${status}"
          data-stage-id="${escapeHtml(stage.id)}"
          data-stage-status="${status}"
          ${status === 'active' ? 'aria-current="step"' : ''}
        >
          <span class="sim-stage-bar__num" aria-hidden="true">${status === 'done' ? '✓' : escapeHtml(stage.stepNumber)}</span>
          <span class="sim-stage-bar__text">
            <strong class="sim-stage-bar__label">${escapeHtml(stage.label)}</strong>
            <span class="sim-stage-bar__hint">${escapeHtml(stage.hint)}</span>
          </span>
        </li>
      `;
    })
    .join('');

  return `
    <nav
      class="sim-stage-bar"
      aria-label="${escapeHtml(barConfig.ariaLabel || 'مراحل المحاكي')}"
      data-stage-bar
      data-active-stage="${escapeHtml(activeStageId)}"
    >
      <ol class="sim-stage-bar__list" role="list">
        ${itemsHtml}
      </ol>
    </nav>
  `;
}

/** يبني قسم المنهجية الاستشارية والمصادر العلمية والتنظيمية الموثقة ببطاقات قابلة للفتح. */
export function renderMethodologySectionHtml(
  catalog = CONTENT_CATALOG,
  idPrefix = 'sim'
) {
  const methodology = catalog.methodology || CONTENT_CATALOG.methodology;
  if (!methodology || !Array.isArray(methodology.items) || methodology.items.length === 0) {
    return '';
  }

  const cardsHtml = methodology.items
    .map((item) => {
      const sourcesHtml = (item.sources || [])
        .map(
          (src) => `
            <li class="methodology-card__source-item">
              <a
                class="methodology-card__source-link"
                href="${escapeHtml(src.url)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class="methodology-card__source-icon" aria-hidden="true">${getIconSvg('external')}</span>
                <span>${escapeHtml(src.label)}</span>
                <span class="visually-hidden"> (يُفتح في نافذة جديدة)</span>
              </a>
            </li>
          `
        )
        .join('');

      return `
        <details
          class="compact-disclosure methodology-card"
          data-methodology-card="${escapeHtml(item.id)}"
        >
          <summary class="compact-disclosure__summary methodology-card__summary">
            <span class="methodology-card__summary-main">
              <span class="methodology-card__badge">${escapeHtml(item.badge)}</span>
              <span class="methodology-card__title">${escapeHtml(item.title)}</span>
              <span class="methodology-card__teaser">${escapeHtml(item.summary)}</span>
            </span>
          </summary>
          <div class="methodology-card__body">
            <p class="methodology-card__text">${escapeHtml(item.body)}</p>
            <ul class="methodology-card__sources" role="list" aria-label="المصادر الموثقة: ${escapeHtml(item.title)}">
              ${sourcesHtml}
            </ul>
          </div>
        </details>
      `;
    })
    .join('');

  const weights = Array.isArray(methodology.weights) ? methodology.weights : [];
  const weightsBarHtml =
    weights.length > 0
      ? `
        <div class="methodology-weights" data-methodology-weights>
          ${methodology.weightsTitle ? `<h4 class="methodology-weights__title">${escapeHtml(methodology.weightsTitle)}</h4>` : ''}
          <div class="weight-bar" role="list" aria-label="${escapeHtml(methodology.weightsTitle || 'أوزان نموذج التقييم')}">
            ${weights
              .map(
                (w) => `
                  <div
                    class="weight-bar__segment weight-bar__segment--${escapeHtml(w.id)}"
                    role="listitem"
                    style="flex-grow: ${escapeHtml(String(Number(w.weight) || 25))};"
                    data-weight-id="${escapeHtml(w.id)}"
                  >
                    <span class="weight-bar__value">${escapeHtml(w.weightLabel)}</span>
                    <span class="weight-bar__label">${escapeHtml(w.label)}</span>
                  </div>
                `
              )
              .join('')}
          </div>
        </div>
      `
      : '';

  return `
    <section
      class="methodology-section"
      id="${escapeHtml(idPrefix)}-methodology"
      data-methodology-section
      aria-labelledby="${escapeHtml(idPrefix)}-methodology-title"
    >
      <div class="methodology-section__header">
        <p class="eyebrow">${escapeHtml(methodology.eyebrow || '')}</p>
        <h3 id="${escapeHtml(idPrefix)}-methodology-title" class="methodology-section__title">
          ${escapeHtml(methodology.title)}
        </h3>
        <p class="methodology-section__intro">${escapeHtml(methodology.intro)}</p>
      </div>
      ${weightsBarHtml}
      <div class="methodology-grid">
        ${cardsHtml}
      </div>
    </section>
  `;
}

/**
 * يبني المحطة رقم 3 المستقلة والمنفصلة بالكامل («المنهجيات العلمية والشواهد العالمية والروابط الموثقة»)
 * وتقع مباشرة قبل محطة «ما رأيته في المعرض» وتضم 3 أقسام فرعية منظمة:
 * 1) تفكيك المنهجية العلمية وأوزان التقييم (30% | 25% | 25% | 20%) + البطاقات التفسيرية ومصادر Gartner وDAMA وMIT
 * 2) الروابط التنظيمية الرسمية الحية في المملكة (سدايا / NDMO / PDPL / DGP)
 * 3) شواهد ودراسات الحالات العالمية الخمس مع فلاتر النجاح/التعثر وأزرار المصادر المباشرة
 */
export function renderMethodologyStationHtml(
  activeFilter = 'all',
  catalog = CONTENT_CATALOG
) {
  const simulatorUi = catalog.simulatorUi || CONTENT_CATALOG.simulatorUi;
  const regulatoryRefs =
    catalog.regulatoryReferences || CONTENT_CATALOG.regulatoryReferences || [];
  const regulatoryLabels = {
    eyebrow: simulatorUi.regulatoryRefEyebrow,
    externalHint: simulatorUi.regulatoryRefExternalHint,
  };

  const methodologyPartHtml = renderMethodologySectionHtml(
    catalog,
    'station-methodology'
  );
  const regulatoryCardsHtml = regulatoryRefs
    .map((ref) => renderRegulatoryRefHtml(ref, regulatoryLabels))
    .join('');
  const caseLabPartHtml = renderCaseStudiesLabHtml(
    activeFilter,
    catalog,
    'station-methodology'
  );

  return `
    <div class="station-header">
      <span class="motto-crest-banner__station-pill">المحطة 03 · المرجعية العلمية والتنظيمية</span>
      <h2 id="methodology-station-title" class="section-title" tabindex="-1">المنهجيات العلمية والشواهد العالمية والروابط الموثقة</h2>
      <p class="lead">محطة مرجعية مستقلة تفكّك أوزان التقييم الاستشاري، وتوثّق الروابط الرسمية الحية في سدايا (NDMO / PDPL)، وتستعرض دراسات الحالات العالمية الخمس قبل الانتقال لمشاهدات المعرض.</p>
    </div>

    <div class="methodology-station-grid" data-methodology-station-grid>
      <div class="methodology-station__block" data-methodology-part="weights-and-science">
        ${methodologyPartHtml}
      </div>

      <section
        class="methodology-station__block regulatory-hub"
        data-methodology-part="regulatory-links"
        aria-labelledby="station-regulatory-title"
      >
        <div class="regulatory-hub__header">
          <p class="eyebrow">المرجعية الوطنية السيادية</p>
          <h3 id="station-regulatory-title" class="methodology-section__title">الروابط التنظيمية الرسمية الحية في المملكة (سدايا / NDMO / PDPL)</h3>
          <p class="methodology-section__intro">روابط رسمية مباشرة ومُتحقّق منها لبوابات الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا)، ومكتب إدارة البيانات الوطنية (NDMO)، والمنصة الوطنية لحوكمة البيانات (DGP):</p>
        </div>
        <div class="regulatory-hub__grid">
          ${regulatoryCardsHtml}
        </div>
      </section>

      <div class="methodology-station__block" data-methodology-part="global-cases">
        ${caseLabPartHtml}
      </div>
    </div>

    ${renderStationFooterNavHtml('methodology', catalog)}
  `;
}

/**
 * يبني درج المنهجية والشواهد الواقعية الأصلي (`<aside id="evidence-drawer" popover class="evidence-sheet">`)
 * باستخدام Popover API الأصلي في HTML دون أي مكتبات خارجية.
 */
export function renderEvidenceDrawerHtml(
  activeFilter = 'all',
  catalog = CONTENT_CATALOG,
  idPrefix = 'sim-drawer'
) {
  const simulatorUi = catalog.simulatorUi || CONTENT_CATALOG.simulatorUi;
  const methodologyHtml = renderMethodologySectionHtml(catalog, idPrefix);
  const caseLabHtml = renderCaseStudiesLabHtml(activeFilter, catalog, idPrefix);

  return `
    <aside
      id="evidence-drawer"
      popover
      class="evidence-sheet"
      data-evidence-drawer
      aria-labelledby="evidence-drawer-title"
    >
      <div class="evidence-sheet__header">
        <div class="evidence-sheet__heading-wrap">
          <p class="eyebrow">${escapeHtml(simulatorUi.evidenceDrawerEyebrow || 'الأساس العلمي')}</p>
          <h3 id="evidence-drawer-title" class="evidence-sheet__title">${escapeHtml(
            simulatorUi.evidenceDrawerTitle || 'مكتبة المنهجية والشواهد الواقعية'
          )}</h3>
          <p class="evidence-sheet__subtitle">${escapeHtml(simulatorUi.evidenceDrawerSubtitle || '')}</p>
        </div>
        <button
          type="button"
          class="btn btn--secondary evidence-sheet__close"
          popovertarget="evidence-drawer"
          popovertargetaction="hide"
          data-action="close-evidence-drawer"
          aria-label="إغلاق مكتبة المنهجية والشواهد"
        >
          <span class="btn__icon" aria-hidden="true">${getIconSvg('close')}</span>
          <span>إغلاق</span>
        </button>
      </div>
      <div class="evidence-sheet__body">
        ${methodologyHtml}
        ${caseLabHtml}
      </div>
    </aside>
  `;
}

/**
 * يبني الجولة التعريفية التفاعلية المتحركة (`onboarding-coach`) في أعلى المحاكي،
 * لتوضيح رحلة القرار في 3 خطوات مصوّرة دون حوائط نصية طويلة، مع زر التشغيل الحي التلقائي.
 */
export function renderOnboardingCoachHtml(state, catalog = CONTENT_CATALOG) {
  const ob =
    catalog.simulatorUi?.onboarding || CONTENT_CATALOG.simulatorUi.onboarding;
  if (!ob) return '';

  if (state.onboardingDismissed && !state.demoRunning) {
    return `
      <div class="onboarding-reopen-bar" data-onboarding-reopen>
        <button
          type="button"
          class="onboarding-reopen-btn"
          data-action="open-onboarding"
        >
          <span aria-hidden="true">✦</span>
          <span>إعادة عرض الجولة التعريفية السريعة (3 خطوات + تشغيل ديمو حي 4 ثوانٍ)</span>
        </button>
      </div>
    `;
  }

  const activeStepId = String(state.activeOnboardingStep || '1');
  const steps = Array.isArray(ob.steps) ? ob.steps : [];

  const renderStepVisual = (stepId) => {
    if (stepId === '1') {
      return `
        <div class="onboarding-mini-scene onboarding-mini-scene--org" aria-hidden="true">
          <div class="onboarding-mini-row">
            <span class="onboarding-mini-pill onboarding-mini-pill--gold">منشأة كبرى</span>
            <span class="onboarding-mini-pill">متوسطة / صغيرة</span>
          </div>
          <div class="onboarding-mini-row">
            <span class="onboarding-mini-chip">الحشود</span>
            <span class="onboarding-mini-chip is-selected">النقل الترددي</span>
          </div>
          <span class="css-ghost-cursor css-ghost-cursor--step1"></span>
        </div>
      `;
    }
    if (stepId === '2') {
      return `
        <div class="onboarding-mini-scene onboarding-mini-scene--lab" aria-hidden="true">
          <div class="onboarding-mini-slots">
            <span class="onboarding-mini-slot is-foundation">01 توثيق</span>
            <span class="onboarding-mini-slot is-foundation">02 مصادر</span>
            <span class="onboarding-mini-slot is-foundation">03 تصنيف</span>
            <span class="onboarding-mini-slot is-ai">04 ذكاء</span>
          </div>
          <span class="css-ghost-cursor css-ghost-cursor--step2"></span>
        </div>
      `;
    }
    return `
      <div class="onboarding-mini-scene onboarding-mini-scene--telemetry" aria-hidden="true">
        <div class="onboarding-mini-gauge">
          <svg viewBox="0 0 64 36" width="64" height="36" focusable="false">
            <path d="M 6 30 A 26 26 0 0 1 58 30" class="onboarding-mini-gauge__track" />
            <path d="M 6 30 A 26 26 0 0 1 58 30" class="onboarding-mini-gauge__arc" />
          </svg>
          <span class="onboarding-mini-score">100%</span>
        </div>
        <div class="onboarding-mini-rings">
          <span class="onboarding-mini-ring"></span>
          <span class="onboarding-mini-ring"></span>
          <span class="onboarding-mini-ring"></span>
          <span class="onboarding-mini-ring"></span>
          <span class="onboarding-mini-ring"></span>
          <span class="onboarding-mini-ring"></span>
        </div>
        <span class="css-ghost-cursor css-ghost-cursor--step3"></span>
      </div>
    `;
  };

  const stepsHtml = steps
    .map((step) => {
      const isActive = activeStepId === String(step.id);
      return `
        <button
          type="button"
          class="onboarding-step-card ${isActive ? 'is-active' : ''}"
          data-action="focus-onboarding-step"
          data-onboarding-step="${escapeHtml(step.id)}"
          data-target-area="${escapeHtml(step.targetArea || 'org')}"
          aria-pressed="${isActive ? 'true' : 'false'}"
        >
          <div class="onboarding-step-card__top">
            <span class="onboarding-step-card__num">${escapeHtml(step.stepNumber)}</span>
            <h4 class="onboarding-step-card__title">${escapeHtml(step.title)}</h4>
          </div>
          ${renderStepVisual(String(step.id))}
          <p class="onboarding-step-card__caption">${escapeHtml(step.caption)}</p>
        </button>
      `;
    })
    .join('');

  return `
    <aside
      id="onboarding-coach"
      class="onboarding-coach ${state.demoRunning ? 'is-demo-running' : ''}"
      data-onboarding-coach
      aria-labelledby="onboarding-coach-title"
    >
      <div class="onboarding-coach__header">
        <div class="onboarding-coach__heading">
          <p class="eyebrow">${escapeHtml(ob.eyebrow)}</p>
          <h3 id="onboarding-coach-title" class="onboarding-coach__title">${escapeHtml(ob.title)}</h3>
          <p class="onboarding-coach__subtitle">${escapeHtml(ob.subtitle)}</p>
        </div>
        <button
          type="button"
          class="onboarding-coach__dismiss"
          data-action="dismiss-onboarding"
          aria-label="${escapeHtml(ob.dismissLabel)}"
        >
          <span aria-hidden="true">${getIconSvg('close')}</span>
          <span>${escapeHtml(ob.dismissLabel)}</span>
        </button>
      </div>

      <div class="onboarding-steps" role="group" aria-label="خطوات العمل المصوّرة">
        ${stepsHtml}
      </div>

      <div class="onboarding-coach__controls">
        <button
          type="button"
          class="btn btn--secondary"
          data-action="play-onboarding-walkthrough"
          ${state.demoRunning ? 'disabled' : ''}
        >
          <span>${escapeHtml(ob.playLabel)}</span>
        </button>
        <button
          type="button"
          class="btn btn--primary onboarding-demo-btn"
          data-action="run-interactive-demo"
          ${state.demoRunning ? 'disabled' : ''}
        >
          <span>${escapeHtml(ob.demoLabel)}</span>
        </button>
      </div>

      <div
        id="onboarding-demo-status"
        class="onboarding-demo-status ${state.demoStatusMessage ? 'is-visible' : ''}"
        aria-live="polite"
      >
        ${state.demoStatusMessage ? escapeHtml(state.demoStatusMessage) : ''}
      </div>
    </aside>
  `;
}

/**
 * يبني HTML قسم المحاكي بنظام لوحة القيادة التنفيذية ذات 12 عموداً (8-Area Bento Cockpit)
 * مع الترتيب الهرمي المتجاوب للجوال وشريط القطاعات المغناطيسي ودرج الشواهد الأصلي.
 *
 * @param {{ simulator: string, mode?: 'quick' | 'builder', sectorId: string | null, path: 'husk' | 'foundation' | null, chain: readonly any[], plan?: readonly string[], evaluation?: any }} state
 * @param {any} catalog
 * @param {{ animateSteps?: boolean, compactMobile?: boolean }} [options]
 */
export function renderSimulatorHtml(state, catalog, options = {}) {
  const { simulatorUi, sectors, sectorCategories } = catalog;
  const activeMode = state.mode || 'quick';
  const activeScaleId =
    state.scaleId || catalog.scales?.defaultScaleId || 'enterprise';
  const activeCaseFilter = state.caseFilter || 'all';
  const copiedDiagnosis = Boolean(state.copiedDiagnosis);
  const selectedSector =
    sectors.find((s) => s.id === state.sectorId || s.aliasId === state.sectorId) ||
    null;
  const animateSteps = Boolean(options.animateSteps);
  const compactMobile = Boolean(options.compactMobile);
  const expandCompact = !compactMobile;

  const ambientState = resolveSimulatorAmbientState(
    {
      mode: activeMode,
      path: state.path,
      plan: state.plan || [],
      evaluation: state.evaluation || null,
    },
    catalog
  );
  const ambientMeta =
    catalog.ambientStates?.[ambientState] ||
    CONTENT_CATALOG.ambientStates.neutral;

  const stageBarHtml = renderStageProgressBarHtml(state, catalog);
  const scaleToggleHtml = renderScaleToggleHtml(activeScaleId, catalog, {
    compactMobile,
  });
  const liveTelemetryMeters = computeTelemetry(
    {
      scaleId: activeScaleId,
      mode: activeMode,
      path: state.path,
      plan: state.plan || [],
      evaluation: state.evaluation || null,
      previousValues: state.previousTelemetryValues || null,
    },
    catalog
  );
  const liveTelemetryHtml = renderTelemetryPanelHtml(
    liveTelemetryMeters,
    catalog,
    'sim-live',
    {
      pulseActive: Boolean(state.telemetryPulse),
      lastActionReason: state.lastActionReason || '',
    }
  );

  const renderSectorCard = (sector) => {
    const isSelected = sector.id === selectedSector?.id;
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

  const sectorFieldMetricsHtml =
    selectedSector &&
    Array.isArray(selectedSector.fieldMetrics) &&
    selectedSector.fieldMetrics.length > 0
      ? `
        <details
          class="compact-disclosure sector-metrics-disclosure"
          data-compact-disclosure="sector-metrics"
        >
          <summary class="compact-disclosure__summary">
            <span>المؤشرات الميدانية الحرجة لـ ${escapeHtml(selectedSector.name)} (${selectedSector.fieldMetrics.length})</span>
          </summary>
          <div class="sector-field-metrics" data-sector-field-metrics="${escapeHtml(selectedSector.id)}">
            <ul class="sector-field-metrics__grid" role="list">
              ${selectedSector.fieldMetrics
                .map(
                  (fm) => `
                    <li class="sector-metric-card" data-field-metric-id="${escapeHtml(fm.id)}">
                      <strong class="sector-metric-card__label">${escapeHtml(fm.label)}</strong>
                      <div class="sector-metric-card__states">
                        <p class="sector-metric-card__state sector-metric-card__state--risk">
                          <span class="sector-metric-card__badge sector-metric-card__badge--risk">بلا حوكمة:</span>
                          <span>${escapeHtml(fm.riskValue)}</span>
                        </p>
                        <p class="sector-metric-card__state sector-metric-card__state--ready">
                          <span class="sector-metric-card__badge sector-metric-card__badge--ready">مع تأسيس البيانات:</span>
                          <span>${escapeHtml(fm.readyValue)}</span>
                        </p>
                      </div>
                    </li>
                  `
                )
                .join('')}
            </ul>
          </div>
        </details>
      `
      : '';

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
        ${sectorFieldMetricsHtml}
      </div>
    `
    : '';

  const showPathStep = true;
  const quickIdleHintHtml = !selectedSector
    ? `<p class="sim-step__quick-hint" data-quick-idle-hint>اختر قطاعك من الأعلى — أو اضغط مباشرة على أحد المسارين أدناه للتجربة الفورية.</p>`
    : '';
  const quickRefBtnLabel =
    simulatorUi.builder?.starterGuide?.applyReferenceBtnLabel ||
    'طبّق الخطة المرجعية المثالية (100/100) وشاهد النتيجة';

  const pathStepHtml = showPathStep
    ? `
      <div class="sim-step" data-sim-step="path">
        <div class="sim-step__header-row">
          <h3 class="sim-step__title">${escapeHtml(simulatorUi.stepPathTitle)}</h3>
          <button
            type="button"
            class="btn btn--secondary sim-step__quick-ref-btn"
            data-action="apply-reference-plan"
          >
            <span class="btn__icon" aria-hidden="true">${getIconSvg('spark')}</span>
            <span>${escapeHtml(quickRefBtnLabel)}</span>
          </button>
        </div>
        ${quickIdleHintHtml}
        <div class="path-grid">
          ${(['foundation', 'husk'])
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
  let activeTimelinePhases = null;
  let activeFieldEvidence = selectedSector
    ? resolveFieldEvidence(selectedSector.id, catalog)
    : null;
  let activeDiagnosis = null;

  if (state.simulator === 'chainRevealed' && state.path && state.chain.length > 0) {
    const pathMeta = simulatorUi.paths[state.path];
    const otherPathKey = state.path === 'husk' ? 'foundation' : 'husk';
    const otherPathMeta = simulatorUi.paths[otherPathKey];
    const polarity = state.path === 'husk' ? 'negative' : 'positive';

    const regulatoryLabels = {
      eyebrow: simulatorUi.regulatoryRefEyebrow,
      externalHint: simulatorUi.regulatoryRefExternalHint,
    };

    const dominoItemsHtml = state.chain
      .map((link) =>
        renderDominoCardHtml(link, {
          textField: 'simple',
          headingTag: 'h4',
          hideInitially: animateSteps && link.index > 1,
          regulatoryLabels,
        })
      )
      .join('');

    activeTimelinePhases = buildConsequenceTimeline(
      {
        tone: polarity,
        scaleId: activeScaleId,
        sectorId: selectedSector?.id || state.sectorId,
      },
      catalog
    );
    activeFieldEvidence = resolveFieldEvidence(
      selectedSector?.id || state.sectorId,
      catalog
    );
    activeDiagnosis = buildExecutiveDiagnosis(
      {
        sectorId: selectedSector?.id || state.sectorId,
        scaleId: activeScaleId,
        mode: 'quick',
        path: state.path,
      },
      catalog
    );

    chainHtml = `
      <div class="chain-result chain-result--${polarity}" data-chain-polarity="${polarity}" data-scale-id="${escapeHtml(activeScaleId)}">
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
          <button type="button" class="btn btn--primary" data-action="go-to-builder">
            <span class="btn__icon" aria-hidden="true">${getIconSvg('layers')}</span>
            <span>${escapeHtml(simulatorUi.toBuilderLabel)}</span>
          </button>
          <button type="button" class="btn btn--secondary" data-action="switch-path">
            <span class="btn__icon" aria-hidden="true">${getIconSvg('refresh')}</span>
            <span>${escapeHtml(simulatorUi.switchPathLabel)}: ${escapeHtml(otherPathMeta.label)}</span>
          </button>
        </div>

        <p class="disclaimer sim-disclaimer" data-chain-disclaimer>
          ${escapeHtml(catalog.meta.disclaimer)}
        </p>
      </div>
    `;
  } else if (
    activeMode === 'builder' &&
    state.simulator === 'evaluated' &&
    state.evaluation
  ) {
    activeTimelinePhases =
      state.evaluation.timeline ||
      buildConsequenceTimeline(
        {
          tone: state.evaluation.tier?.tone || 'warning',
          scaleId: activeScaleId,
          sectorId: selectedSector?.id || state.evaluation.sectorId || 'shuttle',
        },
        catalog
      );
    activeFieldEvidence =
      state.evaluation.fieldEvidence ||
      resolveFieldEvidence(
        selectedSector?.id || state.evaluation.sectorId || 'shuttle',
        catalog
      );
    activeDiagnosis =
      state.evaluation.diagnosis ||
      buildExecutiveDiagnosis(
        {
          sectorId: selectedSector?.id || state.evaluation.sectorId || 'shuttle',
          scaleId: activeScaleId,
          mode: 'builder',
          evaluation: state.evaluation,
        },
        catalog
      );
  }

  if (!activeTimelinePhases) {
    const previewTone =
      ambientState === 'governed'
        ? 'positive'
        : ambientState === 'critical'
          ? 'negative'
          : 'warning';
    activeTimelinePhases = buildConsequenceTimeline(
      {
        tone: previewTone,
        scaleId: activeScaleId,
        sectorId: selectedSector?.id || 'shuttle',
      },
      catalog
    );
  }

  const timelineHtml = renderConsequenceTimelineHtml(
    activeTimelinePhases,
    catalog,
    'sim-bento'
  );
  const fieldEvidenceHtml = activeFieldEvidence
    ? renderFieldEvidenceCardHtml(activeFieldEvidence, catalog, 'sim-bento')
    : '';
  const executiveDiagnosisHtml = activeDiagnosis
    ? renderExecutiveDiagnosisCardHtml(activeDiagnosis, catalog, {
        copiedDiagnosis,
        idPrefix: 'sim-bento',
      })
    : '';

  const matrixConfig =
    simulatorUi.matrixBenchmarks || CONTENT_CATALOG.simulatorUi.matrixBenchmarks;
  const methodologyWeights =
    catalog.methodology?.weights || CONTENT_CATALOG.methodology?.weights || [];
  const caseItems =
    catalog.caseStudies?.items || CONTENT_CATALOG.caseStudies?.items || [];
  const miniWeightsHtml =
    methodologyWeights.length > 0
      ? `
        <div class="matrix-peek__weights" aria-label="أوزان المنهجية العلمية">
          ${methodologyWeights
            .map(
              (w) => `
                <span class="matrix-peek__weight-chip matrix-peek__weight-chip--${escapeHtml(w.id)}">
                  <strong>${escapeHtml(w.weightLabel)}</strong>
                  <span>${escapeHtml(w.label)}</span>
                </span>
              `
            )
            .join('')}
        </div>
      `
      : '';
  const miniCasesHtml =
    caseItems.length > 0
      ? `
        <div class="matrix-peek__cases" aria-label="ملخص الحالات العالمية الخمس">
          ${caseItems
            .map(
              (c) => `
                <span class="matrix-peek__case-pill matrix-peek__case-pill--${escapeHtml(c.category)}">
                  <bdi dir="ltr">${escapeHtml(c.company)}</bdi>
                  <small>${escapeHtml(c.impactCapsule || c.headlineMetric)}</small>
                </span>
              `
            )
            .join('')}
        </div>
      `
      : '';
  const matrixPeekHtml = matrixConfig
    ? `
      <div class="matrix-peek" data-matrix-peek>
        <div class="matrix-peek__header">
          <div>
            <p class="eyebrow">${escapeHtml(matrixConfig.eyebrow)}</p>
            <h4 class="matrix-peek__title">${escapeHtml(matrixConfig.title)}</h4>
          </div>
          <div class="matrix-peek__benchmark-badge">
            <span>${escapeHtml(matrixConfig.targetScoreLabel)}</span>
            <strong>${escapeHtml(matrixConfig.targetScoreValue)}</strong>
          </div>
        </div>
        ${miniWeightsHtml}
        <ul class="matrix-peek__list" role="list">
          ${(matrixConfig.pillars || [])
            .map(
              (p) => `
                <li class="matrix-peek__item">
                  <strong>${escapeHtml(p.label)}</strong>
                  <span>${escapeHtml(p.benchmark)}</span>
                </li>
              `
            )
            .join('')}
        </ul>
        ${miniCasesHtml}
      </div>
    `
    : '';

  const modes = simulatorUi.modes;
  const modeTabsHtml = `
    <div class="sim-modes">
      <fieldset class="segmented-control" data-segmented-control>
        <legend class="visually-hidden">أنماط المحاكي</legend>
        <input
          class="segmented-control__radio visually-hidden"
          type="radio"
          name="sim-mode"
          id="mode-quick"
          value="quick"
          ${activeMode === 'quick' ? 'checked' : ''}
          tabindex="-1"
          aria-hidden="true"
        />
        <input
          class="segmented-control__radio visually-hidden"
          type="radio"
          name="sim-mode"
          id="mode-builder"
          value="builder"
          ${activeMode === 'builder' ? 'checked' : ''}
          tabindex="-1"
          aria-hidden="true"
        />
        <span class="sliding-pill" aria-hidden="true"></span>
        <div class="sim-tablist segmented-control__tabs" role="tablist" aria-label="أنماط المحاكي">
          ${(['quick', 'builder'])
            .map((modeKey) => {
              const m = modes[modeKey];
              const isActive = activeMode === modeKey;
              return `
                <button
                  type="button"
                  role="tab"
                  id="tab-${escapeHtml(m.id)}"
                  class="sim-tab segmented-control__option"
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
      </fieldset>
    </div>
  `;

  const quickPanelContent = activeMode === 'quick' ? pathStepHtml : '';
  const builderPanelContent =
    activeMode === 'builder'
      ? renderBuilderPanelHtml(state, catalog, selectedSector, {
          includeResult: false,
          compactMobile,
        })
      : '';

  const emptyConfig =
    simulatorUi.emptyResultPanel || CONTENT_CATALOG.simulatorUi.emptyResultPanel;
  const emptyResultHtml = emptyConfig
    ? `
      <div class="empty-result-panel" data-empty-result-panel>
        <p class="eyebrow">${escapeHtml(emptyConfig.eyebrow)}</p>
        <h4 class="empty-result-panel__title">${escapeHtml(emptyConfig.title)}</h4>
        <p class="empty-result-panel__body">${escapeHtml(emptyConfig.body)}</p>
        <ul class="empty-result-panel__list" role="list">
          ${(emptyConfig.checklist || [])
            .map((line) => `<li>${escapeHtml(line)}</li>`)
            .join('')}
        </ul>
      </div>
    `
    : '';

  const chainAreaContent =
    activeMode === 'builder'
      ? `
        <div id="builder-result-live" class="builder-result-live" aria-live="polite">
          ${
            state.simulator === 'evaluated'
              ? renderBuilderResultHtml(state.evaluation, catalog, {
                  caseFilter: activeCaseFilter,
                  copiedDiagnosis,
                  embeddedInBentoCockpit: true,
                })
              : emptyResultHtml
          }
        </div>
      `
      : chainHtml || emptyResultHtml;

  const quickEmptyTabindex =
    activeMode === 'quick' && !selectedSector ? 'tabindex="0"' : '';
  const builderEmptyTabindex =
    activeMode === 'builder' && !selectedSector ? 'tabindex="0"' : '';

  const evidenceDrawerHtml = renderEvidenceDrawerHtml(
    activeCaseFilter,
    catalog,
    'sim-main'
  );

  const activeDeckSlide = String(state.touchDeckSlide || '1');
  const deckSlides =
    simulatorUi.touchDeckSlides ||
    CONTENT_CATALOG.simulatorUi.touchDeckSlides || [
      { id: '1', stepNumber: '1', label: '1. المنشأة والقطاع والخطة' },
      { id: '2', stepNumber: '2', label: '2. المؤشرات الأربعة وسلسلة الأثر' },
      { id: '3', stepNumber: '3', label: '3. الفصول الزمنية والتشخيص' },
    ];
  const touchDeckTabsHtml = `
    <nav class="touch-deck-bar" aria-label="بطاقات المحاكي اللمسية للجوال والآيباد" data-touch-deck-bar>
      <div class="touch-deck-bar__tabs" role="group">
        ${deckSlides
          .map((sl) => {
            const isActiveSlide = activeDeckSlide === sl.id;
            return `
              <button
                type="button"
                class="touch-deck-bar__btn ${isActiveSlide ? 'is-active' : ''}"
                data-action="select-deck-slide"
                data-deck-slide="${escapeHtml(sl.id)}"
                aria-pressed="${isActiveSlide ? 'true' : 'false'}"
              >
                <span class="touch-deck-bar__num">${escapeHtml(sl.stepNumber)}</span>
                <span class="touch-deck-bar__label">${escapeHtml(sl.label)}</span>
              </button>
            `;
          })
          .join('')}
      </div>
      <p class="touch-deck-bar__hint">اسحب أفقياً أو اضغط للتنقل بين بطاقات المحاكي الثلاث دون تمرير طويل</p>
    </nav>
  `;

  const onboardingCoachHtml = renderOnboardingCoachHtml(state, catalog);
  const hlClass = (areaName) => {
    const hl = state.onboardingHighlightArea;
    if (!hl) return '';
    if (hl === areaName) return ' onboarding-highlight-pulse';
    if (hl === 'org' && areaName === 'sectors') return ' onboarding-highlight-pulse';
    if (hl === 'telemetry' && areaName === 'chain') return ' onboarding-highlight-pulse';
    return '';
  };

  return `
    <div class="simulator-header">
      <div>
        <span class="motto-crest-banner__station-pill">المحطة 02 · ميدان التجربة</span>
        <p class="eyebrow">${escapeHtml(simulatorUi.eyebrow)}</p>
        <h2 id="simulator-title" class="section-title" tabindex="-1">${escapeHtml(simulatorUi.title)}</h2>
        <p class="lead">${escapeHtml(simulatorUi.intro)}</p>
      </div>
      ${stageBarHtml}
    </div>

    ${onboardingCoachHtml}

    ${touchDeckTabsHtml}

    <div
      class="bento-cockpit"
      data-bento-cockpit
      data-sim-split-layout
      data-sim-state="${escapeHtml(ambientState)}"
    >
      <div class="sim-touch-deck" data-sim-touch-deck data-active-deck="${escapeHtml(activeDeckSlide)}">
        <div class="sim-touch-slide" data-touch-slide="1" role="region" aria-label="1. المنشأة والقطاع والخطة">
          <section class="bento-card area-org${hlClass('org')}" data-bento-area="org" aria-label="حجم المنشأة والملاءة المالية">
            ${scaleToggleHtml}
          </section>

          <section class="bento-card area-sectors${hlClass('sectors')}" data-bento-area="sectors" aria-label="${escapeHtml(simulatorUi.stepSectorTitle)}">
            <div class="sim-step" data-sim-step="sector">
              <h3 class="sim-step__title">${escapeHtml(simulatorUi.stepSectorTitle)}</h3>
              <div class="sector-groups sectors-scroll-snap">
                ${sectorCardsHtml}
              </div>
              ${profileHtml}
            </div>
          </section>

          <section class="bento-card area-evidence-trigger" data-bento-area="evidence-trigger" aria-label="مكتبة المنهجية والشواهد">
            <div class="ambient-status-pill ambient-status-pill--${escapeHtml(ambientState)}" data-ambient-status="${escapeHtml(ambientState)}">
              <span class="ambient-status-pill__dot" aria-hidden="true"></span>
              <div class="ambient-status-pill__copy">
                <strong>${escapeHtml(ambientMeta.badge)}</strong>
                <span>${escapeHtml(ambientMeta.label)}</span>
              </div>
            </div>
            <div class="area-evidence-trigger__actions">
              <a
                class="btn btn--secondary evidence-station-link"
                href="#methodology"
                data-action="go-station"
                data-station-target="methodology"
                data-scroll-target="methodology"
              >
                <span class="btn__icon" aria-hidden="true">${getIconSvg('compass')}</span>
                <span>انتقل لمحطة المنهجيات والروابط (03) ←</span>
              </a>
              <button
                type="button"
                class="btn btn--secondary evidence-trigger-btn"
                popovertarget="evidence-drawer"
                data-action="open-evidence-drawer"
              >
                <span class="btn__icon" aria-hidden="true">${getIconSvg('book')}</span>
                <span>${escapeHtml(simulatorUi.evidenceTriggerLabel || 'المنهجية والشواهد الواقعية')}</span>
              </button>
            </div>
          </section>

          <section class="bento-card area-lab${hlClass('lab')}" data-bento-area="lab" aria-label="مختبر القرارات وبناء الخطة">
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
          </section>
        </div>

        <div class="sim-touch-slide" data-touch-slide="2" role="region" aria-label="2. المؤشرات الأربعة وسلسلة الأثر">
          <section class="bento-card area-telemetry${hlClass('telemetry')}" data-bento-area="telemetry" id="sim-live-telemetry-mount" aria-label="المؤشرات الحية الرباعية">
            ${liveTelemetryHtml}
          </section>

          <section class="bento-card area-chain${hlClass('chain')}" data-bento-area="chain" aria-label="سلسلة الأثر ذات 6 حلقات">
            <div class="sim-results-slot" data-sim-results-slot>
              ${chainAreaContent}
            </div>
          </section>
        </div>

        <div class="sim-touch-slide" data-touch-slide="3" role="region" aria-label="3. الفصول الزمنية والتشخيص">
          <section class="bento-card area-timeline" data-bento-area="timeline" aria-label="الخط الزمني للأثر المتأخر">
            ${timelineHtml}
          </section>

          <section class="bento-card area-matrix-peek" data-bento-area="matrix-peek" aria-label="المقارنة المرجعية والشاهد الميداني والتشخيص">
            ${matrixPeekHtml}
            ${fieldEvidenceHtml}
            ${executiveDiagnosisHtml}
            <div class="matrix-peek__drawer-cta">
              <a
                class="btn btn--primary"
                href="#methodology"
                data-action="go-station"
                data-station-target="methodology"
                data-scroll-target="methodology"
              >
                <span class="btn__icon" aria-hidden="true">${getIconSvg('book')}</span>
                <span>استعرض محطة المنهجيات والشواهد الكاملة (المحطة 03) ←</span>
              </a>
              <button
                type="button"
                class="btn btn--secondary"
                popovertarget="evidence-drawer"
                data-action="open-evidence-drawer"
              >
                <span class="btn__icon" aria-hidden="true">${getIconSvg('layers')}</span>
                <span>${escapeHtml(simulatorUi.evidenceTriggerLabel || 'المنهجية والشواهد الواقعية')}</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>

    ${renderStationFooterNavHtml('simulator', catalog)}
    ${evidenceDrawerHtml}
  `;
}

/**
 * يحلّ مسار وأبعاد صورة اللقطة وحالة البديل سواء لبطاقة الشبكة أو لنافذة التكبير.
 *
 * @param {Record<string, any>} item
 * @param {Record<string, any>} [insightsConfig]
 * @param {boolean} [preferLightbox]
 */
export function resolveInsightMedia(item, insightsConfig = {}, preferLightbox = false) {
  const defaultImageSrc = insightsConfig.defaultImageSrc || 'assets/insights/insight-01.svg';
  const defaultWidth = Number(insightsConfig.defaultWidth) || 800;
  const defaultHeight = Number(insightsConfig.defaultHeight) || 500;
  const useLightbox = preferLightbox && Boolean(item?.lightboxSrc);
  const src = useLightbox ? item.lightboxSrc : item?.imageSrc || defaultImageSrc;
  const width =
    (useLightbox ? Number(item?.lightboxWidth) : Number(item?.width)) ||
    Number(item?.width) ||
    defaultWidth;
  const height =
    (useLightbox ? Number(item?.lightboxHeight) : Number(item?.height)) ||
    Number(item?.height) ||
    defaultHeight;
  const isPlaceholder =
    typeof item?.isPlaceholder === 'boolean'
      ? item.isPlaceholder
      : !src || /\.svg(?:$|\?)/i.test(src);

  return { src, width, height, isPlaceholder };
}

/** يبني HTML قسم اللقطات الاستشارية (شبكة البطاقات ونافذة التكبير `<dialog>`). */
export function renderInsightsHtml(catalog) {
  const insights = catalog.insights;
  if (!insights) return '';

  const defaultImageSrc = insights.defaultImageSrc || 'assets/insights/insight-01.svg';
  const defaultWidth = Number(insights.defaultWidth) || 800;
  const defaultHeight = Number(insights.defaultHeight) || 500;
  const placeholderBadgeText = insights.placeholderBadge || 'صورة المعرض ستُضاف قريباً';
  const expandHint = insights.expandHint || 'تكبير اللقطة';
  const closeLabel = insights.closeLabel || 'إغلاق المعاينة';

  const cardsHtml = (insights.items || [])
    .map((item) => {
      const {
        src: imageSrc,
        width,
        height,
        isPlaceholder: showPlaceholder,
      } = resolveInsightMedia(item, insights, false);
      const placeholderBadge = showPlaceholder
        ? `<span class="insight-card__placeholder-badge">${escapeHtml(placeholderBadgeText)}</span>`
        : '';

      return `<li class="insight-item">
        <article class="insight-card" aria-labelledby="insight-title-${escapeHtml(item.id)}">
          <figure class="insight-card__figure">
            <button
              type="button"
              class="insight-card__trigger"
              data-action="open-insight"
              data-insight-id="${escapeHtml(item.id)}"
              aria-label="${escapeHtml(item.title)} — ${escapeHtml(expandHint)}"
            >
              <span class="insight-card__media">
                <img
                  class="insight-card__img"
                  src="${escapeHtml(imageSrc)}"
                  alt="${escapeHtml(item.alt || item.title)}"
                  width="${width}"
                  height="${height}"
                  loading="lazy"
                  decoding="async"
                />
                ${placeholderBadge}
                <span class="insight-card__expand-chip" aria-hidden="true">
                  ${getIconSvg('zoom')}
                  <span>${escapeHtml(expandHint)}</span>
                </span>
              </span>
            </button>
            <figcaption class="insight-card__body">
              <span class="insight-card__tag">${escapeHtml(item.tag)}</span>
              <h3 id="insight-title-${escapeHtml(item.id)}" class="insight-card__title">${escapeHtml(item.title)}</h3>
              <p class="insight-card__commentary">${escapeHtml(item.commentary)}</p>
            </figcaption>
          </figure>
        </article>
      </li>`;
    })
    .join('');

  return `
    <span class="motto-crest-banner__station-pill">المحطة 04 · المشاهدات الميدانية</span>
    <p class="eyebrow">${escapeHtml(insights.eyebrow)}</p>
    <h2 id="insights-title" class="section-title" tabindex="-1">${escapeHtml(insights.title)}</h2>
    <p class="lead">${formatRtlHashtag(insights.subtitle)}</p>

    <ul class="insights-grid" role="list" aria-label="${escapeHtml(insights.eyebrow)}">
      ${cardsHtml}
    </ul>

    ${renderStationFooterNavHtml('insights', catalog)}

    <dialog
      id="insight-dialog"
      class="insight-dialog"
      closedby="any"
      aria-labelledby="insight-dialog-title"
    >
      <div class="insight-dialog__surface">
        <header class="insight-dialog__header">
          <div class="insight-dialog__heading">
            <span class="insight-card__tag" data-insight-dialog-tag></span>
            <h3 id="insight-dialog-title" class="insight-dialog__title" data-insight-dialog-title></h3>
          </div>
          <form method="dialog" class="insight-dialog__close-form">
            <button
              type="submit"
              class="insight-dialog__close"
              aria-label="${escapeHtml(closeLabel)}"
              data-action="close-insight"
            >
              <span aria-hidden="true">${getIconSvg('close')}</span>
              <span>${escapeHtml(closeLabel)}</span>
            </button>
          </form>
        </header>

        <figure class="insight-dialog__figure">
          <div class="insight-dialog__media">
            <img
              id="insight-dialog-img"
              class="insight-dialog__img"
              src="${escapeHtml(defaultImageSrc)}"
              alt=""
              width="${defaultWidth}"
              height="${defaultHeight}"
              loading="lazy"
              decoding="async"
            />
            <span class="insight-card__placeholder-badge" data-insight-dialog-placeholder hidden>
              ${escapeHtml(placeholderBadgeText)}
            </span>
          </div>
          <figcaption class="insight-dialog__caption">
            <p class="insight-dialog__commentary" data-insight-dialog-commentary></p>
            <p class="insight-dialog__hint">${escapeHtml(insights.lightboxBackdropHint || '')}</p>
          </figcaption>
        </figure>
      </div>
    </dialog>
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
    <span class="motto-crest-banner__station-pill">المحطة 05 · بوابة الأثر الاستشاري</span>
    <p class="eyebrow">${escapeHtml(closing.eyebrow)}</p>
    <h2 id="contact-title" class="section-title" tabindex="-1">${escapeHtml(closing.title)}</h2>
    <p class="closing-message">${escapeHtml(closing.message)}</p>

    <div class="contact-grid">
      ${renderTrackCardHtml(closing.tracks.b2b, b2bPlatforms)}
      ${renderTrackCardHtml(closing.tracks.individual, indPlatforms)}
    </div>

    ${renderStationFooterNavHtml('contact', catalog)}
  `;
}
