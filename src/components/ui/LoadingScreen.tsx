export const LoadingScreen = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-brand-subtle text-brand-primary">
    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-primary/20 border-t-brand-primary" />
    <p className="text-sm font-medium">Fetching your pack...</p>
  </div>
);


