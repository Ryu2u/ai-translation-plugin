import { createApp } from 'vue'
import FloatingButton from './FloatingButton.vue'
import SelectionBubble from './SelectionBubble.vue'
import InlineTranslation from './InlineTranslation.vue'
import Sidebar from './Sidebar.vue'
import './styles/content.css'

// 全局状态管理
let floatingButton: ReturnType<typeof createApp> | null = null
let selectionBubble: ReturnType<typeof createApp> | null = null
let sidebarInstance: ReturnType<typeof createApp> | null = null
let inlineInstance: ReturnType<typeof createApp> | null = null
let inlineContainer: HTMLElement | null = null

// 挂载悬浮按钮
function mountFloatingButton() {
  if (document.getElementById('ai-translation-floating')) return
  const container = document.createElement('div')
  container.id = 'ai-translation-floating'
  document.body.appendChild(container)
  floatingButton = createApp(FloatingButton, {
    onTranslate: (text: string) => handleTranslate(text, 'page')
  })
  floatingButton.mount(container)
}

// 挂载选中气泡
function mountSelectionBubble() {
  if (document.getElementById('ai-translation-selection-bubble')) return
  const container = document.createElement('div')
  container.id = 'ai-translation-selection-bubble'
  document.body.appendChild(container)
  selectionBubble = createApp(SelectionBubble, {
    onTranslate: (text: string) => handleTranslate(text, 'selection')
  })
  selectionBubble.mount(container)
}

// 处理翻译
async function handleTranslate(text: string, mode: 'page' | 'selection') {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE',
      payload: { text, targetLang: 'zh' }
    }) as { translatedText?: string; error?: string }

    if (response.error) {
      console.error('翻译错误:', response.error)
      return
    }

    if (mode === 'selection') {
      // 选中模式：显示侧边栏
      showSidebar(text, response.translatedText!)
    } else {
      // 整页模式：直接插入翻译，先清理已存在的
      if (inlineInstance) {
        inlineInstance.unmount()
        inlineInstance = null
      }
      if (inlineContainer) {
        inlineContainer.remove()
        inlineContainer = null
      }
      inlineInstance = createApp(InlineTranslation, {
        originalText: text,
        translatedText: response.translatedText!,
        onClose: () => {
          inlineInstance?.unmount()
          inlineInstance = null
          inlineContainer?.remove()
          inlineContainer = null
        }
      })
      inlineContainer = document.createElement('div')
      inlineContainer.id = 'ai-translation-inline'
      document.body.appendChild(inlineContainer)
      inlineInstance.mount(inlineContainer)
    }
  } catch (err) {
    console.error('翻译失败:', err)
  }
}

// 显示侧边栏
function showSidebar(original: string, translated: string) {
  if (sidebarInstance) return

  const container = document.createElement('div')
  container.id = 'ai-translation-sidebar'
  document.body.appendChild(container)
  sidebarInstance = createApp(Sidebar, {
    originalText: original,
    translatedText: translated,
    onClose: () => {
      sidebarInstance?.unmount()
      sidebarInstance = null
      container.remove()
    }
  })
  sidebarInstance.mount(container)
}

// 消息类型
interface ContentMessage {
  type: 'TRANSLATE_PAGE' | 'TRANSLATE_SELECTION'
  text?: string
}

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'TRANSLATE_PAGE') {
    // 获取页面全部文本
    const text = document.body.innerText
    handleTranslate(text, 'page')
  } else if (message.type === 'TRANSLATE_SELECTION' && message.text) {
    handleTranslate(message.text, 'selection')
  }
})

// 页面卸载时清理资源
window.addEventListener('unload', () => {
  floatingButton?.unmount()
  selectionBubble?.unmount()
  inlineInstance?.unmount()
  sidebarInstance?.unmount()
})

// 初始化
mountFloatingButton()
mountSelectionBubble()
