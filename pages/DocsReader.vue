<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import manifest from '../.generated/linalg-docs/manifest.json'
import loaders from '../.generated/linalg-docs/loaders'

const props = defineProps<{ sourcePath?: string }>()
const route = useRoute()
const reader = ref<HTMLElement>()
const content = shallowRef()
const error = ref('')
const loading = ref(false)
const document = computed(() => manifest.documents.find(document => document.path === props.sourcePath))

async function scrollToLocation() {
  await nextTick()
  if (!reader.value) return
  if (!route.hash) {
    reader.value.scrollTop = 0
    return
  }
  let id = route.hash.slice(1)
  try { id = decodeURIComponent(id) } catch {}
  const target = Array.from(reader.value.querySelectorAll<HTMLElement>('[id]')).find(element => element.id === id)
  target?.scrollIntoView({ block: 'start' })
}

watch(() => props.sourcePath, async (path, _, onCleanup) => {
  let cancelled = false
  onCleanup(() => { cancelled = true })
  content.value = undefined
  error.value = ''
  loading.value = !!document.value
  const loader = path && loaders[path as keyof typeof loaders]
  if (loader) {
    try {
      const module = await loader()
      if (cancelled) return
      content.value = module.default
    }
    catch {
      if (cancelled) return
      error.value = 'This document could not be loaded. Reload the page to try again.'
    }
  }
  if (cancelled) return
  loading.value = false
  await scrollToLocation()
}, { immediate: true })
watch(() => route.hash, scrollToLocation)
</script>

<template>
  <div ref="reader" class="docs-reader">
    <div class="docs-page">
      <nav aria-label="Documentation navigation">
        <RouterLink to="/docs/">Document index</RouterLink>
        <RouterLink to="/1">Presentation</RouterLink>
        <a :href="`https://github.com/petervdonovan/linalg-checker/tree/${manifest.revision}`">linalg-checker source</a>
      </nav>
      <header>
        <h1>{{ sourcePath ? (document?.title || 'Document not found') : 'linalg-checker output examples' }}</h1>
        <p class="docs-meta">
          Snapshot <a :href="`https://github.com/petervdonovan/linalg-checker/commit/${manifest.revision}`"><code>{{ manifest.revision.slice(0, 8) }}</code></a>
          <template v-if="document"> · <a :href="document.sourceUrl">{{ document.path }}</a></template>
        </p>
      </header>
      <template v-if="!sourcePath">
        <p>Read the complete diagnostic outputs. These examples show both the system’s capabilities and its current limitations.</p>
        <section>
          <h2>Output examples</h2>
          <ul class="docs-index">
            <li v-for="entry in manifest.documents" :key="entry.path">
              <RouterLink :to="entry.route">{{ entry.title }}</RouterLink>
              <code>{{ entry.path }}</code>
            </li>
          </ul>
        </section>
      </template>
      <p v-else-if="!document">This document is not part of the published snapshot. <RouterLink to="/docs/">Browse the available documents.</RouterLink></p>
      <p v-else-if="loading" role="status">Loading document…</p>
      <p v-else-if="error" role="alert">{{ error }}</p>
      <article v-else class="docs-content"><component :is="content" /></article>
    </div>
  </div>
</template>

<style>
.docs-reader {
  height: 100vh;
  height: 100dvh;
  overflow: auto;
  color: #20252c;
  background: #fff;
  font-weight: 400;
  line-height: 1.65;
  font-size: 16px;
}
.docs-page { max-width: 80ch; margin: 0 auto; padding: 1.5rem; }
.docs-reader nav { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; margin-bottom: 2rem; }
.docs-reader a { color: #165fba; text-decoration: underline; text-underline-offset: 0.15em; }
.docs-reader a:focus-visible, .docs-reader summary:focus-visible { outline: 2px solid #165fba; outline-offset: 3px; }
.docs-reader h1 { font-size: 1.9rem; }
.docs-reader h2 { font-size: 1.5rem; }
.docs-reader h3 { font-size: 1.2rem; }
.docs-reader h1, .docs-reader h2, .docs-reader h3, .docs-reader h4 { font-weight: 700; line-height: 1.3; margin: 1.8rem 0 0.8rem; scroll-margin-top: 1rem; }
.docs-reader p, .docs-reader ul, .docs-reader ol { margin: 0.85rem 0; }
.docs-reader ul, .docs-reader ol { padding-left: 1.6rem; }
.docs-reader ul { list-style: disc; }
.docs-reader ol { list-style: decimal; }
.docs-reader strong, .docs-reader b { font-weight: 700; }
.docs-reader code { font-size: 0.88em; }
.docs-reader pre { overflow-x: auto; padding: 1rem; margin: 1rem 0; border-radius: 0.4rem; background: #f5f7fa; }
.docs-reader details { padding: 0.5rem 0.85rem; margin: 0.75rem 0; border: 1px solid #d9e0e9; border-radius: 0.4rem; }
.docs-reader summary { cursor: pointer; display: list-item; }
.docs-reader .katex-display { overflow-x: auto; overflow-y: hidden; padding-block: 0.25rem; }
.docs-reader .mermaid { max-width: 100%; overflow-x: auto; margin: 1.5rem 0; }
.docs-reader table { display: block; overflow-x: auto; border-collapse: collapse; margin: 1rem 0; }
.docs-reader th, .docs-reader td { border: 1px solid #d9e0e9; padding: 0.4rem 0.65rem; }
.docs-reader th { font-weight: 700; }
.docs-reader img { max-width: 100%; }
.docs-meta { color: #596579; font-size: 0.9rem; }
.docs-index li { margin: 0.7rem 0; }
.docs-index code { display: block; color: #596579; overflow-wrap: anywhere; }
</style>
