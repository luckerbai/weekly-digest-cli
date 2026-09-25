import { describe, it, expect } from 'vitest'
import { buildDigestMarkdown } from '../src/services/digest.js'
import type { RepoSnapshot, HNStory } from '../src/types.js'

const repo: RepoSnapshot = {
  owner: 'vuejs',
  name: 'core',
  stars: 1200000,
  description: 'Vue.js core library',
  url: 'https://github.com/vuejs/core',
  latestRelease: {
    tagName: 'v3.5.0',
    publishedAt: '2026-09-01',
    name: 'Vue 3.5',
  },
  recentCommits: [
    { message: 'fix: improve runtime performance', date: '2026-09-20', author: 'yyx990803' },
    { message: 'feat: add new compiler directive', date: '2026-09-18', author: 'sodatea' },
  ],
}

const story: HNStory = {
  id: 41234567,
  title: 'Vue 3.5 released with major performance improvements',
  url: 'https://blog.vuejs.org/posts/vue-3-5',
  score: 412,
  by: 'test-user',
  time: 1727000000,
}

describe('buildDigestMarkdown', () => {
  it('includes repo section with stars and description', () => {
    const md = buildDigestMarkdown([repo], {}, [], '2026-09-24T00:00:00Z')
    expect(md).toContain('vuejs/core')
    expect(md).toContain('1.2M stars')
    expect(md).toContain('Vue.js core library')
    expect(md).toContain('v3.5.0')
    expect(md).toContain('fix: improve runtime performance')
  })

  it('includes HN section when stories match', () => {
    const md = buildDigestMarkdown([], { vue: [story] }, ['vue'], '2026-09-24T00:00:00Z')
    expect(md).toContain('### 🗞️ vue')
    expect(md).toContain('Vue 3.5 released')
    expect(md).toContain('412 points')
    expect(md).toContain('news.ycombinator.com/item?id=41234567')
  })

  it('shows fallback message when no HN stories match', () => {
    const md = buildDigestMarkdown([], {}, ['nonexistent'], '2026-09-24T00:00:00Z')
    expect(md).toContain('没有命中关键词的热门故事')
  })

  it('includes header and generated timestamp', () => {
    const md = buildDigestMarkdown([], {}, [], '2026-09-24T00:00:00Z')
    expect(md).toContain('# Weekly Developer Digest')
    expect(md).toContain('2026-09-24T00:00:00Z')
  })
})
