# Ember Studio Windows Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved Ember Studio React/TypeScript/Tauri starter foundation with a reusable smoky-black shell, accent-only Tailwind color profiles, internal and native window infrastructure, generic file/settings services, and placeholder content.

**Architecture:** React + TypeScript + Vite owns the presentation and interaction layers. Tauri v2/Rust owns OS boundaries and persistence through typed commands. Shared shell behavior is organized into focused modules and feature-specific code remains under `src/features/`.

**Tech Stack:** React, TypeScript, Vite, Tauri v2, Rust, Vitest, React Testing Library, `lucide-react`, `tailwindcss/colors`, and project-owned CSS variables/components.

**Spec:** `docs/superpowers/specs/2026-08-26-ember-studio-foundation-design.md`

## Global Constraints

- The main application surface remains opaque smoky-black/charcoal; glass effects are limited to secondary overlays.
- The Ember Studio flame mark and app accents use the selected cool blue/cyan profile by default.
- Color profiles change semantic accents only; structural surfaces, base text, and dividers remain stable.
- No runtime dependency on Myna UI or shadcn/ui.
- No business-specific feature logic is added to shared shell components.
- Tauri/Rust code handles OS boundaries; React code consumes typed service interfaces.
- Every behavior change follows a red-green-refactor test cycle before the next behavior is added.
- Windows-only behavior is documented and validated on Windows after the frontend checks pass in the current environment.

---

### Task 1: Bootstrap the React and Tauri project

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/test/setup.ts`
- Create: `src/app/App.test.tsx`
- Create: `src/styles/index.css`
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/src/lib.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/capabilities/default.json`

**Interfaces:**
- Produces `npm run dev`, `npm run build`, `npm run test`, and `npm run test:watch` scripts.
- Produces a Tauri application entry point with an opaque, resizable, borderless main window configured with a minimum width of 960px and minimum height of 640px.

- [ ] **Step 1: Write the bootstrap smoke test**

```tsx
import { render, screen } from '@testing-library/react';
import { App } from './App';

test('renders the Ember Studio foundation root', () => {
  render(<App />);
  expect(screen.getByText('Ember Studio')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify the missing-app failure**

Run: `npm test -- src/app/App.test.tsx --run`

Expected: FAIL because the project files and `App` implementation do not exist yet.

- [ ] **Step 3: Create the minimal Vite/React/Tauri project configuration**

Use React 18+ with TypeScript, Vite, Vitest, jsdom, React Testing Library, `@tauri-apps/api`, `lucide-react`, `tailwindcss`, and their required type/build packages. Set the Vite dev server to a fixed local port and configure Tauri to use that URL in development and `../dist` in production. Set `decorations` to `false`, `transparent` to `false`, `resizable` to `true`, and `minWidth`/`minHeight` to the values above.

- [ ] **Step 4: Add the smallest `App` implementation and test setup**

```tsx
export function App() {
  return <div data-testid="app-root">Ember Studio</div>;
}
```

Configure Vitest with `environment: 'jsdom'`, the setup file, and the `@testing-library/jest-dom` matchers.

- [ ] **Step 5: Run the smoke test to verify it passes**

Run: `npm test -- src/app/App.test.tsx --run`

Expected: PASS with one test passing.

- [ ] **Step 6: Verify the initial production build**

Run: `npm run build`

Expected: exit code 0 and a generated `dist/` directory.

- [ ] **Step 7: Commit the bootstrap milestone when Git metadata is writable**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig.json tsconfig.node.json src src-tauri
git commit -m "chore: bootstrap Ember Studio Tauri foundation"
```

If the mounted Git metadata remains read-only, record the exact limitation and leave the working tree changes intact.

### Task 2: Build the project-owned design system and color-profile catalog

**Files:**
- Create: `src/types/theme.ts`
- Create: `src/design-system/colorProfiles.ts`
- Create: `src/design-system/themeStore.tsx`
- Create: `src/design-system/theme.css`
- Create: `src/design-system/colorProfiles.test.ts`
- Create: `src/design-system/themeStore.test.tsx`
- Create: `src/design-system/ColorProfilePopover.tsx`
- Create: `src/design-system/ColorProfilePopover.test.tsx`

