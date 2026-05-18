<template>
  <div
    v-if="visible"
    class="inline-translation"
    :style="containerStyle"
    @mousedown.stop
  >
    <div class="translation-header">
      <div class="header-left">
        <span class="header-title">翻译结果</span>
        <span v-if="!autoTranslate" class="mode-badge manual">手动</span>
        <span v-else class="mode-badge auto">自动</span>
        <select
          class="lang-select"
          :value="targetLang"
          @change="$emit('update:targetLang', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="opt in langOptions" :key="opt.code" :value="opt.code">{{ opt.label }}</option>
        </select>
      </div>
      <button class="close-btn" type="button" @click="handleClose" aria-label="关闭">×</button>
    </div>
    <div class="translation-content">
      <div v-if="loading" class="loading-box">
        <span class="spinner" />
        <span>翻译中...</span>
      </div>
      <div v-else-if="error" class="error-box">{{ error }}</div>
      <div v-else class="text-box translated">{{ translatedText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  originalText: string
  translatedText: string
  x?: number
  y?: number
  width?: number
  targetLang?: string
  loading?: boolean
  error?: string
  autoTranslate?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:targetLang', lang: string): void
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

const visible = ref(true)

const containerStyle = computed(() => {
  if (props.x !== undefined && props.y !== undefined) {
    return {
      position: 'absolute' as const,
      left: props.x + 'px',
      top: props.y + 'px',
      width: props.width ? props.width + 'px' : '260px',
    }
  }
  return {}
})

function handleClose() {
  visible.value = false
  emit('close')
}
</script>

<style scoped>
.inline-translation {
  background: #1f1f1f;
  color: #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 2147483646;
  animation: fadeIn 0.15s ease-out;
  width: 100%;
  margin-top: 12px;
  margin-bottom: 12px;
}

.translation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px 8px 16px;
  border-bottom: 1px solid #2d2d2d;
  font-weight: bold;
  font-size: 14px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  color: #e5e7eb;
}

.mode-badge {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 3px;
  font-weight: normal;
}
.mode-badge.manual {
  background: #3b3b1c;
  color: #d4d44c;
}
.mode-badge.auto {
  background: #1c3b3b;
  color: #4cd4d4;
}

.lang-select {
  padding: 3px 6px;
  background: #2d2d2d;
  color: #e5e7eb;
  border: 1px solid #3a3a3a;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  cursor: pointer;
}
.lang-select:focus {
  border-color: #4f46e5;
}

.lang-label {
  font-size: 12px;
  color: #9ca3af;
  font-weight: normal;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  min-width: 28px;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  color: #e5e7eb;
  background: rgba(255, 255, 255, 0.08);
}

.translation-content {
  padding: 14px 16px;
  max-height: 360px;
  overflow-y: auto;
}

.text-box {
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

.loading-box {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #9ca3af;
  font-size: 14px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}

.error-box {
  padding: 12px;
  background: #4b1e1e;
  color: #fca5a5;
  border-radius: 6px;
  font-size: 13px;
  white-space: pre-wrap;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
