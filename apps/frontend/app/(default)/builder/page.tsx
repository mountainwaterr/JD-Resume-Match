import { AppLayout } from '@/components/layout/app-layout';
import { ResumeBuilder } from '@/components/builder/resume-builder';

export default function BuilderPage() {
  return (
    <AppLayout>
      <ResumeBuilder />
    </AppLayout>
  );
}
