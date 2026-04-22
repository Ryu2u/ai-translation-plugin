import type { MessageType } from '../types'
import { translateText } from './api'
import { getActiveApiConfig, setTargetLang } from './storage'

// 消息处理
chrome.runtime.onMessage.addListener(
  (message: MessageType, _sender, sendResponse) => {
    console.log('[AI-Translate bg] onMessage received:', message?.type, message)
    handleMessage(message)
      .then(result => {
        console.log('[AI-Translate bg] handleMessage resolved:', result)
        sendResponse(result)
      })
      .catch(err => {
        console.error('[AI-Translate bg] handleMessage rejected:', err)
        sendResponse({ error: err.message })
      })
    return true // 异步响应
  }
)

async function handleMessage(message: MessageType): Promise<any> {
  console.log('[AI-Translate bg] handleMessage dispatching type:', message.type)
  switch (message.type) {
    case 'TRANSLATE':
      return await translateText(message.payload.text, message.payload.sourceLang, message.payload.targetLang)

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

  try {
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
  } catch (error) {
    console.error('Failed to send message to tab:', error)
  }
})
