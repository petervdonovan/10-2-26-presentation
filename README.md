# Welcome to [Slidev](https://github.com/slidevjs/slidev)!

To start the slide show:

- `npm install`
- `npm run dev`
- visit <http://localhost:3030>

Edit the [slides.md](./slides.md) to see the changes.

Learn more about Slidev at the [documentation](https://sli.dev/).

## Output examples

Visit `/docs/` on the same site for the document index and complete scrollable
output snapshots from `linalg-checker`. Only files named `output.md`,
`*.output.md`, or `*_output.md` are published. Inputs, READMEs, and design docs
are omitted; links to them open their original GitHub source files.
The reading pages use Slidev's Markdown, KaTeX, Mermaid, and code highlighting.

Development, build, and export commands generate the pages from the adjacent
`../../linalg-checker` checkout. Set `LINALG_CHECKER_DIR` to use a different
checkout (relative paths resolve from this project directory). After editing
source documents, run `npm run docs:prepare` to refresh them during development.
Restart the dev server after adding or removing tracked documents.

The Pages workflow fetches `linalg-checker`'s `main` branch at deployment time.
Each page links to the fetched revision. Checker changes appear on the next
presentation deployment, not automatically when the checker changes.

`npm run build -- --base /10-2-26-presentation/` builds both the presentation and
reading pages. It creates real HTML entrypoints for all docs routes, so direct
links and refreshes work on GitHub Pages. `--out` selects another output directory.
The generated source staging directory is ignored by Git. `npm run test:docs`
checks document selection and link rewriting.

After a production build, `npm run test:reader` checks all output pages in
headless Chrome, including math, scrolling, direct URLs, and navigation back
to the presentation. It expects a build with base `/10-2-26-presentation/`;
pass another build directory after `--`, or set `READER_TEST_URL` to test a dev
server instead. Chrome must be installed; `CHROME_BIN` overrides its executable.
