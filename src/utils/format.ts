/** 将 1234567 格式化为 1.2M */
export function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return String(n)
}

/** ISO 日期转 YYYY-MM-DD */
export function toDateString(iso: string): string {
  return iso.slice(0, 10)
}

/** 将摘要消息压缩为单行（保留首行，截断过长） */
export function oneLineCommit(message: string, maxLength = 72): string {
  const firstLine = message.split('\n')[0]?.trim() ?? ''
  if (firstLine.length <= maxLength) return firstLine
  return `${firstLine.slice(0, maxLength - 3)}...`
}

/** 当前本地时间 ISO 字符串 */
export function nowISO(): string {
  return new Date().toISOString()
}
