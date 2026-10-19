import { type BackgroundCapabilities, backgroundOffered } from '@shared/background'

/**
 * The settings dialog's sections, in its order: the dialog draws them, and the action palette
 * offers each as a row that opens the dialog there (docs/palette.md Q4).
 */

export type SettingsSection =
  | 'general'
  | 'window'
  | 'keyboard'
  | 'alerts'
  | 'ai'
  | 'plugins'
  | 'updates'

export function settingsSections(
  capabilities: BackgroundCapabilities,
): Array<{ id: SettingsSection; label: string }> {
  return [
    { id: 'general', label: 'general' },
    // Only where there is something to offer: what that is differs by platform,
    // and on Linux by the desktop.
    ...(backgroundOffered(capabilities) ? [{ id: 'window' as const, label: 'window' }] : []),
    { id: 'keyboard', label: 'keyboard' },
    { id: 'alerts', label: 'alerts' },
    { id: 'ai', label: 'ai' },
    { id: 'plugins', label: 'plugins' },
    { id: 'updates', label: 'updates' },
  ]
}
