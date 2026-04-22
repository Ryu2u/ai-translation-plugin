import type { ApiConfig } from '../types'
import { STORAGE_KEYS } from '../types'

/** Default target language code (Chinese) */
const DEFAULT_TARGET_LANG = 'zh'

export async function getApiConfigs(): Promise<ApiConfig[]> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.API_CONFIGS)
    const configs = result[STORAGE_KEYS.API_CONFIGS]
    return Array.isArray(configs) ? configs : []
  } catch (error) {
    console.error('Failed to get API configs:', error)
    return []
  }
}

export async function saveApiConfigs(configs: ApiConfig[]): Promise<void> {
  if (!Array.isArray(configs)) {
    throw new Error('configs must be an array')
  }
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.API_CONFIGS]: configs })
  } catch (error) {
    console.error('Failed to save API configs:', error)
    throw error
  }
}

export async function getActiveApiConfig(): Promise<ApiConfig | null> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.ACTIVE_API_ID)
    const activeId = result[STORAGE_KEYS.ACTIVE_API_ID]
    console.log('[AI-Translate storage] ACTIVE_API_ID:', activeId)
    if (!activeId) return null

    const configs = await getApiConfigs()
    console.log('[AI-Translate storage] configs count:', configs.length, 'ids:', configs.map(c => c.id))
    return configs.find(c => c.id === activeId) || null
  } catch (error) {
    console.error('Failed to get active API config:', error)
    return null
  }
}

export async function setActiveApiId(id: string): Promise<void> {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_API_ID]: id })
  } catch (error) {
    console.error('Failed to set active API ID:', error)
    throw error
  }
}

export async function getTargetLang(): Promise<string> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.TARGET_LANG)
    return (result[STORAGE_KEYS.TARGET_LANG] as string) || DEFAULT_TARGET_LANG
  } catch (error) {
    console.error('Failed to get target lang:', error)
    return DEFAULT_TARGET_LANG
  }
}

export async function setTargetLang(lang: string): Promise<void> {
  if (typeof lang !== 'string' || lang.trim() === '') {
    throw new Error('lang must be a non-empty string')
  }
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.TARGET_LANG]: lang })
  } catch (error) {
    console.error('Failed to set target lang:', error)
    throw error
  }
}
