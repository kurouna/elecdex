/**
 * The RSS pane's starter packs: feeds a person can add with one press instead of hunting for
 * their URLs. Each is the publisher's own public feed, offered for feed readers; elecdex fetches
 * one only after it is added, shows its headlines and opens the article on the publisher's
 * site, as any reader does (docs/guide/data-sources.md). Checked to answer as a feed
 * 2026-11-15. A source whose terms for readers could not be confirmed is left out.
 */

export interface FeedPackEntry {
  /** What the pack lists it as. */
  name: string
  /** A feed URL, or `github:owner/repo` for a project's releases (feeds-discover.ts). */
  url: string
}

export interface FeedPack {
  id: string
  /** The pack's name, as shown. */
  name: string
  /** Its language or kind, beside the name. */
  note: string
  feeds: readonly FeedPackEntry[]
}

export const FEED_PACKS: readonly FeedPack[] = [
  {
    id: 'tech',
    name: 'tech',
    note: 'English',
    feeds: [
      { name: 'Hacker News · front page', url: 'https://news.ycombinator.com/rss' },
      { name: 'The GitHub Blog', url: 'https://github.blog/feed/' },
      { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index' },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    ],
  },
  {
    id: 'tech-ja',
    name: 'テック',
    note: '日本語',
    feeds: [
      { name: 'Zenn · トレンド', url: 'https://zenn.dev/feed' },
      { name: 'Qiita · 人気の記事', url: 'https://qiita.com/popular-items/feed' },
      { name: 'ITmedia NEWS', url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml' },
      { name: 'Publickey', url: 'https://www.publickey1.jp/atom.xml' },
      { name: 'はてなブックマーク · テクノロジー', url: 'https://b.hatena.ne.jp/hotentry/it.rss' },
    ],
  },
  {
    id: 'science',
    name: 'science',
    note: 'English',
    feeds: [
      { name: 'NASA · news releases', url: 'https://www.nasa.gov/news-release/feed/' },
      { name: 'Nature · latest research', url: 'https://www.nature.com/nature.rss' },
      { name: 'Science · news', url: 'https://www.science.org/rss/news_current.xml' },
    ],
  },
  {
    id: 'releases',
    name: 'dev releases',
    note: 'GitHub',
    feeds: [
      { name: 'electron/electron', url: 'github:electron/electron' },
      { name: 'sveltejs/svelte', url: 'github:sveltejs/svelte' },
      { name: 'xtermjs/xterm.js', url: 'github:xtermjs/xterm.js' },
      { name: 'nodejs/node', url: 'github:nodejs/node' },
    ],
  },
]
