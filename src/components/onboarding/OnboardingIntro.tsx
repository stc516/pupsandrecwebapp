import { useState } from 'react';

import { Card } from '../ui/Card';
import { PrimaryButton, SecondaryButton } from '../ui/Button';
import { useOnboarding } from '../../context/OnboardingContext';

export const OnboardingIntro = () => {
  const { dismissIntro, startTour, closeTour } = useOnboarding();
  const [step, setStep] = useState(0);

  return (
    <Card padding="lg" className="w-full max-w-lg space-y-4 onboarding-panel">
      {step === 0 ? (
        <>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary/70">Welcome</p>
            <h2 className="text-2xl font-semibold text-brand-primary">Meet your 2-minute setup</h2>
            <p className="text-sm text-text-secondary">
              Add your pet, log a win, and personalize the day. We will guide you from start to done.
            </p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <SecondaryButton type="button" onClick={() => void closeTour('skip-intro', { skipped: true, introSeen: true, lastStepIndex: 0 })}>Skip</SecondaryButton>
            <PrimaryButton type="button" onClick={() => setStep(1)}>Continue</PrimaryButton>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-primary/70">What you will do</p>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li>• Add your pet profile</li>
              <li>• Log a quick activity</li>
              <li>• Save a favorite memory</li>
              <li>• Set a reminder</li>
              <li>• Preview training tools</li>
            </ul>
          </div>
          <div className="flex items-center justify-between gap-2">
            <SecondaryButton
              type="button"
              onClick={() => void dismissIntro()}
            >
              Resume later
            </SecondaryButton>
            <PrimaryButton
              type="button"
              onClick={() => void startTour(true)}
            >
              Start setup
            </PrimaryButton>
          </div>
        </>
      )}
    </Card>
  );
};
