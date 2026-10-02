import { exportFileName } from '@shared/validate'
import { describe, expect, it } from 'vitest'

/**
 * The name a save dialog suggests for an export (a chat, a deliberation, a note). The chat's lost
 * the backslash from its pattern in a refactor, so a title like `C:\notes\x` suggested folders.
 */
describe('the name an export suggests', () => {
  it('makes every character Windows will not have in a name, a backslash first, a `_`', () => {
    expect(exportFileName('C:\\Users\\me\\x', 'chat')).toBe('C__Users_me_x.md')
    expect(exportFileName('..\\..\\up', 'chat')).toBe('.._.._up.md')
    expect(exportFileName('a/b:c*d?e"f<g>h|i', 'chat')).toBe('a_b_c_d_e_f_g_h_i.md')
  })

  it('uses the fallback for no title, and cuts a long one short', () => {
    expect(exportFileName('', 'motion')).toBe('motion.md')
    expect(exportFileName('x'.repeat(100), 'chat')).toBe(`${'x'.repeat(60)}.md`)
  })
})
