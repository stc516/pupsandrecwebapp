import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import { vi } from 'vitest';

import { HomePage } from '../src/pages/Home/HomePage';
import { OnboardingOverlayRoot } from '../src/components/onboarding/OnboardingOverlayRoot';
import { OnboardingContext, type OnboardingState, type TourStatus } from '../src/context/OnboardingContext';

vi.mock('../src/hooks/useAppState', () => ({
  useAppState: () => ({
    selectedPet: { id: 'pet-1', name: 'Bailey', avatarUrl: '' },
    activities: [],
    journalEntries: [],
    reminders: [],
    xp: 0,
  }),
}));

vi.mock('../src/components/onboarding/OnboardingTour', async () => {
  const React = await import('react');
  const { useOnboarding } = await import('../src/context/OnboardingContext');
  return {
    TourManager: () => {
      const { closeTour } = useOnboarding();
      return React.createElement(
        'div',
        { 'data-testid': 'tour-overlay' },
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => void closeTour('skip', { skipped: true, introSeen: true, lastStepIndex: 0 }),
          },
          'Skip tour',
        ),
      );
    },
  };
});

const buildState = (): OnboardingState => ({
  completed: false,
  introSeen: true,
  skipped: false,
  lastStepIndex: 0,
  checklist: {
    petAdded: false,
    avatarUploaded: false,
    activityLogged: false,
    journalWritten: false,
    reminderAdded: false,
  },
});

const TestOnboardingProvider = ({
  children,
  onStartTour,
  onCloseTour,
}: {
  children: ReactNode;
  onStartTour: () => void;
  onCloseTour: () => void;
}) => {
  const [status, setStatus] = useState<TourStatus>('idle');
  const [state, setState] = useState<OnboardingState>(buildState());
  const [resetToken, setResetToken] = useState(0);

  const value = {
    state,
    status,
    isOpen: status === 'waitingForTarget' || status === 'active',
    resetToken,
    dismissIntro: async () => {
      setState((prev) => ({ ...prev, introSeen: true }));
    },
    startTour: async () => {
      onStartTour();
      setStatus('active');
    },
    closeTour: async () => {
      onCloseTour();
      setStatus('idle');
      setResetToken((prev) => prev + 1);
    },
    nextStep: async () => {},
    setLastStepIndex: async (index: number) => {
      setState((prev) => ({ ...prev, lastStepIndex: index }));
    },
    setTourStatus: (nextStatus: TourStatus) => setStatus(nextStatus),
    setChecklist: async (next: Partial<OnboardingState['checklist']>) => {
      setState((prev) => ({
        ...prev,
        checklist: {
          ...prev.checklist,
          ...next,
        },
      }));
    },
    resetOnboarding: async () => {
      setStatus('idle');
      setResetToken((prev) => prev + 1);
      setState(buildState());
    },
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

describe('Onboarding overlay clickability', () => {
  it('allows resume tour and skip without leaving a blocking overlay', async () => {
    const user = userEvent.setup();
    const onStartTour = vi.fn();
    const onCloseTour = vi.fn();

    render(
      <TestOnboardingProvider onStartTour={onStartTour} onCloseTour={onCloseTour}>
        <MemoryRouter>
          <HomePage />
          <OnboardingOverlayRoot />
        </MemoryRouter>
      </TestOnboardingProvider>,
    );

    const resumeButton = screen.getByRole('button', { name: /resume tour/i });
    await user.click(resumeButton);
    expect(onStartTour).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('tour-overlay')).toBeInTheDocument();

    const skipButton = screen.getByRole('button', { name: /skip tour/i });
    await user.click(skipButton);
    expect(onCloseTour).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(screen.queryByTestId('tour-overlay')).toBeNull();
    });

    await user.click(resumeButton);
    expect(onStartTour).toHaveBeenCalledTimes(2);
  });
});
