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
    <div className="fixed right-4 top-[calc(4.75rem+var(--safe-area-top))] z-40 w-[min(90vw,22rem)]">
      <div className="flex items-start gap-3 rounded-3xl border border-brand-border bg-white/95 p-4 shadow-lg backdrop-blur">
        <div className="flex-1 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary/70">Install app</p>
          <p className="text-base font-semibold text-brand-primary">Get Pups &amp; Rec on your home screen</p>
          <p className="text-xs text-text-secondary">Works offline for quick logging.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-full border border-brand-border px-3 py-1 text-[11px] font-semibold text-text-secondary"
          >
            Not now
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-full bg-brand-accent px-4 py-2 text-xs font-semibold text-white shadow-sm"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
};

