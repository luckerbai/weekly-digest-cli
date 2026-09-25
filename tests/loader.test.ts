import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, writeFileSync, rmSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadConfig, saveConfig, configExists, digestFilePath } from '../src/config/loader.js'

let tmpDir: string

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'digest-config-'))
})

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true })
})

describe('loadConfig', () => {
  it('throws when config file does not exist', () => {
    expect(() => loadConfig(tmpDir)).toThrow(/digest init/)
  })

  it('loads a valid config', () => {
    writeFileSync(
      join(tmpDir, 'digest.config.json'),
      JSON.stringify({
        repos: [{ owner: 'vuejs', name: 'core' }],
        keywords: ['vue'],
        outputDir: './',
      }),
    )
    const config = loadConfig(tmpDir)
    expect(config.repos).toEqual([{ owner: 'vuejs', name: 'core' }])
    expect(config.keywords).toEqual(['vue'])
  })

  it('throws with a clear message on invalid JSON', () => {
    writeFileSync(join(tmpDir, 'digest.config.json'), '{not valid json')
    expect(() => loadConfig(tmpDir)).toThrow()
  })

  it('throws with path info on schema violation', () => {
    writeFileSync(
      join(tmpDir, 'digest.config.json'),
      JSON.stringify({ repos: [], keywords: [] }),
    )
    expect(() => loadConfig(tmpDir)).toThrow(/repos/)
  })
})

describe('saveConfig', () => {
  it('writes config file and creates parent dirs', () => {
    const nested = join(tmpDir, 'deep', 'nested')
    const filePath = saveConfig(
      { repos: [{ owner: 'a', name: 'b' }], keywords: ['x'], outputDir: './out' },
      nested,
    )
    expect(filePath.endsWith('digest.config.json')).toBe(true)

    const written = JSON.parse(readFileSync(filePath, 'utf-8'))
    expect(written.repos).toEqual([{ owner: 'a', name: 'b' }])
    expect(written.outputDir).toBe('./out')
  })
})

describe('configExists', () => {
  it('returns false for missing config', () => {
    expect(configExists(tmpDir)).toBe(false)
  })

  it('returns true after saving', () => {
    saveConfig({ repos: [{ owner: 'a', name: 'b' }], keywords: [], outputDir: './' }, tmpDir)
    expect(configExists(tmpDir)).toBe(true)
  })
})

describe('digestFilePath', () => {
  it('builds date-stamped path under outputDir', () => {
    const config = { repos: [], keywords: [], outputDir: './reports' }
    const date = new Date('2026-09-24T12:00:00Z')
    const filePath = digestFilePath(config, tmpDir, date)
    expect(filePath).toContain(join('reports', 'digest-2026-09-24.md'))
    expect(filePath).toContain(tmpDir)
  })
})
