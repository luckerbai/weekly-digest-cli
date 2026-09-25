import { intro, outro, spinner, log } from '@clack/prompts'
import { loadConfig } from '../config/loader.js'
import { fetchRepoSnapshots } from '../services/github.js'
import { fetchStoriesByKeywords } from '../services/hackernews.js'
import { buildDigestMarkdown } from '../services/digest.js'

/** 抓取数据并在终端预览（不写文件） */
export async function previewCommand() {
  intro('👀  预览 Weekly Digest')
  const config = loadConfig()
  const s = spinner()

  try {
    s.start('抓取数据中...')
    const [repos, hnStories] = await Promise.all([
      fetchRepoSnapshots(config.repos),
      fetchStoriesByKeywords(config.keywords),
    ])
    s.stop('数据抓取完成')

    const markdown = buildDigestMarkdown(repos, hnStories, config.keywords)

    // 终端预览：只打印前若干行，避免刷屏
    const lines = markdown.split('\n')
    const previewLines = lines.slice(0, 60)
    log.info(`预览（共 ${lines.length} 行）：`)
    console.log('\n' + previewLines.join('\n'))
    if (lines.length > 60) {
      console.log(`\n... 还有 ${lines.length - 60} 行未显示，运行 "digest run" 生成完整文件。`)
    }

    outro('✅ 预览完成')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    outro(`❌ ${message}`)
    process.exit(1)
  }
}
