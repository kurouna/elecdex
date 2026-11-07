import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { type AlertFile, CloudAlerts, type IncidentChoice } from '../../src/main/cloud-cli/alerts'
import { rssItems, StatusWatch } from '../../src/main/cloud-cli/status'
import {
  type AwsRssItem,
  awsStatusEvents,
  githubIncidents,
  incidentsFor,
  passesComponents,
  type StatusIncident,
  toastDue,
} from '../../src/shared/cloud-cli/status'

/** The public status (docs/cloud-cli.md §12), on a saved real AWS feed (2026-11-08). */

const FEED = readFileSync(new URL('../fixtures/cloud-cli/status/all.rss', import.meta.url), 'utf8')
const NOW = Date.UTC(2026, 10, 8, 3)
const DAY = 86_400_000

const item = (guid: string, title: string): AwsRssItem => ({
  title,
  guid: `https://status.aws.amazon.com/#${guid}`,
  description: '',
})

describe('the AWS feed', () => {
  it('reads the real feed: an incident since resolved is not open, one never resolved stays open but stale', async () => {
    const items = await rssItems(FEED)
    expect(items.length).toBe(42)
    expect(items[0]?.guid).toMatch(/^https:\/\/status\.aws\.amazon\.com\/#ec2-us-west-2_\d+$/)
    const open = awsStatusEvents(items, NOW)
    expect(open.some((i) => i.id.startsWith('aws:ec2-us-west-2:'))).toBe(false)
    const me = open.find((i) => i.id.startsWith('aws:multipleservices-me-central-1:'))
    expect(me).toMatchObject({ region: 'me-central-1', stale: true })
  })

  it('opens from the first item after the last resolution, weighs by the last head, and keeps the region', () => {
    const at = (s: number) => Math.floor((NOW - s * 60_000) / 1000)
    const open = awsStatusEvents(
      [
        item(`ec2-ap-northeast-1_${at(300)}`, 'Service impact: old'),
        item(`ec2-ap-northeast-1_${at(200)}`, 'Service is operating normally: [RESOLVED] old'),
        item(`ec2-ap-northeast-1_${at(60)}`, 'Service impact: Increased API error rates'),
        item(`ec2-ap-northeast-1_${at(20)}`, 'Service disruption: Increased API error rates'),
        item(`route53_${at(10)}`, 'Informational message: DNS propagation'),
      ],
      NOW,
    )
    const ec2 = open.find((i) => i.id.includes('ec2-ap-northeast-1'))
    expect(ec2).toMatchObject({
      id: `aws:ec2-ap-northeast-1:${at(60) * 1000}`,
      weight: 'danger',
      region: 'ap-northeast-1',
      title: 'Increased API error rates',
      stale: false,
    })
    expect(open.find((i) => i.id.includes('route53'))).toMatchObject({
      weight: 'info',
      region: null,
    })
    // A pane shows its regions and the global ones.
    expect(incidentsFor(open, ['us-east-1']).map((i) => i.region)).toEqual([null])
  })
})

describe("GitHub's incidents", () => {
  const answer = {
    incidents: [
      {
        id: 'abc123def',
        name: 'Delayed job starts',
        impact: 'major',
        status: 'investigating',
        created_at: '2026-11-08T02:00:00Z',
        updated_at: '2026-11-08T02:40:00Z',
        components: [{ name: 'Actions' }],
      },
      { id: 'bad id!', name: 'x', impact: 'minor', status: 'x', created_at: '', updated_at: '' },
    ],
  }

  it('weighs by impact, names the components, refuses an id that is not one, and builds the URL', () => {
    const [one, ...rest] = githubIncidents(answer, null, NOW)
    expect(rest).toEqual([])
    expect(one).toMatchObject({
      weight: 'danger',
      title: 'Actions · Delayed job starts',
      components: ['Actions'],
      url: 'https://www.githubstatus.com/incidents/abc123def',
    })
  })

  it('passes an incident of other components, and always one that names none', () => {
    const [one] = githubIncidents(answer, null, NOW) as [StatusIncident]
    expect(passesComponents(one, ['Copilot'])).toBe(true)
    expect(passesComponents(one, ['Actions'])).toBe(false)
    expect(passesComponents({ ...one, components: [] }, ['Actions'])).toBe(true)
  })
})

describe('toastDue', () => {
  const incident = { id: 'a', weight: 'warn', stale: false } as StatusIncident
  it('toasts a new one or a heavier one, never a stale or a lighter one', () => {
    expect(toastDue(incident, {}, 'warn')).toBe(true)
    expect(toastDue(incident, { a: 'warn' }, 'warn')).toBe(false)
    expect(toastDue({ ...incident, weight: 'danger' }, { a: 'warn' }, 'warn')).toBe(true)
    expect(toastDue(incident, {}, 'danger')).toBe(false)
    expect(toastDue({ ...incident, stale: true }, {}, 'info')).toBe(false)
  })
})

describe('CloudAlerts', () => {
  function harness(inFront = true) {
    let file: AlertFile = { said: {}, seeded: {}, lastAt: {} }
    let now = NOW
    const page: string[] = []
    const system: string[] = []
    const choice: IncidentChoice = { notify: true, system: true, minSeverity: 'warn' }
    const alerts = new CloudAlerts({
      load: () => structuredClone(file),
      save: (next) => {
        file = structuredClone(next)
      },
      now: () => now,
      inFront: () => inFront,
      choice: () => choice,
      toPage: (alert) => page.push(`${alert.title}: ${alert.body}`),
      toSystem: (title, body) => system.push(`${title}: ${body}`),
    })
    return { alerts, page, system, choice, file: () => file, later: (ms: number) => (now += ms) }
  }
  const open = (
    id: string,
    weight: StatusIncident['weight'] = 'warn',
    region: string | null = null,
  ) =>
    ({
      id,
      weight,
      region,
      stale: false,
      title: `incident ${id}`,
      url: 'https://health.aws.amazon.com/health/status',
      components: [],
    }) as unknown as StatusIncident

  it('keeps the first reading a band, then toasts what is new, gathered, at most once in 15 minutes', () => {
    const h = harness()
    h.alerts.incidents('aws', [open('old')], null)
    expect(h.page).toEqual([])
    h.alerts.incidents('aws', [open('old'), open('a'), open('b', 'danger')], null)
    expect(h.page).toEqual(['2 AWS incidents: incident b'])
    h.later(5 * 60_000)
    h.alerts.incidents('aws', [open('old'), open('a'), open('b', 'danger'), open('c')], null)
    expect(h.page).toHaveLength(1)
    h.later(11 * 60_000)
    h.alerts.incidents('aws', [open('c')], null)
    expect(h.page).toEqual(['2 AWS incidents: incident b', 'AWS incident: incident c'])
    expect(h.alerts.urlOf('incident:c')).toBe('https://health.aws.amazon.com/health/status')
  })

  it("leaves out other regions' incidents and everything when toasts are off", () => {
    const h = harness()
    h.alerts.incidents('aws', [], null)
    h.alerts.incidents('aws', [open('x', 'warn', 'eu-west-1')], ['ap-northeast-1'])
    expect(h.page).toEqual([])
    h.choice.notify = false
    h.alerts.incidents('aws', [open('y')], null)
    expect(h.page).toEqual([])
  })

  it("says a quota step once, and out of the window in the system's words, never naming the account", () => {
    const h = harness(false)
    const quota = {
      id: 'quota:1:2026-11:1',
      title: 'Cost quota · 100%',
      body: 'acme-prod passed 100% of its $1,000 quota · $1,012.00 this month',
      maskedBody: 'An AWS account passed 100% of its quota',
      tone: 'danger' as const,
      action: { kind: 'cost' as const, key: 'k' },
    }
    h.alerts.quota(quota)
    h.alerts.quota(quota)
    expect(h.system).toEqual(['Cost quota · 100%: An AWS account passed 100% of its quota'])
    expect(h.file().said[quota.id]).toBeDefined()
  })

  it('forgets what it said after 30 days', () => {
    const h = harness()
    h.alerts.incidents('aws', [], null)
    h.alerts.incidents('aws', [open('a')], null)
    const kept = h.file()
    const page: string[] = []
    const again = new CloudAlerts({
      load: () => structuredClone(kept),
      save: () => {},
      now: () => NOW + 31 * DAY,
      inFront: () => true,
      choice: () => ({ notify: true, system: true, minSeverity: 'warn' }),
      toPage: (alert) => page.push(alert.title),
      toSystem: () => {},
    })
    again.incidents('aws', [open('a')], null)
    expect(page).toEqual(['AWS incident'])
  })
})

describe('StatusWatch', () => {
  function watch(answers: Record<string, { status: number; text: string } | Error>) {
    const fetched: string[] = []
    const changed: { source: string; ids: string[] }[] = []
    let now = NOW
    const timers: (() => void)[] = []
    const status = new StatusWatch({
      now: () => now,
      setTimer: (fn) => {
        timers.push(fn)
        return timers.length
      },
      clearTimer: () => {},
      fetchText: async (url) => {
        fetched.push(url)
        const answer = Object.entries(answers).find(([part]) => url.includes(part))?.[1]
        if (answer instanceof Error || answer === undefined) throw answer ?? new Error('no answer')
        return answer
      },
      changed: (source, incidents) => changed.push({ source, ids: incidents.map((i) => i.id) }),
    })
    const flush = async () => {
      for (let i = 0; i < 50; i++) await Promise.resolve()
    }
    return { status, fetched, changed, flush, timers, later: (ms: number) => (now += ms) }
  }

  it('reads a source only while a pane of it is shown, and says what is open', async () => {
    const w = watch({
      'incidents/unresolved': {
        status: 200,
        text: JSON.stringify({
          incidents: [
            {
              id: 'abc123def',
              name: 'x',
              impact: 'minor',
              status: 'investigating',
              created_at: '2026-11-08T02:00:00Z',
              updated_at: '2026-11-08T02:30:00Z',
            },
          ],
        }),
      },
      'scheduled-maintenances': { status: 200, text: 'not json' },
    })
    expect(w.status.watching()).toEqual([])
    w.status.set('github', true)
    await w.flush()
    expect(w.status.watching()).toEqual(['status:github'])
    expect(w.changed).toEqual([{ source: 'github', ids: ['github:abc123def'] }])
    w.status.set('github', false)
    expect(w.status.watching()).toEqual([])
    // Shown again within five minutes: the last answer stands, nothing is fetched.
    const before = w.fetched.length
    w.status.set('github', true)
    await w.flush()
    expect(w.fetched.length).toBe(before)
  })

  it('keeps the last good answer through a failure', async () => {
    const answers: Record<string, { status: number; text: string } | Error> = {
      'incidents/unresolved': {
        status: 200,
        text: JSON.stringify({
          incidents: [
            {
              id: 'abc123def',
              name: 'x',
              impact: 'major',
              status: 'identified',
              created_at: '2026-11-08T02:00:00Z',
              updated_at: '2026-11-08T02:30:00Z',
            },
          ],
        }),
      },
    }
    const w = watch(answers)
    w.status.set('github', true)
    await w.flush()
    answers['incidents/unresolved'] = new Error('offline')
    w.later(6 * 60_000)
    for (const fire of w.timers.splice(0)) fire()
    await w.flush()
    expect(w.fetched.filter((u) => u.includes('unresolved')).length).toBe(2)
    expect(w.status.incidents('github').map((i) => i.id)).toEqual(['github:abc123def'])
  })
})
