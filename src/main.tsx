import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';

import AppLayout from './App';
import './index.css';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { ToastProvider } from './components/ui/ToastProvider';
import { AuthProvider } from './context/AuthContext';
import { AppStateProvider } from './context/AppStateContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { TrainingProvider } from './context/TrainingContext';
import { TrainingPlanProvider } from './context/TrainingPlanContext';

import { ActivityPage } from './pages/Activity/ActivityPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import AuthCallbackPage from './pages/Auth/AuthCallbackPage';
import { SmokePage } from './pages/Smoke/SmokePage';
import { AchievementsPage } from './pages/Achievements/AchievementsPage';
import { CalendarPage } from './pages/Calendar/CalendarPage';
import { FeedPage } from './pages/Feed/FeedPage';
import { HomePage } from './pages/Home/HomePage';
import { JournalPage } from './pages/Journal/JournalPage';
import { PetsPage } from './pages/Pets/PetsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';
import { HealthPage } from './pages/Health/HealthPage';
import { TrainingPage } from './pages/Training/TrainingPage';
import { ExplorePage } from './pages/Explore/ExplorePage';
import { features } from './config/features';

registerSW({ immediate: true });

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/__health', element: <HealthPage /> },
  { path: '/__smoke', element: <SmokePage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      ...(features.exploreEnabled ? [{ path: 'explore', element: <ExplorePage /> }] : []),
      { path: 'activity', element: <ActivityPage /> },
      { path: 'journal', element: <JournalPage /> },
      { path: 'training', element: <TrainingPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'feed', element: <FeedPage /> },
      { path: 'pets', element: <PetsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'achievements', element: <AchievementsPage /> }
    ]
  }
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppStateProvider>
        <TrainingProvider>
          <TrainingPlanProvider>
            <OnboardingProvider>
              <ToastProvider>
                <RouterProvider router={router} />
              </ToastProvider>
            </OnboardingProvider>
          </TrainingPlanProvider>
        </TrainingProvider>
      </AppStateProvider>
    </AuthProvider>
  </StrictMode>,
);
