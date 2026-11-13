/**
 * منسّق التطبيق (App Controller).
 *
 * يملك حالة المحاكي الوحيدة (`idle` ← `sectorChosen` ← `chainRevealed` / `planning` ← `evaluated`)
 * ويوزّع الأحداث على محرك المحاكي وطبقة العرض.
 * قيد معماري: جافاسكربت متصفح قياسية فقط، بلا أي استيراد خاص بـ Node،
 * ولا يلمس DOM وقت الاستيراد، حتى يمكن استيراده في اختبارات Node.
 */
import { CONTENT_CATALOG, VALID_MODES } from './content-catalog.js';
import { buildChain, evaluatePlan } from './simulator-engine.js';
import {
  renderHeroHtml,
  renderSimulatorHtml,
  renderBuilderResultHtml,
  renderInsightsHtml,
  renderContactHtml,
} from './views.js';

/** @typedef {'idle' | 'sectorChosen' | 'chainRevealed' | 'planning' | 'evaluated'} SimulatorStatus */

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
    /** @type {'quick' | 'builder'} */
    mode: 'quick',
    /** @type {string | null} */
    sectorId: null,
    /** @type {'husk' | 'foundation' | null} */
    path: null,
    /** @type {readonly any[]} */
    chain: [],
    /** @type {string[]} */
    plan: [],
    /** @type {any} */
    evaluation: null,
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

  function announce(text) {
    const liveEl = mountedDoc?.getElementById('simulator-live');
    if (liveEl) liveEl.textContent = text;
  }

  function isReducedMotion() {
    return Boolean(
      mountedDoc?.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    );
  }

  function getActiveFocusSelector(simMount) {
    const active = mountedDoc?.activeElement;
    if (!(active instanceof HTMLElement) || !simMount.contains(active)) {
      return null;
    }
    if (active.dataset.sectorId) {
      return `[data-sector-id="${active.dataset.sectorId}"]`;
    }
    if (active.dataset.mode) {
      return `[data-mode="${active.dataset.mode}"]`;
    }
    if (active.dataset.path) {
      return `[data-path="${active.dataset.path}"]`;
    }
    if (active.dataset.action === 'add-block' && active.dataset.blockId) {
      return `[data-action="add-block"][data-block-id="${active.dataset.blockId}"]`;
    }
    if (active.dataset.action === 'evaluate-plan') {
      return `[data-action="evaluate-plan"]`;
    }
    return null;
  }

  function updateSimulatorDom({ revealChain = false, explicitFocusSelector = null } = {}) {
    if (!mountedDoc) return;
    const simMount = mountedDoc.getElementById('simulator-content');
    if (!simMount) return;

    clearRevealTimers();
    const reduced = isReducedMotion();
    const animateSteps = revealChain && !reduced;

    // نحفظ موضع تركيز لوحة المفاتيح قبل إعادة الرسم لنعيده إلى العنصر المناسب بعدها.
    const focusSelector = explicitFocusSelector || getActiveFocusSelector(simMount);

    simMount.innerHTML = renderSimulatorHtml(state, catalog, { animateSteps });

    if (!revealChain && focusSelector) {
      const target = simMount.querySelector(focusSelector);
      if (target instanceof HTMLElement) target.focus({ preventScroll: true });
    }

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
        mode: state.mode,
        sectorId: state.sectorId,
        path: state.path,
        chain: [...state.chain],
        plan: [...state.plan],
        evaluation: state.evaluation,
      };
    },

    /** يبدّل بين نمط الرحلة المبسطة (quick) ونمط الرؤية المعمقة (builder). */
    switchMode(mode) {
      if (!VALID_MODES.includes(mode)) {
        throw new Error(`نمط محاكي غير معروف: "${mode}"`);
      }
      state.mode = mode;

      if (!state.sectorId) {
        state.simulator = 'idle';
      } else if (mode === 'builder') {
        if (state.simulator !== 'planning' && state.simulator !== 'evaluated') {
          state.simulator = 'planning';
        }
      } else {
        state.simulator = state.chain.length > 0 ? 'chainRevealed' : 'sectorChosen';
      }

      updateSimulatorDom({ revealChain: false });
      announce(`تم الانتقال إلى تبويب ${catalog.simulatorUi.modes[mode].label}.`);
    },

    /** يختار القطاع وينتقل إلى حالة sectorChosen. */
    selectSector(sectorId) {
      const sector = catalog.sectors.find((s) => s.id === sectorId);
      if (!sector) {
        throw new Error(`قطاع غير معروف: "${sectorId}"`);
      }
      state.simulator = 'sectorChosen';
      state.sectorId = sectorId;
      state.path = null;
      state.chain = [];
      state.plan = [];
      state.evaluation = null;
      updateSimulatorDom({ revealChain: false });

      announce(`تم اختيار ${sector.name}. ظهر ملف الشركة وخطوة اتخاذ القرار.`);
    },

    /** يختار المسار (husk أو foundation) ويبني السلسلة عبر محرك المحاكي. */
    selectPath(path) {
      if (!state.sectorId) {
        throw new Error('يجب اختيار القطاع قبل اختيار المسار');
      }
      const chain = buildChain(state.sectorId, path, catalog);
      state.mode = 'quick';
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

    /** يضيف لبنة تقنية إلى أول خانة فارغة في خطة الرؤية المعمقة. */
    addBlockToPlan(blockId) {
      if (!state.sectorId) {
        throw new Error('يجب اختيار القطاع قبل بناء الخطة');
      }
      const block = catalog.blocks.find((b) => b.id === blockId);
      if (!block) {
        throw new Error(`لبنة تقنية غير معروفة: "${blockId}"`);
      }
      const planSize = catalog.scoring.planSize;
      if (state.plan.includes(blockId) || state.plan.length >= planSize) {
        return false;
      }

      state.mode = 'builder';
      state.simulator = 'planning';
      state.plan.push(blockId);
      state.evaluation = null;
      updateSimulatorDom({ revealChain: false });

      const remaining = planSize - state.plan.length;
      const slotNum = state.plan.length;
      announce(
        remaining === 0
          ? `أُضيفت لبنة ${block.name} إلى الخانة ${slotNum}. اكتملت الخانات الأربع، ويمكنك الآن الضغط على قيّم خطتي.`
          : `أُضيفت لبنة ${block.name} إلى الخانة ${slotNum}. متبقٍ ${remaining} لتكتمل الخطة.`
      );
      return true;
    },

    /** يزيل اللبنة من الخانة المحددة ويعيدها إلى اللبنات المتاحة. */
    removeBlockFromSlot(slotIndex) {
      if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= state.plan.length) {
        return false;
      }
      const [removedId] = state.plan.splice(slotIndex, 1);
      const removedBlock = catalog.blocks.find((b) => b.id === removedId);
      state.mode = 'builder';
      state.simulator = 'planning';
      state.evaluation = null;

      updateSimulatorDom({
        revealChain: false,
        explicitFocusSelector: `[data-action="add-block"][data-block-id="${removedId}"]`,
      });
      if (removedBlock) {
        announce(`أُزيلت لبنة ${removedBlock.name} من الخانة ${slotIndex + 1} وعادت إلى اللبنات المتاحة.`);
      }
      return true;
    },

    /** يقيّم خطة البناء المكتملة من 4 لبنات وينتقل إلى حالة evaluated. */
    evaluateCurrentPlan() {
      if (!state.sectorId) {
        throw new Error('يجب اختيار القطاع قبل تقييم الخطة');
      }
      const evaluation = evaluatePlan(state.sectorId, state.plan, catalog);
      state.mode = 'builder';
      state.simulator = 'evaluated';
      state.evaluation = evaluation;

      // نحدّث حاوية aria-live مباشرةً داخل DOM إن وُجدت ليعلن قارئ الشاشة الدرجة والمستوى بدقة.
      const resultLiveEl = mountedDoc?.getElementById('builder-result-live');
      if (resultLiveEl) {
        resultLiveEl.innerHTML = renderBuilderResultHtml(evaluation, catalog);
        resultLiveEl.scrollIntoView?.({
          behavior: isReducedMotion() ? 'instant' : 'smooth',
          block: 'nearest',
        });
      } else {
        updateSimulatorDom({ revealChain: false });
      }
      return evaluation;
    },

    /** يعيد ضبط خطة البناء للقطاع نفسه ويعود إلى حالة planning دون فقدان القطاع. */
    rebuildPlan() {
      if (!state.sectorId) {
        throw new Error('يجب اختيار القطاع قبل إعادة البناء');
      }
      state.mode = 'builder';
      state.simulator = 'planning';
      state.plan = [];
      state.evaluation = null;
      updateSimulatorDom({
        revealChain: false,
        explicitFocusSelector: '[data-action="add-block"]',
      });
      announce('أُعيد ضبط خطة البناء وبقي القطاع محدداً. اختر 4 لبنات جديدة لتقييمها.');
    },

    /** ينقل المستخدم من نهاية الرحلة المبسطة إلى أداة البناء مع إبقاء القطاع المختار. */
    goToBuilder() {
      if (!state.sectorId) {
        throw new Error('يجب اختيار القطاع قبل الانتقال إلى الرؤية المعمقة');
      }
      state.mode = 'builder';
      if (state.simulator !== 'planning' && state.simulator !== 'evaluated') {
        state.simulator = 'planning';
      }
      updateSimulatorDom({
        revealChain: false,
        explicitFocusSelector: '#builder-step-title',
      });
      if (mountedDoc) {
        const stepTitle = mountedDoc.getElementById('builder-step-title');
        stepTitle?.scrollIntoView?.({
          behavior: isReducedMotion() ? 'instant' : 'smooth',
          block: 'nearest',
        });
      }
      announce(`تم الانتقال إلى تبويب ${catalog.simulatorUi.modes.builder.label} للقطاع المحدد.`);
    },

    /** يفتح معاينة مكبّرة للقطة استشارية محددة في نافذة `<dialog>` أصلية. */
    openInsight(insightId) {
      const insightsConfig = catalog.insights;
      const item = insightsConfig?.items?.find((entry) => entry.id === insightId);
      if (!item) return null;

      if (mountedDoc) {
        const dialog = mountedDoc.getElementById('insight-dialog');
        if (dialog) {
          const defaultImageSrc =
            insightsConfig.defaultImageSrc || 'assets/insights/insight-01.svg';
          const imageSrc = item.imageSrc || defaultImageSrc;
          const width = Number(item.width) || Number(insightsConfig.defaultWidth) || 800;
          const height = Number(item.height) || Number(insightsConfig.defaultHeight) || 500;
          const showPlaceholder =
            typeof item.isPlaceholder === 'boolean'
              ? item.isPlaceholder
              : !imageSrc || /\.svg(?:$|\?)/i.test(imageSrc);

          const tagEl = dialog.querySelector('[data-insight-dialog-tag]');
          if (tagEl) tagEl.textContent = item.tag || '';

          const titleEl = dialog.querySelector('[data-insight-dialog-title]');
          if (titleEl) titleEl.textContent = item.title || '';

          const imgEl = dialog.querySelector('#insight-dialog-img');
          if (imgEl) {
            imgEl.setAttribute('src', imageSrc);
            imgEl.setAttribute('alt', item.alt || item.title || '');
            imgEl.setAttribute('width', String(width));
            imgEl.setAttribute('height', String(height));
          }

          const placeholderEl = dialog.querySelector('[data-insight-dialog-placeholder]');
          if (placeholderEl) {
            placeholderEl.hidden = !showPlaceholder;
          }

          const commentaryEl = dialog.querySelector('[data-insight-dialog-commentary]');
          if (commentaryEl) commentaryEl.textContent = item.commentary || '';

          if (typeof dialog.showModal === 'function' && !dialog.open) {
            dialog.showModal();
          } else if (!dialog.open) {
            dialog.setAttribute('open', '');
          }
        }
      }
      return item;
    },

    /** يغلق نافذة المعاينة إن كانت مفتوحة. */
    closeInsight() {
      if (!mountedDoc) return;
      const dialog = mountedDoc.getElementById('insight-dialog');
      if (dialog?.open && typeof dialog.close === 'function') {
        dialog.close('close');
      }
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

      const insightsMount = doc.getElementById('insights-content');
      if (insightsMount) {
        insightsMount.innerHTML = renderInsightsHtml(catalog);
        const insightDialog = insightsMount.querySelector('#insight-dialog');
        const win = doc.defaultView;
        const DialogCtor = win?.HTMLDialogElement;
        if (
          insightDialog &&
          typeof insightDialog.addEventListener === 'function' &&
          !(DialogCtor && 'closedBy' in DialogCtor.prototype)
        ) {
          let pointerDownOutside = false;
          const isOutsideDialog = (evt) => {
            if (typeof insightDialog.getBoundingClientRect !== 'function') return false;
            const rect = insightDialog.getBoundingClientRect();
            return (
              evt.clientX < rect.left ||
              evt.clientX > rect.right ||
              evt.clientY < rect.top ||
              evt.clientY > rect.bottom
            );
          };
          insightDialog.addEventListener('pointerdown', (evt) => {
            pointerDownOutside = evt.target === insightDialog && isOutsideDialog(evt);
          });
          insightDialog.addEventListener('pointerup', (evt) => {
            if (pointerDownOutside && evt.target === insightDialog && isOutsideDialog(evt)) {
              insightDialog.close('dismiss');
            }
            pointerDownOutside = false;
          });
        }
      }

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
          if (action === 'switch-mode') {
            const nextMode = actionBtn.getAttribute('data-mode');
            if (nextMode === 'quick' || nextMode === 'builder') {
              this.switchMode(nextMode);
            }
            return;
          }
          if (action === 'add-block') {
            if (actionBtn.getAttribute('aria-disabled') === 'true') return;
            const blockId = actionBtn.getAttribute('data-block-id');
            if (blockId) this.addBlockToPlan(blockId);
            return;
          }
          if (action === 'remove-block') {
            const slotStr = actionBtn.getAttribute('data-slot-index');
            const slotIndex = Number(slotStr);
            if (slotStr !== null && Number.isInteger(slotIndex)) {
              this.removeBlockFromSlot(slotIndex);
            }
            return;
          }
          if (action === 'evaluate-plan') {
            if (actionBtn.getAttribute('aria-disabled') === 'true') return;
            this.evaluateCurrentPlan();
            return;
          }
          if (action === 'rebuild-plan') {
            this.rebuildPlan();
            return;
          }
          if (action === 'go-to-builder') {
            this.goToBuilder();
            return;
          }
          if (action === 'open-insight') {
            const insightId = actionBtn.getAttribute('data-insight-id');
            if (insightId) this.openInsight(insightId);
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

      // تنقل لوحة المفاتيح بين التبويبين بالأسهم وHome وEnd حسب مواصفة RTL.
      doc.addEventListener('keydown', (event) => {
        const target = event.target instanceof Element ? event.target : null;
        const tab = target?.closest('.sim-tablist [role="tab"]');
        if (!tab) return;

        const tablist = tab.closest('[role="tablist"]');
        if (!tablist) return;
        const tabs = [...tablist.querySelectorAll('[role="tab"]')];
        const currentIdx = tabs.indexOf(tab);
        if (currentIdx === -1 || tabs.length < 2) return;

        let nextIdx = -1;
        if (event.key === 'ArrowLeft') {
          nextIdx = (currentIdx + 1) % tabs.length;
        } else if (event.key === 'ArrowRight') {
          nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
        } else if (event.key === 'Home') {
          nextIdx = 0;
        } else if (event.key === 'End') {
          nextIdx = tabs.length - 1;
        }

        if (nextIdx === -1) return;
        event.preventDefault();
        const nextMode = tabs[nextIdx].getAttribute('data-mode');
        if (nextMode === 'quick' || nextMode === 'builder') {
          this.switchMode(nextMode);
          const freshTab = doc.querySelector(`.sim-tablist [data-mode="${nextMode}"]`);
          if (freshTab instanceof HTMLElement) {
            freshTab.focus({ preventScroll: true });
          }
        }
      });
    },
  };
}
