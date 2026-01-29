import { PrebuiltPlansSection } from '../../components/training/PrebuiltPlansSection';
import { TrainingSection } from '../../components/training/TrainingSection';
import { PageLayout } from '../../layouts/PageLayout';

export const TrainingPage = () => (
  <PageLayout title="Training" subtitle="Schedule workouts that build focus and confidence">
    <div className="space-y-6">
      <PrebuiltPlansSection />
      <TrainingSection />
    </div>
  </PageLayout>
);
