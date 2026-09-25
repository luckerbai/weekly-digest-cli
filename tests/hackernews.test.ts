import { describe, it, expect, vi, beforeEach } from 'vitest'

const httpFetchMock = vi.hoisted(() => vi.fn())

vi.mock('../src/utils/proxy.js', () => ({
  httpFetch: httpFetchMock,
  configureProxy: vi.fn(),
}))

import { fetchStoriesByKeywords } from '../src/services/hackernews.js'

function mockJsonResponse(data: unknown) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response
}

beforeEach(() => {
  httpFetchMock.mockReset()
})

describe('fetchStoriesByKeywords', () => {
  it('filters top stories by keyword and sorts by score', async () => {
    // /topstories.json → ids
    httpFetchMock.mockImplementationOnce(() =>
      mockJsonResponse([101, 102, 103, 104, 105]),
    )
    // item/{id}.json
    httpFetchMock
      .mockImplementationOnce(() =>
        mockJsonResponse({
          id: 101, type: 'story', title: 'Vue 3.5 released', url: 'https://a.com',
          score: 500, by: 'u1', time: 1727000000,
        }),
      )
      .mockImplementationOnce(() =>
        mockJsonResponse({
          id: 102, type: 'story', title: 'React news', url: null,
          score: 300, by: 'u2', time: 1727000000,
        }),
      )
      .mockImplementationOnce(() =>
        mockJsonResponse({
          id: 103, type: 'story', title: 'Vue ecosystem update', url: 'https://b.com',
          score: 800, by: 'u3', time: 1727000000,
        }),
      )
      .mockImplementationOnce(() =>
        mockJsonResponse({ id: 104, type: 'job', title: 'Vue job posting', score: 1 }),
      )
      .mockImplementationOnce(() => mockJsonResponse(null))

    const result = await fetchStoriesByKeywords(['vue'], 5)

    expect(result.vue).toHaveLength(2)
    // 按 score 降序：800 的 vue ecosystem 在前
    expect(result.vue![0]?.title).toBe('Vue ecosystem update')
    expect(result.vue![1]?.title).toBe('Vue 3.5 released')
    // job 类型被排除
    expect(result.vue!.some((s) => s.title.includes('job'))).toBe(false)
  })

  it('returns empty array for keywords with no matches', async () => {
    httpFetchMock
      .mockResolvedValueOnce(mockJsonResponse([201]))
      .mockResolvedValueOnce(
        mockJsonResponse({
          id: 201, type: 'story', title: 'Unrelated story', score: 10,
        }),
      )

    const result = await fetchStoriesByKeywords(['qwerty'], 1)
    expect(result.qwerty).toEqual([])
  })

  it('throws on API failure', async () => {
    httpFetchMock.mockResolvedValue({ ok: false, status: 500 })

    await expect(fetchStoriesByKeywords(['vue'], 5)).rejects.toThrow(/Hacker News API 500/)
  })
})
