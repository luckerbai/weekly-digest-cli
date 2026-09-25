import type { HNStory } from '../types.js'
import { httpFetch } from '../utils/proxy.js'

/** Hacker News Firebase API */
const HN_API = 'https://hacker-news.firebaseio.com/v0'
const STORY_LIMIT = 30

interface HNItemResponse {
  id: number
  type?: string
  title?: string
  url?: string | null
  score?: number
  by?: string
  time?: number
  deleted?: boolean
  dead?: boolean
}

async function hnFetch(path: string) {
  const res = await httpFetch(`${HN_API}${path}`)
  if (!res.ok) throw new Error(`Hacker News API ${res.status} on ${path}`)
  return res.json()
}

/** 获取今日 Top 故事的原始条目列表 */
async function fetchTopStories(limit = STORY_LIMIT): Promise<HNItemResponse[]> {
  const ids = (await hnFetch('/topstories.json')) as number[]
  const items = await Promise.all(
    ids.slice(0, limit).map((id) => hnFetch(`/item/${id}.json`)),
  )
  return items.filter((item): item is HNItemResponse => item !== null)
}

/** 按关键词过滤 Top 故事，按 score 排序后返回 */
export async function fetchStoriesByKeywords(
  keywords: string[],
  limit = STORY_LIMIT,
): Promise<Record<string, HNStory[]>> {
  const items = await fetchTopStories(limit)

  const matched: Record<string, HNStory[]> = {}
  for (const keyword of keywords) {
    const lower = keyword.toLowerCase()
    const stories: HNStory[] = items
      .filter((item) => item.type === 'story' && item.title && !item.deleted && !item.dead)
      .filter((item) => (item.title ?? '').toLowerCase().includes(lower))
      .map((item) => ({
        id: item.id,
        title: item.title ?? '',
        url: item.url ?? null,
        score: item.score ?? 0,
        by: item.by ?? 'unknown',
        time: item.time ?? 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
    matched[keyword] = stories
  }

  return matched
}