**Interfaces:**
- Produces `AccentProfile`, `ColorProfileSelection`, `ThemeSettings`, `ColorProfileCatalog`, and `ThemeProvider` types.
- Produces `buildAccentTokens(selection): AccentTokens` and `applyAccentTokens(tokens): void`.
- Produces `ColorProfilePopover` with `value`, `onChange`, and `onClose` props.

- [ ] **Step 1: Write failing profile-mapping tests**

```ts
test('maps the selected Tailwind family and shade to semantic accent tokens', () => {
  const tokens = buildAccentTokens({ family: 'sky', shade: 400 });
  expect(tokens.accent).toBe('#38bdf8');
  expect(tokens.accentSoft).toContain('38bdf8');
  expect(tokens.focusRing).toBe(tokens.accent);
});

test('does not expose excluded Tailwind utility colors as accent families', () => {
  expect(getColorFamilies()).not.toEqual(expect.arrayContaining(['inherit', 'current', 'transparent']));
});
```

- [ ] **Step 2: Run the profile tests to verify the missing-module failure**

Run: `npm test -- src/design-system/colorProfiles.test.ts --run`

Expected: FAIL because the catalog and token functions do not exist.

- [ ] **Step 3: Implement the catalog and semantic mapping**

Import `colors` from `tailwindcss/colors`, preserve the supplied component’s exclusion rule, and derive available families/shades from the imported values. Keep the raw catalog inside the design-system module; components consume only semantic tokens. Define `Slate Blue` as the default cool blue profile backed by `sky-400`, `Graphite` as a slate profile, and `High Contrast` as a higher-contrast cool profile. Keep white/black available as reference swatches but reject them as default accent profiles.

- [ ] **Step 4: Run the profile tests to verify the token behavior**

Run: `npm test -- src/design-system/colorProfiles.test.ts --run`

Expected: PASS with all profile-mapping assertions passing.

- [ ] **Step 5: Write the failing provider and picker tests**

```tsx
test('applies the selected profile to semantic CSS variables', () => {
  render(
    <ThemeProvider initialSelection={{ family: 'cyan', shade: 400 }}>
      <ThemeProbe />
    </ThemeProvider>,
  );
  expect(screen.getByTestId('accent-value')).toHaveTextContent('#22d3ee');
});

test('updates only accent variables when a palette swatch is selected', async () => {
  const user = userEvent.setup();
  render(<ColorProfilePopover value={{ family: 'sky', shade: 400 }} onChange={vi.fn()} onClose={vi.fn()} />);
  await user.click(screen.getByRole('button', { name: /cyan-400/i }));
  expect(screen.getByText(/cyan-400/i)).toBeInTheDocument();
});
```

- [ ] **Step 6: Run the provider/picker tests to verify they fail for the expected reason**

Run: `npm test -- src/design-system/themeStore.test.tsx src/design-system/ColorProfilePopover.test.tsx --run`

Expected: FAIL because the provider, semantic CSS variables, and picker are not implemented.

- [ ] **Step 7: Implement theme state and the Tailwind-style picker**

Create `ThemeProvider` with a typed selection state and `data-color-profile` attributes. Generate CSS variables for accent, accent-strong, accent-soft, focus ring, selected background, and accent text. Render the selected profile, family swatches, and shade swatches in a compact smoky-glass popover. The flame mark and all shell states read semantic variables rather than hard-coded blue values.

- [ ] **Step 8: Run the provider/picker tests to verify they pass**

Run: `npm test -- src/design-system/themeStore.test.tsx src/design-system/ColorProfilePopover.test.tsx --run`

Expected: PASS with no console errors.

- [ ] **Step 9: Commit the design-system milestone when Git metadata is writable**

```bash
git add src/types/theme.ts src/design-system
git commit -m "feat: add semantic accent profiles"
```

### Task 3: Implement the Ember Studio shell and welcome feature

**Files:**
- Create: `src/shell/AppShell.tsx`
- Create: `src/shell/TitleBar.tsx`
- Create: `src/shell/Navigation.tsx`
- Create: `src/shell/StatusBar.tsx`
- Create: `src/shell/LogoMark.tsx`
- Create: `src/features/foundation-welcome/FoundationWelcome.tsx`
- Create: `src/navigation/navigationTypes.ts`
- Create: `src/navigation/navigationRegistry.ts`
- Create: `src/shell/shell.css`
- Create: `src/shell/AppShell.test.tsx`
- Create: `src/shell/Navigation.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles/index.css`

