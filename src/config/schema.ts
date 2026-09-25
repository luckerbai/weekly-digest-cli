import { z } from 'zod'

/** GitHub 仓库标识：owner/name 或 owner/name 缩写校验 */
const repoSchema = z.object({
  owner: z
    .string()
    .min(1, 'owner 不能为空')
    .regex(/^[a-zA-Z0-9-]+$/, 'owner 只能包含字母、数字和连字符'),
  name: z
    .string()
    .min(1, '仓库名不能为空')
    .regex(/^[a-zA-Z0-9._-]+$/, '仓库名只能包含字母、数字、点、下划线和连字符'),
})

/** 关键词：非空、去重、限制数量 */
const keywordSchema = z
  .array(z.string().trim().min(1, '关键词不能为空'))
  .max(10, '最多 10 个关键词')
  .refine((arr) => new Set(arr).size === arr.length, '关键词不能重复')

/** 完整的 digest.config.json schema */
export const digestConfigSchema = z.object({
  repos: z.array(repoSchema).min(1, '至少关注 1 个仓库').max(20, '最多 20 个仓库'),
  keywords: keywordSchema,
  outputDir: z.string().min(1, '输出目录不能为空').default('./'),
})

/** 从 schema 推导类型（与 types.ts 保持一致，由 Zod 作为单一事实源） */
export type DigestConfigInput = z.input<typeof digestConfigSchema>

/** 交互输入的宽松校验（init 时逐字段校验） */
export const repoInputSchema = repoSchema
export const keywordInputSchema = keywordSchema
