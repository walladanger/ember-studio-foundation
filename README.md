# Ember Studio Foundation

Reusable Windows desktop application foundation built with React, TypeScript, Vite, and Tauri. Ember Studio is intentionally business-domain neutral so it can become the starting point for data, media, AI, monitoring, file-viewing, vehicle-data, or other specialized desktop applications.

The project provides a smoky-black, blue-accented desktop shell for future applications, including:

- Borderless custom title bar with native window controls
- Collapsible navigation and project-owned design tokens
- Internal window manager with move, resize, minimize, maximize, and z-order behavior
- Optional external Tauri feature windows
- Generic file, settings, notification, dialog, tooltip, and feedback service boundaries
- Placeholder Data Explorer and foundation welcome experience
- Typed service contracts for future Java, Python, Rust, C#, or local HTTP/WebSocket services

The application uses an opaque smoky-black main surface with restrained blue accents. Secondary menus, popovers, and information panels may use smoky glass treatment without making the primary workspace transparent.

## Development

Install dependencies and start the frontend preview:

```bash
npm install
npm run dev
```

Run the frontend checks:

```bash
npm test
npm run build
```

For native Windows development, install the Tauri v2 prerequisites and run the project with the Tauri CLI from a Windows machine. Native compilation and Windows runtime validation are intentionally kept separate from the browser-compatible frontend tests.

## Foundation conventions

- Keep reusable infrastructure in the shared folders listed below.
- Put application-specific behavior under `src/features/<feature-name>`.
- Keep file processing, persistence, and long-running work behind typed services instead of React components.
- Use the project-owned design tokens and shared feedback components when adding UI.
- Treat Tauri commands as a native boundary with JSON-compatible contracts.

## Windows acceptance

The frontend test suite, TypeScript project check, and Vite production build run in this repository. Before shipping a Windows application based on this template, also validate the native Tauri build and runtime behavior on Windows, including borderless dragging, resize edges and corners, minimize/maximize/restore, multi-monitor placement, per-monitor DPI, external feature windows, and saved window state.

## Architecture

- `src/app` — application composition
- `src/shell` — title bar, navigation, status bar, and branding
- `src/design-system` — editable tokens, color profiles, and theme state
- `src/windows` — reusable internal and native window infrastructure
- `src/external-windows` — feature window lifecycle and routing
- `src/file-system`, `src/settings`, `src/notifications`, `src/dialogs`, `src/tooltips`, `src/feedback` — shared service boundaries
- `src/features` — future application-specific features
- `src-tauri` — native Windows/Tauri commands and persistence boundary
- `docs/architecture/backend-boundary.md` — backend integration guidance

## Backend integration

Future local services can replace adapters without changing feature components. A Java, Python, Rust, or C# worker can communicate through a Tauri command, local HTTP, WebSocket, JSON message channel, or another documented transport. Long-running work should report progress and cancellation asynchronously rather than blocking the React UI thread.

The main application surface is opaque. Smoky glass treatment is reserved for secondary panels, popovers, and overlays.

## Visual previews

Click either preview to open the full-size image on GitHub.

[![Ember Studio shell with Data Explorer and color profiles](docs/screenshots/ember-studio-color-profiles.jpg)](docs/screenshots/ember-studio-color-profiles.jpg)

[![Collapsed navigation with hover tooltip](docs/screenshots/ember-studio-collapsed-navigation.jpg)](docs/screenshots/ember-studio-collapsed-navigation.jpg)

## License

Released under the MIT License. See [LICENSE](./LICENSE).
