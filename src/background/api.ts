import type { TranslateResponse } from '../types'
import { getActiveApiConfig, getTargetLang } from './storage'

const langNames: Record<string, string> = {
  zh: 'Chinese', en: 'English', ja: 'Japanese', ko: 'Korean',
  fr: 'French', de: 'German', es: 'Spanish', ru: 'Russian',
  ar: 'Arabic', pt: 'Portuguese'
}

export async function translateText(
  text: string,
  _sourceLang?: string,
  overrideTargetLang?: string
): Promise<TranslateResponse> {
  console.log('[AI-Translate api] translateText called, textLength:', text?.length, 'overrideLang:', overrideTargetLang)
  const config = await getActiveApiConfig()
  console.log('[AI-Translate api] active config:', config ? {
    hasApiKey: !!config.apiKey,
    apiKeyLength: config.apiKey?.length,
    baseUrl: config.baseUrl,
    model: config.model
  } : null)
  if (!config) {
    throw new Error('请先在设置页面配置 API Key')
  }

  const targetLang = overrideTargetLang || await getTargetLang()
  const langDisplay = langNames[targetLang] || targetLang
  console.log('[AI-Translate api] targetLang:', targetLang, '->', langDisplay)

  const systemPrompt = `You are a professional translator. Translate the following text to ${langDisplay}. Only respond with the translation, nothing else.`

  const baseUrl = config.baseUrl.replace(/\/$/, '')
  const url = `${baseUrl}/chat/completions`
  console.log('[AI-Translate api] fetching:', url, 'model:', config.model)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3
      }),
      signal: controller.signal
    })
    console.log('[AI-Translate api] response status:', response.status, response.statusText)
  } catch (err) {
    console.error('[AI-Translate api] fetch threw:', err)
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('[AI-Translate api] non-OK body:', errorBody)
    throw new Error(`API 请求失败: ${response.status} - ${errorBody}`)
  }

  const data = await response.json()
  console.log('[AI-Translate api] response JSON:', data)
  let translatedText: string | undefined = data.choices?.[0]?.message?.content
  if (translatedText) {
    translatedText = translatedText
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/<think>[\s\S]*$/i, '')
      .trim()
  }
  console.log('[AI-Translate api] translatedText length:', translatedText?.length)

  if (!translatedText) {
    throw new Error('翻译结果为空')
  }

  return { translatedText }
}
