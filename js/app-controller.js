/**
 * منسّق التطبيق (App Controller).
 *
 * يملك حالة المحاكي الوحيدة (`idle` ← `sectorChosen` ← `chainRevealed`)
 * ويوزّع الأحداث على محرك المحاكي وطبقة العرض.
 * قيد معماري: جافاسكربت متصفح قياسية فقط، بلا أي استيراد خاص بـ Node،
 * ولا يلمس DOM وقت الاستيراد، حتى يمكن استيراده في اختبارات Node.
 */
import { CONTENT_CATALOG } from './content-catalog.js';
import { buildChain } from './simulator-engine.js';
import { renderHeroHtml, renderSimulatorHtml, renderContactHtml } from './views.js';

/** @typedef {'idle' | 'sectorChosen' | 'chainRevealed'} SimulatorStatus */

const STEP_REVEAL_INTERVAL_MS = 120;

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
 */
export function createAppController(catalog = CONTENT_CATALOG) {
  const state = {
    /** @type {SimulatorStatus} */
    simulator: 'idle',
    /** @type {string | null} */
    sectorId: null,
    /** @type {'husk' | 'foundation' | null} */
    path: null,
    /** @type {readonly any[]} */
    chain: [],
  };

  let currentScrollId = 0;
  let currentRevealId = 0;
  /** @type {ReturnType<typeof setTimeout>[]} */
  let pendingTimers = [];
  /** @type {Document | null} */
  let mountedDoc = null;

  function clearRevealTimers() {
    currentRevealId += 1;
    for (const timer of pendingTimers) {
      clearTimeout(timer);
    }
    pendingTimers = [];
  }

  function isReducedMotion() {
    return Boolean(
      mountedDoc?.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    );
  }

  function updateSimulatorDom({ revealChain = false } = {}) {
    if (!mountedDoc) return;
    const simMount = mountedDoc.getElementById('simulator-content');
    if (!simMount) return;

    clearRevealTimers();
    const reduced = isReducedMotion();
    const animateSteps = revealChain && !reduced;

    simMount.innerHTML = renderSimulatorHtml(state, catalog, { animateSteps });

    if (revealChain) {
      const focusResultHeading = () => {
        const resultTitle = mountedDoc?.getElementById('chain-result-title');
        if (resultTitle instanceof HTMLElement) {
          resultTitle.focus({ preventScroll: true });
        }
      };

      if (!animateSteps) {
        focusResultHeading();
      } else {
        const revealToken = currentRevealId;
        const hiddenCards = [
          ...simMount.querySelectorAll('[data-domino-step][hidden]'),
        ];
        const actionsEl = simMount.querySelector('[data-chain-actions]');

        hiddenCards.forEach((card, idx) => {
          const timer = setTimeout(() => {
            if (revealToken !== currentRevealId) return;
            card.removeAttribute('hidden');
            if (idx === hiddenCards.length - 1) {
              if (actionsEl) actionsEl.removeAttribute('hidden');
              focusResultHeading();
            }
          }, (idx + 1) * STEP_REVEAL_INTERVAL_MS);
          pendingTimers.push(timer);
        });
      }
    }
  }

  return {
    getState() {
      return {
        simulator: state.simulator,
        sectorId: state.sectorId,
        path: state.path,
        chain: [...state.chain],
      };
    },

    /** يختار القطاع وينتقل إلى حالة sectorChosen. */
    selectSector(sectorId) {
      const exists = catalog.sectors.some((s) => s.id === sectorId);
      if (!exists) {
        throw new Error(`قطاع غير معروف: "${sectorId}"`);
      }
      state.simulator = 'sectorChosen';
      state.sectorId = sectorId;
      state.path = null;
      state.chain = [];
      updateSimulatorDom({ revealChain: false });
    },

    /** يختار المسار (husk أو foundation) ويبني السلسلة عبر محرك المحاكي. */
    selectPath(path) {
      if (!state.sectorId) {
        throw new Error('يجب اختيار القطاع قبل اختيار المسار');
      }
      const chain = buildChain(state.sectorId, path, catalog);
      state.simulator = 'chainRevealed';
      state.path = path;
      state.chain = chain;
      updateSimulatorDom({ revealChain: true });
    },

    /** يبدّل إلى المسار المقابل للقطاع نفسه. */
    switchOtherPath() {
      if (state.simulator !== 'chainRevealed' || !state.sectorId || !state.path) {
        return;
      }
      const nextPath = state.path === 'husk' ? 'foundation' : 'husk';
      this.selectPath(nextPath);
    },

    /** يربط المنسّق بالصفحة. لا يُستدعى إلا في المتصفح. */
    start(doc) {
      mountedDoc = doc;
      doc.documentElement.classList.add('js');

      const heroMount = doc.getElementById('hero-content');
      if (heroMount) {
        heroMount.innerHTML = renderHeroHtml(catalog);
      }

      updateSimulatorDom({ revealChain: false });

      const contactMount = doc.getElementById('contact-content');
      if (contactMount) {
        contactMount.innerHTML = renderContactHtml(catalog);
      }

      const yearEl = doc.querySelector('[data-year]');
      if (yearEl) yearEl.textContent = String(new Date().getFullYear());

      doc.addEventListener('click', async (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;

        const actionBtn = target.closest('[data-action]');
        if (actionBtn) {
          const action = actionBtn.getAttribute('data-action');
          if (action === 'select-sector') {
            const sectorId = actionBtn.getAttribute('data-sector-id');
            if (sectorId) this.selectSector(sectorId);
            return;
          }
          if (action === 'select-path') {
            const path = actionBtn.getAttribute('data-path');
            if (path === 'husk' || path === 'foundation') {
              this.selectPath(path);
            }
            return;
          }
          if (action === 'switch-path') {
            this.switchOtherPath();
            return;
          }
        }

        const scrollTrigger = target.closest('[data-scroll-target]');
        if (!scrollTrigger) return;

        const targetId = scrollTrigger.getAttribute('data-scroll-target');
        const targetSection = targetId ? doc.getElementById(targetId) : null;
        if (!targetSection) return;

        event.preventDefault();
        const scrollId = ++currentScrollId;
        const win = doc.defaultView;
        const reducedMotion = isReducedMotion();

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
