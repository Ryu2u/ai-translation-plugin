# AI 翻译插件 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个完整的 Chrome 浏览器扩展插件，实现选中翻译、悬浮按钮翻译、右键菜单翻译功能

**Architecture:** 使用 Vite + Vue 3 + TypeScript 构建 Chrome 扩展。Content Scripts 处理用户交互（悬浮按钮、气泡），Background Script 处理 API 调用和消息转发，Options Page 管理 API Key 配置。

**Tech Stack:** Vite, Vue 3, TypeScript, Chrome Extensions Manifest V3, OpenAI 兼容 API

---

## 文件结构

```
ai-translation-plugin/
├── manifest.ts                    # Chrome 扩展 manifest 配置
├── src/
│   ├── content/                   # Content Scripts
│   │   ├── main.ts               # 内容脚本入口
│   │   ├── FloatingButton.vue    # 右下角悬浮按钮
│   │   ├── SelectionBubble.vue   # 选中文字气泡
│   │   ├── InlineTranslation.vue  # 原文下方插入翻译
│   │   ├── Sidebar.vue           # 侧边栏翻译面板
│   │   └── styles/
│   ├── background/               # Background Service Worker
│   │   ├── main.ts              # 后台脚本入口
│   │   ├── api.ts               # OpenAI API 调用
│   │   └── storage.ts           # Chrome Storage 封装
│   ├── popup/                    # Popup UI
│   │   ├── main.ts
│   │   └── App.vue
│   ├── options/                   # Options Page
│   │   ├── main.ts
│   │   ├── App.vue
│   │   └── components/
│   │       └── ApiKeyManager.vue  # API Key 管理组件
│   ├── components/                # 共享组件
│   │   └── TranslateButton.vue
│   ├── styles/
│   │   └── global.css
│   └── types/
│       └── index.ts              # 共享类型定义
├── public/
│   └── icons/                     # 扩展图标
├── vite.config.ts
└── package.json
```

---

## 任务 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/vite-env.d.ts`
- Create: `index.html` (Options Page 入口)

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "ai-translation-plugin",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-chrome-extension": "^0.0.7",
    "vue-tsc": "^1.8.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import chromeExtension from 'vite-plugin-chrome-extension'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    chromeExtension()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html'),
        content: resolve(__dirname, 'src/content/main.ts')
      }
    }
  }
})
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: 创建 index.html (Options Page)**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>AI 翻译插件设置</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/options/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建 popup.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <title>AI 翻译</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/popup/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

- [ ] **Step 8: 安装依赖**

Run: `npm install`

Expected: 安装完成，无报错

---

## 任务 2: Manifest 配置

**Files:**
- Create: `src/manifest.ts`
- Create: `public/manifest.json`

- [ ] **Step 1: 创建 src/manifest.ts**

```typescript
import { defineManifest } from 'vite-plugin-chrome-extension'

export default defineManifest({
  manifest_version: 3,
  name: 'AI 翻译插件',
  version: '1.0.0',
  description: '使用 AI 大模型进行网页翻译',
  permissions: [
    'storage',
    'activeTab',
    'contextMenus'
  ],
  host_permissions: [
    '<all_urls>'
  ],
  action: {
    default_popup: 'popup.html',
    default_icon: {
      '16': 'icons/icon16.png',
      '48': 'icons/icon48.png',
      '128': 'icons/icon128.png'
    }
  },
  options_page: 'options.html',
  icons: {
    '16': 'icons/icon16.png',
    '48': 'icons/icon48.png',
    '128': 'icons/icon128.png'
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['content/main.ts'],
      run_at: 'document_end'
    }
  ],
  background: {
    service_worker: 'background/main.ts',
    type: 'module'
  }
})
```

---

## 任务 3: 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
// API 配置
export interface ApiConfig {
  id: string
  name: string
  apiKey: string
  baseUrl: string
  model: string
  isActive: boolean
}

// 翻译请求
export interface TranslateRequest {
  text: string
  sourceLang?: string
  targetLang: string
}

// 翻译响应
export interface TranslateResponse {
  translatedText: string
  confidence?: number
}

// 消息类型
export type MessageType =
  | { type: 'TRANSLATE'; payload: TranslateRequest }
  | { type: 'TRANSLATE_RESULT'; payload: TranslateResponse }
  | { type: 'GET_CONFIG'; payload: null }
  | { type: 'CONFIG_RESULT'; payload: ApiConfig | null }
  | { type: 'OPEN_SIDEBAR'; payload: null }

