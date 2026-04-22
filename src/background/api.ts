import type { TranslateResponse } from '../types'
import { getActiveApiConfig, getTargetLang } from './storage'

const langNames: Record<string, string> = {
  zh: 'Chinese', en: 'English', ja: 'Japanese', ko: 'Korean',
  fr: 'French', de: 'German', es: 'Spanish', ru: 'Russian',
  ar: 'Arabic', pt: 'Portuguese'
}

export async function translateText(
  text: string,
  _sourceLang?: string
): Promise<TranslateResponse> {
  const config = await getActiveApiConfig()
  if (!config) {
    throw new Error('请先在设置页面配置 API Key')
  }

  const targetLang = await getTargetLang()
  const langDisplay = langNames[targetLang] || targetLang

  const systemPrompt = `You are a professional translator. Translate the following text to ${langDisplay}. Only respond with the translation, nothing else.`

  const baseUrl = config.baseUrl.replace(/\/$/, '')
  const url = `${baseUrl}/chat/completions`

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
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`API 请求失败: ${response.status} - ${errorBody}`)
  }

  const data = await response.json()
  const translatedText = data.choices?.[0]?.message?.content?.trim()

  if (!translatedText) {
    throw new Error('翻译结果为空')
  }

  return { translatedText }
}
