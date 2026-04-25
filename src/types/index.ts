// API 配置
export interface ApiConfig {
  id: string
  name: string
  apiKey: string
  baseUrl: string
  model: string
  isActive: boolean
}

// 翻译请求
export interface TranslateRequest {
  text: string
  sourceLang?: string
  targetLang?: string
  autoTranslate?: boolean
}

// 翻译响应
export interface TranslateResponse {
  translatedText: string
  confidence?: number
}

// 消息类型
export type MessageType =
  | { type: 'TRANSLATE'; payload: TranslateRequest }
  | { type: 'TRANSLATE_RESULT'; payload: TranslateResponse }
  | { type: 'GET_CONFIG'; payload: null }
  | { type: 'CONFIG_RESULT'; payload: ApiConfig | null }
  | { type: 'OPEN_SIDEBAR'; payload: null }
  | { type: 'SET_TARGET_LANG'; payload: string }
  | { type: 'GET_AUTO_TRANSLATE'; payload: null }
  | { type: 'SET_AUTO_TRANSLATE'; payload: boolean }
  | { type: 'GET_AUTO_TRANSLATE_PAIR'; payload: null }
  | { type: 'SET_AUTO_TRANSLATE_PAIR'; payload: [string, string] }

// 存储 Keys
export const STORAGE_KEYS = {
  API_CONFIGS: 'api_configs',
  ACTIVE_API_ID: 'active_api_id',
  TARGET_LANG: 'target_lang',
  UI_STYLE: 'ui_style',
  AUTO_TRANSLATE: 'auto_translate',
  AUTO_TRANSLATE_PAIR: 'auto_translate_pair'
} as const
