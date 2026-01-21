import { describe, expect, it } from 'vitest';

import { pickVisibleTourTarget } from '../src/components/onboarding/OnboardingTour';

const mockRect = (el: Element, rect: { width: number; height: number }) => {
  const fullRect = {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: rect.width,
    bottom: rect.height,
    width: rect.width,
    height: rect.height,
    toJSON: () => '',
  };

  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => fullRect,
    configurable: true,
  });
  Object.defineProperty(el, 'getClientRects', {
    value: () => (rect.width > 0 && rect.height > 0 ? [fullRect] : []),
    configurable: true,
  });
};

describe('pickVisibleTourTarget', () => {
  it('selects the first visible element when multiple match', () => {
    document.body.innerHTML = '';
    const hidden = document.createElement('a');
    hidden.setAttribute('data-tour', 'nav-test');
    hidden.style.display = 'none';
    mockRect(hidden, { width: 0, height: 0 });

    const visible = document.createElement('a');
    visible.setAttribute('data-tour', 'nav-test');
    visible.style.display = 'block';
    mockRect(visible, { width: 120, height: 24 });

    document.body.appendChild(hidden);
    document.body.appendChild(visible);

    const target = pickVisibleTourTarget(['[data-tour="nav-test"]']);
    expect(target).toBe(visible);
  });
});
