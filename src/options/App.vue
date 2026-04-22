<template>
  <div class="options">
    <header class="header">
      <h1>AI 翻译插件设置</h1>
    </header>
    <main class="main">
      <section class="section">
        <h2>API Key 管理</h2>
        <ApiKeyManager />
      </section>
      <section class="section">
        <h2>翻译设置</h2>
        <div class="form-group">
          <label>目标语言</label>
          <select v-model="targetLang" @change="saveTargetLang">
            <option value="zh">中文</option>
            <option value="en">英语</option>
            <option value="ja">日语</option>
            <option value="ko">韩语</option>
            <option value="fr">法语</option>
            <option value="de">德语</option>
            <option value="es">西班牙语</option>
            <option value="ru">俄语</option>
            <option value="ar">阿拉伯语</option>
            <option value="pt">葡萄牙语</option>
          </select>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ApiKeyManager from './components/ApiKeyManager.vue'
import { getTargetLang, setTargetLang } from '../background/storage'

const targetLang = ref('zh')

onMounted(async () => {
  targetLang.value = await getTargetLang()
})

async function saveTargetLang() {
  await setTargetLang(targetLang.value)
}
</script>

<style scoped>
.options {
  min-height: 100vh;
  background: #0f0f0f;
  color: #e5e7eb;
}

.header {
  padding: 24px;
  background: #1a1a1a;
  border-bottom: 1px solid #2d2d2d;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: bold;
}

.main {
  padding: 24px;
  max-width: 800px;
}

.section {
  background: #1a1a1a;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.section h2 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: bold;
  color: #e5e7eb;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  color: #9ca3af;
}

.form-group select {
  padding: 10px 12px;
  background: #2d2d2d;
  color: #e5e7eb;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.form-group select:focus {
  outline: none;
  border-color: #4f46e5;
}
</style>
