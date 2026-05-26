import { RENAME_RULES } from '../treesitter-config.mjs';

/** @typedef {import('./parse-pest.mjs').PestNode} PestNode */

/**
 * @param {string} pestName
 * @returns {string}
 */
export function toSnakeName(pestName) {
  if (RENAME_RULES[pestName]) return RENAME_RULES[pestName];
  return pestName
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

/**
 * @param {PestNode} node
 * @param {Set<string>} [precedenceOps]
 * @returns {string}
 */
export function transpileNode(node, precedenceOps = new Set()) {
  switch (node.type) {
    case 'seq':
      if (node.items.length === 0) return "seq()";
      if (node.items.length === 1) return transpileNode(node.items[0], precedenceOps);
      return `seq(${node.items.map((n) => transpileNode(n, precedenceOps)).join(', ')})`;
    case 'choice':
      if (node.items.length === 1) return transpileNode(node.items[0], precedenceOps);
      return `choice(${node.items.map((n) => transpileNode(n, precedenceOps)).join(', ')})`;
    case 'repeat':
      return `repeat(${transpileNode(node.inner, precedenceOps)})`;
    case 'repeat1':
      return `repeat1(${transpileNode(node.inner, precedenceOps)})`;
    case 'optional':
      return `optional(${transpileNode(node.inner, precedenceOps)})`;
    case 'neg':
      return transpileNode(node.inner, precedenceOps);
    case 'string':
      if (node.value === '_') return "'_'";
      return JSON.stringify(node.value);
    case 'ref': {
      const mapped = {
        BeskidType: '_type',
        Expression: '_expression',
        Statement: '_statement',
        Pattern: '_pattern',
        Field: '_field',
        Path: '_type_path',
        TypeName: '_type_name',
        InnerItem: '_item',
        BlockExpression: 'block',
        MutKeyword: 'mut',
        LetKeyword: 'let',
        SpawnKeyword: 'spawn',
        Visibility: 'visibility',
        DocRun: 'doc_comment',
        InlineModuleBody: 'item_with_docs',
      };
      const snake = mapped[node.name] ?? toSnakeName(node.name);
      return `$.${snake}`;
    }
    case 'special':
      return `/* pest: ${node.value} */ null`;
    default:
      return 'null';
  }
}

/**
 * @param {{ name: string, silent: boolean, atomic: boolean, bodyAst: PestNode }} rule
 * @returns {string | null}
 */
export function transpileRule(rule) {
  const tsName = toSnakeName(rule.name);
  const body = transpileNode(rule.bodyAst);
  if (body.includes('null')) return null;

  const fnParam = rule.name.match(/Expression$/) ? '$' : '$';
  let rhs = body;

  if (rule.atomic) {
    rhs = `token(${body})`;
  }

  if (rule.silent && !tsName.startsWith('_')) {
    return `_${tsName}: ${fnParam} => ${rhs},`;
  }

  return `${tsName}: ${fnParam} => ${rhs},`;
}
