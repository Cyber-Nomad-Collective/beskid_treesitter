#!/usr/bin/env bash
# Regenerate tree-sitter grammar from beskid.pest, refresh corpus inputs, and update expected parse trees.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PEST="${PEST:-$ROOT/../compiler/crates/beskid_analysis/src/beskid.pest}"
EXAMPLES="${EXAMPLES:-$ROOT/../examples}"

cd "$ROOT"

if [[ ! -f "$PEST" ]]; then
  echo "beskid.pest not found: $PEST" >&2
  echo "Set PEST= to the canonical grammar path." >&2
  exit 1
fi

echo "==> Building grammar.js from $PEST (template + manual tree-sitter rules)"
node "$ROOT/scripts/generate-from-pest.mjs" --pest "$PEST" --out "$ROOT/grammar.js"
node "$ROOT/scripts/check-pest-drift.mjs" "$PEST" "$ROOT/grammar.js" || true

echo "==> tree-sitter generate"
if command -v tree-sitter >/dev/null 2>&1; then
  tree-sitter generate
elif command -v bun >/dev/null 2>&1; then
  bunx tree-sitter generate
else
  npx tree-sitter-cli generate
fi

if [[ -d "$EXAMPLES" ]]; then
  echo "==> Generating corpus inputs from $EXAMPLES"
  node "$ROOT/scripts/generate-corpus.mjs" --examples "$EXAMPLES"
else
  echo "==> Skipping corpus (no examples dir at $EXAMPLES)"
fi

echo "==> Updating expected syntax trees (tree-sitter test -u)"
if command -v tree-sitter >/dev/null 2>&1; then
  tree-sitter test -u
elif command -v bun >/dev/null 2>&1; then
  bunx tree-sitter test -u
else
  npx tree-sitter-cli test -u
fi

echo "Done. Review grammar.js and test/corpus/*.txt, then commit if satisfied."
