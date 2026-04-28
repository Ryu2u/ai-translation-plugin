<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="selection-bubble"
      :style="{ left: x + 'px', top: y + 'px' }"
      @mousedown.prevent.stop="handleClick"
    >
      译
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'translate', text: string, rect: { left: number; top: number; bottom: number; width: number } | null, insertionEl: Element | null): void
}>()

const visible = ref(false)
const x = ref(0)
const y = ref(0)

let selectionText = ''
let selectionRect: { left: number; top: number; bottom: number; width: number } | null = null

const INLINE_DISPLAYS = new Set([
  'inline', 'contents', 'none', 'ruby', 'ruby-base', 'ruby-text'
])

const DIV_DENIED_PARENTS = new Set([
  'ul', 'ol', 'table', 'thead', 'tbody', 'tfoot', 'tr'
])

function findBlockInsertionPoint(): Element | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return null

  const range = selection.getRangeAt(0)
  let node: Node = range.commonAncestorContainer

  if (node.nodeType === Node.TEXT_NODE) {
    if (!node.parentElement) return null
    node = node.parentElement
  }

  let el: Element | null = node as Element
  while (el && el !== document.body && el !== document.documentElement) {
    const display = window.getComputedStyle(el).display
    if (!INLINE_DISPLAYS.has(display)) break
    el = el.parentElement
  }

  if (!el || el === document.body || el === document.documentElement) {
    return null
  }

  while (el && el !== document.body) {
    const parent: Element | null = el.parentElement
    if (!parent) return el
    if (!DIV_DENIED_PARENTS.has(parent.tagName.toLowerCase())) {
      return el
    }
    el = parent
  }

  return null
}

function extractTextWithBreaks(range: Range): string {
  const walker = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT
  )

  let result = ''
  let prevBlock: Element | null = null
  let node = walker.firstChild() as Text | null

  while (node) {
    if (!range.intersectsNode(node)) {
      node = walker.nextNode() as Text | null
      continue
    }

    // Find the nearest block-level ancestor for this text node
    let block: Element | null = node.parentElement
    while (block && INLINE_DISPLAYS.has(window.getComputedStyle(block).display)) {
      block = block.parentElement
    }

    // Insert \n when crossing into a different block
    if (prevBlock && block !== prevBlock) {
      result += '\n'
    }
    prevBlock = block

    let t = node.textContent || ''
    if (node === range.startContainer) t = t.slice(range.startOffset)
    if (node === range.endContainer) t = t.slice(0, range.endOffset)
    result += t

    node = walker.nextNode() as Text | null
  }

  return result.trim()
}

function handleSelectionChange() {
  // 排除插件自己的页面（popup、options 等）
  if (window.location.protocol === 'chrome-extension:') return

  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    visible.value = false
    return
  }

  const range = selection.getRangeAt(0)
  const text = extractTextWithBreaks(range)

  if (text && text.length > 0) {
    selectionText = text
    const rect = range.getBoundingClientRect()
    selectionRect = { left: rect.left, top: rect.top, bottom: rect.bottom, width: rect.width }
    x.value = rect.left + rect.width / 2
    y.value = rect.top - 10
    visible.value = true
  } else {
    visible.value = false
  }
}

function handleClick() {
  console.log('[AI-Translate content] SelectionBubble clicked, text length:', selectionText.length)
  if (selectionText) {
    const insertionEl = findBlockInsertionPoint()
    console.log('[AI-Translate content] insertion element:', insertionEl?.tagName, insertionEl?.className)
    emit('translate', selectionText, selectionRect, insertionEl)
    visible.value = false
    window.getSelection()?.removeAllRanges()
  }
}

function handleClickOutside(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (!target.closest('.selection-bubble')) {
    visible.value = false
  }
}

onMounted(() => {
  document.addEventListener('mouseup', handleSelectionChange)
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mouseup', handleSelectionChange)
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<style scoped>
.selection-bubble {
  position: fixed;
  transform: translateX(-50%) translateY(-100%);
  background: #2d2d2d;
  color: white;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  z-index: 2147483647;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.15s ease-out;
}

.selection-bubble::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #2d2d2d;
}

.selection-bubble:hover {
  background: #3d3d3d;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-100%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(-100%) scale(1);
  }
}
</style>
