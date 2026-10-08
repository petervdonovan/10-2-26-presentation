import { spawnSync } from 'node:child_process'
import { copyFile, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { prepareDocs, projectRoot } from './prepare-docs.mjs'

const manifest = await prepareDocs()
const args = process.argv.slice(2)
const result = spawnSync(process.execPath, [resolve(projectRoot, 'node_modules/@slidev/cli/bin/slidev.mjs'), 'build', ...args], { cwd: projectRoot, stdio: 'inherit' })
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status || 1)
const outIndex = args.indexOf('--out')
const out = args.find(arg => arg.startsWith('--out='))?.slice(6) || (outIndex >= 0 ? args[outIndex + 1] : 'dist')
if (!out) throw new Error('--out requires a directory')
const outputDirectory = resolve(projectRoot, out)
// This subtree belongs to the reader; clear entrypoints for removed outputs.
await rm(resolve(outputDirectory, 'docs'), { recursive: true, force: true })
for (const route of ['/docs/', ...manifest.documents.map(document => document.route)]) {
  const directory = resolve(outputDirectory, route.slice(1))
  await mkdir(directory, { recursive: true })
  await copyFile(resolve(outputDirectory, 'index.html'), resolve(directory, 'index.html'))
}
console.log(`Created ${manifest.documents.length + 1} GitHub Pages document entrypoints`)
