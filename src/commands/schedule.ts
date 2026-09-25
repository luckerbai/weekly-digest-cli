import { intro, outro, log } from '@clack/prompts'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadConfig } from '../config/loader.js'

const WORKFLOW_FILENAME = 'weekly-digest.yml'
const WORKFLOW_PATH = '.github/workflows/weekly-digest.yml'

/** 生成 GitHub Actions 定时 workflow，实现 digest run 的定时自动执行 */
export function scheduleCommand(dir = process.cwd()) {
  intro('🗓️  生成定时任务')

  const config = loadConfig(dir)
  const filePath = resolve(dir, WORKFLOW_PATH)

  const workflow = `name: Weekly Digest

on:
  schedule:
    # 每周一 09:00 UTC（北京时间 17:00）
    - cron: '0 9 * * 1'
  workflow_dispatch: {}

jobs:
  digest:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 12.6.0

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - name: Generate digest
        run: pnpm exec tsx src/index.ts run

      - name: Commit digest
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add 'digest-*.md'
          git commit -m "chore: update weekly digest [skip ci]" || echo "No changes to commit"
          git push
`

  writeFileSync(filePath, workflow, 'utf-8')

  log.success(`已生成 workflow: ${filePath}`)
  log.info('将 digest.config.json 提交到仓库后，GitHub Actions 会自动按 cron 定时生成摘要。')
  outro(`✅ 定时任务已配置（每周一 09:00 UTC）`)
}

export const SCHEDULE_FILENAME = WORKFLOW_FILENAME
