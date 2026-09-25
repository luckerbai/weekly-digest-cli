# 📰 Weekly Digest CLI

把你想关注的 GitHub 仓库和 Hacker News 关键词，变成一份干净的 Markdown 摘要。

```bash
digest init      # 交互式生成配置
digest run       # 抓取数据 → 生成 digest-YYYY-MM-DD.md
digest preview   # 终端预览，不写文件
digest schedule  # 生成 GitHub Actions 定时任务（每周一 09:00 UTC）
digest config    # 查看当前配置
```

## 为什么做这个

开发者每天在 GitHub / Hacker News 上被动刷信息，浪费时间。这个工具把"被动刷"变成"定时收摘要"——配置一次，之后每周自动收到关注仓库的 Star 趋势、Release 更新、最近提交和关键词命中的 HN 热帖。

## 快速开始

```bash
# 1. 安装（全局）
npm install -g weekly-digest-cli

# 2. 初始化配置
digest init

# 3. 生成摘要
digest run
# 输出: digest-2026-09-24.md

# 4. 预览（可选）
digest preview
```

### 代理支持

国内开发者访问 GitHub / Hacker News 需要代理时，设置环境变量即可：

```bash
# v2rayN 示例（HTTP 代理 10808）
export HTTPS_PROXY=http://127.0.0.1:10808
```

CLI 自动识别 `HTTPS_PROXY` / `HTTP_PROXY` / `ALL_PROXY`（含小写变体）。

## 配置文件

`digest init` 会生成 `digest.config.json`，也可以手动编辑：

```json
{
  "repos": [
    { "owner": "vuejs", "name": "core" },
    { "owner": "vuejs", "name": "pinia" }
  ],
  "keywords": ["vue", "typescript"],
  "outputDir": "./"
}
```

字段说明：

| 字段 | 说明 | 约束 |
|------|------|------|
| `repos` | 关注的 GitHub 仓库 | 1–20 个，`owner/name` 格式，Zod 校验 |
| `keywords` | Hacker News 关键词 | 最多 10 个，自动去重 |
| `outputDir` | 摘要输出目录 | 默认 `./` |

## 摘要示例

```markdown
# Weekly Developer Digest

## 📦 GitHub Repos

### ⭐ vuejs/core
**54.4K stars** · [GitHub](https://github.com/vuejs/core)
> 🖖 Vue.js is a progressive, incrementally-adoptable JavaScript framework...

- 🚀 **Latest release:** `v3.6.0-rc.9` (2026-09-18) — v3.6.0-rc.9

Recent commits:
- `2026-09-18` edison1105: fix(suspense): skip rendering async components...

## 🔥 Hacker News

### 🗞️ vue
- [Vue 3.5 released with major performance improvements](https://...) · 412 points · by test-user · [HN](https://news.ycombinator.com/item?id=41234567)
```

## 定时自动生成

```bash
digest schedule
```

会在 `.github/workflows/weekly-digest.yml` 生成 GitHub Actions 定时任务：每周一 09:00 UTC（北京时间 17:00）自动跑 `digest run` 并提交生成的摘要文件。

## 技术栈

- **Node.js 22 + TypeScript**（严格模式，`noUncheckedIndexedAccess`）
- **@clack/prompts** — 现代 CLI 交互（类似 Raycast 的体验）
- **Commander** — 命令路由
- **Zod 4** — 配置校验（单一事实源，类型由 schema 推导）
- **undici** — 统一 fetch 出口，内置代理支持
- **Vitest** — 35 个单元测试，mock 网络层验证数据抓取逻辑

## 架构

```
src/
├── index.ts            # 入口：命令路由 + 代理配置
├── types.ts            # 共享领域类型
├── config/
│   ├── schema.ts       # Zod 配置 schema
│   └── loader.ts       # 配置读写
├── commands/
│   ├── init.ts         # 交互式初始化
│   ├── run.ts          # 抓取 + 生成文件
│   ├── preview.ts      # 终端预览
│   └── schedule.ts     # 定时 workflow
├── services/
│   ├── github.ts       # GitHub REST API（并发受限批量抓取）
│   ├── hackernews.ts   # HN Firebase API（关键词过滤）
│   └── digest.ts       # Markdown 渲染
└── utils/
    ├── format.ts       # 数字/日期格式化
    └── proxy.ts        # 代理 + 统一 fetch
```

设计原则：依赖单向流动（命令 → 服务 → 配置/utils）、小文件、类型先行。

## 开发

```bash
pnpm install
pnpm run type-check   # tsc 严格检查
pnpm run test         # vitest
pnpm run build        # 产出 dist/
```

## License

MIT
