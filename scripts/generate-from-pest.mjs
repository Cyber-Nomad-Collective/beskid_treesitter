#!/usr/bin/env node
/**
 * Build grammar.js from beskid.pest + hand-maintained tree-sitter adaptations.
 *
 * Pest and tree-sitter use different parsing models (PEG vs GLR), so this does NOT
 * mechanically transpile every rule. It:
 *   1. Reads primitives/keywords from beskid.pest
 *   2. Emits grammar.js from manual templates (expression precedence, conflicts, paths)
 *   3. Writes generated/pest-manifest.json for drift checks
 *
 * Usage:
 *   node scripts/generate-from-pest.mjs [--pest PATH] [--out PATH]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePestFile } from './lib/parse-pest.mjs';
import { manualGrammarSections } from './lib/manual-grammar.mjs';
import { DECLARATION_RULES } from './lib/declaration-rules.mjs';
import { CONFLICTS, RENAME_RULES } from './treesitter-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function parseArgs(argv) {
  let pest = join(ROOT, '../compiler/crates/beskid_analysis/src/beskid.pest');
  let out = join(ROOT, 'grammar.js');
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--pest' && argv[i + 1]) pest = resolve(argv[++i]);
    else if (argv[i] === '--out' && argv[i + 1]) out = resolve(argv[++i]);
  }
  return { pest, out };
}

function formatConflicts() {
  return CONFLICTS.map((group) => {
    const refs = group.map((name) => {
      const renamed = RENAME_RULES[name] ?? name;
      return `$.${renamed}`;
    });
    return `    [${refs.join(', ')}],`;
  }).join('\n');
}

function buildGrammar(pestPath) {
  const content = readFileSync(pestPath, 'utf8');
  const { rules, keywords, primitives } = parsePestFile(pestPath, content);
  const manual = manualGrammarSections();
  const relPest = pestPath.startsWith(ROOT) ? pestPath.slice(ROOT.length + 1) : pestPath;

  const pestRuleNames = [...rules.keys()].sort();

  mkdirSync(join(ROOT, 'generated'), { recursive: true });
  writeFileSync(
    join(ROOT, 'generated/pest-manifest.json'),
    JSON.stringify({
      source: relPest,
      generatedAt: new Date().toISOString(),
      ruleCount: pestRuleNames.length,
      rules: pestRuleNames,
      keywords: keywords.sort(),
      primitives,
    }, null, 2),
  );

  const primitiveChoice = primitives.map((p) => `'${p}'`).join(', ');

  return `/**
 * Beskid tree-sitter grammar — aligned with ${relPest}
 * Regenerate: ./scripts/sync-from-pest.sh
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

${manual.preamble}

export default grammar({
  name: 'beskid',

  extras: $ => [
    /\\s/,
    $.line_comment,
    $.block_comment,
  ],

  word: $ => $.identifier,

  supertypes: $ => [
    $._item,
    $._statement,
    $._expression,
    $._type,
    $._pattern,
    $._field,
  ],

  inline: $ => [
    $._item,
    $._statement,
    $._expression,
    $._type,
    $._pattern,
    $._field,
    $._type_name,
  ],

  conflicts: $ => [
${formatConflicts()}
  ],

  rules: {
${manual.lexicalAndProgram}
${manual.types}
    primitive_type: _ => choice(${primitiveChoice}),
${manual.expressions}
${DECLARATION_RULES}
  },
});

${manual.helpers}
`;
}

function main() {
  const { pest, out } = parseArgs(process.argv);
  const grammar = buildGrammar(pest);
  writeFileSync(out, grammar, 'utf8');
  writeFileSync(join(ROOT, 'grammar.template.js'), grammar, 'utf8');
  console.log(`Wrote ${out}`);
  console.log(`Wrote generated/pest-manifest.json (${parsePestFile(pest, readFileSync(pest, 'utf8')).rules.size} pest rules indexed)`);
}

main();
