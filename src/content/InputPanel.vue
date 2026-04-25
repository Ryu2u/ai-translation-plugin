<template>
  <Teleport to="body">
    <div class="input-overlay">
      <div
        class="input-panel"
        :style="panelStyle"
        ref="panelRef"
      >
        <div class="panel-header" @mousedown="startDrag">
          <span>AI 翻译</span>
          <button class="close-btn" @click="handleClose">×</button>
        </div>
        <div class="panel-body">
          <div class="auto-row">
            <label class="toggle-label">
              <input type="checkbox" v-model="autoTranslate" class="toggle-input" />
              <span class="toggle-text">自动翻译</span>
            </label>
            <span class="auto-hint" v-if="autoTranslate">根据输入语言自动识别翻译方向</span>
          </div>
          <div class="lang-row" v-if="!autoTranslate">
            <label>目标语言：</label>
            <select v-model="targetLang" :disabled="loading" class="lang-select">
              <option v-for="opt in langOptions" :key="opt.code" :value="opt.code">{{ opt.label }}</option>
            </select>
          </div>
          <textarea
            v-model="inputText"
            class="input-area"
            placeholder="请输入要翻译的内容..."
            :disabled="loading"
            rows="6"
          />
          <button
            class="translate-btn"
            :disabled="loading || !inputText.trim()"
            @click="handleTranslate"
          >
            <span v-if="loading" class="spinner" />
            {{ loading ? '翻译中...' : '翻译' }}
          </button>
          <div v-if="error" class="error-box">{{ error }}</div>
          <div v-if="result" class="result-section">
            <div class="section-label">译文</div>
            <div class="result-box">{{ result }}</div>
            <button class="copy-btn" @click="copyResult">{{ copied ? '已复制' : '复制译文' }}</button>
          </div>
        </div>
        <div class="resize-handle" @mousedown.stop="startResize" title="拖拽调整大小"></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', text: string): void
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

const inputText = ref('')
const targetLang = ref('zh')
const autoTranslate = ref(false)
const loading = ref(false)
const result = ref('')
const error = ref('')
const copied = ref(false)

// 窗口尺寸 & 位置
const width = ref(520)
const height = ref(480)
const top = ref<number | null>(null)
const left = ref<number | null>(null)

const panelStyle = computed(() => {
  const s: Record<string, string> = {
    width: width.value + 'px',
    height: height.value + 'px'
  }
  if (top.value !== null) s.top = top.value + 'px'
  if (left.value !== null) s.left = left.value + 'px'
  return s
})

const panelRef = ref<HTMLElement | null>(null)

// 拖拽
let dragStartX = 0, dragStartY = 0, dragOrigLeft = 0, dragOrigTop = 0
function startDrag(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.close-btn')) return
  const rect = panelRef.value?.getBoundingClientRect()
  if (!rect) return
  top.value = rect.top
  left.value = rect.left
  dragStartX = e.clientX
  dragStartY = e.clientY
  dragOrigLeft = rect.left
  dragOrigTop = rect.top
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
}
function onDrag(e: MouseEvent) {
  left.value = dragOrigLeft + (e.clientX - dragStartX)
  top.value = dragOrigTop + (e.clientY - dragStartY)
}
function stopDrag() {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 调整大小
let resizeStartX = 0, resizeStartY = 0, resizeOrigW = 0, resizeOrigH = 0
function startResize(e: MouseEvent) {
  resizeStartX = e.clientX
  resizeStartY = e.clientY
  resizeOrigW = width.value
  resizeOrigH = height.value
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
}
function onResize(e: MouseEvent) {
  width.value = Math.max(320, resizeOrigW + (e.clientX - resizeStartX))
  height.value = Math.max(280, resizeOrigH + (e.clientY - resizeStartY))
}
function stopResize() {
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

function handleClose() {
  if (loading.value) return
  emit('close')
}

async function handleTranslate() {
  const text = inputText.value.trim()
  if (!text || loading.value) return
  loading.value = true
  error.value = ''
  result.value = ''
  try {
    console.log('[AI-Translate content] InputPanel sending TRANSLATE, length:', text.length, 'targetLang:', targetLang.value, 'autoTranslate:', autoTranslate.value)
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE',
      payload: { text, targetLang: targetLang.value, autoTranslate: autoTranslate.value }
    }) as { translatedText?: string; error?: string }
    console.log('[AI-Translate content] InputPanel response:', response)
    if (!response) {
      error.value = '无响应，请检查 Service Worker 是否存活'
    } else if (response.error) {
      error.value = response.error
    } else {
      result.value = response.translatedText || ''
    }
  } catch (err: any) {
    console.error('[AI-Translate content] InputPanel sendMessage error:', err)
    error.value = err?.message || String(err)
  } finally {
    loading.value = false
  }
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
  chrome.storage?.local?.get(['target_lang', 'auto_translate'], (r) => {
    if (typeof r?.target_lang === 'string') targetLang.value = r.target_lang
    if (r?.auto_translate === true) autoTranslate.value = true
  })
})

onUnmounted(() => {
  stopDrag()
  stopResize()
})
</script>

<style scoped>
.input-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2147483646;
  animation: fadeIn 0.15s ease-out;
}

.input-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-width: 320px;
  min-height: 280px;
  max-width: 96vw;
  max-height: 94vh;
  background: #1f1f1f;
  color: #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: popIn 0.18s ease-out;
}
.input-panel[style*="top"] { transform: none; }

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #2d2d2d;
  font-weight: bold;
  font-size: 15px;
  cursor: move;
  user-select: none;
  flex-shrink: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 22px;
  cursor: pointer;
  line-height: 1;
}
.close-btn:hover { color: #e5e7eb; }

.panel-body {
  padding: 14px 16px 16px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.lang-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 13px;
  color: #9ca3af;
}

.auto-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #2d2d2d;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.toggle-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #4f46e5;
}

.toggle-text {
  font-size: 14px;
  color: #e5e7eb;
  user-select: none;
}

.auto-hint {
  font-size: 12px;
  color: #6b7280;
}
.lang-select {
  flex: 1;
  padding: 6px 10px;
  background: #2d2d2d;
  color: #e5e7eb;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  cursor: pointer;
}
.lang-select:focus { border-color: #4f46e5; }

.input-area {
  width: 100%;
  padding: 10px 12px;
  background: #2d2d2d;
  color: #e5e7eb;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
  outline: none;
}
.input-area:focus { border-color: #4f46e5; }
.input-area:disabled { opacity: 0.6; cursor: not-allowed; }

.translate-btn {
  margin-top: 12px;
  width: 100%;
  padding: 11px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.2s;
}
.translate-btn:hover:not(:disabled) { background: #4338ca; }
.translate-btn:disabled { background: #3a3a3a; cursor: not-allowed; color: #9ca3af; }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.error-box {
  margin-top: 12px;
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
  max-height: 260px;
  overflow-y: auto;
  white-space: pre-wrap;
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
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, #6b7280 50%, #6b7280 60%, transparent 60%, transparent 70%, #6b7280 70%, #6b7280 80%, transparent 80%);
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes popIn {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