**Interfaces:**
- Produces `NavigationItem`, `NavigationRegistry`, and `ShellRoute` types.
- Produces `AppShell` props for `navigation`, `children`, and `statusContent`.
- Produces `TitleBar` callbacks `onMinimize`, `onToggleMaximize`, and `onClose`, with a platform adapter for Tauri and a browser-safe fallback.

- [ ] **Step 1: Write failing shell tests**

```tsx
test('renders the full-height navigation and custom title-bar actions', () => {
  render(<AppShell />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /minimize/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /maximize/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
});

test('collapses navigation and keeps icon labels accessible', async () => {
  const user = userEvent.setup();
  render(<AppShell />);
  await user.click(screen.getByRole('button', { name: /collapse navigation/i }));
  expect(screen.getByRole('navigation')).toHaveAttribute('data-collapsed', 'true');
  expect(screen.getByRole('button', { name: 'Files' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the shell tests to verify the expected missing-component failures**

Run: `npm test -- src/shell/AppShell.test.tsx src/shell/Navigation.test.tsx --run`

Expected: FAIL because the shell files do not exist.

- [ ] **Step 3: Implement the navigation registry and shell primitives**

Register Home, Files, Workspace, Tools, Settings, and About with Lucide icons. Render the blue Ember flame mark through `LogoMark` using the selected semantic accent. Add the opaque title bar, drag region, native actions, expanded/collapsed navigation states, keyboard-visible focus, delayed compact tooltips, open workspace, and bottom status bar. Keep CSS selectors and layout primitives local to the project.

- [ ] **Step 4: Add the foundation welcome feature**

Render the selected visual target’s open workspace: foundation title, short explanation, four restrained capability rows, one primary “New workspace” action, and a placeholder utility-window trigger. Keep the copy generic and avoid business-specific data.

- [ ] **Step 5: Run the shell tests to verify they pass**

Run: `npm test -- src/shell/AppShell.test.tsx src/shell/Navigation.test.tsx --run`

Expected: PASS with no accessibility-role failures or console errors.

- [ ] **Step 6: Run the browser build after shell integration**

Run: `npm run build`

Expected: exit code 0 and a rendered app bundle.

- [ ] **Step 7: Commit the shell milestone when Git metadata is writable**

```bash
git add src/app/App.tsx src/shell src/navigation src/features/foundation-welcome src/styles
git commit -m "feat: add Ember Studio desktop shell"
```

### Task 4: Add the reusable internal window manager

**Files:**
- Create: `src/windows/windowTypes.ts`
- Create: `src/windows/windowRegistry.ts`
- Create: `src/windows/windowManager.ts`
- Create: `src/windows/WindowManagerProvider.tsx`
- Create: `src/windows/InternalWindow.tsx`
- Create: `src/windows/windowGeometry.ts`
- Create: `src/windows/windowManager.test.ts`
- Create: `src/windows/InternalWindow.test.tsx`
- Modify: `src/features/foundation-welcome/FoundationWelcome.tsx`

**Interfaces:**
- Produces `WindowDescriptor`, `FeatureDescriptor`, `WindowBounds`, `WindowState`, and `WindowManagerApi`.
- Produces `clampBounds(bounds, workspace, minimum): WindowBounds` and `bringToFront(windows, id): WindowDescriptor[]`.
- Produces `WindowManagerProvider` actions `open`, `close`, `minimize`, `restore`, `toggleMaximize`, `focus`, `move`, and `resize`.

- [ ] **Step 1: Write failing geometry and z-order tests**

```ts
test('clamps a moved window so its header remains reachable', () => {
  const result = clampBounds({ x: -600, y: -500, width: 720, height: 480 }, { width: 1200, height: 700 }, { width: 360, height: 240 });
  expect(result.x).toBeGreaterThanOrEqual(-result.width + 96);
  expect(result.y).toBeGreaterThanOrEqual(0);
});

