/** 关注的 GitHub 仓库 */
export interface WatchRepo {
  owner: string
  name: string
}

/** digest.config.json 结构 */
export interface DigestConfig {
  /** 关注的 GitHub 仓库列表 */
  repos: WatchRepo[]
  /** Hacker News 关键词（标题包含任一关键词即收录） */
  keywords: string[]
  /** 输出目录（相对路径或绝对路径） */
  outputDir: string
}

/** GitHub 仓库快照 */
export interface RepoSnapshot {
  owner: string
  name: string
  stars: number
  description: string | null
  url: string
  latestRelease: {
    tagName: string
    publishedAt: string
    name: string | null
  } | null
  recentCommits: {
    message: string
    date: string
    author: string
  }[]
}

/** Hacker News 故事条目 */
export interface HNStory {
  id: number
  title: string
  url: string | null
  score: number
  by: string
  time: number
}

/** 一份摘要的内容模型 */
export interface DigestData {
  generatedAt: string
  repos: RepoSnapshot[]
  hnStories: Record<string, HNStory[]>
}
