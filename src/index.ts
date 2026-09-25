#!/usr/bin/env node
import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { runCommand } from './commands/run.js'
import { previewCommand } from './commands/preview.js'
import { scheduleCommand } from './commands/schedule.js'
import { loadConfig } from './config/loader.js'
import { configureProxy } from './utils/proxy.js'

// 支持 HTTPS_PROXY / HTTP_PROXY 环境变量（国内开发者访问 GitHub/HN 必需）
configureProxy()

const program = new Command()

program
  .name('digest')
  .description('Turn your favorite GitHub repos and Hacker News topics into a clean Markdown digest.')
  .version('1.0.0')

program
  .command('init')
  .description('交互式生成 digest.config.json')
  .action(initCommand)

program
  .command('run')
  .description('抓取数据并生成 digest-YYYY-MM-DD.md')
  .action(runCommand)

program
  .command('preview')
  .description('在终端预览摘要（不写文件）')
  .action(previewCommand)

program
  .command('schedule')
  .description('生成 GitHub Actions 定时任务 workflow')
  .action(() => scheduleCommand())

program
  .command('config')
  .description('查看当前配置')
  .action(() => {
    try {
      const config = loadConfig()
      console.log(JSON.stringify(config, null, 2))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`❌ ${message}`)
      process.exit(1)
    }
  })

program.parse()
