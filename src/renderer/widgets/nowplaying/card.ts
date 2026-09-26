import { formatClock, type NowPlayingSession } from '@shared/now-playing'
import type { CardRow } from '../../lib/hover-card.ts'

/**
 * What the NOW PLAYING card says under the art: the whole of what the pane
 * cuts (an artist or album past the pane's width), and what it has no room
 * for at all - the player's own id, the length of a stream, the art's size.
 */
export function nowPlayingRows(session: NowPlayingSession): CardRow[] {
  const rows: CardRow[] = []
  if (session.artist) rows.push({ label: 'artist', value: session.artist })
  if (session.album) rows.push({ label: 'album', value: session.album })
  rows.push({
    label: 'player',
    value:
      session.appId !== '' && session.appId.toLowerCase() !== session.app.toLowerCase()
        ? `${session.app} · ${session.appId}`
        : session.app,
  })
  rows.push({
    label: 'length',
    value: session.duration === null ? 'no length (a stream)' : formatClock(session.duration),
  })
  if (session.artSize)
    rows.push({
      label: 'art',
      value: `${session.artSize.width} × ${session.artSize.height} px`,
      muted: true,
    })
  if (session.others > 0)
    rows.push({
      label: 'others',
      value: `${session.others} more ${session.others === 1 ? 'player' : 'players'}: Windows chooses the one shown`,
      muted: true,
    })
  return rows
}
