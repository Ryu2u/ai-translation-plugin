<template>
  <div class="inline-translation">
    <div class="translation-header">
      <span>翻译结果</span>
      <button class="close-btn" @click="handleClose">×</button>
    </div>
    <div class="translation-content">
      <div class="original-text">{{ originalText }}</div>
      <div class="divider"></div>
      <div class="translated-text">{{ translatedText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  originalText: string
  translatedText: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function handleClose() {
  emit('close')
}
</script>

<style scoped>
.inline-translation {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 600px;
  background: #2d2d2d;
  color: #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 2147483647;
  animation: slideUp 0.2s ease-out;
}

.translation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #3d3d3d;
  font-weight: bold;
}

.close-btn {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: #e5e7eb;
}

.translation-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.original-text {
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
}

.divider {
  height: 1px;
  background: #3d3d3d;
  margin: 12px 0;
}

.translated-text {
  color: #e5e7eb;
  font-size: 15px;
  line-height: 1.6;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
