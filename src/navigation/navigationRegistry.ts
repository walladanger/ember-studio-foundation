import { CircleHelp, FolderOpen, House, PanelsTopLeft, Settings, Wrench } from 'lucide-react';
import type { NavigationRegistry } from './navigationTypes';

export const navigationRegistry: NavigationRegistry = [
  { id: 'home', label: 'Home', icon: House, route: 'home' },
  { id: 'files', label: 'Files', icon: FolderOpen, route: 'files', shortcut: 'Ctrl+O' },
  { id: 'workspace', label: 'Workspace', icon: PanelsTopLeft, route: 'workspace' },
  { id: 'tools', label: 'Tools', icon: Wrench, route: 'tools' },
  { id: 'settings', label: 'Settings', icon: Settings, route: 'settings' },
  { id: 'about', label: 'About', icon: CircleHelp, route: 'about' },
];