// 存储 Keys
export const STORAGE_KEYS = {
  API_CONFIGS: 'api_configs',
  ACTIVE_API_ID: 'active_api_id',
  TARGET_LANG: 'target_lang',
  UI_STYLE: 'ui_style'
} as const
```

---

## 任务 4: Background Script - Storage 封装

**Files:**
- Create: `src/background/storage.ts`

- [ ] **Step 1: 创建 storage.ts**

```typescript
import type { ApiConfig } from '../types'
import { STORAGE_KEYS } from '../types'

export async function getApiConfigs(): Promise<ApiConfig[]> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_CONFIGS)
  return result[STORAGE_KEYS.API_CONFIGS] || []
}

export async function saveApiConfigs(configs: ApiConfig[]): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.API_CONFIGS]: configs })
}

export async function getActiveApiConfig(): Promise<ApiConfig | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.ACTIVE_API_ID)
  const activeId = result[STORAGE_KEYS.ACTIVE_API_ID]
  if (!activeId) return null

  const configs = await getApiConfigs()
  return configs.find(c => c.id === activeId) || null
}

export async function setActiveApiId(id: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_API_ID]: id })
}

export async function getTargetLang(): Promise<string> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.TARGET_LANG)
  return result[STORAGE_KEYS.TARGET_LANG] || 'zh'
}

export async function setTargetLang(lang: string): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.TARGET_LANG]: lang })
}
```

---

## 任务 5: Background Script - OpenAI API 调用

**Files:**
- Create: `src/background/api.ts`

- [ ] **Step 1: 创建 api.ts**

```typescript
import type { TranslateRequest, TranslateResponse, ApiConfig } from '../types'
import { getActiveApiConfig, getTargetLang } from './storage'

export async function translateText(
  text: string,
  sourceLang?: string
): Promise<TranslateResponse> {
  const config = await getActiveApiConfig()
  if (!config) {
    throw new Error('请先在设置页面配置 API Key')
  }

  const targetLang = await getTargetLang()

  const systemPrompt = `You are a professional translator. Translate the following text to ${targetLang === 'zh' ? 'Chinese' : targetLang}. Only respond with the translation, nothing else.`

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.3
    })
  })

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`)
  }

  const data = await response.json()
  const translatedText = data.choices?.[0]?.message?.content?.trim()

  if (!translatedText) {
    throw new Error('翻译结果为空')
  }

  return { translatedText }
}
```

---

## 任务 6: Background Script - 主入口 & 消息处理

**Files:**
- Create: `src/background/main.ts`

- [ ] **Step 1: 创建 background/main.ts**

```typescript
import type { MessageType } from '../types'
import { translateText } from './api'
import { getActiveApiConfig, getTargetLang, setTargetLang } from './storage'

// 消息处理
chrome.runtime.onMessage.addListener(
  (message: MessageType, _sender, sendResponse) => {
    handleMessage(message)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }))
    return true // 异步响应
  }
)

async function handleMessage(message: MessageType): Promise<any> {
  switch (message.type) {
    case 'TRANSLATE':
      return await translateText(message.payload.text, message.payload.sourceLang)

    case 'GET_CONFIG':
      return await getActiveApiConfig()

    case 'SET_TARGET_LANG':
      await setTargetLang(message.payload)
      return { success: true }

    default:
      throw new Error(`Unknown message type`)
  }
}

// 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'translate-page',
    title: '翻译整个页面',
    contexts: ['page']
  })

  chrome.contextMenus.create({
    id: 'translate-selection',
    title: '翻译选中内容',
    contexts: ['selection']
  })
})

// 右键菜单点击处理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return

  if (info.menuItemId === 'translate-page') {
    // 翻译整个页面
    chrome.tabs.sendMessage(tab.id, { type: 'TRANSLATE_PAGE' })
  } else if (info.menuItemId === 'translate-selection' && info.selectionText) {
    // 翻译选中内容
    chrome.tabs.sendMessage(tab.id, {
      type: 'TRANSLATE_SELECTION',
      text: info.selectionText
    })
  }
})
```

---

## 任务 7: Content Script - 主入口

**Files:**
- Create: `src/content/main.ts`

- [ ] **Step 1: 创建 content/main.ts**

