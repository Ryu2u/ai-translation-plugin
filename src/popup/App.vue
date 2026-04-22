<template>
  <div class="popup">
    <div class="header">
      <h1>AI 翻译</h1>
    </div>
    <div class="content">
      <div class="status" :class="{ active: hasApiKey }">
        <span class="status-dot"></span>
        <span>{{ hasApiKey ? '已配置 API Key' : '未配置 API Key' }}</span>
      </div>
      <button class="btn" @click="openOptions">
        {{ hasApiKey ? '设置' : '立即配置' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const hasApiKey = ref(false)

onMounted(async () => {
  const config = await chrome.runtime.sendMessage({ type: 'GET_CONFIG', payload: null })
  hasApiKey.value = !!config
})

function openOptions() {
  chrome.runtime.openOptionsPage()
}
</script>

<style scoped>
.popup {
  width: 280px;
  background: #1f1f1f;
  color: #e5e7eb;
}

.header {
  padding: 16px;
  border-bottom: 1px solid #2d2d2d;
}

.header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.content {
  padding: 16px;
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #2d2d2d;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 14px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
}

.status.active .status-dot {
  background: #22c55e;
}

.btn {
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

.btn:hover {
  background: #4338ca;
}
</style>
