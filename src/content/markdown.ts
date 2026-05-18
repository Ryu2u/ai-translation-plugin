import { marked } from 'marked'

// Configure marked for safe rendering (no raw HTML pass-through from AI output)
marked.setOptions({
  breaks: true,       // Convert \n to <br>
  gfm: true,          // GitHub Flavored Markdown (tables, strikethrough, etc.)
})

export function renderMarkdown(text: string): string {
  if (!text) return ''
  return marked.parse(text) as string
}
