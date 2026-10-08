import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { defineConfig } from 'vite'
import { generatedDirectory } from './scripts/prepare-docs.mjs'
import { rewriteDocumentLink } from './scripts/docs-lib.mjs'

export default defineConfig({
  resolve: {
    // Slidev imports from pnpm's package tree while project components import
    // from the hoisted root. Router injection keys must come from one instance.
    dedupe: ['vue-router'],
  },
  slidev: {
    markdown: {
      markdownSetup(md) {
        md.core.ruler.push('docs-links-and-headings', state => {
          const id = state.env.id?.split('?')[0]
          if (!id) return
          const sourcePath = relative(generatedDirectory, resolve(id)).replaceAll('\\', '/')
          if (sourcePath.startsWith('../') || !sourcePath.endsWith('.md')) return
          const manifest = JSON.parse(readFileSync(resolve(generatedDirectory, 'manifest.json'), 'utf8'))
          if (!manifest.documents.some(document => document.path === sourcePath)) return
          const anchors = new Map<string, number>()
          for (let i = 0; i < state.tokens.length; i++) {
            const token = state.tokens[i]
            if (token.type === 'heading_open') {
              const heading = state.tokens[i + 1]
              const text = (heading.children || []).filter(child => child.type !== 'html_inline').map(child => child.content).join('')
              const slug = text.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s+/g, '-') || 'section'
              const count = anchors.get(slug) || 0
              anchors.set(slug, count + 1)
              token.attrSet('id', count ? `${slug}-${count}` : slug)
            }
            for (const child of token.children || []) {
              if (child.type === 'link_open') {
                const href = child.attrGet('href')
                if (href) child.attrSet('href', rewriteDocumentLink(href, sourcePath, manifest))
              }
            }
          }
        })
      },
    },
  },
})
