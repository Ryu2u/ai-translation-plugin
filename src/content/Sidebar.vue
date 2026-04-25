<template>
  <div class="sidebar-overlay" @click.self="handleClose">
    <div class="sidebar">
      <div class="sidebar-header">
        <span>翻译结果</span>
        <label class="auto-toggle">
          <input type="checkbox" v-model="autoTranslate" @change="onAutoTranslateChange" class="toggle-input" />
          <span class="toggle-text">自动翻译</span>
        </label>
        <select v-model="currentLang" v-if="!autoTranslate" :disabled="loading" class="lang-select">
          <option v-for="opt in langOptions" :key="opt.code" :value="opt.code">{{ opt.label }}</option>
        </select>
<!--        <button class="close-btn" @click="handleClose">×</button>-->
      </div>
      <div class="sidebar-content">
        <div class="section">
          <div class="section-label">原文</div>
          <div class="text-box original">{{ originalText }}</div>
        </div>
        <div v-if="loading" class="loading-box">
          <span class="spinner" />
          <span>翻译中...</span>
        </div>
        <div v-else-if="error" class="error-box">{{ error }}</div>
        <template v-else>
          <div class="section">
            <div class="section-label">译文</div>
            <div class="text-box translated">{{ translatedText }}</div>
          </div>
          <button class="copy-btn" @click="copyText">{{ copied ? '已复制' : '复制译文' }}</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'

const props = defineProps<{
  originalText: string
  translatedText: string
  targetLang?: string
  loading?: boolean
  error?: string
  autoTranslate?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:targetLang', lang: string): void
  (e: 'update:autoTranslate', value: boolean): void
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

const currentLang = ref(props.targetLang || 'zh')
const autoTranslate = ref(props.autoTranslate || false)

watch(currentLang, (newLang) => {
  emit('update:targetLang', newLang)
})

function onAutoTranslateChange() {
  emit('update:autoTranslate', autoTranslate.value)
  chrome.storage?.local?.set({ auto_translate: autoTranslate.value })
}


const copied = ref(false)

function handleClose() {
  emit('close')
}

async function copyText() {
  try {
    await navigator.clipboard.writeText(props.translatedText)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}
</script>

<style scoped>
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2147483646;
  animation: fadeIn 0.15s ease-out;
}

.sidebar {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 400px;
  max-width: 90%;
  background: #1f1f1f;
  color: #e5e7eb;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.2s ease-out;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #2d2d2d;
  font-weight: bold;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #e5e7eb;
}

.lang-select {
  background: #2d2d2d;
  color: #e5e7eb;
  border: 1px solid #3d3d3d;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 13px;
  cursor: pointer;
  margin-left: auto;
  margin-right: 12px;
}

.lang-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auto-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  margin-right: 8px;
}

.toggle-input {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #4f46e5;
}

.toggle-text {
  font-size: 12px;
  color: #9ca3af;
  user-select: none;
}

.sidebar-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.text-box {
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
}

.original {
  background: #2d2d2d;
  color: #9ca3af;
}

.translated {
  background: #374151;
  color: #e5e7eb;
}

.copy-btn {
  width: 100%;
  padding: 12px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background 0.2s;
}

.copy-btn:hover {
  background: #4338ca;
}

.loading-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: #2d2d2d;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 14px;
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.error-box {
  padding: 12px;
  background: #4b1e1e;
  color: #fca5a5;
  border-radius: 6px;
  font-size: 13px;
  white-space: pre-wrap;
}
@keyframes spin { to { transform: rotate(360deg); } }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
