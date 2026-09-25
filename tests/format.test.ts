import { describe, it, expect } from 'vitest'
import { formatCompactNumber, toDateString, oneLineCommit } from '../src/utils/format.js'

describe('formatCompactNumber', () => {
  it('formats small numbers as-is', () => {
    expect(formatCompactNumber(0)).toBe('0')
    expect(formatCompactNumber(42)).toBe('42')
    expect(formatCompactNumber(999)).toBe('999')
  })

  it('formats thousands with K suffix', () => {
    expect(formatCompactNumber(1000)).toBe('1K')
    expect(formatCompactNumber(1500)).toBe('1.5K')
    expect(formatCompactNumber(1234567 - 234567)).toBe('1M')
  })

  it('formats millions with M suffix', () => {
    expect(formatCompactNumber(1000000)).toBe('1M')
    expect(formatCompactNumber(2300000)).toBe('2.3M')
  })
})

describe('toDateString', () => {
  it('extracts YYYY-MM-DD from ISO string', () => {
    expect(toDateString('2026-09-24T10:30:00Z')).toBe('2026-09-24')
    expect(toDateString('2026-01-05T00:00:00.000Z')).toBe('2026-01-05')
  })
})

describe('oneLineCommit', () => {
  it('keeps first line of multiline message', () => {
    expect(oneLineCommit('feat: add digest\n\nMore details here')).toBe('feat: add digest')
  })

  it('truncates long messages with ellipsis', () => {
    const long = 'x'.repeat(100)
    const result = oneLineCommit(long, 72)
    expect(result.length).toBe(72)
    expect(result.endsWith('...')).toBe(true)
  })

  it('returns empty string for empty message', () => {
    expect(oneLineCommit('')).toBe('')
    expect(oneLineCommit('\n\n')).toBe('')
  })
})
