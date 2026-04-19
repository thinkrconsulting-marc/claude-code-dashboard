import DashboardShell from './_components/dashboard-shell';
import ActivityTracker from '@/components/activity-tracker';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      <ActivityTracker />
      {children}
    </DashboardShell>
  );
}
