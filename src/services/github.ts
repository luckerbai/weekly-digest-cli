import type { RepoSnapshot, WatchRepo } from '../types.js'
import { oneLineCommit, toDateString } from '../utils/format.js'
import { httpFetch } from '../utils/proxy.js'

/** GitHub REST API 基础地址（无认证，限流 60 次/小时，够 CLI 用） */
const GITHUB_API = 'https://api.github.com'
const DEFAULT_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'weekly-digest-cli',
  'X-GitHub-Api-Version': '2022-11-28',
}

/** 带错误上下文的 fetch 封装 */
async function githubFetch(path: string) {
  const res = await httpFetch(`${GITHUB_API}${path}`, { headers: DEFAULT_HEADERS })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`GitHub API ${res.status} on ${path}${detail ? `: ${detail.slice(0, 120)}` : ''}`)
  }
  return res.json()
}

interface RepoResponse {
  stargazers_count: number
  description: string | null
  html_url: string
  full_name: string
}

interface ReleaseResponse {
  tag_name: string
  published_at: string
  name: string | null
}

interface CommitResponse {
  commit: {
    message: string
    author: { date: string }
  }
  author: { login: string } | null
}

/** 抓取单个仓库的快照（stars + 描述 + 最新 release + 最近 7 条提交） */
export async function fetchRepoSnapshot(repo: WatchRepo): Promise<RepoSnapshot> {
  const [repoData, releaseData, commitData] = await Promise.all([
    githubFetch(`/repos/${repo.owner}/${repo.name}`),
    githubFetch(`/repos/${repo.owner}/${repo.name}/releases?per_page=1`).catch(() => null),
    githubFetch(`/repos/${repo.owner}/${repo.name}/commits?per_page=7`).catch(() => null),
  ]) as [RepoResponse, ReleaseResponse[] | null, CommitResponse[] | null]

  const latest = (releaseData ?? [])[0]
  return {
    owner: repo.owner,
    name: repo.name,
    stars: repoData.stargazers_count ?? 0,
    description: repoData.description,
    url: repoData.html_url ?? `https://github.com/${repo.owner}/${repo.name}`,
    latestRelease: latest
      ? {
          tagName: latest.tag_name,
          publishedAt: toDateString(latest.published_at),
          name: latest.name,
        }
      : null,
    recentCommits: (commitData ?? [])
      .filter((c): c is CommitResponse => Boolean(c?.commit))
      .map((c) => ({
        message: oneLineCommit(c.commit.message),
        date: toDateString(c.commit.author.date),
        author: c.author?.login ?? 'unknown',
      })),
  }
}

/** 并行抓取多个仓库（限制并发为 4，避免触发限流） */
export async function fetchRepoSnapshots(repos: WatchRepo[]): Promise<RepoSnapshot[]> {
  const results: RepoSnapshot[] = []
  for (let i = 0; i < repos.length; i += 4) {
    const batch = repos.slice(i, i + 4)
    const batchResults = await Promise.all(batch.map((r) => fetchRepoSnapshot(r)))
    results.push(...batchResults)
  }
  return results
}
