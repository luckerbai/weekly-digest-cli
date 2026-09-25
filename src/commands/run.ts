import { intro, outro, spinner } from '@clack/prompts'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { loadConfig, digestFilePath } from '../config/loader.js'
import { fetchRepoSnapshots } from '../services/github.js'
import { fetchStoriesByKeywords } from '../services/hackernews.js'
import { buildDigestMarkdown } from '../services/digest.js'

/** 抓取数据并生成摘要文件，返回输出路径 */
export async function runDigest(dir = process.cwd()): Promise<string> {
  const config = loadConfig(dir)
  const s = spinner()

  s.start('抓取 GitHub 仓库数据...')
  const repos = await fetchRepoSnapshots(config.repos)
  s.stop('GitHub 数据完成')

  s.start('抓取 Hacker News 数据...')
  const hnStories = await fetchStoriesByKeywords(config.keywords)
  s.stop('Hacker News 数据完成')

  const markdown = buildDigestMarkdown(repos, hnStories, config.keywords)
  const filePath = digestFilePath(config, dir)

  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, markdown, 'utf-8')

  return filePath
}

export async function runCommand() {
  intro('📰  生成 Weekly Digest')
  try {
    const filePath = await runDigest()
    outro(`✅ 摘要已写入 ${resolve(filePath)}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    outro(`❌ ${message}`)
    process.exit(1)
  }
}
