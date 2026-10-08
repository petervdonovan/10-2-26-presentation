import { defineRoutesSetup } from '@slidev/types'
import manifest from '../.generated/linalg-docs/manifest.json'

export default defineRoutesSetup(routes => [
  ...routes,
  { path: '/docs/', component: () => import('../pages/DocsReader.vue') },
  ...manifest.documents.map(document => ({
    path: document.route,
    component: () => import('../pages/DocsReader.vue'),
    props: { sourcePath: document.path },
  })),
  {
    path: '/docs/:pathMatch(.*)*',
    component: () => import('../pages/DocsReader.vue'),
    props: { sourcePath: '__missing__' },
  },
])
