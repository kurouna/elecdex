import { expect, type Locator, type Page, test } from '@playwright/test'
import { launch, paneById, poweredOn, removeDir, settleLayout, waitForSaved } from '../support.js'

/**
 * The persistence contract (docs/e2e-design.md, sections 3.1-3.2): what a widget keeps in its
 * pane state (`widgetState.patch`) reaches layout.json and comes back after a real restart - one
 * round trip, for a few widgets' choices at once. How each widget patches its state is the
 * component tests'; what main keeps in files of its own (the CHIP-8 library, a unit's battery,
 * snippets, notes) is each pane's spec's.
 */

interface Choice {
  /** The pane's id in the layout below. */
  pane: string
  /** What the choice writes into the pane's state. */
  state: Record<string, unknown>
  /** Makes the choice, as a person does. */
  choose(pane: Locator): Promise<void>
  /** What shows that the pane has it. */
  shown(pane: Locator): Promise<void>
}

/** One choice of each widget, none of them its default. */
const CHOICES: Record<string, Choice> = {
  cpu: {
    pane: 'cpu',
    state: { view: 'bars' },
    choose: (pane) => pane.getByTestId('cpu-view').locator('[data-view=bars]').click(),
    shown: (pane) => expect(pane.getByTestId('cpu')).toHaveAttribute('data-view', 'bars'),
  },
  utility: {
    pane: 'util',
    state: { module: 'codec' },
    choose: (pane) => pane.locator('[data-testid=utility-mode][data-module=codec]').click(),
    shown: (pane) => expect(pane.getByTestId('utility')).toHaveAttribute('data-module', 'codec'),
  },
  docker: {
    pane: 'dock',
    state: { filter: 'running' },
    choose: (pane) => pane.getByTestId('docker-filter-running').click(),
    shown: (pane) =>
      expect(pane.getByTestId('docker-filter-running')).toHaveAttribute('aria-pressed', 'true'),
  },
  clipboard: {
    pane: 'clip',
    state: { view: 'snippets' },
    choose: (pane) => pane.getByTestId('clip-view-snippets').click(),
    shown: (pane) =>
      expect(pane.getByTestId('clip-view-snippets')).toHaveAttribute('aria-pressed', 'true'),
  },
}

const column = (id: string, a: string, b: string) => ({
  kind: 'split',
  id,
  direction: 'column',
  sizes: [50, 50],
  children: [a, b].map((pane) => ({
    kind: 'pane',
    id: CHOICES[pane]?.pane ?? pane,
    widget: pane,
  })),
})

/** The four panes, each with room to draw its controls. */
const LAYOUT = {
  version: 1,
  root: {
    kind: 'split',
    id: 'row',
    direction: 'row',
    sizes: [50, 50],
    children: [column('left', 'cpu', 'utility'), column('right', 'docker', 'clipboard')],
  },
}

interface Node {
  id?: string
  state?: Record<string, unknown>
  children?: Node[]
}

/** The state of pane `id` in a layout as main wrote it. */
function stateOf(node: Node, id: string): Record<string, unknown> | undefined {
  if (node.id === id) return node.state
  for (const child of node.children ?? []) {
    const found = stateOf(child, id)
    if (found !== undefined) return found
  }
  return undefined
}

/** Every choice is in layout.json's text. */
const allSaved = (text: string): boolean => {
  const root = (JSON.parse(text) as { root: Node }).root
  return Object.values(CHOICES).every((c) =>
    Object.entries(c.state).every(([key, value]) => stateOf(root, c.pane)?.[key] === value),
  )
}

/** Runs `check` for each widget's choice, and answers the ones that failed, by widget. */
async function eachChoice(
  page: Page,
  check: (choice: Choice, pane: Locator) => Promise<void>,
): Promise<Record<string, string>> {
  const failed: Record<string, string> = {}
  for (const [widget, choice] of Object.entries(CHOICES)) {
    try {
      await check(choice, paneById(page, choice.pane))
    } catch (error) {
      failed[widget] = String((error as Error).message).split('\n')[0] ?? ''
    }
  }
  return failed
}

test("what each pane chose comes back after a restart, from the layout's own file", async () => {
  let launched = await launch(undefined, { layout: LAYOUT })
  const profile = launched.userData
  try {
    await settleLayout(launched.page)
    const chosen = await eachChoice(launched.page, async (choice, pane) => {
      await poweredOn(pane)
      await choice.choose(pane)
      await choice.shown(pane)
    })
    expect(chosen).toEqual({})
    await waitForSaved(launched.userData, allSaved)

    launched = await launched.relaunch()
    await settleLayout(launched.page)
    expect(await eachChoice(launched.page, (choice, pane) => choice.shown(pane))).toEqual({})
  } finally {
    // A relaunched app keeps its profile on close: it was given one.
    await launched.close()
    removeDir(profile)
  }
})
