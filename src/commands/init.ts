import { intro, outro, text, multiselect, confirm, isCancel, cancel } from '@clack/prompts'
import { repoInputSchema } from '../config/schema.js'
import { saveConfig, CONFIG_FILENAME } from '../config/loader.js'

/** 交互式收集一个仓库标识，直到输入合法 */
async function askRepo(existing: { owner: string; name: string }[]): Promise<{ owner: string; name: string } | null> {
  while (true) {
    const input = await text({
      message: 'GitHub 仓库（格式 owner/name，如 vuejs/core）：',
      placeholder: 'vuejs/core',
    })

    if (isCancel(input)) return null

    const [owner, name] = input.trim().split('/')
    const parsed = repoInputSchema.safeParse({ owner: owner ?? '', name: name ?? '' })

    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? '格式错误'
      const next = await confirm({
        message: `输入无效（${msg}），是否重试？`,
        initialValue: true,
      })
      if (isCancel(next)) return null
      if (!next) return null
      continue
    }

    const duplicate = existing.some(
      (r) => r.owner === parsed.data.owner && r.name === parsed.data.name,
    )
    if (duplicate) {
      const next = await confirm({ message: '该仓库已在列表中，是否继续添加其他仓库？', initialValue: true })
      if (isCancel(next)) return null
      if (!next) return null
      continue
    }

    return parsed.data
  }
}

export async function initCommand() {
  intro('⚙️  Weekly Digest 初始化')

  // 1. 收集仓库
  const repos: { owner: string; name: string }[] = []
  while (repos.length < 20) {
    const repo = await askRepo(repos)
    if (repo) {
      repos.push(repo)
    }
    if (repos.length === 0) {
      outro('至少需要一个仓库。')
      cancel('已取消')
      process.exit(1)
    }
    const more = await confirm({
      message: `已添加 ${repos.length} 个仓库，继续添加？`,
      initialValue: repos.length < 3,
    })
    if (isCancel(more) || !more) break
  }

  // 2. 收集关键词（可多选预设 + 自定义）
  const keywordInput = await multiselect({
    message: '选择要跟踪的 Hacker News 关键词（可多选，也可以跳过）:',
    options: [
      { value: 'vue', label: 'Vue' },
      { value: 'react', label: 'React' },
      { value: 'typescript', label: 'TypeScript' },
      { value: 'ai', label: 'AI' },
      { value: 'llm', label: 'LLM' },
      { value: 'frontend', label: 'Frontend' },
      { value: 'web', label: 'Web' },
    ],
    required: false,
  })

  if (isCancel(keywordInput)) {
    cancel('已取消')
    process.exit(1)
  }

  const keywords = [...(keywordInput as string[])]

  // 3. 输出目录
  const outputDirInput = await text({
    message: '摘要输出目录（默认 ./）：',
    placeholder: './',
    initialValue: './',
  })
  if (isCancel(outputDirInput)) {
    cancel('已取消')
    process.exit(1)
  }

  // 4. 写入配置
  const config = {
    repos,
    keywords,
    outputDir: outputDirInput.trim() === '' ? './' : outputDirInput.trim(),
  }

  const filePath = saveConfig(config)
  outro(`✅ 配置已写入 ${filePath}`)
}
