import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Card } from '../ui/Card';
import { PrimaryButton, SecondaryButton } from '../ui/Button';
import { useOnboarding } from '../../context/OnboardingContext';
import { getTooltipPlacement, type TooltipPlacement } from './positioning';

type TourStep = {
  id: string;
  title: string;
  body: string;
  selector: string | string[];
  route?: string;
  placement?: 'right' | 'left' | 'top' | 'bottom';
};

const steps: TourStep[] = [
  {
    id: 'pet-switcher',
    title: 'Choose your pet',
    body: 'Switch between pets anytime.',
    selector: '[data-tour="pet-switcher"]',
    route: '/',
    placement: 'bottom',
  },
  {
    id: 'home-today',
    title: 'Today at a glance',
    body: 'See the day’s highlights in one spot.',
    selector: '[data-tour="home-today"]',
    route: '/',
    placement: 'right',
  },
  {
    id: 'activity',
    title: 'Log activities',
    body: 'Track walks, playtime, and training.',
    selector: ['[data-tour="nav-activity-desktop"]', '[data-tour="nav-activity-mobile"]'],
    route: '/activity',
    placement: 'right',
  },
  {
    id: 'journal',
    title: 'Write memories',
    body: 'Capture moments and milestones.',
    selector: ['[data-tour="nav-journal-desktop"]', '[data-tour="nav-journal-mobile"]'],
    route: '/journal',
    placement: 'right',
  },
  {
    id: 'calendar',
    title: 'Set reminders',
    body: 'Never miss meds or appointments.',
    selector: ['[data-tour="nav-calendar-desktop"]', '[data-tour="nav-calendar-mobile"]'],
    route: '/calendar',
    placement: 'right',
  },
];

const TARGET_TIMEOUT_MS = 1200;
const WATCHDOG_DELAY_MS = 100;
const VIEWPORT_PADDING = 12;
const TOOLTIP_OFFSET = 12;
const PLACEMENT_TIMEOUT_MS = 900;
const MAX_MISSING_STEPS = 3;