```typescript
import { createApp } from 'vue'
import FloatingButton from './FloatingButton.vue'
import SelectionBubble from './SelectionBubble.vue'
import InlineTranslation from './InlineTranslation.vue'
import Sidebar from './Sidebar.vue'
import './styles/content.css'

// 全局状态管理
let floatingButton: ReturnType<typeof createApp> | null = null
let selectionBubble: ReturnType<typeof createApp> | null = null
let sidebarInstance: ReturnType<typeof createApp> | null = null
let inlineInstance: ReturnType<typeof createApp> | null = null

// 挂载悬浮按钮
function mountFloatingButton() {
  const container = document.createElement('div')
  container.id = 'ai-translation-floating'
  document.body.appendChild(container)
  floatingButton = createApp(FloatingButton, {
    onTranslate: (text: string) => handleTranslate(text, 'page')
  })
  floatingButton.mount(container)
}

// 挂载选中气泡
function mountSelectionBubble() {
  const container = document.createElement('div')
  container.id = 'ai-translation-selection-bubble'
  document.body.appendChild(container)
  selectionBubble = createApp(SelectionBubble, {
    onTranslate: (text: string) => handleTranslate(text, 'selection')
  })
  selectionBubble.mount(container)
}

// 处理翻译
async function handleTranslate(text: string, mode: 'page' | 'selection') {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'TRANSLATE',
      payload: { text, targetLang: 'zh' }
    }) as { translatedText?: string; error?: string }

    if (response.error) {
      console.error('翻译错误:', response.error)
      return
    }

    if (mode === 'selection') {
      // 选中模式：显示侧边栏
      showSidebar(text, response.translatedText!)
    } else {
      // 整页模式：直接插入翻译
      inlineInstance = createApp(InlineTranslation, {
        originalText: text,
        translatedText: response.translatedText!
      })
      const container = document.createElement('div')
      container.id = 'ai-translation-inline'
      document.body.appendChild(container)
      inlineInstance.mount(container)
    }
  } catch (err) {
    console.error('翻译失败:', err)
  }
}

// 显示侧边栏
function showSidebar(original: string, translated: string) {
  if (sidebarInstance) return

  const container = document.createElement('div')
  container.id = 'ai-translation-sidebar'
  document.body.appendChild(container)
  sidebarInstance = createApp(Sidebar, {
    originalText: original,
    translatedText: translated,
    onClose: () => {
      sidebarInstance?.unmount()
      sidebarInstance = null
      container.remove()
    }
  })
  sidebarInstance.mount(container)
}

// 监听来自 background 的消息
chrome.runtime.onMessage.addListener((message: any) => {
  if (message.type === 'TRANSLATE_PAGE') {
    // 获取页面全部文本
    const text = document.body.innerText
    handleTranslate(text, 'page')
  } else if (message.type === 'TRANSLATE_SELECTION') {
    handleTranslate(message.text, 'selection')
  }
})

// 初始化
mountFloatingButton()
mountSelectionBubble()
```

---

## 任务 8: Content Script - 悬浮按钮组件

**Files:**
- Create: `src/content/FloatingButton.vue`

- [ ] **Step 1: 创建 FloatingButton.vue**

```vue
<template>
  <button
    class="floating-btn"
    @click="handleClick"
    title="翻译页面"
  >
    译
  </button>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  (e: 'translate', text: string): void
}>()

function handleClick() {
  const text = document.body.innerText
  emit('translate', text)
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
```

---

## 任务 9: Content Script - 选中气泡组件

**Files:**
- Create: `src/content/SelectionBubble.vue`

- [ ] **Step 1: 创建 SelectionBubble.vue**

```vue
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
```

---

## 任务 10: Content Script - 原文下方插入翻译组件

**Files:**
- Create: `src/content/InlineTranslation.vue`

- [ ] **Step 1: 创建 InlineTranslation.vue**

```vue
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
  const el = document.getElementById('ai-translation-inline')
  el?.remove()
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
```

---

## 任务 11: Content Script - 侧边栏翻译面板组件

**Files:**
- Create: `src/content/Sidebar.vue`

- [ ] **Step 1: 创建 Sidebar.vue**

```vue
<template>
  <div class="sidebar-overlay" @click.self="handleClose">
    <div class="sidebar">
      <div class="sidebar-header">
        <span>翻译结果</span>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <div class="sidebar-content">
        <div class="section">
          <div class="section-label">原文</div>
          <div class="text-box original">{{ originalText }}</div>
        </div>
        <div class="section">
          <div class="section-label">译文</div>
          <div class="text-box translated">{{ translatedText }}</div>
        </div>
        <button class="copy-btn" @click="copyText">复制译文</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  originalText: string
  translatedText: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

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
  position: fixed;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
```

