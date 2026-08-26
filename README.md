# Ember Studio Foundation

Reusable Windows desktop application foundation built with React, TypeScript, Vite, and Tauri.

The project provides a smoky-black, blue-accented desktop shell for future applications, including:

- Borderless custom title bar with native window controls
- Collapsible navigation and project-owned design tokens
- Internal window manager with move, resize, minimize, maximize, and z-order behavior
- Optional external Tauri feature windows
- Generic file, settings, notification, dialog, tooltip, and feedback service boundaries
- Placeholder Data Explorer and foundation welcome experience
- Typed service contracts for future Java, Python, Rust, C#, or local HTTP/WebSocket services

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

The main application surface is opaque. Smoky glass treatment is reserved for secondary panels, popovers, and overlays.

## License

Released under the MIT License. See [LICENSE](./LICENSE).
