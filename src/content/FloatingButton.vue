<template>
  <button
    class="floating-btn"
    @click="handleClick"
    title="打开翻译输入框"
  >
    译
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'translate'): void
}>()

function handleClick() {
  console.log('[AI-Translate content] FloatingButton clicked')
  emit('translate')
}
</script>

<style scoped>
.floating-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2d2d2d;
  color: white;
  border: none;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 2147483647;
}

.floating-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
}

.floating-btn:active {
  transform: scale(0.95);
}
</style>
