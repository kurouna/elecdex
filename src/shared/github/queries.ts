/**
 * The GraphQL bodies GITHUB STATUS sends (docs/github.md §3). Constants only: every operation is a
 * `query` (a unit test parses them), and nothing here asks for a body, a comment, a diff or an
 * e-mail address. Variables are filled by main from checked values (owner/name, a search string
 * built from them).
 */

const PR_FIELDS = `
  number title url createdAt updatedAt isDraft additions deletions
  repository { nameWithOwner isPrivate }
  author { login }`

export const QUEUE_QUERY = `query Queue($triage: String!) {
  review: search(query: "is:open is:pr review-requested:@me archived:false", type: ISSUE, first: 20) {
    nodes { ... on PullRequest { ${PR_FIELDS} } }
  }
  mine: search(query: "is:open is:pr author:@me archived:false", type: ISSUE, first: 20) {
    nodes { ... on PullRequest { ${PR_FIELDS} reviewDecision mergeable
      commits(last: 1) { nodes { commit { statusCheckRollup { state } } } } } }
  }
  assigned: search(query: "is:open assignee:@me archived:false", type: ISSUE, first: 20) {
    nodes {
      ... on Issue { number title url createdAt repository { nameWithOwner isPrivate } author { login } }
      ... on PullRequest { number title url createdAt repository { nameWithOwner isPrivate } author { login } }
    }
  }
  triage: search(query: $triage, type: ISSUE, first: 20) {
    nodes {
      ... on Issue { number title url createdAt repository { nameWithOwner isPrivate } author { login } }
      ... on PullRequest { number title url createdAt repository { nameWithOwner isPrivate } author { login } }
    }
  }
}`

const REPO_FIELDS = `
  nameWithOwner isPrivate isArchived stargazerCount forkCount
  issues(states: OPEN) { totalCount }
  pullRequests(states: OPEN) { totalCount }
  releases(first: 1, orderBy: { field: CREATED_AT, direction: DESC }) {
    nodes { tagName isPrerelease publishedAt createdAt url releaseAssets(first: 20) { nodes { downloadCount } } }
  }
  hasVulnerabilityAlertsEnabled
  vulnerabilityAlerts(states: OPEN) { totalCount }
  defaultBranchRef { name }`

/** The user's own repositories, the most starred first (AUTO). */
export const OWN_REPOS_QUERY = `query OwnRepos {
  viewer {
    login
    repositories(first: 8, ownerAffiliations: OWNER, isFork: false, orderBy: { field: STARGAZERS, direction: DESC }) {
      nodes { ${REPO_FIELDS} }
    }
  }
}`

/** PINNED repositories, one alias each; `names` are checked owner/name pairs (cloud-cli.md §2.5). */
export function pinnedReposQuery(names: readonly string[]): string {
  const parts = names.map((name, i) => {
    const [owner, repo] = name.split('/')
    return `r${i}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(repo)}) { ${REPO_FIELDS} }`
  })
  return `query PinnedRepos {\n  viewer { login }\n  ${parts.join('\n  ')}\n}`
}

export const CONTRIB_QUERY = `query Contributions {
  viewer {
    contributionsCollection {
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`

/** One repository's open pull requests, for its drill-down (§5.3). */
export const REPO_PULLS_QUERY = `query RepoPulls($owner: String!, $name: String!) {
  repository(owner: $owner, name: $name) {
    pullRequests(states: OPEN, first: 20, orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes { ${PR_FIELDS} reviewDecision mergeable
        commits(last: 1) { nodes { commit { statusCheckRollup { state } } } } }
    }
    releases(first: 5, orderBy: { field: CREATED_AT, direction: DESC }) {
      nodes { tagName isPrerelease publishedAt createdAt url releaseAssets(first: 20) { nodes { downloadCount } } }
    }
  }
}`

/**
 * The commits on each default branch since its latest release, one alias a repository: `compare`'s
 * count alone, where REST's compare answers every commit and diff of the range (megabytes).
 */
export function aheadQuery(
  repos: readonly { name: string; release: string; defaultBranch: string }[],
): string {
  const parts = repos.map((repo, i) => {
    const [owner, name] = repo.name.split('/')
    const tag = JSON.stringify(`refs/tags/${repo.release}`)
    return `r${i}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) { ref(qualifiedName: ${tag}) { compare(headRef: ${JSON.stringify(repo.defaultBranch)}) { aheadBy } } }`
  })
  return `query Ahead {\n  ${parts.join('\n  ')}\n}`
}

export const ALL_QUERIES: readonly string[] = [
  QUEUE_QUERY,
  OWN_REPOS_QUERY,
  CONTRIB_QUERY,
  REPO_PULLS_QUERY,
  pinnedReposQuery(['octo/one', 'octo/two']),
  aheadQuery([{ name: 'octo/one', release: 'v1.0.0', defaultBranch: 'main' }]),
]

/** The body `gh api graphql --input -` reads: JSON with the query and its variables. */
export function graphqlBody(query: string, variables: Record<string, string> = {}): string {
  return JSON.stringify({ query, variables })
}

/** The TRIAGE search over the watched repositories: open, unanswered, unlabelled, unassigned. */
export function triageSearch(repos: readonly string[]): string {
  if (repos.length === 0) return 'is:open no:assignee no:label comments:0 user:@me'
  return `is:open no:assignee no:label comments:0 ${repos.map((repo) => `repo:${repo}`).join(' ')}`
}
