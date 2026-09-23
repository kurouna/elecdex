/**
 * The git pane's commit graph: which column each commit sits in, and the lines
 * that join it to the rows above and below, as VS Code and `git log --graph`
 * draw it. Pure, so every shape - a branch, a merge, an octopus, a history cut
 * off at the page's end - is unit-tested; the pane only draws what this says.
 *
 * The commits come child before parent (`git log --topo-order`). Each column is
 * a lane waiting for one commit; a commit takes the lane that waits for it (or
 * a free one; the leftmost when several wait), every other lane waiting for it
 * joins it there, its first parent carries its lane on, and each other parent
 * gets a lane of its own - or joins the lane already waiting for it.
 */

/** One line in a row: from a column at one edge to a column at the node's height. */
export interface GraphEdge {
  from: number
  to: number
  /** The lane's colour, as an index the pane turns into a theme colour. */
  color: number
}

export interface GraphRow {
  oid: string
  column: number
  color: number
  /** More than one parent. */
  merge: boolean
  /** Lines from the row's top edge to the node's height: `from` is at the top. */
  top: GraphEdge[]
  /** Lines from the node's height to the row's bottom edge: `to` is at the bottom. */
  bottom: GraphEdge[]
  /** Columns the row spans. */
  width: number
}

interface Lane {
  oid: string
  color: number
}

const freeColumn = (lanes: (Lane | null)[]): number => {
  const free = lanes.indexOf(null)
  return free < 0 ? lanes.length : free
}

const trim = (lanes: (Lane | null)[]): void => {
  while (lanes.length > 0 && lanes[lanes.length - 1] === null) lanes.pop()
}

export function graphRows(
  commits: readonly { oid: string; parents: readonly string[] }[],
): GraphRow[] {
  const lanes: (Lane | null)[] = []
  let colors = 0
  const rows: GraphRow[] = []
  for (const commit of commits) {
    let column = lanes.findIndex((lane) => lane?.oid === commit.oid)
    // A lane waits for this commit only if a child came before it; a branch tip starts one.
    const tip = column < 0
    if (tip) column = freeColumn(lanes)
    const color = tip ? colors++ : (lanes[column] as Lane).color
    const top: GraphEdge[] = []
    lanes.forEach((lane, j) => {
      if (lane === null) return
      top.push({ from: j, to: lane.oid === commit.oid ? column : j, color: lane.color })
    })
    const before = lanes.length
    // Every lane that waited for this commit ends in it.
    for (let j = 0; j < lanes.length; j++) if (lanes[j]?.oid === commit.oid) lanes[j] = null
    const joins = placeParents(lanes, commit.parents, column, color, () => colors++)
    const bottom: GraphEdge[] = []
    lanes.forEach((lane, j) => {
      if (lane === null) return
      // A lane a parent took just now starts at the node; the others pass straight down.
      bottom.push({ from: joins.has(j) ? column : j, to: j, color: lane.color })
    })
    for (const [j, color] of joins.merged) bottom.push({ from: column, to: j, color })
    const width = Math.max(before, lanes.length, column + 1)
    trim(lanes)
    rows.push({
      oid: commit.oid,
      column,
      color,
      merge: commit.parents.length > 1,
      top,
      bottom,
      width,
    })
  }
  return rows
}

/**
 * Gives the parents their lanes. The first parent carries on the commit's own
 * lane; each other parent joins the lane waiting for it, or takes a free one.
 * Returns the lanes started from this node (`has`) and the lanes it joined
 * that go on for others too (`merged`, with their colours).
 */
function placeParents(
  lanes: (Lane | null)[],
  parents: readonly string[],
  column: number,
  color: number,
  newColor: () => number,
): { has(j: number): boolean; merged: Map<number, number> } {
  const started = new Set<number>()
  const merged = new Map<number, number>()
  parents.forEach((parent, i) => {
    // The first parent always carries the lane on, so a main line stays in its column; lanes
    // waiting for the same commit meet at its row, where the leftmost takes it.
    if (i === 0) {
      lanes[column] = { oid: parent, color }
      started.add(column)
      return
    }
    const waiting = lanes.findIndex((lane) => lane?.oid === parent)
    if (waiting >= 0) {
      merged.set(waiting, (lanes[waiting] as Lane).color)
      return
    }
    const at = freeColumn(lanes)
    lanes[at] = { oid: parent, color: newColor() }
    started.add(at)
  })
  return { has: (j) => started.has(j), merged }
}
