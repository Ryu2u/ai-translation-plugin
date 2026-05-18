import { createApp, reactive, h } from 'vue'
import FloatingButton from './FloatingButton.vue'
import SelectionBubble from './SelectionBubble.vue'
import InputPanel from './InputPanel.vue'
import InlineTranslation from './InlineTranslation.vue'
import SummaryPanel from './SummaryPanel.vue'
import './styles/content.css'

let floatingButton: ReturnType<typeof createApp> | null = null
let selectionBubble: ReturnType<typeof createApp> | null = null
let inputPanelInstance: ReturnType<typeof createApp> | null = null
let inputPanelContainer: HTMLElement | null = null
let summaryPanelInstance: ReturnType<typeof createApp> | null = null
let summaryPanelContainer: HTMLElement | null = null

interface TranslationInstance {
  app: ReturnType<typeof createApp>
  container: HTMLElement
}
const activeTranslations = new Map<string, TranslationInstance>()

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

// ── DOM 工具常量和函数（复用 SelectionBubble.vue 中的逻辑）──

const INLINE_DISPLAYS = new Set([
  'inline', 'contents', 'none', 'ruby', 'ruby-base', 'ruby-text'
])

const DIV_DENIED_PARENTS = new Set([
  'ul', 'ol', 'table', 'thead', 'tbody', 'tfoot', 'tr'
])

const SKIP_TAGS = new Set([
  'script', 'style', 'noscript', 'iframe', 'svg', 'br', 'hr', 'link', 'meta', 'code', 'pre'
])

const EXTENSION_ID_PREFIX = 'ai-translation-'
const MAX_BLOCKS = 200

function isExtensionElement(el: Element): boolean {
  let current: Element | null = el
  while (current) {
    if (current.id && current.id.startsWith(EXTENSION_ID_PREFIX)) return true
    current = current.parentElement
  }
  return false
}

function isElementVisible(el: Element): boolean {
  let current: Element | null = el
  while (current) {
    const style = window.getComputedStyle(current)
    if (style.display === 'none') return false
    if (style.visibility === 'hidden') return false
    current = current.parentElement
  }
  const rect = el.getBoundingClientRect()
  return rect.width > 0 || rect.height > 0
}

function findNearestBlockAncestor(textNode: Node): Element | null {
  let el: Element | null = textNode.parentElement
  if (!el) return null
  while (el && el !== document.body && el !== document.documentElement) {
    if (!INLINE_DISPLAYS.has(window.getComputedStyle(el).display)) break
    el = el.parentElement
  }
  if (!el || el === document.body || el === document.documentElement) return null
  return el
}

