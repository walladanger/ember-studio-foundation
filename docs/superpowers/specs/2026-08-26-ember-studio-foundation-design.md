# Ember Studio Windows Foundation Design

**Date:** 2026-08-26  
**Status:** Approved for specification review  
**Visual target:** Ember Studio rebrand of the Slate Operations Canvas direction

## Goal

Create a reusable Windows desktop application foundation that future data, media, AI, monitoring, file-viewing, and vehicle-data applications can copy or clone without rebuilding the desktop shell. The first release contains shared infrastructure and polished placeholder content only; it does not implement a business-specific workflow.

## Product and visual direction

The selected direction is a standalone Ember Studio desktop application with:

- An opaque smoky-black and charcoal main surface.
- A custom borderless title bar with the blue Ember flame mark, Ember Studio name, drag region, and native window actions.
- A cool blue/cyan accent language matching the selected visual reference.
- A full-height collapsible navigation rail.
- An open workspace with a restrained dotted texture, a foundation welcome screen, and a floating internal utility window demonstrating the window manager.
- A compact bottom status area.
- Semi-transparent smoky glass only for secondary popovers, hover detail panels, menus, and dialogs.
- Local, editable components rather than runtime dependencies on Myna UI or shadcn/ui.

The current visual reference uses a blue Ember flame logo. Until a separate brand asset is supplied, the implementation will use a local logo asset or a clearly isolated logo component so it can be replaced without changing the shell.

## Color profile behavior

Settings will expose an accent-only color profile picker based on the Tailwind color catalog represented by the supplied `TailwindColors` component.

- Surface, text, divider, and structural colors remain smoky-black/charcoal across profiles.
- The selected family and shade drive semantic accents: logo, active navigation, focus rings, hover emphasis, selected rows, links, primary action emphasis, progress, and accent status indicators.
- The picker presents named color families and their available shades. `inherit`, `current`, and `transparent` are not selectable accent profiles; black and white remain available only as reference swatches and are not valid default accent profiles.
- The initial profile is `Slate Blue`, implemented as a named profile backed by a cool blue/cyan Tailwind family and shade. Built-in alternates include `Graphite` and `High Contrast`, and the catalog supports future profiles without component changes.
- A profile is stored as a typed settings value containing a profile id, color family, shade, and display name. Components consume semantic CSS variables instead of reading raw palette values.
- Changing profiles updates the interface immediately and persists through the generic settings service.

## Architecture

Use a Tauri v2 desktop shell with a React + TypeScript + Vite frontend.

React owns presentation, interaction state, and feature composition. Tauri/Rust owns operating-system boundaries such as native window creation, application data paths, file dialogs, text file I/O, and persisted preferences. The boundary is expressed through typed service interfaces in the frontend and typed Tauri commands on the backend.

The frontend must not place application-specific business logic in shell components. Future services written in Java, Python, Rust, or C# may replace the Rust placeholder implementations through the same service interfaces using Tauri commands, localhost HTTP, WebSockets, or another documented adapter.

### Frontend layers

1. `design-system`: tokens, semantic CSS variables, profile definitions, primitive controls, and shared visual states.
2. `shell`: custom title bar, navigation, workspace layout, status bar, and application-level shortcuts.
3. `windows`: internal window registry, z-order, move/resize constraints, visibility, and state preservation.
4. `external-windows`: native Tauri window registry, feature routes, duplicate prevention, and synchronization.
5. `file-system`: typed document model, file-service interface, recent files, dirty state, and operation result handling.
6. `settings`: generic preferences model and persistence adapter.
7. `notifications`, `dialogs`, and `tooltips`: reusable user feedback and contextual information infrastructure.
8. `services`: adapter interfaces and placeholder/mock implementations.
9. `features`: future application-specific modules; the first release contains only the foundation welcome feature.

### Backend boundary

Commands and service methods should use serializable JSON-compatible contracts. Long-running processing must be represented as an asynchronous service/job boundary and must not run on the React UI thread. The initial backend only needs enough functionality to prove the boundary: read/write text, open/save dialog selection, load/save settings, and create or focus a native feature window.

## Shell behavior

### Native application window

- Launch as its own Tauri desktop window; never inside Explorer or a visible browser tab.
- Use a borderless custom title bar.
- Support drag-to-move, minimize, maximize/restore, close, resizing from edges/corners, sensible minimum dimensions, multi-monitor movement, and DPI-safe layout.
- Persist the last normal size, position, and maximized state where the platform permits.
- Keep title-bar controls keyboard reachable and expose accessible labels/tooltips.

### Navigation

The navigation registry accepts id, label, icon, route/feature key, optional shortcut, and visibility metadata. The first registry contains Home, Files, Workspace, Tools, Settings, and About.

