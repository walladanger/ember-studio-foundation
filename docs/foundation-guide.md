# Foundation Guide

The application uses an opaque smoky-black main surface with restrained blue accents. Secondary menus, popovers, and information panels may use smoky glass treatment without making the primary workspace transparent.

## Foundation conventions

- Keep reusable infrastructure in the shared folders listed below:
  - `src/app`
  - `src/shell`
  - `src/design-system`
  - `src/windows`
  - `src/external-windows`
  - the shared service folders
  - `src/features`
  - `src-tauri`
  - `docs/architecture/backend-boundary.md`
- Put application-specific behavior under `src/features/<feature-name>`.
- Keep file processing, persistence, and long-running work behind typed services instead of React components.
- Use the project-owned design tokens and shared feedback components when adding UI.
- Treat Tauri commands as a native boundary with JSON-compatible contracts.

## Windows acceptance

The frontend test suite, TypeScript project check, and Vite production build run in this repository. Before shipping a Windows application based on this template, also validate the native Tauri build and runtime behavior on Windows, including borderless dragging, resize edges and corners, minimize/maximize/restore, multi-monitor placement, per-monitor DPI, external feature windows, and saved window state.

For native Windows development, install the Tauri v2 prerequisites and run the project with the Tauri CLI from a Windows machine. Native compilation and Windows runtime validation are intentionally kept separate from the browser-compatible frontend tests.

## Backend integration

Future local services can replace adapters without changing feature components. A Java, Python, Rust, or C# worker can communicate through a Tauri command, local HTTP, WebSocket, JSON message channel, or another documented transport. Long-running work should report progress and cancellation asynchronously rather than blocking the React UI thread.

## GitHub automation

The repository includes three lightweight GitHub automations:

- **CI** runs the frontend tests, TypeScript check, Vite build, and a Windows native `cargo check`.
- **CodeQL** scans the JavaScript/TypeScript source for security problems and coding errors.
- **Dependabot** opens weekly dependency update pull requests for npm and Cargo packages.

These checks are designed to run before changes are merged into `main`.
