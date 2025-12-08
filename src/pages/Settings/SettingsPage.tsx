import { Shield, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card } from '../../components/ui/Card';
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button';
import { ToggleSwitch } from '../../components/ui/Toggle';
import { PageLayout } from '../../layouts/PageLayout';
import { useAppState } from '../../hooks/useAppState';
import { useAuth } from '../../hooks/useAuth';

export const SettingsPage = () => {
  const { preferences, updatePreferences } = useAppState();
  const { user, logout, isLoading } = useAuth();
  const accountEmail = user?.email ?? preferences.email;

  const handleLogout = () => {
    logout().catch((error) => {
      console.error('Failed to log out', error);
    });
  };

  return (
    <PageLayout title="Settings" subtitle="Tailor notifications and privacy">
      <div className="grid gap-4 md:grid-cols-2">
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="text-brand-primary" />
            <div>
              <h3 className="text-lg font-semibold">Notifications</h3>
              <p className="text-sm text-slate-500">Choose what reminders to keep on.</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold">Daily reminders</p>
              <p className="text-xs text-slate-500">Morning digest of planned activities.</p>
            </div>
            <ToggleSwitch
              checked={preferences.dailyReminders}
              onClick={() => updatePreferences({ dailyReminders: !preferences.dailyReminders })}
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold">Activity notifications</p>
              <p className="text-xs text-slate-500">Push a reminder when it&apos;s walk time.</p>
            </div>
            <ToggleSwitch
              checked={preferences.activityNotifications}
              onClick={() => updatePreferences({ activityNotifications: !preferences.activityNotifications })}
            />
          </div>
        </Card>
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center gap-3">
            <UserRound className="text-brand-primary" />
            <div>
              <h3 className="text-lg font-semibold">Privacy</h3>
              <p className="text-sm text-slate-500">Manage visibility of your data.</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold">Profile visibility</p>
              <p className="text-xs text-slate-500">Allow friends to view your pups.</p>
            </div>
            <ToggleSwitch
              checked={preferences.profileVisibility}
              onClick={() => updatePreferences({ profileVisibility: !preferences.profileVisibility })}
            />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-semibold">Share data with friends</p>
              <p className="text-xs text-slate-500">Share streaks and XP with trusted pals.</p>
            </div>
            <ToggleSwitch
              checked={preferences.shareDataWithFriends}
              onClick={() => updatePreferences({ shareDataWithFriends: !preferences.shareDataWithFriends })}
            />
          </div>
        </Card>
      </div>
      <Card padding="lg" className="space-y-4">
        <h3 className="text-lg font-semibold">Account</h3>
        <label className="flex flex-col text-sm font-medium text-slate-700">
          Email
          <input className="mt-1 rounded-2xl border border-slate-200 px-3 py-2" value={accountEmail} readOnly />
        </label>
        <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Account status</p>
            <p className="text-xs text-slate-500">
              {user ? `Signed in as ${user.email}` : 'Browsing in demo mode'}
            </p>
          </div>
          {user ? (
            <SecondaryButton type="button" onClick={handleLogout} disabled={isLoading}>
              {isLoading ? 'Signing out…' : 'Log out'}
            </SecondaryButton>
          ) : (
            <Link to="/login" className="text-sm font-semibold text-brand-primary hover:underline">
              Sign in
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <PrimaryButton type="button">Change password</PrimaryButton>
          <SecondaryButton type="button" className="text-red-600">
            Delete account
          </SecondaryButton>
        </div>
      </Card>
    </PageLayout>
  );
};
