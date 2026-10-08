import { posix } from 'node:path'

export const sourceRepository = 'https://github.com/petervdonovan/linalg-checker'

export function selectPublishedFiles(files) {
  return files.filter(path => /(?:^|[/._])output\.md$/.test(path)
    || /^docs\/pipeline[-_]overview\.md$/.test(path)).sort()
}

export function documentRoute(path) {
  return `/docs/${path.slice(0, -3)}/`
}

export function sourceUrl(path, revision, directory = false) {
  return `${sourceRepository}/${directory ? 'tree' : 'blob'}/${revision}/${path.split('/').map(encodeURIComponent).join('/')}`
}

export function rewriteDocumentLink(href, sourcePath, manifest) {
  if (!href || href.startsWith('#') || href.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(href))
    return href
  const [, pathname, suffix = ''] = href.match(/^([^?#]*)(.*)$/)
  let decoded
  try { decoded = decodeURIComponent(pathname) }
  catch { return href }
  const target = posix.normalize(decoded.startsWith('/') ? decoded.slice(1) : posix.join(posix.dirname(sourcePath), decoded))
  const document = manifest.documents.find(document => document.path === target)
  if (document) return document.route + suffix
  if (manifest.files.includes(target)) return sourceUrl(target, manifest.revision) + suffix
  if (manifest.files.some(path => path.startsWith(`${target.replace(/\/$/, '')}/`)))
    return sourceUrl(target.replace(/\/$/, ''), manifest.revision, true) + suffix
  return href
}
