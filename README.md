# tree-sitter-beskid

Tree-sitter grammar for [Beskid](https://github.com/Cyber-Nomad-Collective/beskid), kept in sync with the compiler’s canonical Pest grammar at `compiler/crates/beskid_analysis/src/beskid.pest`.

## Why not a pure Pest → tree-sitter transpiler?

There is no standard converter. Pest (PEG) and tree-sitter (GLR + lexical precedence + `conflicts`) model ambiguity differently. A mechanical translation of every `beskid.pest` rule produces invalid or ambiguous `grammar.js`.

This repo uses a **hybrid pipeline**:

| Input | Output |
|-------|--------|
| `beskid.pest` | keywords, primitives, drift manifest (`generated/pest-manifest.json`) |
| `scripts/lib/manual-grammar.mjs` | expression precedence, types, comments, conflicts |
| `scripts/lib/declaration-rules.mjs` | declarations/statements aligned rule-by-rule with pest |
| `examples/*.bd` | `test/corpus/*.txt` inputs |
| `tree-sitter test -u` | expected syntax trees in corpus `---` sections |

## npm package

Published as [`@beskid/tree-sitter`](https://github.com/orgs/Cyber-Nomad-Collective/packages) on GitHub Packages (see root `.npmrc` scope `@beskid`).

```bash
# Local publish (needs NODE_AUTH_TOKEN with packages:write)
npm run prepublishOnly:verify
npm run publish:github
```

CI publishes on GitHub **Release published** (`.github/workflows/publish.yml`) or via **workflow_dispatch**.

Install in another repo (`.npmrc` must map `@beskid` to `https://npm.pkg.github.com`):

```bash
npm install @beskid/tree-sitter
```

Peer dependency: `tree-sitter` ^0.25.

## One command sync

From `beskid_treesitter/`:

```bash
./scripts/sync-from-pest.sh
```

This runs, in order:

1. `node scripts/generate-from-pest.mjs` — writes `grammar.js`
2. `tree-sitter generate` — emits `src/parser.c`
3. `node scripts/generate-corpus.mjs` — copies `../examples/*.bd` into `test/corpus/`
4. `tree-sitter test -u` — fills/updates expected parse trees in corpus files

Override paths:

```bash
PEST=/path/to/beskid.pest EXAMPLES=/path/to/examples ./scripts/sync-from-pest.sh
```

## Individual steps

```bash
bun install
node scripts/generate-from-pest.mjs
bunx tree-sitter generate
node scripts/generate-corpus.mjs
bunx tree-sitter test -u    # refresh expected trees after grammar changes
bunx tree-sitter test       # verify
bunx tree-sitter parse ../examples/types.bd
node scripts/check-pest-drift.mjs   # compare pest rule names vs grammar.js
```

## Keywords

Tree-sitter 0.25+ keyword extraction uses `word: $ => $.identifier` plus string literals in rules (see [tree-sitter keyword docs](https://tree-sitter.github.io/tree-sitter/creating-parsers/3-writing-the-grammar.html#keywords)). Beskid keywords from `beskid.pest` are emitted as literal tokens in `declaration-rules.mjs` / `manual-grammar.mjs`; they must not use tree-sitter DSL reserved names (`extend` as a grammar keyword is fine as `'extend'` in rules).

## Editing the grammar

1. Change surface syntax in **`beskid.pest` first** (compiler is authoritative).
2. Update the matching section in:
   - `scripts/lib/declaration-rules.mjs` (items, statements, declarations), or
   - `scripts/lib/manual-grammar.mjs` (expressions, types, comments, conflicts)
3. Run `./scripts/sync-from-pest.sh` and review diffs in `grammar.js` + `test/corpus/`.

## Layout

| Path | Role |
|------|------|
| `grammar.js` | Generated output (do not hand-edit; regenerate) |
| `grammar.template.js` | Copy of last generation (reference) |
| `scripts/sync-from-pest.sh` | Full sync entrypoint |
| `scripts/generate-from-pest.mjs` | Assembles `grammar.js` |
| `scripts/generate-corpus.mjs` | Example → corpus inputs |
| `scripts/check-pest-drift.mjs` | Rule-name diff vs pest |
| `generated/pest-manifest.json` | Parsed pest index |
| `queries/*.scm` | Highlighting / tags |
| `test/corpus/*.txt` | Parser tests |
