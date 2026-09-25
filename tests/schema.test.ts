import { describe, it, expect } from 'vitest'
import { digestConfigSchema, repoInputSchema } from '../src/config/schema.js'

describe('digestConfigSchema', () => {
  it('accepts a valid config', () => {
    const result = digestConfigSchema.safeParse({
      repos: [{ owner: 'vuejs', name: 'core' }],
      keywords: ['vue', 'typescript'],
      outputDir: './',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.repos[0]?.owner).toBe('vuejs')
    }
  })

  it('applies default outputDir when omitted', () => {
    const result = digestConfigSchema.safeParse({
      repos: [{ owner: 'vuejs', name: 'core' }],
      keywords: [],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.outputDir).toBe('./')
    }
  })

  it('rejects empty repos list', () => {
    const result = digestConfigSchema.safeParse({
      repos: [],
      keywords: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid repo owner characters', () => {
    const result = digestConfigSchema.safeParse({
      repos: [{ owner: 'bad owner!', name: 'core' }],
      keywords: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects duplicate keywords', () => {
    const result = digestConfigSchema.safeParse({
      repos: [{ owner: 'vuejs', name: 'core' }],
      keywords: ['vue', 'vue'],
    })
    expect(result.success).toBe(false)
  })

  it('rejects too many keywords', () => {
    const result = digestConfigSchema.safeParse({
      repos: [{ owner: 'vuejs', name: 'core' }],
      keywords: Array.from({ length: 11 }, (_, i) => `k${i}`),
    })
    expect(result.success).toBe(false)
  })
})

describe('repoInputSchema', () => {
  it('parses owner/name format', () => {
    const result = repoInputSchema.safeParse({ owner: 'vuejs', name: 'core' })
    expect(result.success).toBe(true)
  })

  it('rejects missing name', () => {
    const result = repoInputSchema.safeParse({ owner: 'vuejs', name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only name', () => {
    const result = repoInputSchema.safeParse({ owner: 'vuejs', name: '   ' })
    expect(result.success).toBe(false)
  })
})
