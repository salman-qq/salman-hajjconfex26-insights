/**
 * كتالوج المحتوى (Content Catalog).
 *
 * المصدر الوحيد لنصوص الواجهة ومنصات التواصل وبيانات المحاكي.
 * قيد معماري: جافاسكربت متصفح قياسية فقط، بلا منطق عرض ولا DOM ولا استيراد من Node.
 */

/** @typedef {'b2b' | 'individual' | 'all'} AudienceType */

/** القيم المسموحة لحقل الجمهور في منصات التواصل. */
export const VALID_AUDIENCES = Object.freeze(['b2b', 'individual', 'all']);

export const CONTENT_CATALOG = Object.freeze({
  meta: Object.freeze({
    hashtag: '#hajjconfex2026',
    disclaimer:
      'هذا المحاكي مجرد افتراض ورؤية تحليلية لما قد يحدث في الشركات بناءً على قرارات تقنية، ولا يمثل استشارة قانونية أو واقعة لجهة بعينها.',
  }),

  hero: Object.freeze({
    eyebrow: 'رؤية استشارية من أروقة #hajjconfex2026',
    titlePrefix: 'قبل أن تطلق الذكاء الاصطناعي في خدمة ضيوف الرحمن: ',
    titleHighlight: 'هل بنيتَ أساس البيانات؟',
    subtitle:
      'في أجنحة المعرض رأينا تقنيات ذكاء اصطناعي مبهرة، لكن ما يحدد نجاحها أو تعثرها في الميدان هو قرار واحد يسبقها: حوكمة البيانات وتوحيد المصادر أولاً. عِش دور صاحب القرار في منشأتك وشاهد سلسلة الأثر بنفسك.',
    badges: Object.freeze([
      Object.freeze({
        id: 'b2b-paid',
        text: 'استشارة مؤسسية: مدفوعة',
        variant: 'paid',
      }),
      Object.freeze({
        id: 'individual-free',
        text: 'توجيه للأفراد والطلاب: مجاني',
        variant: 'free',
      }),
    ]),
    primaryCta: Object.freeze({
      label: 'ابدأ المحاكي',
      targetId: 'simulator',
    }),
    secondaryCta: Object.freeze({
      label: 'تواصل مع المستشار',
      targetId: 'contact',
    }),
    initiativeNote:
      'مبادرة استشارية شخصية من سلمان الحربي (مستشار حوكمة البيانات وذكاء القرارات) — مستلهمة من #hajjconfex2026 وغير تابعة للجهة المنظمة.',
  }),

  closing: Object.freeze({
    eyebrow: 'الخلاصة الاستشارية',
    title: 'الأدوات تُشترى في يوم، أما الأساس فيُبنى بمنهجية',
    message:
      'أخطر ما يواجه المنشآت بعد المواسم الكبرى ليس نقص التقنيات، بل الاختناق المؤسسي حين تتحول الأنظمة إلى معرفة محبوسة في رؤوس أفراد وتغيب عنها حوكمة البيانات ومسار التدقيق. وجود مستشار تقني يرافق منشأتك في تأسيس بنيتها التحتية وتوحيد مصادرها لا يحميك من الهدر ومخاطر الامتثال فحسب، بل يخلق بيئة واضحة تدمج المتدرب الخريج (GDP) والموظف الجديد من اليوم الأول، وتضع شركتك في مستوى الجاهزية الاستثمارية قبل إطلاق أي نموذج ذكاء اصطناعي.',
    tracks: Object.freeze({
      b2b: Object.freeze({
        id: 'b2b',
        audience: 'b2b',
        title: 'الاستشارة المؤسسية (مدفوعة)',
        badge: 'مدفوعة — للشركات والجهات',
        description:
          'تقييم جاهزية البنية التحتية للبيانات، وتأسيس أطر حوكمة البيانات والامتثال (PDPL / NDMO)، وبناء خارطة طريق ذكاء القرارات لتفادي الهدر السحابي والاختناق المؤسسي.',
      }),
      individual: Object.freeze({
        id: 'individual',
        audience: 'individual',
        title: 'التوجيه المجاني',
        badge: 'مجاني — للأفراد والطلاب والخريجين',
        description:
          'إرشاد مهني ومعرفي مجاني للطلاب والمتدربين الخريجين (GDP) والممارسين الراغبين في فهم مسارات حوكمة البيانات وذكاء القرارات وبناء مشاريع عملية رصينة.',
      }),
    }),
  }),

  contactPlatforms: Object.freeze([
    Object.freeze({
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'linkedin',
      url: 'https://www.linkedin.com/in/salman-alharbi-data-scientist',
      audience: 'all',
    }),
    Object.freeze({
      id: 'portfolio',
      name: 'البورتفوليو والأعمال',
      icon: 'portfolio',
      url: 'https://salman-qq.github.io/Portfolio/',
      audience: 'all',
    }),
  ]),
});

/**
 * يُرجع منصات التواصل المناسبة لجمهور البطاقة (`b2b` أو `individual`).
 * أي منصة جمهورها `all` تظهر في البطاقتين تلقائياً.
 *
 * @param {'b2b' | 'individual'} targetAudience
 * @param {readonly { id: string, name: string, icon: string, url: string, audience: AudienceType }[]} [platforms]
 */
export function getPlatformsForAudience(
  targetAudience,
  platforms = CONTENT_CATALOG.contactPlatforms
) {
  return platforms.filter(
    (p) => p.audience === targetAudience || p.audience === 'all'
  );
}