test('focus moves the selected window to the highest z-index', () => {
  const result = bringToFront([{ id: 'a', zIndex: 1 }, { id: 'b', zIndex: 2 }], 'a');
  expect(result.find((window) => window.id === 'a')?.zIndex).toBe(3);
});
```

- [ ] **Step 2: Run the geometry tests to verify they fail before implementation**

Run: `npm test -- src/windows/windowManager.test.ts --run`

Expected: FAIL because the geometry and z-order functions do not exist.

- [ ] **Step 3: Implement pure window geometry and reducer behavior**

Use a reducer with serializable actions and descriptors. Clamp x/y to keep at least 96px of the header visible and clamp width/height to minimum dimensions. Store normal bounds separately when maximized so restore returns to the prior size. Do not read from the DOM inside the reducer.

- [ ] **Step 4: Run the geometry tests to verify they pass**

Run: `npm test -- src/windows/windowManager.test.ts --run`

Expected: PASS.

- [ ] **Step 5: Write failing internal-window interaction tests**

```tsx
test('clicking an inactive window requests focus', async () => {
  const user = userEvent.setup();
  const onFocus = vi.fn();
  render(<InternalWindow descriptor={sampleWindow} onFocus={onFocus}>Content</InternalWindow>);
  await user.click(screen.getByRole('heading', { name: /data explorer/i }));
  expect(onFocus).toHaveBeenCalledWith('data-explorer');
});

test('renders window actions with accessible labels', () => {
  render(<InternalWindow descriptor={sampleWindow} onFocus={vi.fn()}>Content</InternalWindow>);
  expect(screen.getByRole('button', { name: /minimize data explorer/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /maximize data explorer/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /close data explorer/i })).toBeInTheDocument();
});
```

- [ ] **Step 6: Run the interaction tests to verify they fail for the expected reason**

Run: `npm test -- src/windows/InternalWindow.test.tsx --run`

Expected: FAIL because the internal window component is not implemented.

- [ ] **Step 7: Implement drag, resize, focus, and window controls**

Use pointer capture on the header and resize handles. Convert pointer deltas into reducer actions, clamp each update to the workspace bounds, and cancel the operation on pointer cancellation. Render active/inactive title states, visible focus rings, and a resize cursor for each edge/corner. Add a foundation `Data Explorer` placeholder window to demonstrate simultaneous workspace content and an internal window.

- [ ] **Step 8: Run all window tests and the build**

Run: `npm test -- src/windows --run && npm run build`

Expected: PASS and exit code 0 for the build.

- [ ] **Step 9: Commit the internal-window milestone when Git metadata is writable**

```bash
git add src/windows src/features/foundation-welcome
git commit -m "feat: add reusable internal window manager"
```

### Task 5: Add generic file, settings, notifications, dialogs, and detail-information services

**Files:**
- Create: `src/services/contracts.ts`
- Create: `src/services/browserAdapters.ts`
- Create: `src/file-system/fileTypes.ts`
- Create: `src/file-system/fileService.ts`
- Create: `src/file-system/fileController.ts`
- Create: `src/file-system/fileService.test.ts`
- Create: `src/settings/settingsTypes.ts`
- Create: `src/settings/settingsService.ts`
- Create: `src/settings/settingsStore.tsx`
- Create: `src/settings/settingsService.test.ts`
- Create: `src/notifications/NotificationProvider.tsx`
- Create: `src/notifications/notificationTypes.ts`
- Create: `src/notifications/NotificationProvider.test.tsx`
- Create: `src/dialogs/DialogProvider.tsx`
- Create: `src/tooltips/InfoTooltip.tsx`
- Create: `src/tooltips/DetailPopover.tsx`
- Create: `src/tooltips/DetailPopover.test.tsx`
- Modify: `src/design-system/themeStore.tsx`
- Modify: `src/shell/AppShell.tsx`

**Interfaces:**
- Produces `FileService` with `newDocument`, `open`, `save`, and `saveAs` methods returning typed `FileOperationResult` values.
- Produces `SettingsService` with `load`, `save`, and `reset` methods for versioned `AppSettings`.
- Produces `NotificationApi` and `DialogApi` contexts.
- Produces `DetailPopover` props for title, description, guidance, shortcut, status, and optional warning.

- [ ] **Step 1: Write failing file-service tests**

```ts
test('returns a cancelled result when the user cancels open', async () => {
  const service = createMemoryFileService({ openPath: null });
  await expect(service.open()).resolves.toEqual({ kind: 'cancelled' });
});

