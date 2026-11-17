/**
 * منسّق التطبيق (App Controller).
 *
 * يملك حالة المحاكي الوحيدة (`idle` ← `sectorChosen` ← `chainRevealed` / `planning` ← `evaluated`)
 * ويوزّع الأحداث على محرك المحاكي وطبقة العرض.
 * قيد معماري: جافاسكربت متصفح قياسية فقط، بلا أي استيراد خاص بـ Node،
 * ولا يلمس DOM وقت الاستيراد، حتى يمكن استيراده في اختبارات Node.
 */
import {
  CONTENT_CATALOG,
  VALID_CASE_FILTERS,
  VALID_MODES,
  VALID_SCALES,
  VALID_STATIONS,
  VALID_THEMES,
} from './content-catalog.js';
import {
  buildChain,
  buildExecutiveDiagnosis,
  computeTelemetry,
  evaluatePlan,
  resolveSimulatorAmbientState,
  sortPlanOptimally,
} from './simulator-engine.js';
import {
  renderHeroHtml,
  renderSimulatorHtml,
  renderBuilderResultHtml,
  renderCaseStudiesLabHtml,
  renderMethodologyStationHtml,
  renderInsightsHtml,
  renderContactHtml,
  resolveInsightMedia,
} from './views.js';

/** @typedef {'idle' | 'sectorChosen' | 'chainRevealed' | 'planning' | 'evaluated'} SimulatorStatus */

const STEP_REVEAL_INTERVAL_MS = 120;

const AMBIENT_CANVAS_PALETTES = Object.freeze({
  neutral: Object.freeze({ primary: '201, 165, 76', secondary: '122, 147, 196', speed: 0.42 }),
  governed: Object.freeze({ primary: '62, 156, 126', secondary: '201, 165, 76', speed: 0.34 }),
  warning: Object.freeze({ primary: '227, 199, 122', secondary: '217, 105, 79', speed: 0.56 }),
  critical: Object.freeze({ primary: '217, 105, 79', secondary: '168, 72, 54', speed: 0.78 }),
});

/**
 * محرك شبكة البيانات التفاعلية في الخلفية (`#data-flow-canvas`) بسرعة 60 إطاراً/ثانية:
 * 48 عقدة مكتبية / 24 عقدة للجوال، ارتباطات بدون جذر تربيعي، نبضات بيانات على كل خامس رابط، واحترام تقليل الحركة.
 */
