<template>
  <div
    v-if="visible"
    class="inline-translation"
    :style="containerStyle"
    @mousedown.stop
  >
    <div class="translation-header">
      <span>翻译结果</span>
      <button class="close-btn" @click="handleClose">x</button>
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
}>()

const visible = ref(true)

const containerStyle = computed(() => {
  if (props.x !== undefined && props.y !== undefined) {
    return {
      position: 'absolute' as const,
      left: props.x + 'px',
      top: props.y + 'px',
      minWidth: props.width ? Math.max(props.width, 260) + 'px' : '260px',
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
  max-width: 520px;
  width: 100%;
  margin-top: 12px;
  margin-bottom: 12px;
}

.translation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #2d2d2d;
  font-weight: bold;
  font-size: 14px;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 18px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}

.close-btn:hover {
  color: #e5e7eb;
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