function resolveInsertionElement(block: Element): Element | null {
  let el: Element | null = block
  while (el && el !== document.body && el !== document.documentElement) {
    const parent: Element | null = el.parentElement
    if (!parent || parent === document.body || parent === document.documentElement) return el
    if (!DIV_DENIED_PARENTS.has(parent.tagName.toLowerCase())) return el
    el = parent
  }
  return null
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
  let autoTranslate = false
  chrome.storage?.local?.get(['target_lang', 'auto_translate'], (r) => {
    console.log('[AI-Translate content] handleSelectionTranslate storage:', r)
    if (typeof r?.target_lang === 'string') {
      targetLang = r.target_lang
      state.targetLang = r.target_lang
    }
    if (r?.auto_translate === true) {
      autoTranslate = true
      state.autoTranslate = true
    }
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
      state.autoTranslate = false
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
): string {
  const instanceId = 'ai-translation-inline-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7)

  const container = document.createElement('div')
  container.id = instanceId

  if (insertionEl && insertionEl.parentElement) {
    container.style.display = 'block'
    const elWidth = insertionEl.getBoundingClientRect().width
    if (elWidth > 0) {
      container.style.width = elWidth + 'px'
      width = elWidth
    }
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
          state.autoTranslate = false
          doTranslate(state, lang, false)
        },
        'onUpdate:autoTranslate': (value: boolean) => {
          state.autoTranslate = value
          doTranslate(state, state.targetLang, value)
          chrome.storage?.local?.set({ auto_translate: value })
        },
        onClose: () => {
          app.unmount()
          activeTranslations.delete(instanceId)
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

  activeTranslations.set(instanceId, { app, container })
  app.mount(container)
  return instanceId
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
    const msg = err?.message || String(err)
    if (msg.includes('Extension context invalidated')) {
      state.error = '扩展已更新，请刷新页面后重试'
    } else {
      state.error = msg
    }
  } finally {
    state.loading = false
  }
}

// ── 整页翻译：逐元素内联翻译 ──

interface TextBlock {
  element: Element
  text: string
}

function collectPageTextBlocks(): TextBlock[] {
  const blockMap = new Map<Element, string[]>()

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const textNode = node as Text
        const parent = textNode.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        if (isExtensionElement(parent)) return NodeFilter.FILTER_REJECT
        if (!isElementVisible(parent)) return NodeFilter.FILTER_REJECT

        let tagCheck: Element | null = parent
        while (tagCheck) {
          if (SKIP_TAGS.has(tagCheck.tagName.toLowerCase())) return NodeFilter.FILTER_REJECT
          tagCheck = tagCheck.parentElement
        }

        const text = textNode.textContent || ''
        if (!text.trim()) return NodeFilter.FILTER_SKIP

        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  let textNode: Text | null
  while ((textNode = walker.nextNode() as Text | null)) {
    const block = findNearestBlockAncestor(textNode)
    if (!block) continue

    const insertionEl = resolveInsertionElement(block)
    if (!insertionEl || insertionEl === document.body || insertionEl === document.documentElement) continue
    if (isExtensionElement(insertionEl)) continue
    if (!isElementVisible(insertionEl)) continue

    if (!blockMap.has(insertionEl)) {
      blockMap.set(insertionEl, [])
    }
    blockMap.get(insertionEl)!.push(textNode.textContent || '')
  }

  const results: TextBlock[] = []
  for (const [element, fragments] of blockMap) {
    const text = fragments.join('').replace(/\s+/g, ' ').trim()
    if (text.length > 0) {
      results.push({ element, text })
    }
  }

  return results
}

function collectPageMainContent(): string {
  const MAIN_CONTENT_MAX_CHARS = 8000
  const selectors = [
    'article', 'main', '[role="main"]',
    '.post-content', '.article-content', '.entry-content',
    '#content', '#main-content', '.markdown-body'
  ]

  // Tier 1: Try semantic content containers
  for (const selector of selectors) {
    const el = document.querySelector(selector)
    if (el && isElementVisible(el) && !isExtensionElement(el)) {
      const text = (el.textContent || '').replace(/\s+/g, ' ').trim()
      if (text.length >= 100) return text.slice(0, MAIN_CONTENT_MAX_CHARS)
    }
  }

  // Tier 2: Fall back to TreeWalker block collection
  const blocks = collectPageTextBlocks()
  return blocks.map(b => b.text).join('\n\n').slice(0, MAIN_CONTENT_MAX_CHARS)
}

function clearAllTranslations(): void {
  for (const [, instance] of activeTranslations) {
    instance.app.unmount()
    instance.container.remove()
  }
  activeTranslations.clear()
}

interface TranslationTask {
  state: ReturnType<typeof reactive> & {
    originalText: string
    translatedText: string
    targetLang: string
    loading: boolean
    error: string
    autoTranslate: boolean
  }
  instanceId: string
}

async function translateBatch(
  tasks: TranslationTask[],
  concurrency: number,
  targetLang: string,
  autoTranslate: boolean
): Promise<void> {
  let nextIndex = 0

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const idx = nextIndex++
      const task = tasks[idx]
      task.state.targetLang = targetLang
      task.state.autoTranslate = autoTranslate
      await doTranslate(task.state, targetLang, autoTranslate)
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => worker()
  )
  await Promise.all(workers)
}

async function handleTranslatePage(): Promise<void> {
  console.log('[AI-Translate content] handleTranslatePage starting')

  clearAllTranslations()

  const blocks = collectPageTextBlocks()
  console.log('[AI-Translate content] Collected', blocks.length, 'text blocks')

  if (blocks.length === 0) {
    console.log('[AI-Translate content] No translatable blocks found')
    return
  }

  const limitedBlocks = blocks.slice(0, MAX_BLOCKS)
  if (blocks.length > MAX_BLOCKS) {
    console.warn('[AI-Translate content] Truncated from', blocks.length, 'to', MAX_BLOCKS, 'blocks')
  }

  let targetLang = 'zh'
  let autoTranslate = false
  chrome.storage?.local?.get(['target_lang', 'auto_translate'], (r) => {
    if (typeof r?.target_lang === 'string') targetLang = r.target_lang
    if (r?.auto_translate === true) autoTranslate = true
  })

  const tasks: TranslationTask[] = []
  for (const block of limitedBlocks) {
    const state = reactive({
      originalText: block.text,
      translatedText: '',
      targetLang,
      loading: false,
      error: '',
      autoTranslate
    })

    const instanceId = showInlineTranslation(state, block.element)
    tasks.push({ state, instanceId })
  }

  await translateBatch(tasks, 3, targetLang, autoTranslate)
  console.log('[AI-Translate content] handleTranslatePage completed')
}

async function handleSummarizePage(): Promise<void> {
  console.log('[AI-Translate content] handleSummarizePage starting')

  // Close existing panel if already open
  if (summaryPanelInstance) {
    summaryPanelInstance.unmount()
    summaryPanelContainer?.remove()
    summaryPanelInstance = null
    summaryPanelContainer = null
  }

  // Collect page content synchronously
  const pageContent = collectPageMainContent()
  console.log('[AI-Translate content] Collected page content, length:', pageContent.length)

  if (!pageContent) {
    console.warn('[AI-Translate content] No page content to summarize')
    return
  }

  // Mount SummaryPanel with page content
  summaryPanelContainer = document.createElement('div')
  summaryPanelContainer.id = 'ai-translation-summary-panel'
  document.body.appendChild(summaryPanelContainer)

  summaryPanelInstance = createApp(SummaryPanel, {
    pageContent,
    onClose: () => {
      summaryPanelInstance?.unmount()
      summaryPanelInstance = null
      summaryPanelContainer?.remove()
      summaryPanelContainer = null
    }
  })
  summaryPanelInstance.mount(summaryPanelContainer)
}

interface ContentMessage {
  type: 'TRANSLATE_PAGE' | 'TRANSLATE_SELECTION' | 'SUMMARIZE_PAGE'
  text?: string
}

chrome.runtime.onMessage.addListener((message: ContentMessage) => {
  if (message.type === 'TRANSLATE_PAGE') {
    handleTranslatePage()
  } else if (message.type === 'TRANSLATE_SELECTION' && message.text) {
    handleSelectionTranslate(message.text)
  } else if (message.type === 'SUMMARIZE_PAGE') {
    handleSummarizePage()
  }
})

window.addEventListener('pagehide', () => {
  floatingButton?.unmount()
  selectionBubble?.unmount()
  inputPanelInstance?.unmount()
  summaryPanelInstance?.unmount()
  clearAllTranslations()
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