test('reports a missing file without throwing a UI-breaking error', async () => {
  const service = createMemoryFileService({ readError: 'not-found' });
  await expect(service.open()).resolves.toEqual({ kind: 'error', code: 'not-found' });
});
```

- [ ] **Step 2: Run file-service tests to verify the expected missing-module failure**

Run: `npm test -- src/file-system/fileService.test.ts --run`

Expected: FAIL because the service contracts and adapter are not implemented.

- [ ] **Step 3: Implement typed file and settings contracts**

Use a generic UTF-8 `TextDocument` with `path`, `content`, `dirty`, and `format` fields. Map cancellation, not-found, permission, and unknown errors to stable discriminated unions. Keep `FileService` independent of React. Define `AppSettings` with `version`, `colorProfile`, `navigationCollapsed`, `recentFiles`, and `windows`.

- [ ] **Step 4: Run file-service tests to verify they pass**

Run: `npm test -- src/file-system/fileService.test.ts --run`

Expected: PASS.

- [ ] **Step 5: Write failing settings tests**

```ts
test('falls back to safe defaults when persisted settings are invalid', async () => {
  const service = createMemorySettingsService('{"version":"bad","colorProfile":null}');
  await expect(service.load()).resolves.toMatchObject({ version: 1, colorProfile: { family: 'sky', shade: 400 } });
});

test('persists the selected accent profile without changing structural settings', async () => {
  const service = createMemorySettingsService();
  await service.save({ ...defaultSettings, colorProfile: { family: 'cyan', shade: 400 } });
  await expect(service.load()).resolves.toMatchObject({ navigationCollapsed: false, colorProfile: { family: 'cyan', shade: 400 } });
});
```

- [ ] **Step 6: Run settings tests to verify they fail for the expected reason**

Run: `npm test -- src/settings/settingsService.test.ts --run`

Expected: FAIL because validation, fallback, and persistence are not implemented.

- [ ] **Step 7: Implement settings, notification, dialog, and tooltip providers**

Persist settings through an adapter interface with a memory adapter for browser tests. Connect the theme provider and navigation/window state to settings. Add toasts for file operation results, reusable confirmation/error dialogs, loading/progress components, and a delayed `DetailPopover` that remains within the viewport and supports pointer/focus entry. Keep content configurable and interaction non-blocking.

- [ ] **Step 8: Run service/provider tests and the build**

Run: `npm test -- src/file-system src/settings src/notifications src/tooltips --run && npm run build`

Expected: PASS and exit code 0 for the build.

- [ ] **Step 9: Commit the service milestone when Git metadata is writable**

```bash
git add src/services src/file-system src/settings src/notifications src/dialogs src/tooltips src/design-system/themeStore.tsx src/shell/AppShell.tsx
git commit -m "feat: add reusable file settings and feedback services"
```

### Task 6: Connect Tauri native windows and OS services

**Files:**
- Create: `src/external-windows/externalWindowTypes.ts`
- Create: `src/external-windows/externalWindowService.ts`
- Create: `src/external-windows/externalWindowService.test.ts`
- Create: `src/external-windows/ExternalWindowRoute.tsx`
- Create: `src-tauri/capabilities/default.json`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src/services/browserAdapters.ts`

**Interfaces:**
- Produces `ExternalWindowService.openFeature(feature): Promise<ExternalWindowState>` and `focusFeature(feature): Promise<void>`.
- Produces application-data settings commands with JSON-compatible inputs/outputs. Native text I/O remains deferred until a dialog-picker/token authority boundary exists; it must not accept webview-supplied path strings.
- Produces a stable external route that renders the selected feature with the same title bar and theme.

- [ ] **Step 1: Write failing external-window adapter tests**

```ts
test('reuses the stable native-window label for a feature', async () => {
  const createWindow = vi.fn().mockResolvedValue({ label: 'feature-data-explorer' });
  const service = createExternalWindowService({ createWindow });
  await service.openFeature({ key: 'data-explorer', title: 'Data Explorer' });
  await service.openFeature({ key: 'data-explorer', title: 'Data Explorer' });
  expect(createWindow).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run the external-window test to verify the expected missing-service failure**

Run: `npm test -- src/external-windows/externalWindowService.test.ts --run`

Expected: FAIL because the adapter is not implemented.

- [ ] **Step 3: Implement the browser-safe and Tauri external-window adapters**

Use a stable label such as `ember-feature-${feature.key}`. In Tauri, create or focus a `WebviewWindow` with `decorations: false`, `transparent: false`, `resizable: true`, minimum dimensions, and the feature route. In browser tests, return a deterministic mock state. Report internal/external/dual mode through the feature registry rather than through component-specific flags.

- [ ] **Step 4: Implement Rust commands and Tauri capabilities**

Register async commands for UTF-8 file read/write and JSON settings load/save under the application data directory. Return serializable error codes. Add only the capabilities required by the app window, dialog/file operations, and commands. Keep filesystem access scoped to explicit user-selected paths and the app data directory.

- [ ] **Step 5: Run external-window tests and frontend build**

Run: `npm test -- src/external-windows --run && npm run build`

Expected: PASS and exit code 0 for the build.

- [ ] **Step 6: Run Rust checks when the toolchain is available**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`