---

## 任务 12: Content Script - 样式文件

**Files:**
- Create: `src/content/styles/content.css`

- [ ] **Step 1: 创建 content.css**

```css
/* 全局样式重置 */
#ai-translation-floating,
#ai-translation-selection-bubble,
#ai-translation-sidebar,
#ai-translation-inline {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 确保按钮可点击 */
#ai-translation-floating *,
#ai-translation-selection-bubble * {
  pointer-events: auto;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
```

---

## 任务 13: Popup UI

**Files:**
- Create: `src/popup/main.ts`
- Create: `src/popup/App.vue`

- [ ] **Step 1: 创建 popup/main.ts**

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import '../styles/global.css'

createApp(App).mount('#app')
```

- [ ] **Step 2: 创建 popup/App.vue**

```vue
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
```

---

## 任务 14: Options Page - 主应用

**Files:**
- Create: `src/options/main.ts`
- Create: `src/options/App.vue`

- [ ] **Step 1: 创建 options/main.ts**

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import '../styles/global.css'

createApp(App).mount('#app')
```

- [ ] **Step 2: 创建 options/App.vue**

```vue
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
```

---

## 任务 15: Options Page - API Key 管理组件

**Files:**
- Create: `src/options/components/ApiKeyManager.vue`

- [ ] **Step 1: 创建 ApiKeyManager.vue**

```vue
<template>
  <div class="api-manager">
    <div class="api-list">
      <div
        v-for="api in apiConfigs"
        :key="api.id"
        class="api-item"
        :class="{ active: api.isActive }"
        @click="activateApi(api.id)"
      >
        <div class="api-info">
          <div class="api-name">{{ api.name }}</div>
          <div class="api-model">{{ api.model }}</div>
        </div>
        <div class="api-actions">
          <button class="edit-btn" @click.stop="editApi(api)">编辑</button>
          <button class="delete-btn" @click.stop="deleteApi(api.id)">删除</button>
        </div>
        <div v-if="api.isActive" class="active-badge">使用中</div>
      </div>
    </div>

    <button v-if="!showForm" class="add-btn" @click="showForm = true">
      + 添加 API Key
    </button>

    <div v-if="showForm" class="api-form">
      <div class="form-row">
        <label>名称</label>
        <input v-model="formData.name" type="text" placeholder="例如: OpenAI" />
      </div>
      <div class="form-row">
        <label>API Key</label>
        <input v-model="formData.apiKey" type="password" placeholder="sk-..." />
      </div>
      <div class="form-row">
        <label>Base URL</label>
        <input v-model="formData.baseUrl" type="text" placeholder="https://api.openai.com/v1" />
      </div>
      <div class="form-row">
        <label>模型</label>
        <input v-model="formData.model" type="text" placeholder="gpt-3.5-turbo" />
      </div>
      <div class="form-actions">
        <button class="cancel-btn" @click="cancelForm">取消</button>
        <button class="save-btn" @click="saveApi">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ApiConfig } from '../../types'
import { getApiConfigs, saveApiConfigs, setActiveApiId } from '../../background/storage'

const apiConfigs = ref<ApiConfig[]>([])
const showForm = ref(false)
const editingId = ref<string | null>(null)

const formData = ref({
  name: '',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-3.5-turbo'
})

onMounted(async () => {
  apiConfigs.value = await getApiConfigs()
})

function resetForm() {
  formData.value = {
    name: '',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo'
  }
  editingId.value = null
  showForm.value = false
}

function cancelForm() {
  resetForm()
}

async function saveApi() {
  if (!formData.value.name || !formData.value.apiKey) {
    alert('请填写名称和 API Key')
    return
  }

  let configs = await getApiConfigs()

  if (editingId.value) {
    // 编辑模式
    configs = configs.map(c =>
      c.id === editingId.value
        ? { ...c, ...formData.value }
        : c
    )
  } else {
    // 新增模式
    const newApi: ApiConfig = {
      id: Date.now().toString(),
      ...formData.value,
      isActive: configs.length === 0 // 第一个自动激活
    }
    configs.push(newApi)
  }

  await saveApiConfigs(configs)
  apiConfigs.value = configs

  // 如果是第一个，自动激活
  if (apiConfigs.value.length === 1) {
    await setActiveApiId(apiConfigs.value[0].id)
  }

  resetForm()
}

function editApi(api: ApiConfig) {
  editingId.value = api.id
  formData.value = {
    name: api.name,
    apiKey: api.apiKey,
    baseUrl: api.baseUrl,
    model: api.model
  }
  showForm.value = true
}

async function deleteApi(id: string) {
  if (!confirm('确定要删除这个 API 配置吗？')) return

  let configs = await getApiConfigs()
  configs = configs.filter(c => c.id !== id)
  await saveApiConfigs(configs)
  apiConfigs.value = configs

  // 如果删除的是当前激活的，激活第一个
  if (configs.length > 0 && !configs.some(c => c.isActive)) {
    await setActiveApiId(configs[0].id)
    apiConfigs.value = await getApiConfigs()
  }
}

async function activateApi(id: string) {
  await setActiveApiId(id)
  apiConfigs.value = await getApiConfigs()
}
</script>

<style scoped>
.api-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.api-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.api-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #2d2d2d;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.api-item:hover {
  background: #3d3d3d;
}

.api-item.active {
  border: 2px solid #4f46e5;
}

.api-info {
  flex: 1;
}

.api-name {
  font-weight: bold;
  margin-bottom: 4px;
}

.api-model {
  font-size: 12px;
  color: #9ca3af;
}

.api-actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: opacity 0.2s;
}

.edit-btn {
  background: #4b5563;
  color: white;
}

.delete-btn {
  background: #dc2626;
  color: white;
}

.edit-btn:hover,
.delete-btn:hover {
  opacity: 0.8;
}

.active-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  background: #4f46e5;
  color: white;
  font-size: 10px;
  border-radius: 4px;
}

.add-btn {
  padding: 12px;
  background: transparent;
  color: #4f46e5;
  border: 2px dashed #4f46e5;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background 0.2s;
}

.add-btn:hover {
  background: rgba(79, 70, 229, 0.1);
}

.api-form {
  background: #2d2d2d;
  padding: 20px;
  border-radius: 8px;
}

.form-row {
  margin-bottom: 16px;
}

.form-row label {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 6px;
}

.form-row input {
  width: 100%;
  padding: 10px 12px;
  background: #1f1f1f;
  color: #e5e7eb;
  border: 1px solid #3d3d3d;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-row input:focus {
  outline: none;
  border-color: #4f46e5;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.cancel-btn {
  background: #4b5563;
  color: white;
}

.save-btn {
  background: #4f46e5;
  color: white;
}

.cancel-btn:hover,
.save-btn:hover {
  opacity: 0.9;
}
</style>
```

