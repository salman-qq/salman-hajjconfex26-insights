/**
 * محرك المحاكي (Simulator Engine).
 *
 * دوال نقية تقرأ كتالوج المحتوى ولا تلمس DOM ولا تستورد أي وحدة خاصة بـ Node.
 * يعمل الملف نفسه في المتصفح وفي اختبارات Node المحلية.
 */
import { CONTENT_CATALOG, VALID_PATHS } from './content-catalog.js';

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
  if (typeof sectorId !== 'string' || !sectorId.trim()) {
    throw new Error(`قطاع غير معروف: "${sectorId}"`);
  }

  const sector = catalog.sectors.find((s) => s.id === sectorId);
  if (!sector) {
    throw new Error(`قطاع غير معروف: "${sectorId}"`);
  }

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
    axisName: `أثر ميداني — ${sector.name}`,
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

