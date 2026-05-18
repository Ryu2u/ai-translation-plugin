<template>
  <Teleport to="body">
    <div class="sidebar-overlay" @click.self="handleClose">
      <div class="sidebar" :style="{ width: panelWidth + 'px' }">
        <div class="sidebar-header">
          <span>AI 页面总结</span>
          <div class="header-actions">
            <select v-model="targetLang" :disabled="loading" class="lang-select" @change="doSummarize">
              <option v-for="opt in langOptions" :key="opt.code" :value="opt.code">{{ opt.label }}</option>
            </select>
            <button class="close-btn" @click="handleClose" :disabled="loading">×</button>
          </div>
        </div>
        <div class="sidebar-content">
          <div class="source-info">正在总结: {{ pageTitle }}</div>
          <div v-if="loading" class="loading-box">
            <span class="spinner" />
            <span>正在总结页面内容...</span>
          </div>
          <div v-if="error" class="error-box">{{ error }}</div>
          <div v-if="result" class="result-section">
            <div class="section-label">总结</div>
            <div class="result-box rendered-markdown" v-html="renderMarkdown(result)" />
            <button class="copy-btn" @click="copyResult">{{ copied ? '已复制' : '复制总结' }}</button>
          </div>
        </div>
        <div class="resize-handle" @mousedown.stop="startResize" title="拖拽调整宽度"></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { renderMarkdown } from './markdown'

const props = defineProps<{
  pageContent: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const langOptions = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' }
]

const targetLang = ref('zh')
const loading = ref(false)
const result = ref('')
const error = ref('')
const copied = ref(false)
const pageTitle = ref(document.title)

// Sidebar width & resize
const panelWidth = ref(420)

let resizeStartX = 0, resizeOrigW = 0
function startResize(e: MouseEvent) {
  resizeStartX = e.clientX
  resizeOrigW = panelWidth.value
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
}
function onResize(e: MouseEvent) {
  panelWidth.value = Math.max(320, Math.min(960, resizeOrigW - (e.clientX - resizeStartX)))
}
function stopResize() {
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

function handleClose() {
  if (loading.value) return
  emit('close')
}

async function doSummarize() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  result.value = ''
  try {
    console.log('[AI-Translate content] SummaryPanel sending SUMMARIZE_PAGE, textLength:', props.pageContent.length, 'targetLang:', targetLang.value)
    const response = await chrome.runtime.sendMessage({
      type: 'SUMMARIZE_PAGE',
      payload: { text: props.pageContent, targetLang: targetLang.value }
    }) as { summary?: string; error?: string }
    console.log('[AI-Translate content] SummaryPanel response:', response)
    if (!response) {
      error.value = '无响应，请检查 Service Worker 是否存活'
    } else if (response.error) {
      error.value = response.error
    } else {
      result.value = response.summary || ''
    }
  } catch (err: any) {
    console.error('[AI-Translate content] SummaryPanel sendMessage error:', err)
    const msg = err?.message || String(err)
    if (msg.includes('Extension context invalidated')) {
      error.value = '扩展已更新，请刷新页面后重试'
    } else {
      error.value = msg
    }
  } finally {
    loading.value = false
  }

  chrome.storage?.local?.set({ summary_lang: targetLang.value })
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(result.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

onMounted(() => {
  chrome.storage?.local?.get('summary_lang', (r) => {
    if (typeof r?.summary_lang === 'string') targetLang.value = r.summary_lang
  })
  doSummarize()
})

onUnmounted(() => {
  stopResize()
})
</script>

<style scoped>
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2147483646;
  animation: fadeIn 0.2s ease-out;
}

.sidebar {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  background: #1f1f1f;
  color: #e5e7eb;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.4);
  animation: slideIn 0.25s ease-out;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid #2d2d2d;
  font-weight: bold;
  font-size: 16px;
  user-select: none;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lang-select {
  padding: 4px 8px;
  background: #2d2d2d;
  color: #e5e7eb;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}
.lang-select:focus { border-color: #4f46e5; }
.lang-select:disabled { opacity: 0.5; cursor: not-allowed; }

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.close-btn:hover { color: #e5e7eb; background: rgba(255, 255, 255, 0.08); }
.close-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.sidebar-content {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
  min-height: 0;
}

.source-info {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.loading-box {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #9ca3af;
  font-size: 14px;
  padding: 20px 0;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.error-box {
  padding: 10px 12px;
  background: #4b1e1e;
  color: #fca5a5;
  border-radius: 6px;
  font-size: 13px;
  white-space: pre-wrap;
}

.result-section { margin-top: 16px; }
.section-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.result-box {
  padding: 12px;
  background: #374151;
  color: #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  max-height: calc(100vh - 240px);
  overflow-y: auto;
}
.copy-btn {
  margin-top: 10px;
  width: 100%;
  padding: 9px;
  background: #2d2d2d;
  color: #e5e7eb;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.copy-btn:hover { background: #3a3a3a; }

.resize-handle {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: ew-resize;
  background: transparent;
  transition: background 0.15s;
}
.resize-handle:hover { background: rgba(79, 70, 229, 0.5); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
