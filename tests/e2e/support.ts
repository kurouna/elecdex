/**
 * The e2e helpers, one module per concern under support/: launching and quitting the app and its
 * profile (launch), layout trees (layouts), the workspace on screen (workspace), shells (pty),
 * what main is reading or fetching (main), waiting out a window in which nothing may change (quiet),
 * and the window and main's dialogs and clipboard (os); local stand-ins for AI providers and
 * services (stubs/), fixtures, and helpers shared by a few specs (cpu, elec16, measure, plugins,
 * stub-hooks, terminal). support/logwatch.ts is imported by its spec directly: its names
 * are too general for everyone's namespace.
 */
export * from './support/cpu.js'
export * from './support/elec16.js'
export * from './support/fixtures.js'
export * from './support/launch.js'
export * from './support/layouts.js'
export * from './support/main.js'
export * from './support/measure.js'
export * from './support/net-watch.js'
export * from './support/os.js'
export * from './support/plugins.js'
export * from './support/pty.js'
export * from './support/quiet.js'
export * from './support/stub-hooks.js'
export * from './support/stubs/ai.js'
export * from './support/stubs/external.js'
export * from './support/stubs/services.js'
export * from './support/terminal.js'
export * from './support/workspace.js'