export const TourManager = () => {
  const { state, status, closeTour, nextStep, resetToken, setLastStepIndex, setTourStatus } = useOnboarding();
  const navigate = useNavigate();
  const location = useLocation();
  const [targetEl, setTargetEl] = useState<Element | null>(null);
  const [resolvedStepId, setResolvedStepId] = useState<string | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPlacement, setTooltipPlacement] = useState<TooltipPlacement | null>(null);
  const resolveIdRef = useRef(0);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const missingCountRef = useRef(0);

  const stepIndex = state.lastStepIndex;
  const maxStepIndex = steps.length - 1;
  const current = stepIndex >= 0 && stepIndex <= maxStepIndex ? steps[stepIndex] : null;
  const isLastStep = stepIndex >= maxStepIndex;
  const isTargetResolved = Boolean(current && targetEl && resolvedStepId === current.id);
  const shouldRenderOverlay = status === 'active' && isTargetResolved && Boolean(tooltipPlacement);

  const hardExitTour = useCallback(
    async (reason: string, updates: Partial<{ skipped: boolean; introSeen: boolean; completed: boolean; lastStepIndex: number }> = {}) => {
      setTargetEl(null);
      setResolvedStepId(null);
      setTargetRect(null);
      setTooltipPlacement(null);
      await closeTour(reason, updates);
    },
    [closeTour],
  );

  const handleMissingStep = useCallback(
    async (reason: string) => {
      missingCountRef.current += 1;
      if (missingCountRef.current >= MAX_MISSING_STEPS || isLastStep) {
        await hardExitTour(reason, { skipped: true, introSeen: true, lastStepIndex: 0 });
        return;
      }
      await nextStep(maxStepIndex);
    },
    [hardExitTour, isLastStep, maxStepIndex, nextStep],
  );

  useEffect(() => {
    if (status === 'idle') {
      setTargetEl(null);
      setResolvedStepId(null);
      setTargetRect(null);
      setTooltipPlacement(null);
      missingCountRef.current = 0;
    }
  }, [status]);

  useEffect(() => {
    setTargetEl(null);
    setResolvedStepId(null);
    setTargetRect(null);
    setTooltipPlacement(null);
    if (rafIdRef.current) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, [resetToken]);

  useEffect(() => {
    if (status !== 'waitingForTarget') return;
    const runId = ++resolveIdRef.current;
    let cancelled = false;

    const run = async () => {
      if (!current) {
        await hardExitTour('no-steps', { skipped: true, lastStepIndex: 0 });
        return;
      }

      const found = await resolveTarget(current, {
        navigate,
        currentPath: () => window.location.pathname,
        timeoutMs: TARGET_TIMEOUT_MS,
        isCancelled: () => cancelled || resolveIdRef.current !== runId,
      });

      if (cancelled || resolveIdRef.current !== runId) return;

      if (!found) {
        await handleMissingStep('missing_target');
        return;
      }

      missingCountRef.current = 0;
      setTargetEl(found);
      setResolvedStepId(current.id);
      setTourStatus('active');
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [current, hardExitTour, navigate, setTourStatus, status]);

  useEffect(() => {
    if (status !== 'active' || !current?.route) return;
    if (location.pathname !== current.route) {
      setTargetEl(null);
      setResolvedStepId(null);
      setTargetRect(null);
      setTooltipPlacement(null);
      setTourStatus('waitingForTarget');
    }
  }, [current?.route, location.pathname, setTourStatus, status]);

  useEffect(() => {
    if (status !== 'active' || !targetEl) return;
    const interval = window.setInterval(() => {
      if (!targetEl.isConnected || !isTourTargetVisible(targetEl)) {
        setTargetEl(null);
        setResolvedStepId(null);
        setTargetRect(null);
        setTooltipPlacement(null);
        setTourStatus('waitingForTarget');
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [setTourStatus, status, targetEl]);

  const updatePositions = useCallback(() => {
    if (!targetEl || !isTourTargetVisible(targetEl)) {
      setTargetRect(null);
      setTooltipPlacement(null);
      return;
    }
    const nextTargetRect = targetEl.getBoundingClientRect();
    if (nextTargetRect.width <= 0 || nextTargetRect.height <= 0) {
      setTargetRect(null);
      setTooltipPlacement(null);
      return;
    }
    setTargetRect(nextTargetRect);
    const tooltipEl = tooltipRef.current;
    if (!tooltipEl) {
      setTooltipPlacement(null);
      return;
    }
    const nextTooltipRect = tooltipEl.getBoundingClientRect();
    const placement = getTooltipPlacement(nextTargetRect, nextTooltipRect, {
      width: window.innerWidth,
      height: window.innerHeight,
      padding: VIEWPORT_PADDING,
      offset: TOOLTIP_OFFSET,
    });
    setTooltipPlacement(placement);
  }, [targetEl]);

  const scheduleUpdate = useCallback(() => {
    if (rafIdRef.current) {
      window.cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = window.requestAnimationFrame(() => {
      rafIdRef.current = null;
      updatePositions();
    });
  }, [updatePositions]);

  useLayoutEffect(() => {
    if (!isTargetResolved) return;
    updatePositions();
  }, [isTargetResolved, updatePositions]);

  useEffect(() => {
    if (!isTargetResolved) return;
    const handleScroll = () => scheduleUpdate();
    const handleResize = () => scheduleUpdate();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isTargetResolved, scheduleUpdate]);

  useEffect(() => {
    if (!isTargetResolved) return;
    scheduleUpdate();
  }, [current?.id, isTargetResolved, location.pathname, scheduleUpdate]);

  useEffect(() => {
    if (!isTargetResolved) return;
    const rafId = window.requestAnimationFrame(() => updatePositions());
    return () => window.cancelAnimationFrame(rafId);
  }, [isTargetResolved, location.pathname, updatePositions]);

  useEffect(() => {
    if (status !== 'active') return;
    if (isTargetResolved) return;
    const timer = window.setTimeout(() => {
      if (!isTargetResolved) {
        void handleMissingStep('failsafe-missing-tooltip');
      }
    }, WATCHDOG_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [handleMissingStep, isTargetResolved, status]);

  useEffect(() => {
    if (status === 'idle' || status === 'paused') return;
    if (stepIndex < 0 || stepIndex > maxStepIndex) {
      void setLastStepIndex(0);
      void hardExitTour('invalid-step', { lastStepIndex: 0 });
    }
  }, [hardExitTour, maxStepIndex, setLastStepIndex, status, stepIndex]);

  useEffect(() => {
    if (status !== 'active' || !isTargetResolved) return;
    if (tooltipPlacement) return;
    const timer = window.setTimeout(() => {
      if (!tooltipPlacement) {
        void handleMissingStep('placement-timeout');
      }
    }, PLACEMENT_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [handleMissingStep, isTargetResolved, status, tooltipPlacement]);

  const tooltipStyle = useMemo(() => {
    if (!tooltipPlacement) {
      return { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
    }
    return { left: tooltipPlacement.x, top: tooltipPlacement.y };
  }, [tooltipPlacement]);

  if (!isTargetResolved || !current) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none" data-onboarding-overlay="tour">
      {shouldRenderOverlay && (
        <div className="absolute inset-0 z-40 bg-slate-900/50 pointer-events-auto onboarding-backdrop" data-onboarding-overlay="backdrop" />
      )}
      {targetRect && (
        <div
          className="absolute z-40 pointer-events-none rounded-2xl border-2 border-brand-accent/70 shadow-[0_0_0_4px_rgba(255,255,255,0.25)]"
          style={{
            left: targetRect.left - 4,
            top: targetRect.top - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}
      <div
        ref={tooltipRef}
        className="fixed z-50 pointer-events-auto onboarding-popover"
        style={{
          ...tooltipStyle,
          opacity: tooltipPlacement ? 1 : 0,
          pointerEvents: tooltipPlacement ? 'auto' : 'none',
        }}
      >
        <Card padding="md" className="w-72 space-y-2 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Quick tour</p>
          <h4 className="text-sm font-semibold text-brand-primary">{current.title}</h4>
          <p className="text-sm text-text-secondary">{current.body}</p>
          <div className="flex items-center justify-between gap-2 pt-2">
            <SecondaryButton type="button" onClick={() => void hardExitTour('skip', { skipped: true, introSeen: true, lastStepIndex: 0 })}>
              Skip tour
            </SecondaryButton>
            {isLastStep ? (
              <PrimaryButton type="button" onClick={() => void hardExitTour('finish', { completed: true, introSeen: true, skipped: false, lastStepIndex: 0 })}>
                Finish
              </PrimaryButton>
            ) : (
              <PrimaryButton type="button" onClick={() => void nextStep(maxStepIndex)}>Next</PrimaryButton>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const resolveTarget = async (
  step: TourStep,
  {
    navigate,
    currentPath,
    timeoutMs,
    isCancelled,
  }: {
    navigate: (path: string) => void;
    currentPath: () => string;
    timeoutMs: number;
    isCancelled: () => boolean;
  },
) => {
  const deadline = Date.now() + timeoutMs;
  if (step.route && currentPath() !== step.route) {
    navigate(step.route);
    const routeReady = await waitForCondition(() => currentPath() === step.route, deadline, isCancelled);
    if (!routeReady) return null;
  }
  return waitForSelector(getStepSelectors(step), deadline, isCancelled);
};

const waitForSelector = async (selectors: string[], deadline: number, isCancelled: () => boolean) => {
  return waitForCondition(() => pickVisibleTourTarget(selectors), deadline, isCancelled);
};

const waitForCondition = async <T,>(
  check: () => T | null | false,
  deadline: number,
  isCancelled: () => boolean,
): Promise<T | null> => {
  while (Date.now() < deadline) {
    if (isCancelled()) return null;
    const value = check();
    if (value) return value;
    await waitForFrame();
  }
  return null;
};

const waitForFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      window.setTimeout(() => resolve(), 0);
    });
  });

const getStepSelectors = (step: TourStep) => (Array.isArray(step.selector) ? step.selector : [step.selector]);

export const pickVisibleTourTarget = (selectors: string[], root: ParentNode = document) => {
  for (const selector of selectors) {
    const nodes = Array.from(root.querySelectorAll(selector));
    for (const node of nodes) {
      if (isTourTargetVisible(node)) {
        return node;
      }
    }
  }
  return null;
};

export const isTourTargetVisible = (el: Element | null): el is HTMLElement => {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (typeof window === 'undefined') return false;
  const style = window.getComputedStyle(el);
  if (!style) return false;
  const opacity = Number.parseFloat(style.opacity || '1');
  if (style.display === 'none' || style.visibility === 'hidden' || opacity === 0) return false;
  if (el.getClientRects().length === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};
