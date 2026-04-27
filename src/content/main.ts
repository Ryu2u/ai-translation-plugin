import { createApp, reactive, h } from 'vue'
import FloatingButton from './FloatingButton.vue'
import SelectionBubble from './SelectionBubble.vue'
import InputPanel from './InputPanel.vue'
import InlineTranslation from './InlineTranslation.vue'
import './styles/content.css'

let floatingButton: ReturnType<typeof createApp> | null = null
let selectionBubble: ReturnType<typeof createApp> | null = null
let inputPanelInstance: ReturnType<typeof createApp> | null = null
let inputPanelContainer: HTMLElement | null = null
let inlineTranslationInstance: ReturnType<typeof createApp> | null = null

function mountFloatingButton() {
  if (window.location.protocol === 'chrome-extension:') return
  if (document.getElementById('ai-translation-floating')) return
  const container = document.createElement('div')
  container.id = 'ai-translation-floating'
  document.body.appendChild(container)
  floatingButton = createApp(FloatingButton, {
    onTranslate: () => openInputPanel()
  })
  floatingButton.mount(container)
}

function mountSelectionBubble() {
  if (window.location.protocol === 'chrome-extension:') return
  if (document.getElementById('ai-translation-selection-bubble')) return
  const container = document.createElement('div')
  container.id = 'ai-translation-selection-bubble'
  document.body.appendChild(container)
  selectionBubble = createApp(SelectionBubble, {
    onTranslate: (text: string, rect: { left: number; top: number; bottom: number; width: number } | null, insertionEl: Element | null) =>
      handleSelectionTranslate(text, rect, insertionEl)
  })
  selectionBubble.mount(container)
}

function openInputPanel() {
  console.log('[AI-Translate content] FloatingButton clicked -> open InputPanel')
  if (inputPanelInstance) return
  inputPanelContainer = document.createElement('div')
  inputPanelContainer.id = 'ai-translation-input-panel'
  document.body.appendChild(inputPanelContainer)
  inputPanelInstance = createApp(InputPanel, {
    onClose: () => {
      inputPanelInstance?.unmount()
      inputPanelInstance = null
      inputPanelContainer?.remove()
      inputPanelContainer = null
    }
  })
  inputPanelInstance.mount(inputPanelContainer)
}

// 选中文字翻译：在源文字下方内联展示翻译结果
async function handleSelectionTranslate(
  text: string,
  rect?: { left: number; top: number; bottom: number; width: number } | null,
  insertionEl?: Element | null,
  targetLang = 'zh'
) {
  console.log('[AI-Translate content] handleSelectionTranslate, length:', text.length)
  let autoTranslate = true
  chrome.storage?.local?.get(['target_lang', 'auto_translate'], (r) => {
    console.log('[AI-Translate content] handleSelectionTranslate storage:', r)
    if (typeof r?.target_lang === 'string') {
      targetLang = r.target_lang
    } else {
      targetLang = 'zh'
    }
    if (r?.auto_translate === true) autoTranslate = true
  })

  const state = reactive({
    originalText: text,
    translatedText: '',
    targetLang,
    loading: true,
    error: '',
    autoTranslate
  })

  if (insertionEl) {
    // DOM 流内插入：直接在源元素下方
    showInlineTranslation(state, insertionEl)
  } else {
    // 兜底：绝对定位在 body
    const x = rect ? rect.left + window.scrollX : window.scrollX + window.innerWidth / 2 - 260
    const y = rect ? rect.bottom + window.scrollY + 8 : window.scrollY + window.innerHeight / 3
    const width = rect ? rect.width : 520
    showInlineTranslation(state, null, x, y, width)
  }

  // Load auto-translate setting
  chrome.storage?.local?.get('auto_translate', (r) => {
    if (r?.auto_translate === true) {
      state.autoTranslate = true
      doTranslate(state, state.targetLang, true)
    } else {
      doTranslate(state, state.targetLang, false)
    }
  })
}

function showInlineTranslation(
  state: { originalText: string; translatedText: string; targetLang: string; loading: boolean; error: string; autoTranslate: boolean },
  insertionEl: Element | null,
  x?: number,
  y?: number,
  width?: number
) {
  if (inlineTranslationInstance) {
    inlineTranslationInstance.unmount()
    inlineTranslationInstance = null
    document.getElementById('ai-translation-inline')?.remove()
  }

  const container = document.createElement('div')
  container.id = 'ai-translation-inline'

  if (insertionEl && insertionEl.parentElement) {
    container.style.display = 'block'
    insertionEl.insertAdjacentElement('afterend', container)
  } else {
    document.body.appendChild(container)
  }

  const app = createApp({
    render() {
      const props: Record<string, any> = {
        originalText: state.originalText,
        translatedText: state.translatedText,
        targetLang: state.targetLang,
        loading: state.loading,
        error: state.error,
        autoTranslate: state.autoTranslate,
        'onUpdate:targetLang': (lang: string) => {
          state.targetLang = lang
          doTranslate(state, lang, state.autoTranslate)
          chrome.storage?.local?.set({ target_lang: lang })
        },
        'onUpdate:autoTranslate': (value: boolean) => {
          state.autoTranslate = value
          doTranslate(state, state.targetLang, value)
          chrome.storage?.local?.set({ auto_translate: value })
        },
        onClose: () => {
          app.unmount()
          inlineTranslationInstance = null
          container.remove()
        }
      }

      if (x !== undefined && y !== undefined) {
        props.x = x
        props.y = y
        props.width = width
      }

      return h(InlineTranslation as any, props)
    }
  })
  inlineTranslationInstance = app
  app.mount(container)
}

async function doTranslate(state: { originalText: string; translatedText: string; targetLang: string; loading: boolean; error: string }, targetLang: string, autoTranslate = false) {
  state.loading = true
  state.error = ''
  state.translatedText = ''

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE',
      payload: { text: state.originalText, targetLang, autoTranslate }
    }) as { translatedText?: string; error?: string }

    if (!response) {
      state.error = '无响应，请检查 Service Worker'
    } else if (response.error) {
      state.error = response.error
    } else {
      state.translatedText = response.translatedText || ''
    }
  } catch (err: any) {
    state.error = err?.message || String(err)
  } finally {
    state.loading = false
  }
}

interface ContentMessage {
  type: 'TRANSLATE_PAGE' | 'TRANSLATE_SELECTION'
  text?: string
}

chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'TRANSLATE_PAGE') {
    openInputPanel()
  } else if (message.type === 'TRANSLATE_SELECTION' && message.text) {
    handleSelectionTranslate(message.text)
  }
})

window.addEventListener('unload', () => {
  floatingButton?.unmount()
  selectionBubble?.unmount()
  inputPanelInstance?.unmount()
  inlineTranslationInstance?.unmount()
})

function isFullscreen(): boolean {
  if (document.fullscreenElement) return true
  // F11 native fullscreen: window fills the entire screen (browser chrome hidden)
  return window.innerHeight >= screen.height - 5
}

function handleFullscreenChange() {
  const el = document.getElementById('ai-translation-floating')
  if (!el) return
  el.style.display = isFullscreen() ? 'none' : ''
}

document.addEventListener('fullscreenchange', handleFullscreenChange)
window.addEventListener('resize', handleFullscreenChange)

mountFloatingButton()
mountSelectionBubble()
