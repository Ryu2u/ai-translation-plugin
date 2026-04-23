<template>
  <button
    class="floating-btn"
    :style="btnStyle"
    @mousedown="startDrag"
    @click="handleClick"
    title="打开翻译输入框（可拖动）"
  >
    译
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits<{
  (e: 'translate'): void
}>()

const DEFAULT_BOTTOM = 30
const DEFAULT_RIGHT = 30

const bottom = ref(DEFAULT_BOTTOM)
const right = ref(DEFAULT_RIGHT)
const isDragging = ref(false)
const wasDragged = ref(false)

let dragStartX = 0, dragStartY = 0, origBottom = DEFAULT_BOTTOM, origRight = DEFAULT_RIGHT

const btnStyle = computed(() => ({
  bottom: bottom.value + 'px',
  right: right.value + 'px'
}))

function startDrag(e: MouseEvent) {
  isDragging.value = true
  wasDragged.value = false
  dragStartX = e.clientX
  dragStartY = e.clientY
  origBottom = bottom.value
  origRight = right.value
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
  e.stopPropagation()
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  const dx = dragStartX - e.clientX
  const dy = dragStartY - e.clientY
  right.value = Math.max(0, Math.min(origRight + dx, window.innerWidth - 56))
  bottom.value = Math.max(0, Math.min(origBottom + dy, window.innerHeight - 56))
  if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
    wasDragged.value = true
  }
}

function stopDrag() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  setTimeout(() => { wasDragged.value = false }, 0)
}

function handleClick() {
  if (wasDragged.value) return
  console.log('[AI-Translate content] FloatingButton clicked')
  emit('translate')
}

</script>

<style scoped>
.floating-btn {
  position: fixed;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2d2d2d;
  color: white;
  border: none;
  cursor: grab;
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
  cursor: grabbing;
  transform: scale(0.95);
}
</style>
