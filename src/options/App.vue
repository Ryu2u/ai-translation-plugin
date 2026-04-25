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
        <div class="form-group" style="margin-top: 16px;">
          <label class="toggle-label">
            <input type="checkbox" v-model="autoTranslate" @change="saveAutoTranslate" class="toggle-input" />
            <span class="toggle-text">自动翻译</span>
          </label>
          <p class="form-hint">开启后，根据输入语言自动识别翻译方向（需配置语言对）</p>
        </div>
        <div class="form-group" v-if="autoTranslate" style="margin-top: 16px;">
          <label>自动翻译语言对</label>
          <div class="lang-pair">
            <select v-model="pairLang1" @change="saveAutoTranslatePair">
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
            <span class="pair-arrow">↔</span>
            <select v-model="pairLang2" @change="saveAutoTranslatePair">
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
          <p class="form-hint">输入语言为左侧时翻译为右侧，反之亦然</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ApiKeyManager from './components/ApiKeyManager.vue'
import { getTargetLang, setTargetLang, getAutoTranslate, setAutoTranslate, getAutoTranslatePair, setAutoTranslatePair } from '../background/storage'

const targetLang = ref('zh')
const autoTranslate = ref(false)
const pairLang1 = ref('zh')
const pairLang2 = ref('en')

onMounted(async () => {
  targetLang.value = await getTargetLang()
  autoTranslate.value = await getAutoTranslate()
  const pair = await getAutoTranslatePair()
  pairLang1.value = pair[0]
  pairLang2.value = pair[1]
})

async function saveTargetLang() {
  await setTargetLang(targetLang.value)
}

async function saveAutoTranslate() {
  await setAutoTranslate(autoTranslate.value)
}

async function saveAutoTranslatePair() {
  await setAutoTranslatePair([pairLang1.value, pairLang2.value])
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

.form-hint {
  margin: 6px 0 0 0;
  font-size: 12px;
  color: #6b7280;
}

.lang-pair {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lang-pair select {
  flex: 1;
  padding: 10px 12px;
  background: #2d2d2d;
  color: #e5e7eb;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.lang-pair select:focus {
  outline: none;
  border-color: #4f46e5;
}

.pair-arrow {
  font-size: 18px;
  color: #6b7280;
}
</style>
