/**
 * كتالوج المحتوى (Content Catalog).
 *
 * المصدر الوحيد لنصوص الواجهة ومنصات التواصل ومحاور الأثر والقطاعات.
 * قيد معماري: جافاسكربت متصفح قياسية فقط، بلا منطق عرض ولا DOM ولا استيراد من Node.
 */

/** @typedef {'b2b' | 'individual' | 'all'} AudienceType */
/** @typedef {'husk' | 'foundation'} SimulatorPath */

/** القيم المسموحة لحقل الجمهور في منصات التواصل. */
export const VALID_AUDIENCES = Object.freeze(['b2b', 'individual', 'all']);

/** القيم المسموحة لمسار الرحلة المبسطة. */
export const VALID_PATHS = Object.freeze(['husk', 'foundation']);

/** القيم المسموحة لأنماط المحاكي. */
export const VALID_MODES = Object.freeze(['quick', 'builder']);

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

  simulatorUi: Object.freeze({
    eyebrow: 'محاكي القرارات التفاعلي',
    title: 'ماذا ستبني أولاً في منشأتك؟',
    intro:
      'اختر قطاع شركتك الافتراضية، ثم اتخذ قرارك التقني الأول لتشاهد كيف تتساقط حلقات سلسلة الأثر (تأثير الدومينو) واحدة تلو الأخرى.',
    stepSectorTitle: '1. اختر قطاع منشأتك',
    stepPathTitle: '2. اتخذ قرارك التقني الأول',
    regulatoryRefEyebrow: 'مرجع تنظيمي رسمي',
    regulatoryRefExternalHint: '(يُفتح في نافذة جديدة)',
    modes: Object.freeze({
      quick: Object.freeze({
        id: 'quick',
        label: 'الرحلة المبسطة',
        hint: 'قرار واحد سريع يعرض سلسلة الأثر بلغة عامة',
      }),
      builder: Object.freeze({
        id: 'builder',
        label: 'الرؤية المعمقة',
        hint: 'رتّب خطة البناء من 4 لبنات واحصل على تقييم استراتيجي',
      }),
    }),
    builder: Object.freeze({
      stepTitle: '2. ابنِ خطة البناء من 4 لبنات بالترتيب',
      stepIntro:
        'اختر 4 لبنات تقنية فقط من أصل 8 لبنات متاحة بالنقر أو لوحة المفاتيح. ترتيب اختيارك هو ترتيب الأولوية في التنفيذ.',
      chooseSectorPrompt:
        'اختر قطاع منشأتك من البطاقات أعلاه أولاً لتبدأ ببناء خطتك وتقييمها.',
      poolTitle: 'اللبنات التقنية المتاحة (5 لبنات أساس + 3 لبنات ذكاء)',
      foundationBadge: 'لبنة أساس',
      aiBadge: 'لبنة ذكاء',
      placedBadgePrefix: 'في الخانة',
      slotsTitle: 'خطة البناء الخاصة بك (4 خانات مرتبة)',
      emptySlotHint: 'اختر لبنة من القائمة أعلاه',
      removeHintLabel: 'إزالة من الخطة',
      evaluateLabel: 'قيّم خطتي',
      missingSinglePrefix: 'اختر لبنة واحدة إضافية',
      missingPluralPrefix: 'متبقٍ',
      missingPluralSuffix: 'لبنات لتكتمل الخانات الأربع قبل التقييم.',
      readyToEvaluateHint: 'اكتملت الخانات الأربع — اضغط «قيّم خطتي» لاحتساب التقييم الاستراتيجي.',
      resultTitle: 'التقييم الاستراتيجي لخطة البناء',
      scoreOutOfLabel: 'من',
      readinessLabel: 'مستوى الجاهزية:',
      chainTitle: 'سلسلة الأثر المترتبة على خطتك',
      chainSubtitle:
        'تحليل معمق لمحاور الحوكمة الخمسة والأثر القطاعي بناءً على اللبنات التي اخترتها:',
      positiveLinkBadge: 'أثر إيجابي',
      negativeLinkBadge: 'أثر سلبي',
      missedTitle: 'الفرص الفائتة',
      missedSubtitle:
        'محاور تأسيسية أو قدرات متقدمة لم تغطّها الخطة الحالية وكان يمكن أن تعزّز الجاهزية:',
      missedAllCoveredNote: 'لا توجد فرص فائتة إضافية ضمن نطاق هذه الخطة.',
      missedAiOpportunity: Object.freeze({
        id: 'ai-on-ready-foundation',
        axisId: null,
        categoryLabel: 'فرصة الذكاء الاصطناعي',
        icon: 'spark',
        title: 'قيمة الذكاء الاصطناعي على أساس جاهز',
        simple:
          'بعد تأسيس البيانات، تصبح المنشأة جاهزة لإطلاق الذكاء الاصطناعي وتحقيق عائد ملموس من التنبؤ وأتمتة القرارات.',
        expert:
          'اكتفى البناء التأسيسي بالبنية التحتية دون تفعيل لبنة ذكاء اصطناعي، ما يؤجّل الاستفادة من التنبؤ بالطلب أو التوجيه الذكي فوق هذا الأساس المتين؛ المنهجية السليمة هي: الأساس أولاً ثم الذكاء فوقه.',
      }),
      warningsTitle: 'تنبيهات «ذكاء فوق الرمال»',
      warningsSubtitle:
        'إطلاق الذكاء الاصطناعي قبل بناء الحد الأدنى من لبنات الأساس يضعف موثوقية مخرجاته ويزيد مخاطر التعثر:',
      sandWarningTitle: 'ذكاء فوق الرمال',
      sandWarningActionLead: 'وُضعت في الخانة',
      sandWarningReason:
        'قبل استكمال لبنتي أساس على الأقل — الأساس أولاً ثم الذكاء فوقه ليقدّم التنبؤ أو المساعد الذكي قيمة موثوقة.',
      rebuildLabel: 'أعد البناء',
    }),
    paths: Object.freeze({
      husk: Object.freeze({
        id: 'husk',
        label: 'أطلق الذكاء الاصطناعي الآن',
        subtitle: 'مسار القشور — نماذج سريعة ومبهرة للإدارة قبل تأسيس البنية التحتية',
        icon: 'spark',
        resultTitle: 'نتيجة مسار القشور: سلسلة أثر سلبية تنتهي بتعثر المشروع',
        resultSummary:
          'الاندفاع خلف واجهات ذكاء اصطناعي سريعة فوق بيانات مبعثرة يخلق اختناقاً مؤسسياً متسلسلاً ينتهي بتعطل النظام وفقدان الثقة.',
      }),
      foundation: Object.freeze({
        id: 'foundation',
        label: 'ابنِ الأساس أولاً',
        subtitle: 'مسار الأساس — حوكمة البيانات وتوحيد المصادر قبل إطلاق الذكاء الاصطناعي',
        icon: 'layers',
        resultTitle: 'نتيجة مسار الأساس: سلسلة أثر إيجابية تنتهي بالاستدامة والجاهزية',
        resultSummary:
          'تأسيس حوكمة البيانات وتوحيد المصادر أولاً يحوّل المنشأة إلى بيئة مستدامة جاهزة لدمج الكفاءات وتحقيق عائد حقيقي من الذكاء الاصطناعي.',
      }),
    }),
    switchPathLabel: 'جرّب المسار الآخر',
    toBuilderLabel: 'انتقل للرؤية المعمقة',
  }),

  /** محاور الأثر الخمسة بالترتيب المعتمد: المعرفة ← الكفاءات ← الامتثال ← المال ← الاستدامة */
  axes: Object.freeze([
    Object.freeze({
      id: 'knowledge',
      name: 'المعرفة المؤسسية',
      negativeLink: Object.freeze({
        icon: 'lock',
        title: 'معرفة محبوسة وأزمة استقالة المبرمج الرئيسي',
        simple:
          'تتركز أسرار النظام في رأس مبرمج واحد، فإذا استقال تتعطل العمليات لأن أحداً لا يعرف كيف يعمل النموذج.',
        expert:
          'معرفة محبوسة (Siloed Knowledge): غياب التوثيق المعماري يحوّل استقالة المبرمج الرئيسي إلى اختناق مؤسسي يشلّ المنظومة.',
      }),
      positiveLink: Object.freeze({
        icon: 'book',
        title: 'معرفة موثقة واستمرارية لا تتأثر بالأفراد',
        simple:
          'كل إجراء ومصدر بيانات موثق بوضوح، فلا يتوقف العمل ولا تضيع الخبرة عند انتقال أو مغادرة أي موظف.',
        expert:
          'حوكمة المعرفة وتوثيق القواميس والأنظمة يمنعان نشوء معرفة محبوسة ويضمنان استمرارية التشغيل دون ارتهان للأفراد.',
      }),
    }),
    Object.freeze({
      id: 'talent',
      name: 'الكفاءات والدمج الوظيفي',
      negativeLink: Object.freeze({
        icon: 'user-alert',
        title: 'ضياع المتدرب الخريج وإصابته بالاحتراق الوظيفي',
        simple:
          'يدخل الموظف الجديد والمتدرب الخريج (GDP) بيئة فوضوية بلا أدلة واضحة، فيستغرق شهوراً ليفهم العمل ويصاب بالإرهاق.',
        expert:
          'تعثر الدمج الوظيفي (Onboarding) للمتدرب الخريج (GDP) والكفاءات الجديدة نتيجة غياب الأدلة، ما يفاقم الاحتراق الوظيفي (Burnout).',
      }),
      positiveLink: Object.freeze({
        icon: 'users',
        title: 'دمج وظيفي سريع وواجهة مهنية جاذبة',
        simple:
          'يبدأ الموظف الجديد والمتدرب الخريج (GDP) إنتاجيته من اليوم الأول بفضل أدلة عمل واضحة وبيئة منظمة.',
        expert:
          'بنية تحتية موثقة تسرّع الدمج الوظيفي (Onboarding) للمتدرب الخريج (GDP) من اليوم الأول وتجعل المنشأة واجهة مهنية جاذبة.',
      }),
    }),
    Object.freeze({
      id: 'compliance',
      name: 'الامتثال وحماية البيانات',
      negativeLink: Object.freeze({
        icon: 'shield-alert',
        title: 'تصادم مع PDPL ومخاطر تسريب البيانات',
        simple:
          'تُغذّى نماذج الذكاء الاصطناعي ببيانات حساسة دون تصنيف أو ضوابط، ما يعرّض الشركة لمخالفات نظامية وعقوبات.',
        expert:
          'غياب تصنيف البيانات وضوابط الوصول يؤدي إلى خروقات وتصادم مباشر مع نظام حماية البيانات الشخصية (PDPL).',
        regulatoryRefId: 'sdaia',
      }),
      positiveLink: Object.freeze({
        icon: 'shield-check',
        title: 'امتثال تام للوائح NDMO ونظام PDPL',
        simple:
          'بيانات مصنفة ومحمية بصلاحيات واضحة تتوافق مع الأنظمة الوطنية وتحمي سمعة المنشأة وثقة ضيوف الرحمن.',
        expert:
          'امتثال مؤسسي متكامل لمعايير مكتب إدارة البيانات الوطنية (NDMO) ونظام حماية البيانات الشخصية (PDPL).',
        regulatoryRefId: 'ndmo',
      }),
    }),
    Object.freeze({
      id: 'finance',
      name: 'الكفاءة المالية والعائد',
      negativeLink: Object.freeze({
        icon: 'flame',
        title: 'هدر سحابي وتكاليف استبدال الموظفين المغادرين',
        simple:
          'فواتير معالجة سحابية متضخمة لتشغيل نماذج عشوائية، تضاف إليها كلفة توظيف وتدريب بدلاء للموظفين المنهكين.',
        expert:
          'هدر سحابي ناتج عن معالجة بيانات غير موحدة، مترافق مع ارتفاع تكلفة الاستبدال بسبب الدوران الوظيفي.',
      }),
      positiveLink: Object.freeze({
        icon: 'chart',
        title: 'مؤشرات أداء واضحة وعائد استثماري محسوب',
        simple:
          'ترى الإدارة بوضوح أين تذهب الميزانية ومتى يتحقق العائد المالي بفضل مؤشرات أداء مرتبطة بأهداف الشركة.',
        expert:
          'مؤشرات أداء (KPIs) دقيقة تضبط الإنفاق السحابي وتقيس العائد على الاستثمار (ROI) لكل مبادرة تقنية.',
      }),
    }),
    Object.freeze({
      id: 'sustainability',
      name: 'الاستدامة والجاهزية الاستثمارية',
      negativeLink: Object.freeze({
        icon: 'broken-link',
        title: 'فشل المشروع وانعدام مسار التدقيق الكامل',
        simple:
          'ينهار المشروع عند أول اختبار حقيقي لأن الأرقام متضاربة ولا أحد يستطيع تتبّع من أين جاءت النتيجة.',
        expert:
          'فشل المبادرة التقنية وانعدام مسار التدقيق (Data Lineage)، مما يفقد الإدارة والمستثمرين الثقة في مخرجات النظام.',
      }),
      positiveLink: Object.freeze({
        icon: 'award',
        title: 'استدامة تشغيلية واستقرار وجاهزية للتقييم الاستثماري',
        simple:
          'تستقر الكفاءات وتبني الشركة أصول بيانات موثوقة ترفع قيمتها وتجعلها جاهزة لأي توسع أو تقييم استثماري.',
        expert:
          'توحيد المصادر واكتمال مسار التدقيق (Data Lineage) يخفضان الدوران الوظيفي ويرفعان الجاهزية الاستثمارية للمنشأة.',
      }),
    }),
  ]),

  /** فئات القطاعات بترتيب عرضها في الواجهة. */
  sectorCategories: Object.freeze([
    Object.freeze({
      id: 'field',
      title: 'خدمات ميدانية',
      description: 'شركات تخدم الحجاج مباشرة في المشاعر والمخيمات والمساكن.',
    }),
    Object.freeze({
      id: 'support',
      title: 'خدمات مساندة',
      description: 'شركات تشغّل الإمداد والتعاقد والخدمات المتكاملة خلف الكواليس.',
    }),
  ]),

  /** القطاعات السبعة. إضافة قطاع جديد تتطلب إضافة بياناته هنا فقط. */
  sectors: Object.freeze([
    Object.freeze({
      id: 'catering',
      name: 'شركة الإعاشة',
      category: 'field',
      icon: 'utensils',
      profile: Object.freeze({
        businessGoal:
          'تقدير الطلب على الوجبات بدقة لكل مخيم وتقليص الهدر الغذائي وتكاليف التخزين.',
        socialImpact:
          'وجبات صحية تصل في وقتها لضيوف الرحمن، وفرص عمل وطنية في التخطيط الغذائي وسلامة الغذاء.',
      }),
      negativeLink: Object.freeze({
        icon: 'utensils',
        title: 'وجبات متأخرة وهدر غذائي متكرر',
        simple:
          'يقدّر نموذج الطلب كميات الوجبات من بيانات مخيمات مكررة وغير محدّثة، فتتأخر وجبات مخيم وتُهدر وجبات مخيم آخر.',
        expert:
          'تقدير الطلب (Demand Forecasting) فوق سجلات إشغال مخيمات غير موحدة ينتج فائضاً وعجزاً متزامنين ويضاعف الهدر الغذائي.',
      }),
      positiveLink: Object.freeze({
        icon: 'utensils',
        title: 'كميات دقيقة لكل مخيم',
        simple:
          'تتدفق أعداد الحجاج الفعلية لكل مخيم من مصدر موحد، فتُجهَّز الوجبات بالكمية المناسبة وفي الوقت المناسب.',
        expert:
          'مصدر موحد لبيانات الإشغال (Single Source of Truth) يغذي نماذج تقدير الطلب ويضبط الإنتاج والتوزيع ويقلص الهدر.',
      }),
    }),
    Object.freeze({
      id: 'shuttle',
      name: 'شركة النقل الترددي',
      category: 'field',
      icon: 'bus',
      profile: Object.freeze({
        businessGoal:
          'تسريع دوران الحافلات بين المشاعر وتقليص زمن انتظار الحجاج في المحطات.',
        socialImpact:
          'تفويج آمن ومنتظم يريح ضيوف الرحمن، وتوطين وظائف التشغيل الميداني والتقني للكوادر الوطنية.',
      }),
      negativeLink: Object.freeze({
        icon: 'bus-alert',
        title: 'تأخر الحافلات وتعطل نظام الجدولة الذكي',
        simple:
          'يتعطل نموذج التنبؤ بحركة الحافلات في ذروة النفرة لأن بيانات المحطات غير موحدة ولا أحد يفهم كيف يصححها.',
        expert:
          'توقف جدولة النقل الترددي ميدانياً نتيجة تغذية النموذج ببيانات محطات متضاربة بلا توحيد للمصادر أو مسار تدقيق.',
      }),
      positiveLink: Object.freeze({
        icon: 'bus',
        title: 'جداول رحلات تتكيف مع كثافة الحجاج',
        simple:
          'تتدفق بيانات المحطات والأسطول من مصدر موحد، فتتوزع الحافلات بدقة حسب كثافة الحجاج الفعلية دون تكدس.',
        expert:
          'توحيد مصادر بيانات الأسطول والمحطات يمكّن نماذج الجدولة من موازنة الترددات لحظياً على أساس بيانات موثوق.',
      }),
    }),
    Object.freeze({
      id: 'crowd',
      name: 'شركة إدارة الحشود',
      category: 'field',
      icon: 'crowd',
      profile: Object.freeze({
        businessGoal:
          'رصد الكثافات في الجسور والممرات والمحطات لحظياً ودعم قرارات التفويج قبل حدوث التكدس.',
        socialImpact:
          'سلامة ضيوف الرحمن وانسيابية حركتهم، وتأهيل كوادر وطنية في تحليل البيانات الميدانية وإدارة العمليات.',
      }),
      negativeLink: Object.freeze({
        icon: 'crowd',
        title: 'إنذارات كثافة خاطئة تربك الميدان',
        simple:
          'تصل إنذارات تكدس من حساسات وكاميرات لا تتفق قراءاتها، فيتلقى الفريق الميداني أوامر متضاربة ويفقد الثقة في النظام.',
        expert:
          'غياب معايرة مصادر الاستشعار وضوابط جودة البيانات (Data Quality) يرفع الإنذارات الكاذبة (False Alarms) ويعطّل القرار الميداني.',
      }),
      positiveLink: Object.freeze({
        icon: 'crowd',
        title: 'قراءات كثافة موثوقة تدعم القرار',
        simple:
          'تتوحد قراءات الحساسات والكاميرات وفق معايير واضحة، فيتخذ الفريق الميداني قرار التفويج بثقة وفي الوقت المناسب.',
        expert:
          'معايير جودة بيانات وقواعد توحيد لمصادر الاستشعار تجعل لوحات الكثافة أداة قرار ميداني موثوقة.',
      }),
    }),
    Object.freeze({
      id: 'housing',
      name: 'شركة الإسكان والضيافة',
      category: 'field',
      icon: 'building',
      profile: Object.freeze({
        businessGoal:
          'تسكين الحجاج بسرعة ودقة وإدارة الطاقة الاستيعابية للفنادق والمساكن دون تعارض.',
        socialImpact:
          'استقبال كريم وراحة لضيوف الرحمن منذ لحظة الوصول، وتوطين وظائف الضيافة وإدارة المرافق.',
      }),
      negativeLink: Object.freeze({
        icon: 'building',
        title: 'حجوزات متضاربة وغرف مكررة',
        simple:
          'تتعارض بيانات الحجوزات بين أنظمة الوكلاء والفنادق، فيصل حجاج إلى غرف محجوزة لغيرهم وتطول طوابير الاستقبال.',
        expert:
          'تعدد سجلات الحاج دون إدارة للبيانات المرجعية (Master Data Management) يولّد حجوزات مكررة وتعارضاً في التسكين.',
      }),
      positiveLink: Object.freeze({
        icon: 'building',
        title: 'تسكين سلس وسجلات حجاج دقيقة',
        simple:
          'لكل حاج سجل واحد موحد يربط الحجز بالغرفة، فيتم التسكين بسلاسة منذ لحظة الوصول.',
        expert:
          'سجل مرجعي موحد للحاج (Golden Record) يربط أنظمة الحجز والتسكين ويقضي على الازدواجية.',
      }),
    }),
    Object.freeze({
      id: 'logistics',
      name: 'شركة اللوجستيات',
      category: 'support',
      icon: 'truck',
      profile: Object.freeze({
        businessGoal:
          'نقل المعدات والمؤن من المستودعات إلى المشاعر في نوافذ زمنية ضيقة دون انقطاع.',
        socialImpact:
          'إمداد مستقر يضمن جاهزية الخدمات لضيوف الرحمن، وفرص وطنية في تخطيط سلاسل الإمداد وتشغيل المستودعات.',
      }),
      negativeLink: Object.freeze({
        icon: 'truck',
        title: 'شحنات عالقة بلا تتبّع',
        simple:
          'تختفي شحنات بين المستودع والمشعر لأن كل طرف يسجلها بطريقته، فلا يعرف أحد أين توقفت ولا متى تصل.',
        expert:
          'غياب معرّفات موحدة للشحنات ومسار تدقيق بين الأطراف يُفقد سلسلة الإمداد الرؤية الكاملة (End-to-End Visibility).',
      }),
      positiveLink: Object.freeze({
        icon: 'truck',
        title: 'تتبّع واضح من المستودع للمشعر',
        simple:
          'تُسجَّل كل شحنة بمعرّف واحد يتتبعه الجميع، فتعرف الإدارة موقعها وموعد وصولها في كل لحظة.',
        expert:
          'معرّفات موحدة ومسار تدقيق (Data Lineage) للشحنات يمنحان رؤية كاملة لسلسلة الإمداد ويمكّنان التنبؤ بالتأخير.',
      }),
    }),
    Object.freeze({
      id: 'supply',
      name: 'شركة التوريد',
      category: 'support',
      icon: 'clipboard',
      profile: Object.freeze({
        businessGoal:
          'إنجاز التوريد في مواعيده واختيار الموردين الأكفأ بشفافية قبل انطلاق الموسم.',
        socialImpact:
          'خدمات مكتملة لضيوف الرحمن دون نقص، ودعم المحتوى المحلي والموردين الوطنيين بفرص عادلة.',
      }),
      negativeLink: Object.freeze({
        icon: 'clipboard',
        title: 'توريد متأخر وعقود بلا مؤشرات',
        simple:
          'تُوقَّع العقود وتُجدَّد دون بيانات أداء سابقة، فيتكرر تأخر الموردين أنفسهم في كل موسم.',
        expert:
          'غياب بيانات أداء الموردين ومؤشرات العقود (Contract KPIs) يحوّل قرار الترسية إلى اجتهاد ويكرر مخاطر التوريد.',
      }),
      positiveLink: Object.freeze({
        icon: 'clipboard',
        title: 'موردون مقيَّمون بمؤشرات أداء',
        simple:
          'لكل مورد سجل أداء واضح من المواسم السابقة، فتُرسى العقود على الأكفأ ويصل التوريد في موعده.',
        expert:
          'قاعدة بيانات موردين محكومة بمؤشرات أداء (Supplier Scorecards) تدعم قرارات ترسية شفافة ومبنية على الأدلة.',
      }),
    }),
    Object.freeze({
      id: 'operator',
      name: 'شركة مشغّل خدمات الحجاج',
      category: 'support',
      icon: 'headset',
      profile: Object.freeze({
        businessGoal:
          'تقديم منظومة خدمات مترابطة للحاج من الوصول إلى المغادرة ورفع رضاه وثقته.',
        socialImpact:
          'تجربة حج ميسّرة تليق بضيوف الرحمن، وتوطين وظائف خدمة العملاء وتحليل تجربة المستفيد.',
      }),
      negativeLink: Object.freeze({
        icon: 'headset',
        title: 'شكاوى حجاج تتكرر دون معالجة',
        simple:
          'تتوزع شكاوى الحاج بين النقل والسكن والإعاشة في أنظمة منفصلة، فتُغلق كل شكوى وحدها ويبقى السبب الحقيقي قائماً.',
        expert:
          'تشتت بيانات تجربة الحاج بين الأنظمة يمنع تحليل السبب الجذري (Root Cause Analysis) ويكرر الإخفاقات نفسها.',
      }),
      positiveLink: Object.freeze({
        icon: 'headset',
        title: 'تجربة حاج متصلة من الوصول للمغادرة',
        simple:
          'تجتمع بيانات الحاج من كل الخدمات في رؤية واحدة، فتُعالج أسباب الشكاوى من جذورها قبل أن تتكرر.',
        expert:
          'رؤية موحدة لرحلة الحاج (Unified Pilgrim Journey) تربط بيانات الخدمات وتكشف السبب الجذري لكل إخفاق.',
      }),
    }),
  ]),

  /** اللبنات التقنية الثماني لأداة البناء في الرؤية المعمقة: 5 لبنات أساس + 3 لبنات ذكاء */
  blocks: Object.freeze([
    Object.freeze({
      id: 'docs-knowledge',
      name: 'توثيق الأنظمة والمعرفة',
      type: 'foundation',
      axisId: 'knowledge',
      icon: 'book',
      description: 'توثيق مصادر البيانات والأنظمة لمنع احتباس المعرفة في الأفراد.',
    }),
    Object.freeze({
      id: 'gdp-onboarding',
      name: 'أدلة الدمج ومسار الخريجين',
      type: 'foundation',
      axisId: 'talent',
      icon: 'users',
      description: 'أدلة عمل ومسارات واضحة تدمج الخريجين والموظفين الجدد من اليوم الأول.',
    }),
    Object.freeze({
      id: 'data-classification',
      name: 'تصنيف البيانات وحمايتها',
      type: 'foundation',
      axisId: 'compliance',
      icon: 'shield-check',
      description: 'ضوابط صلاحيات وتصنيف للبيانات تتوافق مع متطلبات PDPL وNDMO.',
    }),
    Object.freeze({
      id: 'kpi-roi',
      name: 'مؤشرات الأداء وقياس العائد',
      type: 'foundation',
      axisId: 'finance',
      icon: 'chart',
      description: 'ربط الإنفاق التقني والسحابي بمؤشرات أداء تقيس العائد الاستثماري بدقة.',
    }),
    Object.freeze({
      id: 'source-lineage',
      name: 'توحيد المصادر ومسار التدقيق',
      type: 'foundation',
      axisId: 'sustainability',
      icon: 'layers',
      description: 'مصدر بيانات موثوق واحد مع مسار تدقيق كامل يدعم الجاهزية الاستثمارية.',
    }),
    Object.freeze({
      id: 'ai-forecast',
      name: 'نموذج تنبؤي بالذكاء الاصطناعي',
      type: 'ai',
      axisId: null,
      icon: 'spark',
      description: 'تنبؤ بالطلب والكثافات والجدولة يعتمد كلياً على جودة بياناته الأساسية.',
    }),
    Object.freeze({
      id: 'ai-assistant',
      name: 'مساعد ذكي للحجاج',
      type: 'ai',
      axisId: null,
      icon: 'chat',
      description: 'تفاعل ذكي فوري يوجّه ضيوف الرحمن ويعالج استفساراتهم خلال الرحلة.',
    }),
    Object.freeze({
      id: 'ai-dashboard',
      name: 'لوحة عرض مبهرة للإدارة',
      type: 'ai',
      axisId: null,
      icon: 'monitor',
      description: 'شاشات تنفيذية بصرية تعكس ثقة القرار بقدر موثوقية البيانات خلفها.',
    }),
  ]),

  /** قواعد التقييم الاستراتيجي وحدود مستويات الجاهزية محفوظة في الكتالوج دون قيم ثابتة في المنطق */
  scoring: Object.freeze({
    planSize: 4,
    maxScore: 100,
    foundationPoints: 20,
    minFoundationBeforeAi: 2,
    aiOnFoundationPoints: 20,
    aiOnSandPoints: 5,
    orderBonus: 20,
    tiers: Object.freeze([
      Object.freeze({
        id: 'investment-ready',
        label: 'جاهزة للاستثمار',
        minScore: 80,
        tone: 'positive',
        summary:
          'أساس بيانات محكوم يسبقه تخطيط منضبط، والذكاء الاصطناعي مبني فوق قاعدة صلبة تحقق عائداً مستداماً.',
      }),
      Object.freeze({
        id: 'on-track',
        label: 'على الطريق',
        minScore: 50,
        tone: 'warning',
        summary:
          'خطوات تأسيسية واعدة، لكن ترتيب الأولويات أو الفجوات في بعض محاور الحوكمة لا يزال بحاجة إلى استكمال.',
      }),
      Object.freeze({
        id: 'at-risk',
        label: 'في خطر',
        minScore: 0,
        tone: 'negative',
        summary:
          'الاندفاع نحو واجهات ذكاء اصطناعي قبل بناء البنية التحتية يهدد بتعثر التشغيل وهدر الميزانية ومخاطر الامتثال.',
      }),
    ]),
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

  /** المراجع التنظيمية للامتثال (سدايا وNDMO): صور مصغرة مرسومة محلياً وروابط رسمية متحقق منها (2026-11-13) */
  regulatoryReferences: Object.freeze([
    Object.freeze({
      id: 'sdaia',
      name: 'سدايا (SDAIA) — نظام حماية البيانات الشخصية (PDPL)',
      shortLabel: 'سدايا · PDPL',
      subtitle: 'الهيئة السعودية للبيانات والذكاء الاصطناعي',
      thumbnailKey: 'sdaia',
      url: 'https://sdaia.gov.sa/',
      verifiedAt: '2026-11-13',
    }),
    Object.freeze({
      id: 'ndmo',
      name: 'مكتب إدارة البيانات الوطنية (NDMO)',
      shortLabel: 'NDMO · حوكمة البيانات',
      subtitle: 'المعايير الوطنية لإدارة البيانات وحمايتها',
      thumbnailKey: 'ndmo',
      url: 'https://dgp.sdaia.gov.sa/wps/portal/pdp/about/aboutoffice',
      verifiedAt: '2026-11-13',
    }),
  ]),

  insights: Object.freeze({
    eyebrow: 'لقطات استشارية',
    title: 'ما رأيته في المعرض، وما يعنيه لبنيتك التحتية',
    subtitle:
      'مشاهدات تقنية من أجنحة #hajjconfex2026 تبرز الفرق بين إبهار العرض اللحظي ومتانة البنية التحتية خلفه — اضغط على أي لقطة لتكبيرها وقراءة الزاوية الاستشارية.',
    placeholderBadge: 'صورة المعرض ستُضاف قريباً',
    expandHint: 'تكبير اللقطة',
    closeLabel: 'إغلاق المعاينة',
    lightboxBackdropHint:
      'يمكنك الإغلاق بالضغط على زر الإغلاق أو مفتاح Escape أو خارج النافذة.',
    defaultImageSrc: 'assets/insights/insight-01.svg',
    defaultWidth: 800,
    defaultHeight: 500,
    items: Object.freeze([
      Object.freeze({
        id: 'crowd-density-monitor',
        tag: 'رصد ميداني ذكي',
        title: 'لوحات رصد الكثافات اللحظية',
        imageSrc: 'assets/insights/insight-01.svg',
        width: 800,
        height: 500,
        isPlaceholder: true,
        alt: 'رسم توضيحي بديل لشاشة رصد كثافات ميدانية ونقاط استشعار متصلة بالشبكة',
        commentary:
          'شاشات رصد الكثافات مبهرة في العرض الحي، لكن دقتها ميدانياً لا تتجاوز دقة توحيد المصادر وتصنيف البيانات لحظياً قبل وصول القراءات إلى الخوارزمية.',
      }),
      Object.freeze({
        id: 'fleet-telematics-hub',
        tag: 'إدارة الأساطيل والتفويج',
        title: 'منصات تتبّع الأسطول والنقل الترددي',
        imageSrc: 'assets/insights/insight-02.svg',
        width: 800,
        height: 500,
        isPlaceholder: true,
        alt: 'رسم توضيحي بديل لمسارات أسطول نقل ترددي ونقاط تتبّع مرتبطة بقاعدة بيانات مركزية',
        commentary:
          'التتبّع الذكي لحركة الحافلات يتعثر عند ذروة التفويج إذا بقيت بيانات المحطات والتشغيل معزولة في جداول منفصلة دون مصدر موحد ومسار تدقيق واضح.',
      }),
      Object.freeze({
        id: 'pilgrim-ai-assistant',
        tag: 'تفاعل رقمي وخدمة',
        title: 'المساعد الذكي متعدد اللغات لضيوف الرحمن',
        imageSrc: 'assets/insights/insight-03.svg',
        width: 800,
        height: 500,
        isPlaceholder: true,
        alt: 'رسم توضيحي بديل لشاشة مساعد رقمي ذكي مرتبطة بقواميس معرفة وضوابط نظام PDPL',
        commentary:
          'المساعد الذكي يكسب ثقة المستفيدين فقط حين يستند إلى قاعدة معرفة مؤسسية محدثة وموثقة، لا إلى بيانات متضاربة تعرّض البيانات الشخصية لمخاطر الامتثال لنظام PDPL.',
      }),
      Object.freeze({
        id: 'smart-catering-forecast',
        tag: 'سلاسل الإمداد والإعاشة',
        title: 'أنظمة التنبؤ الآلي بسلاسل الإعاشة والتوريد',
        imageSrc: 'assets/insights/insight-04.svg',
        width: 800,
        height: 500,
        isPlaceholder: true,
        alt: 'رسم توضيحي بديل لنموذج تنبؤ بالطلب يربط مستودعات التوريد بنقاط التوزيع',
        commentary:
          'نماذج التنبؤ بالكميات تحوّل البيانات التاريخية إلى قرار دقيق يوقف الهدر، بشرط بناء قواميس بيانات موحدة تربط المورّد والمستودع ونقطة التوزيع.',
      }),
      Object.freeze({
        id: 'digital-twin-ops',
        tag: 'ذكاء القرارات والقيادة',
        title: 'التوأم الرقمي ومراكز القيادة التنفيذية',
        imageSrc: 'assets/insights/insight-05.svg',
        width: 800,
        height: 500,
        isPlaceholder: true,
        alt: 'رسم توضيحي بديل لنموذج توأم رقمي ومؤشرات قيادة تنفيذية لعمليات المشاعر',
        commentary:
          'روعة التوأم الرقمي في قاعة العرض تُقاس بقدرته بعد الموسم: هل تغذّيه بنية تحتية للبيانات محكومة وتُسلَّم بسلاسة، أم ينقلب إلى معرفة محبوسة وهدر سحابي؟',
      }),
      Object.freeze({
        id: 'unified-compliance-governance',
        tag: 'حوكمة وامتثال',
        title: 'منصات تصنيف البيانات ومسار التدقيق',
        imageSrc: 'assets/insights/insight-06.svg',
        width: 800,
        height: 500,
        isPlaceholder: true,
        alt: 'رسم توضيحي بديل لمنصة حوكمة بيانات وتصنيف صلاحيات ومسار تدقيق نظامي',
        commentary:
          'هذه الطبقة الصامتة هي صمام الأمان الحقيقي لكل التقنيات السابقة؛ فهي تحفظ الامتثال لمعايير NDMO ونظام PDPL، وتجعل المنشأة على أتمّ الاستعداد للجاهزية الاستثمارية والدمج الوظيفي.',
      }),
    ]),
  }),
});

/**
 * يُرجع منصات التواصل المناسبة لجمهور البطاقة (`b2b` أو `individual`).
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
