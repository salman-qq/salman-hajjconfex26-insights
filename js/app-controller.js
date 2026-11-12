/**
 * منسّق التطبيق (App Controller).
 *
 * يملك حالة المحاكي الوحيدة ويوزّع الأحداث على محرك المحاكي وطبقة العرض.
 * في التذكرة 01 هو مكان محجوز فقط؛ الحالات الكاملة تأتي في التذاكر 02–05
 * (انظر مخطط الحالة في SPEC.md).
 *
 * قيد معماري: جافاسكربت متصفح قياسية فقط، بلا أي استيراد خاص بـ Node،
 * ولا يلمس DOM وقت الاستيراد، حتى يمكن استيراده في اختبارات Node.
 */

/** @typedef {'idle'} SimulatorStatus */

/**
 * @returns {{ getState: () => { simulator: SimulatorStatus }, start: (doc: Document) => void }}
 */
export function createAppController() {
  /** @type {{ simulator: SimulatorStatus }} */
  const state = { simulator: 'idle' };

  return {
    getState() {
      return { ...state };
    },

    /** يربط المنسّق بالصفحة. لا يُستدعى إلا في المتصفح. */
    start(doc) {
      doc.documentElement.classList.add('js');

      const yearEl = doc.querySelector('[data-year]');
      if (yearEl) yearEl.textContent = String(new Date().getFullYear());
    },
  };
}

