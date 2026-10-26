# Ember Studio Foundation

Reusable Windows desktop application foundation built with React, TypeScript, Vite, and Tauri.

![CI](https://img.shields.io/github/actions/workflow/status/walladanger/ember-studio-foundation/ci.yml?branch=main&label=CI) ![License](https://img.shields.io/github/license/walladanger/ember-studio-foundation)

[![Ember Studio shell with Data Explorer and color profiles](docs/screenshots/ember-studio-color-profiles.jpg)](docs/screenshots/ember-studio-color-profiles.jpg)

## Features

- Borderless custom title bar with native window controls
- Collapsible navigation and project-owned design tokens
- Internal window manager with move, resize, minimize, maximize, and z-order behavior
- Optional external Tauri feature windows
- Generic file, settings, notification, dialog, tooltip, and feedback service boundaries
- Placeholder Data Explorer and foundation welcome experience
- Typed service contracts for future Java, Python, Rust, C#, or local HTTP/WebSocket services

## Architecture

```mermaid
flowchart TD
    App[src/app] --> Shell[src/shell]
    App --> Features[src/features]
    App --> Windows[src/windows]
    App --> ExtWindows[src/external-windows]
    Shell --> DesignSystem[src/design-system]
    Shell --> Navigation[src/navigation]
    Features --> Services[src/services]
    Services --> FileSystem[src/file-system]
    Services --> Settings[src/settings]
    Services --> Dialogs[src/dialogs]
    Services --> Notifications[src/notifications]
    Services --> Tooltips[src/tooltips]
    Services --> Feedback[src/feedback]
    ExtWindows --> Tauri[src-tauri]
    Windows --> Tauri
```

React + TypeScript + Vite owns the presentation and interaction layers in `src`. Tauri v2/Rust owns OS boundaries and persistence in `src-tauri`. Shared shell behavior is organized into focused modules, while business-specific code remains under `src/features/`. See [backend integration guidance](docs/architecture/backend-boundary.md) and the [foundation guide](docs/foundation-guide.md) for more details.

## Quick start

Requires Node.js 20.19 or newer, npm, and Tauri v2 prerequisites.

```bash
npm install
npm run dev
npm test
npm run build
```

## Configuration

| File | Purpose | Default |
|------|---------|---------|
| `src-tauri/tauri.conf.json` | Tauri configuration | Included |

## Screenshots

[![Collapsed navigation with hover tooltip](docs/screenshots/ember-studio-collapsed-navigation.jpg)](docs/screenshots/ember-studio-collapsed-navigation.jpg)

## Roadmap

See issues.

## License & credits

MIT License. See [LICENSE](./LICENSE).