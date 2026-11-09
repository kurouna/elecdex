/**
 * The stand-in gh's star history, for the demos and the screenshots (docs/demos.md): main keeps
 * the daily star counts of public repositories in github-stars.json, and a fresh profile has
 * only today, so a REPOS tile would draw no month's line.
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'

/**
 * A month of made-up daily star counts for the stand-in's public repositories, as main notes
 * them in github-stars.json, so a REPOS tile draws its month's line: a fresh profile has only
 * today. Each climbs to the count the stand-in gives today, unevenly, as stars come.
 */
export function starHistory(profile) {
  const today = {
    'octo-aki/tern': 4823,
    'octo-aki/lumen-cli': 1290,
    'octo-aki/wasm-sketch': 96,
    'octo-aki/dotfiles': 214,
  }
  const gained = {
    'octo-aki/tern': 312,
    'octo-aki/lumen-cli': 84,
    'octo-aki/wasm-sketch': 13,
    'octo-aki/dotfiles': 5,
  }
  const day = (back) => {
    const d = new Date(Date.now() - back * 86_400_000)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const notes = Object.fromEntries(
    Object.entries(today).map(([repo, stars]) => [
      repo,
      Object.fromEntries(
        Array.from({ length: 30 }, (_, i) => {
          const back = 30 - i
          // Uneven steps: a quiet stretch, then a burst a week or so ago, as a mention brings.
          const share = (i / 30) ** 1.6 + (i > 20 ? 0.08 * Math.sin(i) : 0)
          return [day(back), Math.round(stars - gained[repo] * (1 - Math.min(1, share)))]
        }),
      ),
    ]),
  )
  writeFileSync(path.join(profile, 'github-stars.json'), JSON.stringify(notes))
}
