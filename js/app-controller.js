/**
 * منسّق التطبيق (App Controller).
 *
 * يملك حالة المحاكي الوحيدة ويوزّع الأحداث على محرك المحاكي وطبقة العرض.
 * قيد معماري: جافاسكربت متصفح قياسية فقط، بلا أي استيراد خاص بـ Node،
 * ولا يلمس DOM وقت الاستيراد، حتى يمكن استيراده في اختبارات Node.
 */
import { CONTENT_CATALOG } from './content-catalog.js';
import { renderHeroHtml, renderContactHtml } from './views.js';

/** @typedef {'idle'} SimulatorStatus */

/**
 * ينتظر انتهاء التمرير البرمجي مع بديل للمتصفحات التي لا تُرجع Promise من scrollIntoView.
 *
 * @param {Element} element
 * @param {ScrollIntoViewOptions} options
 * @param {Window} [scroller]
 * @returns {Promise<void>}
 */
function scrollIntoViewAsync(element, options, scroller) {
  const result = element.scrollIntoView(options);
  if (result instanceof Promise) {
    return result;
  }
  if (!scroller || options?.behavior === 'instant') {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let timeoutId;
    const finish = () => {
      clearTimeout(timeoutId);
      scroller.removeEventListener('scrollend', finish);
      scroller.removeEventListener('scroll', onScroll);
      resolve();
    };
    const onScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(finish, 100);
    };
    scroller.addEventListener('scrollend', finish, { once: true });
    scroller.addEventListener('scroll', onScroll, { passive: true });
    timeoutId = setTimeout(finish, 100);
  });
}

/**
 * @param {typeof CONTENT_CATALOG} [catalog]
 * @returns {{ getState: () => { simulator: SimulatorStatus }, start: (doc: Document) => void }}
 */
export function createAppController(catalog = CONTENT_CATALOG) {
  /** @type {{ simulator: SimulatorStatus }} */
  const state = { simulator: 'idle' };
  let currentScrollId = 0;

  return {
    getState() {
      return { ...state };
    },

    /** يربط المنسّق بالصفحة. لا يُستدعى إلا في المتصفح. */
    start(doc) {
      doc.documentElement.classList.add('js');

      const heroMount = doc.getElementById('hero-content');
      if (heroMount) {
        heroMount.innerHTML = renderHeroHtml(catalog);
      }

      const contactMount = doc.getElementById('contact-content');
      if (contactMount) {
        contactMount.innerHTML = renderContactHtml(catalog);
      }

      const yearEl = doc.querySelector('[data-year]');
      if (yearEl) yearEl.textContent = String(new Date().getFullYear());

      doc.addEventListener('click', async (event) => {
        const trigger =
          event.target instanceof Element
            ? event.target.closest('[data-scroll-target]')
            : null;
        if (!trigger) return;

        const targetId = trigger.getAttribute('data-scroll-target');
        const targetSection = targetId ? doc.getElementById(targetId) : null;
        if (!targetSection) return;

        event.preventDefault();
        const scrollId = ++currentScrollId;
        const win = doc.defaultView;
        const reducedMotion = Boolean(
          win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        );

        await scrollIntoViewAsync(
          targetSection,
          { behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' },
          win || undefined
        );

        if (scrollId !== currentScrollId) return;

        if (win?.history?.replaceState) {
          win.history.replaceState(null, '', `#${targetId}`);
        }

        const focusTarget =
          targetSection.querySelector('h1, h2, [tabindex="-1"]') || targetSection;
        if (focusTarget instanceof HTMLElement) {
          focusTarget.focus({ preventScroll: true });
        }
      });
    },
  };
}
