import { useState } from 'react';
import { Settings } from 'lucide-react';
import { DialogProvider } from '../dialogs/DialogProvider';
import { ColorProfilePopover } from '../design-system/ColorProfilePopover';
import { ThemeProvider, useTheme } from '../design-system/themeStore';
import { NotificationProvider } from '../notifications/NotificationProvider';
import { AppShell } from '../shell/AppShell';
import { SettingsProvider } from '../settings/settingsStore';
import { WindowManagerProvider, useWindowManager } from '../windows/WindowManagerProvider';
import { ExternalWindowRoute, selectExternalFeature } from '../external-windows/ExternalWindowRoute';
import { windowRegistry } from '../windows/windowRegistry';
import { useNativeWindowStateLifecycle } from '../windows/windowState';

function ColorProfileControl() {
  const [open, setOpen] = useState(false);
  const { selection, setSelection } = useTheme();

  return (
    <div className="color-profile-control">
      <button
        type="button"
        aria-label="Color profile settings"
        aria-expanded={open}
        data-tooltip="Color profile settings"
        onClick={() => setOpen((current) => !current)}
      >
        <Settings aria-hidden="true" size={18} />
        <span className="navigation__label">Appearance</span>
      </button>
      {open ? (
        <ColorProfilePopover value={selection} onChange={setSelection} onClose={() => setOpen(false)} />
      ) : null}
    </div>
  );
}

function AppContent() {
  const { open } = useWindowManager();
  const externalFeature = typeof window === 'undefined' ? null : selectExternalFeature(window.location.search, windowRegistry);
  useNativeWindowStateLifecycle(externalFeature ? `feature:${externalFeature.id}` : 'main');

  if (externalFeature) return <ExternalWindowRoute feature={externalFeature} />;

  return <AppShell settingsContent={<ColorProfileControl />} onOpenDataExplorer={() => open('data-explorer')} />;
}

export function App() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <NotificationProvider>
          <DialogProvider>
            <WindowManagerProvider>
              <AppContent />
            </WindowManagerProvider>
          </DialogProvider>
        </NotificationProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
