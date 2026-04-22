import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync, unlinkSync } from 'fs'

// Copy files recursively
function copyDir(src: string, dest: string) {
  if (!existsSync(src)) return
  mkdirSync(dest, { recursive: true })
  const entries = readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = resolve(src, entry.name)
    const destPath = resolve(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

// Transform manifest for build
function transformManifest() {
  const manifestPath = resolve(__dirname, 'src/manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  // Update background script path
  if (manifest.background) {
    if (manifest.background.service_worker) {
      manifest.background.service_worker = manifest.background.service_worker.replace('.ts', '.js')
    }
    if (manifest.background.scripts) {
      manifest.background.scripts = manifest.background.scripts.map((s: string) => s.replace('.ts', '.js'))
    }
  }

  // Update content script paths
  if (manifest.content_scripts) {
    manifest.content_scripts = manifest.content_scripts.map((cs: any) => ({
      ...cs,
      js: cs.js.map((s: string) => s.replace('.ts', '.js'))
    }))
  }

  const destPath = resolve(__dirname, 'dist/manifest.json')
  writeFileSync(destPath, JSON.stringify(manifest, null, 2))
  console.log('Manifest transformed and copied to dist/')
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'chrome-extension-build',
      closeBundle() {
        // Copy icons
        copyDir(resolve(__dirname, 'src/icons'), resolve(__dirname, 'dist/icons'))
        console.log('Icons copied to dist/')

        // Transform and copy manifest
        transformManifest()

        // Rename underscore-prefixed files and update references
        const distDir = resolve(__dirname, 'dist')
        const files = readdirSync(distDir)
        for (const file of files) {
          if (file.startsWith('_')) {
            const newName = 'vue-helper.js'
            const oldPath = resolve(distDir, file)
            const newPath = resolve(distDir, newName)
            // Read content and delete original
            const content = readFileSync(oldPath)
            writeFileSync(newPath, content)
            unlinkSync(oldPath)
            console.log(`Renamed ${file} to ${newName}`)
            // Update references in JS files
            const jsFiles = readdirSync(distDir).filter(f => f.endsWith('.js') && f !== newName)
            for (const jsFile of jsFiles) {
              const jsPath = resolve(distDir, jsFile)
              let jsContent = readFileSync(jsPath, 'utf-8')
              if (jsContent.includes(`./${file}`)) {
                jsContent = jsContent.replace(new RegExp(`\\./${file}`, 'g'), `./${newName}`)
                writeFileSync(jsPath, jsContent)
                console.log(`Updated import in ${jsFile}`)
              }
            }
          }
        }
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html'),
        background: resolve(__dirname, 'src/background/main.ts'),
        content: resolve(__dirname, 'src/content/main.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})