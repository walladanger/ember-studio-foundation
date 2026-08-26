import { ArrowRight, Blocks, Compass, PanelTop, Sparkles } from 'lucide-react';

const capabilities = [
  { icon: Blocks, title: 'Organized workspaces', description: 'Start with a focused place for the work at hand.' },
  { icon: Compass, title: 'Clear navigation', description: 'Keep tools and context available without clutter.' },
  { icon: Sparkles, title: 'Adaptable appearance', description: 'Use the selected accent profile across the foundation.' },
  { icon: PanelTop, title: 'Ready for extension', description: 'Add future features through clean, local boundaries.' },
];

export interface FoundationWelcomeProps {
  onNewWorkspace?: () => void;
  onOpenDataExplorer?: () => void;
}

export function FoundationWelcome({ onNewWorkspace, onOpenDataExplorer }: FoundationWelcomeProps) {
  return (
    <section className="foundation-welcome" aria-labelledby="foundation-welcome-title">
      <p className="foundation-welcome__eyebrow">Ember Studio foundation</p>
      <h1 id="foundation-welcome-title">A clear place to begin.</h1>
      <p className="foundation-welcome__intro">
        Set up a workspace, shape the tools around it, and grow from a dependable desktop foundation.
      </p>
      <div className="foundation-welcome__capabilities">
        {capabilities.map(({ icon: Icon, title, description }) => (
          <div className="foundation-welcome__capability" key={title}>
            <Icon aria-hidden="true" size={18} />
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="foundation-welcome__actions">
        <button type="button" className="foundation-welcome__primary" onClick={onNewWorkspace}>
          New workspace
          <ArrowRight aria-hidden="true" size={16} />
        </button>
        <button
          type="button"
          className="foundation-welcome__placeholder"
          disabled={!onOpenDataExplorer}
          aria-describedby={onOpenDataExplorer ? undefined : 'data-explorer-placeholder'}
          onClick={onOpenDataExplorer}
        >
          Data Explorer
        </button>
        {!onOpenDataExplorer ? (
          <span className="sr-only" id="data-explorer-placeholder">Available when the window manager is added.</span>
        ) : null}
      </div>
    </section>
  );
}
