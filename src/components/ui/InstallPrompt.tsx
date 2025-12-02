import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export const InstallPrompt = () => {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (evt: Event) => {
      evt.preventDefault();
      setEvent(evt as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!visible || !event) return null;

  const handleInstall = async () => {
    await event.prompt();
    await event.userChoice;
    setVisible(false);
    setEvent(null);
  };

  return (
    <div className="fixed bottom-[calc(5.5rem+var(--safe-area-bottom))] left-0 right-0 z-40 flex justify-center px-4">
      <div className="flex w-full max-w-md items-center gap-3 rounded-3xl border border-brand-border bg-white/95 p-4 shadow-card backdrop-blur">
        <div className="flex-1">
          <p className="text-sm font-semibold text-brand-primary">Install Pups & Rec</p>
          <p className="text-xs text-text-secondary">Keep logging walks even when you’re offline.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-full border border-brand-border px-3 py-1 text-xs font-semibold text-text-secondary"
          >
            Later
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-full bg-brand-accent px-4 py-1.5 text-xs font-semibold text-white shadow-sm"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

