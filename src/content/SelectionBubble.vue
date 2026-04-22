<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="selection-bubble"
      :style="{ left: x + 'px', top: y + 'px' }"
      @click="handleClick"
    >
      译
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  (e: 'translate', text: string): void
}>()

const visible = ref(false)
const x = ref(0)
const y = ref(0)

let selectionText = ''

function handleSelectionChange() {
  const selection = window.getSelection()
  const text = selection?.toString().trim()

  if (text && text.length > 0) {
    selectionText = text
    const range = selection?.getRangeAt(0)
    if (range) {
      const rect = range.getBoundingClientRect()
      x.value = rect.left + rect.width / 2
      y.value = rect.top - 10
      visible.value = true
    }
  } else {
    visible.value = false
  }
}

function handleClick() {
  if (selectionText) {
    emit('translate', selectionText)
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