---

## 任务 16: 全局样式

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: 创建 global.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #0f0f0f;
  color: #e5e7eb;
  line-height: 1.5;
}

#app {
  min-height: 100vh;
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #4b5563;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
```

---

## 任务 17: 图标资源

**Files:**
- Create: `public/icons/icon16.png`
- Create: `public/icons/icon48.png`
- Create: `public/icons/icon128.png`

（注：实际项目中需要准备图标文件，可使用 SVG 转 PNG 或占位图标）

---

## 任务 18: 构建和测试

**Files:**
- Modify: `package.json` (添加构建脚本)
- Modify: `vite.config.ts` (优化配置)

- [ ] **Step 1: 优化 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import chromeExtension from 'vite-plugin-chrome-extension'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    chromeExtension()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
```

- [ ] **Step 2: 添加图标（占位 PNG）**

创建 16x16, 48x48, 128x128 的 PNG 图标文件到 `public/icons/` 目录

- [ ] **Step 3: 本地开发测试**

Run: `npm run dev`

Expected: Vite 开发服务器启动，无报错

- [ ] **Step 4: 构建生产版本**

Run: `npm run build`

Expected: dist 目录生成扩展文件，无报错

---

## 自检清单

- [ ] Spec 覆盖：所有设计规格都有对应实现
- [ ] 三个翻译入口：右键菜单、悬浮按钮、选中气泡
- [ ] 两种展示方式：原文下方插入、侧边栏
- [ ] API Key 管理：添加/删除/切换
- [ ] 深色主题 UI
- [ ] OpenAI 兼容 API 对接
- [ ] 多 API Key 切换

---

**Plan saved to:** `docs/superpowers/plans/2026-04-22-ai-translation-plugin-implementation.md`
