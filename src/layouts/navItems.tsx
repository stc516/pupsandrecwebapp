import type { ComponentType } from 'react';

import {
  CalendarDays,
  Dumbbell,
  Home,
  MapPin,
  NotebookPen,
  PawPrint,
  Settings,
  Trophy,
  Activity,
  Newspaper,
} from 'lucide-react';
import { features } from '../config/features';

export interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

export const navItems: NavItem[] = [
  { label: 'Home', path: '/', icon: Home },
  ...(features.exploreEnabled ? [{ label: 'Explore', path: '/explore', icon: MapPin }] : []),
  { label: 'Training', path: '/training', icon: Dumbbell },
  { label: 'Activity', path: '/activity', icon: Activity },
  { label: 'Journal', path: '/journal', icon: NotebookPen },
  { label: 'Calendar', path: '/calendar', icon: CalendarDays },
  { label: 'Feed', path: '/feed', icon: Newspaper },
  { label: 'Pets', path: '/pets', icon: PawPrint },
  { label: 'Achievements', path: '/achievements', icon: Trophy },
  { label: 'Settings', path: '/settings', icon: Settings },
];
