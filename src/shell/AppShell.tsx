import { useEffect, useState, type ReactNode } from 'react';
import { navigationRegistry } from '../navigation/navigationRegistry';
import type { NavigationRegistry, ShellRoute } from '../navigation/navigationTypes';
import { FoundationWelcome } from '../features/foundation-welcome/FoundationWelcome';
import { Navigation } from './Navigation';
import { StatusBar } from './StatusBar';
import { TitleBar } from './TitleBar';
import { WindowManagerWorkspace } from '../windows/WindowManagerProvider';
import { useOptionalSettings } from '../settings/settingsStore';
import './shell.css';

export interface AppShellProps {
  navigation?: NavigationRegistry;
  children?: ReactNode;
  statusContent?: ReactNode;
  settingsContent?: ReactNode;
  onMinimize?: () => void;
  onToggleMaximize?: () => void;
  onClose?: () => void;
  onNewWorkspace?: () => void;
  onOpenDataExplorer?: () => void;
}

export function AppShell({
  navigation = navigationRegistry,
  children,
  statusContent,
  settingsContent,
  onMinimize,
  onToggleMaximize,
  onClose,
  onNewWorkspace,
  onOpenDataExplorer,
}: AppShellProps) {
  const settings = useOptionalSettings();
  const [collapsed, setCollapsed] = useState(settings?.settings.navigationCollapsed ?? false);
  const [activeRoute, setActiveRoute] = useState<ShellRoute>('home');
  useEffect(() => { if (settings) setCollapsed(settings.settings.navigationCollapsed); }, [settings?.settings.navigationCollapsed]);
  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    void settings?.update({ navigationCollapsed: next });
  };

  return (
    <div className="app-shell">
      <TitleBar onMinimize={onMinimize} onToggleMaximize={onToggleMaximize} onClose={onClose} />
      <Navigation
        items={navigation}
        activeRoute={activeRoute}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onNavigate={setActiveRoute}
        settingsContent={settingsContent}
      />
      <main className="app-shell__workspace">
        <WindowManagerWorkspace navigationKey={activeRoute}>
          <div className="app-shell__workspace-content">
            {children ?? <FoundationWelcome onNewWorkspace={onNewWorkspace} onOpenDataExplorer={onOpenDataExplorer} />}
          </div>
        </WindowManagerWorkspace>
      </main>
      <StatusBar>{statusContent}</StatusBar>
    </div>
  );
}
