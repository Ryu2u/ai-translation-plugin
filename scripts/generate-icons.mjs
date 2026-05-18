import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const svgSource = readFileSync(join(root, 'public', 'icons', 'icon.svg'), 'utf-8')

// Simplified 16px icon - just the gradient rounded square, no text (unreadable at 16px)
const svg16 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>
  </defs>
  <rect x="1" y="1" width="14" height="14" rx="3" fill="url(#bg)"/>
</svg>`

async function generateIcons() {
  await sharp(Buffer.from(svgSource))
    .resize(128, 128)
    .png()
    .toFile(join(root, 'public', 'icons', 'icon128.png'))

  await sharp(Buffer.from(svgSource))
    .resize(48, 48)
    .png()
    .toFile(join(root, 'public', 'icons', 'icon48.png'))

  await sharp(Buffer.from(svg16))
    .resize(16, 16)
    .png()
    .toFile(join(root, 'public', 'icons', 'icon16.png'))

  console.log('Generated public/icons/: icon16.png, icon48.png, icon128.png')

  for (const size of [16, 48, 128]) {
    const src = readFileSync(join(root, 'public', 'icons', `icon${size}.png`))
    writeFileSync(join(root, 'src', 'icons', `icon${size}.png`), src)
  }
  console.log('Copied to src/icons/: icon16.png, icon48.png, icon128.png')
}

generateIcons().catch(err => {
  console.error('Failed to generate icons:', err)
  process.exit(1)
})