Expected: exit code 0 on a machine with the Rust/Tauri toolchain and dependencies available. If the current environment cannot compile Windows/Tauri dependencies, record that limitation for the Windows acceptance pass.

- [ ] **Step 7: Commit the native-boundary milestone when Git metadata is writable**

```bash
git add src/external-windows src/services/browserAdapters.ts src-tauri
git commit -m "feat: add Tauri native window and OS adapters"
```

### Task 7: Integrate the starter template, documentation, and full verification

**Files:**
- Create: `README.md`
- Create: `docs/architecture/backend-boundary.md`
- Create: `docs/architecture/feature-extension-guide.md`
- Create: `src/tests/foundation.integration.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/shell/AppShell.tsx`
- Modify: `src/features/foundation-welcome/FoundationWelcome.tsx`

**Interfaces:**
- Produces documented instructions for adding a future feature, registering an internal/external presentation mode, and replacing a service adapter with Java, Python, Rust, or C# communication.
- Produces an integration test covering app launch, navigation collapse, profile selection, internal window opening, and unsaved-file confirmation.

- [ ] **Step 1: Write the failing foundation integration test**

```tsx
test('supports the primary foundation journey', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: /collapse navigation/i }));
  await user.click(screen.getByRole('button', { name: /color profiles/i }));
  await user.click(screen.getByRole('button', { name: /cyan-400/i }));
  await user.click(screen.getByRole('button', { name: /open data explorer/i }));
  expect(screen.getByRole('heading', { name: /data explorer/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the integration test to verify the missing-wiring failure**

Run: `npm test -- src/tests/foundation.integration.test.tsx --run`

Expected: FAIL because the providers and shell actions are not fully wired together.

- [ ] **Step 3: Wire the app providers and foundation journey**

Compose providers in this order: settings, theme, notifications, dialogs, tooltips, window manager, and shell. Connect profile changes to settings persistence, the gear control to the profile popover, the welcome action to the internal-window registry, and file dirty-state changes to confirmation dialogs.

- [ ] **Step 4: Run the integration test to verify it passes**

Run: `npm test -- src/tests/foundation.integration.test.tsx --run`

Expected: PASS with no unhandled promises or console errors.

- [ ] **Step 5: Write the backend boundary documentation**

Document the typed service interfaces, Tauri command payloads, local HTTP/WebSocket replacement point, asynchronous job guidance, error codes, and the rule that long-running work must not run on the React UI thread. Include one short example of a future Python/Java/Rust/C# adapter implementing the same interface.

- [ ] **Step 6: Write the feature-extension guide and README**

Document local development, browser preview, Tauri development, Windows packaging, folder structure, color profile registration, internal/external/dual feature registration, file-service extension points, and the Windows validation checklist.

- [ ] **Step 7: Run the complete frontend verification**

Run: `npm test -- --run && npm run build`

Expected: all tests pass, the build exits 0, and no warnings/errors are emitted by the test runner or build.

- [ ] **Step 8: Run repository hygiene checks**

Run: `git diff --check` and `rg -n "localhost|127\.0\.0\.1" README.md docs src src-tauri --glob '!**/node_modules/**'`

Expected: `git diff --check` exits 0. Any localhost references are limited to documented development service endpoints; no unfinished implementation markers remain.

- [ ] **Step 9: Commit the completed starter template when Git metadata is writable**

```bash
git add README.md docs src package.json package-lock.json src-tauri
git commit -m "feat: complete Ember Studio starter foundation"
```

- [ ] **Step 10: Perform the Windows acceptance pass**

On Windows 11, run `npm install`, `npm run tauri dev`, and the full test/build commands. Verify borderless move/minimize/maximize/close, edge/corner resizing, minimum dimensions, multi-monitor movement, DPI scaling, navigation persistence, internal window drag/resize/z-order, external feature windows, native dialogs, file error states, settings persistence, and switching several Tailwind accent families/shades. Package a clean-machine build with `npm run tauri build` and record the result in the README validation section.
