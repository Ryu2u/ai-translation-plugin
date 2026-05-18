import type { MessageType } from '../types'
import { translateText, summarizeText } from './api'
import { getActiveApiConfig, setTargetLang, getAutoTranslate, setAutoTranslate, getAutoTranslatePair, setAutoTranslatePair, setSummaryLang } from './storage'

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
      return await translateText(message.payload.text, message.payload.sourceLang, message.payload.targetLang, message.payload.autoTranslate)

    case 'GET_AUTO_TRANSLATE':
      return await getAutoTranslate()

    case 'SET_AUTO_TRANSLATE':
      await setAutoTranslate(message.payload)
      return { success: true }

    case 'GET_AUTO_TRANSLATE_PAIR':
      return await getAutoTranslatePair()

    case 'SET_AUTO_TRANSLATE_PAIR':
      await setAutoTranslatePair(message.payload)
      return { success: true }

    case 'GET_CONFIG':
      return await getActiveApiConfig()

    case 'SET_TARGET_LANG':
      await setTargetLang(message.payload)
      return { success: true }

    case 'SUMMARIZE_PAGE':
      return await summarizeText(message.payload.text, message.payload.targetLang)

    case 'SET_SUMMARY_LANG':
      await setSummaryLang(message.payload)
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

  chrome.contextMenus.create({
    id: 'summarize-page',
    title: '总结当前页面',
    contexts: ['page']
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
    } else if (info.menuItemId === 'summarize-page') {
      // 总结当前页面
      chrome.tabs.sendMessage(tab.id, { type: 'SUMMARIZE_PAGE' })
    }
  } catch (error) {
    console.error('Failed to send message to tab:', error)
  }
})
