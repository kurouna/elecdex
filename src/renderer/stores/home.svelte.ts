/**
 * The user's home folder, asked of main once and shared, for labels that call it `~`.
 */
class HomeStore {
  private value = $state<string | null>(null)
  private asked = false

  get path(): string | null {
    if (!this.asked) {
      this.asked = true
      void window.elecdex.system.info().then((info) => {
        this.value = info.host.home
      })
    }
    return this.value
  }
}

export const home = new HomeStore()
