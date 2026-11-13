/**
 * طبقة العرض (Views).
 *
 * تحوّل بيانات الكتالوج إلى DOM لقسمَي البطل والخلاصة/التواصل (والأقسام الأخرى لاحقاً).
 * لا تحتوي أي قواعد تقييم أو حالة.
 */
import { getPlatformsForAudience } from './content-catalog.js';

/** أيقونات SVG مضمّنة من مجموعة متسقة (24×24، stroke/fill موحّد). */
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

