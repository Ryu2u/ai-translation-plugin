import { createApp, reactive, h } from 'vue'
import FloatingButton from './FloatingButton.vue'
import SelectionBubble from './SelectionBubble.vue'
import Sidebar from './Sidebar.vue'
import InputPanel from './InputPanel.vue'
import './styles/content.css'

let floatingButton: ReturnType<typeof createApp> | null = null
let selectionBubble: ReturnType<typeof createApp> | null = null
let sidebarInstance: ReturnType<typeof createApp> | null = null
let inputPanelInstance: ReturnType<typeof createApp> | null = null
let inputPanelContainer: HTMLElement | null = null

function mountFloatingButton() {
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
  if (document.getElementById('ai-translation-selection-bubble')) return
  const container = document.createElement('div')
  container.id = 'ai-translation-selection-bubble'
  document.body.appendChild(container)
  selectionBubble = createApp(SelectionBubble, {
    onTranslate: (text: string) => handleSelectionTranslate(text)
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

// 选中文字翻译：立即显示 Sidebar loading，翻译完成后填充
async function handleSelectionTranslate(text: string, targetLang = 'zh') {
  console.log('[AI-Translate content] handleSelectionTranslate, length:', text.length)
  const state = reactive({
    originalText: text,
    translatedText: '',
    targetLang,
    loading: true,
    error: ''
  })
  showSidebarReactive(state)

  doTranslate(state, state.targetLang)
}

function showSidebarReactive(state: { originalText: string; translatedText: string; targetLang: string; loading: boolean; error: string }) {
  if (sidebarInstance) {
    sidebarInstance.unmount()
    sidebarInstance = null
    document.getElementById('ai-translation-sidebar')?.remove()
  }

  const container = document.createElement('div')
  container.id = 'ai-translation-sidebar'
  document.body.appendChild(container)

  const app = createApp({
    render() {
      return h(Sidebar as any, {
        originalText: state.originalText,
        translatedText: state.translatedText,
        targetLang: state.targetLang,
        loading: state.loading,
        error: state.error,
        'onUpdate:targetLang': (lang: string) => {
          state.targetLang = lang
          // Re-translate with new language
          doTranslate(state, lang)
          // Save language preference
          chrome.storage?.local?.set({ target_lang: lang })
        },
        onClose: () => {
          app.unmount()
          sidebarInstance = null
          container.remove()
        }
      })
    }
  })
  sidebarInstance = app
  app.mount(container)
}

async function doTranslate(state: { originalText: string; translatedText: string; targetLang: string; loading: boolean; error: string }, targetLang: string) {
  state.loading = true
  state.error = ''
  state.translatedText = ''

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE',
      payload: { text: state.originalText, targetLang }
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
  sidebarInstance?.unmount()
  inputPanelInstance?.unmount()
})

mountFloatingButton()
mountSelectionBubble()
