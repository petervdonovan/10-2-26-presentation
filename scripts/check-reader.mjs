// Browser regression check using the Chrome DevTools Protocol, with no extra
// npm dependencies. Requires Chrome (or CHROME_BIN) and a completed site build.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { generatedDirectory, projectRoot } from './prepare-docs.mjs'

const manifest = JSON.parse(await readFile(join(generatedDirectory, 'manifest.json'), 'utf8'))
const build = resolve(projectRoot, process.argv[2] || 'dist')
const prefix = '/10-2-26-presentation/'
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff' }
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    if (!url.pathname.startsWith(prefix)) { res.writeHead(404); res.end(); return }
    let file = resolve(build, decodeURIComponent(url.pathname.slice(prefix.length)))
    if (file !== build && !file.startsWith(build + '/')) { res.writeHead(404); res.end(); return }
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
      const data = await readFile(file)
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' })
      res.end(data)
    }
    catch {
      res.writeHead(404, { 'Content-Type': 'text/html' })
      res.end(await readFile(join(build, '404.html')))
    }
  }
  catch { res.writeHead(500); res.end() }
})
const profile = await mkdtemp(join(tmpdir(), 'slidev-reader-chrome-'))
let chrome, socket
try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = process.env.READER_TEST_URL || `http://127.0.0.1:${server.address().port}${prefix}`
  chrome = spawn(process.env.CHROME_BIN || 'google-chrome', ['--headless', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
  const endpoint = await new Promise((resolve, reject) => {
    let log = ''
    const timeout = setTimeout(() => reject(new Error('Chrome did not start')), 15000)
    chrome.on('error', error => { clearTimeout(timeout); reject(error) })
    chrome.stderr.on('data', chunk => {
      log += chunk
      const endpoint = log.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1]
      if (endpoint) { clearTimeout(timeout); resolve(endpoint) }
    })
  })
  const debug = new URL(endpoint)
  const targets = await (await fetch(`http://${debug.host}/json/list`)).json()
  socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  const pending = new Map()
  const exceptions = []
  const consoleErrors = new Set()
  let id = 0
  socket.onmessage = event => {
    const message = JSON.parse(event.data)
    if (message.id) {
      const promise = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) promise.reject(new Error(message.error.message))
      else promise.resolve(message.result)
    }
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails)
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error')
      consoleErrors.add(message.params.args.map(arg => arg.value ?? arg.description).join(' '))
  }
  const command = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  const waitFor = async expression => {
    for (let attempt = 0; attempt < 300; attempt++) {
      try { if (await evaluate(`Boolean(${expression})`)) return }
      catch (error) {
        // Vite can reload once while discovering dependencies in development.
        if (!/context.*destroyed|Cannot find.*context|target navigated/i.test(error.message)) throw error
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    throw new Error(`Timed out waiting for ${expression}`)
  }
  await command('Page.enable')
  await command('Runtime.enable')
  await command('Page.navigate', { url: base + 'docs/' })
  await waitFor('document.querySelector(".docs-index li")')
  assert.equal(await evaluate('document.querySelectorAll(".docs-index li").length'), manifest.documents.length)
  for (const document of manifest.documents) {
    const url = base + document.route.slice(1)
    if (!process.env.READER_TEST_URL) assert.equal((await fetch(url)).status, 200)
    await command('Page.navigate', { url })
    await waitFor('document.querySelector(".docs-content h1")')
    const source = await readFile(join(generatedDirectory, document.path), 'utf8')
    assert.equal(await evaluate('document.querySelectorAll(".docs-content h1").length'), [...source.matchAll(/^# /gm)].length, document.path)
    assert(await evaluate('document.querySelectorAll(".docs-content .katex").length > 0'), document.path)
    assert(await evaluate('document.querySelector(".docs-content h1").id.length > 0'), 'Heading anchors missing')
    assert(await evaluate('getComputedStyle(document.querySelector(".docs-reader")).overflowY === "auto"'))
    await evaluate('document.querySelector(".docs-reader").scrollTop = document.querySelector(".docs-reader").scrollHeight')
    assert(await evaluate('document.querySelector(".docs-reader").scrollTop > 0'), document.path)
    const details = await evaluate('document.querySelectorAll(".docs-content details").length')
    if (details) {
      await evaluate('document.querySelector(".docs-content details summary").click()')
      assert(await evaluate('document.querySelector(".docs-content details").open'))
    }
    console.log(`Reader OK: ${document.path}`)
  }
  await evaluate(`document.querySelector(${JSON.stringify('nav a[href$="/1"]')}).click()`)
  await waitFor(`document.querySelector(${JSON.stringify('.slidev-layout a[href$="/docs/"]')})`)
  await evaluate(`document.querySelector(${JSON.stringify('.slidev-layout a[href$="/docs/"]')}).click()`)
  await waitFor('document.querySelector(".docs-index li")')
  assert.equal(exceptions.length, 0, JSON.stringify(exceptions))
  const unexpected = [...consoleErrors].filter(error => !error.startsWith('Failed to patch FloatingVue'))
  assert.deepEqual(unexpected, [])
  if (consoleErrors.size) console.log('Existing FloatingVue tooltip compatibility warning remains; no uncaught browser exceptions.')
  console.log('Index, output documents, math, details, scrolling, direct URLs and presentation navigation passed.')
}
finally {
  socket?.close()
  if (chrome?.pid && chrome.exitCode === null) {
    const exited = new Promise(resolve => chrome.once('exit', resolve))
    chrome.kill()
    await exited
  }
  await new Promise(resolve => server.close(resolve))
  // Chrome's child processes may finish writing after the main process exits.
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })
}
