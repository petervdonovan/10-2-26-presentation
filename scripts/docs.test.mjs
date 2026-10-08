import assert from 'node:assert/strict'
import { test } from 'node:test'
import { documentRoute, rewriteDocumentLink, selectPublishedFiles, sourceUrl } from './docs-lib.mjs'

test('publishes outputs and the pipeline overview, excluding other Markdown', () => {
  const files = [
    'README.md', 'docs/overview.md', 'tests/a_input.md', 'tests/a_output.md',
    'tests/b.input.md', 'tests/b.output.md', 'examples/successes.md',
    'examples/successes.output.md', 'tests/unpaired_input.md', 'docs/image.png',
    'output.md', 'tests/output.md', 'docs/notoutput.md', 'tests/output.txt',
    'docs/pipeline-overview.md', 'docs/pipeline_overview.md', 'docs/design-guidelines.md',
  ]
  assert.deepEqual(selectPublishedFiles(files), [
    'docs/pipeline-overview.md', 'docs/pipeline_overview.md',
    'examples/successes.output.md', 'output.md',
    'tests/a_output.md', 'tests/b.output.md', 'tests/output.md',
  ])
})

const manifest = {
  revision: 'abcdef',
  files: ['README.md', 'examples/README.md', 'examples/successes.md', 'examples/successes.output.md', 'src/main.rs'],
  documents: ['examples/successes.output.md'].map(path => ({ path, route: documentRoute(path) })),
}

test('rewrites published Markdown links, including parents, encoded paths and fragments', () => {
  assert.equal(rewriteDocumentLink('successes.output.md#proof', 'examples/README.md', manifest), '/docs/examples/successes.output/#proof')
  assert.equal(rewriteDocumentLink('../README.md', 'examples/README.md', manifest), sourceUrl('README.md', manifest.revision))
  assert.equal(rewriteDocumentLink('successes%2Eoutput.md?view=all#proof', 'examples/README.md', manifest), '/docs/examples/successes.output/?view=all#proof')
})

test('preserves meaning of links to omitted inputs and other source files', () => {
  assert.equal(rewriteDocumentLink('successes.md#proof', 'examples/README.md', manifest), sourceUrl('examples/successes.md', manifest.revision) + '#proof')
  assert.equal(rewriteDocumentLink('../src/main.rs', 'examples/README.md', manifest), sourceUrl('src/main.rs', manifest.revision))
  assert.equal(rewriteDocumentLink('examples/', 'README.md', manifest), sourceUrl('examples', manifest.revision, true))
})

test('leaves external, fragment-only, malformed and missing links intact', () => {
  for (const href of ['https://example.com/docs.md', '//example.com/a', 'mailto:a@example.com', '#proof', 'unknown.md', '%broken'])
    assert.equal(rewriteDocumentLink(href, 'README.md', manifest), href)
})
