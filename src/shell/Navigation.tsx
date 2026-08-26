import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { ReactNode } from 'react';
import type { NavigationRegistry, ShellRoute } from '../navigation/navigationTypes';

export interface NavigationProps {
  items: NavigationRegistry;
  activeRoute: ShellRoute;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate?: (route: ShellRoute) => void;
  settingsContent?: ReactNode;
}

export function Navigation({
  items,
  activeRoute,
  collapsed,
  onToggleCollapsed,
  onNavigate,
  settingsContent,
}: NavigationProps) {
  const toggleLabel = collapsed ? 'Expand navigation' : 'Collapse navigation';

  return (
    <nav className="navigation" aria-label="Primary navigation" data-collapsed={collapsed}>
      <div className="navigation__controls">
        <button
          type="button"
          className="navigation__toggle"
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
          data-tooltip={toggleLabel}
          onClick={onToggleCollapsed}
        >
          {collapsed ? <PanelLeftOpen aria-hidden="true" size={18} /> : <PanelLeftClose aria-hidden="true" size={18} />}
        </button>
      </div>
      <div className="navigation__items">
        {items.filter((item) => item.visible !== false).map((item) => {
          const Icon = item.icon;
          const selected = item.route === activeRoute;

          return (
            <button
              key={item.id}
              type="button"
              className="navigation__item"
              aria-label={item.label}
              aria-current={selected ? 'page' : undefined}
              data-tooltip={collapsed ? item.label : undefined}
              data-active={selected}
              onClick={() => onNavigate?.(item.route)}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span className="navigation__label">{item.label}</span>
              {!collapsed && item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
            </button>
          );
        })}
      </div>
      {settingsContent ? <div className="navigation__settings">{settingsContent}</div> : null}
    </nav>
  );
}
