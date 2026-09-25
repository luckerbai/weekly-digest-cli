import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { digestConfigSchema, type DigestConfigInput } from './schema.js'
import type { DigestConfig } from '../types.js'

/** 配置文件默认文件名 */
export const CONFIG_FILENAME = 'digest.config.json'

/** 读取配置；不存在或非法时抛出带可读信息的错误 */
export function loadConfig(dir = process.cwd()): DigestConfig {
  const filePath = resolve(dir, CONFIG_FILENAME)
  if (!existsSync(filePath)) {
    throw new Error(
      `未找到 ${CONFIG_FILENAME}，请先运行 "digest init" 生成配置文件。`,
    )
  }

  const raw = readFileSync(filePath, 'utf-8')
  const parsed = digestConfigSchema.safeParse(JSON.parse(raw))

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    const path = firstIssue?.path.join('.') ?? 'config'
    throw new Error(`配置文件校验失败：${path} — ${firstIssue?.message ?? '格式错误'}`)
  }

  return {
    repos: parsed.data.repos,
    keywords: parsed.data.keywords,
    outputDir: parsed.data.outputDir,
  }
}

/** 写入配置（自动创建目录） */
export function saveConfig(config: DigestConfigInput, dir = process.cwd()) {
  const filePath = resolve(dir, CONFIG_FILENAME)
  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n', 'utf-8')
  return filePath
}

/** 配置文件是否存在 */
export function configExists(dir = process.cwd()) {
  return existsSync(resolve(dir, CONFIG_FILENAME))
}

/** 计算摘要输出路径：<outputDir>/digest-<YYYY-MM-DD>.md */
export function digestFilePath(config: DigestConfig, dir = process.cwd(), date = new Date()) {
  const stamp = date.toISOString().slice(0, 10)
  const outputDir = resolve(dir, config.outputDir)
  return join(outputDir, `digest-${stamp}.md`)
}
