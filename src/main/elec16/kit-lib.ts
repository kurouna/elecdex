import kit from '../../../resources/elec16/games/lib/kit.e16.ts?raw'
import sound from '../../../resources/elec16/games/lib/sound.e16.ts?raw'
import builtins from '../../shared/e16c/builtins.ts?raw'

/**
 * The game kit's library as a new game's folder gets it (docs/elec16-play.md section 11), for
 * the editor alone: the build uses the copies in the app. Bundled into main at build time; the
 * imports are pointed at the folder's own files - the types beside them and the game's
 * generated constants.
 */
export function kitLibFiles(): Record<string, string> {
  const local = (text: string) =>
    text
      .replace(/'\.\.\/\.\.\/\.\.\/\.\.\/src\/shared\/e16c\/builtins'/g, "'./builtins'")
      .replace(/'\.\/kit-assets'/g, "'../assets.e16'")
  return {
    'lib/kit.e16.ts': local(kit),
    'lib/sound.e16.ts': local(sound),
    'lib/builtins.ts': builtins,
  }
}
