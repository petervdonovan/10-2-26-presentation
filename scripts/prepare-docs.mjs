import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { documentRoute, selectOutputFiles, sourceUrl } from './docs-lib.mjs'

export const projectRoot = fileURLToPath(new URL('../', import.meta.url))
export const generatedDirectory = resolve(projectRoot, '.generated/linalg-docs')

export async function prepareDocs() {
  const sourceDirectory = resolve(projectRoot, process.env.LINALG_CHECKER_DIR || '../../linalg-checker')
  const git = (...args) => execFileSync('git', ['-C', sourceDirectory, ...args], { encoding: 'utf8' })
  const revision = git('rev-parse', 'HEAD').trim()
  const files = git('ls-files', '-z').split('\0').filter(Boolean)
  const selected = selectOutputFiles(files)
  if (!selected.length) throw new Error(`No tracked output Markdown files found in ${sourceDirectory}`)
  await rm(generatedDirectory, { recursive: true, force: true })
  const documents = []
  // Non-Markdown files are staged for relative image imports; only referenced
  // assets enter the build. Other Markdown is never staged or imported.
  for (const path of files.filter(path => !path.endsWith('.md') || selected.includes(path))) {
    const destination = resolve(generatedDirectory, path)
    await mkdir(dirname(destination), { recursive: true })
    await copyFile(resolve(sourceDirectory, path), destination)
    if (!selected.includes(path)) continue
    const title = `${path.split('/').at(-1).replace(/(?:[._])?output\.md$/, '').replace(/[._-]+/g, ' ').trim() || 'System'} — output examples`
    documents.push({ path, route: documentRoute(path), title, sourceUrl: sourceUrl(path, revision) })
  }
  documents.sort((a, b) => a.path.localeCompare(b.path))
  const manifest = { revision, files, documents }
  await writeFile(resolve(generatedDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  await writeFile(resolve(generatedDirectory, 'loaders.ts'), `export default {\n${documents.map(document => `  ${JSON.stringify(document.path)}: () => import(${JSON.stringify('./' + document.path)}),`).join('\n')}\n}\n`)
  console.log(`Prepared ${documents.length} documents from linalg-checker ${revision.slice(0, 8)}`)
  return manifest
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await prepareDocs()
}
