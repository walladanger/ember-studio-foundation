# Local service boundary

React components use typed service interfaces only. `NativeWindowService` controls the current Tauri window, `ExternalWindowService` owns feature-window labels and duplicate focus, and `WindowStateService` serializes only a versioned `{ bounds?, maximized }` JSON payload. Browser adapters are deterministic no-ops or in-memory stores, so component tests never require Tauri.

Tauri commands accept and return JSON-compatible payloads. The external window commands use a validated feature id and a stable `ember-feature-<id>` label. Settings remain under the application-data directory and return a serializable `{ code, message }` error. Blocking settings I/O runs through Tauri's blocking executor, never on the React/UI thread.

Native text-file I/O is deliberately not exposed to the webview: there is no command that accepts a path string. A future picker must establish authority with a native dialog and an opaque selection/token capability (or a strictly canonicalized app-data allowlist) before text I/O can be added. React feature code must never manufacture filesystem paths or treat an absolute path as authorization.

Future Java, Python, Rust, or C# services replace an adapter rather than component code. Keep the same TypeScript interface and transport a typed JSON request/response over a Tauri command, local HTTP, or WebSocket. For example, a Python local service can expose `POST /v1/features/{id}/run` returning `{ "kind": "success", "value": ... } | { "kind": "failure", "code": "..." }`; a `PythonFeatureAdapter` translates that response into the shared TypeScript contract. Start long-running work asynchronously, expose progress/cancellation through events or WebSocket messages, and never run jobs on the UI thread.

Windows restoration stores logical bounds but does not clamp them to a presumed monitor: coordinates can be negative on a left-hand monitor and DPI/topology can change between launches. On native startup, validate JSON shape, then let the platform place a window safely when a saved rectangle is no longer viable. Validate this behavior on Windows with per-monitor DPI and multi-monitor setups.

Native validation status: this environment has no `cargo` or `rustc`, so `cargo check` and native Windows runtime validation remain pending. Frontend tests, TypeScript, Vite production build, and static Tauri source/config checks pass.