function initAmbientCanvas(doc) {
  const win = doc?.defaultView;
  const canvas = doc?.getElementById?.('data-flow-canvas');
  if (!win || !canvas || typeof canvas.getContext !== 'function') return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = win.innerWidth || 1280;
  let height = win.innerHeight || 800;
  let dpr = Math.min(win.devicePixelRatio || 1, 2);
  let targetMouseX = width * 0.5;
  let targetMouseY = height * 0.35;
  let smoothMouseX = targetMouseX;
  let smoothMouseY = targetMouseY;
  let pointerActive = false;
  let rafId = null;

  const nodeCount = width >= 768 ? 48 : 24;
  const maxDistSq = 19600; // 140px^2 لتفادي Math.sqrt في الحلقة الحرجة
  const pointerRadiusSq = 25600; // 160px^2
  const nodes = Array.from({ length: nodeCount }, (_, idx) => ({
    x: ((idx * 137.5) % 100) * 0.01 * width,
    y: ((idx * 293.3) % 100) * 0.01 * height,
    vx: (((idx % 7) - 3) * 0.12) || 0.14,
    vy: ((((idx + 3) % 7) - 3) * 0.12) || -0.14,
    r: 1.4 + (idx % 3) * 0.55,
  }));

  const resize = () => {
    width = win.innerWidth || 1280;
    height = win.innerHeight || 800;
    dpr = Math.min(win.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const onPointerMove = (evt) => {
    pointerActive = true;
    targetMouseX = evt.clientX;
    targetMouseY = evt.clientY;
  };
  doc.addEventListener('pointermove', onPointerMove, { passive: true });
  win.addEventListener('resize', resize, { passive: true });

  const renderFrame = (timestamp, animateMotion) => {
    const simState = doc.body?.dataset?.simState || 'neutral';
    const palette =
      AMBIENT_CANVAS_PALETTES[simState] || AMBIENT_CANVAS_PALETTES.neutral;

    ctx.clearRect(0, 0, width, height);

    if (animateMotion) {
      smoothMouseX += (targetMouseX - smoothMouseX) * 0.05;
      smoothMouseY += (targetMouseY - smoothMouseY) * 0.05;
    }

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (animateMotion) {
        node.x += node.vx * palette.speed;
        node.y += node.vy * palette.speed;

        if (node.x < -12) node.x = width + 12;
        else if (node.x > width + 12) node.x = -12;
        if (node.y < -12) node.y = height + 12;
        else if (node.y > height + 12) node.y = -12;

        if (pointerActive) {
          const dxm = node.x - smoothMouseX;
          const dym = node.y - smoothMouseY;
          const distMouseSq = dxm * dxm + dym * dym;
          if (distMouseSq > 4 && distMouseSq < pointerRadiusSq) {
            const force = (1 - distMouseSq / pointerRadiusSq) * 0.018;
            node.x += dxm * force;
            node.y += dym * force;
          }
        }
      }
    }

    const packetPhase = ((timestamp || 0) * 0.00055 * palette.speed) % 1;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < maxDistSq) {
          const alpha = (1 - distSq / maxDistSq) * 0.22;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${palette.primary}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 0.85;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          if (animateMotion && (i + j) % 5 === 0) {
            const t = (packetPhase + ((i + j) % 10) * 0.1) % 1;
            const px = a.x + dx * t;
            const py = a.y + dy * t;
            ctx.beginPath();
            ctx.fillStyle = `rgba(${palette.secondary}, 0.72)`;
            ctx.arc(px, py, 1.55, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      ctx.beginPath();
      ctx.fillStyle = `rgba(${palette.primary}, 0.34)`;
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const reducedMotion = Boolean(
    win.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  if (reducedMotion) {
    renderFrame(0, false);
    return;
  }

  const loop = (ts) => {
    if (!doc.hidden) {
      renderFrame(ts, true);
    }
    rafId = win.requestAnimationFrame(loop);
  };
  rafId = win.requestAnimationFrame(loop);

  doc.addEventListener('visibilitychange', () => {
    if (!doc.hidden && !rafId) {
      rafId = win.requestAnimationFrame(loop);
    }
  });
}

/** توهّج حدود بطاقات البينتو وفق موضع المؤشر في مستمع واحد موحد. */
function initSpotlightBorders(doc) {
  const win = doc?.defaultView;
  if (!doc || !win) return;
  if (win.matchMedia?.('(pointer: coarse)').matches) return;

  let scheduled = false;
  let lastEvt = null;

  doc.addEventListener(
    'pointermove',
    (evt) => {
      lastEvt = evt;
      if (scheduled) return;
      scheduled = true;
      const run = () => {
        scheduled = false;
        const targetEl =
          lastEvt?.target instanceof Element
            ? lastEvt.target.closest('.bento-card')
            : null;
        if (!targetEl || typeof targetEl.getBoundingClientRect !== 'function') {
          return;
        }
        const rect = targetEl.getBoundingClientRect();
        targetEl.style.setProperty('--mouse-x', `${lastEvt.clientX - rect.left}px`);
        targetEl.style.setProperty('--mouse-y', `${lastEvt.clientY - rect.top}px`);
      };
      if (typeof win.requestAnimationFrame === 'function') {
        win.requestAnimationFrame(run);
      } else {
        run();
      }
    },
    { passive: true }
  );
}

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
  const defaultScaleId =
    catalog.scales?.defaultScaleId || CONTENT_CATALOG.scales.defaultScaleId || 'enterprise';

  const state = {
    /** @type {'hero' | 'simulator' | 'methodology' | 'insights' | 'contact'} */
    activeStation: 'hero',
    /** @type {'dark' | 'light'} */
    theme: 'dark',
    /** @type {'1' | '2' | '3'} */
    touchDeckSlide: '1',
    /** @type {SimulatorStatus} */
    simulator: 'idle',
    /** @type {'quick' | 'builder'} */
    mode: 'quick',
    /** @type {'enterprise' | 'sme'} */
    scaleId: defaultScaleId,
    /** @type {'all' | 'failure' | 'success'} */
    caseFilter: 'all',
    /** @type {boolean} */
    copiedDiagnosis: false,
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
    /** @type {Record<string, number> | null} */
    previousTelemetryValues: null,
    /** @type {boolean} */
    telemetryPulse: false,
    /** @type {string} */
    lastActionReason: '',
    /** @type {string} */
    autoSortMessage: '',
  };

  let currentScrollId = 0;
  let currentRevealId = 0;
  /** @type {ReturnType<typeof setTimeout>[]} */
  let pendingTimers = [];
  /** @type {Document | null} */
  let mountedDoc = null;

  function snapshotTelemetry(reason = '') {
    const snap = computeTelemetry(state, catalog);
    /** @type {Record<string, number>} */
    const map = {};
    for (const m of snap) {
      map[m.id] = m.value;
    }
    state.previousTelemetryValues = map;
    state.telemetryPulse = true;
    state.lastActionReason = reason;
  }

  function animateTelemetryCounters(simMount) {
    const win = mountedDoc?.defaultView;
    if (!win || typeof win.requestAnimationFrame !== 'function' || isReducedMotion()) {
      return;
    }
    const meterEls = simMount.querySelectorAll('[data-meter-value][data-meter-prev]');
    meterEls.forEach((el) => {
      const targetVal = Number(el.getAttribute('data-meter-value'));
      const prevVal = Number(el.getAttribute('data-meter-prev'));
      if (!Number.isFinite(targetVal) || !Number.isFinite(prevVal) || targetVal === prevVal) {
        return;
      }
      const durationMs = 260;
      const startTime = win.performance?.now ? win.performance.now() : Date.now();
      const step = (now) => {
        const currentNow = typeof now === 'number' ? now : Date.now();
        const progress = Math.min(1, Math.max(0, (currentNow - startTime) / durationMs));
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(prevVal + (targetVal - prevVal) * eased);
        el.textContent = `${current}%`;
        if (progress < 1) {
          win.requestAnimationFrame(step);
        } else {
          el.textContent = `${targetVal}%`;
        }
      };
      win.requestAnimationFrame(step);
    });

    const arcEls = simMount.querySelectorAll('[data-arc-fill][data-arc-target][data-arc-prev]');
    arcEls.forEach((arcEl) => {
      const targetOffset = Number(arcEl.getAttribute('data-arc-target'));
      const prevOffset = Number(arcEl.getAttribute('data-arc-prev'));
      if (
        !Number.isFinite(targetOffset) ||
        !Number.isFinite(prevOffset) ||
        targetOffset === prevOffset
      ) {
        return;
      }
      arcEl.style.strokeDashoffset = String(prevOffset);
      win.requestAnimationFrame(() => {
        arcEl.style.strokeDashoffset = String(targetOffset);
      });
    });

    const fillEls = simMount.querySelectorAll('[data-meter-fill-target][data-meter-fill-prev]');
    fillEls.forEach((fillEl) => {
      const targetVal = Number(fillEl.getAttribute('data-meter-fill-target'));
      const prevVal = Number(fillEl.getAttribute('data-meter-fill-prev'));
      if (!Number.isFinite(targetVal) || !Number.isFinite(prevVal) || targetVal === prevVal) {
        return;
      }
      fillEl.style.inlineSize = `${prevVal}%`;
      win.requestAnimationFrame(() => {
        fillEl.style.inlineSize = `${targetVal}%`;
      });
    });
  }

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
    if (active.dataset.scaleId) {
      return `[data-scale-id="${active.dataset.scaleId}"]`;
    }
    if (active.dataset.caseFilter) {
      return `[data-case-filter="${active.dataset.caseFilter}"]`;
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
    if (active.dataset.action === 'auto-sort-plan') {
      return `[data-action="auto-sort-plan"]`;
    }
    if (active.dataset.action === 'apply-reference-plan') {
      return `[data-action="apply-reference-plan"]`;
    }
    if (active.dataset.action === 'copy-diagnosis') {
      return `[data-action="copy-diagnosis"]`;
    }
    return null;
  }

  function updateSimulatorDom({
    revealChain = false,
    explicitFocusSelector = null,
    useViewTransition = true,
  } = {}) {
    if (!mountedDoc) return;
    const simMount = mountedDoc.getElementById('simulator-content');
    if (!simMount) return;

    clearRevealTimers();
    const reduced = isReducedMotion();
    const animateSteps = revealChain && !reduced;
    const compactMobile = Boolean(
      mountedDoc?.defaultView?.matchMedia?.('(max-width: 47.99rem)')?.matches
    );

    const ambientState = resolveSimulatorAmbientState(state, catalog);
    if (mountedDoc.body?.dataset) {
      mountedDoc.body.dataset.simState = ambientState;
    }

    let drawerWasOpen = false;
    try {
      const existingDrawer = simMount.querySelector('#evidence-drawer');
      drawerWasOpen = Boolean(
        existingDrawer &&
          (existingDrawer.matches?.(':popover-open') ||
            existingDrawer.classList?.contains('is-open'))
      );
    } catch {
      drawerWasOpen = false;
    }

    // نحفظ موضع تركيز لوحة المفاتيح قبل إعادة الرسم لنعيده إلى العنصر المناسب بعدها.
    const focusSelector = explicitFocusSelector || getActiveFocusSelector(simMount);

    const commitRender = () => {
      simMount.innerHTML = renderSimulatorHtml(state, catalog, {
        animateSteps,
        compactMobile,
      });
      animateTelemetryCounters(simMount);

      if (drawerWasOpen) {
        const freshDrawer = simMount.querySelector('#evidence-drawer');
        if (freshDrawer) {
          if (typeof freshDrawer.showPopover === 'function') {
            try {
              freshDrawer.showPopover();
            } catch {
              freshDrawer.classList?.add('is-open');
            }
          } else {
            freshDrawer.classList?.add('is-open');
          }
        }
      }

      if (!revealChain && focusSelector) {
        const target = simMount.querySelector(focusSelector);
        if (target instanceof HTMLElement) target.focus({ preventScroll: true });
      }
    };

    const canUseViewTransition =
      useViewTransition &&
      typeof mountedDoc.startViewTransition === 'function' &&
      !reduced &&
      !revealChain &&
      !drawerWasOpen &&
      state.simulator !== 'idle';

    if (canUseViewTransition) {
      try {
        const vtSim = mountedDoc.startViewTransition(() => {
          commitRender();
        });
        vtSim?.ready?.catch?.(() => {});
        vtSim?.finished?.catch?.(() => {});
      } catch {
        commitRender();
      }
    } else {
      commitRender();
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
        activeStation: state.activeStation,
        theme: state.theme,
        touchDeckSlide: state.touchDeckSlide,
        simulator: state.simulator,
        mode: state.mode,
        scaleId: state.scaleId,
        caseFilter: state.caseFilter,
        copiedDiagnosis: state.copiedDiagnosis,
        sectorId: state.sectorId,
        path: state.path,
        chain: [...state.chain],
        plan: [...state.plan],
        evaluation: state.evaluation,
        previousTelemetryValues: state.previousTelemetryValues
          ? { ...state.previousTelemetryValues }
          : null,
        telemetryPulse: state.telemetryPulse,
        lastActionReason: state.lastActionReason,
        autoSortMessage: state.autoSortMessage,
      };
    },

    /** ينتقل بين المحطات الخمس (`hero` | `simulator` | `methodology` | `insights` | `contact`) بانتقال سلس داخل الصفحة. */
    navigateToStation(stationId, options = {}) {
      if (!VALID_STATIONS.includes(stationId)) {
        throw new Error(`محطة غير معروفة: "${stationId}"`);
      }
      const prevIdx = VALID_STATIONS.indexOf(state.activeStation);
      const nextIdx = VALID_STATIONS.indexOf(stationId);
      const direction = nextIdx >= prevIdx ? 'forward' : 'backward';
      state.activeStation = stationId;

      const progressPct = Math.round(
        (nextIdx / Math.max(1, VALID_STATIONS.length - 1)) * 100
      );

      const applyStationDom = () => {
        if (!mountedDoc) return;
        if (mountedDoc.body?.dataset) {
          mountedDoc.body.dataset.activeStation = stationId;
          mountedDoc.body.dataset.stationDirection = direction;
        }
        const stations = mountedDoc.querySelectorAll?.('section[data-station]') || [];
        stations.forEach((sec) => {
          const isMatch = sec.getAttribute('data-station') === stationId;
          sec.classList?.toggle('station--active', isMatch);
          if (isMatch) {
            sec.setAttribute('data-station-active', 'true');
            sec.removeAttribute('hidden');
          } else {
            sec.removeAttribute('data-station-active');
          }
        });

        const stepperEl = mountedDoc.getElementById?.('journey-stepper-mount');
        if (stepperEl?.style?.setProperty) {
          stepperEl.style.setProperty('--journey-progress', `${progressPct}%`);
        }

        const navLinks =
          mountedDoc.querySelectorAll?.('[data-action="go-station"][data-station-target]') ||
          [];
        navLinks.forEach((link) => {
          if (
            link.classList?.contains('journey-stepper__btn') ||
            link.classList?.contains('bottom-journey-dock__btn')
          ) {
            const isTarget = link.getAttribute('data-station-target') === stationId;
            link.classList.toggle('is-active', isTarget);
            if (isTarget) {
              link.setAttribute('aria-current', 'step');
            } else {
              link.removeAttribute('aria-current');
            }
          }
        });

        const win = mountedDoc.defaultView;
        if (win?.scrollTo) {
          try {
            win.scrollTo({ top: 0, behavior: 'instant' });
          } catch {
            win.scrollTo(0, 0);
          }
        }
        if (win?.history?.replaceState && options.updateHash !== false) {
          win.history.replaceState(null, '', `#${stationId}`);
        }
      };

      const focusActiveStationHeading = () => {
        if (!mountedDoc || options.focusHeading === false) return;
        const targetSec = mountedDoc.getElementById?.(stationId);
        const focusEl =
          targetSec?.querySelector?.('h1, h2, [tabindex="-1"]') || targetSec;
        if (focusEl instanceof HTMLElement) {
          focusEl.focus({ preventScroll: true });
        }
      };

      const reduced = isReducedMotion();
      const canTransition =
        mountedDoc &&
        typeof mountedDoc.startViewTransition === 'function' &&
        !reduced &&
        options.useViewTransition !== false;

      if (canTransition) {
        try {
          const vt = mountedDoc.startViewTransition({
            update: applyStationDom,
            types: [direction],
          });
          vt?.ready?.catch?.(() => {});
          if (vt?.finished?.then) {
            vt.finished.then(focusActiveStationHeading, focusActiveStationHeading);
          } else {
            focusActiveStationHeading();
          }
        } catch {
          try {
            const vtFallback = mountedDoc.startViewTransition(applyStationDom);
            vtFallback?.ready?.catch?.(() => {});
            if (vtFallback?.finished?.then) {
              vtFallback.finished.then(focusActiveStationHeading, focusActiveStationHeading);
            } else {
              focusActiveStationHeading();
            }
          } catch {
            applyStationDom();
            focusActiveStationHeading();
          }
        }
      } else {
        applyStationDom();
        focusActiveStationHeading();
      }

      const stationMeta = (
        catalog.journeyStations?.items || CONTENT_CATALOG.journeyStations.items
      ).find((s) => s.id === stationId);
      if (stationMeta) {
        announce(`تم الانتقال إلى المحطة ${stationMeta.number}: ${stationMeta.title}.`);
      }
      return state.activeStation;
    },

    /** يضبط نمط الإضاءة (`dark` التنفيذي الداكن أو `light` النهاري الفاتح). */
    setTheme(themeId) {
      if (!VALID_THEMES.includes(themeId)) {
        throw new Error(`نمط إضاءة غير معروف: "${themeId}"`);
      }
      state.theme = themeId;
      if (mountedDoc) {
        if (mountedDoc.documentElement?.dataset) {
          mountedDoc.documentElement.dataset.theme = themeId;
        }
        if (mountedDoc.body?.dataset) {
          mountedDoc.body.dataset.theme = themeId;
        }
        const colorSchemeMeta = mountedDoc.querySelector?.('meta[name="color-scheme"]');
        if (colorSchemeMeta) {
          colorSchemeMeta.setAttribute('content', themeId);
        }
        const labelEl = mountedDoc.querySelector?.('[data-theme-label]');
        if (labelEl) {
          labelEl.textContent =
            themeId === 'dark' ? 'الوضع النهاري' : 'الوضع الداكن';
        }
        try {
          mountedDoc.defaultView?.localStorage?.setItem?.('salman-hajj-theme', themeId);
        } catch {
          // تجاهل في حال حظر التخزين المحلي
        }
      }
      announce(
        themeId === 'light'
          ? 'تم تفعيل الوضع النهاري الفاتح عالي الوضوح.'
          : 'تم تفعيل الوضع التنفيذي الداكن.'
      );
      return state.theme;
    },

    /** يبدّل بين الوضع التنفيذي الداكن والوضع النهاري الفاتح. */
    toggleTheme() {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      return this.setTheme(nextTheme);
    },

    /** يختار بطاقة المحاكي الفرعية القابلة للسحب على الجوال والآيباد (`1` | `2` | `3`). */
    selectTouchDeckSlide(slideId) {
      const normalized = String(slideId);
      if (!['1', '2', '3'].includes(normalized)) {
        throw new Error(`بطاقة لمسية غير معروفة: "${slideId}"`);
      }
      state.touchDeckSlide = normalized;
      if (mountedDoc) {
        const deckEl = mountedDoc.querySelector?.('[data-sim-touch-deck]');
        if (deckEl) {
          deckEl.setAttribute('data-active-deck', normalized);
          const slideEl = deckEl.querySelector?.(`[data-touch-slide="${normalized}"]`);
          if (slideEl && typeof slideEl.scrollIntoView === 'function') {
            slideEl.scrollIntoView({
              behavior: isReducedMotion() ? 'instant' : 'smooth',
              block: 'nearest',
              inline: 'start',
            });
          }
        }
        const buttons =
          mountedDoc.querySelectorAll?.('[data-action="select-deck-slide"]') || [];
        buttons.forEach((btn) => {
          const isSelected = btn.getAttribute('data-deck-slide') === normalized;
          btn.classList?.toggle('is-active', isSelected);
          btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });
      }
      return state.touchDeckSlide;
    },

    /** يحدّد حجم المنشأة (`enterprise` أو `sme`) ويحدّث المؤشرات والتشخيص التنفيذي فوراً. */
    selectScale(scaleId) {
      if (!VALID_SCALES.includes(scaleId)) {
        throw new Error(`حجم منشأة غير معروف: "${scaleId}"`);
      }
      const scaleItem = (catalog.scales?.items || CONTENT_CATALOG.scales.items).find(
        (s) => s.id === scaleId
      );
      snapshotTelemetry(
        scaleItem
          ? `تأثير تغيير حجم المنشأة إلى «${scaleItem.label}» على حساسية السيولة والمخاطر`
          : 'تأثير تغيير حجم المنشأة'
      );
      state.scaleId = scaleId;
      state.copiedDiagnosis = false;

      if (state.simulator === 'evaluated' && state.sectorId && state.plan.length > 0) {
        state.evaluation = evaluatePlan(state.sectorId, state.plan, catalog, {
          scaleId: state.scaleId,
        });
      }

      updateSimulatorDom({ revealChain: false });
      if (scaleItem) {
        announce(`تم تحديد حجم المنشأة: ${scaleItem.label}.`);
      }
      return state.scaleId;
    },

    /** يفلتر وقائع المختبر العالمي (`all` | `failure` | `success`). */
    filterCases(filterId) {
      if (!VALID_CASE_FILTERS.includes(filterId)) {
        throw new Error(`فلتر وقائع غير معروف: "${filterId}"`);
      }
      state.caseFilter = filterId;
      state.telemetryPulse = false;

      const methodologyMount = mountedDoc?.getElementById?.('methodology-content');
      if (methodologyMount) {
        methodologyMount.innerHTML = renderMethodologyStationHtml(filterId, catalog);
      }

      const drawerEl = mountedDoc?.getElementById?.('evidence-drawer');
      const liveLabEl = drawerEl?.querySelector?.('[data-case-studies-lab]');
      if (drawerEl && liveLabEl) {
        liveLabEl.outerHTML = renderCaseStudiesLabHtml(filterId, catalog, 'sim-main');
        const nextBtn = drawerEl.querySelector(`[data-case-filter="${filterId}"]`);
        if (nextBtn instanceof HTMLElement) {
          nextBtn.focus({ preventScroll: true });
        }
      } else if (!methodologyMount) {
        updateSimulatorDom({ revealChain: false });
      }

      const filterItem = (
        catalog.caseStudies?.filters || CONTENT_CATALOG.caseStudies.filters
      ).find((f) => f.id === filterId);
      if (filterItem) {
        announce(`تم عرض: ${filterItem.label}.`);
      }
      return state.caseFilter;
    },

    /** ينسخ ملخص التشخيص التنفيذي لمشاركته في LinkedIn ويعيد النص المنسوخ. */
    async copyDiagnosis() {
      if (!state.sectorId) {
        return null;
      }
      const diagnosis =
        state.mode === 'builder' && state.evaluation?.diagnosis
          ? state.evaluation.diagnosis
          : buildExecutiveDiagnosis(
              {
                sectorId: state.sectorId,
                scaleId: state.scaleId,
                mode: state.mode,
                path: state.path || 'husk',
                evaluation: state.evaluation,
              },
              catalog
            );

      const textToCopy = diagnosis.shareText;
      const win = mountedDoc?.defaultView;
      if (win?.navigator?.clipboard?.writeText) {
        try {
          await win.navigator.clipboard.writeText(textToCopy);
        } catch {
          // في حال منع المتصفح واجهة الحافظة نستمر بتحديث الحالة الإرشادية.
        }
      }

      state.copiedDiagnosis = true;
      state.telemetryPulse = false;
      updateSimulatorDom({
        revealChain: false,
        explicitFocusSelector: '[data-action="copy-diagnosis"]',
      });
      announce(
        (catalog.executiveDiagnosis || CONTENT_CATALOG.executiveDiagnosis).copiedButtonLabel
      );
      return textToCopy;
    },

    /** يبدّل بين نمط الرحلة المبسطة (quick) ونمط الرؤية المعمقة (builder). */
    switchMode(mode, options = {}) {
      if (!VALID_MODES.includes(mode)) {
        throw new Error(`نمط محاكي غير معروف: "${mode}"`);
      }
      snapshotTelemetry(`تبديل نمط المحاكي إلى «${catalog.simulatorUi.modes[mode].label}»`);
      state.mode = mode;
      state.copiedDiagnosis = false;

      if (!state.sectorId) {
        state.simulator = 'idle';
      } else if (mode === 'builder') {
        if (state.simulator !== 'planning' && state.simulator !== 'evaluated') {
          state.simulator = 'planning';
        }
      } else {
        state.simulator = state.chain.length > 0 ? 'chainRevealed' : 'sectorChosen';
      }

      updateSimulatorDom({
        revealChain: false,
        useViewTransition: options?.useViewTransition ?? true,
        explicitFocusSelector:
          options?.explicitFocusSelector || `.sim-tablist [data-mode="${mode}"]`,
      });
      announce(`تم الانتقال إلى تبويب ${catalog.simulatorUi.modes[mode].label}.`);
    },

    /** يختار القطاع وينتقل إلى حالة sectorChosen. */
    selectSector(sectorId) {
      const sector = catalog.sectors.find(
        (s) => s.id === sectorId || s.aliasId === sectorId
      );
      if (!sector) {
        throw new Error(`قطاع غير معروف: "${sectorId}"`);
      }
      snapshotTelemetry(`تحديد القطاع الميداني: «${sector.name}»`);
      state.simulator = 'sectorChosen';
      state.sectorId = sector.id;
      state.path = null;
      state.chain = [];
      state.plan = [];
      state.evaluation = null;
      state.copiedDiagnosis = false;
      state.autoSortMessage = '';
      updateSimulatorDom({ revealChain: false });

      announce(`تم اختيار ${sector.name}. ظهر ملف الشركة وخطوة اتخاذ القرار.`);
    },

    /** يختار المسار (husk أو foundation) ويبني السلسلة عبر محرك المحاكي. */
    selectPath(path) {
      if (!state.sectorId) {
        throw new Error('يجب اختيار القطاع قبل اختيار المسار');
      }
      snapshotTelemetry(
        path === 'husk'
          ? 'تأثير مسار الاستعجال بالذكاء بدون أساس على المؤشرات الأربعة'
          : 'تأثير مسار التأسيس المتين قبل الذكاء على المؤشرات الأربعة'
      );
      const chain = buildChain(state.sectorId, path, catalog);
      state.mode = 'quick';
      state.simulator = 'chainRevealed';
      state.path = path;
      state.chain = chain;
      state.copiedDiagnosis = false;
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

      const stageNum = state.plan.length + 1;
      snapshotTelemetry(`تأثير وضع «${block.name}» في المرحلة ${stageNum}`);
      state.mode = 'builder';
      state.simulator = 'planning';
      state.plan.push(blockId);
      state.evaluation = null;
      state.autoSortMessage = '';
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
      const removedBlockPreview = catalog.blocks.find((b) => b.id === state.plan[slotIndex]);
      snapshotTelemetry(
        removedBlockPreview
          ? `تأثير إزالة «${removedBlockPreview.name}» من المرحلة ${slotIndex + 1}`
          : `تأثير إزالة اللبنة من المرحلة ${slotIndex + 1}`
      );
      const [removedId] = state.plan.splice(slotIndex, 1);
      const removedBlock = catalog.blocks.find((b) => b.id === removedId);
      state.mode = 'builder';
      state.simulator = 'planning';
      state.evaluation = null;
      state.autoSortMessage = '';

      updateSimulatorDom({
        revealChain: false,
        explicitFocusSelector: `[data-action="add-block"][data-block-id="${removedId}"]`,
      });
      if (removedBlock) {
        announce(`أُزيلت لبنة ${removedBlock.name} من الخانة ${slotIndex + 1} وعادت إلى اللبنات المتاحة.`);
      }
      return true;
    },

    /** ينقل لبنة بين مراحل الخطة (للأمام `right` أو للخلف `left`) ويحدّث رد فعل الميدان والمؤشرات لحظياً. */
    moveBlockInPlan(slotIndex, direction) {
      if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= state.plan.length) {
        return false;
      }
      const targetIndex = direction === 'right' ? slotIndex - 1 : slotIndex + 1;
      if (targetIndex < 0 || targetIndex >= state.plan.length) {
        return false;
      }
      const movedBlock = catalog.blocks.find((b) => b.id === state.plan[slotIndex]);
      snapshotTelemetry(
        movedBlock
          ? `تأثير نقل «${movedBlock.name}» من المرحلة ${slotIndex + 1} إلى المرحلة ${targetIndex + 1}`
          : 'تأثير تعديل ترتيب مراحل الخطة'
      );
      const nextPlan = [...state.plan];
      const temp = nextPlan[slotIndex];
      nextPlan[slotIndex] = nextPlan[targetIndex];
      nextPlan[targetIndex] = temp;
      state.plan = nextPlan;
      state.mode = 'builder';
      state.simulator = 'planning';
      state.evaluation = null;
      state.autoSortMessage = '';

      updateSimulatorDom({
        revealChain: false,
        explicitFocusSelector: `[data-action="remove-block"][data-slot-index="${targetIndex}"]`,
      });
      if (movedBlock) {
        announce(`تم نقل لبنة ${movedBlock.name} إلى المرحلة ${targetIndex + 1}.`);
      }
      return true;
    },

    /** يعيد ترتيب اللبنات الحالية تلقائياً (الأساس والتوثيق والحوكمة أولاً ثم الذكاء فوقها) ويقارن الأثر. */
    autoSortPlan() {
      if (!state.sectorId || state.plan.length < 2) {
        return false;
      }
      const sorted = sortPlanOptimally(state.plan, catalog);
      const changed = sorted.some((id, idx) => id !== state.plan[idx]);
      if (!changed) {
        return false;
      }
      snapshotTelemetry('تأثير الترتيب المعماري الصحيح: لبنات الأساس أولاً ثم الذكاء الاصطناعي فوقها');

      const planSize = catalog.scoring.planSize;
      let scoreBefore = null;
      let scoreAfter = null;
      if (state.plan.length === planSize) {
        scoreBefore = evaluatePlan(state.sectorId, state.plan, catalog, {
          scaleId: state.scaleId,
        }).score;
        scoreAfter = evaluatePlan(state.sectorId, sorted, catalog, {
          scaleId: state.scaleId,
        }).score;
      }

      state.plan = sorted;
      state.mode = 'builder';
      state.copiedDiagnosis = false;

      if (state.plan.length === planSize) {
        state.evaluation = evaluatePlan(state.sectorId, state.plan, catalog, {
          scaleId: state.scaleId,
        });
        state.simulator = 'evaluated';
        state.autoSortMessage = `تم ترتيب اللبنات بالطريقة المعمارية الصحيحة (الأساس أولاً ثم الذكاء فوقه): قفزت الجاهزية من ${scoreBefore}/100 إلى ${scoreAfter}/100 لنفس اللبنات تماماً!`;
      } else {
        state.evaluation = null;
        state.simulator = 'planning';
        state.autoSortMessage =
          'تم ترتيب اللبنات المختارة بالطريقة الصحيحة: التأسيس والحوكمة في المراحل الأولى قبل أدوات الذكاء الاصطناعي.';
      }

      updateSimulatorDom({ revealChain: false });
      announce(state.autoSortMessage);
      return true;
    },

    /** يطبّق الخطة المرجعية المثالية (100/100) بضغطة واحدة ويستعرض التقييم الفوري. */
    applyReferencePlan() {
      if (!state.sectorId && catalog.sectors?.length) {
        state.sectorId = catalog.sectors[0].id;
      }
      const refIds = (
        catalog.simulatorUi?.builder?.referencePlan || [
          'docs-knowledge',
          'source-lineage',
          'data-classification',
          'ai-forecast',
        ]
      ).slice(0, catalog.scoring.planSize);

      snapshotTelemetry(
        'تطبيق الخطة المرجعية المثالية (100/100): التأسيس والحوكمة أولاً ثم الذكاء الاصطناعي'
      );
      state.mode = 'builder';
      state.plan = [...refIds];
      state.evaluation = evaluatePlan(state.sectorId, state.plan, catalog, {
        scaleId: state.scaleId,
      });
      state.simulator = 'evaluated';
      state.copiedDiagnosis = false;
      state.autoSortMessage =
        'طُبّقت الخطة المرجعية المثالية (100/100): 3 لبنات تأسيسية مترابطة تسبق الذكاء الاصطناعي، فاستقرّت المؤشرات الأربعة والحلقات الست باللون الأخضر.';

      updateSimulatorDom({ revealChain: false });
      const resultLiveEl = mountedDoc?.getElementById('builder-result-live');
      if (resultLiveEl) {
        resultLiveEl.scrollIntoView?.({
          behavior: isReducedMotion() ? 'instant' : 'smooth',
          block: 'nearest',
        });
      }
      announce(state.autoSortMessage);
      return state.evaluation;
    },

    /** يقيّم خطة البناء المكتملة من 4 لبنات وينتقل إلى حالة evaluated. */
    evaluateCurrentPlan() {
      if (!state.sectorId) {
        throw new Error('يجب اختيار القطاع قبل تقييم الخطة');
      }
      snapshotTelemetry('تأثير التقييم النهائي لخطة المراحل الأربع على المؤشرات الحية');
      const evaluation = evaluatePlan(state.sectorId, state.plan, catalog, {
        scaleId: state.scaleId,
      });
      state.mode = 'builder';
      state.simulator = 'evaluated';
      state.evaluation = evaluation;
      state.copiedDiagnosis = false;

      // نحدّث المحاكي بالكامل لتتحدث لوحة المؤشرات الحية الرباعية وحاوية النتيجة معاً.
      updateSimulatorDom({ revealChain: false });
      const resultLiveEl = mountedDoc?.getElementById('builder-result-live');
      if (resultLiveEl) {
        resultLiveEl.scrollIntoView?.({
          behavior: isReducedMotion() ? 'instant' : 'smooth',
          block: 'nearest',
        });
      }
      return evaluation;
    },

    /** يعيد ضبط خطة البناء للقطاع نفسه ويعود إلى حالة planning دون فقدان القطاع. */
    rebuildPlan() {
      if (!state.sectorId) {
        throw new Error('يجب اختيار القطاع قبل إعادة البناء');
      }
      snapshotTelemetry('إعادة ضبط مختبر بناء الخطة للبدء من جديد');
      state.mode = 'builder';
      state.simulator = 'planning';
      state.plan = [];
      state.evaluation = null;
      state.autoSortMessage = '';
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
          const {
            src: lightboxSrc,
            width,
            height,
            isPlaceholder: showPlaceholder,
          } = resolveInsightMedia(item, insightsConfig, true);

          const tagEl = dialog.querySelector('[data-insight-dialog-tag]');
          if (tagEl) tagEl.textContent = item.tag || '';

          const titleEl = dialog.querySelector('[data-insight-dialog-title]');
          if (titleEl) titleEl.textContent = item.title || '';

          const imgEl = dialog.querySelector('#insight-dialog-img');
          if (imgEl) {
            imgEl.setAttribute('src', lightboxSrc);
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

      const methodologyMount = doc.getElementById('methodology-content');
      if (methodologyMount) {
        methodologyMount.innerHTML = renderMethodologyStationHtml(
          state.caseFilter,
          catalog
        );
      }

      try {
        const savedTheme = doc.defaultView?.localStorage?.getItem?.('salman-hajj-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          this.setTheme(savedTheme);
        }
      } catch {
        // تجاهل في حال حظر التخزين المحلي
      }

      const initialHash = (doc.defaultView?.location?.hash || '').replace(/^#/, '');
      if (VALID_STATIONS.includes(initialHash)) {
        this.navigateToStation(initialHash, {
          useViewTransition: false,
          focusHeading: false,
          updateHash: false,
        });
      } else {
        this.navigateToStation('hero', {
          useViewTransition: false,
          focusHeading: false,
          updateHash: false,
        });
      }

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

      initAmbientCanvas(doc);
      initSpotlightBorders(doc);

      // بديل تلقائي للصور النسبية عند المعاينة في بيئات مثل Google AI Studio التي لا ترفع مجلد assets المحلي
      doc.addEventListener(
        'error',
        (event) => {
          const el = event.target;
          if (!el || el.tagName !== 'IMG') return;
          const rawSrc = el.getAttribute?.('src') || '';
          if (
            rawSrc.startsWith('assets/') &&
            !el.getAttribute?.('data-remote-fallback-applied')
          ) {
            el.setAttribute('data-remote-fallback-applied', 'true');
            const base =
              (catalog.meta?.siteUrl || 'https://salman-qq.github.io/salman-hajjconfex26-insights/').replace(
                /\/?$/,
                '/'
              );
            el.setAttribute('src', `${base}${rawSrc}`);
          }
        },
        true
      );

      doc.addEventListener('change', (event) => {
        const target = event.target;
        if (
          target instanceof Element &&
          target.matches?.('input[name="sim-mode"]')
        ) {
          const nextMode = target.getAttribute('value') || target.value;
          if (nextMode === 'quick' || nextMode === 'builder') {
            this.switchMode(nextMode);
          }
        }
      });

      doc.addEventListener('click', async (event) => {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;

        const actionBtn = target.closest('[data-action]');
        if (actionBtn) {
          const action = actionBtn.getAttribute('data-action');
          if (action === 'go-station') {
            const stationTarget = actionBtn.getAttribute('data-station-target');
            if (stationTarget && VALID_STATIONS.includes(stationTarget)) {
              event.preventDefault();
              this.navigateToStation(stationTarget);
              return;
            }
          }
          if (action === 'toggle-theme') {
            this.toggleTheme();
            return;
          }
          if (action === 'select-deck-slide') {
            const slideId = actionBtn.getAttribute('data-deck-slide');
            if (slideId) this.selectTouchDeckSlide(slideId);
            return;
          }
          if (action === 'select-sector') {
            const sectorId = actionBtn.getAttribute('data-sector-id');
            if (sectorId) this.selectSector(sectorId);
            return;
          }
          if (action === 'select-scale') {
            const scaleId = actionBtn.getAttribute('data-scale-id');
            if (scaleId === 'enterprise' || scaleId === 'sme') {
              this.selectScale(scaleId);
            }
            return;
          }
          if (action === 'filter-cases') {
            const filterId = actionBtn.getAttribute('data-case-filter');
            if (filterId === 'all' || filterId === 'failure' || filterId === 'success') {
              this.filterCases(filterId);
            }
            return;
          }
          if (action === 'copy-diagnosis') {
            await this.copyDiagnosis();
            return;
          }
          if (action === 'select-path') {
            const path = actionBtn.getAttribute('data-path');
            if (path === 'husk' || path === 'foundation') {
              if (!state.sectorId && catalog.sectors?.length) {
                const defaultSec =
                  catalog.sectors.find((s) => s.id === 'shuttle') || catalog.sectors[0];
                this.selectSector(defaultSec.id);
              }
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
            if (blockId) {
              if (!state.sectorId && catalog.sectors?.length) {
                const defaultSec =
                  catalog.sectors.find((s) => s.id === 'shuttle') || catalog.sectors[0];
                this.selectSector(defaultSec.id);
              }
              this.addBlockToPlan(blockId);
            }
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
          if (action === 'move-block') {
            const slotStr = actionBtn.getAttribute('data-slot-index');
            const direction = actionBtn.getAttribute('data-direction');
            const slotIndex = Number(slotStr);
            if (
              slotStr !== null &&
              Number.isInteger(slotIndex) &&
              (direction === 'right' || direction === 'left')
            ) {
              this.moveBlockInPlan(slotIndex, direction);
            }
            return;
          }
          if (action === 'auto-sort-plan') {
            this.autoSortPlan();
            return;
          }
          if (action === 'apply-reference-plan') {
            this.applyReferencePlan();
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
          if (action === 'open-evidence-drawer') {
            const drawer = doc.getElementById('evidence-drawer');
            if (drawer && typeof drawer.showPopover !== 'function') {
              drawer.classList?.add('is-open');
            }
            return;
          }
          if (action === 'close-evidence-drawer') {
            const drawer = doc.getElementById('evidence-drawer');
            if (drawer && typeof drawer.hidePopover !== 'function') {
              drawer.classList?.remove('is-open');
            }
            return;
          }
        }

        const scrollTrigger = target.closest('[data-scroll-target]');
        if (!scrollTrigger) return;

        const rawTargetId = scrollTrigger.getAttribute('data-scroll-target');
        const targetId = rawTargetId ? rawTargetId.replace(/^#/, '') : '';
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
          this.switchMode(nextMode, {
            useViewTransition: false,
            explicitFocusSelector: `.sim-tablist [data-mode="${nextMode}"]`,
          });
          const freshTab = doc.querySelector(`.sim-tablist [data-mode="${nextMode}"]`);
          if (freshTab instanceof HTMLElement) {
            freshTab.focus({ preventScroll: true });
          }
        }
      });
    },
  };
}
