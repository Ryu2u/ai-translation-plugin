# AI 翻译插件 (AI Translation Plugin)

一个基于 AI 大模型的 Chrome 浏览器翻译扩展，支持多种 AI API 配置，提供流畅的网页翻译体验。

## 功能特性

### 多种翻译方式

- **悬浮按钮** - 页面右下角的固定按钮，点击打开翻译输入面板
- **选中文本气泡** - 选中网页文字后出现的翻译按钮，一键翻译
- **右键菜单** - 支持"翻译整个页面"和"翻译选中内容"
- **输入面板** - 可拖拽、可调整大小的翻译输入框

### 语言支持

支持 10 种目标语言：
中文、英语、日语、韩语、法语、德语、西班牙语、俄语、阿拉伯语、葡萄牙语

### 多 API 配置

- 支持添加多个 AI API 配置
- 可切换激活的 API
- 支持自定义 Base URL 和模型名称
- 兼容 OpenAI 兼容格式的 API（如 MiniMax、Claude 等）

### 用户界面

- 深色主题设计
- 翻译结果一键复制
- 实时加载状态显示
- 错误信息友好提示
- 翻译面板可拖拽位置、调整大小

## 项目结构

```
ai-translation-plugin/
├── src/
│   ├── background/          # Service Worker (后台脚本)
│   │   ├── main.ts          # 消息处理、右键菜单
│   │   ├── api.ts           # AI API 调用
│   │   └── storage.ts       # Chrome Storage 封装
│   ├── content/             # Content Script (内容脚本)
│   │   ├── main.ts          # 入口，挂载各组件
│   │   ├── FloatingButton.vue   # 悬浮按钮
│   │   ├── SelectionBubble.vue  # 选中气泡
│   │   ├── Sidebar.vue      # 翻译结果侧边栏
│   │   ├── InputPanel.vue   # 翻译输入面板
│   │   └── styles/
│   │       └── content.css  # Content Script 样式
│   ├── popup/               # 插件弹窗
│   │   ├── App.vue
│   │   └── main.ts
│   ├── options/             # 设置页面
│   │   ├── App.vue
│   │   ├── main.ts
│   │   └── components/
│   │       └── ApiKeyManager.vue  # API Key 管理组件
│   ├── types/
│   │   └── index.ts         # TypeScript 类型定义
│   └── manifest.json        # Chrome Extension Manifest V3
├── public/                 # 静态资源
│   └── icons/              # 图标
├── dist/                   # 构建输出
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **语言**: TypeScript
- **扩展规范**: Chrome Extension Manifest V3
- **样式**: 原生 CSS (深色主题)

## 开发

### 环境要求

- Node.js 18+
- Chrome 浏览器 (版本 88+)

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

打开 Chrome，进入 `chrome://extensions/`，开启"开发者模式"，点击"加载已解压的扩展程序"，选择项目的 `dist` 目录。

### 构建

```bash
npm run build
```

构建产物输出到 `dist` 目录。

## 使用方法

### 首次配置

1. 点击浏览器工具栏中的插件图标
2. 点击"立即配置"进入设置页面
3. 在"API Key 管理"中添加 AI API 配置
   - **名称**: 给配置起个名字（如 "MiniMax"）
   - **API Key**: 填入你的 API Key
   - **Base URL**: API 地址（如 `https://api.minimaxi.com/v1`）
   - **模型**: 模型名称（如 `MiniMax-M2.7-highspeed`）
4. 保存配置

### 翻译操作

- **翻译输入**: 点击悬浮按钮"译"，在面板中输入文字，选择目标语言，点击翻译
- **快速翻译**: 选中网页文字，点击出现的"译"气泡
- **右键翻译**: 在页面上右键，选择"翻译选中内容"或"翻译整个页面"

## API 兼容性

插件使用 OpenAI Chat Completions API 格式，支持任何兼容的 AI API：

- OpenAI GPT 系列
- MiniMax API
- Claude (通过兼容接口)
- 其他 OpenAI 兼容 API

请求示例：

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    { "role": "system", "content": "You are a professional translator..." },
    { "role": "user", "content": "要翻译的文本" }
  ],
  "temperature": 0.3
}
```

## 存储说明

插件使用 Chrome Storage API 本地存储：

- `api_configs` - API 配置列表
- `active_api_id` - 当前激活的 API ID
- `target_lang` - 上次选择的目标语言

## 权限说明

- `storage` - 保存用户配置
- `activeTab` - 访问当前标签页
- `contextMenus` - 创建右键菜单
- `<all_urls>` - 注入内容脚本到所有网页

## License

MIT