- Expanded and collapsed modes are persisted.
- Collapsed mode shows icons, accessible labels, and compact tooltips.
- Active, hover, focus-visible, pressed, and disabled states use semantic tokens.
- Navigation does not own feature business logic; it only requests route/feature activation.

### Workspace and internal windows

The workspace maintains a collection of internal window descriptors with id, feature key, title, bounds, minimum bounds, z-index, state, and optional persistence key.

- Windows open, close, minimize, restore, maximize/restore, move, and resize.
- Clicking a window brings it to the front and marks it active.
- Drag and resize operations clamp to the usable workspace bounds so a window cannot be permanently lost.
- The active window has a stronger border/accent and title treatment; inactive windows remain readable.
- Multiple windows can be open simultaneously.
- Feature descriptors declare whether they support internal, external, or dual presentation.

### External native windows

The external-window adapter opens a feature in a separate Tauri webview window using a stable feature label. The registry prevents duplicate conflicting instances where possible, focuses an existing matching window, and reports whether the feature is internal, external, or both.

External windows render the same React shell primitives and selected color profile. They can be independently moved, resized, minimized, maximized/restored, and closed. Position and size are persisted under a feature-specific key when supported.

## File-system foundation

The initial document format is a generic UTF-8 text document with an optional JSON metadata wrapper. The file layer owns file paths, serialization, dirty state, recent files, and operation errors.

Required operations:

- New document/workspace.
- Open/load using a native file picker.
- Save to the current path.
- Save As using a native file picker.
- Recent file list and current path display.
- Confirmation before discarding unsaved changes.
- Correct cancellation, missing-file, permission, and generic failure outcomes.
- Loading/saving state and success/failure feedback.

React components receive typed results and render the state; they do not call filesystem APIs directly.

## Feedback infrastructure

Provide centralized providers/hooks for:

- Toasts with success, information, warning, and error variants.
- Confirmation and error dialogs.
- Loading and progress states.
- Empty, success, warning, and inline validation states.
- Compact tooltips for labels and delayed detailed hover/focus information panels.

The hover-information system uses configurable content, a short delay, pointer/focus support, collision-aware placement, and non-blocking behavior. Simple tooltips and detailed information panels are separate variants.

## Settings foundation

The settings service stores a versioned generic preferences object. Initial fields are:

- `colorProfile`.
- Navigation expanded/collapsed state.
- Recent files.
- Window layout/state records.
- Future application preference namespace.

Settings are accessed through a typed service rather than imported directly from UI components. Invalid or unavailable persisted values fall back to safe defaults and produce a non-blocking warning.

## Project structure

```text
src/
├── app/
├── shell/
├── components/
├── design-system/
├── navigation/
├── windows/
├── external-windows/
├── file-system/
├── settings/
├── notifications/
├── dialogs/
├── tooltips/
├── services/
├── types/
├── features/
│   └── foundation-welcome/
└── tests/
src-tauri/
├── src/
│   └── lib.rs
├── capabilities/
├── icons/
└── tauri.conf.json
docs/
├── architecture/
└── superpowers/
    ├── specs/
    └── plans/
```

## Testing and validation

Frontend tests use Vitest and React Testing Library where interaction rendering is required. Unit tests cover profile mapping, settings fallback, navigation registration, window bounds/z-order, dirty-file prompts, recent-file updates, and service error mapping. Component tests cover title-bar action requests, collapsed navigation accessibility, profile selection, internal window controls, and notification/dialog rendering.

The frontend build and tests must run in the current development environment. Physical Windows/Tauri validation remains a separate acceptance pass on Windows and must verify borderless window behavior, DPI, multi-monitor movement, file dialogs, native external windows, and clean-machine packaging.

## Non-goals for the first release

- No business-specific data, media, AI, vehicle, or monitoring feature.
- No remote backend service implementation.
- No runtime dependency on Myna UI or shadcn/ui.
- No transparent main application surface.
- No broad unrelated refactor or application-specific logic in shared components.

## Acceptance criteria

1. A fresh clone can be started as a React/Tauri project with the foundation welcome screen.
2. The app uses the Ember Studio name and blue flame mark with the cool blue/cyan Slate visual language.
3. The main window is standalone, borderless, opaque, resizable, movable, and has functional custom title-bar actions.
4. Navigation expands/collapses and preserves its state.
5. The internal window manager supports multiple draggable/resizable windows with z-order and boundary limits.
6. A feature can open internally or in a separate native Tauri window through a reusable registry.
7. New/open/save/save-as, recent files, dirty state, cancellation, and common file errors have typed service paths and visible feedback.
8. Settings persist the navigation state, window state, recent files, and accent-only color profile.
9. The color profile picker exposes the supplied Tailwind-style color families and shades while leaving structural surfaces stable.
10. Automated frontend verification passes, and the remaining Windows-only validation steps are documented.
