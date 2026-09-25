import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模块级 mock：替换 proxy 模块的 httpFetch，避免真实网络请求
const httpFetchMock = vi.hoisted(() => vi.fn())

vi.mock('../src/utils/proxy.js', () => ({
  httpFetch: httpFetchMock,
  configureProxy: vi.fn(),
}))

import { fetchRepoSnapshot, fetchRepoSnapshots } from '../src/services/github.js'

function mockJsonResponse(data: unknown) {
  return {
    ok: true,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response
}

function mockErrorResponse(status: number) {
  return {
    ok: false,
    status,
    text: vi.fn().mockResolvedValue('rate limited'),
  } as unknown as Response
}

beforeEach(() => {
  httpFetchMock.mockReset()
})

describe('fetchRepoSnapshot', () => {
  it('fetches repo data, latest release and commits', async () => {
    httpFetchMock
      .mockResolvedValueOnce(
        mockJsonResponse({
          stargazers_count: 1234,
          description: 'A test repo',
          html_url: 'https://github.com/foo/bar',
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse([
          { tag_name: 'v2.0.0', published_at: '2026-09-01T00:00:00Z', name: 'v2.0' },
        ]),
      )
      .mockResolvedValueOnce(
        mockJsonResponse([
          {
            commit: { message: 'chore: update deps', author: { date: '2026-09-20T00:00:00Z' } },
            author: { login: 'alice' },
          },
        ]),
      )

    const snapshot = await fetchRepoSnapshot({ owner: 'foo', name: 'bar' })

    expect(snapshot.stars).toBe(1234)
    expect(snapshot.description).toBe('A test repo')
    expect(snapshot.latestRelease?.tagName).toBe('v2.0.0')
    expect(snapshot.latestRelease?.publishedAt).toBe('2026-09-01')
    expect(snapshot.recentCommits[0]?.author).toBe('alice')
    expect(httpFetchMock).toHaveBeenCalledTimes(3)
  })

  it('handles missing release and commits gracefully', async () => {
    httpFetchMock
      .mockResolvedValueOnce(
        mockJsonResponse({
          stargazers_count: 0,
          description: null,
          html_url: 'https://github.com/foo/bar',
        }),
      )
      .mockRejectedValueOnce(new Error('404 not found'))
      .mockRejectedValueOnce(new Error('404 not found'))

    const snapshot = await fetchRepoSnapshot({ owner: 'foo', name: 'bar' })

    expect(snapshot.latestRelease).toBeNull()
    expect(snapshot.recentCommits).toEqual([])
  })

  it('throws on repo fetch error', async () => {
    httpFetchMock.mockResolvedValueOnce(mockErrorResponse(404))

    await expect(fetchRepoSnapshot({ owner: 'foo', name: 'missing' })).rejects.toThrow(
      /GitHub API 404/,
    )
  })
})

describe('fetchRepoSnapshots', () => {
  it('fetches repos in parallel batches', async () => {
    httpFetchMock.mockImplementation((url: string) => {
      if (url.includes('/releases')) {
        return Promise.resolve(mockJsonResponse([]))
      }
      if (url.includes('/commits')) {
        return Promise.resolve(mockJsonResponse([]))
      }
      return Promise.resolve(
        mockJsonResponse({
          stargazers_count: 10,
          description: 'x',
          html_url: 'https://github.com/a/b',
        }),
      )
    })

    const repos = [
      { owner: 'a', name: 'b' },
      { owner: 'c', name: 'd' },
      { owner: 'e', name: 'f' },
    ]
    const snapshots = await fetchRepoSnapshots(repos)

    expect(snapshots).toHaveLength(3)
    expect(snapshots[0]?.owner).toBe('a')
    // 每个仓库 3 个请求
    expect(httpFetchMock).toHaveBeenCalledTimes(9)
  })
})
