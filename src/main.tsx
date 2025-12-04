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
import { ActivityPage } from './pages/Activity/ActivityPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import { AchievementsPage } from './pages/Achievements/AchievementsPage';
import { CalendarPage } from './pages/Calendar/CalendarPage';
import { FeedPage } from './pages/Feed/FeedPage';
import { HomePage } from './pages/Home/HomePage';
import { JournalPage } from './pages/Journal/JournalPage';
import { PetsPage } from './pages/Pets/PetsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

registerSW({ immediate: true });

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'activity', element: <ActivityPage /> },
      { path: 'journal', element: <JournalPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'feed', element: <FeedPage /> },
      { path: 'pets', element: <PetsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'achievements', element: <AchievementsPage /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppStateProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AppStateProvider>
    </AuthProvider>
  </StrictMode>,
);
